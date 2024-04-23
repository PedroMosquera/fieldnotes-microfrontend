import { products } from './catalog.js';
import { reduceCart, cartTotal } from './state.js';
export function initialState() {
  return { revision: 0, cart: {}, shipping: 0, favorites: [], compared: [], viewed: [], coupon: '', orders: [], tokens: { theme: 'forest', density: 'comfortable' } };
}

export function cleanCart(value) {
  return Object.fromEntries(products.filter(product => Number.isInteger(value?.[product.id]) && value[product.id] > 0)
    .map(product => [product.id, Math.min(99, value[product.id])]));
}

export function cleanIds(value, limit = 20) {
  return Array.isArray(value) ? [...new Set(value.filter(id => products.some(product => product.id === id)))].slice(0, limit) : [];
}

export function totals(state) {
  const subtotal = cartTotal(state.cart);
  const discount = state.coupon === 'STUDIO10' ? Math.round(subtotal / 10) : 0;
  const delivery = subtotal ? state.shipping : 0;
  return { subtotal, discount, delivery, total: subtotal - discount + delivery };
}

