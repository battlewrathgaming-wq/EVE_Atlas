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
const {
  activityCadenceRows,
  finalBlowRows,
  formatAggressorDetail,
  formatFinalBlowPilot,
  formatShip,
  formatUtcBucket,
  roleMix
} = require('./observationMetrics');

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
  const timeline = buildTimeline(db, system.solar_system_id, evidenceWindow);
  const repeatedCharacters = topEntities(db, system.solar_system_id, 'character', evidenceWindow);
  const repeatedCorps = topEntities(db, system.solar_system_id, 'corporation', evidenceWindow);
  const repeatedAlliances = topEntities(db, system.solar_system_id, 'alliance', evidenceWindow);
  const cadenceRows = activityCadenceRows(db, {
    systemId: system.solar_system_id
  }, { evidenceWindow });
  const finalBlowRowsForSystem = finalBlowRows(db, {
    systemId: system.solar_system_id
  }, { evidenceWindow });
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
      { label: 'Killmail', value: (row) => row.killmail_id },
      { label: 'Victim', value: (row) => row.victim_label || 'unknown' },
      { label: 'Victim Ship', value: (row) => formatTypeLabel(row.victim_ship_name, row.victim_ship_type_id) },
      { label: 'Observed Attacker', value: (row) => row.attacker_label || 'unknown' },
      { label: 'Attacker Ship', value: (row) => row.attacker_ship_type_id ? formatTypeLabel(row.attacker_ship_name, row.attacker_ship_type_id) : 'unknown' },
      { label: 'Aggressor Detail', value: formatAggressorDetail }
    ])),
    printSection('Attacker/Victim Split', table(roleSplit, [
      { label: 'Role', value: (row) => row.role },
      { label: 'Events', value: (row) => row.count }
    ])),
    printSection('Observed Activity Cadence', table(cadenceRows, [
      { label: 'UTC Bucket', value: formatUtcBucket },
      { label: 'Role Mix', value: roleMix },
      { label: 'Appearances', value: (row) => row.appearances },
      { label: 'Killmails', value: (row) => row.killmails }
    ])),
    printSection('Observed Final Blows', table(finalBlowRowsForSystem, [
      { label: 'Attacker', value: formatFinalBlowPilot },
      { label: 'Ship', value: formatShip },
      { label: 'Final Blows', value: (row) => row.final_blows },
      { label: 'Damage', value: (row) => row.damage_done },
      { label: 'Systems', value: (row) => row.unique_systems },
      { label: 'First Observed', value: (row) => row.first_observed },
      { label: 'Last Observed', value: (row) => row.last_observed }
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
    SELECT COALESCE(MAX(known.entity_name), MAX(ae.entity_name)) AS entity_name, ae.entity_id, ae.entity_type,
           SUM(CASE WHEN role = 'attacker' THEN 1 ELSE 0 END) AS attacker_events,
           SUM(CASE WHEN role = 'victim' THEN 1 ELSE 0 END) AS victim_events,
           COUNT(*) AS appearances
    FROM activity_events ae
    LEFT JOIN entities known
      ON known.entity_type = ae.entity_type AND known.entity_id = ae.entity_id
    WHERE ae.solar_system_id = ? AND ae.entity_type = ?
      ${activityWindow.sql}
    GROUP BY ae.entity_type, ae.entity_id
    HAVING COUNT(*) > 1
    ORDER BY appearances DESC, entity_name ASC
    LIMIT 10
  `).all(systemId, entityType, ...activityWindow.params);
}

function buildTimeline(db, systemId, evidenceWindow) {
  const killmailWindow = evidenceWindowClause(evidenceWindow, 'k.killmail_time');
  const killmails = db.prepare(`
    SELECT k.killmail_id, k.killmail_time
    FROM killmails k
    WHERE k.solar_system_id = ?
      ${killmailWindow.sql}
    ORDER BY k.killmail_time DESC, k.killmail_id DESC
    LIMIT 20
  `).all(systemId, ...killmailWindow.params);
  const victimStatement = db.prepare(`
    SELECT ae.entity_type, ae.entity_id, COALESCE(ae.entity_name, known.entity_name) AS entity_name,
           ae.ship_type_id, COALESCE(ae.ship_type_name, tm.type_name) AS ship_name
    FROM activity_events ae
    LEFT JOIN entities known ON known.entity_type = ae.entity_type AND known.entity_id = ae.entity_id
    LEFT JOIN type_metadata tm ON tm.type_id = ae.ship_type_id
    WHERE ae.killmail_id = ? AND ae.role = 'victim'
    ORDER BY CASE ae.entity_type WHEN 'character' THEN 0 WHEN 'corporation' THEN 1 ELSE 2 END
    LIMIT 1
  `);
  const attackerStatement = db.prepare(`
    SELECT ae.entity_type, ae.entity_id, COALESCE(ae.entity_name, known.entity_name) AS entity_name,
           ae.ship_type_id, COALESCE(ae.ship_type_name, tm.type_name) AS ship_name,
           ae.final_blow, ae.damage_done
    FROM activity_events ae
    LEFT JOIN entities known ON known.entity_type = ae.entity_type AND known.entity_id = ae.entity_id
    LEFT JOIN type_metadata tm ON tm.type_id = ae.ship_type_id
    WHERE ae.killmail_id = ? AND ae.role = 'attacker'
    ORDER BY ae.final_blow DESC,
             CASE ae.entity_type WHEN 'character' THEN 0 WHEN 'corporation' THEN 1 ELSE 2 END,
             ae.damage_done DESC
    LIMIT 1
  `);

  return killmails.map((killmail) => {
    const victim = victimStatement.get(killmail.killmail_id);
    const attacker = attackerStatement.get(killmail.killmail_id);
    return {
      ...killmail,
      victim_label: victim ? formatEntityLabel(victim.entity_name, victim.entity_type, victim.entity_id) : null,
      victim_ship_type_id: victim?.ship_type_id,
      victim_ship_name: victim?.ship_name,
      attacker_label: attacker ? formatEntityLabel(attacker.entity_name, attacker.entity_type, attacker.entity_id) : null,
      attacker_ship_type_id: attacker?.ship_type_id,
      attacker_ship_name: attacker?.ship_name,
      final_blow: attacker?.final_blow,
      damage_done: attacker?.damage_done
    };
  });
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
