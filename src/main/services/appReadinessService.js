const fs = require('node:fs');
const path = require('node:path');
const { USER_AGENT } = require('../../shared/constants');
const { projectRoot } = require('../util/tempPaths');
const { taxonomyMessage } = require('./messageTaxonomy');

function buildAppReadiness(db, options = {}) {
  const databasePath = options.databasePath || process.env.AURA_ATLAS_DB_PATH || null;
  const paths = resolveRuntimePaths(databasePath);
  const pathState = inspectRuntimePaths(paths);
  const topology = latestRow(db, 'sde_imports');
  const inventory = latestRow(db, 'sde_inventory_imports');
  const counts = lookupCounts(db);
  const checks = {
    db_initialized: Boolean(db),
    migrations_applied: migrationCount(db) > 0,
    topology_imported: Boolean(topology),
    topology_lookup_ready: Boolean(
      topology &&
      counts.regions > 0 &&
      counts.constellations > 0 &&
      counts.solar_systems > 0 &&
      counts.system_adjacency > 0
    ),
    inventory_imported: Boolean(inventory),
    type_metadata_ready: Boolean(inventory && counts.type_metadata > 0),
    runtime_paths_valid: pathState.valid,
    runtime_paths_ready: pathState.ready,
    live_api_enabled: process.env.AURA_ATLAS_LIVE_API === '1',
    user_agent_configured: typeof USER_AGENT === 'string' && USER_AGENT.trim().length > 0
  };
  const blockers = blockersFor(checks);
  const warnings = warningsFor(checks, paths);

  return {
    status: blockers.length ? 'blocked' : warnings.length ? 'degraded' : 'ready',
    generated_at: new Date().toISOString(),
    app: {
      name: 'AURA Atlas',
      mode: options.mode || 'electron-main',
      user_agent: USER_AGENT
    },
    live_api: {
      enabled: checks.live_api_enabled,
      state: checks.live_api_enabled ? 'enabled' : 'disabled',
      rule: 'Live zKill/ESI calls require explicit enablement'
    },
    paths,
    path_state: pathState.paths,
    checks,
    lookup_counts: counts,
    sde: {
      topology: importSummary(topology),
      inventory: importSummary(inventory)
    },
    blockers,
    warnings
  };
}

function prepareAppRuntimePaths(options = {}) {
  const databasePath = options.databasePath || process.env.AURA_ATLAS_DB_PATH || null;
  const paths = resolveRuntimePaths(databasePath);
  const before = inspectRuntimePaths(paths);
  if (!before.valid) {
    const error = new Error('Runtime/cache paths are not valid for this environment');
    error.code = 'RUNTIME_PATHS_INVALID';
    error.path_state = before.paths;
    throw error;
  }

  const created = [];
  for (const entry of before.paths.filter((item) => item.required && !item.exists)) {
    fs.mkdirSync(entry.path, { recursive: true });
    created.push(entry.key);
  }

  const after = inspectRuntimePaths(paths);
  return {
    status: after.ready ? 'prepared' : 'degraded',
    generated_at: new Date().toISOString(),
    paths,
    path_state: after.paths,
    created
  };
}

function ensureAppReady(readiness, requiredChecks = []) {
  const failed = requiredChecks.filter((check) => !readiness.checks[check]);
  if (failed.length) {
    const error = new Error(`App readiness check failed: ${failed.join(', ')}`);
    error.code = 'APP_READINESS_BLOCKED';
    error.failed_checks = failed;
    throw error;
  }
  return true;
}

function latestRow(db, tableName) {
  if (!tableExists(db, tableName)) {
    return null;
  }
  return db.prepare(`
    SELECT *
    FROM ${tableName}
    ORDER BY id DESC
    LIMIT 1
  `).get() || null;
}

function lookupCounts(db) {
  return {
    regions: count(db, 'regions'),
    constellations: count(db, 'constellations'),
    solar_systems: count(db, 'solar_systems'),
    system_adjacency: count(db, 'system_adjacency'),
    type_metadata: count(db, 'type_metadata'),
    entities: count(db, 'entities'),
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    fetch_runs: count(db, 'fetch_runs'),
    metadata_runs: count(db, 'metadata_runs')
  };
}

function migrationCount(db) {
  return count(db, 'schema_migrations');
}

function importSummary(row) {
  if (!row) {
    return {
      imported: false,
      build_number: null,
      source_url: null,
      imported_at: null,
      file_checksum: null
    };
  }
  return {
    imported: true,
    build_number: row.build_number || null,
    source_url: row.source_url || null,
    imported_at: row.imported_at || null,
    file_checksum: row.file_checksum || null
  };
}

function blockersFor(checks) {
  const blockers = [];
  if (!checks.db_initialized) {
    blockers.push(blocker('DB_NOT_INITIALIZED', 'Database is not initialized'));
  }
  if (!checks.migrations_applied) {
    blockers.push(blocker('MIGRATIONS_NOT_APPLIED', 'Database migrations have not been applied'));
  }
  if (!checks.runtime_paths_valid) {
    blockers.push(blocker('RUNTIME_PATHS_INVALID', 'Runtime/cache paths are not valid for this environment'));
  }
  if (!checks.user_agent_configured) {
    blockers.push(blocker('USER_AGENT_MISSING', 'User-Agent is required before live API use'));
  }
  return blockers;
}

function warningsFor(checks, paths) {
  const warnings = [];
  if (!checks.topology_lookup_ready) {
    warnings.push(warning('SDE_TOPOLOGY_NOT_READY', 'Topology-dependent actions require SDE topology import'));
  }
  if (!checks.type_metadata_ready) {
    warnings.push(warning('SDE_INVENTORY_NOT_READY', 'Ship/type labels require SDE inventory import'));
  }
  if (!checks.live_api_enabled) {
    warnings.push(warning('LIVE_API_DISABLED', 'Live zKill/ESI actions are disabled until explicitly enabled'));
  }
  if (paths.database_path && !isInsideProject(paths.database_path) && process.env.AURA_ATLAS_ALLOW_EXTERNAL_PATHS !== '1') {
    warnings.push(warning('DB_PATH_OUTSIDE_PROJECT', 'Runtime DB path is outside the project root'));
  }
  if (checks.runtime_paths_valid && !checks.runtime_paths_ready) {
    warnings.push(warning('RUNTIME_PATHS_MISSING', 'Runtime/cache paths are valid but missing; run app.prepare to create them'));
  }
  return warnings;
}

function resolveRuntimePaths(databasePath = null) {
  const tempRoot = process.env.AURA_ATLAS_TEST_TMP || path.join(projectRoot(), '.tmp');
  const cacheDir = process.env.AURA_ATLAS_CACHE_DIR || path.join(tempRoot, 'cache');
  const sdeCacheDir = process.env.AURA_ATLAS_SDE_CACHE_DIR || path.join(tempRoot, 'sde');
  return {
    project_root: path.resolve(projectRoot()),
    database_path: databasePath ? path.resolve(databasePath) : null,
    temp_root: path.resolve(tempRoot),
    cache_dir: path.resolve(cacheDir),
    sde_cache_dir: path.resolve(sdeCacheDir)
  };
}

function inspectRuntimePaths(paths) {
  const entries = [
    inspectPath('project_root', paths.project_root, { required: true, mustExist: true }),
    inspectPath('database_path', paths.database_path, { required: false }),
    inspectPath('temp_root', paths.temp_root, { required: true }),
    inspectPath('cache_dir', paths.cache_dir, { required: true }),
    inspectPath('sde_cache_dir', paths.sde_cache_dir, { required: true })
  ].filter(Boolean);
  const runtimeEntries = entries.filter((entry) => entry.required && entry.key !== 'project_root');
  return {
    valid: entries.every((entry) => entry.valid),
    ready: runtimeEntries.every((entry) => entry.exists && entry.is_directory),
    paths: entries
  };
}

function inspectPath(key, targetPath, options = {}) {
  if (!targetPath) {
    return null;
  }
  const exists = fs.existsSync(targetPath);
  const stat = exists ? fs.statSync(targetPath) : null;
  const isDirectory = Boolean(stat?.isDirectory());
  const isFile = Boolean(stat?.isFile());
  const allowed = key === 'database_path'
    ? (isInsideProject(targetPath) || process.env.AURA_ATLAS_ALLOW_EXTERNAL_PATHS === '1')
    : isInsideProject(targetPath);
  return {
    key,
    path: targetPath,
    required: options.required === true,
    exists,
    is_directory: isDirectory,
    is_file: isFile,
    valid: allowed && (!options.mustExist || exists)
  };
}

function isInsideProject(targetPath) {
  const relative = path.relative(projectRoot(), path.resolve(targetPath));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function tableExists(db, tableName) {
  const row = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type IN ('table', 'view') AND name = ?
  `).get(tableName);
  return Boolean(row);
}

function count(db, tableName) {
  if (!tableExists(db, tableName)) {
    return 0;
  }
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function blocker(code, message) {
  return taxonomyMessage(code, message, { source: 'app.readiness' });
}

function warning(code, message) {
  return taxonomyMessage(code, message, { source: 'app.readiness' });
}

module.exports = {
  buildAppReadiness,
  prepareAppRuntimePaths,
  ensureAppReady
};
