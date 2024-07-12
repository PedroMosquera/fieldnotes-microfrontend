import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultFault, configureFault, deliveryPlan, retryDelay, heartbeatStatus, sameGeneration } from '../shared/faults.js';
import { acceptRevision } from '../shared/shop.js';

test('transport faults reproduce stale delivery without corrupting revisions', () => {
  const first = { revision: 1, cart: { cup: 1 } };
  const second = { revision: 2, cart: { cup: 2 } };
  const delayed = configureFault(defaultFault(), 'delay', 9999);
  assert.equal(deliveryPlan(delayed, first)[0].delay, 5000);
  const dropped = configureFault(defaultFault(), 'drop');
  assert.deepEqual(deliveryPlan(dropped, first), []);
  assert.equal(dropped.dropped, 1);
  const reversed = configureFault(defaultFault(), 'reorder');
  assert.deepEqual(deliveryPlan(reversed, first), []);
  const plan = deliveryPlan(reversed, second);
  assert.deepEqual(plan.map(item => item.message.revision), [2, 1]);
  let revision = 0;
  for (const item of plan) if (acceptRevision(revision, item.message.revision)) revision = item.message.revision;
  assert.equal(revision, 2);
  const duplicates = deliveryPlan(configureFault(defaultFault(), 'duplicate'), first);
  assert.equal(duplicates.length, 2);
  duplicates[1].message.cart.cup = 90;
  assert.equal(first.cart.cup, 1);
  assert.equal(sameGeneration(1, 2), false);
  assert.equal(sameGeneration(2, 2), true);
  assert.equal(retryDelay(20), 4000);
  assert.equal(heartbeatStatus(100, 8000), 'unresponsive');
});
