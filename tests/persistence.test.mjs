import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState } from '../shared/shop.js';
import { STORAGE_KEY, serializeState, deserializeState, loadState, saveState, clearSavedState } from '../shared/persistence.js';

test('storage round trips allowed state and degrades safely on errors', () => {
  const state = { ...initialState(), cart: { cup: 2 }, orders: [{ secret: 'not persisted' }] };
  const raw = serializeState(state);
  assert.equal(raw.includes('not persisted'), false);
  assert.deepEqual(deserializeState(raw).state.cart, { cup: 2 });
  assert.ok(deserializeState('{broken').warning);
  assert.ok(deserializeState('{"schema":99}').warning);
  const map = new Map([['other-app', 'keep']]);
  const storage = { getItem: key => map.get(key), setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) };
  assert.equal(saveState(storage, state), '');
  assert.deepEqual(loadState(storage).state.cart, { cup: 2 });
  clearSavedState(storage);
  assert.equal(map.has(STORAGE_KEY), false);
  assert.equal(map.get('other-app'), 'keep');
  const denied = { getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); } };
  assert.ok(loadState(denied).warning);
  assert.ok(saveState(denied, state));
  assert.ok(clearSavedState(denied));
});
