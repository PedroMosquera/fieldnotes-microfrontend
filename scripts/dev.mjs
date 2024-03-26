import { spawn } from 'node:child_process';
const children = ['', 'react', 'vue', 'svelte', 'qwik'].map(name => spawn(
  process.execPath, ['node_modules/vite/bin/vite.js'],
  { stdio: 'inherit', env: { ...process.env, APP_NAME: name } },
));
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach(child => child.kill('SIGTERM'));
  process.exitCode = code;
}
children.forEach(child => {
  child.on('error', () => stop(1));
  child.on('exit', code => { if (!stopping) stop(code || 1); });
});
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
