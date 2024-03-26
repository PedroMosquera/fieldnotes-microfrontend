import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const names = ['react', 'vue', 'svelte', 'qwik'];
export default defineConfig(async () => {
  const name = process.env.APP_NAME;
  if (!name) return {
    preview: { proxy: {} },
    server: {
      host: '127.0.0.1', port: 5100, strictPort: true,
      proxy: Object.fromEntries(names.map((app, i) => [
        `/apps/${app}/`, { target: `http://127.0.0.1:${5101 + i}`, ws: true },
      ])),
    },
    build: { outDir: 'dist', emptyOutDir: true },
  };
  if (!names.includes(name)) throw new Error(`Unknown app: ${name}`);
  const factories = {
    react: async () => (await import('@vitejs/plugin-react')).default(),
    vue: async () => (await import('@vitejs/plugin-vue')).default(),
    svelte: async () => (await import('@sveltejs/vite-plugin-svelte')).svelte(),
    qwik: async () => (await import('@builder.io/qwik/optimizer')).qwikVite({
      csr: true,
      srcDir: 'src',
      client: {
        input: resolve('apps/qwik/index.html'),
        devInput: resolve('apps/qwik/src/main.tsx'),
      },
    }),
  };
  return {
    root: resolve('apps', name),
    base: `/apps/${name}/`,
    plugins: [await factories[name]()],
    server: {
      host: '127.0.0.1', port: 5101 + names.indexOf(name), strictPort: true,
      fs: { allow: [process.cwd()] },
    },
    build: { outDir: resolve('dist/apps', name), emptyOutDir: true },
  };
});
