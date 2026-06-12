const { WatchBucketRepository } = require('../db/watchBucketRepository');

const ACTION = 'watch.bucket_product_pickup_readout.preview';

function buildWatchBucketProductPickupReadout(db, input = {}) {
  const before = stateSnapshot(db);
  const externalIoState = normalizeExternalIoState(input.externalIoState || input.external_io_state || 'off');
  const rows = new WatchBucketRepository(db).listItems();
  const readoutRows = rows.map((row) => classifyBucketRow(row, externalIoState));
  const openSystemRows = readoutRows.filter((row) => row.row_focus === 'open_system_radius');
  const eligibleRows = readoutRows.filter((row) => row.pickup_readout_status === 'future_pickup_eligible');
  const heldRows = readoutRows.filter((row) => row.pickup_readout_status === 'held_by_external_io');
  const rejectedRows = readoutRows.filter((row) => row.pickup_readout_status === 'rejected_before_pickup_consumption');
  const notInputRows = readoutRows.filter((row) => row.pickup_readout_status === 'not_pickup_input');
  const overlapRows = independentOverlapRows([...eligibleRows, ...heldRows]);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only product Watch bucket pickup readout',
    product_bucket_readout: true,
    fixture_only: false,
    read_only: true,
    read_only_to_operator_corpus: true,
    mutates_state: false,
    renderer_eligible: true,
    production_bucket_consumption: false,
    product_schema_used: true,
    product_schema_updated: false,
    schema_changes: 0,
    operator_corpus_mutated: false,
    system_radius_only: true,
    actor_watch_migration: false,
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
      external_io_blocks_watch_emission: false,
      held_by_external_io_is_provider_movement_hold: true,
      held_by_external_io_is_watch_failure: false,
      held_by_external_io_is_persisted_bucket_status: false,
      external_io_on_starts_pickup: false,
      external_io_on_creates_catch_up_flood: false,
      provider_packets: 0,
      discovery_pickup_started: false
    },
    summary: {
      product_bucket_row_count: rows.length,
      open_system_radius_row_count: openSystemRows.length,
      future_pickup_eligible_count: eligibleRows.length,
      held_by_external_io_count: heldRows.length,
      rejected_before_pickup_consumption_count: rejectedRows.length,
      not_pickup_input_count: notInputRows.length,
      unsupported_actor_row_count: readoutRows.filter((row) => row.reason === 'actor_watch_bucket_rows_are_parked_for_pickup_readout').length,
      non_open_row_count: readoutRows.filter((row) => row.reason === 'bucket_status_is_not_open').length,
      malformed_or_missing_scope_count: rejectedRows.filter((row) => row.rejection_family === 'invalid_or_missing_accepted_scope').length,
      independent_overlap_count: overlapRows.length,
      provider_packets: 0,
      discovery_pickup_started: false,
      discovery_pickup_packets_created: 0,
      leases_created: 0,
      queue_items_created: 0,
      candidate_refs_written: 0,
      evidence_eveidence_writes: 0,
      hydration_writes: 0,
      observation_created: false,
      watch_cadence_mutations: 0,
      receipt_mutations: 0,
      watch_bucket_status_mutations: 0
    },
    pickup_readout_rows: readoutRows,
    future_pickup_eligible_rows: eligibleRows,
    held_by_external_io_rows: heldRows,
    rejected_before_pickup_consumption_rows: rejectedRows,
    not_pickup_input_rows: notInputRows,
    independent_overlap_rows: overlapRows,
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
      input_language: 'product_watch_bucket_items_rows',
      reads_real_product_bucket_rows: true,
      open_system_radius_rows_are_future_pickup_input_only: true,
      external_io_on_makes_rows_future_pickup_eligible_without_starting_pickup: true,
      external_io_off_holds_provider_movement_without_watch_failure: true,
      held_by_external_io_is_not_persisted_bucket_lifecycle_status: true,
      unsupported_actor_rows_do_not_become_pickup_input: true,
      non_open_rows_do_not_become_pickup_input: true,
      malformed_or_missing_scope_rows_reject_before_pickup_consumption: true,
      overlapping_rows_from_different_watches_remain_independent: true,
      provider_packet_count_remains_zero: true,
      discovery_pickup_started_remains_false: true,
      candidate_refs_are_not_emitted_or_written: true,
      evidence_eveidence_is_not_touched: true,
      watch_cadence_is_not_mutated: true,
      receipt_is_not_mutated: true,
      schema_accepted_by_this_readout: false,
      runtime_behavior_changed_by_this_readout: false
    },
    boundary: [
      'Read-only product Watch bucket pickup readout over watch_bucket_items rows.',
      'Open system/radius rows are classified as future pickup eligible or held by External I/O, but pickup does not start.',
      'External I/O off is a provider movement hold only, not Watch failure and not a persisted bucket lifecycle status.',
      'Actor, non-open, malformed, and missing-scope rows do not become pickup input.',
      'No Discovery pickup, leases, dispatcher, provider packets, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, receipt mutation, schema, enforcement, or UI behavior is opened.'
    ],
    does_not_do: [
      'does_not_update_src_main_db_schema_sql',
      'does_not_start_discovery_pickup_or_create_provider_packets',
      'does_not_create_leases_queue_items_dispatcher_or_pickup_units',
      'does_not_emit_or_write_candidate_refs_discovery_refs_evidence_eveidence_hydration_observation_or_api_logs',
      'does_not_mutate_watch_bucket_status_or_receipts',
      'does_not_mutate_watch_rows_or_cadence',
      'does_not_use_fetch_runs_or_discovered_killmail_refs_as_bucket_state',
      'does_not_migrate_actor_watch',
      'does_not_implement_runtime_enforcement_or_ui'
    ]
  };
}

function classifyBucketRow(row, externalIoState) {
  const base = rowBase(row);
  if (row.status !== 'open') {
    return {
      ...base,
      row_focus: 'not_open',
      pickup_readout_status: 'not_pickup_input',
      reason: 'bucket_status_is_not_open',
      future_pickup_eligible: false,
      held_by_external_io: false
    };
  }
  if (row.watch_type !== 'system_radius' || row.source_kind !== 'watch_system_radius') {
    return {
      ...base,
      row_focus: 'unsupported_watch_type',
      pickup_readout_status: 'not_pickup_input',
      reason: 'actor_watch_bucket_rows_are_parked_for_pickup_readout',
      future_pickup_eligible: false,
      held_by_external_io: false
    };
  }

  const scope = acceptedScopePosture(row);
  if (!scope.valid) {
    return {
      ...base,
      row_focus: 'open_system_radius',
      pickup_readout_status: 'rejected_before_pickup_consumption',
      rejection_family: 'invalid_or_missing_accepted_scope',
      reason: scope.reason,
      future_pickup_eligible: false,
      held_by_external_io: false,
      scope_posture: scope
    };
  }

  const held = externalIoState === 'off';
  return {
    ...base,
    row_focus: 'open_system_radius',
    pickup_readout_status: held ? 'held_by_external_io' : 'future_pickup_eligible',
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
    receipt_mutated: false,
    scope_posture: scope
  };
}

function rowBase(row = {}) {
  return {
    product_schema_row: true,
    bucket_item_id: row.bucket_item_id,
    watch_run_id: row.watch_run_id,
    watch_type: row.watch_type,
    watch_id: row.watch_id,
    source_kind: row.source_kind,
    bucket_status: row.status,
    emitted_at: row.emitted_at,
    updated_at: row.updated_at,
    identity_fingerprint: row.identity_fingerprint,
    persisted_pickup_posture: row.pickup_posture || null,
    persisted_receipt_status: row.receipt_status || null,
    accepted_scope: row.accepted_scope,
    window: row.window,
    caps: row.caps,
    provenance: row.provenance,
    provider_packets: 0,
    discovery_pickup_started: false,
    candidate_refs_written: 0,
    evidence_eveidence_written: 0,
    hydration_writes: 0,
    observation_created: false,
    watch_cadence_mutated: false,
    receipt_mutated: false
  };
}

function acceptedScopePosture(row = {}) {
  if (!isValidJsonObject(row.accepted_scope_json)) {
    return {
      valid: false,
      reason: 'accepted_scope_json_malformed_or_unparseable',
      execution_authority: null,
      included_system_ids: []
    };
  }
  const scope = row.accepted_scope || {};
  const included = Array.isArray(scope.included_system_ids) ? scope.included_system_ids : [];
  const validIds = uniquePositiveIntegers(included);
  if (scope.execution_authority !== 'stored_included_system_ids') {
    return {
      valid: false,
      reason: 'accepted_scope_execution_authority_missing_or_not_stored_included_system_ids',
      execution_authority: scope.execution_authority || null,
      included_system_ids: validIds
    };
  }
  if (!included.length || validIds.length !== included.length) {
    return {
      valid: false,
      reason: 'accepted_scope_included_system_ids_missing_or_invalid',
      execution_authority: scope.execution_authority,
      included_system_ids: validIds
    };
  }
  return {
    valid: true,
    reason: 'accepted_stored_system_scope',
    execution_authority: scope.execution_authority,
    included_system_ids: validIds,
    center_radius_is_provenance_only: scope.center_radius_is_provenance_only !== false,
    center_radius_used_as_execution_authority: scope.center_radius_used_as_execution_authority === true
  };
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
      const shared = intersection(left.scope_posture?.included_system_ids, right.scope_posture?.included_system_ids);
      if (!shared.length) {
        continue;
      }
      overlaps.push({
        overlap_status: 'independent_product_bucket_pickup_rows',
        reason: 'overlapping_scope_different_watch_intent_does_not_merge_pickup_readout',
        left_watch_id: left.watch_id,
        right_watch_id: right.watch_id,
        left_pickup_readout_status: left.pickup_readout_status,
        right_pickup_readout_status: right.pickup_readout_status,
        shared_system_ids: shared,
        suppresses_candidate: false,
        merges_pickup_readout: false,
        provider_packets: 0,
        writes: 0
      });
    }
  }
  return overlaps;
}

function isValidJsonObject(value) {
  if (!value) {
    return false;
  }
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed);
  } catch {
    return false;
  }
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

function normalizeExternalIoState(state) {
  return state === 'on' ? 'on' : 'off';
}

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  buildWatchBucketProductPickupReadout
};
