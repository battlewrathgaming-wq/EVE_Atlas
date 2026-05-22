const {
  USER_SCOPE_DEFAULTS,
  normalizeActorWatchScope,
  normalizeManualDiscoveryScope,
  normalizeManualExpansionScope,
  normalizeSystemRadiusWatchScope
} = require('../scopes/scopeControls');

function getScopeDefaults() {
  return JSON.parse(JSON.stringify(USER_SCOPE_DEFAULTS));
}

function validateScope(payload = {}) {
  const kind = String(payload.kind || '').toLowerCase();
  const input = payload.input || {};

  if (kind === 'manual_discovery') {
    return scopeResult(kind, normalizeManualDiscoveryScope(input));
  }
  if (kind === 'manual_expansion') {
    return scopeResult(kind, normalizeManualExpansionScope(input));
  }
  if (kind === 'actor_watch') {
    return scopeResult(kind, normalizeActorWatchScope(input));
  }
  if (kind === 'system_radius_watch') {
    return scopeResult(kind, normalizeSystemRadiusWatchScope(input));
  }

  const error = new Error('Scope kind must be manual_discovery, manual_expansion, actor_watch, or system_radius_watch');
  error.code = 'INVALID_SCOPE_KIND';
  throw error;
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
