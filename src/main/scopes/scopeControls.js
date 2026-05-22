const USER_SCOPE_DEFAULTS = {
  manualActorDiscovery: {
    lookbackSeconds: 604800,
    maxRefs: 20
  },
  manualSystemDiscovery: {
    lookbackSeconds: 86400,
    radiusJumps: 0,
    maxSystems: 1,
    maxRefsPerSystem: 20
  },
  manualRadiusDiscovery: {
    lookbackSeconds: 86400,
    radiusJumps: 1,
    maxSystems: 10,
    maxRefsPerSystem: 10,
    maxRadius: 5,
    maxTopologySystems: 100
  },
  manualExpansion: {
    maxExpansions: 2
  },
  actorWatch: {
    lookbackSeconds: 2592000,
    maxRefs: 20,
    maxExpansions: 2
  },
  systemRadiusWatch: {
    lookbackSeconds: 86400,
    radiusJumps: 1,
    maxSystems: 10,
    maxRefsPerSystem: 10,
    maxExpansions: 2,
    maxRadius: 5,
    maxTopologySystems: 100
  }
};

const VALID_ACTOR_TYPES = new Set(['character', 'corporation', 'alliance']);
const VALID_MANUAL_SCOPES = new Set(['actor', 'system', 'radius']);

function normalizeManualDiscoveryScope(input) {
  const scope = String(input?.scope || '').toLowerCase();
  if (!VALID_MANUAL_SCOPES.has(scope)) {
    throw new Error('Manual discovery scope must be actor, system, or radius');
  }

  if (scope === 'actor') {
    const defaults = USER_SCOPE_DEFAULTS.manualActorDiscovery;
    return {
      scope,
      trigger: input.trigger || null,
      entityType: normalizeActorType(input.entityType),
      entityId: optionalPositiveInteger(input.entityId, 'entityId'),
      entityName: input.entityName || null,
      lookbackSeconds: positiveInteger(input.lookbackSeconds ?? defaults.lookbackSeconds, 'lookbackSeconds'),
      maxRefs: positiveInteger(input.maxRefs ?? defaults.maxRefs, 'maxRefs')
    };
  }

  const defaults = scope === 'system'
    ? USER_SCOPE_DEFAULTS.manualSystemDiscovery
    : USER_SCOPE_DEFAULTS.manualRadiusDiscovery;
  return {
    scope,
    trigger: input.trigger || null,
    centerSystemId: positiveInteger(input.centerSystemId, 'centerSystemId'),
    lookbackSeconds: positiveInteger(input.lookbackSeconds ?? defaults.lookbackSeconds, 'lookbackSeconds'),
    radiusJumps: scope === 'system'
      ? 0
      : nonNegativeInteger(input.radiusJumps ?? defaults.radiusJumps, 'radiusJumps'),
    maxSystems: positiveInteger(input.maxSystems ?? defaults.maxSystems, 'maxSystems'),
    maxRefsPerSystem: positiveInteger(input.maxRefsPerSystem ?? defaults.maxRefsPerSystem, 'maxRefsPerSystem'),
    maxRadius: positiveInteger(input.maxRadius ?? defaults.maxRadius ?? 5, 'maxRadius'),
    maxTopologySystems: positiveInteger(input.maxTopologySystems ?? defaults.maxTopologySystems ?? 100, 'maxTopologySystems')
  };
}

function normalizeManualExpansionScope(input) {
  const killmailIds = (input.killmailIds || []).map((id) => positiveInteger(id, 'killmailIds'));
  const discoveredByType = input.discoveredByType || null;
  const discoveredById = input.discoveredById !== undefined && input.discoveredById !== null
    ? String(input.discoveredById)
    : null;
  if ((!discoveredByType || !discoveredById) && !killmailIds.length) {
    throw new Error('Manual expansion requires a discovery scope or selected killmail IDs');
  }

  return {
    discoveredByType,
    discoveredById,
    trigger: input.trigger || null,
    killmailIds,
    maxExpansions: positiveInteger(input.maxExpansions ?? USER_SCOPE_DEFAULTS.manualExpansion.maxExpansions, 'maxExpansions')
  };
}

function normalizeActorWatchScope(input) {
  const defaults = USER_SCOPE_DEFAULTS.actorWatch;
  return {
    entityType: normalizeActorType(input.entityType),
    entityId: positiveInteger(input.entityId, 'entityId'),
    entityName: input.entityName || null,
    lookbackSeconds: positiveInteger(input.lookbackSeconds ?? defaults.lookbackSeconds, 'lookbackSeconds'),
    maxRefs: positiveInteger(input.maxRefs ?? defaults.maxRefs, 'maxRefs'),
    maxExpansions: positiveInteger(input.maxExpansions ?? defaults.maxExpansions, 'maxExpansions')
  };
}

function normalizeSystemRadiusWatchScope(input) {
  const defaults = USER_SCOPE_DEFAULTS.systemRadiusWatch;
  return {
    centerSystemId: positiveInteger(input.centerSystemId, 'centerSystemId'),
    radiusJumps: nonNegativeInteger(input.radiusJumps ?? defaults.radiusJumps, 'radiusJumps'),
    lookbackSeconds: positiveInteger(input.lookbackSeconds ?? defaults.lookbackSeconds, 'lookbackSeconds'),
    maxSystems: positiveInteger(input.maxSystems ?? defaults.maxSystems, 'maxSystems'),
    maxRefsPerSystem: positiveInteger(input.maxRefsPerSystem ?? defaults.maxRefsPerSystem, 'maxRefsPerSystem'),
    maxExpansions: positiveInteger(input.maxExpansions ?? defaults.maxExpansions, 'maxExpansions'),
    maxRadius: positiveInteger(input.maxRadius ?? defaults.maxRadius, 'maxRadius'),
    maxTopologySystems: positiveInteger(input.maxTopologySystems ?? defaults.maxTopologySystems, 'maxTopologySystems')
  };
}

function normalizeActorType(entityType) {
  const value = String(entityType || '').toLowerCase();
  if (!VALID_ACTOR_TYPES.has(value)) {
    throw new Error('Actor type must be character, corporation, or alliance');
  }
  return value;
}

function optionalPositiveInteger(value, label) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return positiveInteger(value, label);
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return number;
}

function nonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return number;
}

module.exports = {
  USER_SCOPE_DEFAULTS,
  normalizeManualDiscoveryScope,
  normalizeManualExpansionScope,
  normalizeActorWatchScope,
  normalizeSystemRadiusWatchScope,
  normalizeActorType,
  positiveInteger,
  nonNegativeInteger
};
