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
