export const CHANNEL = 'fieldnotes-v2';
export const APPS = ['react', 'vue', 'svelte', 'qwik'];
export const capabilities = {
  react: ['add', 'favorite', 'view', 'compare'],
  vue: ['add', 'remove', 'clear', 'coupon', 'checkout', 'reorder'],
  svelte: ['shipping', 'theme', 'density'],
  qwik: ['add', 'favorite', 'view'],
};
export const subscriptions = {
  react: ['favorites', 'compared', 'cart', 'tokens'],
  vue: ['cart', 'shipping', 'coupon', 'orders', 'tokens'],
  svelte: ['shipping', 'cart', 'tokens'],
  qwik: ['favorites', 'viewed', 'cart', 'tokens'],
};

export function validPayload(type, data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (['add', 'remove', 'favorite', 'view', 'compare', 'reorder'].includes(type)) return typeof data.id === 'string' && data.id.length <= 80;
  if (type === 'shipping') return [0, 500].includes(data.amount);
  if (type === 'theme') return ['forest', 'ocean', 'plum'].includes(data.value);
  if (type === 'density') return ['comfortable', 'compact'].includes(data.value);
  if (type === 'coupon') return typeof data.code === 'string' && data.code.length <= 30;
  if (type === 'resize') return Number.isFinite(data.height) && data.height >= 0 && data.height <= 10000;
  if (type === 'error') return typeof data.message === 'string' && data.message.length <= 500;
  if (type === 'snapshot-applied') return Number.isInteger(data.revision) && data.revision >= 0;
  return ['ready', 'render', 'clear', 'checkout', 'heartbeat', 'request-state'].includes(type);
}

export function envelope(source, type, payload = {}, id = globalThis.crypto.randomUUID()) {
  return { ...payload, channel: CHANNEL, version: 2, source, type, messageId: id };
}

export function validEnvelope(data) {
  return Boolean(data && data.channel === CHANNEL && data.version === 2
    && APPS.includes(data.source) && typeof data.messageId === 'string'
    && data.messageId.length > 0 && data.messageId.length <= 100
    && validPayload(data.type, data));
}

export function authorized(source, type) {
  return APPS.includes(source) && (capabilities[source].includes(type)
    || ['ready', 'render', 'resize', 'error', 'heartbeat', 'request-state', 'snapshot-applied'].includes(type));
}

