export function createTrace(limit = 160) {
  let records = [];
  return {
    add(record) { records = [{ ...record, timestamp: record.timestamp ?? Date.now() }, ...records].slice(0, limit); },
    list: () => structuredClone(records),
    clear() { records = []; },
  };
}

