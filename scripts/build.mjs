import { spawnSync } from 'node:child_process';
for (const name of ['', 'react', 'vue', 'svelte', 'qwik']) {
  const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
    stdio: 'inherit', env: { ...process.env, APP_NAME: name },
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
