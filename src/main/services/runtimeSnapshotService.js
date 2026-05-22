const fs = require('node:fs');
const path = require('node:path');
const { auraTempRoot, projectRoot } = require('../util/tempPaths');

const SNAPSHOT_DIR_NAME = 'db-snapshots';

function buildRuntimeDbSnapshotPreflight(db, input = {}, context = {}) {
  const databasePath = normalizeDatabasePath(input.databasePath || context.databasePath);
  const destinationPath = normalizeSnapshotDestination(input.destinationPath, databasePath);
  const stats = fileStats(databasePath);

  return {
    action: 'runtime.db_snapshot',
    allowed: true,
    read_only: true,
    database_path: databasePath,
    destination_path: destinationPath,
    destination_exists: fs.existsSync(destinationPath),
    database: {
      exists: stats.exists,
      size_bytes: stats.size_bytes,
      modified_at: stats.modified_at
    },
    journal_files: journalState(databasePath),
    table_counts: tableCounts(db),
    latest_fetch_run: latestFetchRun(db),
    latest_evidence_timestamp: scalar(db, 'SELECT MAX(killmail_time) FROM killmails'),
    assessment_artifacts: assessmentArtifactCounts(db),
    boundary: 'Snapshot preflight is read-only. Create the snapshot through the explicit runtime.db_snapshot.create action.'
  };
}

function createRuntimeDbSnapshot(db, input = {}, context = {}) {
  const preflight = buildRuntimeDbSnapshotPreflight(db, input, context);
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
    table_counts: preflight.table_counts,
    latest_fetch_run: preflight.latest_fetch_run,
    latest_evidence_timestamp: preflight.latest_evidence_timestamp,
    assessment_artifacts: preflight.assessment_artifacts,
    boundary: 'Snapshot creation copied the local SQLite runtime DB only. It did not prune, compact, or delete evidence.'
  };
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
  createRuntimeDbSnapshot
};
