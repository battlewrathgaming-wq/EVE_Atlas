function parsePastSeconds(endpoint) {
  const match = String(endpoint || '').match(/\/pastSeconds\/(\d+)\//);
  return match ? Number(match[1]) : null;
}

function parseSystemId(endpoint) {
  const match = String(endpoint || '').match(/\/systemID\/(\d+)\//);
  return match ? Number(match[1]) : null;
}

function formatWindow(seconds) {
  if (!seconds) {
    return 'unknown';
  }
  const hours = seconds / 3600;
  return Number.isInteger(hours) ? `${seconds} seconds / ${hours} hours` : `${seconds} seconds`;
}

function table(rows, columns) {
  if (!rows.length) {
    return '(none)';
  }

  const widths = columns.map((column) => Math.max(
    column.label.length,
    ...rows.map((row) => String(column.value(row) ?? '').length)
  ));
  const header = columns.map((column, index) => column.label.padEnd(widths[index])).join('  ');
  const divider = widths.map((width) => '-'.repeat(width)).join('  ');
  const body = rows.map((row) => columns
    .map((column, index) => String(column.value(row) ?? '').padEnd(widths[index]))
    .join('  '));

  return [header, divider, ...body].join('\n');
}

function printSection(title, body) {
  return `\n${title}\n${'='.repeat(title.length)}\n${body}`;
}

function sampleStatus({ expandedCount, discoveredRefs, failedExpansions }) {
  if (!discoveredRefs) {
    return 'NO DISCOVERY SAMPLE';
  }
  if (expandedCount + failedExpansions < discoveredRefs) {
    return 'PARTIAL SAMPLE';
  }
  return 'COMPLETE EXPANDED SAMPLE';
}

function formatTypeLabel(name, id) {
  if (name) {
    return `${name} [typeID: ${id}]`;
  }
  return `typeID ${id} [unresolved]`;
}

function formatEntityLabel(name, entityType, id) {
  const idLabel = entityIdLabel(entityType);
  if (name) {
    return `${name} [${idLabel}: ${id}]`;
  }
  return `${idLabel} ${id} [unresolved]`;
}

function formatSystemLabel(name, id) {
  if (name) {
    return `${name} [solarSystemID: ${id}]`;
  }
  return `solarSystemID ${id} [unresolved]`;
}

function entityIdLabel(entityType) {
  const labels = {
    character: 'characterID',
    corporation: 'corporationID',
    alliance: 'allianceID'
  };
  return labels[entityType] || `${entityType}ID`;
}

function buildEvidenceWindow(options = {}) {
  const end = options.evidenceEnd || null;
  let start = options.evidenceStart || null;
  const lookbackSeconds = options.lookbackSeconds ? Number(options.lookbackSeconds) : null;

  if (lookbackSeconds && !start) {
    const anchor = end ? new Date(end) : new Date();
    start = new Date(anchor.getTime() - (lookbackSeconds * 1000)).toISOString();
  }

  return {
    start,
    end,
    lookbackSeconds
  };
}

function evidenceWindowClause(evidenceWindow, column) {
  const conditions = [];
  const params = [];
  if (evidenceWindow.start) {
    conditions.push(`${column} >= ?`);
    params.push(evidenceWindow.start);
  }
  if (evidenceWindow.end) {
    conditions.push(`${column} <= ?`);
    params.push(evidenceWindow.end);
  }
  return {
    sql: conditions.length ? `AND ${conditions.join(' AND ')}` : '',
    params
  };
}

function formatEvidenceWindow(evidenceWindow) {
  if (evidenceWindow.start && evidenceWindow.end) {
    return `${evidenceWindow.start} -> ${evidenceWindow.end}`;
  }
  if (evidenceWindow.start) {
    return `${evidenceWindow.start} -> now`;
  }
  if (evidenceWindow.end) {
    return `all stored evidence through ${evidenceWindow.end}`;
  }
  return 'all stored evidence';
}

module.exports = {
  parsePastSeconds,
  parseSystemId,
  formatWindow,
  table,
  printSection,
  sampleStatus,
  formatTypeLabel,
  formatEntityLabel,
  formatSystemLabel,
  entityIdLabel,
  buildEvidenceWindow,
  evidenceWindowClause,
  formatEvidenceWindow
};
