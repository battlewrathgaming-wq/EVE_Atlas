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
const {
  manualSystemDiscoverySummary,
  manualDiscoveryProvenanceLines
} = require('./collectionProvenance');

function buildObservedOperatorsReport(db, systemNameOrId, options = {}) {
  const system = resolveSystem(db, systemNameOrId);
  const evidenceWindow = buildEvidenceWindow(options);
  const scope = systemScope(db, system.solar_system_id, { evidenceWindow });
  const repeatedRows = operatorReportCandidates(db, system.solar_system_id, { evidenceWindow });
  const status = evidenceSampleStatus({
    evidenceCount: scope.killmailRange.count,
    latestDiscoveredRefs: scope.latestDiscoveredRefs,
    totals: scope.totals
  });

  return [
    `AURA Atlas Observed Operators - ${status}`,
    `System: ${formatSystemLabel(system.solar_system_name, system.solar_system_id)}`,
    `Region/Constellation: ${system.region_name || 'unknown'} / ${system.constellation_name || 'unknown'}`,
    `Evidence window: ${formatEvidenceWindow(evidenceWindow)}`,
    `Expanded evidence range: ${scope.killmailRange.earliest || 'none'} -> ${scope.killmailRange.latest || 'none'}`,
    `Basis: ${scope.killmailRange.count} expanded killmails / ${scope.activityEventCount} activity events matching system/time scope`,
    `Discovery provenance window(s): ${scope.pastSecondsValues.length ? scope.pastSecondsValues.map(formatWindow).join(', ') : 'unknown'}`,
    `Collection provenance runs: ${scope.runs.length}`,
    `Collected at: ${scope.runs[0]?.started_at || 'none'} -> ${scope.runs[scope.runs.length - 1]?.finished_at || 'none'}`,
    `Interpretation: repeated attacker appearances are observation signals for further inspection, not proof of staging, ownership, or affiliation.`,
    printSection('Evidence Basis', [
      `Stored evidence matching this scope: ${scope.killmailRange.count} killmails / ${scope.activityEventCount} activity events`,
      'Source: zKill discovery + ESI expanded killmails'
    ].join('\n')),
    printSection('Collection Provenance', [
      `Collection provenance systems scanned: ${scope.zkillLogs.length}`,
      `Collection provenance zKill refs discovered: ${scope.totals.discovered}`,
      `Collection provenance already cached: ${scope.totals.cached}`,
      `Collection provenance expanded new: ${scope.totals.expanded}`,
      `Collection provenance failed expansions: ${scope.totals.failed}`,
      ...manualDiscoveryProvenanceLines(scope.manualDiscovery),
      'Collection provenance may include multiple run types; observation sections are filtered by stored evidence scope.'
    ].join('\n')),
    printSection('Observed Operators', table(repeatedRows, [
      { label: 'Type', value: (row) => row.entity_type },
      { label: 'Entity', value: (row) => formatEntityLabel(row.entity_name, row.entity_type, row.entity_id) },
      { label: 'Watchlisted', value: (row) => row.watchlisted ? 'yes' : 'no' },
      { label: 'Label', value: (row) => labelFor(row) },
      { label: 'Role Mix', value: (row) => roleMix(row) },
      { label: 'Appearances', value: (row) => row.appearances },
      { label: 'Systems', value: (row) => row.unique_systems },
      { label: 'First Observed', value: (row) => row.first_observed },
      { label: 'Last Observed', value: (row) => row.last_observed }
    ])),
    printSection('Associated Ships', table(shipRows(db, system.solar_system_id, evidenceWindow), [
      { label: 'Entity', value: (row) => formatEntityLabel(row.entity_name, row.entity_type, row.entity_id) },
      { label: 'Type', value: (row) => row.entity_type },
      { label: 'Ships', value: (row) => row.ships }
    ])),
    printSection('Warnings', scope.warnings.length ? scope.warnings.map((warning) => `${warning.warning_type}: ${warning.message}`).join('\n') : '(none)')
  ].join('\n');
}

function systemScope(db, systemId, options = {}) {
  const evidenceWindow = options.evidenceWindow || buildEvidenceWindow();
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
  `).all(`%/systemID/${systemId}/%`);
  const zkillLogs = db.prepare(`
    SELECT *
    FROM api_request_logs
    WHERE provider = 'zkill' AND endpoint LIKE ?
    ORDER BY requested_at
  `).all(`%/systemID/${systemId}/%`);
  const pastSecondsValues = [...new Set(zkillLogs.map((log) => parsePastSeconds(log.endpoint)).filter(Boolean))];
  const killmailRange = db.prepare(`
    SELECT MIN(killmail_time) AS earliest, MAX(killmail_time) AS latest, COUNT(*) AS count
    FROM killmails
    WHERE solar_system_id = ?
      ${killmailWindow.sql}
  `).get(systemId, ...killmailWindow.params);
  const activityEventCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM activity_events ae
    WHERE ae.solar_system_id = ?
      ${activityWindow.sql}
  `).get(systemId, ...activityWindow.params).count;
  const warnings = db.prepare(`
    SELECT DISTINCT dqw.warning_type, dqw.message
    FROM data_quality_warnings dqw
    JOIN fetch_runs fr ON fr.run_id = dqw.run_id
    JOIN api_request_logs arl ON arl.run_id = fr.run_id
    WHERE arl.provider = 'zkill' AND arl.endpoint LIKE ?
    ORDER BY dqw.warning_type, dqw.message
  `).all(`%/systemID/${systemId}/%`);
  const totals = runs.reduce((acc, run) => {
    acc.discovered += run.discovered_refs;
    acc.cached += run.already_cached;
    acc.expanded += run.expanded_new;
    acc.failed += run.failed_expansions;
    if (run.error_summary && run.error_summary.includes('Expansion cap skipped')) {
      acc.capSkipped = true;
    }
    return acc;
  }, { discovered: 0, cached: 0, expanded: 0, failed: 0, capSkipped: false });

  return {
    runs,
    zkillLogs,
    pastSecondsValues,
    killmailRange,
    activityEventCount,
    warnings,
    totals,
    manualDiscovery: manualSystemDiscoverySummary(db, systemId),
    latestDiscoveredRefs: runs[runs.length - 1]?.discovered_refs || 0
  };
}

function operatorRows(db, systemId, evidenceWindow = buildEvidenceWindow()) {
  const activityWindow = evidenceWindowClause(evidenceWindow, 'killmail_time');
  return db.prepare(`
    SELECT ae.entity_type,
           ae.entity_id,
           COALESCE(MAX(w.entity_name), MAX(known.entity_name), MAX(ae.entity_name)) AS entity_name,
           CASE WHEN MAX(w.watch_id) IS NULL THEN 0 ELSE 1 END AS watchlisted,
           SUM(CASE WHEN ae.role = 'attacker' THEN 1 ELSE 0 END) AS attacker_appearances,
           SUM(CASE WHEN ae.role = 'victim' THEN 1 ELSE 0 END) AS victim_appearances,
           COUNT(*) AS appearances,
           COUNT(DISTINCT ae.solar_system_id) AS unique_systems,
           MIN(ae.killmail_time) AS first_observed,
           MAX(ae.killmail_time) AS last_observed
    FROM activity_events ae
    LEFT JOIN watchlist_entities w
      ON w.entity_type = ae.entity_type AND w.entity_id = ae.entity_id
    LEFT JOIN entities known
      ON known.entity_type = ae.entity_type AND known.entity_id = ae.entity_id
    WHERE ae.solar_system_id = ?
      ${activityWindow.sql}
    GROUP BY ae.entity_type, ae.entity_id
    ORDER BY watchlisted DESC, appearances DESC, attacker_appearances DESC, entity_name ASC
  `).all(systemId, ...activityWindow.params);
}

function operatorReportCandidates(db, systemId, options = {}) {
  const topN = options.topN || 10;
  const evidenceWindow = options.evidenceWindow || buildEvidenceWindow(options);
  return operatorRows(db, systemId, evidenceWindow)
    .map((row) => ({
      ...row,
      relevance_score: relevanceScore(row),
      label: labelFor(row)
    }))
    .filter((row) =>
      row.appearances > 1 ||
      row.attacker_appearances > 1 ||
      row.unique_systems > 1
    )
    .sort((a, b) =>
      b.watchlisted - a.watchlisted ||
      b.relevance_score - a.relevance_score ||
      b.appearances - a.appearances ||
      String(a.entity_name || a.entity_id).localeCompare(String(b.entity_name || b.entity_id))
    )
    .slice(0, topN * 3);
}

function shipRows(db, systemId, evidenceWindow = buildEvidenceWindow()) {
  const activityWindow = evidenceWindowClause(evidenceWindow, 'ae.killmail_time');
  return db.prepare(`
    SELECT ae.entity_type, ae.entity_id, COALESCE(MAX(known.entity_name), MAX(ae.entity_name)) AS entity_name,
           GROUP_CONCAT(DISTINCT
             CASE
               WHEN COALESCE(ae.ship_type_name, tm.type_name) IS NOT NULL THEN COALESCE(ae.ship_type_name, tm.type_name) || ' [typeID: ' || ae.ship_type_id || ']'
               ELSE 'typeID ' || ae.ship_type_id || ' [unresolved]'
             END
           ) AS ships
    FROM activity_events ae
    LEFT JOIN entities known
      ON known.entity_type = ae.entity_type AND known.entity_id = ae.entity_id
    LEFT JOIN type_metadata tm ON tm.type_id = ae.ship_type_id
    WHERE ae.solar_system_id = ? AND ae.ship_type_id IS NOT NULL
      ${activityWindow.sql}
    GROUP BY ae.entity_type, ae.entity_id
    HAVING COUNT(*) > 1
    ORDER BY MAX(ae.entity_name) ASC
    LIMIT 20
  `).all(systemId, ...activityWindow.params);
}

function roleMix(row) {
  if (row.attacker_appearances && row.victim_appearances) {
    return `attacker ${row.attacker_appearances} / victim ${row.victim_appearances}`;
  }
  if (row.attacker_appearances) {
    return `attacker ${row.attacker_appearances}`;
  }
  return `victim ${row.victim_appearances}`;
}

function labelFor(row) {
  if (row.attacker_appearances > 1) {
    return 'repeated attacker';
  }
  if (row.attacker_appearances === 1 && row.victim_appearances > 0) {
    return 'mixed presence';
  }
  return 'observed presence';
}

function relevanceScore(row) {
  const multiSystemBonus = row.unique_systems > 1 ? 3 : 0;
  return row.appearances + (row.attacker_appearances * 2) + multiSystemBonus;
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

module.exports = {
  buildObservedOperatorsReport,
  operatorReportCandidates,
  resolveSystem,
  labelFor,
  relevanceScore
};
