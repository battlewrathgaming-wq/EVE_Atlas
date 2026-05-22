const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const {
  createAssessmentArtifact,
  getAssessmentArtifact,
  listAssessmentArtifacts
} = require('../src/main/assessment/assessmentArtifactRepository');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  const seedResult = seedEvidence(db);

  try {
    const artifact = createAssessmentArtifact(db, {
      artifactType: 'entity_interest',
      entityType: 'character',
      entityId: 90000001,
      entityName: 'Assessment Test Pilot',
      interestScore: 72,
      priorityScore: 55,
      confidence: 80,
      assessmentReason: 'Repeated attacker appearances in the scoped evidence sample.',
      evidenceWindowStart: '2026-05-01T00:00:00Z',
      evidenceWindowEnd: '2026-05-02T00:00:00Z',
      evidenceScopeType: 'actor',
      evidenceScope: {
        entity_type: 'character',
        entity_id: 90000001,
        lookback_seconds: 86400
      },
      sourceReportType: 'actor',
      sourceReportParameters: {
        entityType: 'character',
        entityId: 90000001
      },
      sourceRunIds: [seedResult.runId],
      sampleKillmailIds: [seedResult.killmailId],
      appearanceCount: 3,
      attackerAppearanceCount: 3,
      victimAppearanceCount: 0,
      systemsObserved: [{ system_id: 30000001, system_name: 'Atlas Prime' }],
      regionsObserved: [{ region_id: 10000001, region_name: 'Test Region' }],
      shipsObserved: [{ type_id: 587, type_name: 'Rifter' }],
      assessedBy: 'fixture'
    });

    assert(artifact.boundary.includes('not evidence'), 'artifact should declare assessment/evidence boundary');
    assert(artifact.scores.interest === 72, 'interest score should persist');
    assert(artifact.sample_killmail_ids.includes(seedResult.killmailId), 'sample killmail snapshot should persist');

    const fetched = getAssessmentArtifact(db, artifact.artifact_id);
    assert(fetched.entity_id === 90000001, 'artifact should be readable by ID');
    assert(fetched.evidence_scope.entity_id === 90000001, 'scope snapshot should deserialize');

    const listed = listAssessmentArtifacts(db, {
      entityType: 'character',
      entityId: 90000001
    });
    assert(listed.length === 1, 'entity-scoped artifact listing should work');

    await assertRejects(() => createAssessmentArtifact(db, {
      artifactType: 'entity_interest',
      entityType: 'character',
      entityId: 90000002,
      interestScore: 20
    }), 'assessment artifact without reason/summary should be rejected');

    await assertRejects(() => createAssessmentArtifact(db, {
      artifactType: 'entity_interest',
      entityType: 'system',
      entityId: 30000001,
      assessmentReason: 'Invalid typed actor should fail.'
    }), 'invalid entity type should be rejected');

    const serviceArtifact = await invokeServiceCommand('assessment.create', {
      artifactType: 'analyst_note',
      assessmentSummary: 'This is a deliberate analyst note, not evidence.',
      sourceReportType: 'queue',
      sourceReportParameters: { limit: 5 }
    }, { db });
    assert(serviceArtifact.artifact_type === 'analyst_note', 'service should create analyst note artifacts');

    const serviceList = await invokeServiceCommand('assessment.list', {
      artifactType: 'analyst_note'
    }, { db });
    assert(serviceList.artifacts.length === 1, 'service should list assessment artifacts');

    const commands = listServiceCommands();
    assert(commands.some((entry) => entry.command === 'assessment.create' && entry.classification === 'metadata-only'), 'assessment.create should be metadata-only');
    assert(commands.some((entry) => entry.command === 'assessment.list' && entry.classification === 'read-only'), 'assessment.list should be read-only');

    db.prepare('DELETE FROM activity_events WHERE killmail_id = ?').run(seedResult.killmailId);
    db.prepare('DELETE FROM ingestion_audits WHERE killmail_id = ?').run(seedResult.killmailId);
    db.prepare('DELETE FROM killmails WHERE killmail_id = ?').run(seedResult.killmailId);
    const afterEvidenceRemoval = getAssessmentArtifact(db, artifact.artifact_id);
    assert(afterEvidenceRemoval.sample_killmail_ids.includes(seedResult.killmailId), 'artifact snapshot should survive evidence removal');
    assert(afterEvidenceRemoval.counts.appearances === 3, 'artifact appearance snapshot should survive evidence removal');
  } finally {
    closeDatabase(db);
  }

  console.log('assessment artifact persistence verified');
}

function seedEvidence(db) {
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);

  const repository = new EvidenceRepository(db);
  const run = repository.createFetchRun({
    trigger: 'fixture_test',
    watchType: 'actor',
    watchId: 'assessment-fixture'
  });
  const killmailId = 9901;
  const pkg = evidencePackageFromExpandedKillmails({
    killmails: [{
      raw: {
        ...fixtureKillmail,
        killmail_id: killmailId,
        killmail_time: '2026-05-01T20:01:00Z',
        solar_system_id: 30000001
      },
      hash: 'fixture_hash_9901'
    }],
    run: {
      run_id: run.run_id,
      source_type: 'fixture',
      source_id: 'assessment-fixture',
      started_at: run.started_at
    },
    discoveredBy: {
      type: 'fixture',
      id: killmailId
    }
  });
  const result = repository.persistEvidencePackage(pkg);
  repository.finalizeFetchRun(run.run_id, {
    expanded_new: result.killmailsWritten,
    activity_events_written: result.eventsWritten
  }, 'success');
  return {
    runId: run.run_id,
    killmailId
  };
}

async function assertRejects(fn, message) {
  try {
    await fn();
  } catch {
    return;
  }
  throw new Error(message);
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
