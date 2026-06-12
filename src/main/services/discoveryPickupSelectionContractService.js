const { buildWatchBucketProductPickupReadout } = require('./watchBucketProductPickupReadoutService');

const ACTION = 'discovery.pickup_selection_contract.preview';

function buildDiscoveryPickupSelectionContract(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const externalIoState = normalizeExternalIoState(input.externalIoState || input.external_io_state || 'off');
  const suppliedRows = input.productBucketPickupReadoutRows || input.product_bucket_pickup_readout_rows;
  const usesTrustedSuppliedRows = Array.isArray(suppliedRows) && context.trusted === true && context.source !== 'renderer';
  const sourceReadout = usesTrustedSuppliedRows
    ? trustedReadoutFromRows(suppliedRows, externalIoState)
    : buildWatchBucketProductPickupReadout(db, { externalIoState });
  const readoutRows = Array.isArray(sourceReadout.pickup_readout_rows) ? sourceReadout.pickup_readout_rows : [];
  const selectedRows = readoutRows
    .filter(isSelectableReadoutRow)
    .map(selectionCandidateFor);
  const excludedRows = readoutRows
    .filter((row) => !isSelectableReadoutRow(row))
    .map(excludedRowFor);
  const overlapRows = independentSelectionOverlaps(selectedRows);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Discovery pickup selection contract over product Watch bucket readout rows',
    contract_only: true,
    read_only: true,
    read_only_to_operator_corpus: true,
    mutates_state: false,
    renderer_eligible: true,
    product_bucket_readout_basis: true,
    product_schema_used: true,
    product_schema_updated: false,
    schema_changes: 0,
    operator_corpus_mutated: false,
    system_radius_only: true,
    actor_watch_migration: false,
    selection_creates_pickup_units: false,
    production_pickup_execution: false,
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
    durable_discovery_task_rows_written: 0,
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
    receipt_mutations: 0,
    watch_bucket_status_mutations: 0,
    watch_executor_tick_called: false,
    task_runner_methods_called: [],
    collectors_called: false,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    fetch_runs_as_bucket_state: false,
    discovered_killmail_refs_as_bucket_state: false,
    external_io_posture: {
      state: externalIoState,
      external_io_is_provider_movement_gate: true,
      held_by_external_io_rows_selected: false,
      external_io_on_starts_pickup: false,
      external_io_on_creates_catch_up_flood: false,
      provider_packets: 0,
      discovery_pickup_started: false
    },
    input_authority: {
      product_readout_rows_from_db: !usesTrustedSuppliedRows,
      trusted_supplied_rows_used: usesTrustedSuppliedRows,
      renderer_supplied_rows_authoritative: false
    },
    summary: {
      product_readout_row_count: readoutRows.length,
      selected_candidate_count: selectedRows.length,
      excluded_row_count: excludedRows.length,
      held_excluded_count: excludedRows.filter((row) => row.exclusion_family === 'held_by_external_io').length,
      rejected_excluded_count: excludedRows.filter((row) => row.exclusion_family === 'rejected_before_pickup_consumption').length,
      not_input_excluded_count: excludedRows.filter((row) => row.exclusion_family === 'not_pickup_input').length,
      actor_excluded_count: excludedRows.filter((row) => row.reason === 'actor_watch_bucket_rows_are_parked_for_pickup_readout').length,
      non_open_excluded_count: excludedRows.filter((row) => row.reason === 'bucket_status_is_not_open').length,
      malformed_or_missing_scope_excluded_count: excludedRows.filter((row) => row.rejection_family === 'invalid_or_missing_accepted_scope').length,
      independent_overlap_count: overlapRows.length,
      pickup_units_created: 0,
      provider_packets: 0,
      discovery_pickup_started: false,
      discovery_pickup_packets_created: 0,
      leases_created: 0,
      queue_items_created: 0,
      candidate_refs_written: 0,
      discovery_refs_written: false,
      evidence_eveidence_writes: 0,
      hydration_writes: 0,
      observation_created: false,
      watch_cadence_mutations: 0,
      receipt_mutations: 0,
      watch_bucket_status_mutations: 0
    },
    selection_candidates: selectedRows,
    excluded_rows: excludedRows,
    independent_overlap_rows: overlapRows,
    source_readout_summary: sourceReadout.summary || null,
    boundary_table_check: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after),
      watch_bucket_items_mutated: false,
      fetch_runs_mutated: false,
      discovered_killmail_refs_mutated: false,
      killmails_mutated: false,
      activity_events_mutated: false,
      api_request_logs_mutated: false,
      data_quality_warnings_mutated: false,
      metadata_runs_mutated: false,
      watch_cadence_rows_mutated: false,
      receipt_rows_mutated: false,
      product_tables_mutated: false
    },
    accepted_model: {
      input_language: 'product_watch_bucket_pickup_readout_rows',
      selects_future_pickup_eligible_only: true,
      selected_rows_are_future_discovery_pickup_input_only: true,
      selected_rows_are_not_provider_packets: true,
      selected_rows_are_not_pickup_units: true,
      held_rows_are_not_selected: true,
      rejected_rows_are_not_selected: true,
      not_pickup_input_rows_are_not_selected: true,
      actor_rows_are_not_selected: true,
      non_open_rows_are_not_selected: true,
      malformed_or_missing_scope_rows_are_not_selected: true,
      overlapping_watch_intents_remain_independent_selection_candidates: true,
      pickup_started_by_this_contract: false,
      provider_packet_count_remains_zero: true,
      candidate_refs_are_not_emitted_or_written: true,
      evidence_eveidence_is_not_touched: true,
      watch_cadence_is_not_mutated: true,
      bucket_status_is_not_mutated: true,
      receipt_is_not_mutated: true,
      schema_accepted_by_this_contract: false,
      runtime_behavior_changed_by_this_contract: false
    },
    boundary: [
      'Read-only Discovery pickup selection contract over eligible product Watch bucket readout rows.',
      'Selection candidates are future Discovery pickup input only, not pickup units, leases, queue items, provider packets, or durable task rows.',
      'Only future_pickup_eligible open system/radius rows are selected.',
      'Held, rejected, not-input, actor, non-open, and malformed/missing-scope rows are excluded with reasons.',
      'No Discovery pickup execution, providers, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema, enforcement, or UI behavior is opened.'
    ],
    does_not_do: [
      'does_not_update_src_main_db_schema_sql',
      'does_not_start_discovery_pickup_or_create_provider_packets',
      'does_not_create_pickup_units_leases_queue_items_dispatcher_or_durable_discovery_tasks',
      'does_not_emit_or_write_candidate_refs_discovery_refs_evidence_eveidence_hydration_observation_or_api_logs',
      'does_not_mutate_watch_bucket_status_or_receipts',
      'does_not_mutate_watch_rows_or_cadence',
      'does_not_use_fetch_runs_or_discovered_killmail_refs_as_bucket_state',
      'does_not_migrate_actor_watch',
      'does_not_implement_runtime_enforcement_or_ui'
    ]
  };
}

function isSelectableReadoutRow(row = {}) {
  return row.pickup_readout_status === 'future_pickup_eligible'
    && row.bucket_status === 'open'
    && row.watch_type === 'system_radius'
    && row.source_kind === 'watch_system_radius'
    && row.scope_posture?.valid === true;
}

function selectionCandidateFor(row = {}) {
  return {
    selection_contract_status: 'selected_future_discovery_pickup_input',
    discovery_pickup_input_candidate: true,
    future_only: true,
    product_schema_row: row.product_schema_row === true,
    bucket_item_id: row.bucket_item_id,
    watch_run_id: row.watch_run_id,
    watch_type: row.watch_type,
    watch_id: row.watch_id,
    source_kind: row.source_kind,
    bucket_status: row.bucket_status,
    accepted_scope: row.accepted_scope,
    scope_posture: row.scope_posture,
    window: row.window,
    caps: row.caps,
    provenance: {
      ...(row.provenance || {}),
      selection_source_action: ACTION,
      source_pickup_readout_status: row.pickup_readout_status
    },
    provider_posture_basis: {
      source_readout_status: row.pickup_readout_status,
      source_reason: row.reason,
      external_io_held: false,
      provider_packets: 0,
      discovery_pickup_started: false
    },
    starts_discovery_pickup: false,
    creates_pickup_unit: false,
    creates_provider_packet: false,
    creates_candidate_ref: false,
    mutates_bucket_row: false,
    mutates_receipt: false,
    provider_packets: 0,
    discovery_pickup_packets_created: 0,
    pickup_units_created: 0,
    leases_created: 0,
    queue_items_created: 0,
    candidate_refs_emitted: 0,
    candidate_refs_written: 0,
    discovery_refs_written: false,
    evidence_eveidence_written: 0,
    hydration_writes: 0,
    observation_created: false,
    watch_cadence_mutated: false,
    bucket_status_mutated: false,
    receipt_mutated: false
  };
}

function excludedRowFor(row = {}) {
  return {
    selection_contract_status: 'excluded_from_discovery_pickup_selection',
    discovery_pickup_input_candidate: false,
    product_schema_row: row.product_schema_row === true,
    bucket_item_id: row.bucket_item_id,
    watch_run_id: row.watch_run_id,
    watch_type: row.watch_type,
    watch_id: row.watch_id,
    source_kind: row.source_kind,
    bucket_status: row.bucket_status,
    source_pickup_readout_status: row.pickup_readout_status || null,
    exclusion_family: exclusionFamilyFor(row),
    rejection_family: row.rejection_family || null,
    reason: row.reason || 'not_future_pickup_eligible',
    accepted_scope: row.accepted_scope,
    scope_posture: row.scope_posture || null,
    window: row.window,
    caps: row.caps,
    provenance: row.provenance,
    starts_discovery_pickup: false,
    creates_pickup_unit: false,
    creates_provider_packet: false,
    creates_candidate_ref: false,
    mutates_bucket_row: false,
    mutates_receipt: false,
    provider_packets: 0,
    discovery_pickup_packets_created: 0,
    pickup_units_created: 0,
    leases_created: 0,
    queue_items_created: 0,
    candidate_refs_emitted: 0,
    candidate_refs_written: 0,
    discovery_refs_written: false,
    evidence_eveidence_written: 0,
    hydration_writes: 0,
    observation_created: false,
    watch_cadence_mutated: false,
    bucket_status_mutated: false,
    receipt_mutated: false
  };
}

function exclusionFamilyFor(row = {}) {
  if (row.pickup_readout_status === 'held_by_external_io') {
    return 'held_by_external_io';
  }
  if (row.pickup_readout_status === 'rejected_before_pickup_consumption') {
    return 'rejected_before_pickup_consumption';
  }
  if (row.pickup_readout_status === 'not_pickup_input') {
    return 'not_pickup_input';
  }
  return 'not_future_pickup_eligible';
}

function independentSelectionOverlaps(rows) {
  const overlaps = [];
  for (let leftIndex = 0; leftIndex < rows.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < rows.length; rightIndex += 1) {
      const left = rows[leftIndex];
      const right = rows[rightIndex];
      if (left.watch_id === right.watch_id) {
        continue;
      }
      const shared = intersection(left.scope_posture?.included_system_ids, right.scope_posture?.included_system_ids);
      if (!shared.length) {
        continue;
      }
      overlaps.push({
        overlap_status: 'independent_discovery_pickup_selection_candidates',
        reason: 'overlapping_scope_different_watch_intent_does_not_merge_selection_contract',
        left_watch_id: left.watch_id,
        right_watch_id: right.watch_id,
        left_watch_run_id: left.watch_run_id,
        right_watch_run_id: right.watch_run_id,
        shared_system_ids: shared,
        merges_selection_candidate: false,
        suppresses_candidate: false,
        provider_packets: 0,
        writes: 0
      });
    }
  }
  return overlaps;
}

function trustedReadoutFromRows(rows, externalIoState) {
  return {
    action: 'trusted_supplied_product_bucket_pickup_readout_rows',
    external_io_posture: {
      state: externalIoState
    },
    pickup_readout_rows: rows,
    summary: {
      product_readout_row_count: rows.length
    }
  };
}

function stateSnapshot(db) {
  return {
    watch_bucket_items: count(db, 'watch_bucket_items'),
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

function intersection(left = [], right = []) {
  const rightSet = new Set(right || []);
  return (left || []).filter((value) => rightSet.has(value));
}

function normalizeExternalIoState(state) {
  return state === 'on' ? 'on' : 'off';
}

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  buildDiscoveryPickupSelectionContract
};
