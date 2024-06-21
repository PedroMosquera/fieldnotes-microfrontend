<script>
  import { onMount, afterUpdate } from 'svelte';
  import { listen, send, rendered } from '../../shared/bridge.js';
  let selected = 0;
  let pulse = 0;
  let theme = 'forest';
  let density = 'comfortable';
  let itemCount = 0;
  let notice = '';
  onMount(() => {
    const cleanup = listen(message => {
      if (message.type === 'state') {
        selected = message.shipping;
        theme = message.tokens.theme;
        density = message.tokens.density;
        itemCount = Object.values(message.cart).reduce((sum, quantity) => sum + quantity, 0);
      }
      if (message.type === 'notice') notice = message.message;
      if (message.type === 'refresh') pulse++;
    });
    send('ready');
    return cleanup;
  });
  afterUpdate(rendered);
</script>

<main data-pulse={pulse}>
  <p class="muted">Delivery options. {itemCount} items in your basket.</p>
  <label class="delivery"><input type="radio" name="delivery" checked={selected === 0} on:change={() => { selected = 0; send('shipping', { amount: 0 }); }} /><span><strong>Standard delivery</strong><small>3 to 5 working days</small></span><strong>Free</strong></label>
  <label class="delivery"><input type="radio" name="delivery" checked={selected === 500} on:change={() => { selected = 500; send('shipping', { amount: 500 }); }} /><span><strong>Express delivery</strong><small>1 to 2 working days</small></span><strong>EUR 5</strong></label>
  <fieldset class="appearance"><legend>Shared appearance</legend><label>Color theme<select value={theme} on:change={event => send('theme', { value: event.currentTarget.value })}><option value="forest">Forest</option><option value="ocean">Ocean</option><option value="plum">Plum</option></select></label><label>Spacing<select value={density} on:change={event => send('density', { value: event.currentTarget.value })}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label></fieldset>
  <p class="muted">These preferences flow through the shell to every framework.</p>
  <p role="status">{notice}</p>
</main>
