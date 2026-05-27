const crypto = require('node:crypto');

const LANES = Object.freeze([
  {
    lane_id: 'acquisition.zkill_discovery',
    clock: 'Acquisition',
    lane: 'zKill Discovery',
    provider: 'zkill',
    interval_seconds: 900,
    jitter_seconds: 45,
    creates: 'Discovery refs / possible leads'
  },
  {
    lane_id: 'acquisition.esi_evidence_expansion',
    clock: 'Acquisition',
    lane: 'ESI Evidence expansion',
    provider: 'esi',
    interval_seconds: 300,
    jitter_seconds: 30,
    creates: 'Evidence/EVEidence from selected Discovery refs'
  },
  {
    lane_id: 'hydration.watch',
    clock: 'Hydration Recovery',
    lane: 'Watch hydration',
    provider: 'esi',
    interval_seconds: 600,
    jitter_seconds: 40,
    creates: 'readability metadata for Watch-originated local facts'
  },
  {
    lane_id: 'hydration.view_local_record',
    clock: 'Hydration Recovery',
    lane: 'view/local-record hydration',
    provider: 'esi',
    interval_seconds: 120,
    jitter_seconds: 20,
    creates: 'readability metadata for the currently inspected local record'
  }
]);

function buildCadenceSimulation(input = {}) {
  const now = input.now || '2026-05-27T12:00:00.000Z';
  const installIds = input.install_ids || input.installIds || [
    'atlas-install-alpha',
    'atlas-install-bravo',
    'atlas-install-charlie'
  ];
  const base = simulateInstall({
    install_id: installIds[0],
    now,
    external_io: 'on',
    storage: 'unlocked',
    pending_refs: 0,
    retry_after: {},
    last_observed_at: '2026-05-27T11:57:00.000Z'
  });
  const externalIoReenabled = simulateInstall({
    install_id: installIds[0],
    now,
    external_io: 'off',
    external_io_reenabled_at: '2026-05-27T12:07:00.000Z',
    storage: 'unlocked',
    pending_refs: 0,
    retry_after: {},
    last_observed_at: '2026-05-27T10:00:00.000Z'
  });
  const storageUnlocked = simulateInstall({
    install_id: installIds[0],
    now,
    external_io: 'on',
    storage: 'locked',
    storage_unlocked_at: '2026-05-27T12:11:00.000Z',
    pending_refs: 0,
    retry_after: {},
    last_observed_at: '2026-05-27T10:00:00.000Z'
  });
  const retryAfter = simulateInstall({
    install_id: installIds[0],
    now,
    external_io: 'on',
    storage: 'unlocked',
    pending_refs: 0,
    retry_after: {
      'acquisition.esi_evidence_expansion': '2026-05-27T12:20:00.000Z'
    },
    last_observed_at: '2026-05-27T11:57:00.000Z'
  });
  const pendingRefs = simulateInstall({
    install_id: installIds[0],
    now,
    external_io: 'on',
    storage: 'unlocked',
    pending_refs: 1000,
    retry_after: {},
    last_observed_at: '2026-05-27T11:57:00.000Z'
  });
  const installSpread = installIds.map((installId) => simulateInstall({
    install_id: installId,
    now,
    external_io: 'on',
    storage: 'unlocked',
    pending_refs: 0,
    retry_after: {},
    last_observed_at: '2026-05-27T11:57:00.000Z'
  }));

  return {
    simulation: 'cadence_proof_fixture',
    classification: 'read-only cadence simulation; not runtime policy',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    provider_calls: 0,
    runtime_dispatch: false,
    lanes: LANES.map((lane) => ({ ...lane })),
    scenarios: {
      baseline: base,
      external_io_reenabled: externalIoReenabled,
      storage_unlocked: storageUnlocked,
      provider_retry_after: retryAfter,
      pending_refs: pendingRefs,
      multi_install_spread: installSpread
    },
    proofs: proofSummary({
      base,
      externalIoReenabled,
      storageUnlocked,
      retryAfter,
      pendingRefs,
      installSpread
    }),
    boundary: [
      'Simulation only; output is not active runtime policy.',
      'No provider calls, runtime dispatch, runtime mutation, persistence, schema, Watch scheduler behavior, queue/sequencer machinery, storage lockout, or external_io enforcement.',
      'Missed time and held work do not accumulate request debt.',
      'Restart, storage unlock, or external_io re-enable releases at most one eligible item per lane through normal cadence, not catch-up flood.'
    ]
  };
}

function simulateInstall(input) {
  const releaseAfter = laterIso(input.now, input.external_io_reenabled_at, input.storage_unlocked_at);
  const lanes = LANES.map((lane) => simulateLane(lane, input, releaseAfter));
  return {
    install_id: input.install_id,
    now: input.now,
    gates: {
      external_io: input.external_io || 'on',
      external_io_reenabled_at: input.external_io_reenabled_at || null,
      storage: input.storage || 'unlocked',
      storage_unlocked_at: input.storage_unlocked_at || null
    },
    pending_refs: input.pending_refs || 0,
    lanes,
    release_budget: {
      max_release_per_lane: 1,
      catch_up_flood_allowed: false,
      accumulated_request_debt: 0,
      releasable_now_count: lanes.filter((lane) => lane.state === 'due').length
    }
  };
}

function simulateLane(lane, input, releaseAfter) {
  const phaseSeconds = stableNumber(`${input.install_id}:${lane.lane_id}:phase`, lane.interval_seconds);
  const jitterRange = (lane.jitter_seconds * 2) + 1;
  const jitterSeconds = stableNumber(`${input.install_id}:${lane.lane_id}:jitter`, jitterRange) - lane.jitter_seconds;
  const lastObservedAt = input.last_observed_at || input.now;
  const missedSlots = missedSlotCount(lastObservedAt, input.now, lane.interval_seconds);
  const localNext = nextSlotAtOrAfter(input.now, lane.interval_seconds, phaseSeconds, jitterSeconds);
  const releaseNext = releaseAfter
    ? nextSlotAtOrAfter(releaseAfter, lane.interval_seconds, phaseSeconds, jitterSeconds)
    : localNext;
  const retryAfter = input.retry_after?.[lane.lane_id] || null;
  const retryNext = retryAfter && Date.parse(retryAfter) > Date.parse(releaseNext)
    ? retryAfter
    : releaseNext;
  const blockers = blockersForLane(lane, input, retryAfter, releaseAfter);
  const state = stateForLane(blockers, retryNext, input.now);

  return {
    lane_id: lane.lane_id,
    clock: lane.clock,
    lane: lane.lane,
    provider: lane.provider,
    interval_seconds: lane.interval_seconds,
    stable_phase_seconds: phaseSeconds,
    bounded_jitter_seconds: jitterSeconds,
    local_next_slot_at: localNext,
    provider_retry_after_until: retryAfter,
    next_eligible_at: retryNext,
    state,
    blockers,
    missed_slots: missedSlots,
    pending_refs: input.pending_refs || 0,
    release_count_now: state === 'due' ? 1 : 0,
    catch_up_debt: 0,
    no_catch_up_flood: true,
    separation: lane.creates
  };
}

function blockersForLane(lane, input, retryAfter, releaseAfter) {
  const blockers = [];
  if (input.external_io === 'off') {
    blockers.push('held_by_external_io');
  }
  if (input.storage === 'locked') {
    blockers.push('held_by_storage_lock');
  }
  if (retryAfter) {
    blockers.push('provider_retry_after');
  }
  if (lane.lane_id === 'acquisition.zkill_discovery' && (input.pending_refs || 0) > 0) {
    blockers.push('pending_refs_first');
  }
  if (releaseAfter && Date.parse(releaseAfter) > Date.parse(input.now)) {
    blockers.push('future_gate_release_wait');
  }
  return blockers;
}

function stateForLane(blockers, nextEligibleAt, now) {
  if (blockers.length) {
    return 'held';
  }
  return Date.parse(nextEligibleAt) <= Date.parse(now) ? 'due' : 'waiting';
}

function proofSummary({ base, externalIoReenabled, storageUnlocked, retryAfter, pendingRefs, installSpread }) {
  const zkillTimes = installSpread.map((install) => laneFor(install, 'acquisition.zkill_discovery').next_eligible_at);
  const uniqueZkillTimes = new Set(zkillTimes);
  const retryLane = laneFor(retryAfter, 'acquisition.esi_evidence_expansion');
  const baseRetryLane = laneFor(base, 'acquisition.esi_evidence_expansion');
  const pendingZkill = laneFor(pendingRefs, 'acquisition.zkill_discovery');

  return {
    simulated_installs_do_not_synchronize: uniqueZkillTimes.size > 1,
    install_next_eligible_times: zkillTimes,
    no_catch_up_after_restart: base.lanes.every((lane) => lane.catch_up_debt === 0 && lane.release_count_now <= 1),
    no_catch_up_after_external_io_reenable: externalIoReenabled.lanes.every((lane) => lane.catch_up_debt === 0 && lane.release_count_now <= 1),
    no_catch_up_after_storage_unlock: storageUnlocked.lanes.every((lane) => lane.catch_up_debt === 0 && lane.release_count_now <= 1),
    retry_after_overrides_local_cadence: Date.parse(retryLane.next_eligible_at) > Date.parse(baseRetryLane.next_eligible_at),
    pending_refs_hold_fresh_zkill_discovery: pendingZkill.blockers.includes('pending_refs_first'),
    acquisition_and_hydration_lanes_separate: new Set(LANES.map((lane) => lane.clock)).size === 2 &&
      LANES.filter((lane) => lane.clock === 'Acquisition').length === 2 &&
      LANES.filter((lane) => lane.clock === 'Hydration Recovery').length === 2,
    runtime_policy_created: false,
    provider_calls: 0
  };
}

function laneFor(simulation, laneId) {
  return simulation.lanes.find((lane) => lane.lane_id === laneId);
}

function nextSlotAtOrAfter(isoTime, intervalSeconds, phaseSeconds, jitterSeconds) {
  const timeMs = Date.parse(isoTime);
  const intervalMs = intervalSeconds * 1000;
  const offsetMs = (phaseSeconds + jitterSeconds) * 1000;
  const adjusted = timeMs - offsetMs;
  const slot = Math.ceil(adjusted / intervalMs);
  return new Date((slot * intervalMs) + offsetMs).toISOString();
}

function missedSlotCount(lastObservedAt, now, intervalSeconds) {
  const lastMs = Date.parse(lastObservedAt);
  const nowMs = Date.parse(now);
  if (!Number.isFinite(lastMs) || !Number.isFinite(nowMs) || nowMs <= lastMs) {
    return 0;
  }
  return Math.floor((nowMs - lastMs) / (intervalSeconds * 1000));
}

function laterIso(...values) {
  const parsed = values
    .filter(Boolean)
    .map((value) => ({ value, time: Date.parse(value) }))
    .filter((entry) => Number.isFinite(entry.time))
    .sort((left, right) => right.time - left.time);
  return parsed[0]?.value || null;
}

function stableNumber(seed, modulo) {
  const digest = crypto.createHash('sha256').update(seed).digest();
  return digest.readUInt32BE(0) % modulo;
}

module.exports = {
  LANES,
  buildCadenceSimulation
};
