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
