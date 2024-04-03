import test from 'node:test';
import assert from 'node:assert/strict';
import { reduceCart, cartTotal, validMessage } from '../shared/state.js';

test('adding increments without mutating existing state', () => {
  const cart = { notebook: 1 };
  assert.deepEqual(reduceCart(cart, { type: 'add', id: 'notebook' }), { notebook: 2 });
  assert.deepEqual(cart, { notebook: 1 });
});
test('quantity is capped at 99', () => {
  assert.deepEqual(reduceCart({ cup: 99 }, { type: 'add', id: 'cup' }), { cup: 99 });
});
test('removing the last item deletes its entry', () => {
  assert.deepEqual(reduceCart({ cup: 1 }, { type: 'remove', id: 'cup' }), {});
  assert.deepEqual(reduceCart({ cup: 2 }, { type: 'remove', id: 'cup' }), { cup: 1 });
});
test('checkout clears the basket', () => {
  assert.deepEqual(reduceCart({ cup: 2 }, { type: 'clear' }), {});
});
test('unknown products and actions cannot change the basket', () => {
  assert.deepEqual(reduceCart({}, { type: 'add', id: '__proto__' }), {});
  assert.deepEqual(reduceCart({}, { type: 'unknown', id: 'cup' }), {});
});
test('totals use integer cents', () => {
  assert.equal(cartTotal({ notebook: 2, cup: 1 }), 6000);
  assert.equal(cartTotal({}), 0);
});
test('messages require the expected origin, frame and protocol', () => {
  const frame = {};
  const origin = 'http://127.0.0.1:5100';
  const event = { origin, source: frame, data: { channel: 'fieldnotes-v1', type: 'add' } };
  assert.equal(validMessage(event, frame, origin), true);
  assert.equal(validMessage({ ...event, origin: 'https://example.org' }, frame, origin), false);
  assert.equal(validMessage({ ...event, source: {} }, frame, origin), false);
  assert.equal(validMessage({ ...event, data: { type: 'add' } }, frame, origin), false);
  assert.equal(validMessage({ ...event, data: null }, frame, origin), false);
});
