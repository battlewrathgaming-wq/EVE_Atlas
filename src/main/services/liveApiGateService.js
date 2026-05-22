const { USER_AGENT } = require('../../shared/constants');
const { taxonomyMessage } = require('./messageTaxonomy');

const ACTIONS = {
  'report.view': {
    mode: 'local-only',
    providers: [],
    description: 'Read stored evidence/report data from local SQLite'
  },
  'metadata.status': {
    mode: 'local-only',
    providers: [],
    description: 'Read local metadata readiness from SQLite'
  },
  'manual.discovery': {
    mode: 'live-required',
    providers: ['zkill'],
    description: 'Discover zKill refs only; does not expand ESI killmails',
    estimate: estimateDiscovery
  },
  'manual.expansion': {
    mode: 'live-required',
    providers: ['esi'],
    description: 'Expand selected queued refs into ESI evidence',
    estimate: estimateExpansion
  },
  'actor.watch': {
    mode: 'live-required',
    providers: ['zkill', 'esi'],
    description: 'Discover actor zKill refs and expand uncached refs under cap',
    estimate: estimateActorWatch
  },
  'system.radius.watch': {
    mode: 'live-required',
    providers: ['zkill', 'esi'],
    description: 'Discover system/radius zKill refs and expand uncached refs under cap',
    estimate: estimateSystemRadiusWatch
  },
  'metadata.hydration': {
    mode: 'live-required',
    providers: ['esi'],
    description: 'Resolve report-scoped entity labels through ESI names',
    estimate: estimateHydration
  },
  'sde.import.local': {
    mode: 'local-only',
    providers: [],
    description: 'Import SDE metadata from local directory or zip'
  }
};

function getLiveApiGateState(payload = {}) {
  const action = payload.action || null;
  if (!action) {
    return {
      live_api_enabled: liveEnabled(),
      user_agent_configured: userAgentConfigured(),
      actions: Object.keys(ACTIONS).sort().map((key) => actionGate(key, {}))
    };
  }
  return actionGate(action, payload.input || {});
}

function actionGate(action, input = {}) {
  const definition = ACTIONS[action];
  if (!definition) {
    const error = new Error(`Unknown live API gate action: ${action}`);
    error.code = 'UNKNOWN_LIVE_GATE_ACTION';
    throw error;
  }

  const estimate = definition.estimate ? definition.estimate(input) : { zkill: 0, esi: 0, total: 0 };
  const blockers = [];
  const warnings = [];
  if (definition.mode === 'live-required' && !liveEnabled()) {
    blockers.push({
      ...taxonomyMessage('LIVE_API_DISABLED', 'This action requires explicit live API enablement', { source: 'live.gate' })
    });
  }
  if (definition.mode === 'live-required' && !userAgentConfigured()) {
    blockers.push({
      ...taxonomyMessage('USER_AGENT_MISSING', 'Live API actions require a clear User-Agent', { source: 'live.gate' })
    });
  }
  if (definition.mode === 'live-required' && estimate.total === 0) {
    warnings.push({
      ...taxonomyMessage('API_ESTIMATE_UNKNOWN', 'API estimate is unknown until scope planning/discovery is available', { source: 'live.gate' })
    });
  }

  return {
    action,
    mode: definition.mode,
    description: definition.description,
    providers: definition.providers,
    live_api_enabled: liveEnabled(),
    user_agent_configured: userAgentConfigured(),
    allowed: blockers.length === 0,
    state: blockers.length ? 'blocked' : definition.mode === 'live-required' ? 'enabled' : 'local-only',
    estimated_api_calls: estimate,
    blockers,
    warnings,
    display: {
      label: labelFor(definition.mode, blockers),
      requires_confirmation: definition.mode === 'live-required',
      show_scope_and_caps: definition.mode === 'live-required'
    }
  };
}

function estimateDiscovery(input) {
  if (input.scope === 'actor') {
    return calls({ zkill: 1, esi: 0 });
  }
  return calls({ zkill: positiveOrZero(input.maxSystems) || 1, esi: 0 });
}

function estimateExpansion(input) {
  return calls({ zkill: 0, esi: positiveOrZero(input.maxExpansions) });
}

function estimateActorWatch(input) {
  return calls({
    zkill: 1,
    esi: positiveOrZero(input.maxExpansions)
  });
}

function estimateSystemRadiusWatch(input) {
  return calls({
    zkill: positiveOrZero(input.maxSystems) || 1,
    esi: positiveOrZero(input.maxExpansions)
  });
}

function estimateHydration(input) {
  const ids = positiveOrZero(input.idsToRequest);
  const chunks = ids ? Math.ceil(ids / 1000) : positiveOrZero(input.chunks);
  return calls({ zkill: 0, esi: chunks });
}

function calls({ zkill, esi }) {
  const safeZkill = positiveOrZero(zkill);
  const safeEsi = positiveOrZero(esi);
  return {
    zkill: safeZkill,
    esi: safeEsi,
    total: safeZkill + safeEsi
  };
}

function positiveOrZero(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }
  return Math.floor(number);
}

function liveEnabled() {
  return process.env.AURA_ATLAS_LIVE_API === '1';
}

function userAgentConfigured() {
  return typeof USER_AGENT === 'string' && USER_AGENT.trim().length > 0;
}

function labelFor(mode, blockers) {
  if (mode === 'local-only') {
    return 'Local-only';
  }
  if (blockers.length) {
    return 'Live API required';
  }
  return 'Live API enabled';
}

module.exports = {
  getLiveApiGateState,
  actionGate
};
