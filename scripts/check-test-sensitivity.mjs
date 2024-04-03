import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const path = new URL('../shared/state.js', import.meta.url);
const original = readFileSync(path, 'utf8');
const mutations = [
  ['increment', 'quantity + 1', 'quantity + 2', 'adding increments'],
  ['quantity cap', 'Math.min(99, quantity + 1)', 'quantity + 1', 'quantity is capped'],
  ['remove last item', 'quantity <= 1', 'quantity < 1', 'removing the last'],
  ['checkout', "if (action.type === 'clear') return {};", "if (action.type === 'clear') return cart;", 'checkout clears'],
  ['unknown product', 'if (!products.some(product => product.id === action.id)) return cart;', '', 'unknown products'],
  ['money', 'product.price * (cart[product.id] || 0)', 'product.price * (cart[product.id] || 0) / 100', 'totals use'],
  ['message origin', 'event.origin === origin &&', '', 'messages require'],
  ['message source', 'event.source === frame &&', '', 'messages require'],
  ['message protocol', "data?.channel === 'fieldnotes-v1'", 'Boolean(data)', 'messages require'],
];
try {
  for (const [name, from, to, testName] of mutations) {
    if (!original.includes(from)) throw new Error(`Mutation target missing: ${name}`);
    writeFileSync(path, original.replace(from, to));
    const result = spawnSync(process.execPath, ['--test', `--test-name-pattern=${testName}`, 'tests/state.test.mjs'], { encoding: 'utf8' });
    if (result.status !== 1 || !result.stdout.includes('ERR_ASSERTION')) {
      throw new Error(`Mutation was not caught by an assertion: ${name}\n${result.stdout}\n${result.stderr}`);
    }
    console.log(`Observed assertion failure: ${name}`);
  }
} finally {
  writeFileSync(path, original);
}
