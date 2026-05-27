const fs = require('node:fs');
const path = require('node:path');
const { projectRoot } = require('../util/tempPaths');
const {
  validateRuntimeSnapshotSettings,
  validateSnapshotDestinationDir
} = require('./runtimeSnapshotSettingsService');
const { windowStatePath } = require('../windowState');

const SNAPSHOT_SETTINGS_VERSION = 1;

function buildStorageAuthorityPreflight(input = {}, context = {}) {
  const root = path.resolve(projectRoot());
  const pathInput = context.allowStorageAuthorityPathOverrides === true ? input : {};
  const databasePath = resolveDatabasePath(pathInput, context);
  const envDbPath = process.env.AURA_ATLAS_DB_PATH || null;
  const tempRoot = readOnlyTempRoot(root);
  const cacheDir = path.resolve(process.env.AURA_ATLAS_CACHE_DIR || path.join(tempRoot, 'cache'));
  const sdeCacheDir = path.resolve(process.env.AURA_ATLAS_SDE_CACHE_DIR || path.join(tempRoot, 'sde'));
  const snapshot = inspectSnapshot(pathInput, databasePath, tempRoot);
  const tracePack = inspectTracePack(pathInput, tempRoot);
  const windowSettings = inspectWindowSettings(pathInput, context);
  const database = inspectDatabase(databasePath, envDbPath, root);
  const supportPaths = [
    inspectControlledPath('temp_root', tempRoot, root),
    inspectControlledPath('cache_dir', cacheDir, root),
    inspectControlledPath('sde_cache_dir', sdeCacheDir, root),
    inspectControlledPath('snapshot_settings', snapshot.settings.path, root, { usage: false }),
    inspectControlledPath('snapshot_destination', snapshot.destination.path, root),
    inspectControlledPath('trace_pack_output', tracePack.output.path, root),
    windowSettings.path
      ? inspectControlledPath('window_settings', windowSettings.path, root, { usage: false })
      : null
  ].filter(Boolean);

  return {
    action: 'storage.authority_preflight',
    classification: 'read-only storage authority inventory',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    project_root: root,
    database,
    snapshot,
    trace_pack: tracePack,
    paths: {
      temp_root: supportPaths.find((entry) => entry.key === 'temp_root'),
      cache_dir: supportPaths.find((entry) => entry.key === 'cache_dir'),
      sde_cache_dir: supportPaths.find((entry) => entry.key === 'sde_cache_dir'),
      window_settings: windowSettings
    },
    byte_usage: {
      database_bytes: database.total_bytes,
      known_controlled_locations_bytes: sumUsage(supportPaths),
      locations: supportPaths
    },
    boundary: [
      'Read-only inventory only; it does not write storage config.',
      'It does not move, copy, relocate, create, or delete the active DB.',
      'It does not enforce lockout, prune, call live providers, change schema, redesign renderer UI, or perform storage migration.'
    ]
  };
}

function resolveDatabasePath(input = {}, context = {}) {
  const candidate = input.databasePath || input.database_path || context.databasePath || process.env.AURA_ATLAS_DB_PATH || null;
  if (!candidate || candidate === ':memory:') {
    return null;
  }
  return path.resolve(candidate);
}

function inspectDatabase(databasePath, envDbPath, root) {
  const parentPath = databasePath ? path.dirname(databasePath) : null;
  const dbStats = fileStats(databasePath);
  const walStats = fileStats(databasePath ? `${databasePath}-wal` : null);
  const shmStats = fileStats(databasePath ? `${databasePath}-shm` : null);
  const flags = {
    configured: Boolean(envDbPath),
    fallback: !envDbPath,
    missing: !dbStats.exists,
    outside_policy: Boolean(databasePath) && !isInsideProject(databasePath, root) && process.env.AURA_ATLAS_ALLOW_EXTERNAL_PATHS !== '1',
    demo_fixture: looksDemoFixture(databasePath)
  };

  return {
    path: databasePath,
    source: flags.configured ? 'configured' : 'fallback',
    mode: databaseMode(flags),
    mode_flags: flags,
    policy: {
      project_local: Boolean(databasePath) && isInsideProject(databasePath, root),
      allow_external_paths: process.env.AURA_ATLAS_ALLOW_EXTERNAL_PATHS === '1',
      outside_policy: flags.outside_policy
    },
    parent: {
      path: parentPath,
      exists: parentPath ? fs.existsSync(parentPath) : false,
      is_directory: parentPath && fs.existsSync(parentPath) ? fs.statSync(parentPath).isDirectory() : false
    },
    exists: dbStats.exists,
    size_bytes: dbStats.size_bytes,
    modified_at: dbStats.modified_at,
    wal: {
      path: databasePath ? `${databasePath}-wal` : null,
      ...walStats
    },
    shm: {
      path: databasePath ? `${databasePath}-shm` : null,
      ...shmStats
    },
    total_bytes: dbStats.size_bytes + walStats.size_bytes + shmStats.size_bytes
  };
}

function databaseMode(flags) {
  if (flags.missing) {
    return 'missing';
  }
  if (flags.outside_policy) {
    return 'outside_policy';
  }
  if (flags.demo_fixture && !flags.configured && !flags.fallback) {
    return 'demo_fixture';
  }
  return flags.configured ? 'configured' : 'fallback';
}

function inspectSnapshot(input, databasePath, tempRoot) {
  const settingsPath = snapshotSettingsPathReadOnly(input, databasePath, tempRoot);
  const settingsFile = readSettingsFile(settingsPath);
  const settings = normalizeSettings(settingsFile.value);
  const validation = validateRuntimeSnapshotSettings(settings);
  const destinationDir = validation.destination?.valid
    ? settings.snapshot_destination_dir
    : path.join(tempRoot, 'db-snapshots');
  const destinationValidation = settings.snapshot_destination_dir
    ? validateSnapshotDestinationDir(settings.snapshot_destination_dir)
    : {
      valid: true,
      path: destinationDir,
      real_path: fs.existsSync(destinationDir) ? safeRealPath(destinationDir) : null,
      exists: fs.existsSync(destinationDir),
      issues: []
    };

  return {
    settings: {
      path: settingsPath,
      exists: settingsFile.exists,
      status: validation.valid ? 'ready' : 'degraded',
      configured_destination: settings.snapshot_destination_dir,
      configured_budget_bytes: settings.snapshot_budget_bytes,
      validation
    },
    destination: {
      path: path.resolve(destinationDir),
      source: validation.destination?.valid ? 'configured' : 'fallback',
      exists: fs.existsSync(destinationDir),
      status: destinationStatus(destinationValidation),
      validation: destinationValidation,
      usage_bytes: directoryUsageBytes(destinationDir)
    }
  };
}

function snapshotSettingsPathReadOnly(input = {}, databasePath, tempRoot) {
  const explicit = input.settingsPath || input.runtimeSnapshotSettingsPath || input.snapshotSettingsPath;
  if (explicit) {
    return path.resolve(explicit);
  }
  if (process.env.AURA_ATLAS_RUNTIME_SNAPSHOT_SETTINGS_PATH) {
    return path.resolve(process.env.AURA_ATLAS_RUNTIME_SNAPSHOT_SETTINGS_PATH);
  }
  if (process.env.AURA_ATLAS_DB_PATH) {
    return path.join(path.dirname(path.resolve(process.env.AURA_ATLAS_DB_PATH)), 'aura-atlas-runtime-snapshot-settings.json');
  }
  if (databasePath && process.env.AURA_ATLAS_STORAGE_PREFLIGHT_FALLBACK_SETTINGS_WITH_DB === '1') {
    return path.join(path.dirname(databasePath), 'aura-atlas-runtime-snapshot-settings.json');
  }
  return path.join(tempRoot, 'aura-atlas-runtime-snapshot-settings.json');
}

function inspectTracePack(input, tempRoot) {
  const outputDir = path.resolve(input.tracePackOutputDir || input.trace_pack_output_dir || input.outputDir || path.join(tempRoot, 'operator-debug-trace-packs'));
  return {
    output: {
      path: outputDir,
      source: input.tracePackOutputDir || input.trace_pack_output_dir || input.outputDir ? 'configured_request' : 'default',
      exists: fs.existsSync(outputDir),
      status: fs.existsSync(outputDir) ? 'present' : 'missing',
      usage_bytes: directoryUsageBytes(outputDir)
    },
    default_output_path: path.join(tempRoot, 'operator-debug-trace-packs')
  };
}

function inspectWindowSettings(input = {}, context = {}) {
  if (input.windowSettingsPath || input.settingsPath || context.windowSettingsPath) {
    const filePath = path.resolve(input.windowSettingsPath || input.settingsPath || context.windowSettingsPath);
    return {
      path: filePath,
      source: 'explicit',
      exposed: true,
      exists: fs.existsSync(filePath),
      size_bytes: fileStats(filePath).size_bytes
    };
  }
  if (process.env.AURA_ATLAS_SETTINGS_PATH || process.env.AURA_ATLAS_DB_PATH) {
    const filePath = windowStatePath(null);
    return {
      path: filePath,
      source: process.env.AURA_ATLAS_SETTINGS_PATH ? 'configured' : 'db_colocated',
      exposed: true,
      exists: fs.existsSync(filePath),
      size_bytes: fileStats(filePath).size_bytes
    };
  }
  return {
    path: null,
    source: 'electron_userData',
    exposed: false,
    exists: false,
    size_bytes: 0,
    note: 'windowStatePath needs Electron app.getPath when no explicit settings or DB path is configured'
  };
}

function inspectControlledPath(key, targetPath, root, options = {}) {
  const stats = pathStats(targetPath);
  return {
    key,
    path: targetPath ? path.resolve(targetPath) : null,
    exists: stats.exists,
    is_directory: stats.is_directory,
    is_file: stats.is_file,
    usage_bytes: options.usage === false ? stats.size_bytes : usageBytes(targetPath),
    posture: classifyPathPosture(targetPath, root)
  };
}

function classifyPathPosture(targetPath, root) {
  if (!targetPath) {
    return ['missing-path'];
  }
  const resolved = path.resolve(targetPath);
  const lower = resolved.toLowerCase();
  const posture = [];
  posture.push(isInsideProject(resolved, root) ? 'project-local' : 'outside-project');
  if (isInsideProject(resolved, path.join(root, '.tmp'))) {
    posture.push('dev-temp');
  }
  if (lower.includes('demo') || lower.includes('fixture') || lower.includes('smoke')) {
    posture.push('demo-fixture');
  }
  if (!posture.includes('dev-temp') && !posture.includes('demo-fixture')) {
    posture.push('runtime');
  }
  return posture;
}

function readOnlyTempRoot(root) {
  return path.resolve(process.env.AURA_ATLAS_TEST_TMP || path.join(root, '.tmp'));
}

function readSettingsFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      exists: false,
      value: {
        version: SNAPSHOT_SETTINGS_VERSION,
        snapshot_destination_dir: null,
        snapshot_budget_bytes: null
      }
    };
  }
  try {
    return {
      exists: true,
      value: JSON.parse(fs.readFileSync(filePath, 'utf8'))
    };
  } catch (error) {
    return {
      exists: true,
      value: {
        version: SNAPSHOT_SETTINGS_VERSION,
        snapshot_destination_dir: null,
        snapshot_budget_bytes: null,
        invalid_reason: `settings JSON could not be parsed: ${error.message}`
      }
    };
  }
}

function normalizeSettings(value = {}) {
  const destination = value.snapshotDestinationDir ?? value.snapshot_destination_dir ?? null;
  const budget = value.snapshotBudgetBytes ?? value.snapshot_budget_bytes ?? null;
  return {
    version: Number(value.version || SNAPSHOT_SETTINGS_VERSION),
    snapshot_destination_dir: destination ? path.resolve(String(destination)) : null,
    snapshot_budget_bytes: budget === null || budget === undefined || budget === '' ? null : Number(budget),
    invalid_reason: value.invalid_reason || null
  };
}

function destinationStatus(validation) {
  if (!validation.exists) {
    return 'missing';
  }
  if (!validation.valid) {
    return 'degraded';
  }
  return 'present';
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

function pathStats(targetPath) {
  if (!targetPath || !fs.existsSync(targetPath)) {
    return {
      exists: false,
      is_directory: false,
      is_file: false,
      size_bytes: 0
    };
  }
  const stats = fs.statSync(targetPath);
  return {
    exists: true,
    is_directory: stats.isDirectory(),
    is_file: stats.isFile(),
    size_bytes: stats.size
  };
}

function usageBytes(targetPath) {
  if (!targetPath || !fs.existsSync(targetPath)) {
    return 0;
  }
  const stats = fs.statSync(targetPath);
  if (stats.isDirectory()) {
    return directoryUsageBytes(targetPath);
  }
  return stats.size;
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

function sumUsage(entries) {
  return entries.reduce((total, entry) => total + (entry.usage_bytes || 0), 0);
}

function looksDemoFixture(targetPath) {
  if (!targetPath) {
    return false;
  }
  const lower = path.resolve(targetPath).toLowerCase();
  return lower.includes('demo') || lower.includes('fixture') || lower.includes('smoke') || lower.includes('.tmp');
}

function isInsideProject(targetPath, root) {
  if (!targetPath) {
    return false;
  }
  const relative = path.relative(path.resolve(root), path.resolve(targetPath));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function safeRealPath(targetPath) {
  try {
    return fs.realpathSync.native(targetPath);
  } catch {
    return null;
  }
}

module.exports = {
  buildStorageAuthorityPreflight
};
