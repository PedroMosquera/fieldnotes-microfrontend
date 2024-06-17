import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { products, money } from '../../shared/catalog.js';
import { bootstrap, listen, send, rendered } from '../../shared/bridge.js';
import '../../shared/style.css';
import { filterProducts, sortProducts, comparedProducts } from '../../shared/catalog-tools.js';

bootstrap();
function Catalog() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [pulse, setPulse] = useState(0);
  const [shared, setShared] = useState({ cart: {}, favorites: [], compared: [] });
  const [sort, setSort] = useState('featured');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => { rendered(); });
  useEffect(() => {
    const cleanup = listen(message => {
      if (message.type === 'refresh') setPulse(value => value + 1);
      if (message.type === 'state') setShared(message);
      if (message.type === 'notice') setNotice(message.message);
    });
    send('ready');
    return cleanup;
  }, []);
  const visible = sortProducts(filterProducts(products, { category, query, favoritesOnly, favorites: shared.favorites }), sort);
  const comparison = comparedProducts(products, shared.compared);
  return <main data-pulse={pulse}>
    <div className="catalog-tools"><div className="tabs" aria-label="Product category">
      {['All', 'Paper', 'Objects'].map(value => <button key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}
    </div><input aria-label="Search products" placeholder="Search the collection" value={query} onChange={event => setQuery(event.target.value)} /></div>
    <div className="catalog-tools">
      <label>Sort <select value={sort} onChange={event => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low first</option><option value="price-high">Price: high first</option><option value="name">Name</option></select></label>
      <label><input type="checkbox" checked={favoritesOnly} onChange={event => setFavoritesOnly(event.target.checked)} /> Saved only</label>
      <span className="muted">{visible.length} products</span>
    </div><div className="products">{visible.map(product => <article className="product" key={product.id}>
      <div className="product-art" style={{ background: product.color }} aria-hidden="true"><div className={`object ${product.shape}`} /></div>
      <div className="product-heading"><h2>{product.name}</h2><strong>{money(product.price)}</strong></div>
      <p className="muted">{product.detail}</p>
      <div className="product-actions"><button aria-pressed={shared.favorites.includes(product.id)} onClick={() => send('favorite', { id: product.id })}>{shared.favorites.includes(product.id) ? 'Saved' : 'Save'}</button>
      <button onClick={() => { send('view', { id: product.id }); setNotice(`${product.name}: ${product.detail}. Browsing activity sent to recommendations.`); }}>Details</button>
      <button aria-pressed={shared.compared.includes(product.id)} disabled={shared.compared.length >= 3 && !shared.compared.includes(product.id)} onClick={() => send('compare', { id: product.id })}>Compare</button></div>
      <button className="add" onClick={() => send('add', { id: product.id })}>Add to basket<span aria-hidden="true">+</span></button>
    </article>)}</div>
    {comparison.length > 0 && <section className="comparison"><h2>Compare up to three</h2><table><thead><tr><th>Product</th><th>Category</th><th>Price</th></tr></thead><tbody>{comparison.map(product => <tr key={product.id}><td>{product.name}</td><td>{product.category}</td><td>{money(product.price)}</td></tr>)}</tbody></table></section>}
    <p role="status" className="muted">{notice}</p>
    {!visible.length && <p className="empty">No products match. Try another search.</p>}
  </main>;
}
createRoot(document.getElementById('app')).render(<Catalog />);
