<script setup>
import { ref, computed, onMounted, onUpdated, onUnmounted } from 'vue';
import { products, money } from '../../shared/catalog.js';
import { cartTotal } from '../../shared/state.js';
import { listen, send, rendered } from '../../shared/bridge.js';
const cart = ref({});
const shipping = ref(0);
const pulse = ref(0);
const confirmation = ref('');
const items = computed(() => products.filter(product => cart.value[product.id]));
const total = computed(() => cartTotal(cart.value) + (items.value.length ? shipping.value : 0));
const cleanup = listen(message => {
  if (message.type === 'state') { cart.value = message.cart; shipping.value = message.shipping; }
  if (message.type === 'refresh') pulse.value++;
  if (message.type === 'ordered') confirmation.value = 'Demo order placed. Nothing has been charged.';
});
onMounted(() => { rendered(); send('ready'); });
onUpdated(rendered);
onUnmounted(cleanup);
</script>

<template>
  <main :data-pulse="pulse">
    <p v-if="!items.length" class="empty">Your basket is empty. Add a product from the catalog.</p>
    <ul class="basket-items">
      <li v-for="product in items" :key="product.id">
        <div><strong>{{ product.name }}</strong><p class="muted">{{ money(product.price) }} each</p></div>
        <div class="quantity"><button :aria-label="`Remove ${product.name}`" @click="send('remove', { id: product.id })">-</button><span>{{ cart[product.id] }}</span><button :aria-label="`Add ${product.name}`" @click="send('add', { id: product.id })">+</button></div>
      </li>
    </ul>
    <div class="total"><span>Delivery</span><span>{{ items.length && shipping ? money(shipping) : 'Free' }}</span></div>
    <div class="total grand"><span>Total</span><strong>{{ money(total) }}</strong></div>
    <button class="primary" :disabled="!items.length" @click="send('checkout')">Place demo order</button>
    <p class="muted small">Practice checkout. No payment details needed.</p>
    <p role="status">{{ confirmation }}</p>
  </main>
</template>
