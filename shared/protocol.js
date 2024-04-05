export const CHANNEL = 'fieldnotes-v2';
export const APPS = ['react', 'vue', 'svelte', 'qwik'];
export const capabilities = {
  react: ['add', 'favorite', 'view', 'compare'],
  vue: ['add', 'remove', 'clear', 'coupon', 'checkout', 'reorder'],
  svelte: ['shipping', 'theme', 'density'],
  qwik: ['add', 'favorite', 'view'],
};
export const subscriptions = {
  react: ['favorites', 'compared', 'cart', 'tokens'],
  vue: ['cart', 'shipping', 'coupon', 'orders', 'tokens'],
  svelte: ['shipping', 'cart', 'tokens'],
  qwik: ['favorites', 'viewed', 'cart', 'tokens'],
};

