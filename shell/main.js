import '../shared/style.css';
import './shell.css';
import { reduceCart, validMessage } from '../shared/state.js';

const definitions = { react: 'Product catalog', vue: 'Shopping basket', svelte: 'Delivery options', qwik: 'Product recommendation' };
const apps = {};
let cart = {};
let shipping = 0;
const activity = document.querySelector('#activity');
function log(name, description) {
  const item = document.createElement('li');
  const time = document.createElement('time');
  time.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
  const message = document.createElement('span');
  message.textContent = `${name}: ${description}`;
  item.append(time, message);
  activity.prepend(item);
  while (activity.children.length > 40) activity.lastElementChild.remove();
}
function send(app, type, payload = {}) {
  app.frame?.contentWindow?.postMessage({ channel: 'fieldnotes-v1', type, ...payload }, location.origin);
}
function sync() {
  for (const name of ['vue', 'svelte']) if (apps[name]?.status === 'healthy') send(apps[name], 'state', { cart, shipping });
}
function updateStats() {
  const values = Object.values(apps);
  document.querySelector('#healthy').textContent = `${values.filter(app => app.status === 'healthy').length}/4`;
  document.querySelector('#total-renders').textContent = values.reduce((sum, app) => sum + app.renders, 0);
  for (const app of values) {
    app.control.querySelector('.app-status').textContent = app.status;
    app.control.querySelector('.app-status').dataset.status = app.status;
    app.control.querySelector('.count').textContent = app.renders;
    app.control.querySelectorAll('[data-action="crash"], [data-action="refresh"]').forEach(button => { button.disabled = app.status !== 'healthy'; });
  }
}
function fail(name, reason) {
  const app = apps[name];
  if (app.status === 'failed') return;
  clearTimeout(app.timer);
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
  log(name, reason);
  updateStats();
}
function mount(name) {
  const app = apps[name];
  clearTimeout(app.timer);
  const frame = document.createElement('iframe');
  frame.title = definitions[name];
  frame.src = `/apps/${name}/index.html`;
  frame.style.height = name === 'react' ? '700px' : '260px';
  app.frame = frame;
  app.status = 'loading';
  app.renders = 0;
  app.mount.replaceChildren(frame);
  app.timer = setTimeout(() => fail(name, 'startup timed out after 15 seconds'), 15000);
  log(name, 'starting');
  updateStats();
}

for (const [name, description] of Object.entries(definitions)) {
  const control = document.createElement('section');
  control.className = 'app-control';
  control.dataset.control = name;
  control.innerHTML = `<div class="control-heading"><strong>${name[0].toUpperCase() + name.slice(1)}</strong><span class="app-status">loading</span></div><p>${description}</p><div class="render-row"><span>Render signals</span><strong class="count">0</strong></div><div class="control-actions"><button data-action="refresh">Render</button><button data-action="crash">Fail app</button><button data-action="restart">Restart</button></div>`;
  document.querySelector('#app-controls').append(control);
  apps[name] = { control, mount: document.querySelector(`[data-app="${name}"] .mount`), status: 'loading', renders: 0 };
  control.addEventListener('click', event => {
    const action = event.target.dataset.action;
    if (action === 'restart') mount(name);
    if (action === 'refresh') send(apps[name], 'refresh');
    if (action === 'crash') {
      send(apps[name], 'crash');
      log(name, 'injecting an uncaught error');
    }
  });
}
window.addEventListener('message', event => {
  const entry = Object.entries(apps).find(([, app]) => validMessage(event, app.frame?.contentWindow, location.origin));
  if (!entry) return;
  const [name, app] = entry;
  if (app.status === 'failed') return;
  const message = event.data;
  if (message.type === 'ready') {
    clearTimeout(app.timer);
    app.status = 'healthy';
    log(name, 'ready');
    sync();
  }
  if (message.type === 'render') { app.renders++; log(name, 'component updated'); }
  if (message.type === 'resize' && Number.isFinite(message.height)) app.frame.style.height = `${Math.max(80, Math.min(message.height + 8, 3000))}px`;
  if (message.type === 'error') { fail(name, String(message.message || 'runtime error').slice(0, 160)); return; }
  if (['add', 'remove'].includes(message.type) && ['react', 'vue', 'qwik'].includes(name)) {
    cart = reduceCart(cart, message);
    log(name, `${message.type} basket item`);
    sync();
  }
  if (message.type === 'shipping' && name === 'svelte' && [0, 500].includes(message.amount)) { shipping = message.amount; sync(); }
  if (message.type === 'checkout' && name === 'vue' && Object.keys(cart).length) {
    cart = reduceCart(cart, { type: 'clear' });
    sync();
    send(app, 'ordered');
    log(name, 'demo order placed');
  }
  updateStats();
});
Object.keys(apps).forEach(mount);
document.querySelector('#restart-all').onclick = () => Object.keys(apps).forEach(mount);
document.querySelector('#clear-log').onclick = () => activity.replaceChildren();
document.querySelector('#toggle-admin').onclick = event => {
  const admin = document.querySelector('#admin');
  admin.hidden = !admin.hidden;
  document.querySelector('.page-layout').classList.toggle('admin-hidden', admin.hidden);
  event.currentTarget.setAttribute('aria-expanded', String(!admin.hidden));
  event.currentTarget.textContent = admin.hidden ? 'Show admin panel' : 'Hide admin panel';
};
