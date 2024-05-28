export function normalizeSearch(query) {
  return String(query).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

