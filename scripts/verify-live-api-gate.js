const { actionGate, getLiveApiGateState } = require('../src/main/services/liveApiGateService');

function main() {
  const previous = process.env.AURA_ATLAS_LIVE_API;
  delete process.env.AURA_ATLAS_LIVE_API;
  try {
    const local = actionGate('report.view');
    assert(local.allowed === true, 'local report view should be allowed without live API');
    assert(local.mode === 'local-only', 'report view should be local-only');
    assert(local.display.requires_confirmation === false, 'local action should not require live confirmation');

    const blockedDiscovery = actionGate('manual.discovery', {
      scope: 'radius',
      maxSystems: 4
    });
    assert(blockedDiscovery.allowed === false, 'manual discovery should be blocked when live API is disabled');
    assert(blockedDiscovery.blockers.some((entry) => entry.code === 'LIVE_API_DISABLED'), 'blocked discovery should include live API blocker');
    assert(blockedDiscovery.estimated_api_calls.zkill === 4, 'discovery estimate should use max systems');
    assert(blockedDiscovery.estimated_api_calls.esi === 0, 'manual discovery should estimate no ESI calls');

    process.env.AURA_ATLAS_LIVE_API = '1';
    const actorWatch = actionGate('actor.watch', {
      maxExpansions: 2
    });
    assert(actorWatch.allowed === true, 'actor watch should be allowed with live API enabled');
    assert(actorWatch.display.requires_confirmation === true, 'live action should require confirmation');
    assert(actorWatch.estimated_api_calls.zkill === 1, 'actor watch should estimate one zKill call');
    assert(actorWatch.estimated_api_calls.esi === 2, 'actor watch should estimate capped ESI calls');

    const radiusWatch = actionGate('system.radius.watch', {
      maxSystems: 4,
      maxExpansions: 3
    });
    assert(radiusWatch.estimated_api_calls.total === 7, 'radius watch estimate should combine zKill and ESI calls');

    const all = getLiveApiGateState();
    assert(all.live_api_enabled === true, 'gate summary should reflect live enabled');
    assert(all.actions.some((entry) => entry.action === 'manual.expansion'), 'gate summary should include manual expansion');

    assertThrows(() => actionGate('unknown.action'), 'unknown actions should fail clearly');
  } finally {
    if (previous === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = previous;
    }
  }

  console.log('live API gate verified');
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
