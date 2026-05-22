const {
  table,
  printSection,
  formatEntityLabel,
  formatSystemLabel
} = require('./reportUtils');

const VALID_STATUSES = new Set(['pending', 'expanded', 'cached', 'failed', 'superseded']);

function buildQueueReport(db, options = {}) {
  const filter = queueFilter(options);
  const scope = queueScope(db, filter);

  return [
    'AURA Atlas Discovery Queue Report',
    `Scope: ${scopeLabel(scope)}`,
    `Status filter: ${filter.status || 'all'}`,
    `Queued refs: ${scope.totalRefs}`,
    `Pending refs: ${scope.pendingCount}`,
    `Failed refs: ${scope.failedCount}`,
    `Next expansion candidates shown: ${scope.nextCandidates.length}`,
    'Classification: discovery refs are staging/provenance metadata, not killmail evidence.',
    printSection('Status Totals', table(scope.statusRows, [
      { label: 'Status', value: (row) => row.status },
      { label: 'Refs', value: (row) => row.count },
      { label: 'Oldest Seen', value: (row) => row.oldest_seen },
      { label: 'Newest Seen', value: (row) => row.newest_seen }
    ])),
    printSection('Scope Totals', table(scope.scopeRows, [
      { label: 'Discovery Type', value: (row) => row.discovered_by_type },
      { label: 'Discovery ID', value: (row) => row.discovered_by_id },
      { label: 'Status', value: (row) => row.status },
      { label: 'Refs', value: (row) => row.count },
      { label: 'Oldest Seen', value: (row) => row.oldest_seen },
      { label: 'Newest Seen', value: (row) => row.newest_seen }
    ])),
    printSection('Next Pending Expansion Candidates', table(scope.nextCandidates, [
      { label: 'Killmail', value: (row) => row.killmail_id },
      { label: 'Hash', value: (row) => shortHash(row.killmail_hash) },
      { label: 'Source', value: (row) => sourceLabel(row) },
      { label: 'Priority', value: (row) => row.priority },
      { label: 'Discovered', value: (row) => row.discovered_at },
      { label: 'Last Seen Run', value: (row) => row.last_seen_run_id || 'none' },
      { label: 'Failures', value: (row) => row.failure_count },
      { label: 'Last Error', value: (row) => row.last_error || '' }
    ])),
    printSection('Recent Queue Activity', table(scope.recentRows, [
      { label: 'Killmail', value: (row) => row.killmail_id },
      { label: 'Status', value: (row) => row.status },
      { label: 'Source', value: (row) => sourceLabel(row) },
      { label: 'First Seen', value: (row) => row.discovered_at },
      { label: 'Last Seen', value: (row) => row.last_seen_at },
      { label: 'Expanded', value: (row) => row.expanded_at || '' },
      { label: 'Failed', value: (row) => row.failed_at || '' }
    ])),
    printSection('Evidence Boundary', [
      'Pending refs are not activity evidence.',
      'Reports derive intelligence only from expanded ESI killmails and normalized activity_events.',
      'ESI expansion should drain pending refs under cap before repeating discovery for the same scope.'
    ].join('\n'))
  ].join('\n');
}

function queueFilter(options) {
  const type = options.type ? String(options.type) : null;
  const id = options.id !== undefined && options.id !== null ? String(options.id) : null;
  const status = options.status ? String(options.status).toLowerCase() : null;
  const limit = Number(options.limit || 10);

  if (type && !['actor', 'system_radius'].includes(type)) {
    throw new Error('Queue report type must be actor or system_radius');
  }
  if (type && !id) {
    throw new Error('Queue report requires --id when --type is provided');
  }
  if (status && !VALID_STATUSES.has(status)) {
    throw new Error(`Queue report status must be one of ${[...VALID_STATUSES].join(', ')}`);
  }
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('Queue report limit must be a positive integer');
  }

  return { type, id, status, limit };
}

function queueScope(db, filter) {
  const where = [];
  const params = [];

  if (filter.type) {
    where.push('discovered_by_type = ?');
    params.push(filter.type);
  }
  if (filter.id) {
    where.push('discovered_by_id = ?');
    params.push(filter.id);
  }
  if (filter.status) {
    where.push('status = ?');
    params.push(filter.status);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const totalRefs = db.prepare(`SELECT COUNT(*) AS count FROM discovered_killmail_refs ${whereSql}`).get(...params).count;
  const pendingCount = countByStatus(db, whereSql, params, 'pending');
  const failedCount = countByStatus(db, whereSql, params, 'failed');

  const statusRows = db.prepare(`
    SELECT status, COUNT(*) AS count, MIN(discovered_at) AS oldest_seen, MAX(last_seen_at) AS newest_seen
    FROM discovered_killmail_refs
    ${whereSql}
    GROUP BY status
    ORDER BY status
  `).all(...params);

  const scopeRows = db.prepare(`
    SELECT discovered_by_type, discovered_by_id, status, COUNT(*) AS count,
           MIN(discovered_at) AS oldest_seen, MAX(last_seen_at) AS newest_seen
    FROM discovered_killmail_refs
    ${whereSql}
    GROUP BY discovered_by_type, discovered_by_id, status
    ORDER BY discovered_by_type, discovered_by_id, status
  `).all(...params);

  const nextWhere = [...where, "status IN ('pending', 'failed')"];
  const nextParams = [...params, filter.limit];
  const nextCandidates = decorateSourceLabels(db, db.prepare(`
    SELECT *
    FROM discovered_killmail_refs
    WHERE ${nextWhere.join(' AND ')}
    ORDER BY status = 'failed', priority ASC, discovered_at ASC, killmail_id ASC
    LIMIT ?
  `).all(...nextParams));

  const recentRows = decorateSourceLabels(db, db.prepare(`
    SELECT *
    FROM discovered_killmail_refs
    ${whereSql}
    ORDER BY last_seen_at DESC, discovered_at DESC, killmail_id DESC
    LIMIT ?
  `).all(...params, filter.limit));

  return {
    filter,
    totalRefs,
    pendingCount,
    failedCount,
    statusRows,
    scopeRows,
    nextCandidates,
    recentRows
  };
}

function countByStatus(db, whereSql, params, status) {
  const conjunction = whereSql ? 'AND' : 'WHERE';
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM discovered_killmail_refs
    ${whereSql} ${conjunction} status = ?
  `).get(...params, status).count;
}

function scopeLabel(scope) {
  const { filter } = scope;
  if (!filter.type) {
    return 'all discovery refs';
  }
  return `${filter.type}:${filter.id}`;
}

function sourceLabel(row) {
  if (row.source_label) {
    return row.source_label;
  }
  if (row.source_actor_type && row.source_actor_id) {
    return formatEntityLabel(null, row.source_actor_type, row.source_actor_id);
  }
  if (row.source_system_id) {
    return formatSystemLabel(null, row.source_system_id);
  }
  return row.source_scope || `${row.discovered_by_type}:${row.discovered_by_id}`;
}

function decorateSourceLabels(db, rows) {
  return rows.map((row) => {
    if (row.source_actor_type && row.source_actor_id) {
      const entity = resolveEntityName(db, row.source_actor_type, row.source_actor_id);
      return {
        ...row,
        source_label: formatEntityLabel(entity, row.source_actor_type, row.source_actor_id)
      };
    }
    if (row.source_system_id) {
      const system = db.prepare(`
        SELECT solar_system_name
        FROM solar_systems
        WHERE solar_system_id = ?
      `).get(row.source_system_id);
      return {
        ...row,
        source_label: formatSystemLabel(system?.solar_system_name, row.source_system_id)
      };
    }
    return row;
  });
}

function resolveEntityName(db, entityType, entityId) {
  const known = db.prepare(`
    SELECT entity_name
    FROM entities
    WHERE entity_type = ? AND entity_id = ?
  `).get(entityType, entityId);
  if (known?.entity_name) {
    return known.entity_name;
  }
  const watch = db.prepare(`
    SELECT entity_name
    FROM watchlist_entities
    WHERE entity_type = ? AND entity_id = ?
  `).get(entityType, entityId);
  return watch?.entity_name || null;
}

function shortHash(hash) {
  const text = String(hash || '');
  if (text.length <= 12) {
    return text;
  }
  return `${text.slice(0, 12)}...`;
}

module.exports = {
  buildQueueReport
};
