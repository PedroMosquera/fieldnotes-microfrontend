import { component$, render, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { bootstrap, listen, send, rendered } from '../../../shared/bridge.js';
import { products, money } from '../../../shared/catalog.js';
import '../../../shared/style.css';
import { recommend } from '../../../shared/catalog-tools.js';

export const Recommendation = component$(() => {
  const index = useSignal(0);
  const pulse = useSignal(0);
  const viewed = useSignal<string[]>([]);
  const favorites = useSignal<string[]>([]);
  const cart = useSignal<Record<string, number>>({});
  const notice = useSignal('');
  useVisibleTask$(({ cleanup }) => {
    bootstrap();
    cleanup(listen(message => {
      if (message.type === 'refresh') pulse.value++;
      if (message.type === 'state') {
        viewed.value = message.viewed;
        favorites.value = message.favorites;
        cart.value = message.cart;
      }
      if (message.type === 'notice') notice.value = message.message;
    }));
    send('ready');
  });
  useVisibleTask$(({ track }) => {
    track(() => index.value);
    track(() => pulse.value);
    track(() => viewed.value);
    track(() => favorites.value);
    track(() => cart.value);
    rendered();
  });
  const ranked = recommend(products, viewed.value, cart.value);
  const product = ranked[index.value % ranked.length];
  return <main data-pulse={pulse.value}>
    <h2 class="pick-title">{product.name}</h2>
    <p class="muted">{product.detail}.</p>
    <div class="pick-actions"><button class="primary" onClick$={() => send('add', { id: product.id })}>Add for {money(product.price)}</button>
    <button class="text-button" onClick$={() => { index.value = (index.value + 1) % products.length; }}>Next product</button></div>
  </main>;
});

render(document.getElementById('app')!, <Recommendation />);
