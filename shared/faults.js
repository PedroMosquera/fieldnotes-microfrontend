export function defaultFault() {
  return { mode: 'normal', delay: 1200, held: null, sent: 0, dropped: 0 };
}

export function configureFault(fault, mode, delay = 1200) {
  const valid = ['normal', 'delay', 'drop', 'duplicate', 'reorder', 'pause'];
  return { ...fault, mode: valid.includes(mode) ? mode : 'normal', delay: Math.max(0, Math.min(5000, Number(delay) || 0)), held: null };
}

