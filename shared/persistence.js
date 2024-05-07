import { restoreState } from './shop.js';
export const STORAGE_KEY = 'fieldnotes.practice.v1';
export function serializeState(state) {
  const { cart, shipping, favorites, compared, viewed, coupon, tokens } = state;
  return JSON.stringify({ schema: 1, state: { cart, shipping, favorites, compared, viewed, coupon, tokens } });
}

