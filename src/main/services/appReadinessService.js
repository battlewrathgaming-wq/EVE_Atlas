const fs = require('node:fs');
const path = require('node:path');
const { USER_AGENT } = require('../../shared/constants');
const { auraTempRoot, projectRoot } = require('../util/tempPaths');

function buildAppReadiness(db, options = {}) {
  const databasePath = options.databasePath || process.env.AURA_ATLAS_DB_PATH || null;
  const tempRoot = process.env.AURA_ATLAS_TEST_TMP || path.join(projectRoot(), '.tmp');
  const cacheDir = process.env.AURA_ATLAS_CACHE_DIR || path.join(tempRoot, 'cache');
  const sdeCacheDir = process.env.AURA_ATLAS_SDE_CACHE_DIR || path.join(tempRoot, 'sde');
  const topology = latestRow(db, 'sde_imports');
  const inventory = latestRow(db, 'sde_inventory_imports');
  const counts = lookupCounts(db);
  const paths = {
    project_root: path.resolve(projectRoot()),
    database_path: databasePath ? path.resolve(databasePath) : null,
    temp_root: path.resolve(tempRoot),
    cache_dir: path.resolve(cacheDir),
    sde_cache_dir: path.resolve(sdeCacheDir)
  };
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
    runtime_paths_valid: runtimePathsValid(paths),
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
  return warnings;
}

function runtimePathsValid(paths) {
  const required = [paths.temp_root, paths.cache_dir, paths.sde_cache_dir].filter(Boolean);
  return required.every((target) => {
    try {
      fs.mkdirSync(target, { recursive: true });
      return fs.existsSync(target);
    } catch {
      return false;
    }
  });
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
  return { severity: 'blocked', code, message };
}

function warning(code, message) {
  return { severity: 'warning', code, message };
}

module.exports = {
  buildAppReadiness,
  ensureAppReady
};
