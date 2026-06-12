const { buildDiscoveryPickupConsumerFixtureProof } = require('./discoveryPickupConsumerFixtureService');
const { buildWatchDiscoveryPickupPacketProof } = require('./watchDiscoveryPickupPacketProofService');

const ACTION = 'discovery.receipt_projection_fixture.preview';
const MODEL_VERSION = 'discovery_receipt_fixture_v1';
const PACKET_OUTCOMES = new Set([
  'complete_refs_found',
  'complete_no_refs',
  'partial_deferred',
  'provider_deferred',
  'acquisition_capped',
  'failed_retryable',
  'failed_terminal'
]);
const PROJECTIONS = new Set(['minimal', 'watch_summary', 'operator_detail', 'debug_basis']);

function buildDiscoveryReceiptProjectionFixturePreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const generatedAt = input.now || new Date().toISOString();
  const projectionRequested = PROJECTIONS.has(input.projection) ? input.projection : 'minimal';
  const held = input.requestPosture === 'held_by_external_io' || input.externalIoState === 'off';
  const pickupPacketProof = held
    ? heldPickupProof(input)
    : buildWatchDiscoveryPickupPacketProof(db, { ...input, now: generatedAt }, context);
  const consumerProof = held
    ? { candidate_refs: [], table_mutation_proof: { unchanged: true } }
    : buildDiscoveryPickupConsumerFixtureProof(db, { ...input, now: generatedAt }, context);
  const packets = pickupPacketProof.pickup_packets || [];
  const candidates = held ? [] : fixtureCandidatesForPackets(consumerProof.candidate_refs || [], packets, input);
  const canonical = canonicalReceiptFor({
    generatedAt,
    projectionRequested,
    held,
    holdReason: input.holdReason || (held ? 'external_io_disabled_before_acquisition' : null),
    pickupProof: pickupPacketProof,
    packets,
    candidates,
    fixtureOutcomes: normalizeFixtureOutcomes(input.fixtureOutcomes),
    fixtureCase: input.fixtureCase || null
  });
  const projection = projectReceipt(canonical, projectionRequested);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Discovery receipt projection fixture proof',
    generated_at: generatedAt,
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
    task_runner_methods_called: [],
    tasks_created: 0,
    queue_created: false,
    dispatcher_created: false,
    leases_created: 0,
    discovery_refs_written: false,
    discovered_killmail_refs_written: 0,
    discovery_refs_mutated: 0,
    evidence_written: false,
    evidence_writes: 0,
    hydration_writes: 0,
    metadata_writes: 0,
    api_request_log_writes: 0,
    data_quality_warning_writes: 0,
    watch_mutations: 0,
    schema_changes: 0,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    durable_task_packet_schema_created: false,
    provider_work_created: false,
    canonical_receipt_basis: canonical,
    projection,
    table_mutation_proof: {
        before,
        after,
        unchanged: stableJson(before) === stableJson(after)
        && (held || pickupPacketProof.table_mutation_proof?.unchanged === true)
        && consumerProof.table_mutation_proof?.unchanged === true
    },
    boundary: [
      'Discovery owns the canonical receipt basis; caller projections are safe views only.',
      'Discovery reports facts and limits; it does not report caller satisfaction.',
      'Candidate refs are possible leads, not durable Discovery refs, Evidence/EVEidence, or task memory.',
      'Evidence/EVEidence begins at landing/write, not at this fixture receipt.',
      'No providers, live/API calls, Watch execution, dispatch runners, collectors, DB writes, schema, UI, enforcement, or support artifacts are opened.'
    ]
  };
}

function canonicalReceiptFor(input) {
  const firstPacket = input.packets[0] || null;
  const source = sourceFor(input.pickupProof, firstPacket);
  const packetReceipts = input.held ? [] : input.packets.map((packet, index) => packetReceiptFor(packet, index, input));
  const allCandidateRefs = packetReceipts.flatMap((packet) => packet.candidate_ref_handles);
  const outcomeCounts = countOutcomes(packetReceipts);
  const missingBasisFlags = receiptMissingBasis(input, packetReceipts);
  const capBasis = capBasisFor(packetReceipts);

  return {
    receipt_id: receiptIdFor(source, input.generatedAt),
    receipt_model_version: MODEL_VERSION,
    generated_at: input.generatedAt,
    source_intent_kind: source.kind,
    source_intent_id: source.id,
    source_run_id: null,
    source_watch_id: source.watchId,
    projection_requested: input.projectionRequested,
    projection_emitted: input.projectionRequested,
    scope_key: source.scopeKey,
    scope_basis: source.scopeBasis,
    requested_window: requestedWindowFor(firstPacket),
    provider_path: 'zkill_fixture',
    request_posture: input.held ? 'held_by_external_io' : 'attempted_fixture_acquisition',
    hold_reason: input.holdReason,
    held_before_acquisition: input.held,
    accepted_packet_count: input.packets.length,
    attempted_packet_count: input.held ? 0 : input.packets.length,
    completed_packet_count: packetReceipts.filter((packet) => packet.completed_at && !['provider_deferred', 'partial_deferred'].includes(packet.outcome)).length,
    packet_outcomes_emitted: !input.held,
    packet_outcome_counts: input.held ? {} : outcomeCounts,
    ref_count: allCandidateRefs.length,
    candidate_ref_handles: allCandidateRefs.slice(0, 10),
    deferred_count: (outcomeCounts.provider_deferred || 0) + (outcomeCounts.partial_deferred || 0),
    retryable_count: outcomeCounts.failed_retryable || 0,
    failed_terminal_count: outcomeCounts.failed_terminal || 0,
    cap_basis: capBasis,
    missing_basis_flags: missingBasisFlags,
    confidence: input.held ? 'high_fixture_request_posture' : 'high_fixture_non_durable',
    boundary_flags: boundaryFlags(),
    packets: packetReceipts
  };
}

function packetReceiptFor(packet, index, input) {
  const fixture = outcomeFor(index, packet, input.fixtureOutcomes, input.fixtureCase);
  const outcome = fixture.outcome;
  const refs = refsForPacket(packet, input.candidates, fixture);
  const attemptedAt = input.generatedAt;
  const completedAt = ['provider_deferred', 'partial_deferred'].includes(outcome) ? null : input.generatedAt;
  return {
    packet_id: `fixture_packet_${packet.source_kind || 'unknown'}_${packet.watch_id || 'none'}_${index}`,
    packet_index: packet.packet_index ?? index,
    packet_count: packet.packet_count ?? input.packets.length,
    packet_scope_key: packetScopeKey(packet),
    candidate_system_id: packet.candidate_system_id ?? null,
    provider: 'zkill_fixture',
    provider_target: packet.provider_target_posture || null,
    lookback_window: {
      lookback_seconds: packet.lookback_seconds ?? null
    },
    cap_summary: fixture.cap_summary || capSummaryFor(packet, outcome),
    attempted_at: attemptedAt,
    completed_at: completedAt,
    outcome,
    outcome_basis: fixture.outcome_basis || outcomeBasisFor(outcome),
    refs_found_count: refs.length,
    candidate_ref_handles: refs.map(candidateHandle),
    deferred_reason: fixture.deferred_reason || deferredReasonFor(outcome),
    failure_class: fixture.failure_class || failureClassFor(outcome),
    retry_after_or_next_eligible_at: fixture.retry_after_or_next_eligible_at || null,
    missing_basis_flags: packetMissingBasis(outcome)
  };
}

function projectReceipt(canonical, projectionName) {
  const base = {
    projection_name: projectionName,
    projection_source: 'Discovery-owned canonical receipt basis',
    meaning_owner: 'Discovery',
    projection_transfers_meaning_ownership: false,
    receipt_id: canonical.receipt_id,
    source_intent_kind: canonical.source_intent_kind,
    source_intent_id: canonical.source_intent_id,
    source_watch_id: canonical.source_watch_id,
    scope_key: canonical.scope_key,
    request_posture: canonical.request_posture,
    hold_reason: canonical.hold_reason,
    held_before_acquisition: canonical.held_before_acquisition,
    accepted_packet_count: canonical.accepted_packet_count,
    attempted_packet_count: canonical.attempted_packet_count,
    completed_packet_count: canonical.completed_packet_count,
    packet_outcomes_emitted: canonical.packet_outcomes_emitted,
    packet_outcome_counts: canonical.packet_outcome_counts,
    ref_count: canonical.ref_count,
    deferred_count: canonical.deferred_count,
    retryable_count: canonical.retryable_count,
    failed_terminal_count: canonical.failed_terminal_count,
    cap_basis: canonical.cap_basis,
    missing_basis_flags: canonical.missing_basis_flags,
    confidence: canonical.confidence,
    boundary_flags: canonical.boundary_flags
  };

  if (projectionName === 'minimal') {
    return {
      ...base,
      candidate_ref_handles: canonical.candidate_ref_handles.slice(0, 2),
      omitted_field_note: 'minimal omits packet list and detailed provider basis; safety fields are retained.'
    };
  }
  if (projectionName === 'watch_summary') {
    return {
      ...base,
      requested_window: canonical.requested_window,
      scope_basis: canonical.scope_basis,
      recovery_candidate_counts: {
        deferred: canonical.deferred_count,
        retryable: canonical.retryable_count,
        failed_terminal: canonical.failed_terminal_count
      },
      omitted_field_note: 'watch_summary omits packet detail volume; Watch does not own Discovery receipt meaning.'
    };
  }
  if (projectionName === 'operator_detail') {
    return {
      ...base,
      requested_window: canonical.requested_window,
      scope_basis: canonical.scope_basis,
      candidate_ref_handles: canonical.candidate_ref_handles,
      packets: canonical.packets.map((packet) => ({
        packet_id: packet.packet_id,
        packet_index: packet.packet_index,
        packet_scope_key: packet.packet_scope_key,
        provider_target: packet.provider_target,
        outcome: packet.outcome,
        outcome_basis: packet.outcome_basis,
        refs_found_count: packet.refs_found_count,
        candidate_ref_handles: packet.candidate_ref_handles,
        cap_summary: packet.cap_summary,
        deferred_reason: packet.deferred_reason,
        failure_class: packet.failure_class,
        retry_after_or_next_eligible_at: packet.retry_after_or_next_eligible_at,
        missing_basis_flags: packet.missing_basis_flags
      })),
      omitted_field_note: 'operator_detail includes packet detail with bounded candidate handles.'
    };
  }
  return {
    ...base,
    canonical_receipt_basis: canonical,
    omitted_field_note: 'debug_basis includes the full bounded canonical basis.'
  };
}

function outcomeFor(index, packet, fixtureOutcomes, fixtureCase) {
  const explicit = fixtureOutcomes[index] || fixtureOutcomes[String(packet.candidate_system_id)] || fixtureOutcomes.default;
  if (explicit) {
    return normalizeOutcomeFixture(explicit);
  }
  if (fixtureCase === 'no_refs') {
    return { outcome: 'complete_no_refs' };
  }
  return { outcome: 'complete_refs_found' };
}

function normalizeFixtureOutcomes(value) {
  if (!value) {
    return {};
  }
  if (Array.isArray(value)) {
    return Object.fromEntries(value.map((entry, index) => [index, normalizeOutcomeFixture(entry)]));
  }
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeOutcomeFixture(entry)]));
}

function normalizeOutcomeFixture(value) {
  if (typeof value === 'string') {
    return { outcome: validOutcome(value) };
  }
  return {
    ...value,
    outcome: validOutcome(value.outcome)
  };
}

function validOutcome(value) {
  if (!PACKET_OUTCOMES.has(value)) {
    return 'complete_refs_found';
  }
  return value;
}

function refsForPacket(packet, candidates, fixture) {
  if (!['complete_refs_found', 'partial_deferred', 'acquisition_capped'].includes(fixture.outcome)) {
    return [];
  }
  if (Array.isArray(fixture.candidate_ref_handles)) {
    return fixture.candidate_ref_handles.map((ref, index) => ({
      killmail_id: ref.killmail_id || 700000000 + index,
      killmail_hash: ref.killmail_hash || `fixture_hash_${index}`,
      source_lane: ref.source_lane || 'fixture',
      source_kind: ref.source_kind || packet.source_kind,
      scope_key: ref.scope_key || packet.scope_key,
      candidate_system_id: ref.candidate_system_id ?? packet.candidate_system_id ?? null
    }));
  }
  const matching = candidates.filter((candidate) => {
    if (packet.source_kind === 'system_radius') {
      return candidate.candidate_system_id === packet.candidate_system_id;
    }
    return candidate.source_kind === packet.source_kind && candidate.pickup_packet_index === packet.packet_index;
  });
  return matching.length ? matching : [{
    killmail_id: 700363000 + (packet.packet_index || 0),
    killmail_hash: `hs363_${packet.source_kind || 'packet'}_${packet.packet_index || 0}`,
    source_lane: packet.source_lane,
    source_kind: packet.source_kind,
    scope_key: packet.scope_key,
    candidate_system_id: packet.candidate_system_id ?? null
  }];
}

function fixtureCandidatesForPackets(candidates, packets, input) {
  if (Array.isArray(input.fixtureCandidateRefs)) {
    return input.fixtureCandidateRefs;
  }
  return candidates.length ? candidates : packets.map((packet, index) => ({
    killmail_id: 700363000 + index,
    killmail_hash: `hs363_fixture_hash_${index}`,
    source_lane: packet.source_lane,
    source_kind: packet.source_kind,
    scope_key: packet.scope_key,
    pickup_packet_index: packet.packet_index,
    candidate_system_id: packet.candidate_system_id ?? null
  }));
}

function candidateHandle(candidate) {
  return {
    killmail_id: candidate.killmail_id,
    killmail_hash: candidate.killmail_hash,
    source_lane: candidate.source_lane || null,
    source_kind: candidate.source_kind || null,
    scope_key: candidate.scope_key || null,
    candidate_system_id: candidate.candidate_system_id ?? null,
    candidate_only: true,
    evidence_written: false,
    durable_discovery_ref_written: false
  };
}

function sourceFor(pickupProof, firstPacket) {
  const selected = pickupProof.selected_watch || pickupProof.source_pickup_proof?.selected_watch || null;
  const sourceKind = firstPacket?.source_kind || selected?.watch_type || 'unknown';
  return {
    kind: sourceKind === 'system_radius' ? 'watch_system_radius' : sourceKind === 'actor' ? 'watch_actor' : sourceKind,
    id: selected?.scope_key || firstPacket?.scope_key || null,
    watchId: selected?.watch_id ?? firstPacket?.watch_id ?? null,
    scopeKey: firstPacket?.scope_key || selected?.scope_key || null,
    scopeBasis: scopeBasisFor(firstPacket)
  };
}

function scopeBasisFor(packet) {
  if (!packet) {
    return {
      basis_kind: 'held_request_or_no_pickup_packet',
      accepted_scope_source: null
    };
  }
  if (packet.source_kind === 'system_radius') {
    return {
      basis_kind: 'stored_accepted_included_system_ids',
      accepted_scope_source: packet.accepted_scope_source || 'stored_watch_scope',
      accepted_system_ids: packet.accepted_system_ids || [],
      center_system_id: packet.center_system_id ?? null,
      radius_jumps: packet.radius_jumps ?? null,
      center_radius_used_as_execution_authority: false
    };
  }
  return {
    basis_kind: 'actor_watch_source_fields',
    entity_type: packet.entity_type || null,
    entity_id: packet.entity_id ?? null,
    entity_name: packet.entity_name || null
  };
}

function requestedWindowFor(packet) {
  return {
    lookback_seconds: packet?.lookback_seconds ?? null,
    window_basis: packet ? 'pickup_packet_lookback' : 'not_attempted'
  };
}

function packetScopeKey(packet) {
  if (packet.source_kind === 'system_radius') {
    return `${packet.scope_key}:system:${packet.candidate_system_id}`;
  }
  return packet.scope_key || null;
}

function capSummaryFor(packet, outcome) {
  const capped = outcome === 'acquisition_capped';
  return {
    capped,
    cap_basis: capped ? 'fixture_acquisition_cap' : null,
    caps: packet.caps || null
  };
}

function outcomeBasisFor(outcome) {
  return {
    basis_kind: 'fixture_provider_return',
    provider_payload_used: false,
    outcome_is_fixture: true,
    outcome
  };
}

function deferredReasonFor(outcome) {
  if (outcome === 'provider_deferred') {
    return 'fixture_provider_deferred';
  }
  if (outcome === 'partial_deferred') {
    return 'fixture_partial_provider_deferred';
  }
  return null;
}

function failureClassFor(outcome) {
  if (outcome === 'failed_retryable') {
    return 'retryable';
  }
  if (outcome === 'failed_terminal') {
    return 'terminal';
  }
  return null;
}

function packetMissingBasis(outcome) {
  const flags = ['non_durable_fixture_packet'];
  if (outcome === 'acquisition_capped') {
    flags.push('cap_basis_fixture_only');
  }
  if (['provider_deferred', 'partial_deferred'].includes(outcome)) {
    flags.push('provider_deferred_fixture_only');
  }
  if (['failed_retryable', 'failed_terminal'].includes(outcome)) {
    flags.push('failure_class_fixture_only');
  }
  return flags;
}

function receiptMissingBasis(input, packets) {
  const flags = ['non_durable_fixture_receipt'];
  if (input.held) {
    flags.push('held_by_external_io_request_posture_only');
  }
  if (packets.some((packet) => packet.outcome === 'acquisition_capped')) {
    flags.push('cap_basis_fixture_only');
  }
  if (packets.some((packet) => ['provider_deferred', 'partial_deferred'].includes(packet.outcome))) {
    flags.push('provider_deferred_fixture_only');
  }
  if (packets.some((packet) => ['failed_retryable', 'failed_terminal'].includes(packet.outcome))) {
    flags.push('failure_class_fixture_only');
  }
  return flags;
}

function capBasisFor(packets) {
  const capped = packets.filter((packet) => packet.outcome === 'acquisition_capped');
  return {
    capped_packet_count: capped.length,
    basis_kind: capped.length ? 'fixture_acquisition_cap' : null,
    full_coverage_claimed: false
  };
}

function countOutcomes(packets) {
  return packets.reduce((acc, packet) => {
    acc[packet.outcome] = (acc[packet.outcome] || 0) + 1;
    return acc;
  }, {});
}

function boundaryFlags() {
  return {
    discovery_owns_receipt_basis: true,
    projection_is_view_only: true,
    caller_satisfaction_not_reported: true,
    candidate_refs_are_possible_leads: true,
    candidate_refs_are_not_evidence: true,
    candidate_refs_are_not_task_memory: true,
    evidence_landing_not_performed: true,
    evidence_written: false,
    hydration_completion_claimed: false,
    observation_completion_claimed: false,
    assessment_completion_claimed: false,
    full_coverage_claimed: false
  };
}

function heldPickupProof(input) {
  return {
    selected_watch: input.selectedWatch || null,
    source_pickup_proof: {
      pickup_packets: []
    }
  };
}

function receiptIdFor(source, generatedAt) {
  return `fixture_receipt_${safe(source.kind)}_${safe(source.scopeKey || source.id || 'held')}_${Date.parse(generatedAt) || 0}`;
}

function safe(value) {
  return String(value || 'unknown').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'unknown';
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

module.exports = {
  buildDiscoveryReceiptProjectionFixturePreview
};
