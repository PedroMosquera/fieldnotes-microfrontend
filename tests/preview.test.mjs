import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveConfig } from 'vite';
import projectConfig from '../vite.config.js';

test('production preview serves built apps without development proxies', async () => {
  const previous = process.env.APP_NAME;
  try {
    process.env.APP_NAME = '';
    const config = await resolveConfig({ ...await projectConfig(), configFile: false }, 'serve', 'production', 'production', true);
    assert.deepEqual(config.preview.proxy, {}, 'Preview must not forward built app requests to development servers');
    assert.equal(Object.keys(config.server.proxy).length, 4, 'Development must retain its four app proxies');
  } finally {
    if (previous === undefined) delete process.env.APP_NAME;
    else process.env.APP_NAME = previous;
  }
});
