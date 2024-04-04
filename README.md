# Fieldnotes Microfrontend

A small stationery shop and a microfrontend failure lab. React renders the collection, Vue manages the basket view, Svelte offers delivery choices, and Qwik rotates recommendations. A plain JavaScript shell composes the sections and provides the control room.

This is a reconstructed March to July 2024 practice project. Historical commit dates are an exercise schedule, not evidence that this code was written in 2024. The dependency cutoff is March 25, 2024. No remote repository or deployment is required.

## Run locally

Use Node 20.11.1 (see `.nvmrc`) and its bundled npm for this historical milestone. With network access:

```sh
nvm install
nvm use
npm install
npm run check:dates
npm run dev
```

Open `http://127.0.0.1:5100`. The shell proxies four development servers on ports 5101 through 5104. Stop the process with Ctrl+C. Products are local fixtures and orders are simulated. No backend, account or payment service is used.

The repository's `.npmrc` limits resolution to packages published before the cutoff, including transitive dependencies. The first install must generate `package-lock.json`; retain that file and use `npm ci` for subsequent installs. `check:dates` checks every locked package against npm publication timestamps and writes `docs/package-dates.json`. Until that succeeds, full historical dependency compatibility remains unverified.

## Try the failure lab

1. Add a product to the basket. Change its quantity or delivery option.
2. In the control room, press **Render** to trigger a local state update and watch the counter.
3. Press **Fail app** for any framework. Its iframe throws an uncaught error, reports it, and is replaced with a fallback. The other sections remain mounted.
4. Add another item using a surviving catalog or recommendation card. Restart the basket to see the latest shell state.
5. Press **Restart** or **Restart all**. Shared cart and delivery state survive. Search, recommendation selection, and render counters reset.
6. Place a demo order. The basket clears and a confirmation explains that nothing was charged.

Counters represent instrumented component commits or reactive updates, not every internal render, browser paint, CPU time or comparable framework benchmarks. The activity list keeps the most recent 40 events. Full page reloads reset all state.

## Verify

```sh
node scripts/check-test-sensitivity.mjs
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

The sensitivity check deliberately introduces nine temporary faults into the state module and requires assertion failures, then restores the original file. Do not run it concurrently with editing that module. Browser tests target production builds and cover checkout, all four failure/recovery paths, Qwik interactions, and mobile overflow. They have not yet been executed successfully in this workspace; see [verification](docs/verification.md).

## Local Git history

The supplied history script creates ten commits with both author and committer dates from March 25 through July 25, 2024, followed by a Node security update on November 11, 2026 at 23:42 Europe/Madrid. Weekday commits are at night; four irregularly spaced weekend commits are during the day. The 2024 dependency commit stages Node 20.11.1 and its original engine constraint; the final commit updates the pin and manifest/lockfile engine constraints. It uses your configured Git identity, refuses an existing repository, runs checks first, and never pushes or rewrites history. See [Node security update](docs/node-security.md).

```sh
node scripts/create-history.mjs --preview
node scripts/create-history.mjs
```

This script has not been executed here because the session cannot write `.git` or download the packages needed for its verification gates. It groups the source into setup, individual framework sections, composition, tests and documentation. Early commits are incremental source milestones, not independently runnable full applications. If a commit fails partway through, inspect and continue manually; the script deliberately refuses to overwrite that partial repository.

See [architecture](docs/architecture.md), [historical reading](docs/references.md), and [verification status](docs/verification.md).
