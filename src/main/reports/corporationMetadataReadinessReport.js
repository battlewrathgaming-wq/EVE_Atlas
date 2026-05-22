const { resolveActor } = require('./actorReport');
const { scopedKillmailIds } = require('./corporationObservationReport');
const {
  table,
  printSection,
  formatEntityLabel,
  formatSystemLabel,
  formatTypeLabel,
  buildEvidenceWindow,
  evidenceWindowClause,
  formatEvidenceWindow
} = require('./reportUtils');

function buildCorporationMetadataReadinessReport(db, input, options = {}) {
  const corporation = resolveActor(db, {
    ...input,
    entityType: 'corporation',
    entity_type: 'corporation'
  });
  const evidenceWindow = buildEvidenceWindow(options);
  const killmailIds = scopedKillmailIds(db, corporation, evidenceWindow);
  const scope = corporationMetadataScope(db, corporation, evidenceWindow, killmailIds);

  return [
    'AURA Atlas Corporation Metadata Readiness Report',
    `Corporation: ${formatEntityLabel(corporation.entity_name, 'corporation', corporation.entity_id)}`,
    `Evidence window: ${formatEvidenceWindow(evidenceWindow)}`,
    `Basis: ${scope.killmailCount} expanded killmails / ${scope.corporationEventCount} corporation activity events matching corporation/time scope`,
    'Classification: metadata readiness is a local lookup diagnostic, not evidence and not hydration.',
    printSection('Summary', [
      `Missing system/geography labels: ${scope.missingSystems.length}`,
      `Missing ship/type labels: ${scope.missingTypes.length}`,
      `Missing member pilot labels: ${scope.missingMemberPilots.length}`,
      `Missing counterpart corporation labels: ${scope.missingCounterpartCorporations.length}`,
      `Missing counterpart alliance labels: ${scope.missingCounterpartAlliances.length}`,
      `Ready for readable corporation observation report: ${isReadable(scope) ? 'yes' : 'no'}`
    ].join('\n')),
    printSection('Missing System/Geography Labels', table(scope.missingSystems, [
      { label: 'System', value: (row) => formatSystemLabel(null, row.solar_system_id) },
      { label: 'Killmails', value: (row) => row.killmails }
    ])),
    printSection('Missing Ship/Type Labels', table(scope.missingTypes, [
      { label: 'Type', value: (row) => formatTypeLabel(null, row.ship_type_id) },
      { label: 'Appearances', value: (row) => row.appearances }
    ])),
    printSection('Missing Member Pilots', table(scope.missingMemberPilots, [
      { label: 'Pilot', value: (row) => formatEntityLabel(null, 'character', row.character_id) },
      { label: 'Appearances', value: (row) => row.appearances }
    ])),
    printSection('Missing Counterpart Corporations', table(scope.missingCounterpartCorporations, [
      { label: 'Corporation', value: (row) => formatEntityLabel(null, 'corporation', row.corporation_id) },
      { label: 'Appearances', value: (row) => row.appearances },
      { label: 'Killmails', value: (row) => row.killmails }
    ])),
    printSection('Missing Counterpart Alliances', table(scope.missingCounterpartAlliances, [
      { label: 'Alliance', value: (row) => formatEntityLabel(null, 'alliance', row.alliance_id) },
      { label: 'Appearances', value: (row) => row.appearances },
      { label: 'Killmails', value: (row) => row.killmails }
    ])),
    printSection('Next Actions', nextActions(scope).join('\n'))
  ].join('\n');
}

function corporationMetadataScope(db, corporation, evidenceWindow, killmailIds) {
  if (!killmailIds.length) {
    return {
      killmailCount: 0,
      corporationEventCount: 0,
      missingSystems: [],
      missingTypes: [],
      missingMemberPilots: [],
      missingCounterpartCorporations: [],
      missingCounterpartAlliances: []
    };
  }

  const placeholders = killmailIds.map(() => '?').join(', ');
  const activityWindow = evidenceWindowClause(evidenceWindow, 'ae.killmail_time');
  const killmailWindow = evidenceWindowClause(evidenceWindow, 'k.killmail_time');
  const activityParams = [corporation.entity_id, ...killmailIds, ...activityWindow.params];
  const allActivityParams = [...killmailIds, ...activityWindow.params];
  const killmailCount = db.prepare(`
    SELECT COUNT(DISTINCT k.killmail_id) AS count
    FROM killmails k
    WHERE k.killmail_id IN (${placeholders})
      ${killmailWindow.sql}
  `).get(...killmailIds, ...killmailWindow.params).count;
  const corporationEventCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM activity_events ae
    WHERE ae.entity_type = 'corporation'
      AND ae.entity_id = ?
      AND ae.killmail_id IN (${placeholders})
      ${activityWindow.sql}
  `).get(...activityParams).count;
  const missingSystems = db.prepare(`
    SELECT k.solar_system_id, COUNT(DISTINCT k.killmail_id) AS killmails
    FROM killmails k
    LEFT JOIN solar_systems ss ON ss.solar_system_id = k.solar_system_id
    WHERE k.killmail_id IN (${placeholders})
      AND k.solar_system_id IS NOT NULL
      AND ss.solar_system_name IS NULL
      ${killmailWindow.sql}
    GROUP BY k.solar_system_id
    ORDER BY killmails DESC, k.solar_system_id
  `).all(...killmailIds, ...killmailWindow.params);
  const missingTypes = db.prepare(`
    SELECT ae.ship_type_id, COUNT(*) AS appearances
    FROM activity_events ae
    LEFT JOIN type_metadata tm ON tm.type_id = ae.ship_type_id
    WHERE ae.killmail_id IN (${placeholders})
      AND ae.ship_type_id IS NOT NULL
      AND COALESCE(ae.ship_type_name, tm.type_name) IS NULL
      ${activityWindow.sql}
    GROUP BY ae.ship_type_id
    ORDER BY appearances DESC, ae.ship_type_id
  `).all(...allActivityParams);
  const missingMemberPilots = db.prepare(`
    SELECT ae.character_id, COUNT(*) AS appearances
    FROM activity_events ae
    LEFT JOIN entities known ON known.entity_type = 'character' AND known.entity_id = ae.character_id
    WHERE ae.entity_type = 'character'
      AND ae.corporation_id = ?
      AND ae.killmail_id IN (${placeholders})
      AND ae.character_id IS NOT NULL
      AND COALESCE(ae.character_name, known.entity_name) IS NULL
      ${activityWindow.sql}
    GROUP BY ae.character_id
    ORDER BY appearances DESC, ae.character_id
  `).all(...activityParams);
  const missingCounterpartCorporations = db.prepare(`
    SELECT ae.corporation_id, COUNT(*) AS appearances, COUNT(DISTINCT ae.killmail_id) AS killmails
    FROM activity_events ae
    LEFT JOIN entities known ON known.entity_type = 'corporation' AND known.entity_id = ae.corporation_id
    WHERE ae.killmail_id IN (${placeholders})
      AND ae.corporation_id IS NOT NULL
      AND ae.corporation_id != ?
      AND COALESCE(ae.corporation_name, known.entity_name) IS NULL
      ${activityWindow.sql}
    GROUP BY ae.corporation_id
    ORDER BY appearances DESC, killmails DESC, ae.corporation_id
    LIMIT 50
  `).all(...killmailIds, corporation.entity_id, ...activityWindow.params);
  const corporationAllianceIds = db.prepare(`
    SELECT DISTINCT alliance_id
    FROM activity_events
    WHERE entity_type = 'corporation'
      AND entity_id = ?
      AND alliance_id IS NOT NULL
      AND killmail_id IN (${placeholders})
  `).all(corporation.entity_id, ...killmailIds).map((row) => row.alliance_id);
  const excludedAllianceSql = corporationAllianceIds.length
    ? `AND ae.alliance_id NOT IN (${corporationAllianceIds.map(() => '?').join(', ')})`
    : '';
  const missingCounterpartAlliances = db.prepare(`
    SELECT ae.alliance_id, COUNT(*) AS appearances, COUNT(DISTINCT ae.killmail_id) AS killmails
    FROM activity_events ae
    LEFT JOIN entities known ON known.entity_type = 'alliance' AND known.entity_id = ae.alliance_id
    WHERE ae.killmail_id IN (${placeholders})
      AND ae.alliance_id IS NOT NULL
      ${excludedAllianceSql}
      AND COALESCE(ae.alliance_name, known.entity_name) IS NULL
      ${activityWindow.sql}
    GROUP BY ae.alliance_id
    ORDER BY appearances DESC, killmails DESC, ae.alliance_id
    LIMIT 50
  `).all(...killmailIds, ...corporationAllianceIds, ...activityWindow.params);

  return {
    killmailCount,
    corporationEventCount,
    missingSystems,
    missingTypes,
    missingMemberPilots,
    missingCounterpartCorporations,
    missingCounterpartAlliances
  };
}

function nextActions(scope) {
  const actions = [];
  if (scope.missingSystems.length) {
    actions.push('Import or refresh local SDE topology for missing solar systems.');
  }
  if (scope.missingTypes.length) {
    actions.push('Import or refresh local SDE inventory metadata for missing type IDs.');
  }
  if (scope.missingMemberPilots.length || scope.missingCounterpartCorporations.length || scope.missingCounterpartAlliances.length) {
    actions.push('Run explicit corporation report hydration for report-relevant entities.');
  }
  if (!actions.length) {
    actions.push('No missing local labels detected for this corporation observation report scope.');
  }
  actions.push('Do not mutate raw killmail evidence; metadata labels remain presentation/cache data.');
  return actions;
}

function isReadable(scope) {
  return !scope.missingSystems.length &&
    !scope.missingTypes.length &&
    !scope.missingMemberPilots.length &&
    !scope.missingCounterpartCorporations.length &&
    !scope.missingCounterpartAlliances.length;
}

module.exports = {
  buildCorporationMetadataReadinessReport,
  corporationMetadataScope
};
