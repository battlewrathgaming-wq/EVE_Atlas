const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { SdeTopologyImporter } = require('../src/main/sde/sdeImporter');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');
const { TASK_STATES } = require('../src/main/services/taskRunner');
const { buildRuntimeDbSnapshotPreflight } = require('../src/main/services/runtimeSnapshotService');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');
const { addSystemRadiusWatch, addWatchlistEntity } = require('../src/main/watchlist/watchlistRepository');
const { auraTempRoot } = require('../src/main/util/tempPaths');

const SCALE = Object.freeze({
  killmailCount: 1000,
  activityEvents: 7000,
  pendingRefs: 1000,
  failedRefs: 200,
  actorWatches: 10,
  systemWatches: 6,
  maxReportMs: 3000,
  maxSupportMs: 5000,
  maxArtifactBytes: 1024 * 1024
});

async function main() {
  const outputDir = path.join(auraTempRoot(), 'large-synthetic-scale');
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  const dbPath = path.join(outputDir, 'large-synthetic-scale.sqlite');
  const db = openDatabase(dbPath);
  migrate(db);

  try {
    await new SdeTopologyImporter(db).importFromPath(path.resolve(__dirname, '..', 'fixtures', 'sde-jsonl'), {
      buildNumber: 'fixture-build',
      sourceUrl: 'fixtures/sde-jsonl'
    });

    const seed = await seedLargeCorpus(db);
    const rawBefore = rawKillmailSnapshot(db, seed.sampleKillmailIds[0]);
    const timings = {};
    const tasks = {};

    const actor = await timedTask(timings, 'task_report_actor_ms', () => invokeServiceCommand('report.actor', {
      params: {
        entityType: 'character',
        entityId: 90000002,
        entityName: 'Atlas Scout'
      }
    }, { db, asTask: true }));
    tasks.actor = actor.task_id;
    assert(actor.status === TASK_STATES.SUCCEEDED, 'task-wrapped actor report should succeed');
    assert(actor.result.raw_ids.character_ids.includes(90000002), 'actor report should preserve scoped character ID');
    assert(actor.result.text.includes('not proof'), 'actor report should preserve evidence interpretation boundary');

    const radius = await timedTask(timings, 'task_report_radius_ms', () => invokeServiceCommand('report.radius', {
      params: {
        center: 30000001,
        radiusJumps: 2,
        maxSystems: 4
      }
    }, { db, asTask: true }));
    tasks.radius = radius.task_id;
    assert(radius.status === TASK_STATES.SUCCEEDED, 'task-wrapped radius report should succeed');
    assert(radius.result.raw_ids.solar_system_ids.includes(30000001), 'radius report should preserve scoped system ID');
    assert(radius.result.interpretation_warning.includes('not proof'), 'radius report should preserve interpretation warning');

    const queue = await timedTask(timings, 'task_report_queue_ms', () => invokeServiceCommand('report.queue', {
      params: { limit: 25 }
    }, { db, asTask: true }));
    tasks.queue = queue.task_id;
    assert(queue.status === TASK_STATES.SUCCEEDED, 'task-wrapped queue report should succeed');
    assert(queue.result.text.includes('discovery refs are staging/provenance metadata'), 'queue report should preserve non-evidence wording');

    const corpus = await timedTask(timings, 'task_report_corpus_health_ms', () => invokeServiceCommand('report.corpus_health', {}, {
      db,
      asTask: true
    }));
    tasks.corpus = corpus.task_id;
    assert(corpus.status === TASK_STATES.SUCCEEDED, 'task-wrapped corpus health report should succeed');
    assert(corpus.result.boundaries.some((line) => line.includes('does not infer assessment')), 'corpus health should preserve support boundary');
    assert(corpus.result.health.counts.some((row) => row.area === 'killmails' && row.rows === SCALE.killmailCount), 'corpus health should report seeded killmail count');

    const snapshotPreflight = timed(timings, 'snapshot_preflight_ms', () => buildRuntimeDbSnapshotPreflight(db, {}, { databasePath: dbPath }));
    assert(snapshotPreflight.table_counts.killmails === SCALE.killmailCount, 'snapshot preflight should report large killmail count');
    assert(snapshotPreflight.boundary.includes('read-only'), 'snapshot preflight should remain read-only');

    const trace = await timedTask(timings, 'task_debug_trace_ms', () => invokeServiceCommand('support.debug_trace_pack', {
      outputDir: path.join(outputDir, 'trace')
    }, {
      db,
      databasePath: dbPath,
      asTask: true
    }));
    tasks.trace = trace.task_id;
    assert(trace.status === TASK_STATES.SUCCEEDED, 'task-wrapped debug trace should succeed');
    assert(fs.existsSync(trace.result.output_path), 'debug trace should write a bounded support artifact');
    const traceStats = fs.statSync(trace.result.output_path);
    assert(traceStats.size < SCALE.maxArtifactBytes, 'debug trace should stay bounded under 1 MiB');
    const traceText = fs.readFileSync(trace.result.output_path, 'utf8');
    assert(!traceText.includes('"raw_esi_payload":{'), 'debug trace should not dump raw ESI payload objects');
    assert(!traceText.includes('"raw_esi_payload":"'), 'debug trace should not dump raw ESI payload strings');

    const taskList = await invokeServiceCommand('task.list', { limit: 12 }, { db });
    for (const taskId of Object.values(tasks)) {
      assert(taskList.some((task) => task.task_id === taskId && task.status === TASK_STATES.SUCCEEDED), `task history should retain succeeded task ${taskId}`);
    }

    const assessmentList = await invokeServiceCommand('assessment.list', { limit: 5 }, { db });
    assert(assessmentList.artifacts.length === 1, 'large scale harness should retain deliberate assessment artifact');
    assert(assessmentList.artifacts[0].boundary.includes('not evidence'), 'assessment artifact should remain classified as non-evidence');

    assertSame(rawKillmailSnapshot(db, seed.sampleKillmailIds[0]), rawBefore, 'read/report/support paths should preserve raw evidence payload checksum');
    assert(count(db, 'killmails') === SCALE.killmailCount, 'large scale should retain seeded killmail count');
    assert(count(db, 'activity_events') === SCALE.activityEvents, 'large scale should retain seeded activity event count');
    assert(countByStatus(db, 'pending') === SCALE.pendingRefs, 'large scale should retain pending queue refs');
    assert(countByStatus(db, 'failed') === SCALE.failedRefs, 'large scale should retain failed queue refs');
    assert(count(db, 'data_quality_warnings') >= 1, 'large scale should retain reviewable warning rows');
    assert(duplicateEventKeys(db) === 0, 'large scale should not create duplicate activity event keys');
    assert(Object.values(timings).every((entry) => entry.ms < entry.threshold_ms), 'large scale timings should stay below explicit thresholds');

    const summary = {
      status: 'large synthetic scale pressure verified',
      db_path: dbPath,
      generated_at: new Date().toISOString(),
      requested_corpus: SCALE,
      corpus: {
        killmails: count(db, 'killmails'),
        activity_events: count(db, 'activity_events'),
        discovered_refs: count(db, 'discovered_killmail_refs'),
        pending_refs: countByStatus(db, 'pending'),
        failed_refs: countByStatus(db, 'failed'),
        assessment_artifacts: count(db, 'assessment_artifacts'),
        data_quality_warnings: count(db, 'data_quality_warnings'),
        fetch_runs: count(db, 'fetch_runs'),
        api_request_logs: count(db, 'api_request_logs')
      },
      timings,
      support_artifact: {
        path: trace.result.output_path,
        size_bytes: traceStats.size,
        raw_payload_excluded: true
      },
      task_ids: tasks,
      decision: 'Synchronous report/service paths stayed under conservative thresholds; no process isolation is justified by this scale pressure.'
    };

    const resultPath = path.join(outputDir, 'large-synthetic-scale-result.json');
    fs.writeFileSync(resultPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    const resultText = fs.readFileSync(resultPath, 'utf8');
    assert(!resultText.includes('"raw_esi_payload"'), 'scale diagnostics should not dump raw ESI payloads');
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    closeDatabase(db);
  }
}

async function seedLargeCorpus(db) {
  const repository = new EvidenceRepository(db);
  const run = repository.createFetchRun({
    trigger: 'fixture_scale_pressure',
    watchType: 'system_radius',
    watchId: 'large-synthetic-scale'
  });
  const systems = [30000001, 30000002, 30000003, 30000004];
  const killmails = [];
  for (let index = 0; index < SCALE.killmailCount; index += 1) {
    const killmailId = 600000 + index;
    killmails.push({
      raw: syntheticKillmail(killmailId, systems[index % systems.length], index),
      hash: `large_scale_hash_${killmailId}`
    });
  }

  const pkg = evidencePackageFromExpandedKillmails({
    killmails,
    run: {
      run_id: run.run_id,
      source_type: 'system_radius',
      source_id: 'large-synthetic-scale',
      started_at: run.started_at
    },
    discoveredBy: {
      type: 'system_radius',
      id: 'large-synthetic-scale'
    }
  });
  const persisted = repository.persistEvidencePackage(pkg);
  repository.insertWarning(run.run_id, {
    warning_type: 'SCALE_FIXTURE_PARTIAL_SAMPLE',
    message: 'Large synthetic scale pressure uses fixture data and intentionally leaves pending/failed queue refs reviewable.'
  });
  repository.finalizeFetchRun(run.run_id, {
    discovered_refs: SCALE.killmailCount + SCALE.pendingRefs + SCALE.failedRefs,
    expanded_new: persisted.killmailsWritten,
    activity_events_written: persisted.eventsWritten,
    api_calls_zkill: 4,
    api_calls_esi: 0
  }, 'success', 'Large synthetic scale pressure uses fixture data only; no live API calls.');

  seedApiLogs(repository, run.run_id, systems);
  seedRefs(db, SCALE.pendingRefs, 'pending');
  seedRefs(db, SCALE.failedRefs, 'failed');
  seedWatches(db);
  await seedAssessment(db, run.run_id);

  return {
    runId: run.run_id,
    sampleKillmailIds: [600000, 600001, 600002]
  };
}

function syntheticKillmail(killmailId, systemId, index) {
  const clone = JSON.parse(JSON.stringify(fixtureKillmail));
  clone.killmail_id = killmailId;
  clone.killmail_time = new Date(Date.UTC(2026, 4, 1, 20, 0, index)).toISOString();
  clone.solar_system_id = systemId;
  clone.victim.character_id = 90000001 + (index % 3);
  clone.victim.corporation_id = 98000001;
  clone.victim.alliance_id = 99000001;
  clone.attackers = (clone.attackers || []).slice(0, 2).map((attacker, attackerIndex) => ({
    ...attacker,
    character_id: 90000002 + attackerIndex,
    corporation_id: 98000002,
    alliance_id: 99000002,
    final_blow: attackerIndex === 0
  }));
  return clone;
}

function seedApiLogs(repository, runId, systems) {
  for (const systemId of systems) {
    repository.insertApiRequestLog({
      run_id: runId,
      run_type: 'collection',
      provider: 'zkill',
      endpoint: `https://zkillboard.com/api/systemID/${systemId}/pastSeconds/86400/`,
      method: 'GET',
      status_code: 200,
      duration_ms: 1,
      cache_status: 'fixture',
      requested_at: new Date().toISOString()
    });
  }
}

function seedRefs(db, countToInsert, status) {
  const statement = db.prepare(`
    INSERT INTO discovered_killmail_refs (
      killmail_id, killmail_hash, discovered_by_type, discovered_by_id,
      source_scope, source_system_id, discovered_at, first_seen_run_id,
      last_seen_run_id, last_seen_at, status, priority, failure_count,
      last_error, preview_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date().toISOString();
  const offset = status === 'failed' ? 800000 : 700000;
  for (let index = 0; index < countToInsert; index += 1) {
    statement.run(
      offset + index,
      `${status}_scale_hash_${index}`,
      'manual_radius',
      'system:30000001:radius:2',
      'radius',
      30000001 + (index % 4),
      now,
      null,
      null,
      now,
      status,
      index,
      status === 'failed' ? 1 : 0,
      status === 'failed' ? 'fixture scale failed expansion retained for retry' : null,
      JSON.stringify({ attacker_count: 2, victim: { ship_type_id: 587 } })
    );
  }
}

function seedWatches(db) {
  for (let index = 0; index < SCALE.actorWatches; index += 1) {
    addWatchlistEntity(db, {
      entityType: 'character',
      entityId: 90000002 + index,
      entityName: `Large Scale Actor ${index + 1}`,
      lookbackDays: 7,
      maxKillmailsPerRun: 2,
      pollIntervalMinutes: 60,
      notes: 'Large synthetic scale pressure fixture'
    });
  }
  for (let index = 0; index < SCALE.systemWatches; index += 1) {
    addSystemRadiusWatch(db, {
      centerSystemId: 30000001 + (index % 4),
      radiusJumps: index % 3,
      lookbackSeconds: 86400,
      maxSystems: 4,
      maxExpansions: 2,
      pollIntervalMinutes: 60,
      notes: 'Large synthetic scale pressure fixture'
    });
  }
}

function seedAssessment(db, runId) {
  return invokeServiceCommand('assessment.create', {
    artifactType: 'entity_interest',
    entityType: 'character',
    entityId: 90000002,
    entityName: 'Atlas Scout',
    assessmentReason: 'Fixture scale pressure keeps deliberate assessment memory separate from evidence.',
    assessmentSummary: 'Reviewable large-corpus assessment artifact for scale diagnostics.',
    sourceReportType: 'actor',
    sourceRunIds: [runId],
    sampleKillmailIds: [600000, 600001, 600002],
    evidenceScopeType: 'actor',
    interestScore: 10,
    confidence: 80
  }, { db });
}

async function timedTask(timings, key, callback) {
  const started = performance.now();
  const result = await callback();
  timings[key] = {
    ms: roundMs(performance.now() - started),
    threshold_ms: key.includes('debug_trace') ? SCALE.maxSupportMs : SCALE.maxReportMs
  };
  return result;
}

function timed(timings, key, callback) {
  const started = performance.now();
  const result = callback();
  timings[key] = {
    ms: roundMs(performance.now() - started),
    threshold_ms: SCALE.maxReportMs
  };
  return result;
}

function rawKillmailSnapshot(db, killmailId) {
  return db.prepare(`
    SELECT killmail_id, killmail_hash, raw_payload_checksum
    FROM killmails
    WHERE killmail_id = ?
  `).get(killmailId);
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function countByStatus(db, status) {
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM discovered_killmail_refs
    WHERE status = ?
  `).get(status).count;
}

function duplicateEventKeys(db) {
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM (
      SELECT event_key
      FROM activity_events
      GROUP BY event_key
      HAVING COUNT(*) > 1
    )
  `).get().count;
}

function roundMs(value) {
  return Math.round(value * 100) / 100;
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
