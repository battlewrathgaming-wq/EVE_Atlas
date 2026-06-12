const { buildDiscoveryCandidateRefLandingBoundaryPreview } = require('./discoveryCandidateRefLandingBoundaryPreviewService');

const ACTION = 'discovery.settled_receipt_boundary.preview';

function buildDiscoverySettledReceiptBoundaryPreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const suppliedLandingPreview = input.candidateRefLandingBoundaryPreview || input.candidate_ref_landing_boundary_preview;
  const usesTrustedSuppliedLandingPreview = suppliedLandingPreview
    && typeof suppliedLandingPreview === 'object'
    && context.trusted === true
    && context.source !== 'renderer';
  const landingPreview = usesTrustedSuppliedLandingPreview
    ? trustedLandingPreview(suppliedLandingPreview)
    : buildDiscoveryCandidateRefLandingBoundaryPreview(db, input, context);
  const landingRows = Array.isArray(landingPreview.candidate_ref_landing_previews)
    ? landingPreview.candidate_ref_landing_previews
    : [];
  const receiptRows = buildReceiptRows(landingRows);
  const excludedRows = normalizeExcludedRows(landingPreview.excluded_rows);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Discovery settled receipt boundary preview from candidate-ref landing posture',
    settled_receipt_boundary_preview_only: true,
    contract_only: true,
    preview_only: true,
    read_only: true,
    read_only_to_operator_corpus: true,
    mutates_state: false,
    renderer_eligible: true,
    hs495_candidate_ref_landing_basis: true,
    candidate_ref_landing_path_used_by_default: !usesTrustedSuppliedLandingPreview,
    trusted_supplied_landing_preview_used: usesTrustedSuppliedLandingPreview,
    renderer_supplied_landing_preview_authoritative: false,
    product_schema_used: true,
    product_schema_updated: false,
    schema_changes: 0,
    operator_corpus_mutated: false,
    canonical_internal_discovery_basis_capture_rich: true,
    caller_receipt_projection_bounded: true,
    caller_receipt_projection_factual_only: true,
    watch_cadence_completion_decision: 'not_decided_here',
    watch_scheduling_decided_by_discovery: false,
    watch_completion_semantics_opened: false,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    discovery_pickup_execution: false,
    provider_execution_started: false,
    dispatcher_runtime_started: false,
    executable_provider_packets_created: 0,
    durable_queue_rows_written: 0,
    queue_items_created: 0,
    durable_lease_rows_written: 0,
    leases_created: 0,
    lease_claims_created: 0,
    lease_claimed: false,
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
    allowed_settled_postures: [
      'refs_found',
      'no_refs_found',
      'capped',
      'provider_deferred',
      'failed_retryable',
      'failed_terminal',
      'partial_recoverable'
    ],
    receipt_model: {
      canonical_internal_discovery_basis_may_be_capture_rich: true,
      caller_receipt_projection_is_bounded: true,
      caller_receipt_projection_is_factual: true,
      watch_cadence_completion_decision: 'not_decided_here',
      watch_owns_cadence_interpretation: true,
      discovery_reports_provider_acquisition_facts: true,
      held_by_external_io_is_pre_acquisition_not_landing_outcome: true,
      invalid_scope_is_intent_bucket_rejection_not_settled_discovery_receipt: true,
      capped_is_not_failure: true
    },
    input_authority: {
      hs495_candidate_ref_landing_path_used: !usesTrustedSuppliedLandingPreview,
      trusted_supplied_landing_preview_used: usesTrustedSuppliedLandingPreview,
      renderer_supplied_landing_preview_authoritative: false
    },
    summary: summarizeReceiptRows(receiptRows, landingRows, excludedRows),
    settled_receipt_boundary_rows: receiptRows,
    caller_receipt_projections: receiptRows.map((row) => row.caller_receipt_projection),
    internal_discovery_basis_preview: {
      source_action: landingPreview.action || null,
      candidate_ref_landing_row_count: landingRows.length,
      provenance_relationship_preview_count: Array.isArray(landingPreview.provenance_relationship_previews)
        ? landingPreview.provenance_relationship_previews.length
        : 0,
      capture_rich_basis_not_emitted_as_caller_contract: true
    },
    excluded_rows: excludedRows,
    source_candidate_ref_landing_summary: landingPreview.summary || null,
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
      lease_rows_mutated: false,
      queue_rows_mutated: false,
      product_tables_mutated: false
    },
    boundary: [
      'Read-only Discovery settled receipt boundary preview over HS495 candidate-ref landing posture.',
      'Caller receipt projections are bounded factual rows; internal Discovery basis can remain capture-rich.',
      'Refs found, duplicate suppression, malformed rejection, capped, deferred, and failed provider posture are projected without writes.',
      'Discovery does not decide Watch cadence, Watch completion, or Watch next action here.',
      'No provider calls, candidate-ref writes, Discovery ref writes, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema, enforcement, or UI behavior is opened.'
    ],
    does_not_do: [
      'does_not_update_src_main_db_schema_sql',
      'does_not_call_zkill_or_esi',
      'does_not_start_discovery_pickup_dispatcher_or_provider_execution',
      'does_not_create_durable_queues_leases_or_lease_claims',
      'does_not_write_discovered_killmail_refs_or_candidate_refs',
      'does_not_write_evidence_eveidence_hydration_observation_or_api_logs',
      'does_not_mutate_watch_bucket_status_or_receipts',
      'does_not_mutate_watch_rows_or_cadence',
      'does_not_decide_watch_completion_or_next_action',
      'does_not_migrate_actor_watch',
      'does_not_implement_runtime_enforcement_or_ui'
    ]
  };
}

function buildReceiptRows(landingRows) {
  const groups = new Map();
  for (const row of landingRows) {
    const key = receiptGroupKey(row);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(row);
  }
  return [...groups.entries()].map(([key, rows]) => receiptForRows(key, rows));
}

function receiptForRows(key, rows) {
  const first = rows[0] || {};
  const posture = settledPostureFor(rows);
  const validRefs = rows.filter((row) => row.valid_candidate_ref_identity === true);
  const acceptedNewRefs = validRefs.filter((row) => row.candidate_ref_kind === 'new_candidate_ref');
  const duplicates = rows.filter((row) => row.candidate_ref_kind === 'duplicate_within_provider_result' || row.candidate_ref_kind === 'duplicate_across_preview_candidates');
  const alreadyKnown = rows.filter((row) => row.candidate_ref_kind === 'already_known_in_fixture_discovery_memory');
  const malformed = rows.filter((row) => row.candidate_ref_kind === 'malformed_missing_hash_or_id');
  const capped = rows.some((row) => row.provider_result_posture?.cap_hit === true);
  const deferred = rows.some((row) => row.provider_result_posture?.provider_deferred === true);
  const failed = rows.some((row) => row.provider_result_posture?.provider_failed === true);
  const routePacketIdentities = unique(rows.map((row) => row.route_packet_identity).filter(Boolean));
  const affectedSystemIds = unique(rows.flatMap((row) => {
    const ids = [];
    if (Number.isInteger(toIntegerOrNull(row.system_id))) {
      ids.push(toIntegerOrNull(row.system_id));
    }
    if (Array.isArray(row.accepted_included_system_ids)) {
      ids.push(...row.accepted_included_system_ids.map(toIntegerOrNull).filter(Number.isInteger));
    }
    return ids;
  }));
  const candidateRefs = acceptedNewRefs.map((row) => ({
    candidate_ref_identity: row.candidate_ref_identity,
    killmail_id: row.killmail_id,
    killmail_hash: row.killmail_hash,
    candidate_ref_kind: row.candidate_ref_kind,
    landing_action_preview: row.landing_action_preview,
    possible_lead_only: true,
    not_evidence: true,
    not_eveidence: true
  }));
  const duplicateRefsSuppressed = duplicates.map((row) => ({
    candidate_ref_identity: row.candidate_ref_identity,
    duplicate_kind: row.candidate_ref_kind,
    duplicate_basis: row.duplicate_basis || row.dedupe_basis || null,
    counted_as_found_ref: false,
    duplicate_evidence_created: false
  }));
  const malformedRefsRejected = malformed.map((row) => ({
    killmail_id: row.killmail_id,
    killmail_hash: row.killmail_hash,
    candidate_ref_identity: row.candidate_ref_identity,
    reason: row.reason || 'malformed_candidate_ref',
    landed: false
  }));
  const receipt = {
    receipt_group_key: key,
    settled_receipt_status: posture,
    receipt_projection_kind: 'caller_safe_discovery_receipt_preview',
    preview_only: true,
    read_only: true,
    persisted: false,
    watch_run_id: first.watch_run_id || null,
    bucket_item_id: first.bucket_item_id || null,
    watch_id: first.watch_id ?? null,
    watch_type: first.watch_type || null,
    source_kind: first.source_kind || null,
    accepted_scope_basis: {
      accepted_scope: first.accepted_scope || null,
      accepted_scope_execution_authority: first.accepted_scope_execution_authority || null,
      accepted_included_system_ids: Array.isArray(first.accepted_included_system_ids) ? [...first.accepted_included_system_ids] : [],
      window: first.window || null,
      caps: first.caps || null
    },
    provider_route_family: providerRouteFamily(first),
    affected_system_ids: affectedSystemIds,
    route_packet_identities: routePacketIdentities,
    candidate_refs_found_previewed: candidateRefs,
    duplicate_refs_suppressed: duplicateRefsSuppressed,
    already_known_refs: alreadyKnown.map((row) => ({
      candidate_ref_identity: row.candidate_ref_identity,
      killmail_id: row.killmail_id,
      killmail_hash: row.killmail_hash,
      landing_action_preview: row.landing_action_preview,
      counted_as_new_found_ref: false,
      possible_lead_only: true,
      not_evidence: true,
      not_eveidence: true
    })).filter((row) => row.candidate_ref_identity),
    malformed_refs_rejected: malformedRefsRejected,
    capped_posture: {
      capped,
      capped_is_not_failure: true,
      description: capped ? 'provider_result_limited_more_refs_may_exist' : 'not_capped'
    },
    provider_deferred_posture: {
      provider_deferred: deferred,
      reason: deferred ? first.reason || rows.find((row) => row.reason)?.reason || 'provider_deferred' : null
    },
    provider_failed_posture: {
      provider_failed: failed,
      failure_class: failed ? failureClassFor(rows) : null,
      reason: failed ? first.reason || rows.find((row) => row.reason)?.reason || 'provider_failed' : null
    },
    settled_enough_for_caller_receipt: true,
    caller_can_stop_waiting_on_emitted_work_item: true,
    watch_cadence_completion_decision: 'not_decided_here',
    watch_scheduling_decided_by_discovery: false,
    watch_next_action_decided_by_discovery: false,
    receipt_mutation_preview: 'would_emit_future_discovery_receipt_projection_only',
    writes_receipt: false,
    writes_watch_bucket_status: false,
    writes_discovered_killmail_refs: false,
    writes_evidence_eveidence: false,
    internal_discovery_basis: {
      source_action: 'discovery.candidate_ref_landing_boundary.preview',
      candidate_ref_landing_row_count: rows.length,
      candidate_ref_landing_kinds: unique(rows.map((row) => row.candidate_ref_kind).filter(Boolean)),
      capture_rich_basis_available_to_discovery: true,
      emitted_to_caller_as_bounded_projection: true
    },
    caller_receipt_projection: null,
    side_effects: zeroSideEffects()
  };
  receipt.caller_receipt_projection = {
    receipt_group_key: receipt.receipt_group_key,
    settled_receipt_status: receipt.settled_receipt_status,
    watch_run_id: receipt.watch_run_id,
    bucket_item_id: receipt.bucket_item_id,
    watch_id: receipt.watch_id,
    watch_type: receipt.watch_type,
    source_kind: receipt.source_kind,
    provider_route_family: receipt.provider_route_family,
    affected_system_ids: receipt.affected_system_ids,
    route_packet_identities: receipt.route_packet_identities,
    candidate_ref_count: receipt.candidate_refs_found_previewed.length,
    accepted_new_candidate_ref_count: receipt.candidate_refs_found_previewed.length,
    already_known_candidate_ref_count: receipt.already_known_refs.length,
    duplicate_ref_suppression_count: receipt.duplicate_refs_suppressed.length,
    malformed_ref_rejection_count: receipt.malformed_refs_rejected.length,
    capped: receipt.capped_posture.capped,
    provider_deferred: receipt.provider_deferred_posture.provider_deferred,
    provider_failed: receipt.provider_failed_posture.provider_failed,
    settled_enough_for_caller_receipt: receipt.settled_enough_for_caller_receipt,
    watch_cadence_completion_decision: receipt.watch_cadence_completion_decision
  };
  return receipt;
}

function settledPostureFor(rows) {
  if (rows.some((row) => row.provider_result_posture?.provider_failed === true)) {
    return failureClassFor(rows) === 'terminal' ? 'failed_terminal' : 'failed_retryable';
  }
  if (rows.some((row) => row.provider_result_posture?.provider_deferred === true)) {
    return 'provider_deferred';
  }
  if (rows.some((row) => row.provider_result_posture?.cap_hit === true)) {
    return 'capped';
  }
  if (rows.some((row) => row.candidate_ref_kind === 'malformed_missing_hash_or_id')) {
    return rows.some((row) => row.valid_candidate_ref_identity === true) ? 'partial_recoverable' : 'no_refs_found';
  }
  if (rows.some((row) => row.valid_candidate_ref_identity === true)) {
    return 'refs_found';
  }
  return 'no_refs_found';
}

function failureClassFor(rows) {
  const reason = rows.map((row) => row.reason).filter(Boolean).join(' ').toLowerCase();
  return reason.includes('terminal') ? 'terminal' : 'retryable';
}

function providerRouteFamily(row = {}) {
  if (row.zkill_route || String(row.route_packet_identity || '').includes('zkill')) {
    return 'zkill';
  }
  return 'unknown_provider_route_family';
}

function receiptGroupKey(row = {}) {
  return row.route_packet_identity || row.future_lease_identity?.lease_key_preview || row.fixture_provider_result_id || 'unkeyed-receipt-preview';
}

function summarizeReceiptRows(receiptRows, landingRows, excludedRows) {
  return {
    source_candidate_ref_landing_row_count: landingRows.length,
    settled_receipt_boundary_row_count: receiptRows.length,
    caller_receipt_projection_count: receiptRows.length,
    refs_found_count: receiptRows.filter((row) => row.settled_receipt_status === 'refs_found').length,
    no_refs_found_count: receiptRows.filter((row) => row.settled_receipt_status === 'no_refs_found').length,
    capped_count: receiptRows.filter((row) => row.settled_receipt_status === 'capped').length,
    provider_deferred_count: receiptRows.filter((row) => row.settled_receipt_status === 'provider_deferred').length,
    failed_retryable_count: receiptRows.filter((row) => row.settled_receipt_status === 'failed_retryable').length,
    failed_terminal_count: receiptRows.filter((row) => row.settled_receipt_status === 'failed_terminal').length,
    partial_recoverable_count: receiptRows.filter((row) => row.settled_receipt_status === 'partial_recoverable').length,
    candidate_refs_found_previewed_count: receiptRows.reduce((sum, row) => sum + row.candidate_refs_found_previewed.length, 0),
    accepted_new_candidate_ref_count: receiptRows.reduce((sum, row) => sum + row.candidate_refs_found_previewed.length, 0),
    already_known_candidate_ref_count: receiptRows.reduce((sum, row) => sum + row.already_known_refs.length, 0),
    duplicate_refs_suppressed_count: receiptRows.reduce((sum, row) => sum + row.duplicate_refs_suppressed.length, 0),
    already_known_refs_count: receiptRows.reduce((sum, row) => sum + row.already_known_refs.length, 0),
    malformed_refs_rejected_count: receiptRows.reduce((sum, row) => sum + row.malformed_refs_rejected.length, 0),
    excluded_row_count: excludedRows.length,
    receipts_settled_enough_for_caller_count: receiptRows.filter((row) => row.settled_enough_for_caller_receipt === true).length,
    watch_cadence_completion_decisions: 0,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    candidate_refs_written: 0,
    discovered_killmail_refs_written: 0,
    discovery_refs_written: false,
    evidence_eveidence_writes: 0,
    hydration_writes: 0,
    observation_created: false,
    watch_cadence_mutations: 0,
    receipt_mutations: 0,
    watch_bucket_status_mutations: 0,
    schema_changes: 0
  };
}

function normalizeExcludedRows(rows = []) {
  return rows.map((row) => ({
    ...row,
    enters_settled_receipt_boundary: false,
    receipt_projection_created: false,
    writes_receipt: false,
    watch_cadence_decided: false,
    provider_calls: 0,
    evidence_eveidence_written: 0,
    hydration_writes: 0,
    observation_created: false,
    watch_cadence_mutated: false,
    bucket_status_mutated: false,
    receipt_mutated: false
  }));
}

function trustedLandingPreview(landingPreview) {
  return {
    ...landingPreview,
    action: landingPreview.action || 'trusted-supplied-candidate-ref-landing-preview'
  };
}

function zeroSideEffects() {
  return {
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    candidate_refs_written: 0,
    discovered_killmail_refs_written: 0,
    discovery_refs_written: false,
    evidence_eveidence_writes: 0,
    hydration_writes: 0,
    observation_created: false,
    watch_cadence_mutations: 0,
    bucket_status_mutations: 0,
    receipt_mutations: 0,
    schema_changes: 0
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

function unique(values) {
  return [...new Set(values)];
}

function toIntegerOrNull(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  buildDiscoverySettledReceiptBoundaryPreview
};
