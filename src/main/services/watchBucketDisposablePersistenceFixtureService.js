const ACTION = 'watch.bucket_disposable_persistence_fixture.preview';

function buildWatchBucketDisposablePersistenceFixtureProof(db, input = {}) {
  const before = stateSnapshot(db);
  const externalIoState = normalizeExternalIoState(input.externalIoState || input.external_io_state || 'off');
  const candidates = arrayInput(input.projectedBucketCandidates, input.projected_bucket_candidates)
    .map((candidate, index) => normalizeCandidate(candidate, index));
  const rejectedSourceRows = arrayInput(input.rejectedSourceRows, input.rejected_source_rows)
    .map((row, index) => normalizeRejectedSource(row, index));
  const disposableStore = createDisposableStore();
  const persistenceResults = [];

  for (const candidate of candidates) {
    persistenceResults.push(persistCandidate(disposableStore, candidate));
  }
  for (const row of rejectedSourceRows) {
    persistenceResults.push(rejectSourceRow(row));
  }

  const openRows = disposableStore.rows.filter((row) => row.fixture_state === 'open');
  const overlappingRows = overlapRowsFor(openRows);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'fixture-only disposable Watch bucket persistence proof',
    fixture_only: true,
    disposable_only: true,
    projection_only: false,
    read_only_to_operator_corpus: true,
    read_only: true,
    mutates_state: false,
    renderer_eligible: true,
    product_schema_used: false,
    product_schema_updated: false,
    fixture_schema_accepted_as_product_schema: false,
    operator_corpus_mutated: false,
    provider_calls: 0,
    live_api_calls: 0,
    provider_packets: 0,
    discovery_pickup_started: false,
    discovery_pickup_packets_created: 0,
    pickup_packets_created: 0,
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
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    durable_bucket_rows_written: 0,
    fetch_runs_as_bucket_state: false,
    discovered_killmail_refs_as_bucket_state: false,
    external_io_posture: {
      state: externalIoState,
      disposable_persistence_blocked: false,
      external_io_is_provider_movement_gate: true,
      provider_packets: 0,
      discovery_pickup_started: false,
      posture: externalIoState === 'off'
        ? 'external_io_off_does_not_block_disposable_bucket_persistence'
        : 'external_io_on_does_not_start_discovery_pickup'
    },
    summary: {
      attempted_candidate_count: candidates.length,
      rejected_source_row_count: rejectedSourceRows.length,
      disposable_open_row_count: openRows.length,
      inserted_count: persistenceResults.filter((row) => row.persistence_result === 'inserted_open_disposable_fixture_row').length,
      idempotent_noop_count: persistenceResults.filter((row) => row.persistence_result === 'idempotent_existing_open_disposable_fixture_row').length,
      integrity_conflict_count: persistenceResults.filter((row) => row.persistence_result === 'integrity_conflict_no_second_open_row').length,
      integrity_error_count: persistenceResults.filter((row) => row.persistence_result === 'integrity_error_rolled_back').length,
      rejected_before_persistence_count: persistenceResults.filter((row) => row.persistence_result === 'rejected_before_disposable_persistence').length,
      stale_current_open_row_count: openRows.filter((row) => row.missed_intervals_collapsed_to_current_candidate).length,
      catch_up_rows_created: 0,
      overlapping_open_row_pairs: overlappingRows.length,
      provider_packets: 0,
      discovery_pickup_packets_created: 0,
      candidate_refs_written: 0,
      evidence_eveidence_writes: 0,
      watch_cadence_mutations: 0
    },
    disposable_fixture_rows: openRows,
    persistence_results: persistenceResults,
    overlapping_fixture_rows: overlappingRows,
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
      watch_cadence_rows_mutated: false
    },
    accepted_model: {
      disposable_fixture_only: true,
      one_open_stub_per_watch: true,
      duplicate_same_watch_same_identity_is_idempotent: true,
      same_watch_different_open_identity_is_integrity_conflict: true,
      same_watch_run_id_mismatched_scope_or_provenance_is_integrity_error: true,
      missed_intervals_collapse_to_current_open_row: true,
      overlapping_system_scope_across_different_watches_allowed: true,
      external_io_off_does_not_block_disposable_persistence: true,
      external_io_off_does_not_start_provider_movement: true,
      fetch_runs_are_not_bucket_state: true,
      discovered_killmail_refs_are_not_pre_acquisition_bucket_state: true,
      fixture_schema_is_not_product_schema: true
    },
    boundary: [
      'Fixture-only disposable persistence semantics proof.',
      'Uses in-memory fixture state only; no product schema or operator corpus mutation.',
      'Disposable fixture rows are not durable Atlas bucket rows and are not accepted product schema.',
      'External I/O off does not block disposable Watch bucket persistence and does not start provider movement.',
      'No Discovery pickup, provider packets, candidate refs, Evidence/EVEidence, Hydration, Observation, dispatcher, queue, lease, enforcement, schema, or UI behavior is opened.'
    ],
    does_not_do: [
      'does_not_update_src_main_db_schema_sql',
      'does_not_create_durable_product_bucket_rows',
      'does_not_mutate_operator_corpus',
      'does_not_use_fetch_runs_as_bucket_state',
      'does_not_use_discovered_killmail_refs_as_pre_acquisition_bucket_state',
      'does_not_start_discovery_pickup_or_create_provider_packets',
      'does_not_write_candidate_refs_discovery_refs_evidence_eveidence_hydration_observation_or_api_logs',
      'does_not_mutate_watch_rows_or_cadence',
      'does_not_implement_dispatcher_queue_lease_runtime_enforcement_or_ui'
    ]
  };
}

function createDisposableStore() {
  return {
    rows: [],
    openByWatch: new Map(),
    byWatchRunId: new Map()
  };
}

function persistCandidate(store, candidate) {
  if (!candidate.valid_for_persistence) {
    return rejectSourceRow({
      ...candidate,
      reason: candidate.no_persistence_reason || 'invalid_projected_candidate'
    });
  }

  const existingRun = store.byWatchRunId.get(candidate.watch_run_id);
  if (existingRun && !identityEquivalent(existingRun.identity, candidate.identity)) {
    return resultFor(candidate, 'integrity_error_rolled_back', 'same_watch_run_id_mismatched_scope_window_or_provenance', {
      rows_written_to_disposable_fixture: 0,
      rollback_in_disposable_fixture: true
    });
  }

  const existingOpen = store.openByWatch.get(candidate.watch_id);
  if (existingOpen) {
    if (identityCompatibleForSameWatch(existingOpen.identity, candidate.identity)) {
      return resultFor(candidate, 'idempotent_existing_open_disposable_fixture_row', 'same_watch_same_open_identity_already_exists', {
        disposable_fixture_row: compactDisposableRow(existingOpen),
        rows_written_to_disposable_fixture: 0
      });
    }
    return resultFor(candidate, 'integrity_conflict_no_second_open_row', 'same_watch_different_open_identity', {
      conflicting_disposable_fixture_row: compactDisposableRow(existingOpen),
      rows_written_to_disposable_fixture: 0
    });
  }

  const row = disposableRowFor(candidate);
  store.rows.push(row);
  store.openByWatch.set(candidate.watch_id, row);
  store.byWatchRunId.set(candidate.watch_run_id, row);
  return resultFor(candidate, 'inserted_open_disposable_fixture_row', 'no_existing_open_disposable_fixture_row', {
    disposable_fixture_row: compactDisposableRow(row),
    rows_written_to_disposable_fixture: 1
  });
}

function rejectSourceRow(row = {}) {
  return {
    input_stub_id: row.input_stub_id || null,
    projected_bucket_candidate_id: row.projected_bucket_candidate_id || null,
    watch_id: row.watch_id ?? null,
    watch_run_id: row.watch_run_id || null,
    source_kind: row.source_kind || null,
    persistence_result: 'rejected_before_disposable_persistence',
    reason: row.reason || row.no_candidate_reason || 'source_row_not_persistable',
    rows_written_to_disposable_fixture: 0,
    provider_packets: 0,
    discovery_pickup_started: false,
    candidate_refs_written: 0,
    evidence_eveidence_written: 0,
    watch_cadence_mutated: false
  };
}

function resultFor(candidate, persistenceResult, reason, extra = {}) {
  return {
    projected_bucket_candidate_id: candidate.projected_bucket_candidate_id,
    watch_id: candidate.watch_id,
    watch_run_id: candidate.watch_run_id,
    source_kind: candidate.source_kind,
    persistence_result: persistenceResult,
    reason,
    missed_intervals: candidate.missed_intervals,
    missed_intervals_collapsed_to_current_candidate: candidate.missed_intervals > 0,
    catch_up_rows_created: 0,
    provider_packets: 0,
    discovery_pickup_started: false,
    candidate_refs_written: 0,
    evidence_eveidence_written: 0,
    watch_cadence_mutated: false,
    ...extra
  };
}

function disposableRowFor(candidate) {
  return {
    disposable_fixture_row_id: `disposable-watch-bucket:${candidate.watch_id}:${candidate.identity.window_key}`,
    fixture_language: 'disposable_bucket_row_fixture_not_product_schema',
    fixture_state: 'open',
    product_schema_row: false,
    durable_product_row: false,
    watch_id: candidate.watch_id,
    watch_run_id: candidate.watch_run_id,
    source_kind: candidate.source_kind,
    identity: candidate.identity,
    accepted_scope: candidate.accepted_scope,
    window: candidate.window,
    provenance: candidate.provenance,
    missed_intervals: candidate.missed_intervals,
    missed_intervals_collapsed_to_current_candidate: candidate.missed_intervals > 0,
    catch_up_rows_created: 0,
    provider_packets: 0,
    discovery_pickup_started: false,
    candidate_refs_written: 0,
    evidence_eveidence_written: 0,
    watch_cadence_mutated: false
  };
}

function normalizeCandidate(candidate = {}, index) {
  const acceptedScope = candidate.accepted_scope || {};
  const included = uniquePositiveIntegers(acceptedScope.included_system_ids || candidate.included_system_ids || []);
  const watchId = Number(candidate.watch_id);
  const watchRunId = candidate.watch_run_id || null;
  const window = candidate.window || {};
  const provenance = candidate.provenance || {};
  const normalized = {
    projected_bucket_candidate_id: candidate.projected_bucket_candidate_id || `fixture-projected-candidate-${index + 1}`,
    watch_id: watchId,
    watch_run_id: watchRunId,
    source_kind: candidate.source_kind || 'watch_system_radius',
    accepted_scope: {
      ...acceptedScope,
      execution_authority: acceptedScope.execution_authority || 'stored_included_system_ids',
      included_system_ids: included,
      center_radius_is_provenance_only: acceptedScope.center_radius_is_provenance_only !== false
    },
    window: {
      lookback_seconds: window.lookback_seconds ?? null,
      due_at: window.due_at || null,
      emitted_at: window.emitted_at || null
    },
    provenance: {
      source_intent: provenance.source_intent || 'Watch/system-radius',
      scope_provenance: provenance.scope_provenance || 'system_watches.included_system_ids',
      watch_scope_key: provenance.watch_scope_key || null,
      center_radius_role: provenance.center_radius_role || 'provenance_and_explanation'
    },
    missed_intervals: Math.max(0, Number(candidate.missed_intervals || 0)),
    valid_for_persistence: Number.isFinite(watchId) && Boolean(watchRunId) && included.length > 0,
    no_persistence_reason: null
  };
  normalized.identity = identityFor(normalized);
  if (!normalized.valid_for_persistence) {
    normalized.no_persistence_reason = invalidReasonFor(normalized);
  }
  return normalized;
}

function normalizeRejectedSource(row = {}, index) {
  return {
    input_stub_id: row.input_stub_id || `fixture-rejected-source-${index + 1}`,
    projected_bucket_candidate_id: row.projected_bucket_candidate_id || null,
    watch_id: Number.isFinite(Number(row.watch_id)) ? Number(row.watch_id) : null,
    watch_run_id: row.watch_run_id || null,
    source_kind: row.source_kind || 'watch_system_radius',
    reason: row.reason || row.no_candidate_reason || 'source_row_not_persistable'
  };
}

function invalidReasonFor(candidate) {
  if (!Number.isFinite(candidate.watch_id)) {
    return 'missing_watch_id';
  }
  if (!candidate.watch_run_id) {
    return 'missing_watch_run_id';
  }
  if (!candidate.accepted_scope.included_system_ids.length) {
    return 'invalid_or_empty_accepted_scope';
  }
  return 'invalid_projected_candidate';
}

function identityFor(candidate) {
  return {
    source_kind: candidate.source_kind,
    watch_id: candidate.watch_id,
    watch_run_id: candidate.watch_run_id,
    scope_fingerprint: `systems:${candidate.accepted_scope.included_system_ids.join(',')}`,
    window_key: `due:${candidate.window.due_at || 'none'}|lookback:${candidate.window.lookback_seconds ?? 'none'}`,
    provenance_key: `${candidate.provenance.scope_provenance || 'none'}|${candidate.provenance.watch_scope_key || 'none'}`
  };
}

function identityEquivalent(left = {}, right = {}) {
  return left.source_kind === right.source_kind
    && Number(left.watch_id) === Number(right.watch_id)
    && left.watch_run_id === right.watch_run_id
    && identityCompatibleForSameWatch(left, right);
}

function identityCompatibleForSameWatch(left = {}, right = {}) {
  return left.scope_fingerprint === right.scope_fingerprint
    && left.window_key === right.window_key
    && left.provenance_key === right.provenance_key;
}

function compactDisposableRow(row = {}) {
  return {
    disposable_fixture_row_id: row.disposable_fixture_row_id,
    fixture_state: row.fixture_state,
    product_schema_row: row.product_schema_row,
    durable_product_row: row.durable_product_row,
    watch_id: row.watch_id,
    watch_run_id: row.watch_run_id,
    identity: row.identity
  };
}

function overlapRowsFor(rows) {
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
        overlap_status: 'coexisting_disposable_rows_for_different_watch_intent',
        left_watch_id: left.watch_id,
        right_watch_id: right.watch_id,
        shared_system_ids: shared,
        merges_identity: false,
        suppresses_row: false,
        provider_packets: 0,
        writes_to_operator_corpus: 0
      });
    }
  }
  return overlaps;
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
  buildWatchBucketDisposablePersistenceFixtureProof
};
