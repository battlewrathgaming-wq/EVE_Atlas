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
      assessment_recommended: definition.preservation === 'assessment_recommended'
    },
    scope,
    impact,
    blockers,
    warnings
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
  if (scope.systemId) {
    where.push('solar_system_id = ?');
    params.push(Number(scope.systemId));
  }
  if (scope.before) {
    where.push('killmail_time < ?');
    params.push(scope.before);
  }
  if (scope.after) {
    where.push('killmail_time >= ?');
    params.push(scope.after);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const killmailIds = db.prepare(`
    SELECT killmail_id
    FROM killmails
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

module.exports = {
  listRetentionActions,
  buildRetentionPreflight
};
