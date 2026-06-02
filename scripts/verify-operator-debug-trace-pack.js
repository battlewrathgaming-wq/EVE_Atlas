const fs = require('node:fs');
const path = require('node:path');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
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
    assert(pack.trace_pack_disclosure.policy_source === 'support.trace_log_redaction_policy.preview', 'trace pack should name HS186 policy source');
    assert(pack.trace_pack_disclosure.sample_limit === 12, 'trace pack should disclose sample limit');
    assert(pack.trace_pack_disclosure.non_authority.evidence === false, 'trace pack should disclose non-Evidence posture');
    assert(pack.trace_pack_disclosure.omitted_excluded_material.endpoint_query_values === 'excluded', 'trace pack should disclose endpoint query exclusion');
    assert(pack.runtime.database_path.sensitivity === 'sensitive_support_metadata', 'database path should be sensitivity-labelled');
    assert(pack.runtime.temp_root.sensitivity === 'sensitive_support_metadata', 'temp root should be sensitivity-labelled');
    assert(pack.runtime_boundary.classification.includes('support readout'), 'trace pack should classify runtime boundary as support readout');
    assert(pack.runtime_boundary.durable_state_basis.includes('fetch_runs'), 'runtime boundary should name durable fetch run basis');
    assert(pack.runtime_boundary.volatile_state_basis.includes('current in-memory task history'), 'runtime boundary should name volatile task basis');
    assert(pack.runtime_boundary.support_artifacts.operator_debug_trace_pack.includes('excludes raw expanded ESI payloads'), 'runtime boundary should classify trace packs as support artifacts');
    assert(pack.runtime_boundary.partial_failure_indicators.queue_refs_pending === 1, 'runtime boundary should expose pending queue indicator');
    assert(pack.runtime_boundary.partial_failure_indicators.warning_groups === 1, 'runtime boundary should expose warning group indicator');
    assert(pack.runtime_boundary.current_volatile_task_counts.succeeded === 1, 'runtime boundary should summarize current volatile task statuses');
    assert(pack.runtime_boundary.boundaries.some((entry) => entry.includes('Retention preflight is read-only')), 'runtime boundary should separate retention preflight from deletion');
    assert(pack.fetch_runs.length === 1, 'trace pack should include latest fetch runs');
    assert(pack.api_request_logs.length === 1, 'trace pack should include latest API request logs');
    assert(pack.task_history.length === 2, 'trace pack should include task history summaries');
    assert(pack.data_quality_warnings.grouped.some((row) => row.warning_type === 'FIXTURE_WARNING'), 'trace pack should group data quality warnings');
    assert(pack.queue_status.by_status.some((row) => row.status === 'pending' && row.count === 1), 'trace pack should summarize pending queue refs');
    assert(pack.corpus_health.counts.some((row) => row.area === 'killmails' && row.rows === 1), 'trace pack should include corpus health summary');
    assert(pack.readiness.checks.db_initialized === true, 'trace pack should include readiness summary');
    assert(pack.smoke_artifacts.artifacts.length === 1, 'trace pack should include relevant smoke artifact paths');
    assert(pack.smoke_artifacts.root.sensitivity === 'sensitive_support_metadata', 'smoke artifact root should be sensitivity-labelled');
    assert(pack.smoke_artifacts.artifacts[0].path.sensitivity === 'sensitive_support_metadata', 'smoke artifact file path should be sensitivity-labelled');
    assert(pack.smoke_artifacts.omitted_count === 0, 'smoke artifact omitted count should be disclosed');
    verifyRedaction(pack);
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

    const serviceResult = await invokeServiceCommand('support.debug_trace_pack', {
      outputDir,
      smokeRoot: path.join(outputDir, 'smoke')
    }, {
      db,
      databasePath: path.join(outputDir, 'fixture.sqlite')
    });
    assert(fs.existsSync(serviceResult.output_path), 'service should write a trace pack artifact');
    assert(serviceResult.pack.boundaries.includes('It does not call zKill or ESI.'), 'service trace pack should preserve no-live boundary');
    assert(serviceResult.pack.runtime_boundary.restart_interpretation.includes('After restart'), 'service trace pack should include restart interpretation');

    const commands = listServiceCommands();
    assert(commands.some((entry) => entry.command === 'support.debug_trace_pack' && entry.classification === 'metadata-only'), 'support.debug_trace_pack should be metadata-only');
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
  await taskRunner.runTask({
    type: 'fixture.failed_task',
    classification: TASK_CLASSIFICATIONS.READ_ONLY,
    scopeKey: 'fixture?token=fixture-secret-token'
  }, async () => {
    const error = new Error(`${'Fixture task error '.repeat(20)}authorization=fixture-secret-token`);
    error.code = 'FIXTURE_TASK_FAILED';
    throw error;
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
    endpoint: '/systemID/30000001/pastSeconds/3600/?token=fixture-secret-token&authorization=Bearer%20fixture',
    method: 'GET',
    status_code: 200,
    duration_ms: 3,
    cache_status: 'fixture',
    error_message: `${'Fixture provider warning '.repeat(20)}authorization=fixture-secret-token cookie: session=fixture-cookie`,
    requested_at: '2026-05-01T20:00:00Z'
  });
  repository.insertWarning(run.run_id, {
    killmail_id: 8801,
    warning_type: 'FIXTURE_WARNING',
    message: `${'Fixture warning for trace pack grouping. '.repeat(12)}access_token=fixture-secret-token`,
    created_at: '2026-05-01T20:01:00Z'
  });
  repository.upsertDiscoveredKillmailRefs([{
    killmail_id: 8802,
    hash: 'fixture_hash_8802',
    discovered_at: '2026-05-01T20:02:00Z'
  }, {
    killmail_id: 8803,
    hash: 'fixture_hash_8803',
    discovered_at: '2026-05-01T20:01:30Z'
  }], {
    runId: run.run_id,
    discoveredByType: 'manual_system',
    discoveredById: '30000001',
    sourceSystemId: 30000001
  });
  repository.markDiscoveryRefsFailed([{
    killmail_id: 8802,
    hash: 'fixture_hash_8802',
    message: `${'Fixture queue failure '.repeat(14)}token=fixture-secret-token`
  }], '2026-05-01T20:03:00Z', {
    discoveredByType: 'manual_system',
    discoveredById: '30000001'
  });
  repository.finalizeFetchRun(run.run_id, {
    discovered_refs: 1,
    expanded_new: result.killmailsWritten,
    activity_events_written: result.eventsWritten,
    api_calls_zkill: 1,
    api_calls_esi: 0
  }, 'success', `${'Fixture fetch run diagnostic '.repeat(14)}access_token=fixture-secret-token`);
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

function verifyRedaction(pack) {
  const text = JSON.stringify(pack);
  for (const forbidden of [
    'fixture-secret-token',
    'fixture-cookie',
    'Bearer%20fixture',
    'access_token=',
    'authorization=',
    'cookie: session='
  ]) {
    assert(!text.includes(forbidden), `trace pack should redact ${forbidden}`);
  }

  const apiLog = pack.api_request_logs[0];
  assert(apiLog.endpoint.includes('[redacted_query_values;query_key_count=2]'), 'endpoint query values should be stripped');
  assert(apiLog.endpoint.length <= 160, 'endpoint should be bounded');
  assert(apiLog.error_message.length <= 240, 'API error message should be bounded');
  assert(apiLog.error_message.includes('[truncated]'), 'API error message should show truncation');
  assert(pack.fetch_runs[0].error_summary.length <= 240, 'fetch error summary should be bounded');
  assert(pack.fetch_runs[0].error_summary.includes('[truncated]'), 'fetch error summary should show truncation');
  const failedTask = pack.task_history.find((task) => task.type === 'fixture.failed_task');
  assert(failedTask, 'failed task should be present in trace pack');
  assert(failedTask.scope_key.includes('[redacted]'), 'task scope key should be redacted');
  assert(failedTask.error.message.length <= 240, 'task error message should be bounded');
  assert(failedTask.error.message.includes('[truncated]'), 'task error message should show truncation');
  assert(pack.data_quality_warnings.latest[0].message.length <= 220, 'warning message should be bounded');
  assert(pack.data_quality_warnings.latest[0].message.includes('[truncated]'), 'warning message should show truncation');
  const failedRef = pack.queue_status.latest_refs.find((ref) => ref.last_error);
  assert(failedRef.last_error.length <= 160, 'queue latest ref last_error should be bounded');
  assert(failedRef.last_error.includes('[truncated]'), 'queue latest ref last_error should show truncation');
  assert(failedRef.sample_posture === 'bounded_support_provenance_only_not_evidence', 'queue latest refs should disclose sample posture');
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
