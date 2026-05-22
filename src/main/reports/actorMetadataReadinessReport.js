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

const VALID_ENTITY_TYPES = new Set(['character', 'corporation', 'alliance']);

function buildActorMetadataReadinessReport(db, input, options = {}) {
  const actor = resolveActorLocally(db, input);
  const evidenceWindow = buildEvidenceWindow(options);
  const scope = metadataScope(db, actor, evidenceWindow);

  return [
    'AURA Atlas Actor Metadata Readiness Report',
    `Actor: ${formatEntityLabel(actor.entity_name, actor.entity_type, actor.entity_id)}`,
    `Evidence window: ${formatEvidenceWindow(evidenceWindow)}`,
    `Basis: ${scope.killmailCount} expanded killmails / ${scope.activityEventCount} actor activity events matching actor/time scope`,
    'Classification: metadata readiness is a local lookup diagnostic, not evidence and not hydration.',
    printSection('Summary', [
      `Missing system labels: ${scope.missingSystems.length}`,
      `Missing ship/type labels: ${scope.missingTypes.length}`,
      `Missing event-time corporation labels: ${scope.missingCorporations.length}`,
      `Missing event-time alliance labels: ${scope.missingAlliances.length}`,
      `Ready for readable actor report: ${isReadable(scope) ? 'yes' : 'no'}`
    ].join('\n')),
    printSection('Missing System Labels', table(scope.missingSystems, [
      { label: 'System', value: (row) => formatSystemLabel(null, row.solar_system_id) },
      { label: 'Appearances', value: (row) => row.appearances }
    ])),
    printSection('Missing Ship/Type Labels', table(scope.missingTypes, [
      { label: 'Type', value: (row) => formatTypeLabel(null, row.ship_type_id) },
      { label: 'Appearances', value: (row) => row.appearances }
    ])),
    printSection('Missing Event-Time Corporations', table(scope.missingCorporations, [
      { label: 'Corporation', value: (row) => formatEntityLabel(null, 'corporation', row.corporation_id) },
      { label: 'Appearances', value: (row) => row.appearances }
    ])),
    printSection('Missing Event-Time Alliances', table(scope.missingAlliances, [
      { label: 'Alliance', value: (row) => formatEntityLabel(null, 'alliance', row.alliance_id) },
      { label: 'Appearances', value: (row) => row.appearances }
    ])),
    printSection('Next Actions', nextActions(scope).join('\n'))
  ].join('\n');
}

function metadataScope(db, actor, evidenceWindow) {
  const activityWindow = evidenceWindowClause(evidenceWindow, 'ae.killmail_time');
  const params = [actor.entity_type, actor.entity_id, ...activityWindow.params];
  const killmailCount = db.prepare(`
    SELECT COUNT(DISTINCT ae.killmail_id) AS count
    FROM activity_events ae
    WHERE ae.entity_type = ? AND ae.entity_id = ?
      ${activityWindow.sql}
  `).get(...params).count;
  const activityEventCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM activity_events ae
    WHERE ae.entity_type = ? AND ae.entity_id = ?
      ${activityWindow.sql}
  `).get(...params).count;
  const missingSystems = db.prepare(`
    SELECT ae.solar_system_id, COUNT(*) AS appearances
    FROM activity_events ae
    LEFT JOIN solar_systems ss ON ss.solar_system_id = ae.solar_system_id
    WHERE ae.entity_type = ? AND ae.entity_id = ?
      AND ae.solar_system_id IS NOT NULL
      AND ss.solar_system_name IS NULL
      ${activityWindow.sql}
    GROUP BY ae.solar_system_id
    ORDER BY appearances DESC, ae.solar_system_id
  `).all(...params);
  const missingTypes = db.prepare(`
    SELECT ae.ship_type_id, COUNT(*) AS appearances
    FROM activity_events ae
    LEFT JOIN type_metadata tm ON tm.type_id = ae.ship_type_id
    WHERE ae.entity_type = ? AND ae.entity_id = ?
      AND ae.ship_type_id IS NOT NULL
      AND COALESCE(ae.ship_type_name, tm.type_name) IS NULL
      ${activityWindow.sql}
    GROUP BY ae.ship_type_id
    ORDER BY appearances DESC, ae.ship_type_id
  `).all(...params);
  const missingCorporations = db.prepare(`
    SELECT ae.corporation_id, COUNT(*) AS appearances
    FROM activity_events ae
    WHERE ae.entity_type = ? AND ae.entity_id = ?
      AND ae.corporation_id IS NOT NULL
      AND ae.corporation_name IS NULL
      ${activityWindow.sql}
    GROUP BY ae.corporation_id
    ORDER BY appearances DESC, ae.corporation_id
  `).all(...params);
  const missingAlliances = db.prepare(`
    SELECT ae.alliance_id, COUNT(*) AS appearances
    FROM activity_events ae
    WHERE ae.entity_type = ? AND ae.entity_id = ?
      AND ae.alliance_id IS NOT NULL
      AND ae.alliance_name IS NULL
      ${activityWindow.sql}
    GROUP BY ae.alliance_id
    ORDER BY appearances DESC, ae.alliance_id
  `).all(...params);

  return {
    killmailCount,
    activityEventCount,
    missingSystems,
    missingTypes,
    missingCorporations,
    missingAlliances
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
  if (scope.missingCorporations.length || scope.missingAlliances.length) {
    actions.push('Run explicit report-scoped entity hydration for repeated/top actor report entities.');
  }
  if (!actions.length) {
    actions.push('No missing local labels detected for this actor report scope.');
  }
  actions.push('Do not mutate raw killmail evidence; metadata labels remain presentation/cache data.');
  return actions;
}

function isReadable(scope) {
  return !scope.missingSystems.length &&
    !scope.missingTypes.length &&
    !scope.missingCorporations.length &&
    !scope.missingAlliances.length;
}

function resolveActorLocally(db, input) {
  const entityType = String(input?.entityType || input?.entity_type || '').toLowerCase();
  if (!VALID_ENTITY_TYPES.has(entityType)) {
    throw new Error('Actor metadata readiness entity type must be character, corporation, or alliance');
  }
  const entityId = input?.entityId ?? input?.entity_id;
  if (entityId) {
    const id = normalizeEntityId(entityId);
    return {
      entity_type: entityType,
      entity_id: id,
      entity_name: input?.entityName || input?.entity_name || localEntityName(db, entityType, id)
    };
  }
  const entityName = String(input?.entityName || input?.entity_name || '').trim();
  if (!entityName) {
    throw new Error('Actor metadata readiness requires an entity ID or cached typed name');
  }
  const rows = db.prepare(`
    SELECT entity_type, entity_id, entity_name
    FROM entities
    WHERE entity_type = ? AND lower(entity_name) = lower(?)
    UNION
    SELECT entity_type, entity_id, entity_name
    FROM watchlist_entities
    WHERE entity_type = ? AND lower(entity_name) = lower(?)
    ORDER BY entity_id
  `).all(entityType, entityName, entityType, entityName);
  if (!rows.length) {
    throw new Error(`No cached ${entityType} found for "${entityName}"; run typed actor resolution before metadata readiness reporting`);
  }
  if (rows.length > 1) {
    throw new Error(`Cached ${entityType} name "${entityName}" is ambiguous: ${rows.map((row) => `${row.entity_name} [${row.entity_id}]`).join(', ')}`);
  }
  return rows[0];
}

function localEntityName(db, entityType, entityId) {
  const known = db.prepare(`
    SELECT entity_name
    FROM entities
    WHERE entity_type = ? AND entity_id = ?
  `).get(entityType, entityId);
  const watch = db.prepare(`
    SELECT entity_name
    FROM watchlist_entities
    WHERE entity_type = ? AND entity_id = ?
  `).get(entityType, entityId);
  return known?.entity_name || watch?.entity_name || null;
}

function normalizeEntityId(entityId) {
  const value = Number(entityId);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('Actor metadata readiness entity ID must be a positive integer');
  }
  return value;
}

module.exports = {
  buildActorMetadataReadinessReport
};
