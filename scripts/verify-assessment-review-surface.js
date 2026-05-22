const fs = require('node:fs');
const path = require('node:path');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');

async function main() {
  verifyRendererSurface();
  await verifyAssessmentReadShape();
  console.log('assessment artifact review surface verified');
}

function verifyRendererSurface() {
  const rendererPath = path.join(process.cwd(), 'src', 'renderer', 'reports.js');
  const rendererText = fs.readFileSync(rendererPath, 'utf8');

  [
    "service.invoke('assessment.list'",
    "service.invoke('assessment.get'",
    "service.invoke('assessment.create'",
    "['Artifact Type', artifact.artifact_type]",
    "['Evidence Window'",
    "['Source Report', artifact.source_report_type",
    "['Source Runs'",
    "['Citation Status', artifact.citation?.status",
    "['Cited Killmail IDs'",
    "['Citation Basis', citationBasisLabel(artifact)]",
    "['Created', artifact.created_at",
    "['Updated', artifact.updated_at",
    'assessment artifacts are assessment memory, not evidence'
  ].forEach((needle) => {
    assert(rendererText.includes(needle), `renderer assessment review surface should include ${needle}`);
  });

  assert(!rendererText.includes("service.invoke('manual.expansion'") || rendererText.indexOf("service.invoke('manual.expansion'") < rendererText.indexOf('function manualExpansionPreflight'), 'assessment review should not trigger manual expansion');
}

async function verifyAssessmentReadShape() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const seeded = seedEvidence(db);
    const artifact = await invokeServiceCommand('assessment.create', {
      artifactType: 'entity_interest',
      entityType: 'character',
      entityId: 90000001,
      entityName: 'Review Surface Pilot',
      interestScore: 64,
      priorityScore: 40,
      confidence: 75,
      assessmentReason: 'Observed in the local fixture evidence sample.',
      assessmentSummary: 'Deliberate assessment memory for renderer review.',
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
      sourceRunIds: [seeded.runId],
      sampleKillmailIds: [seeded.killmailId],
      appearanceCount: 2,
      attackerAppearanceCount: 2,
      victimAppearanceCount: 0,
      assessedBy: 'fixture'
    }, { db });

    const listed = await invokeServiceCommand('assessment.list', {
      entityType: 'character',
      entityId: 90000001
    }, { db });
    assert(listed.artifacts.length === 1, 'assessment list should return the saved artifact');
    assert(listed.artifacts[0].citation.status === 'verified', 'assessment list should expose citation status');

    const fetched = await invokeServiceCommand('assessment.get', {
      artifactId: artifact.artifact_id
    }, { db });
    assert(fetched.artifact_type === 'entity_interest', 'detail response should expose artifact type');
    assert(fetched.entity_type === 'character', 'detail response should expose typed entity scope');
    assert(fetched.entity_id === 90000001, 'detail response should expose durable entity ID');
    assert(fetched.status === 'active', 'detail response should expose artifact status');
    assert(fetched.scores.interest === 64, 'detail response should expose score fields');
    assert(fetched.assessment_reason, 'detail response should expose assessment reason');
    assert(fetched.assessment_summary, 'detail response should expose assessment summary');
    assert(fetched.evidence_window.start === '2026-05-01T00:00:00Z', 'detail response should expose evidence window start');
    assert(fetched.evidence_window.end === '2026-05-02T00:00:00Z', 'detail response should expose evidence window end');
    assert(fetched.source_report_type === 'actor', 'detail response should expose source report type');
    assert(fetched.source_run_ids.includes(seeded.runId), 'detail response should expose source run IDs');
    assert(fetched.sample_killmail_ids.includes(seeded.killmailId), 'detail response should expose cited killmail IDs');
    assert(fetched.citation.status === 'verified', 'detail response should expose citation status');
    assert(fetched.citation.details.verified_killmail_ids.includes(seeded.killmailId), 'detail response should expose citation basis details');
    assert(fetched.boundary.includes('not evidence'), 'detail response should preserve assessment/evidence boundary');

    const killmailRows = db.prepare('SELECT COUNT(*) AS count FROM killmails').get().count;
    const eventRows = db.prepare('SELECT COUNT(*) AS count FROM activity_events').get().count;
    await invokeServiceCommand('assessment.get', { artifactId: artifact.artifact_id }, { db });
    assert(db.prepare('SELECT COUNT(*) AS count FROM killmails').get().count === killmailRows, 'assessment read should not mutate killmails');
    assert(db.prepare('SELECT COUNT(*) AS count FROM activity_events').get().count === eventRows, 'assessment read should not mutate activity events');
  } finally {
    closeDatabase(db);
  }
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
    watchId: 'assessment-review-fixture'
  });
  const killmailId = 9911;
  const pkg = evidencePackageFromExpandedKillmails({
    killmails: [{
      raw: {
        ...fixtureKillmail,
        killmail_id: killmailId,
        killmail_time: '2026-05-01T20:01:00Z',
        solar_system_id: 30000001
      },
      hash: 'fixture_hash_9911'
    }],
    run: {
      run_id: run.run_id,
      source_type: 'fixture',
      source_id: 'assessment-review-fixture',
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
