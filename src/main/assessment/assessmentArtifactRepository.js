const { nowIso } = require('../db/evidenceRepository');

const ARTIFACT_TYPES = new Set(['entity_interest', 'evidence_compaction', 'analyst_note']);
const ENTITY_TYPES = new Set(['character', 'corporation', 'alliance']);
const STATUSES = new Set(['active', 'cooling', 'archived', 'superseded']);
const SCORE_FIELDS = ['interestScore', 'priorityScore', 'impactScore', 'confidence'];

function createAssessmentArtifact(db, input = {}) {
  const artifact = normalizeArtifactInput(db, input);
  db.prepare(`
    INSERT INTO assessment_artifacts (
      artifact_id, artifact_type, entity_type, entity_id, entity_name, status,
      interest_score, priority_score, impact_score, confidence,
      assessment_reason, assessment_summary,
      evidence_window_start, evidence_window_end, evidence_scope_type, evidence_scope_json,
      source_report_type, source_report_parameters_json, source_run_ids_json,
      sample_killmail_ids_json, citation_status, citation_details_json,
      appearance_count, attacker_appearance_count, victim_appearance_count,
      systems_observed_json, regions_observed_json, ships_observed_json,
      created_at, updated_at, assessed_by, superseded_by_artifact_id, archived_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    artifact.artifact_id,
    artifact.artifact_type,
    artifact.entity_type,
    artifact.entity_id,
    artifact.entity_name,
    artifact.status,
    artifact.interest_score,
    artifact.priority_score,
    artifact.impact_score,
    artifact.confidence,
    artifact.assessment_reason,
    artifact.assessment_summary,
    artifact.evidence_window_start,
    artifact.evidence_window_end,
    artifact.evidence_scope_type,
    artifact.evidence_scope_json,
    artifact.source_report_type,
    artifact.source_report_parameters_json,
    artifact.source_run_ids_json,
    artifact.sample_killmail_ids_json,
    artifact.citation_status,
    artifact.citation_details_json,
    artifact.appearance_count,
    artifact.attacker_appearance_count,
    artifact.victim_appearance_count,
    artifact.systems_observed_json,
    artifact.regions_observed_json,
    artifact.ships_observed_json,
    artifact.created_at,
    artifact.updated_at,
    artifact.assessed_by,
    artifact.superseded_by_artifact_id,
    artifact.archived_at
  );
  return deserializeArtifact(artifact);
}

function listAssessmentArtifacts(db, filters = {}) {
  const where = [];
  const params = [];
  if (filters.artifactType || filters.artifact_type) {
    where.push('artifact_type = ?');
    params.push(normalizeArtifactType(filters.artifactType || filters.artifact_type));
  }
  if (filters.entityType || filters.entity_type) {
    where.push('entity_type = ?');
    params.push(normalizeEntityType(filters.entityType || filters.entity_type));
  }
  if (filters.entityId || filters.entity_id) {
    where.push('entity_id = ?');
    params.push(positiveInteger(filters.entityId || filters.entity_id, 'entityId'));
  }
  if (filters.status) {
    where.push('status = ?');
    params.push(normalizeStatus(filters.status));
  }
  const limit = positiveInteger(filters.limit || 20, 'limit');
  const rows = db.prepare(`
    SELECT *
    FROM assessment_artifacts
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY updated_at DESC, created_at DESC
    LIMIT ?
  `).all(...params, limit);
  return rows.map(deserializeArtifact);
}

function getAssessmentArtifact(db, artifactId) {
  const row = db.prepare(`
    SELECT *
    FROM assessment_artifacts
    WHERE artifact_id = ?
  `).get(String(artifactId || ''));
  return row ? deserializeArtifact(row) : null;
}

function normalizeArtifactInput(db, input) {
  const artifactType = normalizeArtifactType(input.artifactType || input.artifact_type || 'entity_interest');
  const entityType = input.entityType || input.entity_type ? normalizeEntityType(input.entityType || input.entity_type) : null;
  const entityId = input.entityId || input.entity_id ? positiveInteger(input.entityId || input.entity_id, 'entityId') : null;
  if ((artifactType === 'entity_interest' || artifactType === 'evidence_compaction') && (!entityType || !entityId)) {
    throw new Error(`${artifactType} artifacts require entityType and entityId`);
  }

  const assessmentReason = textOrNull(input.assessmentReason || input.assessment_reason || input.reason);
  const assessmentSummary = textOrNull(input.assessmentSummary || input.assessment_summary || input.summary);
  if (!assessmentReason && !assessmentSummary) {
    throw new Error('Assessment artifacts require assessmentReason or assessmentSummary');
  }

  const scores = {
    interestScore: scoreOrNull(input.interestScore ?? input.interest_score, 'interestScore'),
    priorityScore: scoreOrNull(input.priorityScore ?? input.priority_score, 'priorityScore'),
    impactScore: scoreOrNull(input.impactScore ?? input.impact_score, 'impactScore'),
    confidence: scoreOrNull(input.confidence, 'confidence')
  };
  if (SCORE_FIELDS.some((field) => scores[field] !== null) && !assessmentReason && !assessmentSummary) {
    throw new Error('Scores require an assessment reason or summary');
  }

  const createdAt = input.createdAt || input.created_at || nowIso();
  const updatedAt = input.updatedAt || input.updated_at || createdAt;
  const sampleKillmailIds = normalizeIdArray(input.sampleKillmailIds || input.sample_killmail_ids || input.sample_killmail_ids_json || []);
  const citation = validateCitationBasis(db, {
    artifactType,
    entityType,
    entityId,
    sampleKillmailIds,
    evidenceScopeType: input.evidenceScopeType || input.evidence_scope_type,
    sourceReportType: input.sourceReportType || input.source_report_type
  });

  return {
    artifact_id: input.artifactId || input.artifact_id || createArtifactId(),
    artifact_type: artifactType,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: textOrNull(input.entityName || input.entity_name),
    status: normalizeStatus(input.status || 'active'),
    interest_score: scores.interestScore,
    priority_score: scores.priorityScore,
    impact_score: scores.impactScore,
    confidence: scores.confidence,
    assessment_reason: assessmentReason,
    assessment_summary: assessmentSummary,
    evidence_window_start: textOrNull(input.evidenceWindowStart || input.evidence_window_start),
    evidence_window_end: textOrNull(input.evidenceWindowEnd || input.evidence_window_end),
    evidence_scope_type: textOrNull(input.evidenceScopeType || input.evidence_scope_type),
    evidence_scope_json: jsonText(input.evidenceScope || input.evidence_scope || input.evidence_scope_json),
    source_report_type: textOrNull(input.sourceReportType || input.source_report_type),
    source_report_parameters_json: jsonText(input.sourceReportParameters || input.source_report_parameters || input.source_report_parameters_json),
    source_run_ids_json: jsonText(input.sourceRunIds || input.source_run_ids || input.source_run_ids_json || []),
    sample_killmail_ids_json: jsonText(sampleKillmailIds),
    citation_status: citation.status,
    citation_details_json: jsonText(citation.details),
    appearance_count: nonNegativeInteger(input.appearanceCount ?? input.appearance_count ?? 0, 'appearanceCount'),
    attacker_appearance_count: nonNegativeInteger(input.attackerAppearanceCount ?? input.attacker_appearance_count ?? 0, 'attackerAppearanceCount'),
    victim_appearance_count: nonNegativeInteger(input.victimAppearanceCount ?? input.victim_appearance_count ?? 0, 'victimAppearanceCount'),
    systems_observed_json: jsonText(input.systemsObserved || input.systems_observed || input.systems_observed_json || []),
    regions_observed_json: jsonText(input.regionsObserved || input.regions_observed || input.regions_observed_json || []),
    ships_observed_json: jsonText(input.shipsObserved || input.ships_observed || input.ships_observed_json || []),
    created_at: createdAt,
    updated_at: updatedAt,
    assessed_by: textOrNull(input.assessedBy || input.assessed_by),
    superseded_by_artifact_id: textOrNull(input.supersededByArtifactId || input.superseded_by_artifact_id),
    archived_at: textOrNull(input.archivedAt || input.archived_at)
  };
}

function deserializeArtifact(row) {
  return {
    artifact_id: row.artifact_id,
    artifact_type: row.artifact_type,
    entity_type: row.entity_type || null,
    entity_id: row.entity_id || null,
    entity_name: row.entity_name || null,
    status: row.status,
    scores: {
      interest: row.interest_score,
      priority: row.priority_score,
      impact: row.impact_score,
      confidence: row.confidence
    },
    assessment_reason: row.assessment_reason || null,
    assessment_summary: row.assessment_summary || null,
    evidence_window: {
      start: row.evidence_window_start || null,
      end: row.evidence_window_end || null
    },
    evidence_scope_type: row.evidence_scope_type || null,
    evidence_scope: parseJson(row.evidence_scope_json, null),
    source_report_type: row.source_report_type || null,
    source_report_parameters: parseJson(row.source_report_parameters_json, null),
    source_run_ids: parseJson(row.source_run_ids_json, []),
    sample_killmail_ids: parseJson(row.sample_killmail_ids_json, []),
    citation: {
      status: row.citation_status || 'not_applicable',
      details: parseJson(row.citation_details_json, defaultCitationDetails(row.citation_status))
    },
    counts: {
      appearances: row.appearance_count,
      attacker_appearances: row.attacker_appearance_count,
      victim_appearances: row.victim_appearance_count
    },
    observed: {
      systems: parseJson(row.systems_observed_json, []),
      regions: parseJson(row.regions_observed_json, []),
      ships: parseJson(row.ships_observed_json, [])
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
    assessed_by: row.assessed_by || null,
    superseded_by_artifact_id: row.superseded_by_artifact_id || null,
    archived_at: row.archived_at || null,
    boundary: 'assessment artifacts are assessment memory, not evidence'
  };
}

function validateCitationBasis(db, citation) {
  const sampleKillmailIds = citation.sampleKillmailIds || [];
  if (!sampleKillmailIds.length) {
    return {
      status: 'not_applicable',
      details: {
        cited_killmail_ids: [],
        verified_killmail_ids: [],
        missing_killmail_ids: [],
        actor_scope_verified: actorScopeStatus(db, citation),
        note: 'No sample killmail IDs were cited.'
      }
    };
  }

  const verifiedKillmailIds = existingKillmailIds(db, sampleKillmailIds);
  const verified = new Set(verifiedKillmailIds);
  const missingKillmailIds = sampleKillmailIds.filter((id) => !verified.has(id));
  if (missingKillmailIds.length) {
    const error = new Error(`Assessment citation references missing local killmail IDs: ${missingKillmailIds.join(', ')}`);
    error.code = 'ASSESSMENT_CITATION_MISSING_KILLMAILS';
    error.citation = {
      status: verifiedKillmailIds.length ? 'partial' : 'unverified',
      cited_killmail_ids: sampleKillmailIds,
      verified_killmail_ids: verifiedKillmailIds,
      missing_killmail_ids: missingKillmailIds
    };
    throw error;
  }

  const actorStatus = actorScopeStatus(db, citation, sampleKillmailIds);
  if (actorStatus.required && !actorStatus.verified) {
    const error = new Error(`Assessment citation actor ${citation.entityType}:${citation.entityId} was not found in cited local killmail activity events`);
    error.code = 'ASSESSMENT_CITATION_ACTOR_SCOPE_MISMATCH';
    error.citation = {
      status: 'unverified',
      cited_killmail_ids: sampleKillmailIds,
      verified_killmail_ids: verifiedKillmailIds,
      missing_killmail_ids: [],
      actor_scope: actorStatus
    };
    throw error;
  }

  return {
    status: 'verified',
    details: {
      cited_killmail_ids: sampleKillmailIds,
      verified_killmail_ids: verifiedKillmailIds,
      missing_killmail_ids: [],
      actor_scope_verified: actorStatus,
      note: 'All cited sample killmail IDs existed locally when the assessment artifact was created.'
    }
  };
}

function existingKillmailIds(db, killmailIds) {
  if (!killmailIds.length) {
    return [];
  }
  const placeholders = killmailIds.map(() => '?').join(', ');
  return db.prepare(`
    SELECT killmail_id
    FROM killmails
    WHERE killmail_id IN (${placeholders})
    ORDER BY killmail_id
  `).all(...killmailIds).map((row) => row.killmail_id);
}

function actorScopeStatus(db, citation, sampleKillmailIds = []) {
  if (!citation.entityType || !citation.entityId) {
    return {
      required: false,
      verified: false,
      reason: 'No typed entity scope supplied.'
    };
  }

  const scopeType = String(citation.evidenceScopeType || citation.sourceReportType || '').toLowerCase();
  const requiresActorScope = citation.artifactType === 'entity_interest' ||
    citation.artifactType === 'evidence_compaction' ||
    scopeType === 'actor';
  if (!requiresActorScope) {
    return {
      required: false,
      verified: false,
      reason: 'Artifact type does not require actor scoped citation.'
    };
  }

  const baseSql = `
    SELECT COUNT(*) AS count
    FROM activity_events
    WHERE entity_type = ? AND entity_id = ?
  `;
  const row = sampleKillmailIds.length
    ? db.prepare(`${baseSql} AND killmail_id IN (${sampleKillmailIds.map(() => '?').join(', ')})`).get(citation.entityType, citation.entityId, ...sampleKillmailIds)
    : db.prepare(baseSql).get(citation.entityType, citation.entityId);

  return {
    required: true,
    verified: row.count > 0,
    event_count: row.count
  };
}

function normalizeIdArray(value) {
  const raw = typeof value === 'string' ? parseJson(value, []) : value;
  if (!Array.isArray(raw)) {
    throw new Error('sampleKillmailIds must be an array');
  }
  return [...new Set(raw.map((id) => positiveInteger(id, 'sampleKillmailIds')))].sort((a, b) => a - b);
}

function defaultCitationDetails(status) {
  return {
    cited_killmail_ids: [],
    verified_killmail_ids: [],
    missing_killmail_ids: [],
    note: status ? 'Citation details were not stored for this artifact.' : 'Legacy artifact without citation status.'
  };
}

function normalizeArtifactType(value) {
  const type = String(value || '').toLowerCase();
  if (!ARTIFACT_TYPES.has(type)) {
    throw new Error('artifactType must be entity_interest, evidence_compaction, or analyst_note');
  }
  return type;
}

function normalizeEntityType(value) {
  const type = String(value || '').toLowerCase();
  if (!ENTITY_TYPES.has(type)) {
    throw new Error('entityType must be character, corporation, or alliance');
  }
  return type;
}

function normalizeStatus(value) {
  const status = String(value || '').toLowerCase();
  if (!STATUSES.has(status)) {
    throw new Error('status must be active, cooling, archived, or superseded');
  }
  return status;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return number;
}

function nonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return number;
}

function scoreOrNull(value, label) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 100) {
    throw new Error(`${label} must be an integer from 0 to 100`);
  }
  return number;
}

function textOrNull(value) {
  const text = String(value || '').trim();
  return text || null;
}

function jsonText(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value === 'string') {
    JSON.parse(value);
    return value;
  }
  return JSON.stringify(value);
}

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function createArtifactId() {
  return `assessment_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

module.exports = {
  createAssessmentArtifact,
  getAssessmentArtifact,
  listAssessmentArtifacts
};
