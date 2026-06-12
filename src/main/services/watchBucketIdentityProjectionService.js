const ACTION = 'watch.bucket_identity_projection.preview';

function buildWatchBucketIdentityProjectionPreview(db, input = {}) {
  const before = stateSnapshot(db);
  const watchRunStubs = arrayInput(input.watchRunStubs, input.watch_run_stubs)
    .map((stub, index) => normalizeStub(stub, index));
  const existingOpenStubFixtures = arrayInput(input.existingOpenStubs, input.existing_open_stubs, input.existingOpenBuckets, input.existing_open_buckets)
    .map((stub, index) => normalizeExistingOpenStub(stub, index));
  const externalIoState = input.externalIoState || input.external_io_state || 'off';
  const projectionRows = projectRows(watchRunStubs, existingOpenStubFixtures);
  const projectedBucketCandidates = projectionRows
    .filter((row) => row.projection_status === 'projected_bucket_candidate')
    .map((row) => row.projected_bucket_candidate);
  const duplicateOpenSuppressions = projectionRows.filter((row) => row.projection_status === 'duplicate_open_stub_suppressed');
  const integrityConflicts = projectionRows.filter((row) => row.projection_status === 'integrity_conflict');
  const integrityErrors = projectionRows.filter((row) => row.projection_status === 'integrity_error');
  const rejectedStubs = projectionRows.filter((row) => row.projection_status === 'no_candidate');
  const allowedOverlaps = allowedOverlapsFor(projectedBucketCandidates);
  const sameRunIdErrors = sameRunIdIntegrityErrors(watchRunStubs, existingOpenStubFixtures);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Watch bucket identity projection fixture proof',
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
    bucket_rows_created: 0,
    bucket_rows_persisted: 0,
    durable_bucket_rows_written: 0,
    watch_run_rows_created: 0,
    fetch_runs_as_bucket_state: false,
    discovered_killmail_refs_as_bucket_state: false,
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
      provider_packets: 0,
      discovery_pickup_started: false,
      posture: externalIoState === 'off' ? 'external_io_pickup_hold_after_watch_projection' : 'provider_pickup_still_not_started_by_projection'
    },
    summary: {
      input_stub_count: watchRunStubs.length,
      existing_open_stub_fixture_count: existingOpenStubFixtures.length,
      projected_bucket_candidate_count: projectedBucketCandidates.length,
      duplicate_open_suppression_count: duplicateOpenSuppressions.length,
      allowed_overlap_count: allowedOverlaps.length,
      integrity_conflict_count: integrityConflicts.length,
      integrity_error_count: integrityErrors.length + sameRunIdErrors.length,
      rejected_stub_count: rejectedStubs.length,
      provider_packets: 0,
      discovery_pickup_packets_created: 0,
      bucket_rows_persisted: 0,
      writes: 0
    },
    projection_rows: projectionRows,
    projected_bucket_candidates: projectedBucketCandidates,
    duplicate_open_suppressions: duplicateOpenSuppressions.map(compactProjectionRow),
    allowed_overlaps: allowedOverlaps,
    integrity_conflicts: integrityConflicts.map(compactProjectionRow),
    integrity_errors: [
      ...integrityErrors.map(compactProjectionRow),
      ...sameRunIdErrors
    ],
    rejected_stubs: rejectedStubs.map(compactProjectionRow),
    candidate_ref_killmail_overlap_principle: {
      principle_only: true,
      future_rule: 'deduplicate_killmail_preserve_overlapping_watch_intent',
      candidate_refs_written: 0,
      evidence_rows_written: 0,
      provenance_table_claimed: false,
      durable_relationship_claimed: false,
      discovered_killmail_refs_as_pre_acquisition_bucket: false
    },
    accepted_model: {
      watch_bucket_identity_source: 'watch_run_stub_projection',
      existing_open_state_source: 'fixture_input_only',
      output_language: 'projected_candidate_fixture_only',
      one_open_stub_per_watch: true,
      missed_intervals_collapse_to_current_candidate: true,
      bucket_identity_is_watch_run_based_not_system_based: true,
      overlapping_system_scope_across_different_watches_allowed: true,
      external_io_blocks_provider_pickup_not_watch_projection: true,
      fetch_runs_are_not_bucket_state: true,
      discovered_killmail_refs_are_not_pre_acquisition_bucket_state: true,
      evidence_eveidence_is_not_watch_bucket_state: true,
      schema_accepted_by_this_projection: false,
      runtime_behavior_changed_by_this_projection: false
    },
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
    },
    boundary: [
      'Read-only fixture/projection proof only.',
      'Existing-open bucket state is fixture input only, not durable Atlas state.',
      'Projected bucket candidates are not schema rows, not runtime writes, and not execution authority.',
      'External I/O closed does not block Watch bucket candidate projection; it only represents later Discovery/provider movement hold.',
      'No Watch executor tick, TaskRunner, collectors, Discovery pickup, providers, Discovery refs, Evidence/EVEidence, Hydration, Observation, dispatcher, queue, lease, enforcement, schema, or UI behavior is opened.'
    ],
    does_not_do: [
      'does_not_create_schema',
      'does_not_create_durable_bucket_rows',
      'does_not_mutate_watch_rows_or_cadence',
      'does_not_use_fetch_runs_as_bucket_state',
      'does_not_use_discovered_killmail_refs_as_pre_acquisition_bucket_state',
      'does_not_call_watch_executor_tick_task_runner_collectors_discovery_pickup_or_providers',
      'does_not_write_discovery_refs_evidence_eveidence_hydration_observation_or_api_logs',
      'does_not_implement_dispatcher_queue_lease_runtime_enforcement_or_ui'
    ]
  };
}

function projectRows(stubs, existingOpenStubs) {
  return stubs.map((stub) => projectStub(stub, existingOpenStubs));
}

function projectStub(stub, existingOpenStubs) {
  if (!stub.valid_for_projection) {
    return rowFor(stub, 'no_candidate', stub.no_candidate_reason || 'invalid_stub');
  }

  const sameRunIdMismatch = existingOpenStubs.find((open) => (
    open.watch_run_id === stub.watch_run_id && !identityEquivalent(open.identity, stub.identity)
  ));
  if (sameRunIdMismatch) {
    return rowFor(stub, 'integrity_error', 'same_watch_run_id_mismatched_identity', {
      existing_open_stub_fixture: compactExisting(sameRunIdMismatch)
    });
  }

  const sameWatchOpen = existingOpenStubs.find((open) => open.watch_id === stub.watch_id);
  if (sameWatchOpen) {
    if (identityCompatibleForSameWatch(sameWatchOpen.identity, stub.identity)) {
      return rowFor(stub, 'duplicate_open_stub_suppressed', 'existing_open_stub_for_same_watch', {
        existing_open_stub_fixture: compactExisting(sameWatchOpen),
        projected_bucket_candidate: null
      });
    }
    return rowFor(stub, 'integrity_conflict', 'same_watch_existing_open_scope_or_provenance_mismatch', {
      existing_open_stub_fixture: compactExisting(sameWatchOpen),
      conflict_fields: differingIdentityFields(sameWatchOpen.identity, stub.identity)
    });
  }

  return rowFor(stub, 'projected_bucket_candidate', 'no_existing_open_stub', {
    projected_bucket_candidate: bucketCandidateFor(stub)
  });
}

function rowFor(stub, status, reason, extra = {}) {
  return {
    input_stub_id: stub.input_stub_id,
    source_kind: stub.source_kind,
    watch_id: stub.watch_id,
    watch_run_id: stub.watch_run_id,
    projection_status: status,
    reason,
    candidate_count: status === 'projected_bucket_candidate' ? 1 : 0,
    duplicate_open_suppressed: status === 'duplicate_open_stub_suppressed',
    integrity_conflict: status === 'integrity_conflict',
    integrity_error: status === 'integrity_error',
    valid_for_projection: stub.valid_for_projection,
    no_candidate_reason: status === 'no_candidate' ? reason : null,
    missed_intervals: stub.missed_intervals,
    missed_intervals_collapsed_to_current_candidate: status === 'projected_bucket_candidate' && stub.missed_intervals > 0,
    catch_up_candidates_created: 0,
    accepted_scope: {
      execution_authority: 'stored_included_system_ids',
      included_system_ids: [...stub.included_system_ids],
      center_system_id: stub.center_system_id,
      radius_jumps: stub.radius_jumps,
      center_radius_is_provenance_only: true
    },
    provider_packets: 0,
    discovery_pickup_started: false,
    writes: 0,
    ...extra
  };
}

function bucketCandidateFor(stub) {
  return {
    projected_bucket_candidate_id: `projected-watch-bucket:${stub.source_kind}:${stub.watch_id}:${stub.identity.window_key}`,
    candidate_language: 'projected_candidate_fixture_only',
    candidate_is_schema: false,
    candidate_is_durable_row: false,
    existing_open_state_source: 'fixture_input_only',
    watch_id: stub.watch_id,
    watch_run_id: stub.watch_run_id,
    source_kind: stub.source_kind,
    bucket_identity: {
      identity_basis: 'watch_run_based',
      watch_id: stub.watch_id,
      watch_run_id: stub.watch_run_id,
      scope_fingerprint: stub.identity.scope_fingerprint,
      window_key: stub.identity.window_key,
      provenance_key: stub.identity.provenance_key,
      system_id_identity_rejected: true
    },
    accepted_scope: {
      execution_authority: 'stored_included_system_ids',
      included_system_ids: [...stub.included_system_ids],
      center_system_id: stub.center_system_id,
      radius_jumps: stub.radius_jumps,
      center_radius_is_provenance_only: true,
      center_radius_used_as_execution_authority: false
    },
    window: { ...stub.window },
    provenance: { ...stub.provenance },
    missed_intervals: stub.missed_intervals,
    missed_intervals_collapsed_to_current_candidate: stub.missed_intervals > 0,
    catch_up_candidates_created: 0,
    boundary_flags: {
      provider_packets: 0,
      discovery_pickup_started: false,
      discovery_refs_written: 0,
      evidence_eveidence_written: 0,
      bucket_row_persisted: false,
      watch_cadence_mutated: false
    }
  };
}

function allowedOverlapsFor(candidates) {
  const overlaps = [];
  for (let leftIndex = 0; leftIndex < candidates.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < candidates.length; rightIndex += 1) {
      const left = candidates[leftIndex];
      const right = candidates[rightIndex];
      if (left.watch_id === right.watch_id) {
        continue;
      }
      const shared = intersection(left.accepted_scope.included_system_ids, right.accepted_scope.included_system_ids);
      if (shared.length) {
        overlaps.push({
          overlap_status: 'allowed_overlap_different_watch_intent',
          reason: 'bucket_identity_is_watch_run_based_not_system_based',
          left_watch_id: left.watch_id,
          right_watch_id: right.watch_id,
          shared_system_ids: shared,
          suppresses_candidate: false,
          provider_packets: 0,
          writes: 0
        });
      }
    }
  }
  return overlaps;
}

function sameRunIdIntegrityErrors(stubs, existingOpenStubs) {
  const rows = [];
  const byRun = new Map();
  for (const item of [...stubs, ...existingOpenStubs]) {
    if (!item.watch_run_id) {
      continue;
    }
    const existing = byRun.get(item.watch_run_id);
    if (!existing) {
      byRun.set(item.watch_run_id, item);
      continue;
    }
    if (!identityEquivalent(existing.identity, item.identity)) {
      rows.push({
        projection_status: 'integrity_error',
        reason: 'same_watch_run_id_mismatched_watch_scope_window_or_provenance',
        watch_run_id: item.watch_run_id,
        first: compactIdentityHolder(existing),
        second: compactIdentityHolder(item),
        candidate_count: 0,
        writes: 0
      });
    }
  }
  return rows;
}

function normalizeStub(stub = {}, index) {
  const acceptedScope = stub.accepted_scope || {};
  const window = stub.window || {};
  const provenance = stub.provenance || {};
  const included = uniquePositiveIntegers(acceptedScope.included_system_ids || stub.included_system_ids || []);
  const noCandidateReason = stub.no_candidate_reason || stub.noStubReason || stub.reason || null;
  const validForProjection = stub.valid_for_projection !== false
    && stub.emits_valid_stub !== false
    && !noCandidateReason
    && Number.isFinite(Number(stub.watch_id))
    && Boolean(stub.watch_run_id)
    && included.length > 0;
  const normalized = {
    input_stub_id: stub.input_stub_id || `fixture_stub_${index + 1}`,
    watch_id: Number(stub.watch_id),
    watch_run_id: stub.watch_run_id || null,
    source_kind: stub.source_kind || 'watch_system_radius',
    included_system_ids: validForProjection ? included : [],
    center_system_id: acceptedScope.center_system_id ?? stub.center_system_id ?? null,
    radius_jumps: acceptedScope.radius_jumps ?? stub.radius_jumps ?? null,
    window: {
      lookback_seconds: window.lookback_seconds ?? stub.lookback_seconds ?? null,
      due_at: window.due_at || stub.due_at || null,
      emitted_at: window.emitted_at || stub.emitted_at || null
    },
    provenance: {
      source_intent: provenance.source_intent || stub.source_intent || 'Watch/system-radius',
      scope_provenance: provenance.scope_provenance || stub.scope_provenance || 'system_watches.included_system_ids',
      watch_scope_key: provenance.watch_scope_key || stub.watch_scope_key || null,
      center_radius_role: provenance.center_radius_role || 'provenance_and_explanation'
    },
    missed_intervals: Math.max(0, Number(stub.missed_intervals || stub.missed_interval_count || 0)),
    valid_for_projection: validForProjection,
    no_candidate_reason: validForProjection ? null : (noCandidateReason || invalidReasonFor(stub, included))
  };
  return {
    ...normalized,
    identity: identityFor(normalized)
  };
}

function normalizeExistingOpenStub(stub = {}, index) {
  const normalized = normalizeStub({
    ...stub,
    input_stub_id: stub.fixture_open_id || stub.input_stub_id || `existing_open_stub_fixture_${index + 1}`
  }, index);
  return {
    ...normalized,
    fixture_open_id: stub.fixture_open_id || normalized.input_stub_id,
    fixture_only: true,
    state: stub.state || 'open'
  };
}

function invalidReasonFor(stub, included) {
  if (stub.emits_valid_stub === false) {
    return stub.no_stub_reason || stub.noStubReason || 'source_stub_not_valid';
  }
  if (!Number.isFinite(Number(stub.watch_id))) {
    return 'missing_watch_id';
  }
  if (!stub.watch_run_id) {
    return 'missing_watch_run_id';
  }
  if (!included.length) {
    return 'invalid_or_empty_accepted_scope';
  }
  return 'invalid_stub';
}

function identityFor(stub) {
  const scopeFingerprint = `systems:${stub.included_system_ids.join(',')}`;
  const windowKey = `due:${stub.window.due_at || 'none'}|lookback:${stub.window.lookback_seconds ?? 'none'}`;
  const provenanceKey = `${stub.provenance.scope_provenance || 'none'}|${stub.provenance.watch_scope_key || 'none'}`;
  return {
    source_kind: stub.source_kind,
    watch_id: stub.watch_id,
    watch_run_id: stub.watch_run_id,
    scope_fingerprint: scopeFingerprint,
    window_key: windowKey,
    provenance_key: provenanceKey
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

function differingIdentityFields(left = {}, right = {}) {
  return ['scope_fingerprint', 'window_key', 'provenance_key']
    .filter((field) => left[field] !== right[field]);
}

function compactProjectionRow(row = {}) {
  return {
    input_stub_id: row.input_stub_id || null,
    source_kind: row.source_kind || null,
    watch_id: row.watch_id ?? null,
    watch_run_id: row.watch_run_id || null,
    projection_status: row.projection_status || null,
    reason: row.reason || null,
    candidate_count: row.candidate_count || 0,
    no_candidate_reason: row.no_candidate_reason || null,
    conflict_fields: row.conflict_fields || [],
    existing_open_stub_fixture: row.existing_open_stub_fixture || null,
    provider_packets: row.provider_packets || 0,
    discovery_pickup_started: row.discovery_pickup_started === true,
    writes: row.writes || 0
  };
}

function compactExisting(stub = {}) {
  return {
    fixture_open_id: stub.fixture_open_id,
    watch_id: stub.watch_id,
    watch_run_id: stub.watch_run_id,
    state: stub.state,
    identity: stub.identity
  };
}

function compactIdentityHolder(item = {}) {
  return {
    input_stub_id: item.input_stub_id || item.fixture_open_id || null,
    watch_id: item.watch_id ?? null,
    watch_run_id: item.watch_run_id || null,
    identity: item.identity || null
  };
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
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value));
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
  buildWatchBucketIdentityProjectionPreview
};
