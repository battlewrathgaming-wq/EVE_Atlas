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
    assert(evidenceBlocked.warnings.some((entry) => entry.code === 'ASSESSMENT_PRESERVATION_RECOMMENDED'), 'evidence prune should recommend assessment preservation');
    assert(evidenceBlocked.impact.killmails === 1, 'evidence preflight should count killmails');
    assert(evidenceBlocked.impact.activity_events > 0, 'evidence preflight should count activity events');

    const evidenceAllowed = buildRetentionPreflight(db, {
      action: 'evidence.prune_scope',
      confirmation: 'evidence.prune_scope',
      scope: {
        systemId: 30000001,
        before: '2026-05-02T00:00:00Z'
      }
    });
    assert(evidenceAllowed.allowed === true, 'matching confirmation token should allow preflight');
    assert(evidenceAllowed.preservation.assessment_recommended === true, 'evidence prune should carry preservation policy');

    const actor = db.prepare(`
      SELECT entity_type, entity_id, entity_name
      FROM activity_events
      WHERE entity_type = 'character'
      LIMIT 1
    `).get();
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
  } finally {
    closeDatabase(db);
  }

  console.log('retention preflight verified');
}

function tableCounts(db) {
  return {
    killmails: db.prepare('SELECT COUNT(*) AS count FROM killmails').get().count,
    activity_events: db.prepare('SELECT COUNT(*) AS count FROM activity_events').get().count,
    assessment_artifacts: db.prepare('SELECT COUNT(*) AS count FROM assessment_artifacts').get().count
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
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
