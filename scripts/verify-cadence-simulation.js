const { buildCadenceSimulation } = require('../src/main/support/cadenceSimulation');

function main() {
  const simulation = buildCadenceSimulation({
    now: '2026-05-27T12:00:00.000Z',
    installIds: [
      'atlas-install-alpha',
      'atlas-install-bravo',
      'atlas-install-charlie',
      'atlas-install-delta'
    ]
  });

  verifyBoundary(simulation);
  verifyLanes(simulation);
  verifyProofs(simulation);
  verifyScenarioDetails(simulation);

  console.log(JSON.stringify({
    status: 'cadence simulation verified',
    lanes: simulation.lanes.map((lane) => ({
      lane_id: lane.lane_id,
      clock: lane.clock,
      provider: lane.provider,
      interval_seconds: lane.interval_seconds,
      jitter_seconds: lane.jitter_seconds
    })),
    proofs: simulation.proofs,
    sample_baseline: compactInstall(simulation.scenarios.baseline),
    sample_external_io_reenabled: compactInstall(simulation.scenarios.external_io_reenabled),
    sample_storage_unlocked: compactInstall(simulation.scenarios.storage_unlocked),
    sample_retry_after_lane: compactLane(laneFor(simulation.scenarios.provider_retry_after, 'acquisition.esi_evidence_expansion')),
    sample_pending_refs_lane: compactLane(laneFor(simulation.scenarios.pending_refs, 'acquisition.zkill_discovery')),
    boundary: simulation.boundary
  }, null, 2));
}

function verifyBoundary(simulation) {
  assert(simulation.read_only === true, 'simulation should be read-only');
  assert(simulation.mutates_state === false, 'simulation should not mutate state');
  assert(simulation.provider_calls === 0, 'simulation should not call providers');
  assert(simulation.runtime_dispatch === false, 'simulation should not dispatch runtime work');
  assert(simulation.classification.includes('not runtime policy'), 'simulation should not claim active runtime policy');
}

function verifyLanes(simulation) {
  const laneIds = simulation.lanes.map((lane) => lane.lane_id);
  assert(laneIds.includes('acquisition.zkill_discovery'), 'should include Acquisition zKill Discovery lane');
  assert(laneIds.includes('acquisition.esi_evidence_expansion'), 'should include Acquisition ESI Evidence expansion lane');
  assert(laneIds.includes('hydration.watch'), 'should include Watch hydration lane');
  assert(laneIds.includes('hydration.view_local_record'), 'should include view/local-record hydration lane');
  assert(simulation.lanes.filter((lane) => lane.clock === 'Acquisition').length === 2, 'Acquisition lanes should be separate');
  assert(simulation.lanes.filter((lane) => lane.clock === 'Hydration Recovery').length === 2, 'Hydration lanes should be separate');
}

function verifyProofs(simulation) {
  const proofs = simulation.proofs;
  assert(proofs.simulated_installs_do_not_synchronize === true, 'install phases should not synchronize');
  assert(new Set(proofs.install_next_eligible_times).size > 1, 'install next eligible times should vary');
  assert(proofs.no_catch_up_after_restart === true, 'restart should not create catch-up flood');
  assert(proofs.no_catch_up_after_external_io_reenable === true, 'external_io re-enable should not catch up flood');
  assert(proofs.no_catch_up_after_storage_unlock === true, 'storage unlock should not catch up flood');
  assert(proofs.retry_after_overrides_local_cadence === true, 'provider Retry-After should override local cadence');
  assert(proofs.pending_refs_hold_fresh_zkill_discovery === true, 'pending refs should hold fresh zKill Discovery');
  assert(proofs.acquisition_and_hydration_lanes_separate === true, 'Acquisition and Hydration lanes should remain separate');
  assert(proofs.runtime_policy_created === false, 'simulation should not create runtime policy');
  assert(proofs.provider_calls === 0, 'proof should report no provider calls');
}

function verifyScenarioDetails(simulation) {
  for (const scenario of Object.values(simulation.scenarios).flat()) {
    if (!scenario?.lanes) {
      continue;
    }
    for (const lane of scenario.lanes) {
      assert(Math.abs(lane.bounded_jitter_seconds) <= simulation.lanes.find((entry) => entry.lane_id === lane.lane_id).jitter_seconds, 'jitter should stay within lane bound');
      assert(lane.catch_up_debt === 0, 'missed slots should not create request debt');
      assert(lane.release_count_now <= 1, 'release count should be capped to one item per lane');
      assert(lane.no_catch_up_flood === true, 'lane should mark no catch-up flood');
    }
  }

  const externalIo = simulation.scenarios.external_io_reenabled;
  assert(externalIo.lanes.every((lane) => lane.blockers.includes('held_by_external_io')), 'external_io off should hold lanes');
  assert(externalIo.lanes.every((lane) => Date.parse(lane.next_eligible_at) >= Date.parse(externalIo.gates.external_io_reenabled_at)), 'external_io re-enable should release through next normal slot');

  const storage = simulation.scenarios.storage_unlocked;
  assert(storage.lanes.every((lane) => lane.blockers.includes('held_by_storage_lock')), 'storage locked should hold lanes');
  assert(storage.lanes.every((lane) => Date.parse(lane.next_eligible_at) >= Date.parse(storage.gates.storage_unlocked_at)), 'storage unlock should release through next normal slot');

  const retryLane = laneFor(simulation.scenarios.provider_retry_after, 'acquisition.esi_evidence_expansion');
  assert(retryLane.blockers.includes('provider_retry_after'), 'Retry-After lane should include provider_retry_after blocker');
  assert(retryLane.next_eligible_at === retryLane.provider_retry_after_until, 'Retry-After should set next eligible when beyond local cadence');

  const pendingLane = laneFor(simulation.scenarios.pending_refs, 'acquisition.zkill_discovery');
  assert(pendingLane.blockers.includes('pending_refs_first'), 'pending refs should block fresh zKill lane');
  const expansionLane = laneFor(simulation.scenarios.pending_refs, 'acquisition.esi_evidence_expansion');
  assert(!expansionLane.blockers.includes('pending_refs_first'), 'pending refs should not block ESI expansion lane');
}

function compactInstall(install) {
  return {
    install_id: install.install_id,
    gates: install.gates,
    release_budget: install.release_budget,
    lanes: install.lanes.map(compactLane)
  };
}

function compactLane(lane) {
  return {
    lane_id: lane.lane_id,
    clock: lane.clock,
    provider: lane.provider,
    stable_phase_seconds: lane.stable_phase_seconds,
    bounded_jitter_seconds: lane.bounded_jitter_seconds,
    state: lane.state,
    blockers: lane.blockers,
    missed_slots: lane.missed_slots,
    pending_refs: lane.pending_refs,
    local_next_slot_at: lane.local_next_slot_at,
    provider_retry_after_until: lane.provider_retry_after_until,
    next_eligible_at: lane.next_eligible_at,
    release_count_now: lane.release_count_now,
    catch_up_debt: lane.catch_up_debt
  };
}

function laneFor(install, laneId) {
  const lane = install.lanes.find((entry) => entry.lane_id === laneId);
  assert(lane, `${laneId} should exist`);
  return lane;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
