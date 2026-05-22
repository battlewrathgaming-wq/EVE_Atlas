function manualActorDiscoverySummary(db, actor) {
  return manualDiscoverySummary(db, 'source_actor_type = ? AND source_actor_id = ?', [
    actor.entity_type,
    actor.entity_id
  ]);
}

function manualSystemDiscoverySummary(db, systemIds) {
  const ids = Array.isArray(systemIds) ? systemIds : [systemIds];
  if (!ids.length) {
    return emptySummary();
  }
  return manualDiscoverySummary(db, `source_system_id IN (${ids.map(() => '?').join(', ')})`, ids);
}

function manualDiscoverySummary(db, scopeWhere, scopeParams) {
  const rows = db.prepare(`
    SELECT discovered_by_type, status, COUNT(*) AS count
    FROM discovered_killmail_refs
    WHERE discovered_by_type IN ('manual_actor', 'manual_system', 'manual_radius')
      AND ${scopeWhere}
    GROUP BY discovered_by_type, status
    ORDER BY discovered_by_type, status
  `).all(...scopeParams);
  const summary = rows.reduce((acc, row) => {
    acc.total += row.count;
    acc[row.status] = (acc[row.status] || 0) + row.count;
    acc.routes.add(row.discovered_by_type);
    return acc;
  }, emptySummary());
  summary.routes = [...summary.routes];
  return summary;
}

function manualDiscoveryProvenanceLines(summary) {
  const routes = Array.isArray(summary.routes) ? summary.routes : [...summary.routes];
  return [
    `Manual discovery route(s): ${routes.length ? routes.join(', ') : 'none'}`,
    `Manual discovery refs queued: ${summary.total}`,
    `Manual discovery queue: ${summary.expanded || 0} expanded / ${summary.cached || 0} cached / ${summary.pending || 0} pending / ${summary.failed || 0} failed`
  ];
}

function emptySummary() {
  return {
    total: 0,
    pending: 0,
    expanded: 0,
    cached: 0,
    failed: 0,
    superseded: 0,
    routes: new Set()
  };
}

module.exports = {
  manualActorDiscoverySummary,
  manualSystemDiscoverySummary,
  manualDiscoveryProvenanceLines
};
