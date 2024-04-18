import { products } from './catalog.js';
import { reduceCart, cartTotal } from './state.js';
export function initialState() {
  return { revision: 0, cart: {}, shipping: 0, favorites: [], compared: [], viewed: [], coupon: '', orders: [], tokens: { theme: 'forest', density: 'comfortable' } };
}

