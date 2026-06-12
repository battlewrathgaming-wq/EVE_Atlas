const ACTION = 'discovery.pickup_consumer_hold_contract.preview';

function buildDiscoveryPickupConsumerHoldContractProof(db, input = {}) {
  const before = stateSnapshot(db);
  const externalIoState = normalizeExternalIoState(input.externalIoState || input.external_io_state || 'off');
  const disposableRows = arrayInput(input.disposableFixtureRows, input.disposable_fixture_rows)
    .map((row, index) => normalizeDisposableRow(row, index));
  const persistenceResults = arrayInput(input.persistenceResults, input.persistence_results)
    .map((row, index) => normalizePersistenceResult(row, index));

  const pickupRows = disposableRows.map((row) => pickupRowFor(row, externalIoState));
  const rejectedRows = persistenceResults
    .filter((row) => row.persistence_result !== 'inserted_open_disposable_fixture_row')
    .map((row) => rejectedRowFor(row));
  const contractRows = [...pickupRows, ...rejectedRows];
  const eligibleRows = pickupRows.filter((row) => row.pickup_contract_status === 'future_pickup_eligible');
  const heldRows = pickupRows.filter((row) => row.pickup_contract_status === 'held_by_external_io');
  const duplicateRows = rejectedRows.filter((row) => row.rejection_family === 'duplicate_idempotent');
  const conflictRows = rejectedRows.filter((row) => row.rejection_family === 'integrity_conflict_or_error');
  const rejectedSourceRows = rejectedRows.filter((row) => row.rejection_family === 'rejected_source_row');
  const overlapRows = independentOverlapRows(pickupRows);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'fixture-only Discovery pickup consumer hold contract proof',
    fixture_only: true,
    contract_only: true,
    read_only: true,
    read_only_to_operator_corpus: true,
    mutates_state: false,
    renderer_eligible: true,
    production_bucket_consumption: false,
    product_schema_used: false,
    product_schema_updated: false,
    fixture_schema_accepted_as_product_schema: false,
    operator_corpus_mutated: false,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    provider_packets: 0,
    discovery_pickup_started: false,
    discovery_pickup_packets_created: 0,
    pickup_packets_created: 0,
    pickup_units_created: 0,
    pickup_units_leased: 0,
    leases_created: 0,
    queue_items_created: 0,
    dispatcher_started: false,
    dispatch_runner_invoked: false,
    dispatcher_queue_lease_behavior: false,
    lease_queue_dispatcher_behavior: false,
    candidate_refs_emitted: 0,
    candidate_refs_written: 0,
    durable_discovery_refs_written: false,
    discovery_refs_written: false,
    discovered_killmail_refs_written: 0,
    discovery_refs_mutated: 0,
    evidence_created: false,
    evidence_written: false,
    evidence_rows_written: 0,
    evidence_writes: 0,
    hydration_created: false,
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
    schema_changes: 0,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    durable_bucket_rows_written: 0,
    fetch_runs_as_bucket_state: false,
    discovered_killmail_refs_as_bucket_state: false,
    external_io_posture: {
      state: externalIoState,
      external_io_is_provider_movement_gate: true,
      held_by_external_io_is_provider_movement_hold: true,
      held_by_external_io_is_watch_failure: false,
      held_by_external_io_is_persisted_bucket_status: false,
      external_io_on_starts_pickup: false,
      external_io_on_creates_catch_up_flood: false,
      provider_packets: 0,
      discovery_pickup_started: false,
      posture: externalIoState === 'off'
        ? 'held_by_external_io_provider_movement_hold_only'
        : 'released_to_future_pickup_eligibility_without_starting_pickup'
    },
    summary: {
      disposable_open_row_count: disposableRows.length,
      contract_row_count: contractRows.length,
      future_pickup_eligible_count: eligibleRows.length,
      held_by_external_io_count: heldRows.length,
      duplicate_idempotent_result_count: duplicateRows.length,
      integrity_conflict_or_error_count: conflictRows.length,
      rejected_source_row_count: rejectedSourceRows.length,
      rejected_before_pickup_consumption_count: rejectedRows.length,
      independent_overlap_count: overlapRows.length,
      provider_packets: 0,
      discovery_pickup_started: false,
      discovery_pickup_packets_created: 0,
      leases_created: 0,
      queue_items_created: 0,
      candidate_refs_written: 0,
      evidence_eveidence_writes: 0,
      watch_cadence_mutations: 0
    },
    pickup_contract_rows: contractRows,
    future_pickup_eligible_rows: eligibleRows,
    held_by_external_io_rows: heldRows,
    rejected_before_pickup_consumption_rows: rejectedRows,
    independent_overlap_rows: overlapRows,
    boundary_table_check: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after),
      fetch_runs_mutated: false,
      discovered_killmail_refs_mutated: false,
      killmails_mutated: false,
      activity_events_mutated: false,
      api_request_logs_mutated: false,
      data_quality_warnings_mutated: false,
      watch_cadence_rows_mutated: false,
      product_tables_mutated: false
    },
    accepted_model: {
      input_language: 'disposable_open_watch_bucket_fixture_rows',
      disposable_rows_are_fixture_only: true,
      open_disposable_rows_are_future_pickup_input_only: true,
      external_io_on_makes_rows_future_pickup_eligible_without_starting_pickup: true,
      external_io_off_holds_provider_movement_without_watch_failure: true,
      duplicate_idempotent_results_do_not_create_pickup_units: true,
      integrity_conflict_error_or_rejected_rows_do_not_become_pickup_input: true,
      overlapping_rows_from_different_watches_remain_independent: true,
      provider_packet_count_remains_zero: true,
      discovery_pickup_started_remains_false: true,
      lease_queue_dispatcher_behavior_remains_false: true,
      candidate_refs_are_not_emitted_or_written: true,
      evidence_eveidence_is_not_touched: true,
      schema_accepted_by_this_contract: false,
      runtime_behavior_changed_by_this_contract: false
    },
    boundary: [
      'Fixture-only Discovery pickup consumer hold contract proof.',
      'Consumes disposable open Watch bucket fixture rows as input language only.',
      'Future pickup eligible means later Discovery pickup could consume the row; this command does not start pickup, lease work, or create packets.',
      'External I/O off reports held_by_external_io as a provider movement hold only, not Watch failure and not persisted bucket status.',
      'Duplicate/idempotent, integrity conflict/error, and rejected source rows do not create pickup units.',
      'Overlapping open rows from different Watches remain independent candidates or holds.',
      'No production bucket consumption, providers, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, dispatcher, queue, lease, enforcement, schema, or UI behavior is opened.'
    ],
    does_not_do: [
      'does_not_update_src_main_db_schema_sql',
      'does_not_consume_production_bucket_rows',
      'does_not_mutate_operator_corpus',
      'does_not_start_discovery_pickup_or_create_provider_packets',
      'does_not_create_leases_queue_items_dispatcher_or_pickup_units',
      'does_not_emit_or_write_candidate_refs_discovery_refs_evidence_eveidence_hydration_observation_or_api_logs',
      'does_not_mutate_watch_rows_or_cadence',
      'does_not_use_fetch_runs_or_discovered_killmail_refs_as_bucket_state',
      'does_not_implement_runtime_enforcement_or_ui'
    ]
  };
}

function pickupRowFor(row, externalIoState) {
  const held = externalIoState === 'off';
  return {
    contract_row_language: 'discovery_pickup_consumer_hold_contract_fixture',
    disposable_fixture_row_id: row.disposable_fixture_row_id,
    fixture_state: row.fixture_state,
    product_schema_row: false,
    durable_product_row: false,
    watch_id: row.watch_id,
    watch_run_id: row.watch_run_id,
    source_kind: row.source_kind,
    pickup_contract_status: held ? 'held_by_external_io' : 'future_pickup_eligible',
    reason: held
      ? 'external_io_off_holds_provider_movement_before_discovery_pickup'
      : 'external_io_on_future_pickup_eligible_but_pickup_not_started',
    future_pickup_eligible: !held,
    held_by_external_io: held,
    held_is_failure: false,
    watch_failure: false,
    persisted_bucket_status: false,
    starts_discovery_pickup: false,
    discovery_pickup_started: false,
    discovery_pickup_packets_created: 0,
    provider_packets: 0,
    leases_created: 0,
    queue_items_created: 0,
    dispatcher_queue_lease_behavior: false,
    pickup_units_created: 0,
    candidate_refs_emitted: 0,
    candidate_refs_written: 0,
    evidence_eveidence_written: 0,
    hydration_writes: 0,
    observation_created: false,
    watch_cadence_mutated: false,
    accepted_scope: row.accepted_scope,
    identity: row.identity,
    provenance: row.provenance,
    window: row.window
  };
}

function rejectedRowFor(row) {
  const family = rejectionFamilyFor(row.persistence_result);
  return {
    contract_row_language: 'discovery_pickup_consumer_rejection_fixture',
    input_stub_id: row.input_stub_id || null,
    projected_bucket_candidate_id: row.projected_bucket_candidate_id || null,
    watch_id: row.watch_id ?? null,
    watch_run_id: row.watch_run_id || null,
    source_kind: row.source_kind || null,
    pickup_contract_status: family === 'duplicate_idempotent'
      ? 'not_pickup_input_duplicate_idempotent_result'
      : 'rejected_before_pickup_consumption',
    rejection_family: family,
    source_persistence_result: row.persistence_result,
    reason: row.reason || row.persistence_result || 'not_open_disposable_fixture_row',
    future_pickup_eligible: false,
    held_by_external_io: false,
    starts_discovery_pickup: false,
    discovery_pickup_started: false,
    discovery_pickup_packets_created: 0,
    provider_packets: 0,
    leases_created: 0,
    queue_items_created: 0,
    dispatcher_queue_lease_behavior: false,
    pickup_units_created: 0,
    candidate_refs_emitted: 0,
    candidate_refs_written: 0,
    evidence_eveidence_written: 0,
    hydration_writes: 0,
    observation_created: false,
    watch_cadence_mutated: false
  };
}

function rejectionFamilyFor(persistenceResult) {
  if (persistenceResult === 'idempotent_existing_open_disposable_fixture_row') {
    return 'duplicate_idempotent';
  }
  if (persistenceResult === 'integrity_conflict_no_second_open_row' || persistenceResult === 'integrity_error_rolled_back') {
    return 'integrity_conflict_or_error';
  }
  return 'rejected_source_row';
}

function independentOverlapRows(rows) {
  const overlaps = [];
  for (let leftIndex = 0; leftIndex < rows.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < rows.length; rightIndex += 1) {
      const left = rows[leftIndex];
      const right = rows[rightIndex];
      if (left.watch_id === right.watch_id) {
        continue;
      }
      const shared = intersection(left.accepted_scope?.included_system_ids, right.accepted_scope?.included_system_ids);
      if (!shared.length) {
        continue;
      }
      overlaps.push({
        overlap_status: 'independent_pickup_candidates_or_holds',
        reason: 'overlapping_scope_different_watch_intent_does_not_merge_pickup_contract',
        left_watch_id: left.watch_id,
        right_watch_id: right.watch_id,
        left_pickup_contract_status: left.pickup_contract_status,
        right_pickup_contract_status: right.pickup_contract_status,
        shared_system_ids: shared,
        suppresses_candidate: false,
        merges_pickup_contract: false,
        provider_packets: 0,
        writes: 0
      });
    }
  }
  return overlaps;
}

function normalizeDisposableRow(row = {}, index) {
  const acceptedScope = row.accepted_scope || {};
  return {
    disposable_fixture_row_id: row.disposable_fixture_row_id || `disposable-fixture-row-${index + 1}`,
    fixture_state: row.fixture_state || 'open',
    product_schema_row: false,
    durable_product_row: false,
    watch_id: Number(row.watch_id),
    watch_run_id: row.watch_run_id || null,
    source_kind: row.source_kind || 'watch_system_radius',
    accepted_scope: {
      ...acceptedScope,
      execution_authority: acceptedScope.execution_authority || 'stored_included_system_ids',
      included_system_ids: uniquePositiveIntegers(acceptedScope.included_system_ids || row.included_system_ids || []),
      center_radius_is_provenance_only: acceptedScope.center_radius_is_provenance_only !== false
    },
    identity: row.identity || {},
    provenance: row.provenance || {},
    window: row.window || {}
  };
}

function normalizePersistenceResult(row = {}, index) {
  return {
    input_stub_id: row.input_stub_id || null,
    projected_bucket_candidate_id: row.projected_bucket_candidate_id || `persistence-result-${index + 1}`,
    watch_id: Number.isFinite(Number(row.watch_id)) ? Number(row.watch_id) : null,
    watch_run_id: row.watch_run_id || null,
    source_kind: row.source_kind || 'watch_system_radius',
    persistence_result: row.persistence_result || 'rejected_before_disposable_persistence',
    reason: row.reason || null
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
  buildDiscoveryPickupConsumerHoldContractProof
};
