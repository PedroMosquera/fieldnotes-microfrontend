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
  const visible = products.filter(product => (category === 'All' || product.category === category)
    && product.name.toLowerCase().includes(query.toLowerCase()));
  return <main data-pulse={pulse}>
    <div className="catalog-tools"><div className="tabs" aria-label="Product category">
      {['All', 'Paper', 'Objects'].map(value => <button key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}
    </div><input aria-label="Search products" placeholder="Search the collection" value={query} onChange={event => setQuery(event.target.value)} /></div>
    <div className="products">{visible.map(product => <article className="product" key={product.id}>
      <div className="product-art" style={{ background: product.color }} aria-hidden="true"><div className={`object ${product.shape}`} /></div>
      <div className="product-heading"><h2>{product.name}</h2><strong>{money(product.price)}</strong></div>
      <p className="muted">{product.detail}</p>
      <button className="add" onClick={() => send('add', { id: product.id })}>Add to basket<span aria-hidden="true">+</span></button>
    </article>)}</div>
    {!visible.length && <p className="empty">No products match. Try another search.</p>}
  </main>;
}
createRoot(document.getElementById('app')).render(<Catalog />);
