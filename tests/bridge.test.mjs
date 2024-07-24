import test from 'node:test';
import assert from 'node:assert/strict';

test('bridge correlates acknowledgements, rejects stale snapshots and cleans up timers', async () => {
  const names = ['location', 'parent', 'window', 'document', 'ResizeObserver', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'];
  const originals = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const handlers = new Map();
  const timers = new Map();
  const sent = [];
  const received = [];
  let timerId = 0;
  let disconnected = false;
  const parent = { postMessage: message => sent.push(message) };
  const origin = 'http://127.0.0.1:5100';
  const stubs = {
    location: { pathname: '/apps/react/index.html', origin }, parent,
    window: {
      addEventListener(type, callback) { handlers.set(type, callback); },
      removeEventListener(type, callback) { if (handlers.get(type) === callback) handlers.delete(type); },
    },
    document: { body: {}, documentElement: { style: { setProperty() {} }, dataset: {} } },
    ResizeObserver: class { observe() {} disconnect() { disconnected = true; } },
    setTimeout: callback => {
      const id = ++timerId;
      timers.set(id, () => { timers.delete(id); callback(); });
      return id;
    },
    clearTimeout: id => timers.delete(id),
    setInterval: callback => { timers.set(++timerId, callback); return timerId; },
    clearInterval: id => timers.delete(id),
  };
  try {
    Object.entries(stubs).forEach(([name, value]) => Object.defineProperty(globalThis, name, { value, configurable: true, writable: true }));
    const bridge = await import('../shared/bridge.js');
    bridge.bootstrap();
    bridge.listen(message => received.push(message));
    const deliver = data => handlers.get('message')({ origin, source: parent, data: { channel: 'fieldnotes-v2', version: 2, ...data } });
    const id = bridge.send('add', { id: 'cup' });
    deliver({ type: 'ack', replyTo: 'unrelated-command', error: 'Old command failed' });
    assert.equal(received.length, 0, 'An unrelated acknowledgement must not surface a failure notice');
    const retry = [...timers.values()].at(-1);
    retry();
    assert.equal(sent.filter(message => message.messageId === id).length, 2);
    deliver({ type: 'ack', replyTo: id, error: 'This command failed' });
    assert.equal(received.at(-1).message, 'This command failed');
    deliver({ type: 'state', revision: 2, cart: { cup: 2 } });
    deliver({ type: 'state', revision: 1, cart: { cup: 1 } });
    assert.deepEqual(received.filter(message => message.type === 'state').map(message => message.revision), [2]);
    assert.equal(sent.at(-1).type, 'snapshot-ignored');
    handlers.get('message')({ origin: 'http://wrong', source: parent, data: { channel: 'fieldnotes-v2', version: 2, type: 'state', revision: 3 } });
    assert.equal(received.filter(message => message.type === 'state').length, 1);
    bridge.send('add', { id: 'pen' });
    handlers.get('pagehide')();
    assert.equal(disconnected, true);
    assert.equal(handlers.has('message'), false);
    assert.equal(timers.size, 0, 'Unmounting must cancel all remaining retries and heartbeats');
  } finally {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
});
