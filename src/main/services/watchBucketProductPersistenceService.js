const { buildWatchScheduleStatus } = require('../watchlist/watchScheduler');
const { WatchBucketRepository } = require('../db/watchBucketRepository');

const ACTION = 'watch.bucket_product_persistence.emit';

function buildWatchBucketProductPersistenceProof(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const externalIoState = normalizeExternalIoState(input.externalIoState || input.external_io_state || 'off');
  const repository = new WatchBucketRepository(db);
  const emissions = emissionBasisRows(db, input, context, now);
  const persistenceResults = emissions.map((emission) => repository.persistOpenItem(emission));
  const openItems = repository.listOpenItems('system_radius');
  const after = stateSnapshot(db);
  const changed = diffCounts(before, after);

  return {
    action: ACTION,
    classification: 'trusted product Watch bucket persistence for system/radius emitted work identity',
    product_persistence: true,
    fixture_only: false,
    read_only: false,
    mutates_state: true,
    trusted_local_service_only: true,
    renderer_eligible: false,
    system_radius_only: true,
    actor_watch_migration: false,
    production_bucket_consumption: false,
    operator_corpus_mutated: changed.watch_bucket_items > 0,
    operator_corpus_mutation_scope: 'watch_bucket_items_only',
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    provider_packets: 0,
    discovery_pickup_started: false,
    discovery_pickup_packets_created: 0,
    pickup_packets_created: 0,
    leases_created: 0,
    queue_items_created: 0,
    dispatcher_started: false,
    dispatcher_queue_lease_behavior: false,
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
    schema_changes_by_service: 0,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    fetch_runs_as_bucket_state: false,
    discovered_killmail_refs_as_bucket_state: false,
    external_io_posture: {
      state: externalIoState,
      bucket_row_creation_blocked: false,
      external_io_is_provider_movement_gate: true,
      held_by_external_io_persisted_as_bucket_status: false,
      pickup_posture_when_closed: externalIoState === 'off' ? 'held_by_external_io' : 'future_pickup_eligible',
      provider_packets: 0,
      discovery_pickup_started: false
    },
    summary: {
      emission_basis_count: emissions.length,
      inserted_open_bucket_item_count: persistenceResults.filter((row) => row.persistence_result === 'inserted_open_bucket_item').length,
      idempotent_existing_open_count: persistenceResults.filter((row) => row.persistence_result === 'idempotent_existing_open_bucket_item').length,
      integrity_conflict_count: persistenceResults.filter((row) => row.persistence_result === 'integrity_conflict_existing_open_bucket_item').length,
      integrity_error_count: persistenceResults.filter((row) => row.persistence_result === 'integrity_error_watch_run_id_mismatch').length,
      open_bucket_item_count: openItems.length,
      stale_current_open_item_count: openItems.filter((row) => row.provenance?.missed_intervals_collapsed_to_current_candidate === true).length,
      catch_up_rows_created: 0,
      overlapping_open_item_pairs: overlappingOpenPairs(openItems).length,
      watch_bucket_items_delta: changed.watch_bucket_items,
      provider_packets: 0,
      discovery_pickup_packets_created: 0,
      candidate_refs_written: 0,
      evidence_eveidence_writes: 0,
      watch_cadence_mutations: 0
    },
    emitted_basis_rows: emissions.map(compactEmission),
    persistence_results: persistenceResults,
    open_bucket_items: openItems.map(compactBucketItem),
    overlapping_open_items: overlappingOpenPairs(openItems),
    boundary_table_check: {
      before,
      after,
      changed,
      only_watch_bucket_items_changed: Object.entries(changed).every(([name, delta]) => (
        name === 'watch_bucket_items' ? delta >= 0 : delta === 0
      )),
      fetch_runs_mutated: changed.fetch_runs !== 0,
      discovered_killmail_refs_mutated: changed.discovered_killmail_refs !== 0,
      killmails_mutated: changed.killmails !== 0,
      activity_events_mutated: changed.activity_events !== 0,
      api_request_logs_mutated: changed.api_request_logs !== 0,
      data_quality_warnings_mutated: changed.data_quality_warnings !== 0,
      watch_cadence_rows_mutated: false
    },
    accepted_model: {
      product_bucket_table: 'watch_bucket_items',
      first_writer_scope: 'system_radius_only',
      one_open_item_per_watch: true,
      watch_run_id_generated_by_trusted_local_service: true,
      accepted_scope_snapshot_source: 'system_watches.included_system_ids',
      external_io_off_does_not_block_bucket_creation: true,
      held_by_external_io_is_pickup_posture_not_bucket_status: true,
      missed_intervals_collapse_to_current_open_item: true,
      overlapping_system_scope_across_different_watches_allowed: true,
      fetch_runs_are_not_bucket_state: true,
      discovered_killmail_refs_are_not_pre_acquisition_bucket_state: true,
      evidence_eveidence_is_not_touched: true,
      discovery_pickup_execution_opened: false,
      provider_movement_opened: false,
      actor_watch_migration_opened: false
    },
    boundary: [
      'Trusted product Watch bucket persistence for system/radius emitted work identity only.',
      'Bucket rows come from local Watch emission basis, not renderer-authored bucket payloads.',
      'Creates or reads open watch_bucket_items rows and enforces one open item per Watch.',
      'External I/O off does not block bucket row creation; it remains provider movement posture only.',
      'No Discovery pickup, provider packets, candidate refs, Evidence/EVEidence, Hydration, Observation, dispatcher, queue, lease, Watch cadence mutation, actor Watch migration, runtime enforcement, or UI behavior is opened.'
    ],
    does_not_do: [
      'does_not_use_fetch_runs_as_bucket_state',
      'does_not_use_discovered_killmail_refs_as_pre_acquisition_bucket_state',
      'does_not_start_discovery_pickup_or_create_provider_packets',
      'does_not_create_leases_queue_items_or_dispatcher_runtime',
      'does_not_write_candidate_refs_discovery_refs_evidence_eveidence_hydration_observation_or_api_logs',
      'does_not_mutate_watch_rows_or_cadence',
      'does_not_change_actor_watch_runtime_or_collect_actor_watch',
      'does_not_implement_runtime_enforcement_or_ui'
    ]
  };
}

function emissionBasisRows(db, input, context, now) {
  const trustedBasis = input.trustedLocalEmissionBasis || input.trusted_local_emission_basis;
  if (Array.isArray(trustedBasis)) {
    if (context.source === 'renderer' || context.trusted !== true) {
      throw new Error('trusted local emission basis requires non-renderer trusted context');
    }
    return trustedBasis.map((basis) => normalizeTrustedBasis(basis, now));
  }
  const schedule = buildWatchScheduleStatus(db, {
    now,
    sessionArmed: true,
    liveApiEnabled: true
  });
  return schedule.watches
    .filter((watch) => watch.watch_type === 'system_radius')
    .map((watch) => emissionForWatch(watch, now))
    .filter(Boolean);
}

function emissionForWatch(watch, now) {
  const source = watch.source || {};
  const scope = acceptedScopeFor(source);
  if (watch.scheduler_state !== 'due' || !scope.accepted) {
    return null;
  }
  const lookbackSeconds = positiveNumber(source.lookback_hours, 24) * 3600;
  const maxExpansions = positiveNumber(source.max_killmails_per_run, 1);
  const dueAt = watch.next_poll_at || now;
  const stale = Boolean(watch.next_poll_at && watch.next_poll_at < now);
  const included = scope.included_system_ids;
  return {
    watch_type: 'system_radius',
    watch_id: watch.watch_id,
    source_kind: 'watch_system_radius',
    emitted_at: now,
    accepted_scope: {
      execution_authority: 'stored_included_system_ids',
      included_system_ids: included,
      center_system_id: source.center_system_id ?? null,
      center_system_name: source.center_system_name || null,
      radius_jumps: source.radius_jumps ?? null,
      center_radius_is_provenance_only: true,
      center_radius_used_as_execution_authority: false
    },
    window: {
      lookback_seconds: lookbackSeconds,
      due_at: dueAt,
      emitted_at: now
    },
    caps: {
      max_systems: included.length,
      max_refs_per_system: Math.max(1, Math.ceil(maxExpansions / Math.max(included.length, 1))),
      max_expansions: maxExpansions
    },
    provenance: {
      source_action: ACTION,
      source_intent: 'Watch/system-radius',
      scope_provenance: 'system_watches.included_system_ids',
      watch_scope_key: watch.scope_key,
      scheduler_state: watch.scheduler_state,
      center_radius_role: 'provenance_and_explanation',
      missed_intervals_collapsed_to_current_candidate: stale,
      catch_up_rows_created: 0
    },
    pickup_posture: null
  };
}

function normalizeTrustedBasis(basis = {}, now) {
  const window = basis.window || {};
  const watchType = basis.watch_type || 'system_radius';
  const sourceKind = basis.source_kind || 'watch_system_radius';
  if (watchType !== 'system_radius' || sourceKind !== 'watch_system_radius') {
    throw new Error('watch_bucket_product_persistence_supports_system_radius_only');
  }
  return {
    watch_type: watchType,
    watch_id: Number(basis.watch_id),
    watch_run_id: basis.watch_run_id || null,
    source_kind: sourceKind,
    emitted_at: basis.emitted_at || window.emitted_at || now,
    accepted_scope: basis.accepted_scope || {},
    window: {
      ...window,
      emitted_at: window.emitted_at || basis.emitted_at || now
    },
    caps: basis.caps || {},
    provenance: basis.provenance || {},
    pickup_posture: basis.pickup_posture || null
  };
}

function acceptedScopeFor(source = {}) {
  const status = source.included_system_scope_status || 'not_stored';
  const raw = Array.isArray(source.included_system_ids) ? source.included_system_ids : [];
  const parseable = raw.map(Number).filter(Number.isFinite);
  const everyValid = raw.every((value) => Number.isFinite(Number(value)));
  const unique = [...new Set(parseable)];
  if (status !== 'valid' || !raw.length || !everyValid || unique.length !== raw.length) {
    return {
      accepted: false,
      included_system_ids: []
    };
  }
  return {
    accepted: true,
    included_system_ids: unique.sort((left, right) => left - right)
  };
}

function compactEmission(row = {}) {
  return {
    watch_type: row.watch_type,
    watch_id: row.watch_id,
    source_kind: row.source_kind,
    accepted_scope: row.accepted_scope,
    window: row.window,
    caps: row.caps,
    provenance: row.provenance,
    provider_packets: 0,
    discovery_pickup_started: false,
    evidence_eveidence_written: 0,
    watch_cadence_mutated: false
  };
}

function compactBucketItem(row = {}) {
  return {
    bucket_item_id: row.bucket_item_id,
    watch_run_id: row.watch_run_id,
    watch_type: row.watch_type,
    watch_id: row.watch_id,
    source_kind: row.source_kind,
    status: row.status,
    emitted_at: row.emitted_at,
    updated_at: row.updated_at,
    accepted_scope: row.accepted_scope,
    window: row.window,
    caps: row.caps,
    provenance: row.provenance,
    pickup_posture: row.pickup_posture || null,
    provider_packets: 0,
    discovery_pickup_started: false,
    candidate_refs_written: 0,
    evidence_eveidence_written: 0
  };
}

function overlappingOpenPairs(rows) {
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
        overlap_status: 'coexisting_product_bucket_rows_for_different_watch_intent',
        left_watch_id: left.watch_id,
        right_watch_id: right.watch_id,
        shared_system_ids: shared,
        merges_identity: false,
        suppresses_row: false,
        provider_packets: 0,
        writes_outside_watch_bucket_items: 0
      });
    }
  }
  return overlaps;
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

function diffCounts(before, after) {
  const diff = {};
  for (const key of Object.keys(after)) {
    diff[key] = Number(after[key] || 0) - Number(before[key] || 0);
  }
  return diff;
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
}

function intersection(left = [], right = []) {
  const rightSet = new Set(right || []);
  return (left || []).filter((value) => rightSet.has(value));
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeExternalIoState(state) {
  return state === 'on' ? 'on' : 'off';
}

module.exports = {
  buildWatchBucketProductPersistenceProof
};
