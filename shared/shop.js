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

export function restoreState(value) {
  const state = initialState();
  if (!value || typeof value !== 'object') return state;
  state.cart = cleanCart(value.cart);
  state.favorites = cleanIds(value.favorites);
  state.compared = cleanIds(value.compared, 3);
  state.viewed = cleanIds(value.viewed, 8);
  state.shipping = value.shipping === 500 ? 500 : 0;
  state.coupon = value.coupon === 'STUDIO10' ? 'STUDIO10' : '';
  if (['forest', 'ocean', 'plum'].includes(value.tokens?.theme)) state.tokens.theme = value.tokens.theme;
  if (value.tokens?.density === 'compact') state.tokens.density = 'compact';
  return state;
}

export function toggleId(ids, id, limit = 20) {
  if (ids.includes(id)) return ids.filter(value => value !== id);
  return ids.length < limit ? [...ids, id] : ids;
}

export function reduceShop(state, action) {
  let next = state;
  const known = products.some(product => product.id === action.id);
  if (['add', 'remove', 'clear'].includes(action.type)) next = { ...state, cart: reduceCart(state.cart, action) };
  if (action.type === 'favorite' && known) next = { ...state, favorites: toggleId(state.favorites, action.id) };
  if (action.type === 'compare' && known) next = { ...state, compared: toggleId(state.compared, action.id, 3) };
  if (action.type === 'view' && known) next = { ...state, viewed: [action.id, ...state.viewed.filter(id => id !== action.id)].slice(0, 8) };
  if (action.type === 'shipping' && [0, 500].includes(action.amount)) next = { ...state, shipping: action.amount };
  if (action.type === 'coupon' && ['', 'STUDIO10'].includes(action.code.trim().toUpperCase())) next = { ...state, coupon: action.code.trim().toUpperCase() };
  if (action.type === 'theme' && ['forest', 'ocean', 'plum'].includes(action.value)) next = { ...state, tokens: { ...state.tokens, theme: action.value } };
  if (action.type === 'density' && ['comfortable', 'compact'].includes(action.value)) next = { ...state, tokens: { ...state.tokens, density: action.value } };
  return JSON.stringify(next) === JSON.stringify(state) ? state : { ...next, revision: state.revision + 1 };
}

export function placeOrder(state, id, timestamp) {
  if (!Object.keys(state.cart).length) return state;
  const order = { id, timestamp, cart: { ...state.cart }, ...totals(state) };
  return { ...state, cart: {}, coupon: '', orders: [order, ...state.orders].slice(0, 10), revision: state.revision + 1 };
}

export function reorder(state, id) {
  const order = state.orders.find(item => item.id === id);
  return order ? { ...state, cart: cleanCart(order.cart), revision: state.revision + 1 } : state;
}

export function createStore(seed = initialState()) {
  let state = structuredClone(seed);
  const subscribers = new Set();
  return {
    get: () => structuredClone(state),
    update(next) {
      if (JSON.stringify(next) === JSON.stringify(state)) return false;
      state = structuredClone(next);
      subscribers.forEach(listener => listener(structuredClone(state)));
      return true;
    },
    subscribe(listener) { subscribers.add(listener); return () => subscribers.delete(listener); },
  };
}

export function changedSlices(previous, next) {
  return Object.keys(next).filter(key => key !== 'revision' && JSON.stringify(previous[key]) !== JSON.stringify(next[key]));
}

export function acceptRevision(current, incoming) {
  return Number.isInteger(incoming) && incoming >= 0 && incoming >= current;
}

