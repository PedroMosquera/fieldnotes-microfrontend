const channel = 'fieldnotes-v1';
export function send(type, payload = {}) {
  window.parent.postMessage({ channel, type, ...payload }, window.location.origin);
}
export function listen(callback) {
  const handler = event => {
    if (event.origin !== location.origin || event.source !== parent || event.data?.channel !== channel) return;
    if (event.data.type === 'crash') {
      setTimeout(() => { throw new Error('Simulated microfrontend failure'); });
    } else callback(event.data);
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}
export function bootstrap() {
  window.addEventListener('error', event => send('error', { message: event.message }));
  window.addEventListener('unhandledrejection', () => send('error', { message: 'Unhandled promise rejection' }));
  const observer = new ResizeObserver(() => send('resize', { height: document.body.scrollHeight }));
  observer.observe(document.body);
}
export function rendered() { send('render'); }
