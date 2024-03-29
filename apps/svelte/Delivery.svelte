<script>
  import { onMount, afterUpdate } from 'svelte';
  import { listen, send, rendered } from '../../shared/bridge.js';
  let selected = 0;
  let pulse = 0;
  onMount(() => {
    const cleanup = listen(message => {
      if (message.type === 'state') selected = message.shipping;
      if (message.type === 'refresh') pulse++;
    });
    send('ready');
    return cleanup;
  });
  afterUpdate(rendered);
</script>

<main data-pulse={pulse}>
  <p class="muted">Delivery options.</p>
  <label class="delivery"><input type="radio" name="delivery" checked={selected === 0} on:change={() => { selected = 0; send('shipping', { amount: 0 }); }} /><span><strong>Standard delivery</strong><small>3 to 5 working days</small></span><strong>Free</strong></label>
  <label class="delivery"><input type="radio" name="delivery" checked={selected === 500} on:change={() => { selected = 500; send('shipping', { amount: 500 }); }} /><span><strong>Express delivery</strong><small>1 to 2 working days</small></span><strong>EUR 5</strong></label>
</main>
