const fs = require('node:fs');
const path = require('node:path');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { createAssessmentArtifact } = require('../src/main/assessment/assessmentArtifactRepository');
const {
  buildRuntimeDbSnapshotPreflight,
  createRuntimeDbSnapshot
} = require('../src/main/services/runtimeSnapshotService');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');

async function main() {
  const root = path.resolve(__dirname, '..');
  const workDir = path.join(root, '.tmp', 'runtime-snapshot-verify');
  fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });

  const dbPath = path.join(workDir, 'runtime-source.sqlite');
  const snapshotPath = path.join(workDir, 'snapshots', 'runtime-source.snapshot.sqlite');
  const db = openDatabase(dbPath);
  migrate(db);
  seed(db);

  try {
    const beforeCounts = tableCounts(db);
    const preflight = buildRuntimeDbSnapshotPreflight(db, {
      destinationPath: snapshotPath
    }, {
      databasePath: dbPath
    });
    assert(preflight.read_only === true, 'snapshot preflight should declare read-only behavior');
    assert(preflight.database_path === dbPath, 'snapshot preflight should report source DB path');
    assert(preflight.destination_path === snapshotPath, 'snapshot preflight should report destination before write');
    assert(preflight.database.exists === true, 'snapshot preflight should report source DB existence');
    assert(preflight.table_counts.killmails === beforeCounts.killmails, 'snapshot preflight should report killmail count');
    assert(preflight.latest_fetch_run.run_id, 'snapshot preflight should report latest fetch run');
    assert(preflight.latest_evidence_timestamp === '2026-05-01T20:01:00Z', 'snapshot preflight should report latest evidence timestamp');
    assert(preflight.assessment_artifacts.some((row) => row.status === 'active' && row.count === 1), 'snapshot preflight should report assessment artifact counts');
    assert(!fs.existsSync(snapshotPath), 'snapshot preflight must not write destination file');

    const servicePreflight = await invokeServiceCommand('runtime.db_snapshot.preflight', {
      destinationPath: snapshotPath
    }, {
      db,
      databasePath: dbPath
    });
    assert(servicePreflight.destination_path === snapshotPath, 'snapshot preflight service should use context database path');

    const snapshot = await invokeServiceCommand('runtime.db_snapshot.create', {
      destinationPath: snapshotPath
    }, {
      db,
      databasePath: dbPath
    });
    assert(snapshot.status === 'created', 'snapshot create service should create a snapshot');
    assert(snapshot.snapshot_path === snapshotPath, 'snapshot create should report snapshot path');
    assert(fs.existsSync(snapshotPath), 'snapshot create should write destination file');
    assert(snapshot.snapshot.size_bytes > 0, 'snapshot file should have bytes');
    assert(snapshot.table_counts.killmails === beforeCounts.killmails, 'snapshot create should report source counts');

    const snapshotDb = openDatabase(snapshotPath);
    try {
      migrate(snapshotDb);
      const restoredCounts = tableCounts(snapshotDb);
      assertSame(restoredCounts, beforeCounts, 'opened snapshot should preserve core table counts');
      assertRawPayloadSame(db, snapshotDb, 6601);
    } finally {
      closeDatabase(snapshotDb);
    }

    await assertRejects(() => invokeServiceCommand('runtime.db_snapshot.create', {
      destinationPath: snapshotPath
    }, {
      db,
      databasePath: dbPath
    }), 'snapshot create should refuse existing destination without overwrite');

    const commands = listServiceCommands();
    assert(commands.some((entry) => entry.command === 'runtime.db_snapshot.preflight' && entry.classification === 'read-only'), 'snapshot preflight service should be read-only');
    assert(commands.some((entry) => entry.command === 'runtime.db_snapshot.create' && entry.classification === 'exclusive'), 'snapshot create service should be exclusive');
  } finally {
    closeDatabase(db);
  }

  console.log('runtime DB snapshot verified');
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
    watchType: 'manual_scan',
    watchId: 'snapshot-fixture'
  });
  const pkg = evidencePackageFromExpandedKillmails({
    killmails: [{
      raw: {
        ...fixtureKillmail,
        killmail_id: 6601,
        killmail_time: '2026-05-01T20:01:00Z',
        solar_system_id: 30000001
      },
      hash: 'fixture_hash_6601'
    }],
    run: {
      run_id: run.run_id,
      source_type: 'fixture',
      source_id: 'snapshot-fixture',
      started_at: run.started_at
    },
    discoveredBy: {
      type: 'fixture',
      id: 6601
    }
  });
  const result = repository.persistEvidencePackage(pkg);
  repository.upsertDiscoveredKillmailRefs([{
    killmail_id: 6602,
    hash: 'fixture_hash_6602',
    discovered_at: '2026-05-01T20:02:00Z'
  }], {
    runId: run.run_id,
    discoveredByType: 'manual_system',
    discoveredById: '30000001',
    sourceSystemId: 30000001
  });
  repository.finalizeFetchRun(run.run_id, {
    discovered_refs: 1,
    expanded_new: result.killmailsWritten,
    activity_events_written: result.eventsWritten,
    api_calls_zkill: 0,
    api_calls_esi: 0
  }, 'success');
  createAssessmentArtifact(db, {
    artifactType: 'analyst_note',
    assessmentSummary: 'Snapshot fixture assessment memory.',
    assessedBy: 'fixture'
  });
}

function tableCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertRawPayloadSame(sourceDb, snapshotDb, killmailId) {
  const source = sourceDb.prepare('SELECT raw_esi_payload, raw_payload_checksum FROM killmails WHERE killmail_id = ?').get(killmailId);
  const snapshot = snapshotDb.prepare('SELECT raw_esi_payload, raw_payload_checksum FROM killmails WHERE killmail_id = ?').get(killmailId);
  assert(snapshot, 'snapshot should contain seeded killmail');
  assert(snapshot.raw_esi_payload === source.raw_esi_payload, 'snapshot should preserve raw ESI payload byte-for-byte');
  assert(snapshot.raw_payload_checksum === source.raw_payload_checksum, 'snapshot should preserve raw payload checksum');
}

async function assertRejects(fn, message) {
  try {
    await fn();
  } catch {
    return;
  }
  throw new Error(message);
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
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
