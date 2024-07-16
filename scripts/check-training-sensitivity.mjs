import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const mutations = [
  ['discount arithmetic', 'shared/shop.js', 'tests/shop.test.mjs', 'Math.round(subtotal / 10)', 'Math.round(subtotal / 5)'],
  ['capability enforcement', 'shared/protocol.js', 'tests/protocol.test.mjs', 'capabilities[source].includes(type)', 'true'],
  ['storage data minimization', 'shared/persistence.js', 'tests/persistence.test.mjs', 'state: { cart, shipping, favorites', 'state: { orders: state.orders, cart, shipping, favorites'],
  ['latency bound', 'shared/faults.js', 'tests/faults.test.mjs', 'Math.min(5000,', 'Math.min(500,'],
  ['trace bound', 'shared/telemetry.js', 'tests/training.test.mjs', '.slice(0, limit)', '.slice(0, limit + 1)'],
  ['stale snapshot guard', 'shared/shop.js', 'tests/shop.test.mjs', 'incoming > current', 'incoming >= current'],
];
for (const [name, path, testPath, from, to] of mutations) {
  const original = readFileSync(path, 'utf8');
  if (!original.includes(from)) throw new Error(`Mutation target missing: ${name}`);
  try {
    writeFileSync(path, original.replace(from, to));
    const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', testPath], { encoding: 'utf8' });
    if (result.status !== 1 || !result.stdout.includes('ERR_ASSERTION')) throw new Error(`Assertion did not catch ${name}\n${result.stdout}\n${result.stderr}`);
    console.log(`Observed assertion failure: ${name}`);
  } finally { writeFileSync(path, original); }
}
