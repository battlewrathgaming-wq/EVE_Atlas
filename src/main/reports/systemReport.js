const {
  parsePastSeconds,
  formatWindow,
  table,
  printSection,
  sampleStatus,
  formatTypeLabel,
  formatEntityLabel,
  formatSystemLabel,
  buildEvidenceWindow,
  evidenceWindowClause,
  formatEvidenceWindow
} = require('./reportUtils');

function buildSystemReport(db, systemNameOrId, options = {}) {
  const system = resolveSystem(db, systemNameOrId);
  const evidenceWindow = buildEvidenceWindow(options);
  const killmailWindow = evidenceWindowClause(evidenceWindow, 'killmail_time');
  const activityWindow = evidenceWindowClause(evidenceWindow, 'ae.killmail_time');
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
  `).all(`%/systemID/${system.solar_system_id}/%`);
  const zkillLogs = db.prepare(`
    SELECT *
    FROM api_request_logs
    WHERE provider = 'zkill' AND endpoint LIKE ?
    ORDER BY requested_at
  `).all(`%/systemID/${system.solar_system_id}/%`);
  const pastSecondsValues = [...new Set(zkillLogs.map((log) => parsePastSeconds(log.endpoint)).filter(Boolean))];
  const killmailRange = db.prepare(`
    SELECT MIN(killmail_time) AS earliest, MAX(killmail_time) AS latest, COUNT(*) AS count
    FROM killmails
    WHERE solar_system_id = ?
      ${killmailWindow.sql}
  `).get(system.solar_system_id, ...killmailWindow.params);
  const activityEventCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM activity_events ae
    WHERE ae.solar_system_id = ?
      ${activityWindow.sql}
  `).get(system.solar_system_id, ...activityWindow.params).count;
  const roleSplit = db.prepare(`
    SELECT role, COUNT(*) AS count
    FROM activity_events ae
    WHERE ae.solar_system_id = ?
      ${activityWindow.sql}
    GROUP BY role
    ORDER BY role
  `).all(system.solar_system_id, ...activityWindow.params);
  const timeline = db.prepare(`
    SELECT killmail_id, killmail_time
    FROM killmails
    WHERE solar_system_id = ?
      ${killmailWindow.sql}
    ORDER BY killmail_time DESC, killmail_id DESC
    LIMIT 20
  `).all(system.solar_system_id, ...killmailWindow.params);
  const repeatedCharacters = topEntities(db, system.solar_system_id, 'character', evidenceWindow);
  const repeatedCorps = topEntities(db, system.solar_system_id, 'corporation', evidenceWindow);
  const repeatedAlliances = topEntities(db, system.solar_system_id, 'alliance', evidenceWindow);
  const ships = db.prepare(`
    SELECT ae.ship_type_id,
           COALESCE(ae.ship_type_name, tm.type_name) AS ship_name,
           COALESCE(tm.group_name, 'unknown') AS group_name,
           COALESCE(tm.category_name, 'unknown') AS category_name,
           COUNT(*) AS appearances
    FROM activity_events ae
    LEFT JOIN type_metadata tm ON tm.type_id = ae.ship_type_id
    WHERE ae.solar_system_id = ? AND ae.ship_type_id IS NOT NULL
      ${activityWindow.sql}
    GROUP BY ae.ship_type_id, COALESCE(ae.ship_type_name, tm.type_name), COALESCE(tm.group_name, 'unknown'), COALESCE(tm.category_name, 'unknown')
    ORDER BY appearances DESC, ship_name ASC
    LIMIT 10
  `).all(system.solar_system_id, ...activityWindow.params);
  const warnings = db.prepare(`
    SELECT DISTINCT dqw.warning_type, dqw.message
    FROM data_quality_warnings dqw
    JOIN fetch_runs fr ON fr.run_id = dqw.run_id
    JOIN api_request_logs arl ON arl.run_id = fr.run_id
    WHERE arl.provider = 'zkill' AND arl.endpoint LIKE ?
    ORDER BY dqw.warning_type, dqw.message
  `).all(`%/systemID/${system.solar_system_id}/%`);
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
  const latestDiscoveredRefs = Math.max(...runs.map((run) => run.discovered_refs), 0);
  const status = evidenceSampleStatus({ evidenceCount: killmailRange.count, latestDiscoveredRefs, totals });

  return [
    `AURA Atlas System Evidence Report - ${status}`,
    `System: ${formatSystemLabel(system.solar_system_name, system.solar_system_id)}`,
    `Region/Constellation: ${system.region_name || 'unknown'} / ${system.constellation_name || 'unknown'}`,
    `Evidence window: ${formatEvidenceWindow(evidenceWindow)}`,
    `Expanded evidence range: ${killmailRange.earliest || 'none'} -> ${killmailRange.latest || 'none'}`,
    `Expanded sample: ${killmailRange.count} stored killmails matching system/time scope`,
    `Discovery provenance window(s): ${pastSecondsValues.length ? pastSecondsValues.map(formatWindow).join(', ') : 'unknown'}`,
    `Collection provenance runs: ${runs.length}`,
    `Collected at: ${runs[0]?.started_at || 'none'} -> ${runs[runs.length - 1]?.finished_at || 'none'}`,
    printSection('Evidence Footer', [
      `Stored evidence matching this scope: ${killmailRange.count} killmails / ${activityEventCount} activity events`,
      `Collection provenance systems scanned: ${zkillLogs.length}`,
      `Collection provenance zKill refs discovered: ${totals.discovered}`,
      `Collection provenance already cached: ${totals.cached}`,
      `Collection provenance expanded new: ${totals.expanded}`,
      `Collection provenance failed expansions: ${totals.failed}`,
      `Collection provenance activity events written: ${totals.events}`,
      'Collection provenance may include multiple run types; observation sections are filtered by stored evidence scope.',
      'Source: zKill discovery + ESI expanded killmails'
    ].join('\n')),
    printSection('Recent Killmail Timeline', table(timeline, [
      { label: 'Time', value: (row) => row.killmail_time },
      { label: 'Killmail', value: (row) => row.killmail_id }
    ])),
    printSection('Attacker/Victim Split', table(roleSplit, [
      { label: 'Role', value: (row) => row.role },
      { label: 'Events', value: (row) => row.count }
    ])),
    printSection('Repeated Pilots', table(repeatedCharacters, entityColumns())),
    printSection('Repeated Corporations', table(repeatedCorps, entityColumns())),
    printSection('Repeated Alliances', table(repeatedAlliances, entityColumns())),
    printSection('Common Ships', table(ships, [
      { label: 'Ship', value: (row) => formatTypeLabel(row.ship_name, row.ship_type_id) },
      { label: 'Group', value: (row) => row.group_name },
      { label: 'Category', value: (row) => row.category_name },
      { label: 'Appearances', value: (row) => row.appearances }
    ])),
    printSection('Warnings', warnings.length ? warnings.map((warning) => `${warning.warning_type}: ${warning.message}`).join('\n') : '(none)')
  ].join('\n');
}

function resolveSystem(db, value) {
  const numeric = Number(value);
  const row = Number.isInteger(numeric)
    ? db.prepare('SELECT * FROM solar_systems WHERE solar_system_id = ?').get(numeric)
    : db.prepare('SELECT * FROM solar_systems WHERE lower(solar_system_name) = lower(?)').get(String(value || '').trim());

  if (!row) {
    throw new Error(`No system found for ${value}`);
  }
  return row;
}

function topEntities(db, systemId, entityType, evidenceWindow = buildEvidenceWindow()) {
  const activityWindow = evidenceWindowClause(evidenceWindow, 'killmail_time');
  return db.prepare(`
    SELECT MAX(entity_name) AS entity_name, entity_id, entity_type,
           SUM(CASE WHEN role = 'attacker' THEN 1 ELSE 0 END) AS attacker_events,
           SUM(CASE WHEN role = 'victim' THEN 1 ELSE 0 END) AS victim_events,
           COUNT(*) AS appearances
    FROM activity_events
    WHERE solar_system_id = ? AND entity_type = ?
      ${activityWindow.sql}
    GROUP BY entity_type, entity_id
    HAVING COUNT(*) > 1
    ORDER BY appearances DESC, MAX(entity_name) ASC
    LIMIT 10
  `).all(systemId, entityType, ...activityWindow.params);
}

function entityColumns() {
  return [
    { label: 'Entity', value: (row) => formatEntityLabel(row.entity_name, row.entity_type, row.entity_id) },
    { label: 'Appearances', value: (row) => row.appearances },
    { label: 'Attacker', value: (row) => row.attacker_events },
    { label: 'Victim', value: (row) => row.victim_events }
  ];
}

function evidenceSampleStatus({ evidenceCount, latestDiscoveredRefs, totals }) {
  if (!evidenceCount && !latestDiscoveredRefs) {
    return 'NO DISCOVERY SAMPLE';
  }
  if (totals.capSkipped || totals.expanded + totals.failed < latestDiscoveredRefs) {
    return 'PARTIAL SAMPLE';
  }
  if (evidenceCount && !latestDiscoveredRefs) {
    return 'STORED EVIDENCE SAMPLE';
  }
  return sampleStatus({
    expandedCount: totals.expanded,
    discoveredRefs: latestDiscoveredRefs,
    failedExpansions: totals.failed
  });
}

module.exports = {
  buildSystemReport
};
