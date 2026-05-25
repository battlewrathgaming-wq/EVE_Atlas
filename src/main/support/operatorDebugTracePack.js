const fs = require('node:fs');
const path = require('node:path');
const { buildCorpusHealthReportModel } = require('../reports/corpusHealthReport');
const { buildAppReadiness } = require('../services/appReadinessService');
const { defaultTaskRunner } = require('../services/taskRunner');
const { buildRuntimeBoundaryStatus } = require('./runtimeBoundaryStatus');
const { auraTempRoot } = require('../util/tempPaths');

function buildOperatorDebugTracePack(db, options = {}) {
  const generatedAt = new Date().toISOString();
  const limit = positiveInteger(options.limit || 12, 'limit');
  const taskRunner = options.taskRunner || defaultTaskRunner;
  const databasePath = options.databasePath || process.env.AURA_ATLAS_DB_PATH || null;
  const smokeRoot = options.smokeRoot || path.join(auraTempRoot(), 'live-scoped-zkill-smoke');

  return {
    trace_pack_type: 'operator_debug_trace_pack',
    generated_at: generatedAt,
    classification: 'support/debug artifact; not evidence, not observation, not assessment',
    boundaries: [
      'This trace pack reads local SQLite tables and in-memory task history only.',
      'It does not call zKill or ESI.',
      'It does not parse SDE zip files.',
      'It does not create killmails, activity events, assessment artifacts, or observations.',
      'Raw expanded ESI payloads are excluded by default.'
    ],
    exclusions: [
      'raw_esi_payload',
      'full killmail participant payloads',
      'full API response bodies',
      'SDE zip contents'
    ],
    runtime: {
      database_path: databasePath,
      temp_root: auraTempRoot()
    },
    runtime_boundary: buildRuntimeBoundaryStatus(db, { taskRunner, limit }),
    readiness: summarizeReadiness(buildAppReadiness(db, { databasePath, mode: 'operator-debug-trace-pack' })),
    corpus_health: summarizeCorpusHealth(buildCorpusHealthReportModel(db)),
    fetch_runs: latestFetchRuns(db, limit),
    api_request_logs: latestApiRequestLogs(db, limit),
    task_history: summarizeTasks(taskRunner.listTasks({ limit })),
    data_quality_warnings: latestWarnings(db, limit),
    queue_status: queueStatus(db, limit),
    smoke_artifacts: listSmokeArtifacts(smokeRoot, limit)
  };
}

function writeOperatorDebugTracePack(db, options = {}) {
  const pack = buildOperatorDebugTracePack(db, options);
  const outputDir = path.resolve(options.outputDir || path.join(auraTempRoot(), 'operator-debug-trace-packs'));
  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `operator-debug-trace-pack-${safeTimestamp(pack.generated_at)}.json`;
  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, `${JSON.stringify(pack, null, 2)}\n`, 'utf8');
  return {
    output_path: outputPath,
    pack
  };
}

function summarizeReadiness(readiness) {
  return {
    status: readiness.status,
    generated_at: readiness.generated_at,
    live_api: readiness.live_api,
    checks: readiness.checks,
    lookup_counts: readiness.lookup_counts,
    blockers: readiness.blockers,
    warnings: readiness.warnings,
    path_state: readiness.path_state?.map((entry) => ({
      key: entry.key,
      exists: entry.exists,
      is_directory: entry.is_directory,
      is_file: entry.is_file,
      valid: entry.valid
    })) || []
  };
}

function summarizeCorpusHealth(health) {
  return {
    generated_at: health.generated_at,
    classification: health.classification,
    counts: health.counts,
    integrity: health.integrity,
    freshness: health.freshness,
    warning_rows: health.warning_rows,
    boundaries: health.boundaries
  };
}

function latestFetchRuns(db, limit) {
  return db.prepare(`
    SELECT
      run_id, trigger, watch_type, watch_id, started_at, finished_at, status,
      discovered_refs, already_cached, expanded_new, failed_expansions,
      activity_events_written, api_calls_zkill, api_calls_esi, duration_ms,
      error_summary
    FROM fetch_runs
    ORDER BY started_at DESC
    LIMIT ?
  `).all(limit);
}

function latestApiRequestLogs(db, limit) {
  return db.prepare(`
    SELECT
      request_id, run_id, run_type, provider, endpoint, method, status_code,
      duration_ms, cache_status, retry_count, rate_limited, error_message, requested_at
    FROM api_request_logs
    ORDER BY requested_at DESC
    LIMIT ?
  `).all(limit);
}

function summarizeTasks(tasks = []) {
  return tasks.map((task) => ({
    task_id: task.task_id,
    type: task.type,
    classification: task.classification,
    scope_key: task.scope_key,
    status: task.status,
    queued_at: task.queued_at,
    started_at: task.started_at,
    finished_at: task.finished_at,
    cancel_requested_at: task.cancel_requested_at,
    warning_count: task.warnings?.length || 0,
    progress_count: task.progress?.length || 0,
    error: task.error ? {
      code: task.error.code,
      severity: task.error.severity,
      message: task.error.message
    } : null,
    result_summary: summarizeTaskResult(task.result)
  }));
}

function summarizeTaskResult(result) {
  if (!result || typeof result !== 'object') {
    return result || null;
  }
  const summary = {};
  for (const key of [
    'run_id',
    'queued_refs_written',
    'selected_count',
    'expanded_new',
    'activity_events_written',
    'api_calls_zkill',
    'api_calls_esi',
    'status',
    'watch_id',
    'artifact_id'
  ]) {
    if (result[key] !== undefined) {
      summary[key] = result[key];
    }
  }
  return Object.keys(summary).length ? summary : { keys: Object.keys(result).sort() };
}

function latestWarnings(db, limit) {
  const latest = db.prepare(`
    SELECT run_id, killmail_id, warning_type, message, created_at
    FROM data_quality_warnings
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
  const grouped = db.prepare(`
    SELECT warning_type, COUNT(*) AS count, MAX(created_at) AS latest_at
    FROM data_quality_warnings
    GROUP BY warning_type
    ORDER BY count DESC, warning_type
  `).all();
  return {
    grouped,
    latest
  };
}

function queueStatus(db, limit) {
  return {
    by_status: db.prepare(`
      SELECT status, COUNT(*) AS count
      FROM discovered_killmail_refs
      GROUP BY status
      ORDER BY count DESC, status
    `).all(),
    by_scope: db.prepare(`
      SELECT discovered_by_type, discovered_by_id, status, COUNT(*) AS count
      FROM discovered_killmail_refs
      GROUP BY discovered_by_type, discovered_by_id, status
      ORDER BY count DESC, discovered_by_type, discovered_by_id
      LIMIT ?
    `).all(limit),
    latest_refs: db.prepare(`
      SELECT
        killmail_id, discovered_by_type, discovered_by_id, source_system_id,
        status, discovered_at, selected_for_expansion_at, priority, failure_count,
        last_error, expanded_at
      FROM discovered_killmail_refs
      ORDER BY discovered_at DESC
      LIMIT ?
    `).all(limit)
  };
}

function listSmokeArtifacts(smokeRoot, limit) {
  if (!fs.existsSync(smokeRoot)) {
    return {
      root: smokeRoot,
      found: false,
      artifacts: []
    };
  }
  const artifacts = fs.readdirSync(smokeRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const fullPath = path.join(smokeRoot, entry.name);
      const stat = fs.statSync(fullPath);
      return {
        path: fullPath,
        name: entry.name,
        size_bytes: stat.size,
        modified_at: stat.mtime.toISOString()
      };
    })
    .sort((a, b) => b.modified_at.localeCompare(a.modified_at))
    .slice(0, limit);
  return {
    root: smokeRoot,
    found: true,
    artifacts
  };
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return number;
}

function safeTimestamp(value) {
  return String(value).replace(/[:.]/g, '-');
}

module.exports = {
  buildOperatorDebugTracePack,
  writeOperatorDebugTracePack
};
