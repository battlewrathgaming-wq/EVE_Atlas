const {
  USER_SCOPE_DEFAULTS,
  normalizeActorWatchScope,
  normalizeManualDiscoveryScope,
  normalizeManualExpansionScope,
  normalizeSystemRadiusWatchScope
} = require('../scopes/scopeControls');
const { resolveSystemIdentity } = require('../resolution/systemResolver');

function getScopeDefaults() {
  return JSON.parse(JSON.stringify(USER_SCOPE_DEFAULTS));
}

function validateScope(payload = {}, context = {}) {
  const kind = String(payload.kind || '').toLowerCase();
  const input = payload.input || {};

  if (kind === 'manual_discovery') {
    return scopeResult(kind, normalizeManualDiscoveryScope(resolveSystemScopeInput(input, context)));
  }
  if (kind === 'manual_expansion') {
    return scopeResult(kind, normalizeManualExpansionScope(input));
  }
  if (kind === 'actor_watch') {
    return scopeResult(kind, normalizeActorWatchScope(input));
  }
  if (kind === 'system_radius_watch') {
    return scopeResult(kind, normalizeSystemRadiusWatchScope(resolveSystemScopeInput(input, context)));
  }

  const error = new Error('Scope kind must be manual_discovery, manual_expansion, actor_watch, or system_radius_watch');
  error.code = 'INVALID_SCOPE_KIND';
  throw error;
}

function resolveSystemScopeInput(input, context = {}) {
  const scope = String(input.scope || '').toLowerCase();
  const needsSystem = scope === 'system' || scope === 'radius' || input.centerSystemName || input.systemName;
  if (!needsSystem || input.centerSystemId || !context.db) {
    return input;
  }
  const systemName = input.centerSystemName || input.systemName;
  if (!systemName) {
    return input;
  }
  const system = resolveSystemIdentity(context.db, { systemName });
  return {
    ...input,
    centerSystemId: system.solar_system_id,
    centerSystemName: system.solar_system_name
  };
}

function scopeResult(kind, normalized) {
  return {
    kind,
    valid: true,
    normalized
  };
}

module.exports = {
  getScopeDefaults,
  validateScope
};
