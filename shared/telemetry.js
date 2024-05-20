export function createTrace(limit = 160) {
  let records = [];
  return {
    add(record) { records = [{ ...record, timestamp: record.timestamp ?? Date.now() }, ...records].slice(0, limit); },
    list: () => structuredClone(records),
    clear() { records = []; },
  };
}

export function filterTrace(records, source = 'all', search = '') {
  const query = search.toLowerCase();
  return records.filter(record => (source === 'all' || record.source === source)
    && `${record.type} ${record.detail || ''}`.toLowerCase().includes(query));
}

