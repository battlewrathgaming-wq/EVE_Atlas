const SEVERITIES = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  DEGRADED: 'degraded',
  ERROR: 'error',
  BLOCKED: 'blocked'
});

const CATEGORIES = Object.freeze({
  API: 'api',
  EVIDENCE: 'evidence',
  METADATA: 'metadata',
  READINESS: 'readiness',
  TASK: 'task',
  USER_ACTION: 'user_action',
  QUEUE: 'queue',
  REPORT: 'report'
});

const DEFINITIONS = Object.freeze({
  API_ESTIMATE_UNKNOWN: definition(SEVERITIES.INFO, CATEGORIES.API, false),
  CAP_SKIPPED: definition(SEVERITIES.INFO, CATEGORIES.API, false),
  CHECKSUM_MISMATCH: definition(SEVERITIES.ERROR, CATEGORIES.EVIDENCE, true),
  DB_NOT_INITIALIZED: definition(SEVERITIES.BLOCKED, CATEGORIES.READINESS, true),
  DB_PATH_OUTSIDE_PROJECT: definition(SEVERITIES.WARNING, CATEGORIES.READINESS, true),
  LOCAL_LOOKUP_FAILURE: definition(SEVERITIES.BLOCKED, CATEGORIES.READINESS, true),
  LIVE_API_DISABLED: definition(SEVERITIES.BLOCKED, CATEGORIES.USER_ACTION, true),
  MISSING_ATTACKER_CHARACTER_ID: definition(SEVERITIES.INFO, CATEGORIES.EVIDENCE, false),
  MIGRATIONS_NOT_APPLIED: definition(SEVERITIES.BLOCKED, CATEGORIES.READINESS, true),
  PARTIAL_SAMPLE: definition(SEVERITIES.INFO, CATEGORIES.REPORT, false),
  QUEUE_PREVIEW_NOT_EVIDENCE: definition(SEVERITIES.INFO, CATEGORIES.QUEUE, false),
  RUNTIME_PATHS_INVALID: definition(SEVERITIES.BLOCKED, CATEGORIES.READINESS, true),
  SDE_INVENTORY_NOT_READY: definition(SEVERITIES.DEGRADED, CATEGORIES.METADATA, true),
  SDE_TOPOLOGY_NOT_READY: definition(SEVERITIES.DEGRADED, CATEGORIES.METADATA, true),
  TASK_FAILED: definition(SEVERITIES.ERROR, CATEGORIES.TASK, true),
  TASK_LOCKED: definition(SEVERITIES.BLOCKED, CATEGORIES.TASK, true),
  TASK_WARNING: definition(SEVERITIES.WARNING, CATEGORIES.TASK, false),
  UNKNOWN_SERVICE_COMMAND: definition(SEVERITIES.ERROR, CATEGORIES.USER_ACTION, true),
  USER_AGENT_MISSING: definition(SEVERITIES.BLOCKED, CATEGORIES.API, true)
});

function taxonomyMessage(code, message, overrides = {}) {
  const normalizedCode = normalizeCode(code);
  const base = DEFINITIONS[normalizedCode] || definition(SEVERITIES.WARNING, CATEGORIES.USER_ACTION, false);
  return {
    severity: overrides.severity || base.severity,
    code: normalizedCode,
    message,
    category: overrides.category || base.category,
    source: overrides.source || null,
    actionable: overrides.actionable !== undefined ? Boolean(overrides.actionable) : base.actionable
  };
}

function normalizeMessage(entry = {}, fallback = {}) {
  return taxonomyMessage(
    entry.code || fallback.code || 'TASK_WARNING',
    entry.message || fallback.message || String(entry),
    {
      severity: entry.severity || fallback.severity,
      category: entry.category || fallback.category,
      source: entry.source || fallback.source,
      actionable: entry.actionable ?? fallback.actionable
    }
  );
}

function validateTaxonomyMessage(entry) {
  if (!entry || typeof entry !== 'object') {
    return false;
  }
  return Object.values(SEVERITIES).includes(entry.severity) &&
    typeof entry.code === 'string' &&
    entry.code.length > 0 &&
    typeof entry.message === 'string' &&
    entry.message.length > 0 &&
    Object.values(CATEGORIES).includes(entry.category) &&
    typeof entry.actionable === 'boolean';
}

function knownCodes() {
  return Object.keys(DEFINITIONS).sort();
}

function normalizeCode(code) {
  return String(code || 'TASK_WARNING').trim().toUpperCase();
}

function definition(severity, category, actionable) {
  return { severity, category, actionable };
}

module.exports = {
  SEVERITIES,
  CATEGORIES,
  taxonomyMessage,
  normalizeMessage,
  validateTaxonomyMessage,
  knownCodes
};
