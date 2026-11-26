import { readFile } from 'node:fs/promises';

const cutoff = '2024-03-25T20:00:00.000Z';
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
const report = [];
const metadata = new Map();
for (const [path, entry] of Object.entries(lock.packages)) {
  if (!path || entry.link) continue;
  const name = entry.name || path.split('node_modules/').at(-1);
  if (!metadata.has(name)) {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`${name}: registry returned ${response.status}`);
    metadata.set(name, await response.json());
  }
  const published = metadata.get(name).time?.[entry.version];
  if (!published || Date.parse(published) > Date.parse(cutoff)) throw new Error(`${name}@${entry.version} is outside cutoff: ${published}`);
  report.push({ name, version: entry.version, published });
}
console.log(`Verified ${report.length} locked package versions against npm publication dates.`);
