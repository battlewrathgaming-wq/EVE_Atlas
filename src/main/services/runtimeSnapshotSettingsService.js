const fs = require('node:fs');
const path = require('node:path');
const { auraTempRoot, projectRoot } = require('../util/tempPaths');

const SETTINGS_VERSION = 1;
const DEFAULT_SETTINGS = Object.freeze({
  version: SETTINGS_VERSION,
  snapshot_destination_dir: null,
  snapshot_budget_bytes: null
});

function loadRuntimeSnapshotSettings(options = {}) {
  const filePath = runtimeSnapshotSettingsPath(options);
  const raw = readSettingsFile(filePath);
  const normalized = normalizeSettings(raw.value || {});
  const validation = validateRuntimeSnapshotSettings(normalized);

  return {
    settings_path: filePath,
    exists: raw.exists,
    status: validation.valid ? 'ready' : 'degraded',
    settings: normalized,
    validation,
    effective: effectiveSnapshotSettings(normalized, validation)
  };
}

function saveRuntimeSnapshotSettings(input = {}, options = {}) {
  const allowInputSettingsPath = options.allowInputSettingsPath !== false;
  const filePath = runtimeSnapshotSettingsPath({
    ...options,
    settingsPath: options.settingsPath || (allowInputSettingsPath ? input.settingsPath || input.runtimeSnapshotSettingsPath : null)
  });
  const next = normalizeSettings({
    version: SETTINGS_VERSION,
    snapshot_destination_dir: input.snapshotDestinationDir ?? input.snapshot_destination_dir ?? null,
    snapshot_budget_bytes: input.snapshotBudgetBytes ?? input.snapshot_budget_bytes ?? null
  });
  const validation = validateRuntimeSnapshotSettings(next);
  if (!validation.valid) {
    const error = new Error('Runtime snapshot settings are invalid');
    error.code = 'RUNTIME_SNAPSHOT_SETTINGS_INVALID';
    error.validation = validation;
    throw error;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`);
  return loadRuntimeSnapshotSettings({ ...options, settingsPath: filePath });
}

function runtimeSnapshotSettingsPath(options = {}) {
  if (options.settingsPath || options.runtimeSnapshotSettingsPath) {
    return path.resolve(options.settingsPath || options.runtimeSnapshotSettingsPath);
  }
  if (process.env.AURA_ATLAS_RUNTIME_SNAPSHOT_SETTINGS_PATH) {
    return path.resolve(process.env.AURA_ATLAS_RUNTIME_SNAPSHOT_SETTINGS_PATH);
  }
  if (process.env.AURA_ATLAS_DB_PATH) {
    return path.join(path.dirname(path.resolve(process.env.AURA_ATLAS_DB_PATH)), 'aura-atlas-runtime-snapshot-settings.json');
  }
  return path.join(auraTempRoot(), 'aura-atlas-runtime-snapshot-settings.json');
}

function readSettingsFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      exists: false,
      value: { ...DEFAULT_SETTINGS }
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
        ...DEFAULT_SETTINGS,
        invalid_reason: `settings JSON could not be parsed: ${error.message}`
      }
    };
  }
}

function normalizeSettings(value = {}) {
  const destination = value.snapshotDestinationDir ?? value.snapshot_destination_dir ?? null;
  const budget = value.snapshotBudgetBytes ?? value.snapshot_budget_bytes ?? null;
  return {
    version: Number(value.version || SETTINGS_VERSION),
    snapshot_destination_dir: destination ? path.resolve(String(destination)) : null,
    snapshot_budget_bytes: budget === null || budget === undefined || budget === '' ? null : Number(budget),
    invalid_reason: value.invalid_reason || null
  };
}

function validateRuntimeSnapshotSettings(settings = {}) {
  const issues = [];
  const destination = settings.snapshot_destination_dir;
  if (settings.invalid_reason) {
    issues.push({
      code: 'SETTINGS_PARSE_FAILED',
      message: settings.invalid_reason
    });
  }
  if (settings.version !== SETTINGS_VERSION) {
    issues.push({
      code: 'SETTINGS_VERSION_UNSUPPORTED',
      message: `Runtime snapshot settings version must be ${SETTINGS_VERSION}`
    });
  }
  if (destination) {
    const destinationValidation = validateSnapshotDestinationDir(destination);
    if (!destinationValidation.valid) {
      issues.push(...destinationValidation.issues);
    }
  }
  if (settings.snapshot_budget_bytes !== null) {
    if (!Number.isSafeInteger(settings.snapshot_budget_bytes) || settings.snapshot_budget_bytes <= 0) {
      issues.push({
        code: 'SNAPSHOT_BUDGET_INVALID',
        message: 'Snapshot/support-artifact budget must be a positive integer byte count'
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    destination: destination ? validateSnapshotDestinationDir(destination) : null,
    budget: {
      configured: settings.snapshot_budget_bytes !== null,
      bytes: settings.snapshot_budget_bytes
    }
  };
}

function validateSnapshotDestinationDir(destinationDir) {
  const resolved = path.resolve(destinationDir || '');
  const issues = [];
  let realPath = null;
  if (!isInsideProject(resolved) && process.env.AURA_ATLAS_ALLOW_EXTERNAL_PATHS !== '1') {
    issues.push({
      code: 'SNAPSHOT_DESTINATION_OUTSIDE_PROJECT',
      message: `Snapshot destination must stay under ${projectRoot()}`
    });
  }
  if (!fs.existsSync(resolved)) {
    issues.push({
      code: 'SNAPSHOT_DESTINATION_MISSING',
      message: 'Snapshot destination directory does not exist'
    });
  } else if (!fs.statSync(resolved).isDirectory()) {
    issues.push({
      code: 'SNAPSHOT_DESTINATION_NOT_DIRECTORY',
      message: 'Snapshot destination must be a directory'
    });
  } else {
    realPath = fs.realpathSync.native(resolved);
    if (!isInsideProject(realPath) && process.env.AURA_ATLAS_ALLOW_EXTERNAL_PATHS !== '1') {
      issues.push({
        code: 'SNAPSHOT_DESTINATION_REALPATH_OUTSIDE_PROJECT',
        message: `Snapshot destination real path must stay under ${projectRoot()}`
      });
    }
  }

  return {
    valid: issues.length === 0,
    path: resolved,
    real_path: realPath,
    exists: fs.existsSync(resolved),
    issues
  };
}

function effectiveSnapshotSettings(settings, validation) {
  const destinationValid = Boolean(validation.destination?.valid);
  return {
    snapshot_destination_dir: destinationValid ? settings.snapshot_destination_dir : null,
    snapshot_budget_bytes: validation.budget.configured && validation.budget.bytes > 0
      ? validation.budget.bytes
      : null,
    destination_source: destinationValid ? 'configured' : 'fallback',
    budget_source: validation.budget.configured && validation.budget.bytes > 0 ? 'configured' : 'unconfigured'
  };
}

function isInsideProject(targetPath) {
  const relative = path.relative(projectRoot(), path.resolve(targetPath));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

module.exports = {
  SETTINGS_VERSION,
  loadRuntimeSnapshotSettings,
  saveRuntimeSnapshotSettings,
  validateRuntimeSnapshotSettings,
  validateSnapshotDestinationDir,
  runtimeSnapshotSettingsPath
};
