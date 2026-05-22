const { taxonomyMessage } = require('./messageTaxonomy');

const RETENTION_ACTIONS = Object.freeze({
  'diagnostics.prune_api_logs': {
    classification: 'destructive',
    dataClass: 'diagnostics',
    confirmation: 'required',
    preservation: 'not_required',
    description: 'Prune detailed API request logs while preserving higher-level run summaries'
  },
  'metadata.prune_runs': {
    classification: 'destructive',
    dataClass: 'metadata',
    confirmation: 'required',
    preservation: 'not_required',
    description: 'Prune old metadata run diagnostics; hydrated labels remain cached metadata'
  },
  'queue.expire_refs': {
    classification: 'destructive',
    dataClass: 'ephemeral_queue',
    confirmation: 'required',
    preservation: 'not_required',
    description: 'Expire old pending/expanded queue refs; queued refs are not evidence'
  },
  'runtime.delete_disposable_db': {
    classification: 'destructive',
    dataClass: 'runtime',
    confirmation: 'required',
    preservation: 'not_required',
    description: 'Delete a disposable runtime/test database'
  },
  'evidence.prune_scope': {
    classification: 'destructive',
    dataClass: 'evidence',
    confirmation: 'required',
    preservation: 'assessment_recommended',
    description: 'Prune expanded killmail evidence and derived activity events for an explicit scope'
  },
  'assessment.compact_from_evidence': {
    classification: 'assessment-creating',
    dataClass: 'assessment',
    confirmation: 'required',
    preservation: 'creates_assessment',
    description: 'Create a committed assessment artifact from scoped evidence before possible evidence pruning'
  }
});

function listRetentionActions() {
  return Object.entries(RETENTION_ACTIONS).map(([action, definition]) => ({
    action,
    ...definition
  }));
}

function buildRetentionPreflight(db, input = {}) {
  const action = String(input.action || '');
  const definition = RETENTION_ACTIONS[action];
  if (!definition) {
    throw new Error(`Unknown retention/destructive action: ${action}`);
  }
  const scope = input.scope || {};
  const impact = impactFor(db, action, scope);
  const blockers = [];
  const warnings = [];

  if (definition.confirmation === 'required' && input.confirmation !== action) {
    blockers.push(taxonomyMessage(
      'DESTRUCTIVE_CONFIRMATION_REQUIRED',
      `Confirmation token is required: ${action}`,
      { source: 'retention.preflight' }
    ));
  }
  if (definition.dataClass === 'evidence') {
    warnings.push(taxonomyMessage(
      'ASSESSMENT_PRESERVATION_RECOMMENDED',
      'Evidence pruning should offer or require assessment preservation before deletion',
      { source: 'retention.preflight' }
    ));
  }
  const assessmentPreview = action === 'assessment.compact_from_evidence'
    ? buildAssessmentCompactionPreview(db, scope, input.assessment || {})
    : null;

  return {
    action,
    allowed: blockers.length === 0,
    classification: definition.classification,
    data_class: definition.dataClass,
    description: definition.description,
    confirmation: {
      required: definition.confirmation === 'required',
      token: action,
      provided: input.confirmation || null
    },
    preservation: {
      policy: definition.preservation,
      assessment_recommended: definition.preservation === 'assessment_recommended',
      creates_assessment: definition.preservation === 'creates_assessment'
    },
    assessment_preview: assessmentPreview,
    scope,
    impact,
    blockers,
    warnings
  };
}

function buildAssessmentCompactionPreview(db, scope = {}, assessment = {}) {
  const entityType = String(scope.entityType || scope.entity_type || scope.actorType || scope.actor_type || '').toLowerCase();
  const entityId = Number(scope.entityId ?? scope.entity_id ?? scope.actorId ?? scope.actor_id);
  if (!['character', 'corporation', 'alliance'].includes(entityType) || !Number.isInteger(entityId) || entityId <= 0) {
    return {
      ready: false,
      reason: 'assessment.compact_from_evidence preview requires typed actor scope',
      boundary: 'compaction preview is read-only assessment memory, not evidence deletion'
    };
  }

  const eventWindow = evidenceWindowWhere('ae.killmail_time', scope);
  const events = db.prepare(`
    SELECT ae.killmail_id, ae.killmail_time, ae.role, ae.entity_name,
           ae.solar_system_id, COALESCE(ss.solar_system_name, ae.solar_system_name) AS solar_system_name,
           COALESCE(ss.region_name, ae.region_name) AS region_name,
           ae.ship_type_id, COALESCE(ae.ship_type_name, tm.type_name) AS ship_type_name
    FROM activity_events ae
    LEFT JOIN solar_systems ss ON ss.solar_system_id = ae.solar_system_id
    LEFT JOIN type_metadata tm ON tm.type_id = ae.ship_type_id
    WHERE ae.entity_type = ? AND ae.entity_id = ?
      ${eventWindow.sql}
    ORDER BY ae.killmail_time DESC, ae.killmail_id DESC
  `).all(entityType, entityId, ...eventWindow.params);

  const killmailIds = uniqueNumbers(events.map((event) => event.killmail_id));
  const roleCounts = events.reduce((acc, event) => {
    acc[event.role] = (acc[event.role] || 0) + 1;
    return acc;
  }, {});
  const evidenceRange = evidenceRangeForEvents(events, scope);
  const sourceRunIds = sourceRunIdsForKillmails(db, killmailIds);

  return {
    ready: events.length > 0,
    artifact_type: 'evidence_compaction',
    entity_type: entityType,
    entity_id: entityId,
    entity_name: scope.entityName || scope.entity_name || events.find((event) => event.entity_name)?.entity_name || cachedEntityName(db, entityType, entityId),
    status: 'preview_only',
    creation_ready: Boolean(textOrNull(assessment.assessmentReason || assessment.reason) || textOrNull(assessment.assessmentSummary || assessment.summary)),
    assessment_reason: textOrNull(assessment.assessmentReason || assessment.reason),
    assessment_summary: textOrNull(assessment.assessmentSummary || assessment.summary),
    evidence_window: evidenceRange,
    evidence_scope_type: 'actor',
    evidence_scope: {
      ...scope,
      entityType,
      entityId
    },
    source_report_type: 'actor',
    source_report_parameters: {
      entityType,
      entityId,
      lookbackSeconds: scope.lookbackSeconds || null,
      after: scope.after || null,
      before: scope.before || null
    },
    source_run_ids: sourceRunIds,
    sample_killmail_ids: killmailIds.slice(0, 20),
    counts: {
      killmails: killmailIds.length,
      appearances: events.length,
      attacker_appearances: roleCounts.attacker || 0,
      victim_appearances: roleCounts.victim || 0
    },
    systems_observed: groupedSystems(events),
    regions_observed: uniqueText(events.map((event) => event.region_name)),
    ships_observed: groupedShips(events),
    boundary: 'compaction preview is read-only assessment memory; it does not delete or replace expanded ESI killmail evidence'
  };
}

function assessmentArtifactInputFromCompactionPreview(preview = {}, overrides = {}) {
  if (!preview.ready) {
    throw new Error(preview.reason || 'Compaction preview is not ready for assessment artifact creation');
  }
  const assessmentReason = textOrNull(overrides.assessmentReason || overrides.reason || preview.assessment_reason);
  const assessmentSummary = textOrNull(overrides.assessmentSummary || overrides.summary || preview.assessment_summary);
  if (!assessmentReason && !assessmentSummary) {
    throw new Error('Compaction assessment creation requires assessmentReason or assessmentSummary');
  }

  return {
    artifactType: 'evidence_compaction',
    entityType: preview.entity_type,
    entityId: preview.entity_id,
    entityName: preview.entity_name,
    status: overrides.status || 'active',
    interestScore: overrides.interestScore,
    priorityScore: overrides.priorityScore,
    impactScore: overrides.impactScore,
    confidence: overrides.confidence,
    assessmentReason,
    assessmentSummary,
    evidenceWindowStart: preview.evidence_window?.start,
    evidenceWindowEnd: preview.evidence_window?.end,
    evidenceScopeType: preview.evidence_scope_type,
    evidenceScope: preview.evidence_scope,
    sourceReportType: preview.source_report_type,
    sourceReportParameters: preview.source_report_parameters,
    sourceRunIds: preview.source_run_ids || [],
    sampleKillmailIds: preview.sample_killmail_ids || [],
    appearanceCount: preview.counts?.appearances || 0,
    attackerAppearanceCount: preview.counts?.attacker_appearances || 0,
    victimAppearanceCount: preview.counts?.victim_appearances || 0,
    systemsObserved: preview.systems_observed || [],
    regionsObserved: preview.regions_observed || [],
    shipsObserved: preview.ships_observed || [],
    assessedBy: overrides.assessedBy || overrides.assessed_by || 'local-operator'
  };
}

function impactFor(db, action, scope) {
  if (action === 'diagnostics.prune_api_logs') {
    return {
      api_request_logs: countOlderThan(db, 'api_request_logs', 'requested_at', scope.before)
    };
  }
  if (action === 'metadata.prune_runs') {
    return {
      metadata_runs: countOlderThan(db, 'metadata_runs', 'started_at', scope.before)
    };
  }
  if (action === 'queue.expire_refs') {
    return {
      discovered_killmail_refs: queueRefCount(db, scope)
    };
  }
  if (action === 'runtime.delete_disposable_db') {
    return {
      database_path: scope.databasePath || null,
      note: 'File deletion is not implemented by this preflight service'
    };
  }
  if (action === 'evidence.prune_scope' || action === 'assessment.compact_from_evidence') {
    return evidenceScopeImpact(db, scope);
  }
  return {};
}

function evidenceScopeImpact(db, scope = {}) {
  const where = [];
  const params = [];
  const entityType = String(scope.entityType || scope.entity_type || scope.actorType || scope.actor_type || '').toLowerCase();
  const entityId = Number(scope.entityId ?? scope.entity_id ?? scope.actorId ?? scope.actor_id);
  const hasActorScope = ['character', 'corporation', 'alliance'].includes(entityType) && Number.isInteger(entityId) && entityId > 0;
  if (hasActorScope) {
    where.push('ae.entity_type = ? AND ae.entity_id = ?');
    params.push(entityType, entityId);
  }
  if (scope.systemId || scope.system_id) {
    where.push('k.solar_system_id = ?');
    params.push(Number(scope.systemId || scope.system_id));
  }
  if (scope.before) {
    where.push('k.killmail_time < ?');
    params.push(scope.before);
  }
  if (scope.after) {
    where.push('k.killmail_time >= ?');
    params.push(scope.after);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const killmailIds = db.prepare(`
    SELECT DISTINCT k.killmail_id
    FROM killmails k
    ${hasActorScope ? 'JOIN activity_events ae ON ae.killmail_id = k.killmail_id' : ''}
    ${whereSql}
  `).all(...params).map((row) => row.killmail_id);
  if (!killmailIds.length) {
    return {
      killmails: 0,
      activity_events: 0,
      ingestion_audits: 0,
      data_quality_warnings: 0
    };
  }
  const placeholders = killmailIds.map(() => '?').join(', ');
  return {
    killmails: killmailIds.length,
    activity_events: db.prepare(`SELECT COUNT(*) AS count FROM activity_events WHERE killmail_id IN (${placeholders})`).get(...killmailIds).count,
    ingestion_audits: db.prepare(`SELECT COUNT(*) AS count FROM ingestion_audits WHERE killmail_id IN (${placeholders})`).get(...killmailIds).count,
    data_quality_warnings: countWarningsForKillmails(db, killmailIds)
  };
}

function countWarningsForKillmails(db, killmailIds) {
  const auditRunIds = db.prepare(`
    SELECT DISTINCT run_id
    FROM ingestion_audits
    WHERE killmail_id IN (${killmailIds.map(() => '?').join(', ')})
  `).all(...killmailIds).map((row) => row.run_id);
  if (!auditRunIds.length) {
    return 0;
  }
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM data_quality_warnings
    WHERE run_id IN (${auditRunIds.map(() => '?').join(', ')})
  `).get(...auditRunIds).count;
}

function queueRefCount(db, scope = {}) {
  const where = [];
  const params = [];
  if (scope.before) {
    where.push('last_seen_at < ?');
    params.push(scope.before);
  }
  if (scope.status) {
    where.push('status = ?');
    params.push(scope.status);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return db.prepare(`SELECT COUNT(*) AS count FROM discovered_killmail_refs ${whereSql}`).get(...params).count;
}

function countOlderThan(db, tableName, columnName, before) {
  if (!before) {
    return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
  }
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName} WHERE ${columnName} < ?`).get(before).count;
}

function evidenceWindowWhere(column, scope = {}) {
  const where = [];
  const params = [];
  if (scope.systemId || scope.system_id) {
    where.push('ae.solar_system_id = ?');
    params.push(Number(scope.systemId || scope.system_id));
  }
  if (scope.before) {
    where.push(`${column} < ?`);
    params.push(scope.before);
  }
  if (scope.after) {
    where.push(`${column} >= ?`);
    params.push(scope.after);
  }
  return {
    sql: where.length ? `AND ${where.join(' AND ')}` : '',
    params
  };
}

function evidenceRangeForEvents(events, scope = {}) {
  const times = events.map((event) => event.killmail_time).filter(Boolean).sort();
  return {
    start: scope.after || times[0] || null,
    end: scope.before || times[times.length - 1] || null,
    earliest_observed: times[0] || null,
    latest_observed: times[times.length - 1] || null
  };
}

function sourceRunIdsForKillmails(db, killmailIds) {
  if (!killmailIds.length) {
    return [];
  }
  return db.prepare(`
    SELECT DISTINCT run_id
    FROM ingestion_audits
    WHERE killmail_id IN (${killmailIds.map(() => '?').join(', ')})
    ORDER BY run_id
  `).all(...killmailIds).map((row) => row.run_id);
}

function cachedEntityName(db, entityType, entityId) {
  const known = db.prepare(`
    SELECT entity_name
    FROM entities
    WHERE entity_type = ? AND entity_id = ?
  `).get(entityType, entityId);
  return known?.entity_name || null;
}

function groupedSystems(events) {
  const bySystem = new Map();
  events.forEach((event) => {
    const key = event.solar_system_id || 'unknown';
    const current = bySystem.get(key) || {
      solar_system_id: event.solar_system_id || null,
      solar_system_name: event.solar_system_name || null,
      region_name: event.region_name || null,
      appearances: 0
    };
    current.appearances += 1;
    bySystem.set(key, current);
  });
  return [...bySystem.values()].sort((a, b) => b.appearances - a.appearances);
}

function groupedShips(events) {
  const byShip = new Map();
  events.filter((event) => event.ship_type_id).forEach((event) => {
    const key = `${event.role}:${event.ship_type_id}`;
    const current = byShip.get(key) || {
      role: event.role,
      type_id: event.ship_type_id,
      type_name: event.ship_type_name || null,
      appearances: 0
    };
    current.appearances += 1;
    byShip.set(key, current);
  });
  return [...byShip.values()].sort((a, b) => b.appearances - a.appearances);
}

function uniqueNumbers(values) {
  return [...new Set(values.map(Number).filter((value) => Number.isInteger(value) && value > 0))]
    .sort((a, b) => a - b);
}

function uniqueText(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function textOrNull(value) {
  const text = String(value || '').trim();
  return text || null;
}

module.exports = {
  listRetentionActions,
  buildRetentionPreflight,
  buildAssessmentCompactionPreview,
  assessmentArtifactInputFromCompactionPreview
};
