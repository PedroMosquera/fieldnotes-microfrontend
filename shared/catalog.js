export const products = [
  { id: 'notebook', name: 'Everyday notebook', category: 'Paper', price: 1800, color: '#e8b55b', shape: 'book', detail: 'Dot grid / 160 pages' },
  { id: 'lamp', name: 'Arc desk lamp', category: 'Objects', price: 6400, color: '#9db7aa', shape: 'lamp', detail: 'Warm light / matte sage' },
  { id: 'cup', name: 'Studio cup', category: 'Objects', price: 2400, color: '#d79077', shape: 'cup', detail: 'Stoneware / 300 ml' },
  { id: 'pen', name: 'Draft pencil set', category: 'Paper', price: 1200, color: '#9caec9', shape: 'pencils', detail: 'Graphite / set of three' },
];
export const money = cents => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
