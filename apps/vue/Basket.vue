<script setup>
import { ref, computed, onMounted, onUpdated, onUnmounted } from 'vue';
import { products, money } from '../../shared/catalog.js';
import { totals } from '../../shared/shop.js';
import { listen, send, rendered } from '../../shared/bridge.js';
const cart = ref({});
const shipping = ref(0);
const pulse = ref(0);
const coupon = ref('');
const code = ref('');
const orders = ref([]);
const confirmation = ref('');
const items = computed(() => products.filter(product => cart.value[product.id]));
const amounts = computed(() => totals({ cart: cart.value, shipping: shipping.value, coupon: coupon.value }));
const total = computed(() => amounts.value.total);
const cleanup = listen(message => {
  if (message.type === 'state') { cart.value = message.cart; shipping.value = message.shipping; coupon.value = message.coupon; orders.value = message.orders; }
  if (message.type === 'refresh') pulse.value++;
  if (message.type === 'notice') confirmation.value = message.message;
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
    <form class="coupon" @submit.prevent="send('coupon', { code })"><label for="coupon">Demo discount code</label><input id="coupon" v-model="code" placeholder="STUDIO10" maxlength="30" /><button>Apply code</button></form>
    <div v-if="coupon" class="total"><span>{{ coupon }} discount</span><span>-{{ money(amounts.discount) }}</span><button @click="send('coupon', { code: '' })">Remove code</button></div>
    <div class="total"><span>Delivery</span><span>{{ items.length && shipping ? money(shipping) : 'Free' }}</span></div>
    <div class="total grand"><span>Total</span><strong>{{ money(total) }}</strong></div>
    <button class="primary" :disabled="!items.length" @click="send('checkout')">Place demo order</button>
    <button :disabled="!items.length" @click="send('clear')">Empty basket</button>
    <p class="muted small">Practice checkout. No payment details needed.</p>
    <details v-if="orders.length"><summary>Demo orders ({{ orders.length }})</summary><ul class="order-list"><li v-for="order in orders" :key="order.id"><strong>{{ money(order.total) }}</strong><small>{{ new Date(order.timestamp).toLocaleString() }}</small><button @click="send('reorder', { id: order.id })">Reorder</button></li></ul></details>
    <p role="status">{{ confirmation }}</p>
  </main>
</template>
