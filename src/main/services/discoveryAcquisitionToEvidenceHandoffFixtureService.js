const { buildWatchDiscoveryAcquisitionSplitFixturePreview } = require('./watchDiscoveryAcquisitionSplitFixtureService');

const ACTION = 'discovery.acquisition_to_evidence_handoff_fixture.preview';

function buildDiscoveryAcquisitionToEvidenceHandoffFixturePreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const bridge = buildWatchDiscoveryAcquisitionSplitFixturePreview(db, {
    ...input,
    now
  }, context);
  const normalizedCandidates = normalizeCandidateRefs(bridge);
  const dedupe = dedupeCandidates(normalizedCandidates);
  const maxHandoffCandidates = Number.isFinite(Number(input.maxHandoffCandidates))
    ? Math.max(0, Number(input.maxHandoffCandidates))
    : 2;
  const handoff = buildEvidenceExpansionHandoff({
    now,
    bridge,
    uniqueCandidates: dedupe.unique_candidates,
    maxHandoffCandidates
  });
  const notSelected = notSelectedCandidates({
    normalizedCandidates,
    duplicateCandidates: dedupe.duplicate_candidates,
    selectedCandidates: handoff.handoff_candidates,
    bridge
  });
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Discovery acquisition to Evidence handoff fixture proof',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    fixture_only: true,
    renderer_eligible: true,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
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
    esi_evidence_expansion_run: false,
    evidence_handoff_only: true,
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
    acquisition_request: bridge.discovery_acquisition_request,
    provider_facing_packets: providerFacingPackets(bridge),
    fixture_zkill_outcome_summary: bridge.fixture_provider_outcome_summary,
    normalized_candidate_refs: normalizedCandidates,
    candidate_dedupe_posture: {
      basis: 'killmail_id_and_hash',
      input_candidate_count: normalizedCandidates.length,
      unique_candidate_count: dedupe.unique_candidates.length,
      duplicate_candidate_count: dedupe.duplicate_candidates.length,
      duplicate_candidates: dedupe.duplicate_candidates
    },
    canonical_discovery_receipt_basis: bridge.canonical_discovery_receipt_basis,
    watch_summary_projection: bridge.watch_summary_projection,
    evidence_expansion_handoff: {
      ...handoff,
      not_selected_candidates: notSelected
    },
    mixed_collector_non_invocation_proof: bridge.mixed_collector_non_invocation_proof,
    mirror_check: {
      represented_fixture_shapes: [
        'zkill_request_basis',
        'candidate_ref_extraction_basis',
        'candidate_provenance_basis',
        'dedupe_basis',
        'provider_outcome_basis',
        'esi_evidence_expansion_handoff_basis',
        'canonical_receipt_basis',
        'watch_summary_projection'
      ],
      parked_or_unproven_shapes: [
        'live_zkill_provider_calls',
        'durable_discovery_ref_persistence',
        'real_esi_evidence_expansion',
        'evidence_eveidence_writes',
        'mixed_collector_retirement_or_redirect',
        'durable_discovery_task_packet_receipt_schema',
        'watch_schedule_mutation_from_receipt'
      ],
      mixed_collectors_called_to_prove_this: false
    },
    source_bridge_summary: summarizeBridge(bridge),
    accepted_model: {
      discovery_role: 'provider_facing_acquisition_utility',
      discovery_outputs_possible_leads: true,
      evidence_expansion_handoff_is_not_evidence: true,
      esi_evidence_expansion_run: false,
      evidence_landing_or_write_performed: false,
      watch_receives_receipt_projection_without_owning_acquisition: true,
      candidate_refs_are_durable_discovery_refs: false,
      candidate_refs_are_evidence: false,
      hydration_or_metadata_written: false
    },
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && bridge.table_mutation_proof?.unchanged === true
    },
    boundary_flags: {
      providers_called: false,
      live_api_called: false,
      mixed_collectors_invoked: false,
      live_watch_dispatch_invoked: false,
      task_created: false,
      watch_mutated: false,
      discovery_refs_written: false,
      evidence_written: false,
      esi_evidence_expansion_run: false,
      hydration_written: false,
      api_logs_or_warnings_written: false,
      fetch_runs_written: false,
      schema_changed: false,
      queue_dispatcher_or_lease_created: false,
      support_artifact_created: false,
      ui_changed: false,
      runtime_enforcement_or_command_blocking_active: false,
      mixed_collectors_retired_or_redirected: false,
      protected_words_updated: false
    },
    boundary: [
      'Discovery owns acquisition, provider-facing packet shape, candidate normalization, dedupe posture, receipt basis, and handoff shape.',
      'ESI Evidence Expansion handoff candidates are shapes only; no ESI calls, Evidence/EVEidence writes, or Evidence landing happen here.',
      'Watch/source intent receives a receipt projection without owning acquisition meaning.',
      'Candidate refs are possible leads, not durable Discovery refs, Evidence/EVEidence, Hydration, Observation, Assessment, or task memory.',
      'No providers, live/API calls, mixed collectors, Watch execution, tasks, DB writes, schema, dispatcher, support artifacts, UI, enforcement, command blocking, or collector retirement/redirect are opened.'
    ]
  };
}

function providerFacingPackets(bridge) {
  return (bridge.packet_targets || []).map((target) => ({
    packet_index: target.packet_index,
    packet_count: target.packet_count,
    provider: target.provider_target?.provider || 'zkill',
    request_kind: target.provider_target?.target_kind || null,
    request_target_id: target.provider_target?.target_id ?? null,
    source_kind: target.source_kind || null,
    scope_key: target.scope_key || null,
    candidate_system_id: target.candidate_system_id ?? null,
    lookback_seconds: target.lookback_seconds ?? null,
    caps: target.caps || null,
    fixture_only: true,
    provider_calls: 0,
    live_api_calls: 0,
    provider_payload_used: false,
    request_basis: {
      source_action: ACTION,
      acquisition_request_id: bridge.discovery_acquisition_request?.request_id || null,
      provider_target_posture: target.provider_target || null
    }
  }));
}

function normalizeCandidateRefs(bridge) {
  const packets = bridge.canonical_discovery_receipt_basis?.packets || [];
  const candidates = [];
  for (const packet of packets) {
    for (const candidate of packet.candidate_ref_handles || []) {
      candidates.push({
        candidate_key: candidateKey(candidate),
        killmail_id: candidate.killmail_id,
        killmail_hash: candidate.killmail_hash,
        provider: 'zkill_fixture',
        source_provider: 'zkill',
        source_kind: candidate.source_kind || null,
        source_lane: candidate.source_lane || null,
        scope_key: candidate.scope_key || null,
        source_watch_id: bridge.source_watch?.watch_id ?? null,
        source_intent_kind: bridge.canonical_discovery_receipt_basis?.source_intent_kind || null,
        receipt_id: bridge.canonical_discovery_receipt_basis?.receipt_id || null,
        packet_id: packet.packet_id,
        packet_index: packet.packet_index,
        packet_scope_key: packet.packet_scope_key,
        candidate_system_id: candidate.candidate_system_id ?? packet.candidate_system_id ?? null,
        provider_outcome: packet.outcome,
        provider_target: packet.provider_target || null,
        candidate_only: true,
        fixture_only: true,
        durable_discovery_ref_written: false,
        evidence_written: false,
        hydration_written: false,
        basis: {
          candidate_ref_basis: 'fixture_zkill_candidate_ref',
          provider_outcome_basis: packet.outcome_basis || null,
          caller_correlation_basis: {
            source_watch: bridge.source_watch || null,
            scope_key: candidate.scope_key || null,
            receipt_id: bridge.canonical_discovery_receipt_basis?.receipt_id || null
          }
        }
      });
    }
  }
  return candidates;
}

function dedupeCandidates(candidates) {
  const seen = new Map();
  const unique = [];
  const duplicates = [];
  for (const candidate of candidates) {
    if (!seen.has(candidate.candidate_key)) {
      seen.set(candidate.candidate_key, candidate);
      unique.push(candidate);
      continue;
    }
    duplicates.push({
      ...candidate,
      duplicate_of_candidate_key: candidate.candidate_key,
      duplicate_reason: 'same_killmail_id_and_hash'
    });
  }
  return {
    unique_candidates: unique,
    duplicate_candidates: duplicates
  };
}

function buildEvidenceExpansionHandoff({ now, bridge, uniqueCandidates, maxHandoffCandidates }) {
  const selected = uniqueCandidates.slice(0, maxHandoffCandidates).map((candidate, index) => ({
    handoff_candidate_id: `esi_handoff_fixture_${index}_${candidate.killmail_id}`,
    handoff_lane: 'esi_evidence_expansion',
    handoff_status: 'selected_for_fixture_handoff',
    killmail_id: candidate.killmail_id,
    killmail_hash: candidate.killmail_hash,
    source_provider: candidate.source_provider,
    source_kind: candidate.source_kind,
    source_watch_id: candidate.source_watch_id,
    scope_key: candidate.scope_key,
    receipt_id: candidate.receipt_id,
    packet_id: candidate.packet_id,
    packet_index: candidate.packet_index,
    candidate_system_id: candidate.candidate_system_id,
    candidate_ref_basis: candidate.basis,
    candidate_only: true,
    fixture_only: true,
    esi_call_authorized: false,
    esi_call_performed: false,
    evidence_written: false,
    evidence_landing_performed: false,
    hydration_written: false
  }));

  return {
    handoff_id: `fixture_esi_evidence_handoff_${safe(bridge.canonical_discovery_receipt_basis?.receipt_id || 'none')}_${Date.parse(now) || 0}`,
    handoff_owner: 'ESI Evidence Expansion',
    produced_by: 'Discovery',
    handoff_only: true,
    fixture_only: true,
    selected_candidate_count: selected.length,
    max_handoff_candidates: maxHandoffCandidates,
    handoff_candidates: selected,
    esi_calls: 0,
    evidence_writes: 0,
    evidence_landing_performed: false
  };
}

function notSelectedCandidates({ normalizedCandidates, duplicateCandidates, selectedCandidates, bridge }) {
  const selectedKeys = new Set(selectedCandidates.map((candidate) => candidateKey(candidate)));
  const duplicateKeys = new Set(duplicateCandidates.map((candidate) => `${candidate.candidate_key}:${candidate.packet_id}`));
  const rows = [];

  for (const candidate of normalizedCandidates) {
    const duplicateIdentity = `${candidate.candidate_key}:${candidate.packet_id}`;
    if (duplicateKeys.has(duplicateIdentity)) {
      rows.push(notSelectedRow(candidate, 'duplicate_candidate_ref'));
    } else if (!selectedKeys.has(candidate.candidate_key)) {
      rows.push(notSelectedRow(candidate, 'max_handoff_candidates_reached'));
    }
  }

  if (!normalizedCandidates.length) {
    const outcomeCounts = bridge.fixture_provider_outcome_summary?.packet_outcome_counts || {};
    if (bridge.discovery_acquisition_request?.request_posture === 'held_by_external_io') {
      rows.push(reasonOnlyRow('held_by_external_io_before_acquisition'));
    } else if (outcomeCounts.complete_no_refs) {
      rows.push(reasonOnlyRow('complete_no_refs'));
    } else if (outcomeCounts.provider_deferred) {
      rows.push(reasonOnlyRow('provider_deferred'));
    } else if (outcomeCounts.failed_retryable) {
      rows.push(reasonOnlyRow('failed_retryable'));
    } else if (outcomeCounts.failed_terminal) {
      rows.push(reasonOnlyRow('failed_terminal'));
    } else {
      rows.push(reasonOnlyRow('no_candidate_refs_available'));
    }
  }

  return rows;
}

function notSelectedRow(candidate, reason) {
  return {
    candidate_key: candidate.candidate_key,
    killmail_id: candidate.killmail_id,
    killmail_hash: candidate.killmail_hash,
    packet_id: candidate.packet_id,
    packet_index: candidate.packet_index,
    reason,
    evidence_written: false,
    esi_call_performed: false
  };
}

function reasonOnlyRow(reason) {
  return {
    candidate_key: null,
    killmail_id: null,
    killmail_hash: null,
    packet_id: null,
    packet_index: null,
    reason,
    evidence_written: false,
    esi_call_performed: false
  };
}

function summarizeBridge(bridge) {
  return {
    action: bridge.action,
    read_only: bridge.read_only === true,
    source_kind: bridge.source_kind || null,
    pickup_packet_count: bridge.pickup_packet_count || 0,
    packet_outcome_counts: bridge.fixture_provider_outcome_summary?.packet_outcome_counts || {},
    watch_summary_projection: bridge.watch_summary_projection?.projection_name || null,
    mixed_collectors_invoked: bridge.mixed_collectors_invoked === true,
    evidence_writes: bridge.evidence_writes || 0,
    table_mutation_unchanged: bridge.table_mutation_proof?.unchanged === true
  };
}

function candidateKey(candidate = {}) {
  return `${candidate.killmail_id || 'unknown'}:${candidate.killmail_hash || 'unknown'}`;
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

function stableJson(value) {
  return JSON.stringify(value);
}

function safe(value) {
  return String(value || 'unknown').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'unknown';
}

module.exports = {
  buildDiscoveryAcquisitionToEvidenceHandoffFixturePreview
};
