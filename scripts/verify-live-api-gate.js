const {
  actionGate,
  enterLiveProviderAttempt,
  getLiveApiGateState,
  resetLiveGateState
} = require('../src/main/services/liveApiGateService');

function main() {
  const previous = process.env.AURA_ATLAS_LIVE_API;
  delete process.env.AURA_ATLAS_LIVE_API;
  try {
    resetLiveGateState();
    const local = actionGate('report.view');
    assert(local.allowed === true, 'local report view should be allowed without live API');
    assert(local.mode === 'local-only', 'report view should be local-only');
    assert(local.display.requires_confirmation === false, 'local action should not require live confirmation');

    const blockedDiscovery = actionGate('manual.discovery', {
      scope: 'radius',
      maxSystems: 4
    });
    assert(blockedDiscovery.allowed === false, 'manual discovery should be blocked when live API is disabled');
    assert(blockedDiscovery.blockers[0].code === 'LIVE_RADIUS_REJECTED', 'live radius should be rejected before live API/provider work');
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
    assert(radiusWatch.allowed === true, 'watch radius should remain allowed when live gates are open');

    const liveInput = {
      scope: 'actor',
      entityType: 'character',
      entityId: 90000002,
      lookbackSeconds: 86400,
      maxRefs: 10
    };
    const accepted = enterLiveProviderAttempt('manual.discovery', liveInput, {
      now: '2026-05-26T10:00:00.000Z'
    });
    assert(accepted.allowed === true, 'first live actor discovery attempt should pass');
    const cooled = actionGate('manual.discovery', liveInput, {
      now: '2026-05-26T10:01:00.000Z'
    });
    assert(cooled.allowed === false, 'same live fingerprint should enter cooldown');
    assert(cooled.blockers.some((entry) => entry.code === 'COOLDOWN_ACTIVE'), 'cooldown should block repeated live fingerprint');
    assert(cooled.blockers.some((entry) => entry.remaining_seconds === 60), 'cooldown should report remaining seconds');
    assert(cooled.request_control.scope_fingerprint.includes('manual.discovery:zkill'), 'cooldown should report provider/action fingerprint');

    for (let attempt = 0; attempt < 3; attempt += 1) {
      assertRejects(() => enterLiveProviderAttempt('manual.discovery', liveInput, {
        now: `2026-05-26T10:01:0${attempt}.000Z`
      }), 'blocked cooldown repeat should reject');
    }
    const locked = actionGate('manual.discovery', liveInput, {
      now: '2026-05-26T10:01:10.000Z'
    });
    assert(locked.blockers.some((entry) => entry.code === 'LOCKOUT_ACTIVE'), 'three blocked repeats should create scoped lockout');
    assert(locked.blockers.some((entry) => entry.remaining_seconds > 800), 'lockout should report next eligible timing');

    resetLiveGateState();
    const duplicateFingerprint = actionGate('manual.discovery', liveInput).request_control.scope_fingerprint;
    const duplicate = actionGate('manual.discovery', liveInput, {
      taskRunner: {
        listTasks() {
          return [{
            task_id: 'task_running_duplicate',
            status: 'running',
            scope_key: duplicateFingerprint
          }];
        }
      }
    });
    assert(duplicate.allowed === false, 'running duplicate should block');
    assert(duplicate.blockers.some((entry) => entry.code === 'ALREADY_RUNNING'), 'running duplicate should be classified already_running');

    resetLiveGateState();
    const expansionInput = {
      killmailIds: [123456789],
      maxExpansions: 1
    };
    enterLiveProviderAttempt('manual.expansion', expansionInput, {
      now: '2026-05-26T11:00:00.000Z'
    });
    const cooledExpansion = actionGate('manual.expansion', expansionInput, {
      now: '2026-05-26T11:01:00.000Z'
    });
    assert(cooledExpansion.allowed === false, 'same ESI expansion fingerprint should enter cooldown');
    assert(cooledExpansion.blockers.some((entry) => entry.remaining_seconds === 240), 'ESI expansion cooldown should use five minute default');

    resetLiveGateState();
    const hydrationOne = actionGate('metadata.hydration', { idsToRequest: 1 }, {
      now: '2026-05-26T12:00:00.000Z'
    });
    const hydrationTwo = actionGate('metadata.hydration', { idsToRequest: 1 }, {
      now: '2026-05-26T12:01:00.000Z'
    });
    assert(hydrationOne.allowed === true && hydrationTwo.allowed === true, 'local hydration gate checks should not consume request-control cooldown or lockout');

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

function assertRejects(fn, message) {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(message);
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
