import { component$, render, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { bootstrap, listen, send, rendered } from '../../../shared/bridge.js';
import { products, money } from '../../../shared/catalog.js';
import '../../../shared/style.css';

export const Recommendation = component$(() => {
  const index = useSignal(0);
  const pulse = useSignal(0);
  useVisibleTask$(({ cleanup }) => {
    bootstrap();
    cleanup(listen(message => { if (message.type === 'refresh') pulse.value++; }));
    send('ready');
  });
  useVisibleTask$(({ track }) => {
    track(() => index.value);
    track(() => pulse.value);
    rendered();
  });
  const product = products[index.value];
  return <main data-pulse={pulse.value}>
    <h2 class="pick-title">{product.name}</h2>
    <p class="muted">{product.detail}.</p>
    <div class="pick-actions"><button class="primary" onClick$={() => send('add', { id: products[index.value].id })}>Add for {money(product.price)}</button>
    <button class="text-button" onClick$={() => { index.value = (index.value + 1) % products.length; }}>Next product</button></div>
  </main>;
});

render(document.getElementById('app')!, <Recommendation />);
