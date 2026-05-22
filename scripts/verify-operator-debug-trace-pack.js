const fs = require('node:fs');
const path = require('node:path');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { TaskRunner, TASK_CLASSIFICATIONS } = require('../src/main/services/taskRunner');
const {
  buildOperatorDebugTracePack,
  writeOperatorDebugTracePack
} = require('../src/main/support/operatorDebugTracePack');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  const taskRunner = new TaskRunner({ historyLimit: 10 });
  await seedTask(taskRunner);
  seedDatabase(db);
  const outputDir = path.join(auraTempRoot(), 'operator-debug-trace-pack-fixture');
  fs.rmSync(outputDir, { recursive: true, force: true });

  try {
    const before = sideEffectCounts(db);
    const pack = buildOperatorDebugTracePack(db, {
      taskRunner,
      databasePath: path.join(outputDir, 'fixture.sqlite'),
      smokeRoot: seedSmokeArtifact(outputDir)
    });
    const afterBuild = sideEffectCounts(db);
    assertSame(afterBuild, before, 'building trace pack must not mutate evidence or provenance tables');

    assert(pack.trace_pack_type === 'operator_debug_trace_pack', 'trace pack should identify its type');
    assert(pack.classification.includes('support/debug'), 'trace pack should classify itself as support/debug');
    assert(pack.boundaries.includes('It does not call zKill or ESI.'), 'trace pack should state no-live boundary');
    assert(pack.boundaries.includes('Raw expanded ESI payloads are excluded by default.'), 'trace pack should exclude raw payloads');
    assert(pack.exclusions.includes('raw_esi_payload'), 'raw ESI payload exclusion should be explicit');
    assert(pack.fetch_runs.length === 1, 'trace pack should include latest fetch runs');
    assert(pack.api_request_logs.length === 1, 'trace pack should include latest API request logs');
    assert(pack.task_history.length === 1, 'trace pack should include task history summaries');
    assert(pack.data_quality_warnings.grouped.some((row) => row.warning_type === 'FIXTURE_WARNING'), 'trace pack should group data quality warnings');
    assert(pack.queue_status.by_status.some((row) => row.status === 'pending' && row.count === 1), 'trace pack should summarize pending queue refs');
    assert(pack.corpus_health.counts.some((row) => row.area === 'killmails' && row.rows === 1), 'trace pack should include corpus health summary');
    assert(pack.readiness.checks.db_initialized === true, 'trace pack should include readiness summary');
    assert(pack.smoke_artifacts.artifacts.length === 1, 'trace pack should include relevant smoke artifact paths');
    assert(!JSON.stringify(pack).includes('damage_taken'), 'trace pack should not include raw ESI payload contents');
    assert(!JSON.stringify(pack).includes('attackers'), 'trace pack should not export raw participant arrays');

    const written = writeOperatorDebugTracePack(db, {
      taskRunner,
      outputDir,
      databasePath: path.join(outputDir, 'fixture.sqlite'),
      smokeRoot: path.join(outputDir, 'smoke')
    });
    assert(fs.existsSync(written.output_path), 'trace pack writer should create a JSON artifact');
    const parsed = JSON.parse(fs.readFileSync(written.output_path, 'utf8'));
    assert(parsed.trace_pack_type === 'operator_debug_trace_pack', 'written pack should be parseable');

    const afterWrite = sideEffectCounts(db);
    assertSame(afterWrite, before, 'writing trace pack must not create evidence, observations, assessments, or API logs');
  } finally {
    closeDatabase(db);
  }

  console.log('operator debug trace pack verified');
}

async function seedTask(taskRunner) {
  await taskRunner.runTask({
    type: 'fixture.task',
    classification: TASK_CLASSIFICATIONS.READ_ONLY,
    scopeKey: 'fixture'
  }, async (task) => {
    task.progress({ stage: 'fixture', message: 'Fixture task progress' });
    return {
      status: 'succeeded',
      data: {
        run_id: 'run_fixture_trace',
        queued_refs_written: 1,
        api_calls_zkill: 0,
        api_calls_esi: 0
      }
    };
  });
}

function seedDatabase(db) {
  db.prepare(`
    INSERT INTO regions (region_id, region_name, source_sde_build, imported_at)
    VALUES (?, ?, ?, ?)
  `).run(10000001, 'Test Region', 'fixture-build', '2026-05-01T00:00:00Z');
  db.prepare(`
    INSERT INTO constellations (constellation_id, constellation_name, region_id, region_name, source_sde_build, imported_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(20000001, 'Test Constellation', 10000001, 'Test Region', 'fixture-build', '2026-05-01T00:00:00Z');
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
  db.prepare(`
    INSERT INTO sde_imports (
      build_number, variant, source_url, imported_at, file_checksum,
      systems_count, constellations_count, regions_count, adjacency_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('fixture-build', 'jsonl', 'fixtures/sde-jsonl', '2026-05-01T00:00:00Z', 'checksum', 1, 1, 1, 0);
  db.prepare(`
    INSERT INTO sde_inventory_imports (
      build_number, variant, source_url, imported_at, file_checksum,
      categories_count, groups_count, types_count, type_metadata_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('fixture-build', 'jsonl', 'fixtures/sde-jsonl', '2026-05-01T00:00:00Z', 'checksum', 0, 0, 0, 0);

  const repository = new EvidenceRepository(db);
  const run = repository.createFetchRun({
    runId: 'run_fixture_trace',
    trigger: 'fixture_test',
    watchType: 'manual_scan',
    watchId: 'trace-pack'
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
      source_id: 'trace-pack',
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
    endpoint: '/systemID/30000001/pastSeconds/3600/',
    method: 'GET',
    status_code: 200,
    duration_ms: 3,
    cache_status: 'fixture',
    requested_at: '2026-05-01T20:00:00Z'
  });
  repository.insertWarning(run.run_id, {
    killmail_id: 8801,
    warning_type: 'FIXTURE_WARNING',
    message: 'Fixture warning for trace pack grouping.',
    created_at: '2026-05-01T20:01:00Z'
  });
  repository.upsertDiscoveredKillmailRefs([{
    killmail_id: 8802,
    hash: 'fixture_hash_8802',
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
    api_calls_zkill: 1,
    api_calls_esi: 0
  }, 'success');
}

function seedSmokeArtifact(outputDir) {
  const smokeRoot = path.join(outputDir, 'smoke');
  fs.mkdirSync(smokeRoot, { recursive: true });
  fs.writeFileSync(path.join(smokeRoot, 'fixture-smoke.json'), JSON.stringify({
    status: 'fixture',
    boundary: 'queued refs only; no ESI expansion'
  }, null, 2));
  return smokeRoot;
}

function sideEffectCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: ${JSON.stringify({ actual, expected })}`);
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
