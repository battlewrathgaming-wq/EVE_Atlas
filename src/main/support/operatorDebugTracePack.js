const fs = require('node:fs');
const path = require('node:path');
const { buildCorpusHealthReportModel } = require('../reports/corpusHealthReport');
const { buildAppReadiness } = require('../services/appReadinessService');
const { defaultTaskRunner } = require('../services/taskRunner');
const { buildRuntimeBoundaryStatus } = require('./runtimeBoundaryStatus');
const { auraTempRoot } = require('../util/tempPaths');

const TRACE_POLICY_SOURCE = 'support.trace_log_redaction_policy.preview';
const MAX_TEXT_LENGTH = 240;
const MAX_ENDPOINT_LENGTH = 160;
const MAX_QUEUE_ERROR_LENGTH = 160;
const MAX_PATH_LENGTH = 260;
const SECRET_PATTERNS = [
  /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/-]+=*/gi,
  /\b(authorization|access_token|refresh_token|token|secret|password|cookie|sessionid|session_id)=([^&\s]+)/gi,
  /\b(cookie|set-cookie):\s*[^\n\r;]+/gi
];

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
      'SDE zip contents',
      'endpoint query values',
      'secrets/tokens/authorization/cookie-like strings',
      'unbounded diagnostic free text'
    ],
    trace_pack_disclosure: tracePackDisclosure(limit),
    runtime: {
      database_path: summarizeLocalPath(databasePath, 'runtime_database_path'),
      temp_root: summarizeLocalPath(auraTempRoot(), 'runtime_temp_root')
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
  `).all(limit).map((row) => ({
    ...row,
    error_summary: redactFreeText(row.error_summary, MAX_TEXT_LENGTH)
  }));
}

function latestApiRequestLogs(db, limit) {
  return db.prepare(`
    SELECT
      request_id, run_id, run_type, provider, endpoint, method, status_code,
      duration_ms, cache_status, retry_count, rate_limited, error_message, requested_at
    FROM api_request_logs
    ORDER BY requested_at DESC
    LIMIT ?
  `).all(limit).map((row) => ({
    ...row,
    endpoint: redactEndpoint(row.endpoint),
    error_message: redactFreeText(row.error_message, MAX_TEXT_LENGTH)
  }));
}

function summarizeTasks(tasks = []) {
  return tasks.map((task) => ({
    task_id: task.task_id,
    type: task.type,
    classification: task.classification,
    scope_key: redactFreeText(task.scope_key, 128),
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
      message: redactFreeText(task.error.message, MAX_TEXT_LENGTH)
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
    latest: latest.map((row) => ({
      ...row,
      message: redactFreeText(row.message, 220)
    }))
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
    `).all(limit).map((row) => ({
      ...row,
      last_error: redactFreeText(row.last_error, MAX_QUEUE_ERROR_LENGTH),
      sample_posture: 'bounded_support_provenance_only_not_evidence'
    }))
  };
}

function listSmokeArtifacts(smokeRoot, limit) {
  if (!fs.existsSync(smokeRoot)) {
    return {
      root: summarizeLocalPath(smokeRoot, 'smoke_artifact_root'),
      found: false,
      sample_limit: limit,
      omitted_count: 0,
      artifacts: []
    };
  }
  const files = fs.readdirSync(smokeRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const fullPath = path.join(smokeRoot, entry.name);
      const stat = fs.statSync(fullPath);
      return {
        path: summarizeLocalPath(fullPath, 'smoke_artifact_file'),
        name: entry.name,
        size_bytes: stat.size,
        modified_at: stat.mtime.toISOString()
      };
    })
    .sort((a, b) => b.modified_at.localeCompare(a.modified_at));
  const artifacts = files.slice(0, limit);
  return {
    root: summarizeLocalPath(smokeRoot, 'smoke_artifact_root'),
    found: true,
    sample_limit: limit,
    omitted_count: Math.max(0, files.length - artifacts.length),
    artifacts
  };
}

function tracePackDisclosure(limit) {
  return {
    policy_source: TRACE_POLICY_SOURCE,
    redaction_truncation_posture: {
      endpoint_query_values: 'stripped',
      secrets_tokens_authorization_cookie_like_strings: 'redacted',
      diagnostic_free_text: `truncated_to_${MAX_TEXT_LENGTH}_chars`,
      queue_last_error: `truncated_to_${MAX_QUEUE_ERROR_LENGTH}_chars`,
      endpoint_strings: `truncated_to_${MAX_ENDPOINT_LENGTH}_chars`
    },
    local_path_sensitivity: 'local paths are emitted as sensitive support metadata with role, basename, and truncated value only',
    sample_limit: limit,
    omitted_excluded_material: {
      raw_esi_payloads: 'excluded',
      full_provider_response_bodies: 'excluded',
      full_participant_payload_strings: 'excluded',
      endpoint_query_values: 'excluded',
      smoke_artifact_file_contents: 'excluded',
      unbounded_table_dumps: 'excluded',
      omitted_counts: 'reported where available'
    },
    non_authority: {
      evidence: false,
      discovery: false,
      observation: false,
      assessment_memory: false,
      product_truth: false,
      deletion_or_pruning_authority: false
    }
  };
}

function redactEndpoint(value) {
  if (!value) {
    return value || null;
  }
  let endpoint = String(value);
  const queryIndex = endpoint.indexOf('?');
  if (queryIndex !== -1) {
    const query = endpoint.slice(queryIndex + 1);
    const keyCount = query.split('&').filter(Boolean).length;
    endpoint = `${endpoint.slice(0, queryIndex)}?[redacted_query_values;query_key_count=${keyCount}]`;
  }
  return truncate(redactSecrets(endpoint), MAX_ENDPOINT_LENGTH);
}

function redactFreeText(value, maxLength = MAX_TEXT_LENGTH) {
  if (value === null || value === undefined || value === '') {
    return value || null;
  }
  return truncate(redactSecrets(String(value)), maxLength);
}

function redactSecrets(value) {
  return SECRET_PATTERNS.reduce((text, pattern) => text.replace(pattern, (match, key) => {
    if (key && String(key).includes(':')) {
      return '[redacted:secret]';
    }
    return `${key || 'secret'}=[redacted]`;
  }), value);
}

function truncate(value, maxLength) {
  if (!Number.isFinite(maxLength) || value.length <= maxLength) {
    return value;
  }
  const marker = '...[truncated]';
  return `${value.slice(0, Math.max(0, maxLength - marker.length))}${marker}`;
}

function summarizeLocalPath(value, role) {
  if (!value) {
    return null;
  }
  const stringValue = truncate(redactSecrets(String(value)), MAX_PATH_LENGTH);
  return {
    role,
    basename: path.basename(stringValue),
    value: stringValue,
    sensitivity: 'sensitive_support_metadata',
    posture: 'local_path_not_authority'
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
