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
