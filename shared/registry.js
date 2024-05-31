export const registry = [
  { name: 'react', label: 'Catalog', owns: 'Search and sort', publishes: 'add, favorite, compare, view', consumes: 'cart, favorites, compared, tokens' },
  { name: 'vue', label: 'Basket and orders', owns: 'Coupon input and confirmation', publishes: 'add, remove, clear, coupon, checkout, reorder', consumes: 'cart, shipping, coupon, orders, tokens' },
  { name: 'svelte', label: 'Delivery and appearance', owns: 'Preference inputs', publishes: 'shipping, theme, density', consumes: 'cart, shipping, tokens' },
  { name: 'qwik', label: 'Recommendations', owns: 'Recommendation cursor', publishes: 'add, favorite, view', consumes: 'cart, favorites, viewed, tokens' },
];

