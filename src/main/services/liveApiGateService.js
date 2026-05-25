const { USER_AGENT } = require('../../shared/constants');
const { taxonomyMessage } = require('./messageTaxonomy');
const { defaultTaskRunner } = require('./taskRunner');

const LIVE_ZKILL_COOLDOWN_SECONDS = 120;
const LIVE_ESI_COOLDOWN_SECONDS = 300;
const ABUSE_LOCKOUT_SECONDS = 900;
const ABUSE_WINDOW_SECONDS = 600;
const ABUSE_REPEAT_THRESHOLD = 3;

const requestControlState = new Map();

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
  },
  'sde.build-lookups': {
    mode: 'live-required',
    providers: ['ccp-sde'],
    description: 'Download official SDE source and rebuild local lookup tables when no local source path is supplied',
    estimate: () => ({
      zkill: 0,
      esi: 0,
      sde: 2,
      total: 2
    })
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

function actionGate(action, input = {}, options = {}) {
  return buildActionGate(action, input, options);
}

function enterLiveProviderAttempt(action, input = {}, context = {}) {
  const gate = buildActionGate(action, input, {
    now: context.now,
    taskRunner: context.taskRunner,
    recordBlockedAttempt: true
  });
  if (!gate.allowed) {
    const blocker = gate.blockers[0];
    const error = new Error(blocker?.message || `${action} is not allowed`);
    error.code = blocker?.code || 'LIVE_GATE_BLOCKED';
    error.details = gate;
    throw error;
  }
  if (gate.mode === 'live-required') {
    recordAcceptedAttempt(gate.request_control, context);
  }
  return gate;
}

function buildActionGate(action, input = {}, options = {}) {
  const definition = ACTIONS[action];
  if (!definition) {
    const error = new Error(`Unknown live API gate action: ${action}`);
    error.code = 'UNKNOWN_LIVE_GATE_ACTION';
    throw error;
  }

  const estimate = definition.estimate ? definition.estimate(input) : { zkill: 0, esi: 0, total: 0 };
  const requestControl = requestControlFor(action, input, definition);
  const blockers = [];
  const warnings = [];
  const nowMs = nowMsFrom(options.now);
  if (action === 'manual.discovery' && String(input.scope || '').toLowerCase() === 'radius') {
    blockers.push({
      ...taxonomyMessage('LIVE_RADIUS_REJECTED', 'Live manual discovery rejects radius; use Watch / Sequencer for radius acquisition', { source: 'live.gate' }),
      scope_fingerprint: requestControl.scope_fingerprint
    });
  }
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
  const runningDuplicate = definition.mode === 'live-required'
    ? activeDuplicateTask(options.taskRunner, action, requestControl.scope_fingerprint)
    : null;
  if (runningDuplicate) {
    blockers.push({
      ...taxonomyMessage('ALREADY_RUNNING', 'A matching live provider request is already running', { source: 'live.gate' }),
      active_task_id: runningDuplicate.task_id,
      scope_fingerprint: requestControl.scope_fingerprint
    });
  }
  const state = requestControlState.get(requestControl.scope_fingerprint);
  if (definition.mode === 'live-required' && state?.lockout_until_ms && state.lockout_until_ms > nowMs) {
    blockers.push(blockedTimingMessage('LOCKOUT_ACTIVE', 'Live provider request is temporarily locked out for this provider/action/scope fingerprint', requestControl, state.lockout_until_ms, nowMs));
  }
  if (definition.mode === 'live-required' && state?.next_eligible_at_ms && state.next_eligible_at_ms > nowMs) {
    blockers.push(blockedTimingMessage('COOLDOWN_ACTIVE', 'Live provider request is cooling down for this provider/action/scope fingerprint', requestControl, state.next_eligible_at_ms, nowMs));
  }

  if (options.recordBlockedAttempt && blockers.length) {
    const first = blockers[0];
    if (lockoutEligible(first.code)) {
      recordBlockedAttempt(requestControl, first.code, nowMs);
      const after = requestControlState.get(requestControl.scope_fingerprint);
      if (after?.lockout_until_ms && after.lockout_until_ms > nowMs && !blockers.some((entry) => entry.code === 'LOCKOUT_ACTIVE')) {
        blockers.unshift(blockedTimingMessage('LOCKOUT_ACTIVE', 'Live provider request is temporarily locked out for this provider/action/scope fingerprint', requestControl, after.lockout_until_ms, nowMs));
      }
    }
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
    request_control: {
      ...requestControl,
      cooldown_seconds: cooldownSecondsFor(requestControl.provider),
      cooldown_active: Boolean(state?.next_eligible_at_ms && state.next_eligible_at_ms > nowMs),
      lockout_active: Boolean(state?.lockout_until_ms && state.lockout_until_ms > nowMs),
      next_eligible_at: state?.next_eligible_at_ms ? new Date(state.next_eligible_at_ms).toISOString() : null,
      lockout_until: state?.lockout_until_ms ? new Date(state.lockout_until_ms).toISOString() : null,
      blocked_attempt_count: state?.blocked_attempts?.length || 0,
      last_blocked_reason: state?.last_blocked_reason || null,
      persistence: 'service-memory-only'
    },
    blockers,
    warnings,
    display: {
      label: labelFor(definition.mode, blockers),
      requires_confirmation: definition.mode === 'live-required',
      show_scope_and_caps: definition.mode === 'live-required'
    }
  };
}

function requestControlFor(action, input = {}, definition = ACTIONS[action]) {
  const provider = primaryProvider(definition);
  const target = targetFor(action, input);
  const capSummary = capSummaryFor(action, input);
  const parts = [
    action,
    provider,
    target.type,
    target.id,
    `lookback${positiveOrZero(input.lookbackSeconds || input.lookback_seconds)}`,
    capSummary
  ].filter(Boolean);
  return {
    provider,
    action,
    target_type: target.type,
    target_id: target.id,
    lookback_seconds: positiveOrZero(input.lookbackSeconds || input.lookback_seconds),
    cap_summary: capSummary,
    scope_fingerprint: parts.join(':')
  };
}

function primaryProvider(definition = {}) {
  if ((definition.providers || []).includes('zkill')) {
    return 'zkill';
  }
  if ((definition.providers || []).includes('esi')) {
    return 'esi';
  }
  return (definition.providers || [])[0] || 'local';
}

function targetFor(action, input = {}) {
  if (action === 'manual.discovery') {
    const scope = String(input.scope || '').toLowerCase();
    if (scope === 'actor') {
      return { type: input.entityType || input.entity_type || 'actor', id: input.entityId || input.entity_id || input.entityName || input.entity_name || 'unresolved' };
    }
    if (scope === 'system' || scope === 'radius') {
      return { type: scope, id: input.centerSystemId || input.center_system_id || input.centerSystemName || input.center_system_name || 'unresolved' };
    }
  }
  if (action === 'manual.expansion') {
    const killmailIds = (input.killmailIds || input.killmail_ids || []).map(Number).filter(Number.isInteger).sort((a, b) => a - b);
    if (killmailIds.length) {
      return { type: 'killmail', id: killmailIds.join(',') };
    }
    return { type: input.discoveredByType || input.discovered_by_type || 'queue', id: input.discoveredById || input.discovered_by_id || 'selected' };
  }
  if (action === 'actor.watch') {
    return { type: input.entityType || input.entity_type || 'actor', id: input.entityId || input.entity_id || 'unresolved' };
  }
  if (action === 'system.radius.watch') {
    return { type: 'system_radius', id: `${input.centerSystemId || input.center_system_id || 'unresolved'}:radius:${input.radiusJumps ?? input.radius_jumps ?? 0}` };
  }
  return { type: action, id: 'default' };
}

function capSummaryFor(action, input = {}) {
  if (action === 'manual.discovery') {
    if (String(input.scope || '').toLowerCase() === 'actor') {
      return `maxRefs${positiveOrZero(input.maxRefs || input.max_refs)}`;
    }
    return `maxSystems${positiveOrZero(input.maxSystems || input.max_systems)}:maxRefsPerSystem${positiveOrZero(input.maxRefsPerSystem || input.max_refs_per_system)}`;
  }
  if (action === 'manual.expansion') {
    return `maxExpansions${positiveOrZero(input.maxExpansions || input.max_expansions)}`;
  }
  if (action === 'actor.watch') {
    return `maxRefs${positiveOrZero(input.maxRefs || input.max_refs)}:maxExpansions${positiveOrZero(input.maxExpansions || input.max_expansions)}`;
  }
  if (action === 'system.radius.watch') {
    return `maxSystems${positiveOrZero(input.maxSystems || input.max_systems)}:maxRefsPerSystem${positiveOrZero(input.maxRefsPerSystem || input.max_refs_per_system)}:maxExpansions${positiveOrZero(input.maxExpansions || input.max_expansions)}`;
  }
  return null;
}

function activeDuplicateTask(taskRunner, action, fingerprint) {
  const runner = taskRunner || defaultTaskRunner;
  if (!runner?.listTasks) {
    return null;
  }
  return runner.listTasks({ limit: 100 }).find((task) => (
    ['queued', 'running'].includes(task.status) &&
    (task.scope_key === fingerprint || task.scope_key === `${action}:${fingerprint}`)
  )) || null;
}

function recordAcceptedAttempt(requestControl, context = {}) {
  const nowMs = nowMsFrom(context.now);
  const cooldownSeconds = providerWaitSeconds(context.retryAfterSeconds ?? context.retry_after_seconds, cooldownSecondsFor(requestControl.provider));
  const existing = requestControlState.get(requestControl.scope_fingerprint) || {};
  requestControlState.set(requestControl.scope_fingerprint, {
    ...existing,
    provider: requestControl.provider,
    action: requestControl.action,
    target_type: requestControl.target_type,
    target_id: requestControl.target_id,
    lookback_seconds: requestControl.lookback_seconds,
    cap_summary: requestControl.cap_summary,
    last_attempt_at_ms: nowMs,
    next_eligible_at_ms: nowMs + cooldownSeconds * 1000,
    cooldown_reason: context.cooldownReason || 'accepted_provider_attempt',
    last_blocked_reason: existing.last_blocked_reason || null,
    blocked_attempts: existing.blocked_attempts || [],
    lockout_until_ms: existing.lockout_until_ms || null
  });
}

function recordBlockedAttempt(requestControl, reason, nowMs) {
  const existing = requestControlState.get(requestControl.scope_fingerprint) || {};
  const recent = (existing.blocked_attempts || []).filter((attemptMs) => nowMs - attemptMs <= ABUSE_WINDOW_SECONDS * 1000);
  recent.push(nowMs);
  const next = {
    ...existing,
    provider: requestControl.provider,
    action: requestControl.action,
    target_type: requestControl.target_type,
    target_id: requestControl.target_id,
    last_blocked_reason: reason,
    blocked_attempts: recent
  };
  if (recent.length >= ABUSE_REPEAT_THRESHOLD) {
    next.lockout_until_ms = nowMs + ABUSE_LOCKOUT_SECONDS * 1000;
  }
  requestControlState.set(requestControl.scope_fingerprint, next);
}

function blockedTimingMessage(code, message, requestControl, targetMs, nowMs) {
  const remainingSeconds = Math.max(0, Math.ceil((targetMs - nowMs) / 1000));
  return {
    ...taxonomyMessage(code, message, { source: 'live.gate' }),
    next_eligible_at: new Date(targetMs).toISOString(),
    remaining_seconds: remainingSeconds,
    scope_fingerprint: requestControl.scope_fingerprint
  };
}

function cooldownSecondsFor(provider) {
  return provider === 'esi' ? LIVE_ESI_COOLDOWN_SECONDS : LIVE_ZKILL_COOLDOWN_SECONDS;
}

function providerWaitSeconds(value, minimum) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return minimum;
  }
  return Math.max(minimum, Math.ceil(number));
}

function lockoutEligible(code) {
  return ['COOLDOWN_ACTIVE', 'LIVE_RADIUS_REJECTED'].includes(code);
}

function nowMsFrom(value) {
  if (!value) {
    return Date.now();
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function resetLiveGateState() {
  requestControlState.clear();
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
  actionGate,
  enterLiveProviderAttempt,
  resetLiveGateState,
  requestControlFor
};
