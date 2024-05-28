export function normalizeSearch(query) {
  return String(query).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function filterProducts(products, { query = '', category = 'All', favoritesOnly = false, favorites = [] } = {}) {
  const search = normalizeSearch(query);
  return products.filter(product => (category === 'All' || product.category === category)
    && (!favoritesOnly || favorites.includes(product.id))
    && normalizeSearch(`${product.name} ${product.detail}`).includes(search));
}

