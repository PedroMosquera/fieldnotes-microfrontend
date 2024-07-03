import { exercises } from '../shared/exercises.js';
import { registry } from '../shared/registry.js';
import { tokenRows } from '../shared/tokens.js';
import { filterTrace, traceSummary, revisionLag, renderDelta, exportTrace } from '../shared/telemetry.js';

export function createLab(api) {
  const root = document.createElement('details');
  root.className = 'training';
  root.innerHTML = `<summary>Inspect</summary><nav class="lab-tabs" aria-label="Training views"></nav><div class="lab-panels"></div><p id="lab-notice" role="status"></p>`;
  document.querySelector('.store').append(root);
  const panels = {};
  for (const name of ['State', 'Events', 'Tokens', 'Architecture', 'Exercises']) {
    const button = document.createElement('button');
    button.textContent = name;
    button.setAttribute('aria-pressed', String(name === 'State'));
    const panel = document.createElement('section');
    panel.hidden = name !== 'State';
    panel.id = `lab-${name.toLowerCase()}`;
    button.setAttribute('aria-controls', panel.id);
    button.onclick = () => {
      Object.values(panels).forEach(value => { value.panel.hidden = true; value.button.setAttribute('aria-pressed', 'false'); });
      panel.hidden = false;
      button.setAttribute('aria-pressed', 'true');
    };
    panels[name] = { panel, button };
    root.querySelector('nav').append(button);
    root.querySelector('.lab-panels').append(panel);
  }
  const context = { api, root, panels, notice: message => { root.querySelector('#lab-notice').textContent = message; } };
  const updates = [statePanel(context), eventPanel(context), tokenPanel(context), architecturePanel(context), exercisePanel(context)];
  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; updates.forEach(update => update?.()); });
  }
  schedule();
  return { schedule };
}

function statePanel({ api, panels, notice }) {
  const panel = panels.State.panel;
  panel.innerHTML = `<div class="lab-actions"><button id="baseline">Reset counts</button><button id="reset-state">Reset shop</button></div><div class="table-scroll"><table><thead><tr><th>App</th><th>Applied</th><th>Target</th><th>Lag</th><th>Updates</th><th>Load time</th></tr></thead><tbody></tbody></table></div><details><summary>Shared state</summary><pre></pre></details>`;
  let baseline = {};
  panel.querySelector('#baseline').onclick = () => {
    baseline = Object.fromEntries(Object.entries(api.getApps()).map(([name, app]) => [name, app.renders]));
    notice('Counts reset.');
    update();
  };
  panel.querySelector('#reset-state').onclick = () => {
    if (window.confirm('Clear this demo basket, favorites, orders and preferences?')) { api.reset(); notice('Demo state reset.'); }
  };
  function update() {
    const apps = api.getApps();
    const delta = renderDelta(Object.fromEntries(Object.entries(apps).map(([name, app]) => [name, app.renders])), baseline);
    const body = panel.querySelector('tbody');
    body.replaceChildren();
    for (const [name, app] of Object.entries(apps)) {
      const row = document.createElement('tr');
      for (const value of [name, app.appliedRevision, app.targetRevision, revisionLag(app.targetRevision, app.appliedRevision), delta[name], app.readyMs === undefined ? 'pending' : `${app.readyMs} ms`]) {
        const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
      }
      body.append(row);
    }
    panel.querySelector('pre').textContent = JSON.stringify(api.getState(), null, 2);
  }
  return update;
}

function eventPanel({ api, panels, notice }) {
  const panel = panels.Events.panel;
  panel.innerHTML = `<p>Bounded to the latest 160 events. Heartbeats and resize traffic are excluded from this trace.</p><div class="lab-actions"><label>Source<select id="trace-source"><option value="all">All apps</option><option>shell</option><option>react</option><option>vue</option><option>svelte</option><option>qwik</option></select></label><label>Find event<input id="trace-search" placeholder="state, favorite, rejected..." /></label><button id="export-trace">Export JSON</button></div><p class="muted" id="trace-summary"></p><div class="trace-list"></div>`;
  panel.querySelector('#trace-source').onchange = update;
  panel.querySelector('#trace-search').oninput = update;
  panel.querySelector('#export-trace').onclick = () => {
    const url = URL.createObjectURL(new Blob([exportTrace(api.getTrace(), api.getState())], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'fieldnotes-session.json'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notice('Session trace exported.');
  };
  function update() {
    const rows = api.getTrace();
    const summary = traceSummary(rows);
    panel.querySelector('#trace-summary').textContent = `${summary.total} events / ${summary.rejected} rejected / ${summary.snapshots} snapshots / ${summary.renders} render signals`;
    const list = panel.querySelector('.trace-list');
    const opened = new Set([...list.querySelectorAll('details[open]')].map(element => element.dataset.key));
    list.replaceChildren();
    for (const row of filterTrace(rows, panel.querySelector('#trace-source').value, panel.querySelector('#trace-search').value)) {
      const item = document.createElement('details');
      item.dataset.key = `${row.timestamp}:${row.source}:${row.messageId || row.type}:${row.detail}`;
      item.open = opened.has(item.dataset.key);
      const title = document.createElement('summary'); title.textContent = `${row.source} / ${row.type}: ${row.detail || ''}`;
      const data = document.createElement('pre'); data.textContent = JSON.stringify(row, null, 2);
      item.append(title, data); list.append(item);
    }
  }
  return update;
}

function tokenPanel({ api, panels, notice }) {
  const panel = panels.Tokens.panel;
  panel.innerHTML = `<p>Svelte publishes appearance preferences. The shell resolves and distributes the same semantic tokens to each document. CSS itself does not cross iframe boundaries.</p><div class="lab-actions"><button id="css-probe">Set shell-only accent</button><button id="restore-theme">Restore shell theme</button></div><table><thead><tr><th>Token</th><th>Value</th></tr></thead><tbody></tbody></table>`;
  panel.querySelector('#css-probe').onclick = () => { document.documentElement.style.setProperty('--shop-accent', '#963a24'); notice('Only the shell accent changed. Child frame variables are independent.'); };
  panel.querySelector('#restore-theme').onclick = () => { api.restoreTheme(); notice('Shell tokens restored from canonical state.'); };
  return () => {
    const body = panel.querySelector('tbody'); body.replaceChildren();
    for (const token of tokenRows(api.getState().tokens)) {
      const row = document.createElement('tr');
      for (const value of [token.name, token.value]) { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); }
      body.append(row);
    }
  };
}

function architecturePanel({ panels }) {
  const panel = panels.Architecture.panel;
  panel.innerHTML = `<p>Each app sends changes to the shell and receives the state it uses.</p><div class="topology"><span>React</span><span>Vue</span><strong>Shell</strong><span>Svelte</span><span>Qwik</span></div><div class="table-scroll"><table><thead><tr><th>Section</th><th>Local ownership</th><th>Publishes</th><th>Subscribes</th></tr></thead><tbody></tbody></table></div><p class="muted">This is a same-origin trusted-code exercise. Frames isolate lifecycle and styling; they are not a security boundary or a guarantee of separate browser threads.</p>`;
  for (const entry of registry) {
    const row = document.createElement('tr');
    for (const value of [entry.name, entry.owns, entry.publishes, entry.consumes]) { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); }
    panel.querySelector('tbody').append(row);
  }
}

function exercisePanel({ api, panels, notice }) {
  const panel = panels.Exercises.panel;
  panel.innerHTML = `<p>Completion is a self-assessment, not an automated test result. Each scenario changes transport settings only; your basket remains available.</p><div class="lab-actions"><button id="normal-transport">Restore normal transport</button><button id="protocol-probe">Probe wrong protocol</button><button id="permission-probe">Probe wrong permission</button></div><div class="exercise-list"></div>`;
  panel.querySelector('#normal-transport').onclick = () => { api.scenario('normal'); notice('All state delivery restored.'); };
  panel.querySelector('#protocol-probe').onclick = () => api.probe('protocol');
  panel.querySelector('#permission-probe').onclick = () => api.probe('permission');
  for (const exercise of exercises) {
    const card = document.createElement('details');
    const title = document.createElement('summary'); title.textContent = exercise.title;
    const start = document.createElement('button'); start.textContent = 'Start scenario';
    start.onclick = () => { api.scenario(exercise.setup); notice(`Started: ${exercise.title}`); };
    const list = document.createElement('ol');
    exercise.steps.forEach(text => { const item = document.createElement('li'); item.textContent = text; list.append(item); });
    const expected = document.createElement('p'); expected.textContent = `Expected: ${exercise.expected}`;
    const label = document.createElement('label');
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
    label.append(checkbox, ' I observed and can explain this outcome');
    card.append(title, start, list, expected, label); panel.querySelector('.exercise-list').append(card);
  }
}
