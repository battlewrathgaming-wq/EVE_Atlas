const VALID_SELECTION_MODES = new Set(['selected', 'next', 'oldest', 'newest', 'priority']);
const SELECTABLE_STATUSES = new Set(['pending', 'failed']);

function buildQueueExpansionSelection(db, input = {}) {
  const filter = normalizeSelectionFilter(input);
  const rows = queueRows(db, filter);
  const selected = selectRows(rows, filter);
  const selectedKeys = new Set(selected.map(rowKey));
  const annotated = rows.map((row) => ({
    ...displayRow(db, row),
    selected_for_expansion: selectedKeys.has(rowKey(row)),
    skip_reason: skipReason(row, filter, selectedKeys)
  }));

  return {
    classification: 'queue-selection-preview',
    evidence_boundary: 'Queued zKill refs and preview fields are discovery/provenance metadata, not killmail evidence.',
    selection: {
      mode: filter.mode,
      max_expansions: filter.maxExpansions,
      discovered_by_type: filter.discoveredByType,
      discovered_by_id: filter.discoveredById,
      selected_killmail_ids: filter.killmailIds
    },
    counts: {
      candidates_considered: rows.length,
      selectable: rows.filter((row) => SELECTABLE_STATUSES.has(row.status)).length,
      selected_for_expansion: selected.length,
      expected_esi_calls: selected.length,
      pending: rows.filter((row) => row.status === 'pending').length,
      failed: rows.filter((row) => row.status === 'failed').length,
      cached: rows.filter((row) => row.status === 'cached').length,
      expanded: rows.filter((row) => row.status === 'expanded').length,
      superseded: rows.filter((row) => row.status === 'superseded').length
    },
    preview_fields: [
      'killmail_time',
      'victim_ship_type_id',
      'attacker_count',
      'zkill_total_value'
    ],
    refs: annotated
  };
}

function normalizeSelectionFilter(input) {
  const mode = String(input.mode || 'next').toLowerCase();
  if (!VALID_SELECTION_MODES.has(mode)) {
    throw new Error(`Queue selection mode must be one of ${[...VALID_SELECTION_MODES].join(', ')}`);
  }
  const discoveredByType = input.discoveredByType || input.type || null;
  const discoveredById = input.discoveredById !== undefined && input.discoveredById !== null
    ? String(input.discoveredById)
    : input.id !== undefined && input.id !== null ? String(input.id) : null;
  const killmailIds = (input.killmailIds || []).map((id) => positiveInteger(id, 'killmailIds'));
  if (mode === 'selected' && !killmailIds.length) {
    throw new Error('Selected queue expansion mode requires killmailIds');
  }
  return {
    mode,
    discoveredByType,
    discoveredById,
    killmailIds,
    maxExpansions: positiveInteger(input.maxExpansions ?? input.limit ?? 2, 'maxExpansions'),
    includeStatuses: input.includeStatuses || ['pending', 'failed', 'cached', 'expanded']
  };
}

function queueRows(db, filter) {
  const where = [];
  const params = [];
  if (filter.discoveredByType) {
    where.push('discovered_by_type = ?');
    params.push(filter.discoveredByType);
  }
  if (filter.discoveredById) {
    where.push('discovered_by_id = ?');
    params.push(filter.discoveredById);
  }
  if (filter.killmailIds.length) {
    where.push(`killmail_id IN (${filter.killmailIds.map(() => '?').join(', ')})`);
    params.push(...filter.killmailIds);
  }
  if (filter.includeStatuses.length) {
    where.push(`status IN (${filter.includeStatuses.map(() => '?').join(', ')})`);
    params.push(...filter.includeStatuses);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = orderSqlForMode(filter.mode);
  return db.prepare(`
    SELECT *
    FROM discovered_killmail_refs
    ${whereSql}
    ${orderSql}
    LIMIT ?
  `).all(...params, Math.max(filter.maxExpansions * 5, filter.killmailIds.length || 20));
}

function selectRows(rows, filter) {
  return rows
    .filter((row) => SELECTABLE_STATUSES.has(row.status))
    .filter((row) => !filter.killmailIds.length || filter.killmailIds.includes(row.killmail_id))
    .slice(0, filter.maxExpansions);
}

function displayRow(db, row) {
  const preview = parsePreview(row.preview_json);
  return {
    killmail_id: row.killmail_id,
    hash: row.killmail_hash,
    status: row.status,
    discovered_by_type: row.discovered_by_type,
    discovered_by_id: row.discovered_by_id,
    source: sourceLabel(db, row),
    priority: row.priority,
    discovered_at: row.discovered_at,
    last_seen_at: row.last_seen_at,
    selected_for_expansion_at: row.selected_for_expansion_at,
    expanded_at: row.expanded_at,
    failed_at: row.failed_at,
    failure_count: row.failure_count,
    last_error: row.last_error,
    preview_source: preview ? 'zkill_discovery_preview' : null,
    preview_is_evidence: false,
    preview: previewFields(preview)
  };
}

function previewFields(preview) {
  if (!preview) {
    return null;
  }
  return {
    killmail_time: preview.killmail_time || null,
    victim_ship_type_id: preview.victim?.ship_type_id || null,
    attacker_count: preview.attacker_count ?? null,
    zkill_total_value: preview.zkb?.totalValue ?? null
  };
}

function sourceLabel(db, row) {
  if (row.source_actor_type && row.source_actor_id) {
    const entity = db.prepare(`
      SELECT entity_name
      FROM entities
      WHERE entity_type = ? AND entity_id = ?
    `).get(row.source_actor_type, row.source_actor_id);
    return {
      type: row.source_actor_type,
      id: row.source_actor_id,
      label: entity?.entity_name || null
    };
  }
  if (row.source_system_id) {
    const system = db.prepare(`
      SELECT solar_system_name
      FROM solar_systems
      WHERE solar_system_id = ?
    `).get(row.source_system_id);
    return {
      type: 'system',
      id: row.source_system_id,
      label: system?.solar_system_name || null
    };
  }
  return {
    type: row.discovered_by_type,
    id: row.discovered_by_id,
    label: row.source_scope || null
  };
}

function skipReason(row, filter, selectedKeys) {
  if (selectedKeys.has(rowKey(row))) {
    return null;
  }
  if (row.status === 'cached') {
    return 'cached';
  }
  if (row.status === 'expanded') {
    return 'expanded';
  }
  if (row.status === 'superseded') {
    return 'superseded';
  }
  if (filter.killmailIds.length && !filter.killmailIds.includes(row.killmail_id)) {
    return 'not_selected';
  }
  if (SELECTABLE_STATUSES.has(row.status)) {
    return 'cap_skipped';
  }
  return 'not_selectable';
}

function orderSqlForMode(mode) {
  if (mode === 'newest') {
    return 'ORDER BY discovered_at DESC, killmail_id DESC';
  }
  if (mode === 'oldest') {
    return 'ORDER BY discovered_at ASC, killmail_id ASC';
  }
  if (mode === 'priority' || mode === 'next' || mode === 'selected') {
    return "ORDER BY status = 'failed', priority ASC, discovered_at ASC, killmail_id ASC";
  }
  return 'ORDER BY discovered_at ASC, killmail_id ASC';
}

function rowKey(row) {
  return `${row.killmail_id}:${row.killmail_hash}:${row.discovered_by_type}:${row.discovered_by_id}`;
}

function parsePreview(value) {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return number;
}

module.exports = {
  buildQueueExpansionSelection,
  normalizeSelectionFilter
};
