const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_STATE = {
  alwaysOnTop: false
};

function loadWindowState(app, options = {}) {
  const filePath = windowStatePath(app, options);
  try {
    if (!fs.existsSync(filePath)) {
      return { ...DEFAULT_STATE };
    }
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return normalizeWindowState(parsed);
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveWindowState(app, state, options = {}) {
  const filePath = windowStatePath(app, options);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const normalized = normalizeWindowState(state);
  fs.writeFileSync(filePath, `${JSON.stringify(normalized, null, 2)}\n`);
  return normalized;
}

function windowStatePath(app, options = {}) {
  if (options.settingsPath) {
    return path.resolve(options.settingsPath);
  }
  if (process.env.AURA_ATLAS_SETTINGS_PATH) {
    return path.resolve(process.env.AURA_ATLAS_SETTINGS_PATH);
  }
  if (process.env.AURA_ATLAS_DB_PATH) {
    return path.join(path.dirname(path.resolve(process.env.AURA_ATLAS_DB_PATH)), 'aura-atlas-window-state.json');
  }
  return path.join(app.getPath('userData'), 'aura-atlas-window-state.json');
}

function normalizeWindowState(state = {}) {
  return {
    alwaysOnTop: state.alwaysOnTop === true
  };
}

module.exports = {
  DEFAULT_STATE,
  loadWindowState,
  saveWindowState,
  windowStatePath
};
