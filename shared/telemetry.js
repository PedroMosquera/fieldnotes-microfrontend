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

export function traceSummary(records) {
  return { total: records.length, rejected: records.filter(row => row.type === 'rejected').length,
    renders: records.filter(row => row.type === 'render').length,
    snapshots: records.filter(row => row.type === 'state').length };
}

export function revisionLag(shellRevision, childRevision) {
  return Math.max(0, shellRevision - Math.max(0, childRevision));
}

export function renderDelta(current, baseline) {
  return Object.fromEntries(Object.entries(current).map(([name, count]) => [name, Math.max(0, count - (baseline[name] || 0))]));
}

export function exportTrace(records, state) {
  return JSON.stringify({ schema: 1, revision: state.revision, events: records }, null, 2);
}

export function readyDuration(started, ready) {
  return Math.max(0, Math.round(ready - started));
}

