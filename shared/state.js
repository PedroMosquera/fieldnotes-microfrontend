import { products } from './catalog.js';

export function reduceCart(cart, action) {
  if (action.type === 'clear') return {};
  if (!products.some(product => product.id === action.id)) return cart;
  const quantity = cart[action.id] || 0;
  if (action.type === 'add') return { ...cart, [action.id]: Math.min(99, quantity + 1) };
  if (action.type === 'remove') {
    const next = { ...cart };
    if (quantity <= 1) delete next[action.id];
    else next[action.id] = quantity - 1;
    return next;
  }
  return cart;
}

export function cartTotal(cart) {
  return products.reduce((total, product) => total + product.price * (cart[product.id] || 0), 0);
}

export function validMessage(event, frame, origin) {
  const data = event.data;
  return event.origin === origin && event.source === frame && data?.channel === 'fieldnotes-v1'
    && typeof data.type === 'string';
}
