const ACTION = 'watch.bucket_pickup_posture_bridge.preview';

function buildWatchBucketPickupPostureBridgePreview(db, input = {}) {
  const before = stateSnapshot(db);
  const externalIoState = normalizeExternalIoState(input.externalIoState || input.external_io_state || 'off');
  const projection = input.bucketIdentityProjection || input.bucket_identity_projection || input.projection || {};
  const projectedCandidates = arrayInput(
    input.projectedBucketCandidates,
    input.projected_bucket_candidates,
    projection.projected_bucket_candidates
  ).map((candidate, index) => normalizeCandidate(candidate, index));
  const duplicateSuppressions = arrayInput(
    input.duplicateOpenSuppressions,
    input.duplicate_open_suppressions,
    projection.duplicate_open_suppressions
  ).map((row, index) => normalizeRejectedRow(row, index, 'duplicate_open_suppression'));
  const integrityConflicts = arrayInput(
    input.integrityConflicts,
    input.integrity_conflicts,
    projection.integrity_conflicts
  ).map((row, index) => normalizeRejectedRow(row, index, 'integrity_conflict'));
  const integrityErrors = arrayInput(
    input.integrityErrors,
    input.integrity_errors,
    projection.integrity_errors
  ).map((row, index) => normalizeRejectedRow(row, index, 'integrity_error'));
  const rejectedStubs = arrayInput(
    input.rejectedStubs,
    input.rejected_stubs,
    projection.rejected_stubs
  ).map((row, index) => normalizeRejectedRow(row, index, 'no_candidate'));

  const pickupPostureRows = [
    ...projectedCandidates.map((candidate) => postureForCandidate(candidate, externalIoState)),
    ...duplicateSuppressions.map((row) => rejectedBeforePickup(row, 'duplicate_open_suppression_not_candidate')),
    ...integrityConflicts.map((row) => rejectedBeforePickup(row, 'integrity_conflict_not_candidate')),
    ...integrityErrors.map((row) => rejectedBeforePickup(row, 'integrity_error_not_candidate')),
    ...rejectedStubs.map((row) => rejectedBeforePickup(row, row.reason || row.no_candidate_reason || 'no_candidate'))
  ];
  const eligibleRows = pickupPostureRows.filter((row) => row.pickup_posture === 'future_pickup_eligible');
  const heldRows = pickupPostureRows.filter((row) => row.pickup_posture === 'held_by_external_io');
  const rejectedRows = pickupPostureRows.filter((row) => row.pickup_posture === 'rejected_before_pickup_posture');
  const independentOverlaps = independentOverlapsFor(projectedCandidates, pickupPostureRows);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Watch bucket pickup posture bridge fixture proof',
    fixture_only: true,
    projection_only: true,
    read_only: true,
    mutates_state: false,
    renderer_eligible: true,
    provider_calls: 0,
    live_api_calls: 0,
    provider_packets: 0,
    discovery_pickup_started: false,
    discovery_pickup_packets_created: 0,
    pickup_packets_created: 0,
    bucket_rows_created: 0,
    bucket_rows_persisted: 0,
    durable_bucket_rows_written: 0,
    watch_run_rows_created: 0,
    fetch_runs_as_bucket_state: false,
    discovered_killmail_refs_as_bucket_state: false,
    candidate_refs_written: 0,
    discovered_killmail_refs_written: 0,
    discovery_refs_mutated: 0,
    evidence_rows_written: 0,
    evidence_writes: 0,
    hydration_writes: 0,
    metadata_writes: 0,
    observation_created: false,
    api_request_log_writes: 0,
    data_quality_warning_writes: 0,
    watch_mutations: 0,
    watch_rows_mutated: 0,
    cadence_mutations: 0,
    watch_executor_tick_called: false,
    task_runner_methods_called: [],
    collectors_called: false,
    dispatcher_queue_lease_behavior: false,
    schema_changes: 0,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    external_io_posture: {
      state: externalIoState,
      watch_bucket_candidate_projection_blocked: false,
      external_io_is_provider_movement_gate: true,
      future_discovery_pickup_held_when_off: externalIoState === 'off',
      provider_packets: 0,
      discovery_pickup_started: false,
      posture: externalIoState === 'off'
        ? 'external_io_holds_future_discovery_pickup_after_watch_projection'
        : 'future_discovery_pickup_eligible_but_not_started'
    },
    summary: {
      projected_candidate_fixture_count: projectedCandidates.length,
      pickup_posture_row_count: pickupPostureRows.length,
      future_pickup_eligible_count: eligibleRows.length,
      held_by_external_io_count: heldRows.length,
      rejected_before_pickup_count: rejectedRows.length,
      duplicate_open_suppression_count: duplicateSuppressions.length,
      integrity_conflict_count: integrityConflicts.length,
      integrity_error_count: integrityErrors.length,
      independent_overlap_count: independentOverlaps.length,
      provider_packets: 0,
      discovery_pickup_packets_created: 0,
      bucket_rows_persisted: 0,
      writes: 0
    },
    pickup_posture_rows: pickupPostureRows,
    future_pickup_eligible_candidates: eligibleRows,
    held_by_external_io_candidates: heldRows,
    rejected_before_pickup_rows: rejectedRows,
    independent_overlap_posture: independentOverlaps,
    accepted_model: {
      input_language: 'projected_bucket_candidate_fixture_only',
      pickup_posture_language: 'future_eligibility_or_hold_fixture_only',
      projected_candidates_are_fixture_input_only: true,
      pickup_eligible_does_not_start_discovery: true,
      held_by_external_io_is_provider_movement_hold_not_watch_emission_failure: true,
      duplicate_open_suppression_rows_are_not_candidates: true,
      integrity_conflict_or_error_rows_are_not_candidates: true,
      overlapping_watch_candidates_remain_independent: true,
      provider_packet_count_remains_zero: true,
      discovery_pickup_started_remains_false: true,
      bucket_rows_persisted_remains_zero: true,
      candidate_refs_are_not_written: true,
      evidence_eveidence_is_not_touched: true,
      schema_accepted_by_this_projection: false,
      runtime_behavior_changed_by_this_projection: false
    },
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
    },
    boundary: [
      'Read-only fixture/projection bridge only.',
      'Projected Watch bucket candidates are fixture input only, not durable bucket rows.',
      'Future pickup eligible means later Discovery pickup could consume the candidate; this command does not start pickup.',
      'External I/O off holds future provider movement after Watch projection; it is not a Watch emission failure.',
      'Duplicate-open suppressions, integrity conflicts, integrity errors, and no-candidate rows do not become pickup eligible.',
      'No Discovery pickup, provider packets, candidate refs, Evidence/EVEidence, Hydration, Observation, dispatcher, queue, lease, enforcement, schema, or UI behavior is opened.'
    ],
    does_not_do: [
      'does_not_create_schema',
      'does_not_create_durable_bucket_rows',
      'does_not_start_discovery_pickup',
      'does_not_create_provider_packets',
      'does_not_write_candidate_refs_discovery_refs_evidence_eveidence_hydration_or_observation',
      'does_not_mutate_watch_rows_or_cadence',
      'does_not_use_fetch_runs_or_discovered_killmail_refs_as_bucket_state',
      'does_not_call_watch_executor_tick_task_runner_collectors_or_providers',
      'does_not_implement_dispatcher_queue_lease_runtime_enforcement_or_ui'
    ]
  };
}

function postureForCandidate(candidate, externalIoState) {
  const held = externalIoState === 'off';
  return {
    posture_row_language: 'pickup_posture_fixture_projection',
    projected_bucket_candidate_id: candidate.projected_bucket_candidate_id,
    watch_id: candidate.watch_id,
    watch_run_id: candidate.watch_run_id,
    source_kind: candidate.source_kind,
    pickup_posture: held ? 'held_by_external_io' : 'future_pickup_eligible',
    reason: held ? 'external_io_off_holds_provider_movement_after_watch_projection' : 'external_io_on_future_pickup_eligible',
    watch_emission_failure: false,
    future_pickup_eligible: !held,
    held_by_external_io: held,
    starts_discovery_pickup: false,
    discovery_pickup_started: false,
    discovery_pickup_packets_created: 0,
    provider_packets: 0,
    candidate_refs_written: 0,
    evidence_eveidence_written: 0,
    hydration_writes: 0,
    observation_created: false,
    dispatcher_queue_lease_behavior: false,
    bucket_row_persisted: false,
    accepted_scope: candidate.accepted_scope,
    bucket_identity: candidate.bucket_identity,
    provenance: candidate.provenance,
    window: candidate.window
  };
}

function rejectedBeforePickup(row, reason) {
  return {
    posture_row_language: 'pickup_rejection_fixture_projection',
    input_stub_id: row.input_stub_id || null,
    projected_bucket_candidate_id: row.projected_bucket_candidate_id || null,
    watch_id: row.watch_id ?? null,
    watch_run_id: row.watch_run_id || null,
    source_kind: row.source_kind || null,
    pickup_posture: 'rejected_before_pickup_posture',
    reason,
    source_projection_status: row.projection_status || row.source_projection_status || null,
    future_pickup_eligible: false,
    held_by_external_io: false,
    starts_discovery_pickup: false,
    discovery_pickup_started: false,
    discovery_pickup_packets_created: 0,
    provider_packets: 0,
    candidate_refs_written: 0,
    evidence_eveidence_written: 0,
    hydration_writes: 0,
    observation_created: false,
    dispatcher_queue_lease_behavior: false,
    bucket_row_persisted: false
  };
}

function independentOverlapsFor(candidates, postureRows) {
  const byCandidateId = new Map(postureRows.map((row) => [row.projected_bucket_candidate_id, row]));
  const overlaps = [];
  for (let leftIndex = 0; leftIndex < candidates.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < candidates.length; rightIndex += 1) {
      const left = candidates[leftIndex];
      const right = candidates[rightIndex];
      if (left.watch_id === right.watch_id) {
        continue;
      }
      const shared = intersection(left.accepted_scope?.included_system_ids, right.accepted_scope?.included_system_ids);
      if (!shared.length) {
        continue;
      }
      overlaps.push({
        overlap_status: 'independent_pickup_posture_for_overlapping_watch_candidates',
        reason: 'overlap_does_not_merge_watch_bucket_intent',
        left_watch_id: left.watch_id,
        right_watch_id: right.watch_id,
        left_pickup_posture: byCandidateId.get(left.projected_bucket_candidate_id)?.pickup_posture || null,
        right_pickup_posture: byCandidateId.get(right.projected_bucket_candidate_id)?.pickup_posture || null,
        shared_system_ids: shared,
        suppresses_candidate: false,
        merges_pickup_posture: false,
        provider_packets: 0,
        writes: 0
      });
    }
  }
  return overlaps;
}

function normalizeCandidate(candidate = {}, index) {
  const acceptedScope = candidate.accepted_scope || {};
  const included = uniquePositiveIntegers(acceptedScope.included_system_ids || candidate.included_system_ids || []);
  return {
    projected_bucket_candidate_id: candidate.projected_bucket_candidate_id || `fixture-projected-candidate-${index + 1}`,
    watch_id: Number(candidate.watch_id),
    watch_run_id: candidate.watch_run_id || null,
    source_kind: candidate.source_kind || 'watch_system_radius',
    accepted_scope: {
      ...acceptedScope,
      execution_authority: acceptedScope.execution_authority || 'stored_included_system_ids',
      included_system_ids: included,
      center_radius_is_provenance_only: acceptedScope.center_radius_is_provenance_only !== false
    },
    bucket_identity: candidate.bucket_identity || {},
    provenance: candidate.provenance || {},
    window: candidate.window || {}
  };
}

function normalizeRejectedRow(row = {}, index, fallbackStatus) {
  return {
    input_stub_id: row.input_stub_id || `fixture-rejected-row-${index + 1}`,
    projected_bucket_candidate_id: row.projected_bucket_candidate_id || null,
    watch_id: Number.isFinite(Number(row.watch_id)) ? Number(row.watch_id) : null,
    watch_run_id: row.watch_run_id || null,
    source_kind: row.source_kind || 'watch_system_radius',
    projection_status: row.projection_status || fallbackStatus,
    reason: row.reason || row.no_candidate_reason || fallbackStatus
  };
}

function normalizeExternalIoState(state) {
  return state === 'on' ? 'on' : 'off';
}

function arrayInput(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}

function uniquePositiveIntegers(values = []) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const number = Number(value);
    if (!Number.isInteger(number) || number <= 0 || seen.has(number)) {
      continue;
    }
    seen.add(number);
    output.push(number);
  }
  return output.sort((left, right) => left - right);
}

function intersection(left = [], right = []) {
  const rightSet = new Set(right || []);
  return (left || []).filter((value) => rightSet.has(value));
}

function stateSnapshot(db) {
  if (!db?.prepare) {
    return {};
  }
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    ingestion_audits: count(db, 'ingestion_audits'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    entities: count(db, 'entities'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
}

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  buildWatchBucketPickupPostureBridgePreview
};
