const crypto = require('node:crypto');
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
    preservation: 'not_required',
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
      'DELETION_EXECUTION_BLOCKED',
      'Evidence deletion execution is not implemented; this response is a read-only preflight only',
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
    deletion_policy: action === 'evidence.prune_scope' ? evidenceDeletionPolicy() : null,
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

function buildEvidencePruneExecutionFixtureProof(db, input = {}) {
  const action = 'retention.evidence_prune_execution.fixture_proof';
  const scope = input.scope || {};
  const suppliedCandidateIds = selectedEvidenceKillmailIds({
    killmailIds: input.candidateKillmailIds || input.candidate_killmail_ids || []
  });
  if (input.fixtureOnly !== true && input.fixture_only !== true) {
    return fixtureProofBlocked(action, 'fixture_only_context_required', scope, {
      supplied_candidate_ids_ignored: suppliedCandidateIds.length > 0
    });
  }

  const preflight = buildRetentionPreflight(db, {
    action: 'evidence.prune_scope',
    confirmation: 'evidence.prune_scope',
    scope
  });
  const preview = fixturePreviewFromPreflight(preflight);
  const digest = digestFixturePreview(preview);
  const confirmation = normalizeFixtureProofConfirmation(input.confirmation);
  const execute = input.execute === true;

  if (!execute) {
    return {
      action,
      fixture_only: true,
      status: 'preview_ready',
      execution_attempted: false,
      deletion_executed: false,
      renderer_eligible: false,
      product_deletion_command: false,
      source_of_candidate_ids: 'server_retention_preflight',
      supplied_candidate_ids_ignored: suppliedCandidateIds.length > 0,
      preview_digest: digest,
      preview,
      support_artifact_disclosure: supportArtifactDisclosure(),
      no_footprint_policy: noFootprintPreviewPolicy(),
      warnings: fixtureProofWarnings()
    };
  }

  if (!preview.candidate_killmail_ids.length) {
    return fixtureProofBlocked(action, 'empty_scope_no_candidates', scope, {
      preview_digest: digest,
      preview,
      supplied_candidate_ids_ignored: suppliedCandidateIds.length > 0
    });
  }
  if (confirmation.preview_digest !== digest) {
    const mismatchReason = isSha256Digest(confirmation.preview_digest)
      ? 'stale_or_changed_preview'
      : 'preview_digest_mismatch';
    return fixtureProofBlocked(action, 'preview_digest_mismatch', scope, {
      reason: mismatchReason,
      preview_digest: digest,
      confirmed_preview_digest: confirmation.preview_digest,
      preview,
      supplied_candidate_ids_ignored: suppliedCandidateIds.length > 0
    });
  }

  return executeFixtureEvidencePrune(db, {
    action,
    scope,
    preview,
    digest,
    suppliedCandidateIds,
    injectedFailureStage: input.injectedFailureStage || input.injected_failure_stage || null
  });
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

function fixturePreviewFromPreflight(preflight) {
  const relationshipContext = preflight.impact?.relationship_context || {};
  const candidateIds = uniqueNumbers(relationshipContext.basis?.selected_killmail_ids || []);
  const warningRows = relationshipContext.audit_warning_rows?.data_quality_warnings || {};
  return {
    action: preflight.action,
    scope: normalizedObject(preflight.scope || {}),
    candidate_killmail_ids: candidateIds,
    counts: {
      killmails: Number(preflight.impact?.killmails) || 0,
      activity_events: Number(preflight.impact?.activity_events) || 0,
      ingestion_audits: Number(preflight.impact?.ingestion_audits) || 0,
      data_quality_warnings: Number(preflight.impact?.data_quality_warnings) || 0,
      killmail_linked_data_quality_warnings: Number(warningRows.selected_killmail_rows) || 0,
      run_level_data_quality_warnings: Number(warningRows.run_level_rows) || 0,
      assessment_artifact_references: Number(preflight.impact?.assessment_artifact_references) || 0,
      discovery_refs: Number(relationshipContext.discovery_refs?.count) || 0
    },
    relationship_context_basis: {
      scope_kind: relationshipContext.basis?.scope_kind || null,
      discovery_refs_are_evidence: relationshipContext.basis?.discovery_refs_are_evidence === true,
      computed_relationships_are_durable_truth: relationshipContext.basis?.computed_relationships_are_durable_truth === true
    }
  };
}

function digestFixturePreview(preview) {
  const digestBasis = {
    action: 'retention.evidence_prune_execution.fixture_proof',
    preflight_action: preview.action,
    scope: preview.scope,
    candidate_killmail_ids: preview.candidate_killmail_ids,
    counts: preview.counts
  };
  return crypto.createHash('sha256').update(stableJson(digestBasis)).digest('hex');
}

function executeFixtureEvidencePrune(db, details) {
  const {
    action,
    scope,
    preview,
    digest,
    suppliedCandidateIds,
    injectedFailureStage
  } = details;
  const candidateIds = preview.candidate_killmail_ids;
  const beforeCounts = fixtureProofTableCounts(db);

  db.exec('BEGIN IMMEDIATE;');
  try {
    const transactionPreflight = buildRetentionPreflight(db, {
      action: 'evidence.prune_scope',
      confirmation: 'evidence.prune_scope',
      scope
    });
    const transactionPreview = fixturePreviewFromPreflight(transactionPreflight);
    const transactionDigest = digestFixturePreview(transactionPreview);
    if (transactionDigest !== digest) {
      db.exec('ROLLBACK;');
      return fixtureProofBlocked(action, 'stale_or_changed_preview', scope, {
        preview_digest: transactionDigest,
        confirmed_preview_digest: digest,
        preview: transactionPreview,
        supplied_candidate_ids_ignored: suppliedCandidateIds.length > 0
      });
    }

    const deleted = deleteFixtureEvidenceRows(db, candidateIds, injectedFailureStage);
    const orphanCheck = selectedOrphanCheck(db, candidateIds);
    if (orphanCheck.activity_events || orphanCheck.ingestion_audits || orphanCheck.killmail_linked_warnings) {
      throw new Error(`selected_orphan_rows_remaining:${stableJson(orphanCheck)}`);
    }
    const foreignKeyProblems = db.prepare('PRAGMA foreign_key_check').all();
    if (foreignKeyProblems.length) {
      throw new Error(`foreign_key_check_failed:${stableJson(foreignKeyProblems)}`);
    }

    db.exec('COMMIT;');
    const afterCounts = fixtureProofTableCounts(db);
    return {
      action,
      fixture_only: true,
      status: 'fixture_delete_succeeded',
      execution_attempted: true,
      deletion_executed: true,
      renderer_eligible: false,
      product_deletion_command: false,
      source_of_candidate_ids: 'server_retention_preflight',
      supplied_candidate_ids_ignored: suppliedCandidateIds.length > 0,
      preview_digest: digest,
      candidate_killmail_ids: candidateIds,
      deleted_counts: deleted,
      retained_counts: {
        discovered_killmail_refs: afterCounts.discovered_killmail_refs,
        assessment_artifacts: afterCounts.assessment_artifacts,
        fetch_runs: afterCounts.fetch_runs,
        api_request_logs: afterCounts.api_request_logs,
        run_level_data_quality_warnings: afterCounts.run_level_data_quality_warnings,
        watchlist_entities: afterCounts.watchlist_entities,
        system_watches: afterCounts.system_watches,
        entities: afterCounts.entities,
        metadata_runs: afterCounts.metadata_runs,
        type_metadata: afterCounts.type_metadata,
        solar_systems: afterCounts.solar_systems
      },
      before_counts: beforeCounts,
      after_counts: afterCounts,
      post_delete_integrity: {
        selected_orphans: orphanCheck,
        foreign_key_check: 'passed'
      },
      support_artifact_disclosure: supportArtifactDisclosure(),
      no_footprint_policy: noFootprintPreviewPolicy(),
      warnings: fixtureProofWarnings()
    };
  } catch (error) {
    db.exec('ROLLBACK;');
    return {
      action,
      fixture_only: true,
      status: 'fixture_delete_rolled_back',
      reason: String(error.message || error),
      execution_attempted: true,
      deletion_executed: false,
      renderer_eligible: false,
      product_deletion_command: false,
      source_of_candidate_ids: 'server_retention_preflight',
      supplied_candidate_ids_ignored: suppliedCandidateIds.length > 0,
      preview_digest: digest,
      candidate_killmail_ids: candidateIds,
      before_counts: beforeCounts,
      after_counts: fixtureProofTableCounts(db),
      support_artifact_disclosure: supportArtifactDisclosure(),
      no_footprint_policy: noFootprintPreviewPolicy(),
      warnings: fixtureProofWarnings()
    };
  }
}

function deleteFixtureEvidenceRows(db, candidateIds, injectedFailureStage) {
  const placeholders = candidateIds.map(() => '?').join(', ');
  const deleted = {
    activity_events: db.prepare(`DELETE FROM activity_events WHERE killmail_id IN (${placeholders})`).run(...candidateIds).changes,
    ingestion_audits: 0,
    data_quality_warnings: 0,
    killmails: 0
  };
  maybeInjectFixtureFailure(injectedFailureStage, 'after_activity_events');
  deleted.ingestion_audits = db.prepare(`DELETE FROM ingestion_audits WHERE killmail_id IN (${placeholders})`).run(...candidateIds).changes;
  maybeInjectFixtureFailure(injectedFailureStage, 'after_ingestion_audits');
  deleted.data_quality_warnings = db.prepare(`DELETE FROM data_quality_warnings WHERE killmail_id IN (${placeholders})`).run(...candidateIds).changes;
  maybeInjectFixtureFailure(injectedFailureStage, 'after_data_quality_warnings');
  deleted.killmails = db.prepare(`DELETE FROM killmails WHERE killmail_id IN (${placeholders})`).run(...candidateIds).changes;
  maybeInjectFixtureFailure(injectedFailureStage, 'after_killmails');
  return deleted;
}

function maybeInjectFixtureFailure(injectedFailureStage, stage) {
  if (injectedFailureStage === stage) {
    throw new Error(`injected_fixture_failure:${stage}`);
  }
}

function selectedOrphanCheck(db, candidateIds) {
  if (!candidateIds.length) {
    return {
      activity_events: 0,
      ingestion_audits: 0,
      killmail_linked_warnings: 0
    };
  }
  const placeholders = candidateIds.map(() => '?').join(', ');
  return {
    activity_events: db.prepare(`SELECT COUNT(*) AS count FROM activity_events WHERE killmail_id IN (${placeholders})`).get(...candidateIds).count,
    ingestion_audits: db.prepare(`SELECT COUNT(*) AS count FROM ingestion_audits WHERE killmail_id IN (${placeholders})`).get(...candidateIds).count,
    killmail_linked_warnings: db.prepare(`SELECT COUNT(*) AS count FROM data_quality_warnings WHERE killmail_id IN (${placeholders})`).get(...candidateIds).count
  };
}

function fixtureProofBlocked(action, reason, scope, extra = {}) {
  return {
    action,
    fixture_only: true,
    status: 'blocked',
    reason,
    scope,
    execution_attempted: false,
    deletion_executed: false,
    renderer_eligible: false,
    product_deletion_command: false,
    support_artifact_disclosure: supportArtifactDisclosure(),
    no_footprint_policy: noFootprintPreviewPolicy(),
    warnings: fixtureProofWarnings(),
    ...extra
  };
}

function normalizeFixtureProofConfirmation(value) {
  if (!value || typeof value !== 'object') {
    return { preview_digest: null };
  }
  return {
    preview_digest: textOrNull(value.previewDigest || value.preview_digest)
  };
}

function isSha256Digest(value) {
  return /^[a-f0-9]{64}$/i.test(String(value || ''));
}

function fixtureProofWarnings() {
  return [
    'fixture_disposable_data_only',
    'not_real_operator_deletion',
    'no_renderer_or_product_deletion_command',
    'discovery_refs_assessment_memory_provenance_watch_marked_and_support_artifacts_are_not_mutated',
    'no_retained_deletion_footprint'
  ];
}

function fixtureProofTableCounts(db) {
  return {
    killmails: countTableRows(db, 'killmails'),
    activity_events: countTableRows(db, 'activity_events'),
    ingestion_audits: countTableRows(db, 'ingestion_audits'),
    data_quality_warnings: countTableRows(db, 'data_quality_warnings'),
    killmail_linked_data_quality_warnings: db.prepare('SELECT COUNT(*) AS count FROM data_quality_warnings WHERE killmail_id IS NOT NULL').get().count,
    run_level_data_quality_warnings: db.prepare('SELECT COUNT(*) AS count FROM data_quality_warnings WHERE killmail_id IS NULL').get().count,
    discovered_killmail_refs: countTableRows(db, 'discovered_killmail_refs'),
    assessment_artifacts: countTableRows(db, 'assessment_artifacts'),
    fetch_runs: countTableRows(db, 'fetch_runs'),
    api_request_logs: countTableRows(db, 'api_request_logs'),
    watchlist_entities: countTableRows(db, 'watchlist_entities'),
    system_watches: countTableRows(db, 'system_watches'),
    entity_dispositions: countTableRows(db, 'entity_dispositions'),
    entities: countTableRows(db, 'entities'),
    metadata_runs: countTableRows(db, 'metadata_runs'),
    type_metadata: countTableRows(db, 'type_metadata'),
    solar_systems: countTableRows(db, 'solar_systems'),
    sde_imports: countTableRows(db, 'sde_imports'),
    sde_inventory_imports: countTableRows(db, 'sde_inventory_imports')
  };
}

function countTableRows(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function normalizedObject(value) {
  if (Array.isArray(value)) {
    return value.map(normalizedObject);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = normalizedObject(value[key]);
      return acc;
    }, {});
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(normalizedObject(value));
}

function evidenceScopeImpact(db, scope = {}) {
  const where = [];
  const params = [];
  const selectedKillmailIds = selectedEvidenceKillmailIds(scope);
  const entityType = String(scope.entityType || scope.entity_type || scope.actorType || scope.actor_type || '').toLowerCase();
  const entityId = Number(scope.entityId ?? scope.entity_id ?? scope.actorId ?? scope.actor_id);
  const hasActorScope = ['character', 'corporation', 'alliance'].includes(entityType) && Number.isInteger(entityId) && entityId > 0;
  if (selectedKillmailIds.length) {
    where.push(`k.killmail_id IN (${selectedKillmailIds.map(() => '?').join(', ')})`);
    params.push(...selectedKillmailIds);
  }
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
      data_quality_warnings: 0,
      assessment_artifact_references: 0,
      affected_assessment_artifacts: [],
      relationship_context: emptyPruningRelationshipContext(scope)
    };
  }
  const placeholders = killmailIds.map(() => '?').join(', ');
  const ingestionAudits = ingestionAuditRowsForKillmails(db, killmailIds);
  const auditRunIds = uniqueText(ingestionAudits.map((row) => row.run_id));
  const dataQualityWarnings = dataQualityWarningsForEvidence(db, killmailIds, auditRunIds);
  const affectedAssessmentArtifacts = assessmentArtifactsForKillmails(db, killmailIds, auditRunIds);
  const activityEventCount = db.prepare(`SELECT COUNT(*) AS count FROM activity_events WHERE killmail_id IN (${placeholders})`).get(...killmailIds).count;
  return {
    killmails: killmailIds.length,
    activity_events: activityEventCount,
    ingestion_audits: ingestionAudits.length,
    data_quality_warnings: dataQualityWarnings.count,
    assessment_artifact_references: affectedAssessmentArtifacts.length,
    affected_assessment_artifacts: affectedAssessmentArtifacts,
    relationship_context: buildPruningRelationshipContext(db, {
      scope,
      killmailIds,
      activityEventCount,
      ingestionAudits,
      dataQualityWarnings,
      affectedAssessmentArtifacts
    })
  };
}

function selectedEvidenceKillmailIds(scope = {}) {
  const raw = scope.killmailIds || scope.killmail_ids || scope.killmailId || scope.killmail_id || [];
  const values = Array.isArray(raw) ? raw : [raw];
  return uniqueNumbers(values);
}

function assessmentArtifactsForKillmails(db, killmailIds, runIds = []) {
  if (!killmailIds.length) {
    return [];
  }
  const selected = new Set(killmailIds.map(Number));
  const selectedRunIds = new Set(runIds.map(String));
  const rows = db.prepare(`
    SELECT artifact_id, artifact_type, entity_type, entity_id, status,
           source_run_ids_json, sample_killmail_ids_json, citation_status
    FROM assessment_artifacts
    WHERE sample_killmail_ids_json IS NOT NULL OR source_run_ids_json IS NOT NULL
    ORDER BY updated_at DESC, created_at DESC, artifact_id
  `).all();
  return rows
    .map((row) => {
      const sampleIds = parseJsonArray(row.sample_killmail_ids_json)
        .map(Number)
        .filter((value) => Number.isInteger(value) && selected.has(value));
      const sourceRunIds = parseJsonArray(row.source_run_ids_json)
        .map(String)
        .filter((value) => selectedRunIds.has(value));
      if (!sampleIds.length && !sourceRunIds.length) {
        return null;
      }
      return {
        artifact_id: row.artifact_id,
        artifact_type: row.artifact_type,
        entity_type: row.entity_type || null,
        entity_id: row.entity_id || null,
        status: row.status,
        citation_status: row.citation_status || 'not_applicable',
        referenced_killmail_ids: sampleIds,
        referenced_run_ids: sourceRunIds,
        stale_risk_after_future_evidence_prune: true,
        deletion_blocker: false,
        interpretation: 'Assessment Memory is mutable, disposable, and stale after Evidence deletion; it is not Evidence and not a deletion blocker.'
      };
    })
    .filter(Boolean);
}

function evidenceDeletionPolicy() {
  return {
    execution_status: 'blocked_preflight_only',
    execution_note: 'HS69 does not implement deletion execution; retention.preflight only reports scope, policy, and affected-row counts.',
    selected_active_data_policy: 'If future deletion is explicitly confirmed, Atlas should delete selected deletable active data in scope.',
    no_retained_footprint: true,
    footprint_policy: 'No retained deletion footprint is accepted: no killmail_id + pilot_id, value, rating, note, catchment field, raw Evidence, full activity events, participant arrays, or hidden copy.',
    rejected_footprint_fields: [
      'killmail_id + pilot_id',
      'EVE_value',
      'EVE_Pilot_value',
      'EVE_rating',
      'EVE_interest_score',
      'Spare_1A',
      'Spare_1B',
      'custom note',
      'custom value',
      'custom rating',
      'catchment field'
    ],
    snapshot_recovery_disclosure: 'Snapshots/backups are separate historical support artifacts and may retain records removed from active storage unless separately deleted.',
    assessment_memory_policy: 'Assessment Memory is mutable, disposable, and quickly stale; it is not Evidence, not hidden retention, and not a deletion blocker.'
  };
}

function countWarningsForKillmails(db, killmailIds) {
  const auditRunIds = sourceRunIdsForKillmails(db, killmailIds);
  return dataQualityWarningsForEvidence(db, killmailIds, auditRunIds).count;
}

function emptyPruningRelationshipContext(scope = {}) {
  return {
    preview_only: true,
    read_only: true,
    basis: {
      scope_kind: pruningScopeKind(scope),
      selected_killmail_ids: [],
      computed_relationships_are_durable_truth: false,
      discovery_refs_are_evidence: false,
      note: 'No local Evidence/EVEidence rows matched this pruning preview scope.'
    },
    evidence_rows: {
      killmails: { count: 0, ids: [] },
      activity_events: { count: 0, roles: [] }
    },
    audit_warning_rows: {
      ingestion_audits: { count: 0, run_ids: [] },
      data_quality_warnings: { count: 0, warning_types: [] }
    },
    discovery_refs: discoveryRefBoundary(0, [], []),
    assessment_memory: assessmentMemoryBoundary([]),
    watch_marked_context: watchMarkedBoundary([], [], []),
    provenance_logs: provenanceLogBoundary([], [], []),
    support_artifact_disclosure: supportArtifactDisclosure(),
    no_footprint_policy: noFootprintPreviewPolicy(),
    context_warnings: ['no_evidence_rows_in_scope']
  };
}

function buildPruningRelationshipContext(db, details) {
  const {
    scope,
    killmailIds,
    activityEventCount,
    ingestionAudits,
    dataQualityWarnings,
    affectedAssessmentArtifacts
  } = details;
  const auditRunIds = uniqueText(ingestionAudits.map((row) => row.run_id));
  const discoveryRefs = discoveryRefsForKillmails(db, killmailIds);
  const fetchRuns = fetchRunsForRunIds(db, auditRunIds);
  const apiLogs = apiRequestLogsForRunIds(db, auditRunIds);
  const activityRows = activityRowsForKillmails(db, killmailIds);
  const watchContext = watchMarkedContextForKillmails(db, killmailIds);

  return {
    preview_only: true,
    read_only: true,
    basis: {
      scope_kind: pruningScopeKind(scope),
      selected_killmail_ids: killmailIds,
      computed_relationships_are_durable_truth: false,
      discovery_refs_are_evidence: false,
      note: 'Relationship groups are computed from current local rows for operator review; they are not stored truth and do not authorize deletion.'
    },
    evidence_rows: {
      killmails: {
        count: killmailIds.length,
        ids: killmailIds
      },
      activity_events: {
        count: activityEventCount,
        roles: countBy(activityRows, 'role'),
        entity_types: countBy(activityRows, 'entity_type'),
        systems: countBy(activityRows, 'solar_system_id')
      }
    },
    audit_warning_rows: {
      ingestion_audits: {
        count: ingestionAudits.length,
        run_ids: auditRunIds,
        normalizer_versions: countBy(ingestionAudits, 'normalizer_version')
      },
      data_quality_warnings: {
        count: dataQualityWarnings.count,
        warning_types: dataQualityWarnings.warning_types,
        run_ids: dataQualityWarnings.run_ids,
        selected_killmail_rows: dataQualityWarnings.selected_killmail_rows,
        run_level_rows: dataQualityWarnings.run_level_rows
      }
    },
    discovery_refs: discoveryRefBoundary(discoveryRefs.length, discoveryRefs, killmailIds),
    assessment_memory: assessmentMemoryBoundary(affectedAssessmentArtifacts),
    watch_marked_context: watchMarkedBoundary(
      watchContext.watchlistEntities,
      watchContext.systemWatches,
      watchContext.evidenceSystems
    ),
    provenance_logs: provenanceLogBoundary(fetchRuns, apiLogs, auditRunIds),
    support_artifact_disclosure: supportArtifactDisclosure(),
    no_footprint_policy: noFootprintPreviewPolicy(),
    context_warnings: pruningContextWarnings({
      discoveryRefs,
      affectedAssessmentArtifacts,
      fetchRuns,
      apiLogs,
      dataQualityWarnings
    })
  };
}

function pruningScopeKind(scope = {}) {
  if (selectedEvidenceKillmailIds(scope).length) {
    return 'selected_killmails';
  }
  const entityType = String(scope.entityType || scope.entity_type || scope.actorType || scope.actor_type || '').toLowerCase();
  const entityId = Number(scope.entityId ?? scope.entity_id ?? scope.actorId ?? scope.actor_id);
  if (['character', 'corporation', 'alliance'].includes(entityType) && Number.isInteger(entityId) && entityId > 0) {
    return 'actor_entity_window';
  }
  if (scope.systemId || scope.system_id) {
    return 'system_time_window';
  }
  if (scope.before || scope.after) {
    return 'time_window';
  }
  return 'unscoped_preview';
}

function ingestionAuditRowsForKillmails(db, killmailIds) {
  if (!killmailIds.length) {
    return [];
  }
  return db.prepare(`
    SELECT run_id, killmail_id, normalized_event_count, attacker_count,
           victim_present, warnings, normalizer_version, created_at
    FROM ingestion_audits
    WHERE killmail_id IN (${killmailIds.map(() => '?').join(', ')})
    ORDER BY created_at DESC, run_id, killmail_id
  `).all(...killmailIds);
}

function dataQualityWarningsForEvidence(db, killmailIds, runIds = []) {
  const where = [];
  const params = [];
  if (killmailIds.length) {
    where.push(`killmail_id IN (${killmailIds.map(() => '?').join(', ')})`);
    params.push(...killmailIds);
  }
  if (runIds.length) {
    where.push(`run_id IN (${runIds.map(() => '?').join(', ')})`);
    params.push(...runIds);
  }
  if (!where.length) {
    return {
      count: 0,
      warning_types: [],
      run_ids: [],
      selected_killmail_rows: 0,
      run_level_rows: 0
    };
  }
  const rows = db.prepare(`
    SELECT run_id, killmail_id, warning_type, created_at
    FROM data_quality_warnings
    WHERE ${where.join(' OR ')}
    ORDER BY created_at DESC, warning_type, run_id
  `).all(...params);
  const selected = new Set(killmailIds.map(Number));
  return {
    count: rows.length,
    warning_types: countBy(rows, 'warning_type'),
    run_ids: uniqueText(rows.map((row) => row.run_id)),
    selected_killmail_rows: rows.filter((row) => selected.has(Number(row.killmail_id))).length,
    run_level_rows: rows.filter((row) => !row.killmail_id).length
  };
}

function discoveryRefsForKillmails(db, killmailIds) {
  if (!killmailIds.length) {
    return [];
  }
  return db.prepare(`
    SELECT killmail_id, killmail_hash, discovered_by_type, discovered_by_id,
           source_scope, source_system_id, source_actor_type, source_actor_id,
           first_seen_run_id, last_seen_run_id, status, selected_for_expansion_at,
           expanded_at, failed_at, failure_count, priority
    FROM discovered_killmail_refs
    WHERE killmail_id IN (${killmailIds.map(() => '?').join(', ')})
    ORDER BY status, priority, killmail_id
  `).all(...killmailIds);
}

function discoveryRefBoundary(count, rows, killmailIds) {
  return {
    count,
    selected_killmail_ids: killmailIds,
    statuses: countBy(rows, 'status'),
    discovered_by_types: countBy(rows, 'discovered_by_type'),
    source_actor_types: countBy(rows, 'source_actor_type'),
    selected_for_expansion_count: rows.filter((row) => Boolean(row.selected_for_expansion_at)).length,
    interpretation: 'Discovery refs are possible leads/provenance sharing killmail IDs; they are not Evidence/EVEidence and are not used as observations.',
    deletion_policy_note: 'Discovery ref pruning is separate from active Evidence/EVEidence pruning and is not executed by this preview.'
  };
}

function activityRowsForKillmails(db, killmailIds) {
  if (!killmailIds.length) {
    return [];
  }
  return db.prepare(`
    SELECT killmail_id, role, entity_type, entity_id, entity_name, solar_system_id
    FROM activity_events
    WHERE killmail_id IN (${killmailIds.map(() => '?').join(', ')})
    ORDER BY killmail_id, role, entity_type, entity_id
  `).all(...killmailIds);
}

function watchMarkedContextForKillmails(db, killmailIds) {
  if (!killmailIds.length) {
    return {
      watchlistEntities: [],
      systemWatches: [],
      evidenceSystems: []
    };
  }
  const activityRows = activityRowsForKillmails(db, killmailIds);
  const entityKeys = [...new Map(activityRows
    .filter((row) => row.entity_type && row.entity_id)
    .map((row) => [`${row.entity_type}:${row.entity_id}`, {
      entity_type: row.entity_type,
      entity_id: row.entity_id
    }])).values()];
  const watchlistEntities = entityKeys.flatMap((entity) => db.prepare(`
    SELECT watch_id, entity_type, entity_id, entity_name, is_active, next_poll_at, last_success_at
    FROM watchlist_entities
    WHERE entity_type = ? AND entity_id = ?
  `).all(entity.entity_type, entity.entity_id));
  const evidenceSystems = uniqueNumbers(activityRows.map((row) => row.solar_system_id));
  const systemWatches = evidenceSystems.length ? db.prepare(`
    SELECT watch_id, center_system_id, center_system_name, is_active, radius_jumps, next_poll_at, last_success_at
    FROM system_watches
    WHERE center_system_id IN (${evidenceSystems.map(() => '?').join(', ')})
    ORDER BY watch_id
  `).all(...evidenceSystems) : [];
  return {
    watchlistEntities,
    systemWatches,
    evidenceSystems
  };
}

function watchMarkedBoundary(watchlistEntities, systemWatches, evidenceSystems) {
  return {
    determinable: true,
    meaning_limited: true,
    watchlist_attention_rows: {
      count: watchlistEntities.length,
      active_count: watchlistEntities.filter((row) => row.is_active).length,
      entity_types: countBy(watchlistEntities, 'entity_type')
    },
    direct_system_watch_rows: {
      count: systemWatches.length,
      active_count: systemWatches.filter((row) => row.is_active).length,
      center_system_ids: uniqueNumbers(systemWatches.map((row) => row.center_system_id))
    },
    evidence_system_ids_considered: evidenceSystems,
    interpretation: 'Watch/Marked-adjacent rows are attention or active-check context only; Marked is not Evidence, Watch is not Evidence, and Marked does not imply Watch.'
  };
}

function fetchRunsForRunIds(db, runIds) {
  if (!runIds.length) {
    return [];
  }
  return db.prepare(`
    SELECT run_id, trigger, watch_type, watch_id, started_at, finished_at, status,
           discovered_refs, already_cached, expanded_new, failed_expansions,
           activity_events_written, api_calls_zkill, api_calls_esi, error_summary
    FROM fetch_runs
    WHERE run_id IN (${runIds.map(() => '?').join(', ')})
    ORDER BY started_at DESC, run_id
  `).all(...runIds);
}

function apiRequestLogsForRunIds(db, runIds) {
  if (!runIds.length) {
    return [];
  }
  return db.prepare(`
    SELECT request_id, run_id, run_type, provider, method, status_code,
           cache_status, retry_count, rate_limited, requested_at
    FROM api_request_logs
    WHERE run_id IN (${runIds.map(() => '?').join(', ')})
    ORDER BY requested_at DESC, request_id
  `).all(...runIds);
}

function provenanceLogBoundary(fetchRuns, apiLogs, auditRunIds) {
  return {
    run_ids: auditRunIds,
    fetch_runs: {
      count: fetchRuns.length,
      statuses: countBy(fetchRuns, 'status'),
      triggers: countBy(fetchRuns, 'trigger'),
      watch_types: countBy(fetchRuns, 'watch_type'),
      total_api_calls_zkill: sumRows(fetchRuns, 'api_calls_zkill'),
      total_api_calls_esi: sumRows(fetchRuns, 'api_calls_esi')
    },
    api_request_logs: {
      count: apiLogs.length,
      providers: countBy(apiLogs, 'provider'),
      statuses: countBy(apiLogs, 'status_code'),
      run_types: countBy(apiLogs, 'run_type')
    },
    interpretation: 'Fetch runs and API request logs are provenance/support history, not Evidence/EVEidence and not deletion execution authority.'
  };
}

function assessmentMemoryBoundary(affectedAssessmentArtifacts) {
  return {
    count: affectedAssessmentArtifacts.length,
    stale_risk_count: affectedAssessmentArtifacts.length,
    deletion_blocker: false,
    references: affectedAssessmentArtifacts,
    interpretation: 'Assessment Memory can become stale if cited Evidence/EVEidence is pruned later; this preview does not mutate, mark stale, delete, or create Assessment Memory.'
  };
}

function supportArtifactDisclosure() {
  return {
    support_artifacts_inspected: false,
    active_record_prune_would_clean_support_artifacts: false,
    snapshot_or_trace_cleanup_executed: false,
    historical_recovery_material_may_retain_records: true,
    classes_disclosed: [
      'runtime_snapshots',
      'operator_debug_trace_packs',
      'support_logs',
      'readiness_preflight_reports'
    ],
    interpretation: 'Snapshots, trace packs, logs, and preflight/readiness reports are separate support/recovery material; active-record pruning would not automatically clean or rewrite them.'
  };
}

function noFootprintPreviewPolicy() {
  return {
    no_retained_deletion_footprint: true,
    retained_footprint_created_by_preview: false,
    raw_evidence_payload_retained_by_preview: false,
    full_activity_events_retained_by_preview: false,
    hidden_copy_retained_by_preview: false,
    interpretation: 'The preview reports affected local rows and context only; it does not create a retained deletion footprint.'
  };
}

function pruningContextWarnings(details) {
  const warnings = [];
  if (details.discoveryRefs.length) {
    warnings.push('discovery_refs_are_possible_leads_not_evidence');
  }
  if (details.affectedAssessmentArtifacts.length) {
    warnings.push('assessment_memory_may_become_stale_but_is_not_a_deletion_blocker');
  }
  if (details.fetchRuns.length || details.apiLogs.length) {
    warnings.push('provenance_logs_may_outlive_future_active_record_prune');
  }
  if (details.dataQualityWarnings.count) {
    warnings.push('warning_rows_are_context_counts_not_relationship_truth');
  }
  warnings.push('support_artifacts_are_separate_historical_recovery_material');
  warnings.push('no_retained_deletion_footprint');
  return warnings;
}

function countBy(rows, field) {
  const counts = new Map();
  rows.forEach((row) => {
    const value = row[field];
    const key = value === null || value === undefined || value === '' ? 'unknown' : String(value);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function sumRows(rows, field) {
  return rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
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

function parseJsonArray(value) {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function textOrNull(value) {
  const text = String(value || '').trim();
  return text || null;
}

module.exports = {
  listRetentionActions,
  buildRetentionPreflight,
  buildEvidencePruneExecutionFixtureProof,
  buildAssessmentCompactionPreview,
  assessmentArtifactInputFromCompactionPreview
};
