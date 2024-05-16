export function defaultFault() {
  return { mode: 'normal', delay: 1200, held: null, sent: 0, dropped: 0 };
}

export function configureFault(fault, mode, delay = 1200) {
  const valid = ['normal', 'delay', 'drop', 'duplicate', 'reorder', 'pause'];
  return { ...fault, mode: valid.includes(mode) ? mode : 'normal', delay: Math.max(0, Math.min(5000, Number(delay) || 0)), held: null };
}

export function deliveryPlan(fault, message) {
  fault.sent++;
  if (['drop', 'pause'].includes(fault.mode)) { fault.dropped++; return []; }
  if (fault.mode === 'delay') return [{ message, delay: fault.delay }];
  if (fault.mode === 'duplicate') return [{ message, delay: 0 }, { message: structuredClone(message), delay: 100 }];
  if (fault.mode === 'reorder') {
    const previous = fault.held;
    fault.held = structuredClone(message);
    return previous ? [{ message, delay: 0 }, { message: previous, delay: 150 }] : [];
  }
  return [{ message, delay: 0 }];
}

export function retryDelay(attempt) {
  return Math.min(4000, 500 * 2 ** Math.max(0, Math.min(3, attempt)));
}

export function heartbeatStatus(lastSeen, now, threshold = 7000) {
  return now - lastSeen > threshold ? 'unresponsive' : 'responsive';
}

export function sameGeneration(expected, actual) {
  return Number.isInteger(expected) && expected === actual;
}

