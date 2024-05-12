import { restoreState } from './shop.js';
export const STORAGE_KEY = 'fieldnotes.practice.v1';
export function serializeState(state) {
  const { cart, shipping, favorites, compared, viewed, coupon, tokens } = state;
  return JSON.stringify({ schema: 1, state: { cart, shipping, favorites, compared, viewed, coupon, tokens } });
}

export function deserializeState(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.schema !== 1) return { state: restoreState(null), warning: 'Saved state schema is unsupported.' };
    return { state: restoreState(parsed.state), warning: '' };
  } catch { return { state: restoreState(null), warning: 'Saved state could not be read.' }; }
}

export function loadState(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? deserializeState(raw) : { state: restoreState(null), warning: '' };
  } catch { return { state: restoreState(null), warning: 'Browser storage is unavailable.' }; }
}

export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, serializeState(state)); return ''; }
  catch { return 'State is in memory only; browser storage rejected the write.'; }
}

export function clearSavedState(storage) {
  try { storage.removeItem(STORAGE_KEY); return ''; }
  catch { return 'Saved state could not be cleared.'; }
}

