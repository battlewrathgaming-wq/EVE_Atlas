const { actorScope, resolveActor } = require('./actorReport');
const {
  formatWindow,
  table,
  printSection,
  formatEntityLabel,
  formatTypeLabel,
  formatSystemLabel,
  buildEvidenceWindow,
  evidenceWindowClause,
  formatEvidenceWindow
} = require('./reportUtils');
const {
  activityCadenceRows,
  counterpartEntityRows,
  finalBlowRows,
  formatAggressorDetail,
  formatFinalBlowPilot,
  formatShip,
  formatUtcBucket,
  roleMix
} = require('./observationMetrics');

function buildCorporationObservationReport(db, input, options = {}) {
  const corporation = resolveActor(db, {
    ...input,
    entityType: 'corporation',
    entity_type: 'corporation'
  });
  const evidenceWindow = buildEvidenceWindow(options);
  const scope = actorScope(db, corporation, evidenceWindow);
  const status = corporationSampleStatus(scope);
  const killmailIds = scopedKillmailIds(db, corporation, evidenceWindow);
  const observation = corporationObservationScope(db, corporation, evidenceWindow, killmailIds);

  return [
    `AURA Atlas Corporation Observation Report - ${status}`,
    `Corporation: ${formatEntityLabel(corporation.entity_name, 'corporation', corporation.entity_id)}`,
    `Evidence window: ${formatEvidenceWindow(evidenceWindow)}`,
    `Expanded evidence range: ${scope.killmailRange.earliest || 'none'} -> ${scope.killmailRange.latest || 'none'}`,
    `Basis: ${scope.killmailRange.count} expanded killmails / ${scope.activityEventCount} corporation activity events matching corporation/time scope`,
    `Actor discovery window(s): ${scope.pastSecondsValues.length ? scope.pastSecondsValues.map(formatWindow).join(', ') : 'unknown'}`,
    `Collection provenance runs: ${scope.runs.length}`,
    `Collected at: ${scope.runs[0]?.started_at || 'none'} -> ${scope.runs[scope.runs.length - 1]?.finished_at || 'none'}`,
    'Interpretation: this report observes stored evidence for a corporation. It does not assess intent, affiliation, staging, ownership, or threat.',
    printSection('Evidence Basis', [
      `Stored evidence matching this scope: ${scope.killmailRange.count} killmails / ${scope.activityEventCount} corporation activity events`,
      `Event-time member pilot rows in scope: ${observation.memberPilotEventCount}`,
      'Source: zKill discovery + ESI expanded killmails'
    ].join('\n')),
    printSection('Collection Provenance', [
      `Matching evidence ingestion runs: ${scope.runs.length}`,
      `Actor-route collection runs: ${scope.actorRuns.length}`,
      `Actor-route zKill requests: ${scope.actorZkillLogs.length}`,
      `Actor-route zKill refs discovered: ${scope.actorRouteTotals.discovered}`,
      `Actor-route already cached: ${scope.actorRouteTotals.cached}`,
      `Actor-route expanded new: ${scope.actorRouteTotals.expanded}`,
      `Actor-route failed expansions: ${scope.actorRouteTotals.failed}`,
      `Actor-route activity events written: ${scope.actorRouteTotals.events}`,
      `Current discovery queue: ${scope.queueCounts.expanded} expanded / ${scope.queueCounts.cached} cached / ${scope.queueCounts.pending} pending / ${scope.queueCounts.failed} failed`,
      'Observation sections are filtered by stored evidence scope; collection provenance explains how evidence entered storage.'
    ].join('\n')),
    printSection('Corporation Role Split', table(scope.roleSplit, [
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
    printSection('Observed Member Pilots', table(observation.memberPilots, [
      { label: 'Pilot', value: (row) => formatEntityLabel(row.character_name, 'character', row.character_id) },
      { label: 'Role Mix', value: roleMix },
      { label: 'Appearances', value: (row) => row.appearances },
      { label: 'Final Blows', value: (row) => row.final_blows },
      { label: 'Damage', value: (row) => row.damage_done },
      { label: 'Systems', value: (row) => `${row.unique_systems}: ${row.systems_seen || 'unknown'}` },
      { label: 'First Observed', value: (row) => row.first_observed },
      { label: 'Last Observed', value: (row) => row.last_observed }
    ])),
    printSection('Observed Final Blows', table(observation.finalBlows, [
      { label: 'Pilot', value: formatFinalBlowPilot },
      { label: 'Ship', value: formatShip },
      { label: 'Final Blows', value: (row) => row.final_blows },
      { label: 'Damage', value: (row) => row.damage_done },
      { label: 'Systems', value: (row) => row.unique_systems },
      { label: 'First Observed', value: (row) => row.first_observed },
      { label: 'Last Observed', value: (row) => row.last_observed }
    ])),
    printSection('Observed Ships', table(observation.ships, [
      { label: 'Ship', value: (row) => formatTypeLabel(row.ship_name, row.ship_type_id) },
      { label: 'Role', value: (row) => row.role },
      { label: 'Appearances', value: (row) => row.appearances },
      { label: 'Pilots', value: (row) => row.unique_pilots }
    ])),
    printSection('Observed Regions', table(observation.regions, [
      { label: 'Region', value: (row) => row.region_name || 'unknown' },
      { label: 'Killmails', value: (row) => row.killmail_count },
      { label: 'First Observed', value: (row) => row.first_observed },
      { label: 'Last Observed', value: (row) => row.last_observed }
    ])),
    printSection('Observed Activity Cadence', table(observation.cadence, [
      { label: 'UTC Bucket', value: formatUtcBucket },
      { label: 'Role Mix', value: roleMix },
      { label: 'Appearances', value: (row) => row.appearances },
      { label: 'Killmails', value: (row) => row.killmails }
    ])),
    printSection('Observed Counterpart Corporations', table(observation.counterpartCorporations, [
      { label: 'Corporation', value: (row) => formatEntityLabel(row.entity_name, 'corporation', row.entity_id) },
      { label: 'Role Mix', value: roleMix },
      { label: 'Appearances', value: (row) => row.appearances },
      { label: 'Killmails', value: (row) => row.killmails },
      { label: 'Systems', value: (row) => row.unique_systems },
      { label: 'First Observed', value: (row) => row.first_observed },
      { label: 'Last Observed', value: (row) => row.last_observed }
    ])),
    printSection('Observed Counterpart Alliances', table(observation.counterpartAlliances, [
      { label: 'Alliance', value: (row) => formatEntityLabel(row.entity_name, 'alliance', row.entity_id) },
      { label: 'Role Mix', value: roleMix },
      { label: 'Appearances', value: (row) => row.appearances },
      { label: 'Killmails', value: (row) => row.killmails },
      { label: 'Systems', value: (row) => row.unique_systems },
      { label: 'First Observed', value: (row) => row.first_observed },
      { label: 'Last Observed', value: (row) => row.last_observed }
    ])),
    printSection('Recent Timeline', table(observation.timeline, [
      { label: 'Time', value: (row) => row.killmail_time },
      { label: 'Killmail', value: (row) => row.killmail_id },
      { label: 'Corp Role', value: (row) => row.corporation_role },
      { label: 'System', value: (row) => formatSystemLabel(row.solar_system_name, row.solar_system_id) },
      { label: 'Region', value: (row) => row.region_name || 'unknown' },
      { label: 'Observed Pilot', value: (row) => row.pilot_label || 'unknown' },
      { label: 'Ship', value: (row) => formatTypeLabel(row.ship_name, row.ship_type_id) },
      { label: 'Aggressor Detail', value: (row) => row.aggressor_detail || '' }
    ])),
    printSection('Warnings', scope.warnings.length ? scope.warnings.map((warning) => `${warning.warning_type}: ${warning.message}`).join('\n') : '(none)')
  ].join('\n');
}

function corporationObservationScope(db, corporation, evidenceWindow, killmailIds) {
  if (!killmailIds.length) {
    return {
      memberPilotEventCount: 0,
      memberPilots: [],
      ships: [],
      regions: [],
      cadence: [],
      finalBlows: [],
      counterpartCorporations: [],
      counterpartAlliances: [],
      timeline: []
    };
  }

  const placeholders = killmailIds.map(() => '?').join(', ');
  const activityWindow = evidenceWindowClause(evidenceWindow, 'ae.killmail_time');
  const killmailWindow = evidenceWindowClause(evidenceWindow, 'k.killmail_time');
  const memberParams = [corporation.entity_id, ...killmailIds, ...activityWindow.params];
  const memberPilotEventCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM activity_events ae
    WHERE ae.entity_type = 'character'
      AND ae.corporation_id = ?
      AND ae.killmail_id IN (${placeholders})
      ${activityWindow.sql}
  `).get(...memberParams).count;
  const memberPilots = db.prepare(`
    SELECT ae.character_id,
           MAX(ae.character_name) AS character_name,
           SUM(CASE WHEN ae.role = 'attacker' THEN 1 ELSE 0 END) AS attacker_appearances,
           SUM(CASE WHEN ae.role = 'victim' THEN 1 ELSE 0 END) AS victim_appearances,
           SUM(CASE WHEN ae.final_blow = 1 THEN 1 ELSE 0 END) AS final_blows,
           SUM(COALESCE(ae.damage_done, 0)) AS damage_done,
           COUNT(*) AS appearances,
           COUNT(DISTINCT ae.solar_system_id) AS unique_systems,
           GROUP_CONCAT(DISTINCT ss.solar_system_name) AS systems_seen,
           MIN(ae.killmail_time) AS first_observed,
           MAX(ae.killmail_time) AS last_observed
    FROM activity_events ae
    LEFT JOIN solar_systems ss ON ss.solar_system_id = ae.solar_system_id
    WHERE ae.entity_type = 'character'
      AND ae.character_id IS NOT NULL
      AND ae.corporation_id = ?
      AND ae.killmail_id IN (${placeholders})
      ${activityWindow.sql}
    GROUP BY ae.character_id
    ORDER BY appearances DESC, attacker_appearances DESC, character_name ASC
    LIMIT 30
  `).all(...memberParams);
  const ships = db.prepare(`
    SELECT ae.role,
           ae.ship_type_id,
           COALESCE(ae.ship_type_name, tm.type_name) AS ship_name,
           COUNT(*) AS appearances,
           COUNT(DISTINCT ae.character_id) AS unique_pilots
    FROM activity_events ae
    LEFT JOIN type_metadata tm ON tm.type_id = ae.ship_type_id
    WHERE ae.entity_type = 'character'
      AND ae.corporation_id = ?
      AND ae.killmail_id IN (${placeholders})
      AND ae.ship_type_id IS NOT NULL
      ${activityWindow.sql}
    GROUP BY ae.role, ae.ship_type_id, COALESCE(ae.ship_type_name, tm.type_name)
    ORDER BY appearances DESC, ship_name ASC
    LIMIT 30
  `).all(...memberParams);
  const regions = db.prepare(`
    SELECT COALESCE(ss.region_name, 'unknown') AS region_name,
           COUNT(DISTINCT k.killmail_id) AS killmail_count,
           MIN(k.killmail_time) AS first_observed,
           MAX(k.killmail_time) AS last_observed
    FROM killmails k
    LEFT JOIN solar_systems ss ON ss.solar_system_id = k.solar_system_id
    WHERE k.killmail_id IN (${placeholders})
      ${killmailWindow.sql}
    GROUP BY COALESCE(ss.region_name, 'unknown')
    ORDER BY killmail_count DESC, region_name ASC
  `).all(...killmailIds, ...killmailWindow.params);
  const cadence = activityCadenceRows(db, {
    killmailIds,
    entityType: 'corporation',
    entityId: corporation.entity_id
  }, { evidenceWindow });
  const finalBlows = finalBlowRows(db, {
    killmailIds,
    corporationId: corporation.entity_id,
    characterRowsOnly: true
  }, { evidenceWindow });
  const counterpartCorporations = counterpartEntityRows(db, {
    killmailIds,
    excludeIds: [corporation.entity_id]
  }, 'corporation', { evidenceWindow });
  const corporationAllianceIds = db.prepare(`
    SELECT DISTINCT alliance_id
    FROM activity_events
    WHERE entity_type = 'corporation'
      AND entity_id = ?
      AND alliance_id IS NOT NULL
      AND killmail_id IN (${placeholders})
  `).all(corporation.entity_id, ...killmailIds).map((row) => row.alliance_id);
  const counterpartAlliances = counterpartEntityRows(db, {
    killmailIds,
    excludeIds: corporationAllianceIds
  }, 'alliance', { evidenceWindow });
  const corpEvents = db.prepare(`
    SELECT ae.killmail_id, ae.role
    FROM activity_events ae
    WHERE ae.entity_type = 'corporation'
      AND ae.entity_id = ?
      AND ae.killmail_id IN (${placeholders})
      ${activityWindow.sql}
  `).all(...memberParams)
    .reduce((acc, row) => {
      acc[row.killmail_id] = row.role;
      return acc;
    }, {});
  const pilotStatement = db.prepare(`
    SELECT ae.character_id, ae.character_name, ae.ship_type_id,
           COALESCE(ae.ship_type_name, tm.type_name) AS ship_name,
           ae.final_blow,
           ae.damage_done
    FROM activity_events ae
    LEFT JOIN type_metadata tm ON tm.type_id = ae.ship_type_id
    WHERE ae.killmail_id = ?
      AND ae.entity_type = 'character'
      AND ae.corporation_id = ?
    ORDER BY ae.final_blow DESC, ae.damage_done DESC, ae.character_name ASC
    LIMIT 1
  `);
  const timeline = db.prepare(`
    SELECT k.killmail_id, k.killmail_time, k.solar_system_id,
           ss.solar_system_name, ss.region_name
    FROM killmails k
    LEFT JOIN solar_systems ss ON ss.solar_system_id = k.solar_system_id
    WHERE k.killmail_id IN (${placeholders})
      ${killmailWindow.sql}
    ORDER BY k.killmail_time DESC, k.killmail_id DESC
    LIMIT 20
  `).all(...killmailIds, ...killmailWindow.params)
    .map((killmail) => {
      const pilot = pilotStatement.get(killmail.killmail_id, corporation.entity_id);
      return {
        ...killmail,
        corporation_role: corpEvents[killmail.killmail_id] || 'unknown',
        pilot_label: pilot ? formatEntityLabel(pilot.character_name, 'character', pilot.character_id) : null,
        ship_type_id: pilot?.ship_type_id,
        ship_name: pilot?.ship_name,
        aggressor_detail: pilot ? formatAggressorDetail(pilot) : ''
      };
    });

  return {
    memberPilotEventCount,
    memberPilots,
    ships,
    regions,
    cadence,
    finalBlows,
    counterpartCorporations,
    counterpartAlliances,
    timeline
  };
}

function scopedKillmailIds(db, corporation, evidenceWindow) {
  const activityWindow = evidenceWindowClause(evidenceWindow, 'ae.killmail_time');
  const killmailWindow = evidenceWindowClause(evidenceWindow, 'k.killmail_time');
  return db.prepare(`
    SELECT DISTINCT ae.killmail_id
    FROM activity_events ae
    JOIN killmails k ON k.killmail_id = ae.killmail_id
    WHERE ae.entity_type = 'corporation'
      AND ae.entity_id = ?
      ${activityWindow.sql}
      ${killmailWindow.sql}
    ORDER BY ae.killmail_id
  `).all(corporation.entity_id, ...activityWindow.params, ...killmailWindow.params)
    .map((row) => row.killmail_id);
}

function corporationSampleStatus(scope) {
  if (!scope.killmailRange.count && !scope.latestDiscoveredRefs) {
    return 'NO DISCOVERY SAMPLE';
  }
  if (scope.queueCounts?.total && (scope.queueCounts.pending || scope.queueCounts.failed)) {
    return 'PARTIAL SAMPLE';
  }
  if (!scope.queueCounts?.total && scope.totals.expanded + scope.totals.failed < scope.latestDiscoveredRefs) {
    return 'PARTIAL SAMPLE';
  }
  if (scope.killmailRange.count && !scope.latestDiscoveredRefs) {
    return 'STORED EVIDENCE SAMPLE';
  }
  return 'COMPLETE EXPANDED SAMPLE';
}

module.exports = {
  buildCorporationObservationReport,
  corporationObservationScope,
  scopedKillmailIds
};
