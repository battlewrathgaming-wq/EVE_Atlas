const { TopologyService } = require('../sde/topologyService');
const { resolveSystem, labelFor, relevanceScore } = require('./operatorReport');
const {
  parsePastSeconds,
  formatWindow,
  table,
  printSection,
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
const {
  manualSystemDiscoverySummary,
  manualDiscoveryProvenanceLines
} = require('./collectionProvenance');

function buildRadiusReport(db, centerNameOrId, options = {}) {
  return renderRadiusReport(buildRadiusReportModel(db, centerNameOrId, options));
}

function buildRadiusReportModel(db, centerNameOrId, options = {}) {
  const radiusJumps = Number(options.radiusJumps ?? 0);
  const maxRadius = Number(options.maxRadius ?? 5);
  const maxSystems = Number(options.maxSystems ?? 100);
  const center = resolveSystem(db, centerNameOrId);
  const topologyService = new TopologyService(db);
  const includedSystemIds = topologyService.getSystemsWithinRadius(center.solar_system_id, radiusJumps, {
    maxRadius,
    maxSystems
  });
  const systems = includedSystemIds.map((systemId) => topologyService.getSystemDetails(systemId));
  const evidenceWindow = buildEvidenceWindow(options);
  const scope = radiusScope(db, includedSystemIds, { evidenceWindow });
  const status = radiusSampleStatus(scope);

  const sections = {
    scope: {
      title: 'Scope',
      rows: systems,
      columns: [
        { label: 'System', value: (row) => formatSystemLabel(row.solar_system_name, row.solar_system_id) },
        { label: 'Constellation', value: (row) => row.constellation_name || 'unknown' },
        { label: 'Region', value: (row) => row.region_name || 'unknown' },
        { label: 'Security', value: (row) => row.security_status ?? 'unknown' }
      ]
    },
    evidenceBasis: {
      title: 'Evidence Basis',
      lines: [
        `Stored evidence matching this scope: ${scope.killmailRange.count} killmails / ${scope.activityEventCount} activity events`,
        'Source: zKill discovery + ESI expanded killmails'
      ]
    },
    collectionProvenance: {
      title: 'Collection Provenance',
      lines: [
        `Collection provenance systems scanned: ${scope.zkillLogs.length}`,
        `Collection provenance zKill refs discovered: ${scope.totals.discovered}`,
        `Collection provenance already cached: ${scope.totals.cached}`,
        `Collection provenance expanded new: ${scope.totals.expanded}`,
        `Collection provenance failed expansions: ${scope.totals.failed}`,
        `Collection provenance activity events written: ${scope.totals.events}`,
        `Collection provenance API calls: zkill ${scope.apiCalls.zkill || 0} / esi ${scope.apiCalls.esi || 0}`,
        ...manualDiscoveryProvenanceLines(scope.manualDiscovery),
        'Collection provenance may include multiple run types; observation sections are filtered by stored evidence scope.'
      ]
    }
  };

  const observations = [
    observationSection('Activity By System', scope.systemCounts, [
      { label: 'System', value: (row) => formatSystemLabel(row.solar_system_name, row.solar_system_id) },
      { label: 'Constellation', value: (row) => row.constellation_name || 'unknown' },
      { label: 'Region', value: (row) => row.region_name || 'unknown' },
      { label: 'Killmails', value: (row) => row.killmail_count }
    ]),
    observationSection('Activity By Constellation', scope.constellationCounts, [
      { label: 'Constellation', value: (row) => row.constellation_name || 'unknown' },
      { label: 'Region', value: (row) => row.region_name || 'unknown' },
      { label: 'Killmails', value: (row) => row.killmail_count }
    ]),
    observationSection('Activity By Region', scope.regionCounts, [
      { label: 'Region', value: (row) => row.region_name || 'unknown' },
      { label: 'Killmails', value: (row) => row.killmail_count }
    ]),
    observationSection('Multi-System Presence', scope.multiSystemOperators, operatorColumns()),
    observationSection('Observed Operators', scope.operatorRows, operatorColumns()),
    observationSection('Attacker/Victim Split', scope.roleSplit, [
      { label: 'Role', value: (row) => row.role },
      { label: 'Events', value: (row) => row.count }
    ]),
    observationSection('Observed Activity Cadence', scope.cadenceRows, [
      { label: 'UTC Bucket', value: formatUtcBucket },
      { label: 'Role Mix', value: roleMix },
      { label: 'Appearances', value: (row) => row.appearances },
      { label: 'Killmails', value: (row) => row.killmails }
    ]),
    observationSection('Observed Final Blows', scope.finalBlowRows, [
      { label: 'Attacker', value: formatFinalBlowPilot },
      { label: 'Ship', value: formatShip },
      { label: 'Final Blows', value: (row) => row.final_blows },
      { label: 'Damage', value: (row) => row.damage_done },
      { label: 'Systems', value: (row) => row.unique_systems },
      { label: 'First Observed', value: (row) => row.first_observed },
      { label: 'Last Observed', value: (row) => row.last_observed }
    ]),
    observationSection('Recent Timeline', scope.timeline, [
      { label: 'Time', value: (row) => row.killmail_time },
      { label: 'Killmail', value: (row) => row.killmail_id },
      { label: 'System', value: (row) => formatSystemLabel(row.solar_system_name, row.solar_system_id) },
      { label: 'Region', value: (row) => row.region_name || 'unknown' },
      { label: 'Victim Ship', value: (row) => formatTypeLabel(row.victim_ship_name, row.victim_ship_type_id) },
      { label: 'Victim', value: (row) => row.victim_label || 'unknown' },
      { label: 'Observed Attacker', value: (row) => row.attacker_label || 'unknown' },
      { label: 'Attacker Ship', value: (row) => row.attacker_ship_type_id ? formatTypeLabel(row.attacker_ship_name, row.attacker_ship_type_id) : 'unknown' },
      { label: 'Aggressor Detail', value: formatAggressorDetail }
    ])
  ];

  return {
    report_type: 'radius',
    title: 'AURA Atlas Radius Watch Evidence Report',
    sample_status: status,
    generated_at: new Date().toISOString(),
    center: {
      solar_system_id: center.solar_system_id,
      solar_system_name: center.solar_system_name,
      constellation_id: center.constellation_id,
      constellation_name: center.constellation_name,
      region_id: center.region_id,
      region_name: center.region_name,
      security_status: center.security_status
    },
    center_label: formatSystemLabel(center.solar_system_name, center.solar_system_id),
    radius_jumps: radiusJumps,
    max_radius: maxRadius,
    max_systems: maxSystems,
    included_systems: systems,
    evidence_window: {
      ...evidenceWindow,
      label: formatEvidenceWindow(evidenceWindow)
    },
    evidence_range: {
      earliest: scope.killmailRange.earliest || null,
      latest: scope.killmailRange.latest || null,
      killmail_count: scope.killmailRange.count || 0,
      activity_event_count: scope.activityEventCount || 0
    },
    discovery_windows: scope.pastSecondsValues.map((seconds) => ({
      seconds,
      label: formatWindow(seconds)
    })),
    collection: {
      runs_count: scope.runs.length,
      collected_start: scope.runs[0]?.started_at || null,
      collected_end: scope.runs[scope.runs.length - 1]?.finished_at || null,
      zkill_requests: scope.zkillLogs.length,
      totals: scope.totals,
      api_calls: scope.apiCalls,
      manual_discovery: scope.manualDiscovery
    },
    interpretation_warning: 'Repeated or multi-system presence is evidence for further investigation, not proof of staging, ownership, or affiliation.',
    sections,
    observations,
    warnings: scope.warnings.map((warning) => ({
      code: warning.warning_type,
      message: warning.message
    })),
    raw_ids: radiusRawIds(systems, scope)
  };
}

function renderRadiusReport(model) {
  return [
    `${model.title} - ${model.sample_status}`,
    `Center: ${model.center_label}`,
    `Radius: ${model.radius_jumps} jump${model.radius_jumps === 1 ? '' : 's'}`,
    `Center Geography: ${model.center.region_name || 'unknown'} / ${model.center.constellation_name || 'unknown'}`,
    `Included systems: ${model.included_systems.length}`,
    `Evidence window: ${model.evidence_window.label}`,
    `Expanded evidence range: ${model.evidence_range.earliest || 'none'} -> ${model.evidence_range.latest || 'none'}`,
    `Expanded sample: ${model.evidence_range.killmail_count} stored killmails matching radius/time scope`,
    `Discovery provenance window(s): ${model.discovery_windows.length ? model.discovery_windows.map((window) => window.label).join(', ') : 'unknown'}`,
    `Collection provenance runs: ${model.collection.runs_count}`,
    `Collected at: ${model.collection.collected_start || 'none'} -> ${model.collection.collected_end || 'none'}`,
    `Interpretation: ${model.interpretation_warning}`,
    printSection(model.sections.scope.title, table(model.sections.scope.rows, model.sections.scope.columns)),
    printSection(model.sections.evidenceBasis.title, model.sections.evidenceBasis.lines.join('\n')),
    printSection(model.sections.collectionProvenance.title, model.sections.collectionProvenance.lines.join('\n')),
    ...model.observations.map((section) => printSection(section.title, table(section.rows, section.columns))),
    printSection('Warnings', model.warnings.length ? model.warnings.map((warning) => `${warning.code}: ${warning.message}`).join('\n') : '(none)')
  ].join('\n');
}

function observationSection(title, rows, columns) {
  return {
    title,
    rows,
    columns: columns.map((column) => ({
      label: column.label,
      value: column.value
    }))
  };
}

function radiusRawIds(systems, scope) {
  return {
    character_ids: uniqueNumbers([
      ...scope.operatorRows.filter((row) => row.entity_type === 'character').map((row) => row.entity_id),
      ...scope.timeline.filter((row) => row.victim_entity_type === 'character').map((row) => row.victim_entity_id),
      ...scope.timeline.filter((row) => row.attacker_entity_type === 'character').map((row) => row.attacker_entity_id)
    ]),
    corporation_ids: uniqueNumbers([
      ...scope.operatorRows.filter((row) => row.entity_type === 'corporation').map((row) => row.entity_id),
      ...scope.timeline.filter((row) => row.victim_entity_type === 'corporation').map((row) => row.victim_entity_id),
      ...scope.timeline.filter((row) => row.attacker_entity_type === 'corporation').map((row) => row.attacker_entity_id)
    ]),
    alliance_ids: uniqueNumbers([
      ...scope.operatorRows.filter((row) => row.entity_type === 'alliance').map((row) => row.entity_id),
      ...scope.timeline.filter((row) => row.victim_entity_type === 'alliance').map((row) => row.victim_entity_id),
      ...scope.timeline.filter((row) => row.attacker_entity_type === 'alliance').map((row) => row.attacker_entity_id)
    ]),
    solar_system_ids: uniqueNumbers([
      ...systems.map((row) => row.solar_system_id),
      ...scope.timeline.map((row) => row.solar_system_id)
    ]),
    type_ids: uniqueNumbers([
      ...scope.timeline.map((row) => row.victim_ship_type_id),
      ...scope.timeline.map((row) => row.attacker_ship_type_id),
      ...scope.finalBlowRows.map((row) => row.ship_type_id)
    ]),
    killmail_ids: uniqueNumbers(scope.timeline.map((row) => row.killmail_id))
  };
}

function uniqueNumbers(values) {
  return [...new Set(values.map(Number).filter((value) => Number.isInteger(value) && value > 0))]
    .sort((a, b) => a - b);
}

function radiusScope(db, systemIds, options = {}) {
  const evidenceWindow = options.evidenceWindow || buildEvidenceWindow();
  const zkillClause = zkillEndpointClause(systemIds, 'arl');
  const zkillLogClause = zkillEndpointClause(systemIds);
  const killmailWindow = evidenceWindowClause(evidenceWindow, 'killmail_time');
  const killmailJoinWindow = evidenceWindowClause(evidenceWindow, 'k.killmail_time');
  const activityWindow = evidenceWindowClause(evidenceWindow, 'ae.killmail_time');
  const placeholders = systemIds.map(() => '?').join(', ');
  const runs = db.prepare(`
    SELECT DISTINCT fr.*
    FROM fetch_runs fr
    JOIN api_request_logs arl ON arl.run_id = fr.run_id
    WHERE arl.provider = 'zkill'
      AND (${zkillClause.sql})
    ORDER BY fr.started_at
  `).all(...zkillClause.params);
  const runIds = runs.map((run) => run.run_id);
  const zkillLogs = db.prepare(`
    SELECT *
    FROM api_request_logs
    WHERE provider = 'zkill'
      AND (${zkillLogClause.sql})
    ORDER BY requested_at
  `).all(...zkillLogClause.params);
  const pastSecondsValues = [...new Set(zkillLogs.map((log) => parsePastSeconds(log.endpoint)).filter(Boolean))];
  const killmailRange = db.prepare(`
    SELECT MIN(killmail_time) AS earliest, MAX(killmail_time) AS latest, COUNT(*) AS count
    FROM killmails
    WHERE solar_system_id IN (${placeholders})
      ${killmailWindow.sql}
  `).get(...systemIds, ...killmailWindow.params);
  const activityEventCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM activity_events ae
    WHERE ae.solar_system_id IN (${placeholders})
      ${activityWindow.sql}
  `).get(...systemIds, ...activityWindow.params).count;
  const roleSplit = db.prepare(`
    SELECT role, COUNT(*) AS count
    FROM activity_events ae
    WHERE ae.solar_system_id IN (${placeholders})
      ${activityWindow.sql}
    GROUP BY role
    ORDER BY role
  `).all(...systemIds, ...activityWindow.params);
  const systemCounts = db.prepare(`
    SELECT ss.solar_system_id, ss.solar_system_name, ss.constellation_name, ss.region_name, COUNT(k.killmail_id) AS killmail_count
    FROM solar_systems ss
    LEFT JOIN killmails k ON k.solar_system_id = ss.solar_system_id ${killmailJoinWindow.sql}
    WHERE ss.solar_system_id IN (${placeholders})
    GROUP BY ss.solar_system_id, ss.solar_system_name, ss.constellation_name, ss.region_name
    ORDER BY killmail_count DESC, ss.solar_system_name ASC
  `).all(...killmailJoinWindow.params, ...systemIds);
  const constellationCounts = db.prepare(`
    SELECT COALESCE(ss.constellation_name, 'unknown') AS constellation_name,
           COALESCE(ss.region_name, 'unknown') AS region_name,
           COUNT(k.killmail_id) AS killmail_count
    FROM solar_systems ss
    LEFT JOIN killmails k ON k.solar_system_id = ss.solar_system_id ${killmailJoinWindow.sql}
    WHERE ss.solar_system_id IN (${placeholders})
    GROUP BY COALESCE(ss.constellation_name, 'unknown'), COALESCE(ss.region_name, 'unknown')
    ORDER BY killmail_count DESC, constellation_name ASC
  `).all(...killmailJoinWindow.params, ...systemIds);
  const regionCounts = db.prepare(`
    SELECT COALESCE(ss.region_name, 'unknown') AS region_name,
           COUNT(k.killmail_id) AS killmail_count
    FROM solar_systems ss
    LEFT JOIN killmails k ON k.solar_system_id = ss.solar_system_id ${killmailJoinWindow.sql}
    WHERE ss.solar_system_id IN (${placeholders})
    GROUP BY COALESCE(ss.region_name, 'unknown')
    ORDER BY killmail_count DESC, region_name ASC
  `).all(...killmailJoinWindow.params, ...systemIds);
  const operatorRows = radiusOperatorRows(db, systemIds, evidenceWindow)
    .map((row) => ({
      ...row,
      relevance_score: relevanceScore(row),
      label: radiusLabelFor(row)
    }))
    .filter((row) => row.appearances > 1 || row.attacker_appearances > 1 || row.unique_systems > 1)
    .sort((a, b) =>
      b.watchlisted - a.watchlisted ||
      b.relevance_score - a.relevance_score ||
      b.unique_systems - a.unique_systems ||
      b.appearances - a.appearances ||
      String(a.entity_name || a.entity_id).localeCompare(String(b.entity_name || b.entity_id))
    )
    .slice(0, 30);
  const multiSystemOperators = operatorRows.filter((row) => row.unique_systems > 1);
  const timeline = buildTimeline(db, systemIds, evidenceWindow);
  const cadenceRows = activityCadenceRows(db, { systemIds }, { evidenceWindow });
  const finalBlowRowsForRadius = finalBlowRows(db, { systemIds }, { evidenceWindow });
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
    systemCounts,
    constellationCounts,
    regionCounts,
    operatorRows,
    multiSystemOperators,
    cadenceRows,
    finalBlowRows: finalBlowRowsForRadius,
    timeline,
    warnings,
    apiCalls,
    totals,
    manualDiscovery: manualSystemDiscoverySummary(db, systemIds),
    latestDiscoveredRefs: runs[runs.length - 1]?.discovered_refs || 0
  };
}

function zkillEndpointClause(systemIds, alias = null) {
  const column = alias ? `${alias}.endpoint` : 'endpoint';
  return {
    sql: systemIds.map(() => `${column} LIKE ?`).join(' OR '),
    params: systemIds.map((systemId) => `%/systemID/${systemId}/%`)
  };
}

function radiusOperatorRows(db, systemIds, evidenceWindow) {
  const placeholders = systemIds.map(() => '?').join(', ');
  const activityWindow = evidenceWindowClause(evidenceWindow, 'ae.killmail_time');
  return db.prepare(`
    SELECT ae.entity_type,
           ae.entity_id,
           COALESCE(MAX(w.entity_name), MAX(known.entity_name), MAX(ae.entity_name)) AS entity_name,
           CASE WHEN MAX(w.watch_id) IS NULL THEN 0 ELSE 1 END AS watchlisted,
           SUM(CASE WHEN ae.role = 'attacker' THEN 1 ELSE 0 END) AS attacker_appearances,
           SUM(CASE WHEN ae.role = 'victim' THEN 1 ELSE 0 END) AS victim_appearances,
           COUNT(*) AS appearances,
           COUNT(DISTINCT ae.solar_system_id) AS unique_systems,
           GROUP_CONCAT(DISTINCT ss.solar_system_name) AS systems_seen,
           MIN(ae.killmail_time) AS first_observed,
           MAX(ae.killmail_time) AS last_observed
    FROM activity_events ae
    LEFT JOIN solar_systems ss ON ss.solar_system_id = ae.solar_system_id
    LEFT JOIN watchlist_entities w
      ON w.entity_type = ae.entity_type AND w.entity_id = ae.entity_id
    LEFT JOIN entities known
      ON known.entity_type = ae.entity_type AND known.entity_id = ae.entity_id
    WHERE ae.solar_system_id IN (${placeholders})
      ${activityWindow.sql}
    GROUP BY ae.entity_type, ae.entity_id
  `).all(...systemIds, ...activityWindow.params);
}

function buildTimeline(db, systemIds, evidenceWindow) {
  const placeholders = systemIds.map(() => '?').join(', ');
  const killmailWindow = evidenceWindowClause(evidenceWindow, 'k.killmail_time');
  const killmails = db.prepare(`
    SELECT k.killmail_id, k.killmail_time, k.solar_system_id,
           ss.solar_system_name, ss.region_name
    FROM killmails k
    LEFT JOIN solar_systems ss ON ss.solar_system_id = k.solar_system_id
    WHERE k.solar_system_id IN (${placeholders})
      ${killmailWindow.sql}
    ORDER BY k.killmail_time DESC, k.killmail_id DESC
    LIMIT 20
  `).all(...systemIds, ...killmailWindow.params);
  const victimStatement = db.prepare(`
    SELECT ae.entity_type, ae.entity_id, COALESCE(ae.entity_name, known.entity_name) AS entity_name,
           ae.ship_type_id, COALESCE(ae.ship_type_name, tm.type_name) AS ship_name
    FROM activity_events ae
    LEFT JOIN entities known ON known.entity_type = ae.entity_type AND known.entity_id = ae.entity_id
    LEFT JOIN type_metadata tm ON tm.type_id = ae.ship_type_id
    WHERE ae.killmail_id = ? AND ae.role = 'victim' AND ae.ship_type_id IS NOT NULL
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
    const victim = victimStatement.get(killmail.killmail_id) || {};
    const attacker = attackerStatement.get(killmail.killmail_id);
    return {
      ...killmail,
      victim_ship_type_id: victim.ship_type_id,
      victim_ship_name: victim.ship_name,
      victim_entity_type: victim.entity_type,
      victim_entity_id: victim.entity_id,
      victim_label: victim ? formatEntityLabel(victim.entity_name, victim.entity_type, victim.entity_id) : null,
      attacker_entity_type: attacker?.entity_type,
      attacker_entity_id: attacker?.entity_id,
      attacker_label: attacker ? formatEntityLabel(attacker.entity_name, attacker.entity_type, attacker.entity_id) : null,
      attacker_ship_type_id: attacker?.ship_type_id,
      attacker_ship_name: attacker?.ship_name,
      final_blow: attacker?.final_blow,
      damage_done: attacker?.damage_done
    };
  });
}

function operatorColumns() {
  return [
    { label: 'Type', value: (row) => row.entity_type },
    { label: 'Entity', value: (row) => formatEntityLabel(row.entity_name, row.entity_type, row.entity_id) },
    { label: 'Watchlisted', value: (row) => row.watchlisted ? 'yes' : 'no' },
    { label: 'Label', value: (row) => row.label },
    { label: 'Role Mix', value: (row) => roleMix(row) },
    { label: 'Appearances', value: (row) => row.appearances },
    { label: 'Systems', value: (row) => `${row.unique_systems}: ${row.systems_seen || 'unknown'}` },
    { label: 'First Observed', value: (row) => row.first_observed },
    { label: 'Last Observed', value: (row) => row.last_observed }
  ];
}

function radiusLabelFor(row) {
  if (row.unique_systems > 1 && row.attacker_appearances > 1) {
    return 'repeated attacker, multi-system presence';
  }
  if (row.unique_systems > 1) {
    return 'multi-system presence';
  }
  return labelFor(row);
}

function radiusSampleStatus(scope) {
  if (!scope.killmailRange.count && !scope.latestDiscoveredRefs) {
    return 'NO DISCOVERY SAMPLE';
  }
  if (scope.totals.capSkipped || scope.totals.expanded + scope.totals.failed < scope.latestDiscoveredRefs) {
    return 'PARTIAL SAMPLE';
  }
  if (scope.killmailRange.count && !scope.latestDiscoveredRefs) {
    return 'STORED EVIDENCE SAMPLE';
  }
  return 'COMPLETE EXPANDED SAMPLE';
}

module.exports = {
  buildRadiusReport,
  buildRadiusReportModel,
  renderRadiusReport,
  radiusScope
};
