const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { createAssessmentArtifact } = require('../src/main/assessment/assessmentArtifactRepository');
const {
  assessmentArtifactInputFromCompactionPreview,
  buildRetentionPreflight,
  listRetentionActions
} = require('../src/main/services/retentionActionService');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  seed(db);

  try {
    const initialCounts = tableCounts(db);
    const actions = listRetentionActions();
    assert(actions.some((entry) => entry.action === 'evidence.prune_scope'), 'retention actions should include evidence prune');
    assert(actions.some((entry) => entry.action === 'diagnostics.prune_api_logs'), 'retention actions should include diagnostics prune');

    const evidenceBlocked = buildRetentionPreflight(db, {
      action: 'evidence.prune_scope',
      scope: {
        systemId: 30000001,
        before: '2026-05-02T00:00:00Z'
      }
    });
    assert(evidenceBlocked.allowed === false, 'evidence prune should require confirmation');
    assert(evidenceBlocked.blockers.some((entry) => entry.code === 'DESTRUCTIVE_CONFIRMATION_REQUIRED'), 'evidence prune should include confirmation blocker');
    assert(evidenceBlocked.warnings.some((entry) => entry.code === 'DELETION_EXECUTION_BLOCKED'), 'evidence prune should state execution is blocked');
    assert(evidenceBlocked.impact.killmails === 1, 'evidence preflight should count killmails');
    assert(evidenceBlocked.impact.activity_events > 0, 'evidence preflight should count activity events');
    assert(evidenceBlocked.impact.ingestion_audits === 1, 'evidence preflight should count ingestion audits');
    assert(evidenceBlocked.impact.data_quality_warnings === 1, 'evidence preflight should count data quality warnings');
    assert(evidenceBlocked.impact.assessment_artifact_references === 1, 'evidence preflight should count affected assessment references');
    assert(evidenceBlocked.impact.affected_assessment_artifacts[0].referenced_killmail_ids.includes(8801), 'evidence preflight should list referenced killmail IDs');
    assert(evidenceBlocked.impact.relationship_context.preview_only === true, 'relationship context should be preview-only');
    assert(evidenceBlocked.impact.relationship_context.read_only === true, 'relationship context should be read-only');
    assert(evidenceBlocked.impact.relationship_context.basis.computed_relationships_are_durable_truth === false, 'computed relationships should not be reported as durable truth');
    assert(evidenceBlocked.impact.relationship_context.basis.discovery_refs_are_evidence === false, 'Discovery refs should not be Evidence');
    assert(evidenceBlocked.impact.relationship_context.evidence_rows.killmails.count === 1, 'relationship context should count Evidence rows');
    assert(evidenceBlocked.impact.relationship_context.evidence_rows.activity_events.count > 0, 'relationship context should count activity rows');
    assert(evidenceBlocked.impact.relationship_context.audit_warning_rows.ingestion_audits.count === 1, 'relationship context should count ingestion audits');
    assert(evidenceBlocked.impact.relationship_context.audit_warning_rows.data_quality_warnings.count === 1, 'relationship context should count warnings');
    assert(evidenceBlocked.impact.relationship_context.discovery_refs.count === 1, 'relationship context should count same-killmail Discovery refs');
    assert(evidenceBlocked.impact.relationship_context.discovery_refs.statuses.some((entry) => entry.value === 'cached'), 'relationship context should separate Discovery ref statuses');
    assert(evidenceBlocked.impact.relationship_context.discovery_refs.interpretation.includes('possible leads/provenance'), 'Discovery refs should be labelled as possible leads/provenance');
    assert(evidenceBlocked.impact.relationship_context.assessment_memory.count === 1, 'relationship context should count Assessment Memory references');
    assert(evidenceBlocked.impact.relationship_context.assessment_memory.deletion_blocker === false, 'Assessment Memory should not be a deletion blocker');
    assert(evidenceBlocked.impact.relationship_context.watch_marked_context.watchlist_attention_rows.count === 1, 'relationship context should include Watch/Marked-adjacent actor rows');
    assert(evidenceBlocked.impact.relationship_context.watch_marked_context.direct_system_watch_rows.count === 1, 'relationship context should include direct system Watch rows');
    assert(evidenceBlocked.impact.relationship_context.provenance_logs.fetch_runs.count === 1, 'relationship context should summarize fetch runs');
    assert(evidenceBlocked.impact.relationship_context.provenance_logs.api_request_logs.count === 1, 'relationship context should summarize API request logs');
    assert(evidenceBlocked.impact.relationship_context.support_artifact_disclosure.active_record_prune_would_clean_support_artifacts === false, 'support artifact disclosure should state active prune would not clean support artifacts');
    assert(evidenceBlocked.impact.relationship_context.no_footprint_policy.retained_footprint_created_by_preview === false, 'preview should not create retained deletion footprint');
    assert(evidenceBlocked.deletion_policy.execution_status === 'blocked_preflight_only', 'evidence preflight should state deletion execution is blocked');
    assert(evidenceBlocked.deletion_policy.no_retained_footprint === true, 'evidence preflight should state no retained footprint policy');
    assert(evidenceBlocked.deletion_policy.footprint_policy.includes('No retained deletion footprint'), 'evidence preflight should reject retained footprint reporting');
    assert(evidenceBlocked.deletion_policy.rejected_footprint_fields.includes('killmail_id + pilot_id'), 'evidence preflight should reject killmail/pilot footprint');
    assert(evidenceBlocked.deletion_policy.rejected_footprint_fields.includes('EVE_value'), 'evidence preflight should reject custom value footprint fields');
    assert(evidenceBlocked.deletion_policy.snapshot_recovery_disclosure.includes('Snapshots/backups'), 'evidence preflight should disclose snapshot recovery boundary');
    assert(evidenceBlocked.deletion_policy.assessment_memory_policy.includes('not Evidence'), 'evidence preflight should state assessment memory is not Evidence');
    assertSame(tableCounts(db), initialCounts, 'blocked evidence preflight must not mutate local rows');

    const evidenceAllowed = buildRetentionPreflight(db, {
      action: 'evidence.prune_scope',
      confirmation: 'evidence.prune_scope',
      scope: {
        systemId: 30000001,
        before: '2026-05-02T00:00:00Z'
      }
    });
    assert(evidenceAllowed.allowed === true, 'matching confirmation token should allow preflight');
    assert(evidenceAllowed.preservation.assessment_recommended === false, 'evidence prune should not recommend hidden preservation');
    assert(evidenceAllowed.deletion_policy.no_retained_footprint === true, 'allowed preflight should still report no retained footprint');
    assertSame(tableCounts(db), initialCounts, 'allowed evidence preflight must remain read-only');

    const selectedEvidence = buildRetentionPreflight(db, {
      action: 'evidence.prune_scope',
      confirmation: 'evidence.prune_scope',
      scope: {
        killmailId: 8801
      }
    });
    assert(selectedEvidence.impact.killmails === 1, 'selected killmail preflight should count exact killmail row');
    assert(selectedEvidence.impact.activity_events > 0, 'selected killmail preflight should count exact activity rows');
    assert(selectedEvidence.impact.assessment_artifact_references === 1, 'selected killmail preflight should count affected Assessment Memory references');
    assert(selectedEvidence.impact.relationship_context.basis.scope_kind === 'selected_killmails', 'selected killmail preview should identify selected-killmail scope');
    assert(selectedEvidence.impact.relationship_context.discovery_refs.selected_killmail_ids.includes(8801), 'selected killmail preview should disclose Discovery ref killmail basis');
    assert(selectedEvidence.impact.relationship_context.support_artifact_disclosure.historical_recovery_material_may_retain_records === true, 'selected killmail preview should disclose historical support material');
    assertSame(tableCounts(db), initialCounts, 'selected killmail preflight must remain read-only');

    const actor = db.prepare(`
      SELECT entity_type, entity_id, entity_name
      FROM activity_events
      WHERE entity_type = 'character'
      LIMIT 1
    `).get();
    const actorEvidence = buildRetentionPreflight(db, {
      action: 'evidence.prune_scope',
      confirmation: 'evidence.prune_scope',
      scope: {
        entityType: actor.entity_type,
        entityId: actor.entity_id,
        after: '2026-05-01T00:00:00Z',
        before: '2026-05-02T00:00:00Z'
      }
    });
    assert(actorEvidence.impact.killmails === 1, 'actor/time preflight should count distinct affected killmails');
    assert(actorEvidence.impact.relationship_context.basis.scope_kind === 'actor_entity_window', 'actor/time preflight should identify actor scope');
    assert(actorEvidence.impact.relationship_context.discovery_refs.interpretation.includes('not Evidence/EVEidence'), 'actor/time preflight should not use Discovery refs as observations');
    assert(actorEvidence.impact.relationship_context.context_warnings.includes('support_artifacts_are_separate_historical_recovery_material'), 'actor/time preflight should disclose support artifact separation');
    assertSame(tableCounts(db), initialCounts, 'actor/time evidence preflight must remain read-only');

    const beforeCounts = tableCounts(db);
    const compactionPreview = buildRetentionPreflight(db, {
      action: 'assessment.compact_from_evidence',
      scope: {
        entityType: actor.entity_type,
        entityId: actor.entity_id,
        entityName: actor.entity_name,
        systemId: 30000001,
        before: '2026-05-02T00:00:00Z'
      },
      assessment: {
        assessmentReason: 'Preserve the observed actor sample before any future pruning.'
      }
    });
    const afterCounts = tableCounts(db);
    assert(compactionPreview.assessment_preview.ready === true, 'compaction preview should be ready for scoped actor evidence');
    assert(compactionPreview.assessment_preview.artifact_type === 'evidence_compaction', 'compaction preview should describe evidence_compaction artifact');
    assert(compactionPreview.assessment_preview.entity_id === actor.entity_id, 'compaction preview should preserve actor ID');
    assert(compactionPreview.assessment_preview.creation_ready === true, 'assessment reason should mark preview ready for deliberate creation');
    assert(compactionPreview.assessment_preview.counts.appearances > 0, 'compaction preview should include appearance count');
    assert(compactionPreview.assessment_preview.sample_killmail_ids.includes(8801), 'compaction preview should include sample killmail IDs');
    assert(compactionPreview.assessment_preview.systems_observed.length > 0, 'compaction preview should include observed systems');
    assert(compactionPreview.assessment_preview.boundary.includes('does not delete'), 'compaction preview should declare non-destructive boundary');
    assert(afterCounts.killmails === beforeCounts.killmails, 'compaction preflight must not delete killmails');
    assert(afterCounts.activity_events === beforeCounts.activity_events, 'compaction preflight must not delete activity events');
    assert(afterCounts.assessment_artifacts === beforeCounts.assessment_artifacts, 'compaction preflight must not create assessment artifacts');

    const artifactInput = assessmentArtifactInputFromCompactionPreview(compactionPreview.assessment_preview, {
      assessmentReason: 'Deliberately preserve the scoped actor sample as assessment memory.',
      confidence: 70,
      assessedBy: 'fixture'
    });
    const artifact = createAssessmentArtifact(db, artifactInput);
    const afterArtifactCounts = tableCounts(db);
    assert(artifact.artifact_type === 'evidence_compaction', 'explicit conversion should create evidence_compaction artifact input');
    assert(artifact.citation.status === 'verified', 'compaction artifact citation should validate against local evidence');
    assert(artifact.sample_killmail_ids.includes(8801), 'compaction artifact should cite preview sample killmail IDs');
    assert(afterArtifactCounts.killmails === beforeCounts.killmails, 'compaction artifact creation must not delete killmails');
    assert(afterArtifactCounts.activity_events === beforeCounts.activity_events, 'compaction artifact creation must not delete activity events');
    assert(afterArtifactCounts.assessment_artifacts === beforeCounts.assessment_artifacts + 1, 'explicit conversion should write one assessment artifact');

    const diagnostics = buildRetentionPreflight(db, {
      action: 'diagnostics.prune_api_logs',
      confirmation: 'diagnostics.prune_api_logs',
      scope: {
        before: '2026-05-02T00:00:00Z'
      }
    });
    assert(diagnostics.allowed === true, 'diagnostic prune preflight should allow with confirmation');
    assert(diagnostics.impact.api_request_logs === 1, 'diagnostics preflight should count API logs');
    assert(diagnostics.preservation.assessment_recommended === false, 'diagnostics prune should not recommend assessment preservation');
    assertSame(tableCounts(db), afterArtifactCounts, 'diagnostic preflight must remain read-only');

    const commands = listServiceCommands();
    assert(commands.some((entry) => entry.command === 'retention.preflight' && entry.classification === 'read-only'), 'retention.preflight should be read-only');
    const servicePreflight = await invokeServiceCommand('retention.preflight', {
      action: 'queue.expire_refs',
      confirmation: 'queue.expire_refs',
      scope: {
        status: 'pending'
      }
    }, { db });
    assert(servicePreflight.impact.discovered_killmail_refs === 1, 'queue preflight should count refs');
    assertSame(tableCounts(db), afterArtifactCounts, 'service retention preflight must remain read-only');
  } finally {
    closeDatabase(db);
  }

  console.log('retention preflight verified');
}

function tableCounts(db) {
  return {
    killmails: db.prepare('SELECT COUNT(*) AS count FROM killmails').get().count,
    activity_events: db.prepare('SELECT COUNT(*) AS count FROM activity_events').get().count,
    ingestion_audits: db.prepare('SELECT COUNT(*) AS count FROM ingestion_audits').get().count,
    data_quality_warnings: db.prepare('SELECT COUNT(*) AS count FROM data_quality_warnings').get().count,
    discovered_killmail_refs: db.prepare('SELECT COUNT(*) AS count FROM discovered_killmail_refs').get().count,
    fetch_runs: db.prepare('SELECT COUNT(*) AS count FROM fetch_runs').get().count,
    api_request_logs: db.prepare('SELECT COUNT(*) AS count FROM api_request_logs').get().count,
    assessment_artifacts: db.prepare('SELECT COUNT(*) AS count FROM assessment_artifacts').get().count,
    system_watches: db.prepare('SELECT COUNT(*) AS count FROM system_watches').get().count,
    watchlist_entities: db.prepare('SELECT COUNT(*) AS count FROM watchlist_entities').get().count
  };
}

function seed(db) {
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);

  const repository = new EvidenceRepository(db);
  const run = repository.createFetchRun({
    trigger: 'fixture_test',
    watchType: 'system_radius',
    watchId: 'retention-fixture'
  });
  const pkg = evidencePackageFromExpandedKillmails({
    killmails: [{
      raw: {
        ...fixtureKillmail,
        killmail_id: 8801,
        killmail_time: '2026-05-01T20:01:00Z',
        solar_system_id: 30000001
      },
      hash: 'fixture_hash_8801'
    }],
    run: {
      run_id: run.run_id,
      source_type: 'fixture',
      source_id: 'retention-fixture',
      started_at: run.started_at
    },
    discoveredBy: {
      type: 'fixture',
      id: 8801
    }
  });
  const result = repository.persistEvidencePackage(pkg);
  repository.insertApiRequestLog({
    run_id: run.run_id,
    provider: 'zkill',
    endpoint: 'https://zkillboard.com/api/systemID/30000001/pastSeconds/86400/',
    method: 'GET',
    status_code: 200,
    duration_ms: 1,
    cache_status: 'fixture',
    requested_at: '2026-05-01T20:00:00Z'
  });
  repository.insertWarning(run.run_id, {
    killmail_id: 8801,
    warning_type: 'fixture_warning',
    message: 'fixture warning tied to selected pruning preview evidence',
    created_at: '2026-05-01T20:03:00Z'
  });
  repository.upsertDiscoveredKillmailRefs([
    {
      killmail_id: 8801,
      hash: 'fixture_hash_8801',
      discovered_at: '2026-05-01T19:59:00Z',
      preview: {
        killmail_time: '2026-05-01T20:01:00Z'
      }
    }
  ], {
    runId: run.run_id,
    discoveredByType: 'manual_system',
    discoveredById: '30000001',
    sourceSystemId: 30000001
  });
  repository.upsertDiscoveredKillmailRefs([
    {
      killmail_id: 8802,
      hash: 'fixture_hash_8802',
      discovered_at: '2026-05-01T20:02:00Z',
      preview: {
        killmail_time: '2026-05-01T20:02:00Z'
      }
    }
  ], {
    runId: run.run_id,
    discoveredByType: 'manual_system',
    discoveredById: '30000001',
    sourceSystemId: 30000001
  });
  repository.finalizeFetchRun(run.run_id, {
    discovered_refs: 1,
    expanded_new: result.killmailsWritten,
    activity_events_written: result.eventsWritten,
    api_calls_zkill: 1,
    api_calls_esi: 0
  }, 'success');

  createAssessmentArtifact(db, {
    artifactType: 'analyst_note',
    assessmentReason: 'Fixture Assessment Memory cites selected Evidence and may become stale after deletion.',
    sampleKillmailIds: [8801],
    assessedBy: 'fixture'
  });

  const actor = db.prepare(`
    SELECT entity_type, entity_id, entity_name
    FROM activity_events
    WHERE entity_type = 'character'
    ORDER BY entity_id
    LIMIT 1
  `).get();
  db.prepare(`
    INSERT INTO watchlist_entities (
      entity_type, entity_id, entity_name, is_active, next_poll_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(actor.entity_type, actor.entity_id, actor.entity_name || 'Fixture Pilot', 1, '2026-05-02T00:00:00Z', 'fixture attention row');
  db.prepare(`
    INSERT INTO system_watches (
      center_system_id, center_system_name, radius_jumps, included_system_ids,
      excluded_system_ids, is_active, next_poll_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 1, '[30000001]', '[]', 1, '2026-05-02T00:00:00Z', 'fixture direct system watch');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
