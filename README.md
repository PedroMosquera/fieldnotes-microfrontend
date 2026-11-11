# Fieldnotes Microfrontend

A small stationery shop for practicing microfrontends. Each section runs in its own iframe:

- React: product catalog
- Vue: basket and checkout
- Svelte: delivery and appearance settings
- Qwik: product recommendations

The shell holds shared state and passes messages between the apps. The admin panel lets you crash and restart each section, interrupt messages, and watch render updates. Each section has a framework-colored border that flashes when it updates.

Products and orders are mocked. There is no backend or payment service.

## Run locally

Use the Node version in `.nvmrc`:

```sh
nvm install
nvm use
npm install
npm run dev
```

Open http://127.0.0.1:5100.

## Build

```sh
npm run build
npm run preview
```
