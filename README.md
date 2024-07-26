# Fieldnotes Microfrontend

A stationery shop and hands-on microfrontend training lab using React 18, Vue 3, Svelte 4 and Qwik 1. The shell composes independent iframe builds, owns shared state, validates commands and exposes transport failures. Products and orders are mocked locally; no account, payment service or backend is needed.

The history is a reconstructed learning exercise, not evidence that this code was authored on its commit timestamps. The frontend dependency cutoff is March 25, 2024. The prepared history has 107 source and tooling milestones through July 2024, then a separate Node security update on November 11, 2026: 108 commits in total. No commits have actually been created in this restricted workspace.

## Run locally

Use Node 20.11.1 from `.nvmrc` and its bundled npm at this historical milestone. The reconstructed November 2026 maintenance commit updates the runtime separately.

```sh
nvm install
nvm use
npm install
npm run check:dates
npm run dev
```

Open `http://127.0.0.1:5100`. The shell proxies four development servers on ports 5101 through 5104. Stop all five processes with Ctrl+C. The production build and unit tests pass in this session. Browser verification remains incomplete; see [verification status](docs/verification.md).

The `.npmrc` cutoff applies to direct and transitive dependencies. The first successful install must produce `package-lock.json`; retain it and use `npm ci` subsequently. `check:dates` verifies every locked package's publication timestamp and writes `docs/package-dates.json`. This date constraint is for the historical exercise, not a claim that those old packages are currently secure.

## Use the shop

React provides search, categories, sorting, favorites, product details and comparison. Qwik recommendations react to browsing activity and basket contents. Both sections publish favorite and add-to-basket commands. Vue handles quantities, the `STUDIO10` demo coupon, checkout, order history and reorder. Svelte controls delivery, theme and spacing. Its appearance commands update semantic CSS variables in every framework document.

Basket, favorites, comparisons, recent browsing, delivery, coupon and appearance persist in validated local storage. Orders and diagnostic traces stay in memory. Local search, sort and recommendation position belong to each section and reset when that section restarts.

## Use the training lab

The admin panel provides independent failure/restart controls, render signals and expandable transport faults. Delay, drop, duplicate, reorder or pause state delivery; separately drop acknowledgements to observe retries. Inject an actual uncaught error in a selected frame while the other sections keep running.

Below the shop, explore:

- State: canonical JSON, applied and target revisions, lag, render baselines and ready timing.
- Events: bounded structured traces with payloads, source filters and JSON export.
- Tokens: semantic variable values and a parent-only CSS probe.
- Architecture: each section's local ownership, publishers and subscriptions.
- Exercises: ten scenarios with setup actions, observation steps and expected outcomes.

Start with [training sessions](docs/training.md), then read [communication contracts](docs/communication.md). Completion checkboxes are self-assessments. Render signals use different framework lifecycle hooks and cannot rank framework performance.

## Verify

```sh
node scripts/check-test-sensitivity.mjs
node scripts/check-training-sensitivity.mjs
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

The sensitivity scripts temporarily break invariants, require assertion failures, and restore source in `finally` blocks. Do not edit those modules concurrently. The 13 unit tests have passed after 16 observed mutation failures. Browser tests are written but have not been run successfully or validated with failing assertions in this environment.

## Reconstruct the local Git history

```sh
node scripts/create-history.mjs --preview
node scripts/create-history.mjs --verify
node scripts/create-history.mjs
```

The script replays the source snapshots in `.practice/steps` into the Git index without overwriting working files. Every source milestone changes content; no empty commits are requested. Dates are deterministic, chronological and use Madrid offsets. Weekday sessions are at night, with irregular weekend sessions. The final security commit is dated November 11, 2026 at 23:42 Madrid time.

Creation refuses an existing repository, uses your configured Git identity, and requires dependency-date, mutation, unit, build and browser checks first. It never pushes or rewrites history. If a commit fails partway through, inspect the partial repository and continue manually. Intermediate snapshots show incremental development and are not claimed to be independently buildable releases.

See [history format](docs/history.md), [architecture](docs/architecture.md), [historical reading](docs/references.md), and [Node update](docs/node-security.md).
