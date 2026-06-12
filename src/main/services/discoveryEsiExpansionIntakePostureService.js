const { buildDiscoveryAcquisitionToEvidenceHandoffFixturePreview } = require('./discoveryAcquisitionToEvidenceHandoffFixtureService');

const ACTION = 'discovery.esi_expansion_intake_posture.preview';

function buildDiscoveryEsiExpansionIntakePosturePreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const handoff = buildDiscoveryAcquisitionToEvidenceHandoffFixturePreview(db, {
    ...input,
    now
  }, context);
  const cachedKillmailIds = new Set((input.cachedKillmailIds || []).map((value) => Number(value)).filter(Number.isFinite));
  const selectedKeys = new Set((handoff.evidence_expansion_handoff?.handoff_candidates || []).map(candidateKey));
  const notSelectedByKey = new Map((handoff.evidence_expansion_handoff?.not_selected_candidates || [])
    .filter((row) => row.candidate_key)
    .map((row) => [row.candidate_key, row]));
  const fixtureFailures = fixtureFailureMap(input.fixtureEsiExpansionOutcomes || input.fixtureExpansionOutcomes || []);
  const intakeItems = [];
  const seenCandidateKeys = new Map();

  for (const candidate of handoff.normalized_candidate_refs || []) {
    const key = candidateKey(candidate);
    const seenCount = seenCandidateKeys.get(key) || 0;
    seenCandidateKeys.set(key, seenCount + 1);
    intakeItems.push(classifyCandidate({
      db,
      candidate,
      selectedKeys,
      notSelectedByKey,
      cachedKillmailIds,
      fixtureFailures,
      repeatedCandidate: seenCount > 0
    }));
  }

  for (const row of handoff.evidence_expansion_handoff?.not_selected_candidates || []) {
    if (!row.candidate_key) {
      intakeItems.push(reasonOnlyIntake(row.reason, handoff));
    }
  }

  const after = stateSnapshot(db);
  const postureSummary = summarizePostures(intakeItems, handoff);

  return {
    action: ACTION,
    classification: 'read-only Discovery ESI-backed expansion intake posture proof',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    fixture_only: true,
    renderer_eligible: true,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    esi_call_performed: false,
    watch_execution: false,
    watch_dispatches: 0,
    dispatch_runner_invoked: false,
    dispatch_runner_invocations: 0,
    collectors_called: false,
    collect_actor_watch_invoked: false,
    collect_system_radius_watch_invoked: false,
    mixed_collectors_invoked: false,
    task_runner_methods_called: [],
    tasks_created: 0,
    queue_created: false,
    dispatcher_created: false,
    leases_created: 0,
    watch_mutations: 0,
    watch_rows_mutated: 0,
    discovery_refs_written: false,
    durable_discovery_refs_written: false,
    discovered_killmail_refs_written: 0,
    discovery_refs_mutated: 0,
    evidence_written: false,
    evidence_created: false,
    evidence_writes: 0,
    evidence_rows_written: 0,
    evidence_landing_performed: false,
    live_esi_backed_expansion_run: false,
    esi_evidence_expansion_run: false,
    hydration_writes: 0,
    hydration_created: false,
    metadata_writes: 0,
    api_request_log_writes: 0,
    data_quality_warning_writes: 0,
    fetch_run_writes: 0,
    schema_changes: 0,
    durable_task_packet_schema_created: false,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    actor_watch_redirected: false,
    runActorWatchService_changed: false,
    watchExecutor_dispatchFor_changed: false,
    mixed_collector_redirected: false,
    mixed_collector_retired: false,
    source_acquisition_handoff: {
      action: handoff.action,
      request_posture: handoff.acquisition_request?.request_posture || null,
      source_kind: handoff.acquisition_request?.source_kind || null,
      selected_handoff_candidate_count: handoff.evidence_expansion_handoff?.selected_candidate_count || 0,
      normalized_candidate_count: (handoff.normalized_candidate_refs || []).length,
      provider_calls: handoff.provider_calls || 0,
      live_api_calls: handoff.live_api_calls || 0,
      evidence_writes: handoff.evidence_writes || 0,
      table_mutation_unchanged: handoff.table_mutation_proof?.unchanged === true
    },
    acquisition_request_basis: handoff.acquisition_request,
    canonical_discovery_receipt_basis: handoff.canonical_discovery_receipt_basis,
    source_candidate_dedupe_posture: handoff.candidate_dedupe_posture,
    intake_items: intakeItems,
    posture_summary: postureSummary,
    evidence_eveidence_writer_boundary: {
      owner: 'Evidence/EVEidence writer',
      invoked: false,
      landing_performed: false,
      evidence_writes: 0,
      boundary: 'Future expanded ESI killmail/detail payloads would land through Evidence/EVEidence writer; this preview only classifies intake posture.'
    },
    missing_or_parked_runtime_work: [
      'live_esi_provider_call_not_proven',
      'real_esi_backed_expansion_execution_not_proven',
      'durable_discovery_ref_write_not_proven',
      'evidence_eveidence_landing_not_proven',
      'watch_cadence_mutation_from_receipt_not_proven',
      'actor_watch_compatibility_wrapper_not_implemented',
      'collectActorWatch_not_retired'
    ],
    accepted_model: {
      owner: 'Discovery',
      lane: 'esi_backed_killmail_detail_expansion',
      source_agnostic: true,
      actor_watch_is_one_possible_caller: true,
      candidate_refs_are_possible_leads: true,
      candidate_refs_are_evidence: false,
      esi_backed_expansion_is_hydration: false,
      hydration_repairs_readability_only: true,
      evidence_eveidence_begins_at_final_landed_memory: true,
      preview_authorizes_runtime_replacement: false,
      preview_authorizes_collector_retirement: false
    },
    non_invocation_proof: {
      collectActorWatch_entered: false,
      collectSystemRadiusWatch_entered: false,
      WatchSessionExecutor_tick_invoked: false,
      TaskRunner_runDetachedTask_invoked: false,
      runActorWatchService_runtime_changed: false,
      watchExecutor_dispatchFor_runtime_changed: false,
      live_watch_dispatch_invoked: false,
      redirect_performed: false,
      retirement_performed: false,
      source_actions_used: [
        ACTION,
        handoff.action,
        ...(handoff.mixed_collector_non_invocation_proof?.source_actions_used || [])
      ]
    },
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && handoff.table_mutation_proof?.unchanged === true
    },
    boundary_flags: {
      providers_called: false,
      live_api_called: false,
      zkill_called: false,
      esi_called: false,
      db_mutated: false,
      mixed_collectors_invoked: false,
      live_watch_dispatch_invoked: false,
      task_created: false,
      watch_mutated: false,
      discovery_refs_written: false,
      evidence_written: false,
      live_esi_backed_expansion_run: false,
      hydration_written: false,
      api_logs_or_warnings_written: false,
      fetch_runs_written: false,
      schema_changed: false,
      queue_dispatcher_or_lease_created: false,
      support_artifact_created: false,
      ui_changed: false,
      runtime_enforcement_or_command_blocking_active: false,
      system_radius_behavior_changed: false,
      actor_watch_redirected: false,
      mixed_collectors_retired_or_redirected: false,
      protected_words_updated: false
    },
    boundary: [
      'Discovery owns ESI-backed killmail/detail expansion intake posture.',
      'Candidate refs are possible leads until Evidence/EVEidence writer landing.',
      'ESI-backed killmail/detail expansion is provider-facing Discovery work, not Hydration.',
      'This preview classifies fixture intake only; it performs no provider calls, writes, runtime redirect, collector invocation, task creation, schema change, UI work, or enforcement.'
    ]
  };
}

function classifyCandidate({ db, candidate, selectedKeys, notSelectedByKey, cachedKillmailIds, fixtureFailures, repeatedCandidate }) {
  const key = candidateKey(candidate);
  const malformed = !candidate.killmail_id || !candidate.killmail_hash;
  const localEvidenceExists = !malformed && (cachedKillmailIds.has(Number(candidate.killmail_id)) || hasLocalKillmail(db, candidate.killmail_id));
  const fixtureFailure = fixtureFailures.get(key) || null;
  let posture = 'selected_ready_for_future_esi_expansion';
  let selectionReason = selectedKeys.has(key) ? 'selected_for_fixture_handoff' : 'selected_by_candidate_basis';
  let localCacheMeansNoFutureEsiNeeded = false;

  if (malformed) {
    posture = 'malformed_candidate_missing_killmail_id_or_hash';
    selectionReason = 'malformed_missing_killmail_id_or_hash';
  } else if (repeatedCandidate) {
    posture = 'duplicate_candidate_ref';
    selectionReason = 'duplicate_candidate_ref';
  } else if (localEvidenceExists) {
    posture = 'local_evidence_exists_skip';
    selectionReason = 'local_evidence_eveidence_already_exists';
    localCacheMeansNoFutureEsiNeeded = true;
  } else if (notSelectedByKey.has(key) && notSelectedByKey.get(key).reason !== 'duplicate_candidate_ref') {
    posture = 'not_selected_capped_candidate';
    selectionReason = notSelectedByKey.get(key).reason || 'not_selected';
  } else if (fixtureFailure === 'failed_retryable') {
    posture = 'retryable_esi_backed_expansion_failure';
    selectionReason = 'fixture_retryable_esi_backed_expansion_failure';
  } else if (fixtureFailure === 'failed_terminal') {
    posture = 'terminal_esi_backed_expansion_failure';
    selectionReason = 'fixture_terminal_esi_backed_expansion_failure';
  }

  return intakeItem({
    candidate,
    posture,
    selectionReason,
    localCacheMeansNoFutureEsiNeeded,
    sourceCandidateBasis: candidate.basis || null
  });
}

function reasonOnlyIntake(reason, handoff) {
  const posture = reason === 'provider_deferred' || reason === 'held_by_external_io_before_acquisition'
    ? 'provider_capacity_deferred'
    : reason === 'failed_retryable'
      ? 'retryable_esi_backed_expansion_failure'
      : reason === 'failed_terminal'
        ? 'terminal_esi_backed_expansion_failure'
        : reason === 'complete_no_refs'
          ? 'no_candidate_refs_available'
          : reason === 'acquisition_capped'
            ? 'not_selected_capped_candidate'
            : 'not_selected_no_candidate_basis';
  return intakeItem({
    candidate: {
      candidate_key: null,
      killmail_id: null,
      killmail_hash: null,
      receipt_id: handoff.canonical_discovery_receipt_basis?.receipt_id || null,
      packet_id: null,
      packet_index: null,
      scope_key: handoff.canonical_discovery_receipt_basis?.scope_key || null,
      source_kind: handoff.acquisition_request?.source_kind || null,
      source_watch_id: handoff.acquisition_request?.source_watch?.watch_id ?? null,
      provider_target: null,
      basis: {
        receipt_basis: handoff.canonical_discovery_receipt_basis?.receipt_id || null,
        request_posture: handoff.acquisition_request?.request_posture || null,
        packet_outcome_counts: handoff.fixture_zkill_outcome_summary?.packet_outcome_counts || {}
      }
    },
    posture,
    selectionReason: reason,
    localCacheMeansNoFutureEsiNeeded: false,
    sourceCandidateBasis: {
      receipt_basis: handoff.canonical_discovery_receipt_basis?.receipt_id || null,
      request_posture: handoff.acquisition_request?.request_posture || null,
      packet_outcome_counts: handoff.fixture_zkill_outcome_summary?.packet_outcome_counts || {}
    }
  });
}

function intakeItem({ candidate, posture, selectionReason, localCacheMeansNoFutureEsiNeeded, sourceCandidateBasis }) {
  return {
    intake_item_id: `esi_intake_${safe(candidate.candidate_key || selectionReason || posture)}`,
    posture,
    killmail_id: candidate.killmail_id ?? null,
    killmail_hash: candidate.killmail_hash ?? null,
    source_kind: candidate.source_kind || null,
    source_watch_id: candidate.source_watch_id ?? null,
    scope_key: candidate.scope_key || null,
    receipt_id: candidate.receipt_id || sourceCandidateBasis?.receipt_basis || null,
    packet_id: candidate.packet_id || null,
    packet_index: candidate.packet_index ?? null,
    source_candidate_basis: sourceCandidateBasis,
    selection_or_skip_reason: selectionReason,
    future_provider_target: candidate.killmail_id && candidate.killmail_hash ? {
      provider: 'esi',
      target_kind: 'killmail_detail',
      killmail_id: candidate.killmail_id,
      killmail_hash: candidate.killmail_hash,
      provider_calls: 0,
      live_api_calls: 0,
      acquisition_not_started: true
    } : null,
    esi_call_performed: false,
    evidence_written: false,
    evidence_landing_performed: false,
    hydration_written: false,
    local_cache_means_no_future_esi_needed: localCacheMeansNoFutureEsiNeeded,
    candidate_refs_are_possible_leads: true,
    candidate_ref_is_evidence: false,
    esi_backed_expansion_is_hydration: false,
    fixture_only: true
  };
}

function fixtureFailureMap(outcomes) {
  const map = new Map();
  for (const outcome of outcomes || []) {
    if (!outcome || typeof outcome !== 'object') {
      continue;
    }
    const key = candidateKey({
      killmail_id: outcome.killmail_id,
      killmail_hash: outcome.killmail_hash
    });
    if (key !== 'unknown:unknown' && ['failed_retryable', 'failed_terminal'].includes(outcome.outcome)) {
      map.set(key, outcome.outcome);
    }
  }
  return map;
}

function summarizePostures(items, handoff) {
  const counts = {};
  for (const item of items) {
    counts[item.posture] = (counts[item.posture] || 0) + 1;
  }
  return {
    total_intake_items: items.length,
    posture_counts: counts,
    selected_ready_count: counts.selected_ready_for_future_esi_expansion || 0,
    local_evidence_skip_count: counts.local_evidence_exists_skip || 0,
    malformed_count: counts.malformed_candidate_missing_killmail_id_or_hash || 0,
    duplicate_count: counts.duplicate_candidate_ref || 0,
    not_selected_capped_count: counts.not_selected_capped_candidate || 0,
    provider_deferred_count: counts.provider_capacity_deferred || 0,
    retryable_failure_count: counts.retryable_esi_backed_expansion_failure || 0,
    terminal_failure_count: counts.terminal_esi_backed_expansion_failure || 0,
    evidence_writer_invoked: false,
    evidence_writes: 0,
    esi_calls: 0,
    source_handoff_selected_count: handoff.evidence_expansion_handoff?.selected_candidate_count || 0
  };
}

function hasLocalKillmail(db, killmailId) {
  if (!Number.isFinite(Number(killmailId))) {
    return false;
  }
  return Boolean(db.prepare('SELECT killmail_id FROM killmails WHERE killmail_id = ?').get(Number(killmailId)));
}

function stateSnapshot(db) {
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

function candidateKey(candidate = {}) {
  return `${candidate.killmail_id || 'unknown'}:${candidate.killmail_hash || 'unknown'}`;
}

function stableJson(value) {
  return JSON.stringify(value);
}

function safe(value) {
  return String(value || 'unknown').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'unknown';
}

module.exports = {
  buildDiscoveryEsiExpansionIntakePosturePreview
};
