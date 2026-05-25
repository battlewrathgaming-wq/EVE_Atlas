const { defaultTaskRunner } = require('../services/taskRunner');

function buildRuntimeBoundaryStatus(db, options = {}) {
  const limit = positiveInteger(options.limit || 12, 'limit');
  const taskRunner = options.taskRunner || defaultTaskRunner;
  const tasks = taskRunner.listTasks({ limit });
  const fetchSummary = fetchRunSummary(db);
  const queueSummary = queueSummaryForBoundary(db);
  const apiSummary = apiSummaryForBoundary(db);

  return {
    classification: 'runtime/support readout; not evidence, not observation, not assessment',
    durable_state_basis: [
      'SQLite evidence/provenance tables',
      'Discovery queue status',
      'Watch definitions and schedule timestamps',
      'fetch_runs',
      'api_request_logs',
      'ingestion_audits',
      'data_quality_warnings',
      'assessment_artifacts'
    ],
    volatile_state_basis: [
      'current in-memory task history',
      'current in-memory task locks and cancellation controllers',
      'current Watch executor session/active-task state'
    ],
    support_artifacts: {
      runtime_db_snapshot: 'support artifact; copies local SQLite DB; not evidence pruning or deletion',
      operator_debug_trace_pack: 'support/debug artifact; excludes raw expanded ESI payloads and full participant payloads',
      api_request_logs: 'provider diagnostics/provenance; not Evidence by themselves',
      reports: 'readouts derived from local state; not Evidence by themselves'
    },
    restart_interpretation: 'After restart, durable SQLite rows remain reviewable; in-memory task/session state is fresh and must not be treated as persisted history.',
    partial_failure_indicators: {
      fetch_runs_failed: fetchSummary.failed || 0,
      fetch_runs_with_failed_expansions: fetchSummary.withFailedExpansions || 0,
      fetch_runs_with_warning_summary: fetchSummary.withWarningSummary || 0,
      queue_refs_pending: queueSummary.pending || 0,
      queue_refs_failed: queueSummary.failed || 0,
      api_errors: apiSummary.errors || 0,
      warning_groups: warningGroupCount(db)
    },
    current_volatile_task_counts: tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {}),
    boundaries: [
      'Discovery refs remain queue/provenance until ESI expansion writes Evidence.',
      'Partial success means durable records must be read with fetch run, API log, warning, and queue status context.',
      'Retention preflight is read-only and distinct from deletion execution.',
      'Support artifacts are diagnostics and must not be treated as Evidence, Observation, or Assessment Memory.'
    ]
  };
}

function fetchRunSummary(db) {
  return db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
      SUM(CASE WHEN failed_expansions > 0 THEN 1 ELSE 0 END) AS withFailedExpansions,
      SUM(CASE WHEN error_summary IS NOT NULL AND error_summary != '' THEN 1 ELSE 0 END) AS withWarningSummary
    FROM fetch_runs
  `).get() || { failed: 0, withFailedExpansions: 0, withWarningSummary: 0 };
}

function queueSummaryForBoundary(db) {
  const rows = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM discovered_killmail_refs
    GROUP BY status
  `).all();
  return rows.reduce((acc, row) => {
    acc[row.status] = row.count;
    return acc;
  }, {});
}

function apiSummaryForBoundary(db) {
  return db.prepare(`
    SELECT COUNT(*) AS errors
    FROM api_request_logs
    WHERE status_code >= 400 OR error_message IS NOT NULL
  `).get() || { errors: 0 };
}

function warningGroupCount(db) {
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM (
      SELECT warning_type
      FROM data_quality_warnings
      GROUP BY warning_type
    )
  `).get().count;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return number;
}

module.exports = {
  buildRuntimeBoundaryStatus
};
