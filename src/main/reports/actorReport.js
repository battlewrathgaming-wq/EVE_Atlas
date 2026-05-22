const {
  parsePastSeconds,
  formatWindow,
  table,
  printSection,
  sampleStatus,
  formatEntityLabel,
  formatTypeLabel,
  formatSystemLabel,
  buildEvidenceWindow,
  evidenceWindowClause,
  formatEvidenceWindow
} = require('./reportUtils');

const VALID_ENTITY_TYPES = new Set(['character', 'corporation', 'alliance']);

function buildActorReport(db, input, options = {}) {
  const actor = resolveActor(db, input);
  const evidenceWindow = buildEvidenceWindow(options);
  const scope = actorScope(db, actor, evidenceWindow);
  const status = actorSampleStatus(scope);

  return [
    `AURA Atlas Actor Evidence Report - ${status}`,
    `Actor: ${formatEntityLabel(actor.entity_name, actor.entity_type, actor.entity_id)}`,
    `Evidence window: ${formatEvidenceWindow(evidenceWindow)}`,
    `Expanded evidence range: ${scope.killmailRange.earliest || 'none'} -> ${scope.killmailRange.latest || 'none'}`,
    `Basis: ${scope.killmailRange.count} expanded killmails / ${scope.activityEventCount} actor activity events matching actor/time scope`,
    `Discovery provenance window(s): ${scope.pastSecondsValues.length ? scope.pastSecondsValues.map(formatWindow).join(', ') : 'unknown'}`,
    `Collection provenance runs: ${scope.runs.length}`,
    `Collected at: ${scope.runs[0]?.started_at || 'none'} -> ${scope.runs[scope.runs.length - 1]?.finished_at || 'none'}`,
    `Interpretation: actor appearances are stored killmail evidence within scope, not proof of current location, intent, staging, ownership, or affiliation.`,
    printSection('Evidence Footer', [
      `Stored evidence matching this scope: ${scope.killmailRange.count} killmails / ${scope.activityEventCount} actor activity events`,
      `Collection provenance zKill requests: ${scope.zkillLogs.length}`,
      `Collection provenance zKill refs discovered: ${scope.totals.discovered}`,
      `Collection provenance already cached: ${scope.totals.cached}`,
      `Collection provenance expanded new: ${scope.totals.expanded}`,
      `Collection provenance failed expansions: ${scope.totals.failed}`,
      `Collection provenance activity events written: ${scope.totals.events}`,
      `Collection provenance API calls: zkill ${scope.apiCalls.zkill || 0} / esi ${scope.apiCalls.esi || 0}`,
      'Collection provenance may include multiple run types; intelligence sections are filtered by stored evidence scope.',
      'Source: zKill discovery + ESI expanded killmails'
    ].join('\n')),
    printSection('Actor Role Split', table(scope.roleSplit, [
      { label: 'Role', value: (row) => row.role },
      { label: 'Events', value: (row) => row.count }
    ])),
    printSection('Observed Systems', table(scope.systemRows, [
      { label: 'System', value: (row) => formatSystemLabel(row.solar_system_name, row.solar_system_id) },
      { label: 'Constellation', value: (row) => row.constellation_name || 'unknown' },
      { label: 'Region', value: (row) => row.region_name || 'unknown' },
      { label: 'Appearances', value: (row) => row.appearances },
      { label: 'First Observed', value: (row) => row.first_observed },
      { label: 'Last Observed', value: (row) => row.last_observed }
    ])),
    printSection('Observed Ships', table(scope.shipRows, [
      { label: 'Ship', value: (row) => formatTypeLabel(row.ship_name, row.ship_type_id) },
      { label: 'Role', value: (row) => row.role },
      { label: 'Appearances', value: (row) => row.appearances }
    ])),
    printSection('Event-Time Corporations', table(scope.corporationRows, associatedEntityColumns('corporation'))),
    printSection('Event-Time Alliances', table(scope.allianceRows, associatedEntityColumns('alliance'))),
    printSection('Recent Timeline', table(scope.timeline, [
      { label: 'Time', value: (row) => row.killmail_time },
      { label: 'Killmail', value: (row) => row.killmail_id },
      { label: 'Role', value: (row) => row.role },
      { label: 'System', value: (row) => formatSystemLabel(row.solar_system_name, row.solar_system_id) },
      { label: 'Region', value: (row) => row.region_name || 'unknown' },
      { label: 'Ship', value: (row) => formatTypeLabel(row.ship_name, row.ship_type_id) }
    ])),
    printSection('Warnings', scope.warnings.length ? scope.warnings.map((warning) => `${warning.warning_type}: ${warning.message}`).join('\n') : '(none)')
  ].join('\n');
}

function actorScope(db, actor, evidenceWindow) {
  const endpointPattern = `%/${routeModifier(actor.entity_type)}/${actor.entity_id}/%`;
  const activityWindow = evidenceWindowClause(evidenceWindow, 'ae.killmail_time');
  const killmailWindow = evidenceWindowClause(evidenceWindow, 'k.killmail_time');
  const runs = db.prepare(`
    SELECT fr.*
    FROM fetch_runs fr
    WHERE EXISTS (
      SELECT 1
      FROM api_request_logs arl
      WHERE arl.run_id = fr.run_id
        AND arl.provider = 'zkill'
        AND arl.endpoint LIKE ?
    )
    ORDER BY fr.started_at
  `).all(endpointPattern);
  const runIds = runs.map((run) => run.run_id);
  const zkillLogs = db.prepare(`
    SELECT *
    FROM api_request_logs
    WHERE provider = 'zkill' AND endpoint LIKE ?
    ORDER BY requested_at
  `).all(endpointPattern);
  const pastSecondsValues = [...new Set(zkillLogs.map((log) => parsePastSeconds(log.endpoint)).filter(Boolean))];
  const killmailRange = db.prepare(`
    SELECT MIN(k.killmail_time) AS earliest, MAX(k.killmail_time) AS latest, COUNT(DISTINCT k.killmail_id) AS count
    FROM killmails k
    JOIN activity_events ae ON ae.killmail_id = k.killmail_id
    WHERE ae.entity_type = ? AND ae.entity_id = ?
      ${activityWindow.sql}
      ${killmailWindow.sql}
  `).get(actor.entity_type, actor.entity_id, ...activityWindow.params, ...killmailWindow.params);
  const activityEventCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM activity_events ae
    WHERE ae.entity_type = ? AND ae.entity_id = ?
      ${activityWindow.sql}
  `).get(actor.entity_type, actor.entity_id, ...activityWindow.params).count;
  const roleSplit = db.prepare(`
    SELECT ae.role, COUNT(*) AS count
    FROM activity_events ae
    WHERE ae.entity_type = ? AND ae.entity_id = ?
      ${activityWindow.sql}
    GROUP BY ae.role
    ORDER BY ae.role
  `).all(actor.entity_type, actor.entity_id, ...activityWindow.params);
  const systemRows = db.prepare(`
    SELECT ae.solar_system_id, ss.solar_system_name, ss.constellation_name, ss.region_name,
           COUNT(*) AS appearances,
           MIN(ae.killmail_time) AS first_observed,
           MAX(ae.killmail_time) AS last_observed
    FROM activity_events ae
    LEFT JOIN solar_systems ss ON ss.solar_system_id = ae.solar_system_id
    WHERE ae.entity_type = ? AND ae.entity_id = ?
      ${activityWindow.sql}
    GROUP BY ae.solar_system_id, ss.solar_system_name, ss.constellation_name, ss.region_name
    ORDER BY appearances DESC, last_observed DESC
  `).all(actor.entity_type, actor.entity_id, ...activityWindow.params);
  const shipRows = db.prepare(`
    SELECT ae.role, ae.ship_type_id, COALESCE(ae.ship_type_name, tm.type_name) AS ship_name, COUNT(*) AS appearances
    FROM activity_events ae
    LEFT JOIN type_metadata tm ON tm.type_id = ae.ship_type_id
    WHERE ae.entity_type = ? AND ae.entity_id = ? AND ae.ship_type_id IS NOT NULL
      ${activityWindow.sql}
    GROUP BY ae.role, ae.ship_type_id, COALESCE(ae.ship_type_name, tm.type_name)
    ORDER BY appearances DESC, ship_name ASC
  `).all(actor.entity_type, actor.entity_id, ...activityWindow.params);
  const corporationRows = associatedEntities(db, actor, 'corporation', evidenceWindow);
  const allianceRows = associatedEntities(db, actor, 'alliance', evidenceWindow);
  const timeline = db.prepare(`
    SELECT ae.killmail_time, ae.killmail_id, ae.role, ae.solar_system_id,
           ss.solar_system_name, ss.region_name,
           ae.ship_type_id, COALESCE(ae.ship_type_name, tm.type_name) AS ship_name
    FROM activity_events ae
    LEFT JOIN solar_systems ss ON ss.solar_system_id = ae.solar_system_id
    LEFT JOIN type_metadata tm ON tm.type_id = ae.ship_type_id
    WHERE ae.entity_type = ? AND ae.entity_id = ?
      ${activityWindow.sql}
    ORDER BY ae.killmail_time DESC, ae.killmail_id DESC
    LIMIT 20
  `).all(actor.entity_type, actor.entity_id, ...activityWindow.params);
  const warnings = runIds.length ? db.prepare(`
    SELECT DISTINCT warning_type, message
    FROM data_quality_warnings
    WHERE run_id IN (${runIds.map(() => '?').join(', ')})
    ORDER BY warning_type, message
  `).all(...runIds) : [];
  const apiCalls = runIds.length ? db.prepare(`
    SELECT provider, COUNT(*) AS count
    FROM api_request_logs
    WHERE run_id IN (${runIds.map(() => '?').join(', ')})
    GROUP BY provider
  `).all(...runIds).reduce((acc, row) => {
    acc[row.provider] = row.count;
    return acc;
  }, { zkill: 0, esi: 0 }) : { zkill: 0, esi: 0 };
  const totals = runs.reduce((acc, run) => {
    acc.discovered += run.discovered_refs;
    acc.cached += run.already_cached;
    acc.expanded += run.expanded_new;
    acc.failed += run.failed_expansions;
    acc.events += run.activity_events_written;
    if (run.error_summary && run.error_summary.includes('Expansion cap skipped')) {
      acc.capSkipped = true;
    }
    return acc;
  }, { discovered: 0, cached: 0, expanded: 0, failed: 0, events: 0, capSkipped: false });

  return {
    runs,
    zkillLogs,
    pastSecondsValues,
    killmailRange,
    activityEventCount,
    roleSplit,
    systemRows,
    shipRows,
    corporationRows,
    allianceRows,
    timeline,
    warnings,
    apiCalls,
    totals,
    latestDiscoveredRefs: runs[runs.length - 1]?.discovered_refs || 0
  };
}

function associatedEntities(db, actor, associatedType, evidenceWindow) {
  const activityWindow = evidenceWindowClause(evidenceWindow, 'actor_events.killmail_time');
  const idColumn = associatedType === 'corporation' ? 'corporation_id' : 'alliance_id';
  const nameColumn = associatedType === 'corporation' ? 'corporation_name' : 'alliance_name';
  return db.prepare(`
    SELECT actor_events.${idColumn} AS entity_id,
           MAX(actor_events.${nameColumn}) AS entity_name,
           COUNT(*) AS appearances,
           MIN(actor_events.killmail_time) AS first_observed,
           MAX(actor_events.killmail_time) AS last_observed
    FROM activity_events actor_events
    WHERE actor_events.entity_type = ? AND actor_events.entity_id = ?
      AND actor_events.${idColumn} IS NOT NULL
      ${activityWindow.sql}
    GROUP BY actor_events.${idColumn}
    ORDER BY appearances DESC, entity_name ASC
  `).all(actor.entity_type, actor.entity_id, ...activityWindow.params)
    .map((row) => ({ ...row, entity_type: associatedType }));
}

function associatedEntityColumns(entityType) {
  return [
    { label: 'Entity', value: (row) => formatEntityLabel(row.entity_name, entityType, row.entity_id) },
    { label: 'Appearances', value: (row) => row.appearances },
    { label: 'First Observed', value: (row) => row.first_observed },
    { label: 'Last Observed', value: (row) => row.last_observed }
  ];
}

function resolveActor(db, input) {
  const entityType = String(input?.entityType || input?.entity_type || '').toLowerCase();
  if (!VALID_ENTITY_TYPES.has(entityType)) {
    throw new Error('Actor report entity type must be character, corporation, or alliance');
  }
  const entityId = Number(input?.entityId ?? input?.entity_id);
  if (!Number.isInteger(entityId) || entityId <= 0) {
    throw new Error('Actor report entity ID must be a positive integer');
  }
  const watch = db.prepare(`
    SELECT entity_name
    FROM watchlist_entities
    WHERE entity_type = ? AND entity_id = ?
  `).get(entityType, entityId);
  const known = db.prepare(`
    SELECT entity_name
    FROM entities
    WHERE entity_type = ? AND entity_id = ?
  `).get(entityType, entityId);

  return {
    entity_type: entityType,
    entity_id: entityId,
    entity_name: input?.entityName || input?.entity_name || watch?.entity_name || known?.entity_name || null
  };
}

function routeModifier(entityType) {
  return {
    character: 'characterID',
    corporation: 'corporationID',
    alliance: 'allianceID'
  }[entityType];
}

function actorSampleStatus(scope) {
  if (!scope.killmailRange.count && !scope.latestDiscoveredRefs) {
    return 'NO DISCOVERY SAMPLE';
  }
  if (scope.totals.capSkipped || scope.totals.expanded + scope.totals.failed < scope.latestDiscoveredRefs) {
    return 'PARTIAL SAMPLE';
  }
  if (scope.killmailRange.count && !scope.latestDiscoveredRefs) {
    return 'STORED EVIDENCE SAMPLE';
  }
  return sampleStatus({
    expandedCount: scope.totals.expanded,
    discoveredRefs: scope.latestDiscoveredRefs,
    failedExpansions: scope.totals.failed
  });
}

module.exports = {
  buildActorReport,
  actorScope
};
