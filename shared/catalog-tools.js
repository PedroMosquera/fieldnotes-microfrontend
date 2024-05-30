export function normalizeSearch(query) {
  return String(query).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function filterProducts(products, { query = '', category = 'All', favoritesOnly = false, favorites = [] } = {}) {
  const search = normalizeSearch(query);
  return products.filter(product => (category === 'All' || product.category === category)
    && (!favoritesOnly || favorites.includes(product.id))
    && normalizeSearch(`${product.name} ${product.detail}`).includes(search));
}

export function sortProducts(products, sort = 'featured') {
  const list = [...products];
  if (sort === 'price-low') list.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') list.sort((a, b) => b.price - a.price);
  if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

export function comparedProducts(products, ids) {
  return ids.map(id => products.find(product => product.id === id)).filter(Boolean);
}

