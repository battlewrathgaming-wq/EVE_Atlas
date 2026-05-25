const fs = require('node:fs');
const path = require('node:path');
const { auraTempRoot, projectRoot } = require('../util/tempPaths');
const {
  loadRuntimeSnapshotSettings,
  saveRuntimeSnapshotSettings,
  validateSnapshotDestinationDir
} = require('./runtimeSnapshotSettingsService');

const SNAPSHOT_DIR_NAME = 'db-snapshots';

function buildRuntimeDbSnapshotPreflight(db, input = {}, context = {}) {
  const databasePath = normalizeDatabasePath(input.databasePath || context.databasePath);
  assertNoRendererDestinationPath(input, context);
  const settingsState = loadRuntimeSnapshotSettings({
    settingsPath: runtimeSnapshotSettingsPathForContext(input, context)
  });
  const destination = resolveSnapshotDestination(input, databasePath, settingsState);
  const destinationPath = destination.path;
  const stats = fileStats(databasePath);
  const journals = journalState(databasePath);
  const projectedSnapshotBytes = estimateSnapshotBytes(stats, journals);
  const storage = snapshotStorageStatus(destination.directory, projectedSnapshotBytes, settingsState);
  const blockers = [];
  if (storage.over_budget) {
    blockers.push({
      code: 'SNAPSHOT_BUDGET_EXCEEDED',
      message: 'Projected snapshot/support-artifact usage exceeds the configured budget'
    });
  }

  return {
    action: 'runtime.db_snapshot',
    allowed: blockers.length === 0,
    read_only: true,
    database_path: databasePath,
    destination_path: destinationPath,
    destination: {
      directory: destination.directory,
      source: destination.source,
      fallback_used: destination.source !== 'configured',
      validation: destination.validation
    },
    destination_exists: fs.existsSync(destinationPath),
    database: {
      exists: stats.exists,
      size_bytes: stats.size_bytes,
      modified_at: stats.modified_at
    },
    journal_files: journals,
    projected_snapshot_bytes: projectedSnapshotBytes,
    storage,
    settings: settingsState,
    table_counts: tableCounts(db),
    latest_fetch_run: latestFetchRun(db),
    latest_evidence_timestamp: scalar(db, 'SELECT MAX(killmail_time) FROM killmails'),
    assessment_artifacts: assessmentArtifactCounts(db),
    blockers,
    boundary: 'Snapshot preflight is read-only. Create the snapshot through the explicit runtime.db_snapshot.create action. Snapshots are support/recovery artifacts, not active-state truth, Evidence, Observation, Assessment Memory, pruning, or deletion.'
  };
}

function createRuntimeDbSnapshot(db, input = {}, context = {}) {
  const preflight = buildRuntimeDbSnapshotPreflight(db, input, context);
  if (!preflight.allowed) {
    const error = new Error(preflight.blockers[0]?.message || 'Runtime DB snapshot preflight is blocked');
    error.code = preflight.blockers[0]?.code || 'RUNTIME_DB_SNAPSHOT_BLOCKED';
    error.preflight = preflight;
    throw error;
  }
  if (!preflight.database.exists) {
    throw new Error(`Runtime DB does not exist: ${preflight.database_path}`);
  }
  if (preflight.destination_exists && input.overwrite !== true) {
    throw new Error(`Snapshot destination already exists: ${preflight.destination_path}`);
  }

  assertProjectLocalPath(preflight.destination_path, 'snapshot destination');
  fs.mkdirSync(path.dirname(preflight.destination_path), { recursive: true });
  if (preflight.destination_exists && input.overwrite === true) {
    fs.unlinkSync(preflight.destination_path);
  }

  db.exec('PRAGMA wal_checkpoint(FULL);');
  db.exec(`VACUUM INTO ${sqlString(preflight.destination_path)};`);

  const snapshotStats = fileStats(preflight.destination_path);
  return {
    action: preflight.action,
    status: 'created',
    created_at: new Date().toISOString(),
    database_path: preflight.database_path,
    snapshot_path: preflight.destination_path,
    snapshot: snapshotStats,
    storage: snapshotStorageStatus(preflight.destination.directory, snapshotStats.size_bytes, preflight.settings),
    table_counts: preflight.table_counts,
    latest_fetch_run: preflight.latest_fetch_run,
    latest_evidence_timestamp: preflight.latest_evidence_timestamp,
    assessment_artifacts: preflight.assessment_artifacts,
    boundary: 'Snapshot creation copied the local SQLite runtime DB only. It did not prune, compact, or delete evidence.'
  };
}

function assertNoRendererDestinationPath(input, context) {
  if (context.source === 'renderer' && input.destinationPath) {
    const error = new Error('Renderer snapshot requests must use backend-generated filenames from validated snapshot settings');
    error.code = 'SNAPSHOT_DESTINATION_RENDERER_FORBIDDEN';
    throw error;
  }
}

function runtimeSnapshotSettingsPathForContext(input = {}, context = {}) {
  if (context.runtimeSnapshotSettingsPath) {
    return context.runtimeSnapshotSettingsPath;
  }
  if (context.source === 'renderer') {
    return null;
  }
  return input.settingsPath || input.runtimeSnapshotSettingsPath || null;
}

function normalizeDatabasePath(databasePath) {
  if (!databasePath || databasePath === ':memory:') {
    throw new Error('Runtime DB snapshot requires a file-backed database path');
  }
  return path.resolve(databasePath);
}

function normalizeSnapshotDestination(destinationPath, databasePath) {
  if (destinationPath) {
    const resolved = path.resolve(destinationPath);
    assertProjectLocalPath(resolved, 'snapshot destination');
    return resolved;
  }
  const safeBaseName = path.basename(databasePath).replace(/[^a-z0-9_.-]/gi, '_');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(auraTempRoot(), SNAPSHOT_DIR_NAME);
  return path.join(outputDir, `${safeBaseName}.${stamp}.snapshot.sqlite`);
}

function resolveSnapshotDestination(input, databasePath, settingsState) {
  if (input.destinationPath) {
    const explicitPath = normalizeSnapshotDestination(input.destinationPath, databasePath);
    return {
      path: explicitPath,
      directory: path.dirname(explicitPath),
      source: 'explicit_request',
      validation: {
        valid: true,
        issues: []
      }
    };
  }

  const configuredDir = settingsState.effective.snapshot_destination_dir;
  const directory = configuredDir || path.join(auraTempRoot(), SNAPSHOT_DIR_NAME);
  const validation = configuredDir
    ? validateSnapshotDestinationDir(configuredDir)
    : {
      valid: true,
      path: directory,
      exists: fs.existsSync(directory),
      issues: []
    };
  return {
    path: generatedSnapshotPath(databasePath, directory),
    directory,
    source: configuredDir ? 'configured' : 'fallback',
    validation
  };
}

function generatedSnapshotPath(databasePath, outputDir) {
  const safeBaseName = path.basename(databasePath).replace(/[^a-z0-9_.-]/gi, '_');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(outputDir, `${safeBaseName}.${stamp}.snapshot.sqlite`);
}

function estimateSnapshotBytes(databaseStats, journals) {
  return databaseStats.size_bytes + journals.wal.size_bytes + journals.shm.size_bytes;
}

function snapshotStorageStatus(directory, projectedSnapshotBytes, settingsState) {
  const budgetBytes = settingsState.effective.snapshot_budget_bytes;
  const currentUsageBytes = directoryUsageBytes(directory);
  const projectedUsageBytes = currentUsageBytes + projectedSnapshotBytes;
  const remainingAfterProjectedBytes = budgetBytes === null ? null : budgetBytes - projectedUsageBytes;
  return {
    classification: 'snapshot/support-artifact storage budget; not Evidence, deletion, restore, or cleanup',
    directory,
    current_usage_bytes: currentUsageBytes,
    projected_snapshot_bytes: projectedSnapshotBytes,
    projected_usage_bytes: projectedUsageBytes,
    budget_bytes: budgetBytes,
    budget_configured: budgetBytes !== null,
    remaining_after_projected_bytes: remainingAfterProjectedBytes,
    over_budget: budgetBytes !== null && projectedUsageBytes > budgetBytes,
    action: budgetBytes !== null && projectedUsageBytes > budgetBytes ? 'block_create' : 'allow_create',
    automatic_cleanup: false
  };
}

function directoryUsageBytes(directory) {
  if (!directory || !fs.existsSync(directory)) {
    return 0;
  }
  const stats = fs.statSync(directory);
  if (!stats.isDirectory()) {
    return stats.size;
  }
  return fs.readdirSync(directory).reduce((total, name) => {
    const child = path.join(directory, name);
    const childStats = fs.statSync(child);
    if (childStats.isDirectory()) {
      return total + directoryUsageBytes(child);
    }
    return total + childStats.size;
  }, 0);
}

function assertProjectLocalPath(targetPath, label) {
  const allowExternal = process.env.AURA_ATLAS_ALLOW_EXTERNAL_PATHS === '1';
  const resolvedTarget = path.resolve(targetPath);
  const resolvedProject = projectRoot();
  const relative = path.relative(resolvedProject, resolvedTarget);
  const isInsideProject = relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  if (!isInsideProject && !allowExternal) {
    throw new Error(`${label} must stay under ${resolvedProject}; set AURA_ATLAS_ALLOW_EXTERNAL_PATHS=1 to override`);
  }
}

function fileStats(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      exists: false,
      size_bytes: 0,
      modified_at: null
    };
  }
  const stats = fs.statSync(filePath);
  return {
    exists: true,
    size_bytes: stats.size,
    modified_at: stats.mtime.toISOString()
  };
}

function journalState(databasePath) {
  return {
    wal: fileStats(`${databasePath}-wal`),
    shm: fileStats(`${databasePath}-shm`)
  };
}

function tableCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    metadata_runs: count(db, 'metadata_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    ingestion_audits: count(db, 'ingestion_audits'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    entities: count(db, 'entities'),
    type_metadata: count(db, 'type_metadata'),
    solar_systems: count(db, 'solar_systems'),
    system_watches: count(db, 'system_watches'),
    watchlist_entities: count(db, 'watchlist_entities')
  };
}

function latestFetchRun(db) {
  return db.prepare(`
    SELECT run_id, watch_type, status, started_at, finished_at,
           discovered_refs, expanded_new, activity_events_written
    FROM fetch_runs
    ORDER BY started_at DESC
    LIMIT 1
  `).get() || null;
}

function assessmentArtifactCounts(db) {
  return db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM assessment_artifacts
    GROUP BY status
    ORDER BY status
  `).all();
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function scalar(db, sql) {
  const row = db.prepare(sql).get();
  if (!row) {
    return null;
  }
  return Object.values(row)[0];
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

module.exports = {
  buildRuntimeDbSnapshotPreflight,
  createRuntimeDbSnapshot,
  loadRuntimeSnapshotSettings,
  saveRuntimeSnapshotSettings
};
