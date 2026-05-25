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
  await verifyRetentionBoundaryIsPreflightOnly();
  verifyCompactionAndFootprintPolicy();
  console.log('retention deletion boundary verified');
}

async function verifyRetentionBoundaryIsPreflightOnly() {
  const db = openDatabase(':memory:');
  migrate(db);
  seed(db);

  try {
    const before = tableCounts(db);
    const actions = listRetentionActions();
    const pruneDefinition = actions.find((entry) => entry.action === 'evidence.prune_scope');
    assert(pruneDefinition, 'retention actions should list evidence.prune_scope');
    assert(pruneDefinition.classification === 'destructive', 'evidence prune should be classified destructive');
    assert(pruneDefinition.confirmation === 'required', 'evidence prune should require confirmation');
    assert(pruneDefinition.preservation === 'assessment_recommended', 'evidence prune should recommend assessment preservation without requiring it');

    const blocked = buildRetentionPreflight(db, {
      action: 'evidence.prune_scope',
      scope: scopedEvidence()
    });
    assert(blocked.allowed === false, 'evidence prune preflight should block without confirmation');
    assert(blocked.blockers.some((entry) => entry.code === 'DESTRUCTIVE_CONFIRMATION_REQUIRED'), 'blocked preflight should name confirmation requirement');
    assert(blocked.impact.killmails === 1, 'preflight impact should count affected killmails');
    assert(blocked.impact.activity_events > 0, 'preflight impact should count affected activity events');
    assert(blocked.impact.ingestion_audits === 1, 'preflight impact should count affected ingestion audits');
    assert(blocked.impact.data_quality_warnings === 1, 'preflight impact should count affected data quality warnings');
    assertSame(tableCounts(db), before, 'blocked evidence preflight must not mutate evidence or memory');

    const allowed = buildRetentionPreflight(db, {
      action: 'evidence.prune_scope',
      confirmation: 'evidence.prune_scope',
      scope: scopedEvidence()
    });
    assert(allowed.allowed === true, 'matching confirmation should allow preflight calculation only');
    assert(allowed.confirmation.token === 'evidence.prune_scope', 'preflight should expose explicit confirmation token');
    assert(allowed.preservation.assessment_recommended === true, 'preflight should recommend assessment preservation');
    assertSame(tableCounts(db), before, 'allowed evidence preflight must still not delete');

    const commands = listServiceCommands();
    assert(commands.some((entry) => entry.command === 'retention.preflight' && entry.classification === 'read-only'), 'retention.preflight command should be read-only');
    assert(commands.some((entry) => entry.command === 'retention.actions' && entry.classification === 'read-only'), 'retention.actions command should be read-only');
    assert(!commands.some((entry) => entry.command === 'evidence.prune_scope'), 'there should be no executable evidence prune service command');
    assert(!commands.some((entry) => entry.command === 'assessment.compact_from_evidence'), 'assessment compaction should remain a retention preflight action, not an execution command');

    await assertRejects(
      () => invokeServiceCommand('evidence.prune_scope', { confirmation: 'evidence.prune_scope', scope: scopedEvidence() }, { db }),
      /Unknown service command/,
      'direct evidence prune execution command should not exist'
    );

    const servicePreflight = await invokeServiceCommand('retention.preflight', {
      action: 'evidence.prune_scope',
      confirmation: 'evidence.prune_scope',
      scope: scopedEvidence()
    }, { db });
    assert(servicePreflight.allowed === true, 'service preflight should return allowed preflight with confirmation');
    assertSame(tableCounts(db), before, 'service retention preflight must not mutate evidence or memory');
  } finally {
    closeDatabase(db);
  }
}

function verifyCompactionAndFootprintPolicy() {
  const db = openDatabase(':memory:');
  migrate(db);
  seed(db);

  try {
    const before = tableCounts(db);
    const preview = buildRetentionPreflight(db, {
      action: 'assessment.compact_from_evidence',
      confirmation: 'assessment.compact_from_evidence',
      scope: scopedActorEvidence(),
      assessment: {
        assessmentReason: 'Fixture operator chose to preserve a unique appearance trace before possible deletion.'
      }
    });

    assert(preview.allowed === true, 'compaction preview should allow with confirmation');
    assert(preview.assessment_preview.ready === true, 'compaction preview should be ready for seeded actor evidence');
    assert(preview.assessment_preview.boundary.includes('does not delete or replace'), 'compaction preview should state it does not delete or replace evidence');
    assert(preview.assessment_preview.counts.appearances > 0, 'compaction preview should include appearance trace count');
    assert(preview.assessment_preview.sample_killmail_ids.includes(7701), 'compaction preview may cite sample killmail IDs for validation');
    assertSame(tableCounts(db), before, 'compaction preview must be read-only');

    const artifactInput = assessmentArtifactInputFromCompactionPreview(preview.assessment_preview, {
      assessmentReason: 'Deliberate minimal footprint as Assessment Memory, not retained raw Evidence.',
      confidence: 65,
      assessedBy: 'fixture'
    });
    const artifact = createAssessmentArtifact(db, artifactInput);
    const afterArtifact = tableCounts(db);
    assert(afterArtifact.assessment_artifacts === before.assessment_artifacts + 1, 'explicit assessment creation should write one memory artifact');
    assert(afterArtifact.killmails === before.killmails, 'assessment creation must not delete killmails');
    assert(afterArtifact.activity_events === before.activity_events, 'assessment creation must not delete activity events');
    assert(artifact.boundary.includes('not evidence'), 'assessment artifact should declare not-evidence boundary');
    assert(!JSON.stringify(artifact).includes('raw_esi_payload'), 'assessment footprint must not store raw ESI payload field');
    assert(!JSON.stringify(artifact).includes('attackers'), 'assessment footprint must not store full raw killmail attacker arrays');
    assert(!JSON.stringify(artifact).includes('raw_payload_checksum'), 'assessment footprint must not store raw evidence checksums as hidden evidence');
    assert(!JSON.stringify(artifact).includes('event_key'), 'assessment footprint must not store full activity event rows');
    assert(artifact.counts.appearances > 0, 'assessment footprint may preserve unique appearance count');
    assert(artifact.observed.systems.length > 0, 'assessment footprint may preserve observed system summary');

    deleteEvidenceForKillmail(db, 7701);
    const afterDeletion = tableCounts(db);
    assert(afterDeletion.killmails === 0, 'fixture deletion should remove selected killmail evidence');
    assert(afterDeletion.activity_events === 0, 'fixture deletion should remove full activity events');
    assert(afterDeletion.ingestion_audits === 0, 'fixture deletion should remove ingestion audit for selected evidence');
    assert(afterDeletion.data_quality_warnings === 0, 'fixture deletion should remove warning tied to selected evidence run');
    assert(afterDeletion.assessment_artifacts === 1, 'Assessment Memory can survive fixture evidence deletion');

    const artifactRow = db.prepare('SELECT * FROM assessment_artifacts LIMIT 1').get();
    assert(!JSON.stringify(artifactRow).includes('raw_esi_payload'), 'surviving footprint row must not hide raw ESI payload');
    assert(!JSON.stringify(artifactRow).includes('attackers'), 'surviving footprint row must not hide full attacker events');
    assert(!JSON.stringify(artifactRow).includes('raw_payload_checksum'), 'surviving footprint row must not hide raw evidence checksums');
    assert(!JSON.stringify(artifactRow).includes('event_key'), 'surviving footprint row must not hide full activity event rows');
  } finally {
    closeDatabase(db);
  }
}

function scopedEvidence() {
  return {
    systemId: 30000001,
    before: '2026-05-02T00:00:00Z'
  };
}

function scopedActorEvidence() {
  return {
    entityType: 'character',
    entityId: 90000001,
    entityName: 'Fixture Pilot',
    systemId: 30000001,
    before: '2026-05-02T00:00:00Z'
  };
}

function seed(db) {
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
  db.prepare(`
    INSERT INTO type_metadata (type_id, type_name, category_id, category_name, group_id, group_name, last_fetched)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(603, 'Merlin', 6, 'Ship', 25, 'Frigate', '2026-05-01T00:00:00Z');

  const repository = new EvidenceRepository(db);
  const run = repository.createFetchRun({
    runId: 'run_retention_boundary',
    trigger: 'fixture_test',
    watchType: 'manual_expand',
    watchId: 'retention-boundary'
  });
  const pkg = evidencePackageFromExpandedKillmails({
    killmails: [{
      raw: expandedKillmail(7701, 'hash_7701'),
      hash: 'hash_7701'
    }],
    run: {
      run_id: run.run_id,
      source_type: 'fixture',
      source_id: 'retention-boundary',
      started_at: run.started_at
    },
    discoveredBy: {
      type: 'fixture',
      id: 7701
    }
  });
  const result = repository.persistEvidencePackage(pkg);
  repository.insertWarning(run.run_id, {
    killmail_id: 7701,
    warning_type: 'fixture_warning',
    message: 'fixture warning tied to selected evidence',
    created_at: '2026-05-01T20:02:00Z'
  });
  repository.finalizeFetchRun(run.run_id, {
    expanded_new: result.killmailsWritten,
    activity_events_written: result.eventsWritten
  }, 'success');
}

function expandedKillmail(killmailId, hash) {
  const clone = JSON.parse(JSON.stringify(fixtureKillmail));
  clone.killmail_id = killmailId;
  clone.killmail_time = '2026-05-01T20:01:00Z';
  clone.solar_system_id = 30000001;
  clone.victim.character_id = 90000001;
  clone.victim.corporation_id = 98000001;
  clone.victim.alliance_id = 99000001;
  clone.victim.ship_type_id = 603;
  clone.attackers = (clone.attackers || []).slice(0, 2).map((attacker, index) => ({
    ...attacker,
    character_id: 90000002 + index,
    corporation_id: 98000002,
    alliance_id: 99000002,
    ship_type_id: 587,
    final_blow: index === 0
  }));
  clone.__fixture_hash = hash;
  return clone;
}

function deleteEvidenceForKillmail(db, killmailId) {
  const runIds = db.prepare(`
    SELECT DISTINCT run_id
    FROM ingestion_audits
    WHERE killmail_id = ?
  `).all(killmailId).map((row) => row.run_id);

  db.exec('BEGIN IMMEDIATE;');
  try {
    db.prepare('DELETE FROM activity_events WHERE killmail_id = ?').run(killmailId);
    db.prepare('DELETE FROM ingestion_audits WHERE killmail_id = ?').run(killmailId);
    if (runIds.length) {
      db.prepare(`DELETE FROM data_quality_warnings WHERE run_id IN (${runIds.map(() => '?').join(', ')})`).run(...runIds);
    }
    db.prepare('DELETE FROM killmails WHERE killmail_id = ?').run(killmailId);
    db.exec('COMMIT;');
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}

function tableCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    ingestion_audits: count(db, 'ingestion_audits'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function assertRejects(fn, expectedPattern, message) {
  try {
    await fn();
  } catch (error) {
    if (!expectedPattern || expectedPattern.test(String(error.message || error))) {
      return;
    }
    throw new Error(`${message}: expected ${expectedPattern}, got ${error.message}`);
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
