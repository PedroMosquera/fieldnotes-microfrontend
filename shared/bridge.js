import { CHANNEL, envelope, capabilities } from './protocol.js';
import { applyTokens } from './tokens.js';
import { acceptRevision } from './shop.js';
import { retryDelay } from './faults.js';
const source = location.pathname.split('/')[2];
const listeners = new Set();
const pending = new Map();
let revision = -1;
let initialized = false;
let duplicateNext = false;
function post(message) { parent.postMessage(message, location.origin); }
export function listen(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
export function send(type, payload = {}) {
  const message = envelope(source, type, payload);
  post(message);
  if (duplicateNext && capabilities[source]?.includes(type)) {
    post(message);
    duplicateNext = false;
  }
  if (capabilities[source]?.includes(type)) {
    const entry = { message, attempt: 0, timer: null };
    pending.set(message.messageId, entry);
    scheduleRetry(entry);
  }
  return message.messageId;
}
export function rendered() { send('render'); }
export function bootstrap() {
  if (initialized) return;
  initialized = true;
  window.addEventListener('error', event => send('error', { message: String(event.message).slice(0, 500) }));
  window.addEventListener('unhandledrejection', () => send('error', { message: 'Unhandled promise rejection' }));
  window.addEventListener('message', receive);
  const observer = new ResizeObserver(() => send('resize', { height: document.body.scrollHeight }));
  observer.observe(document.body);
  const heartbeat = setInterval(() => send('heartbeat'), 2000);
  window.addEventListener('pagehide', () => {
    clearInterval(heartbeat);
    observer.disconnect();
    pending.forEach(entry => clearTimeout(entry.timer));
    pending.clear();
    window.removeEventListener('message', receive);
    listeners.clear();
  }, { once: true });
}
function receive(event) {
  const data = event.data;
  if (event.origin !== location.origin || event.source !== parent || data?.channel !== CHANNEL || data.version !== 2) return;
  if (data.type === 'ack') {
    const entry = pending.get(data.replyTo);
    if (entry) clearTimeout(entry.timer);
    pending.delete(data.replyTo);
    if (data.error) listeners.forEach(callback => callback({ type: 'notice', message: data.error }));
    return;
  }
  if (data.type === 'duplicate-command') { duplicateNext = true; return; }
  if (data.type === 'contract-probe') {
    const probe = envelope(source, 'shipping', { amount: 500 });
    if (data.kind === 'protocol') probe.version = 999;
    post(probe);
    return;
  }
  if (data.type === 'crash') {
    setTimeout(() => { throw new Error('Simulated microfrontend failure'); });
    return;
  }
  if (data.type === 'state') {
    if (!acceptRevision(revision, data.revision)) {
      send('snapshot-ignored', { revision: data.revision });
      return;
    }
    revision = data.revision;
    if (data.tokens) applyTokens(document.documentElement, data.tokens);
    listeners.forEach(callback => callback(data));
    send('snapshot-applied', { revision });
    return;
  }
  listeners.forEach(callback => callback(data));
}

function scheduleRetry(entry) {
  entry.timer = setTimeout(() => {
    if (!pending.has(entry.message.messageId)) return;
    if (entry.attempt >= 2) {
      pending.delete(entry.message.messageId);
      listeners.forEach(callback => callback({ type: 'notice', message: 'Command acknowledgement timed out. The action may already have applied; inspect the shell state before retrying.' }));
      return;
    }
    entry.attempt++;
    post(entry.message);
    scheduleRetry(entry);
  }, retryDelay(entry.attempt));
}
