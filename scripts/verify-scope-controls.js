const {
  normalizeActorWatchScope,
  normalizeManualDiscoveryScope,
  normalizeManualExpansionScope,
  normalizeSystemRadiusWatchScope,
  USER_SCOPE_DEFAULTS
} = require('../src/main/scopes/scopeControls');

function main() {
  const manualActor = normalizeManualDiscoveryScope({
    scope: 'actor',
    entityType: 'character',
    entityId: 90000002
  });
  assert(manualActor.lookbackSeconds === USER_SCOPE_DEFAULTS.manualActorDiscovery.lookbackSeconds, 'manual actor lookback default mismatch');
  assert(manualActor.maxRefs === USER_SCOPE_DEFAULTS.manualActorDiscovery.maxRefs, 'manual actor max refs default mismatch');

  const manualSystem = normalizeManualDiscoveryScope({
    scope: 'system',
    centerSystemId: 30000001
  });
  assert(manualSystem.radiusJumps === 0, 'manual system discovery should force radius 0');
  assert(manualSystem.maxRefsPerSystem === USER_SCOPE_DEFAULTS.manualSystemDiscovery.maxRefsPerSystem, 'manual system max refs default mismatch');

  const manualRadius = normalizeManualDiscoveryScope({
    scope: 'radius',
    centerSystemId: 30000001
  });
  assert(manualRadius.radiusJumps === USER_SCOPE_DEFAULTS.manualRadiusDiscovery.radiusJumps, 'manual radius default mismatch');
  assert(manualRadius.maxSystems === USER_SCOPE_DEFAULTS.manualRadiusDiscovery.maxSystems, 'manual radius max systems default mismatch');

  const actorWatch = normalizeActorWatchScope({
    entityType: 'corporation',
    entityId: 98000002
  });
  assert(actorWatch.lookbackSeconds === USER_SCOPE_DEFAULTS.actorWatch.lookbackSeconds, 'actor watch lookback default mismatch');
  assert(actorWatch.maxExpansions === USER_SCOPE_DEFAULTS.actorWatch.maxExpansions, 'actor watch expansion default mismatch');

  const systemWatch = normalizeSystemRadiusWatchScope({
    centerSystemId: 30000001
  });
  assert(systemWatch.radiusJumps === USER_SCOPE_DEFAULTS.systemRadiusWatch.radiusJumps, 'system watch radius default mismatch');
  assert(systemWatch.maxExpansions === USER_SCOPE_DEFAULTS.systemRadiusWatch.maxExpansions, 'system watch expansion default mismatch');

  const manualExpansion = normalizeManualExpansionScope({
    discoveredByType: 'manual_actor',
    discoveredById: 'character:90000002'
  });
  assert(manualExpansion.maxExpansions === USER_SCOPE_DEFAULTS.manualExpansion.maxExpansions, 'manual expansion default mismatch');

  assertThrows(() => normalizeManualDiscoveryScope({ scope: 'actor', entityType: 'system', entityId: 1 }), 'invalid actor type should fail');
  assertThrows(() => normalizeManualExpansionScope({}), 'manual expansion without scope or IDs should fail');
  assertThrows(() => normalizeSystemRadiusWatchScope({ centerSystemId: 30000001, radiusJumps: -1 }), 'negative radius should fail');

  console.log('scope controls verified');
}

function assertThrows(fn, message) {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
