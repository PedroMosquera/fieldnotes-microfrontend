import '../shared/style.css';
import './shell.css';
import { APPS, CHANNEL, authorized, commandKey, createDeduper, trustedSender, projectState, subscriptions } from '../shared/protocol.js';
import { createStore, reduceShop, initialState, changedSlices, placeOrder, reorder } from '../shared/shop.js';
import { loadState, saveState, clearSavedState } from '../shared/persistence.js';
import { applyTokens } from '../shared/tokens.js';
import { defaultFault, configureFault, deliveryPlan, sameGeneration, heartbeatStatus } from '../shared/faults.js';
import { createTrace, readyDuration } from '../shared/telemetry.js';

const definitions = { react: 'Product catalog', vue: 'Shopping basket', svelte: 'Delivery options', qwik: 'Product recommendation' };
const apps = {};
const trace = createTrace();
const deduper = createDeduper();
let saved;
try { saved = loadState(localStorage); } catch { saved = { state: initialState(), warning: 'Browser storage is unavailable.' }; }
const store = createStore(saved.state);
let lastState = store.get();
let lab;
let sequence = 0;
const activity = document.querySelector('#activity');
function log(source, type, detail = '', extra = {}) {
  trace.add({ source, type, detail, ...extra });
  const item = document.createElement('li');
  const time = document.createElement('time');
  time.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
  const message = document.createElement('span');
  message.textContent = `${source}: ${detail || type}`;
  item.append(time, message);
  activity.prepend(item);
  while (activity.children.length > 40) activity.lastElementChild.remove();
  lab?.schedule();
}
function send(app, type, payload = {}) {
  app.frame?.contentWindow?.postMessage({ ...payload, channel: CHANNEL, version: 2, type, messageId: `shell-${++sequence}` }, location.origin);
}
function deliver(name) {
  const app = apps[name];
  if (app.status !== 'healthy') return;
  const state = store.get();
  app.targetRevision = state.revision;
  const generation = app.generation;
  for (const delivery of deliveryPlan(app.fault, projectState(state, name))) {
    const timer = setTimeout(() => {
      app.timers.delete(timer);
      if (!sameGeneration(generation, app.generation) || app.status !== 'healthy') return;
      send(app, 'state', delivery.message);
      log('shell', 'state', `revision ${delivery.message.revision} to ${name}`, { target: name, revision: delivery.message.revision });
    }, delivery.delay);
    app.timers.add(timer);
  }
  lab?.schedule();
}
function updateStats() {
  const values = Object.values(apps);
  document.querySelector('#healthy').textContent = `${values.filter(app => app.status === 'healthy').length}/4`;
  document.querySelector('#total-renders').textContent = values.reduce((sum, app) => sum + app.renders, 0);
  for (const app of values) {
    app.control.querySelector('.app-status').textContent = app.status === 'healthy' ? '' : app.status;
    app.control.querySelector('.app-status').dataset.status = app.status;
    app.control.querySelector('.count').textContent = app.renders;
    app.control.querySelectorAll('[data-action="crash"], [data-action="refresh"], [data-action="duplicate"]').forEach(button => { button.disabled = app.status !== 'healthy'; });
  }
  lab?.schedule();
}
function fail(name, reason) {
  const app = apps[name];
  clearTimeout(app.renderTimer);
  app.mount.parentElement.classList.remove('is-rendering');
  if (app.status === 'failed') return;
  clearTimeout(app.timer);
  app.timers.forEach(clearTimeout);
  app.timers.clear();
  app.status = 'failed';
  app.frame.remove();
  const fallback = document.createElement('div');
  fallback.className = 'failure';
  const title = document.createElement('h3');
  title.textContent = `${name[0].toUpperCase() + name.slice(1)} is unavailable`;
  const detail = document.createElement('p');
  detail.textContent = 'This section stopped. The other parts of the shop are still available.';
  const retry = document.createElement('button');
  retry.textContent = 'Restart section';
  retry.onclick = () => mount(name);
  fallback.append(title, detail, retry);
  app.mount.replaceChildren(fallback);
  log(name, 'error', reason);
  updateStats();
}
function mount(name) {
  const app = apps[name];
  clearTimeout(app.renderTimer);
  app.mount.parentElement.classList.remove('is-rendering');
  clearTimeout(app.timer);
  app.timers.forEach(clearTimeout);
  app.timers.clear();
  app.generation++;
  app.started = performance.now();
  app.lastSeen = Date.now();
  app.appliedRevision = -1;
  app.targetRevision = store.get().revision;
  const frame = document.createElement('iframe');
  frame.title = definitions[name];
  frame.src = `/apps/${name}/index.html`;
  frame.style.height = name === 'react' ? '700px' : '300px';
  app.frame = frame;
  app.status = 'loading';
  app.renders = 0;
  app.mount.replaceChildren(frame);
  app.timer = setTimeout(() => fail(name, 'startup timed out after 15 seconds'), 15000);
  log(name, 'mount', 'starting');
  updateStats();
}
function setFault(name, mode) {
  const app = apps[name];
  app.fault = configureFault(app.fault, mode);
  app.timers.forEach(clearTimeout);
  app.timers.clear();
  app.control.querySelector('select').value = app.fault.mode;
  log(name, 'fault', `state transport: ${app.fault.mode}`);
  if (mode === 'normal') deliver(name);
  lab?.schedule();
}
for (const [name, description] of Object.entries(definitions)) {
  const control = document.createElement('section');
  control.className = 'app-control';
  control.dataset.control = name;
  control.innerHTML = `<div class="control-heading"><strong>${name[0].toUpperCase() + name.slice(1)}</strong><span class="app-status">loading</span></div><p>${description}</p><div class="render-row"><span>Render signals</span><strong class="count">0</strong></div><div class="control-actions"><button data-action="refresh">Render</button><button data-action="crash">Fail app</button><button data-action="restart">Restart</button></div><details><summary>Communication faults</summary><label>State delivery<select aria-label="${name} state delivery"><option value="normal">Normal</option><option value="delay">Delay 1.2 seconds</option><option value="drop">Drop snapshots</option><option value="duplicate">Duplicate snapshots</option><option value="reorder">Deliver out of order</option><option value="pause">Pause subscription</option><option value="ack-drop">Drop command acknowledgements</option></select></label><button data-action="duplicate">Duplicate next command</button><button data-action="sync">Resync state</button></details>`;
  document.querySelector('#app-controls').append(control);
  apps[name] = { control, mount: document.querySelector(`[data-app="${name}"] .mount`), status: 'loading', renders: 0, generation: 0, timers: new Set(), fault: defaultFault(), appliedRevision: -1, targetRevision: 0, lastSeen: Date.now() };
  control.querySelector('select').onchange = event => setFault(name, event.target.value);
  control.addEventListener('click', event => {
    const action = event.target.dataset.action;
    if (action === 'restart') mount(name);
    if (action === 'refresh') send(apps[name], 'refresh');
    if (action === 'sync') deliver(name);
    if (action === 'duplicate') send(apps[name], 'duplicate-command');
    if (action === 'crash') { send(apps[name], 'crash'); log(name, 'inject-error', 'injecting an uncaught error'); }
  });
}
function acknowledge(app, message, error = '') {
  if (app.fault.mode !== 'ack-drop') send(app, 'ack', { replyTo: message.messageId, error });
}
window.addEventListener('message', event => {
  const entry = Object.entries(apps).find(([, app]) => event.source === app.frame?.contentWindow);
  if (!entry) return;
  const [name, app] = entry;
  if (app.status === 'failed') return;
  if (!trustedSender(event, app.frame.contentWindow, location.origin, name) || !authorized(name, event.data.type)) {
    log(name, 'rejected', 'origin, schema, version or capability mismatch');
    return;
  }
  const message = event.data;
  app.lastSeen = Date.now();
  if (message.type === 'ready') {
    clearTimeout(app.timer);
    app.status = 'healthy';
    app.readyMs = readyDuration(app.started, performance.now());
    log(name, 'ready', `ready in ${app.readyMs} ms`);
    deliver(name);
  }
  if (message.type === 'heartbeat') return;
  if (message.type === 'request-state') deliver(name);
  if (message.type === 'render') {
    app.renders++;
    const section = app.mount.parentElement;
    clearTimeout(app.renderTimer);
    section.classList.add('is-rendering');
    app.renderTimer = setTimeout(() => section.classList.remove('is-rendering'), 280);
    log(name, 'render', 'component updated');
  }
  if (message.type === 'resize') app.frame.style.height = `${Math.max(80, Math.min(message.height + 8, 3000))}px`;
  if (message.type === 'error') { fail(name, message.message); return; }
  if (message.type === 'snapshot-applied') { app.appliedRevision = message.revision; log(name, message.type, `revision ${message.revision}`, { revision: message.revision }); }
  if (message.type === 'snapshot-ignored') log(name, message.type, `ignored revision ${message.revision}`, { revision: message.revision });
  if (['add', 'remove', 'clear', 'favorite', 'compare', 'view', 'shipping', 'theme', 'density', 'coupon', 'checkout', 'reorder'].includes(message.type)) {
    if (!deduper.accept(commandKey(message))) { acknowledge(app, message); log(name, 'duplicate', 'command already handled', { messageId: message.messageId }); return; }
    const state = store.get();
    if (message.type === 'coupon' && !['', 'STUDIO10'].includes(message.code.trim().toUpperCase())) {
      acknowledge(app, message, 'Unknown code. Try STUDIO10.');
      return;
    }
    const next = message.type === 'checkout' ? placeOrder(state, crypto.randomUUID(), Date.now())
      : message.type === 'reorder' ? reorder(state, message.id) : reduceShop(state, message);
    log(name, message.type, `${message.type} command`, { messageId: message.messageId, payload: message });
    store.update(next);
    acknowledge(app, message);
    if (message.type === 'checkout' && next !== state) send(app, 'ordered');
  }
  updateStats();
});
store.subscribe(state => {
  const changed = changedSlices(lastState, state);
  lastState = state;
  applyTokens(document.documentElement, state.tokens);
  let warning;
  try { warning = saveState(localStorage, state); } catch { warning = 'Browser storage is unavailable.'; }
  if (warning) log('shell', 'storage-warning', warning);
  for (const name of APPS) if (subscriptions[name].some(slice => changed.includes(slice))) deliver(name);
  lab?.schedule();
});
applyTokens(document.documentElement, store.get().tokens);
Object.keys(apps).forEach(mount);
if (saved.warning) log('shell', 'storage-warning', saved.warning);
setInterval(() => {
  Object.values(apps).forEach(app => { app.heartbeat = heartbeatStatus(app.lastSeen, Date.now()); });
  lab?.schedule();
}, 2000);
document.querySelector('#restart-all').onclick = () => Object.keys(apps).forEach(mount);
document.querySelector('#clear-log').onclick = () => { activity.replaceChildren(); trace.clear(); lab?.schedule(); };
document.querySelector('#toggle-admin').onclick = event => {
  const admin = document.querySelector('#admin');
  admin.hidden = !admin.hidden;
  document.querySelector('.page-layout').classList.toggle('admin-hidden', admin.hidden);
  event.currentTarget.setAttribute('aria-expanded', String(!admin.hidden));
  event.currentTarget.textContent = admin.hidden ? 'Show admin panel' : 'Hide admin panel';
};
