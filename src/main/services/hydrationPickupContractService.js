const crypto = require('node:crypto');
const { buildHydrationRequestPosturePreview } = require('./hydrationRequestPostureService');

const NON_CANDIDATE_STATES = Object.freeze([
  'not_a_request',
  'invalid',
  'insufficient_basis',
  'already_local',
  'local_lookup_available',
  'held',
  'blocked'
]);

const FORGED_AUTHORITY_KEYS = Object.freeze([
  'localLabel',
  'local_label',
  'localLabelBasis',
  'local_label_basis',
  'storagePosture',
  'storage_posture',
  'storageGate',
  'storage_gate',
  'externalIoPosture',
  'external_io_posture',
  'externalIoState',
  'external_io_state',
  'liveGate',
  'live_gate',
  'cadencePosture',
  'cadence_posture',
  'gateSummary',
  'gate_summary',
  'postureRow',
  'posture_row',
  'pickupEligible',
  'pickup_eligible',
  'providerPosture',
  'provider_posture'
]);

function buildHydrationPickupContractPreview(db, input = {}, context = {}) {
  const requestInput = input.request_facts || input.requestFacts || input.request || input;
  const rebuiltPosture = buildHydrationRequestPosturePreview(db, requestInput, context);
  const contractHints = executionInputHints(rebuiltPosture, requestInput, input);
  const contractDigest = digest(contractHints);
  const suppliedPosture = input.request_posture || input.requestPosture || null;
  const candidate = pickupCandidate(rebuiltPosture);
  const rendererAuthority = rendererAuthorityReadout(input, context);

  return {
    action: 'metadata.hydration_pickup_contract.preview',
    classification: 'read-only selected-ID Hydration pickup eligibility contract preview',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    provider_calls: 0,
    hydration_execution_started: false,
    hydration_writes: 0,
    metadata_run_writes: 0,
    entity_writes: 0,
    activity_event_label_patches: 0,
    evidence_writes: 0,
    discovery_ref_mutations: 0,
    watch_mutations: 0,
    assessment_memory_mutations: 0,
    marked_mutations: 0,
    support_artifacts_created: 0,
    pickup_persisted: false,
    pickup_created: false,
    queue_persisted: false,
    persisted_queue: false,
    lease_persisted: false,
    retry_state_persisted: false,
    dispatcher_created: false,
    worker_created: false,
    queue_dispatches: 0,
    schema_changes: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    storage_config_writes: 0,
    external_io_config_writes: 0,
    ui_work: false,
    request_posture: postureSummary(rebuiltPosture),
    pickup_contract: {
      pickup_candidate: candidate.accepted,
      pickup_eligible_means_execution: false,
      pickup_eligible_means_authorization: false,
      non_durable: true,
      persisted: false,
      state: candidate.state,
      reason_codes: candidate.reason_codes,
      acceptance_basis: candidate.accepted ? 'provider_needed_released_to_normal_gates' : 'not_pickup_candidate',
      future_execution_input_hints: contractHints,
      future_execution_input_digest: contractDigest,
      request_digest_comparison: digestComparison({
        suppliedPosture,
        rebuiltPosture,
        contractDigest
      }),
      revalidation_required_before_execution: true,
      local_first_recheck_required_before_execution: true,
      renderer_input_authority: rendererAuthority,
      execution_authorized: false,
      provider_call_authorized: false,
      hydration_write_authorized: false
    },
    future_execution_contract: {
      input_is_hints_only: true,
      trusted_authority_source: 'future main-process revalidation from local state and current gates',
      required_hint_fields: [
        'id_type',
        'id_value',
        'source_surface',
        'source_context',
        'basis_anchor',
        'basis_layer',
        'request_reason',
        'request_posture_id',
        'request_digest',
        'posture_gate_summary'
      ],
      required_revalidation_steps: [
        'normalize selected ID',
        'rebuild local-first request posture from trusted local state',
        'short-circuit to local readability if a label is now local',
        'reject not_a_request, invalid, insufficient_basis, already_local, local_lookup_available, held, or blocked posture',
        'confirm provider_needed and released-to-normal-gates posture',
        'satisfy command confirmation and active policy before execution',
        'write only after provider result and write policy succeed'
      ],
      renderer_provided_local_labels_are_authority: false,
      renderer_provided_storage_posture_is_authority: false,
      renderer_provided_external_io_posture_is_authority: false,
      renderer_provided_live_cadence_posture_is_authority: false,
      renderer_provided_gate_summary_is_authority: false
    },
    boundary: [
      'Read-only pickup contract preview only; it does not create pickup work, queues, leases, retries, dispatcher packets, workers, execution, or writes.',
      'Pickup candidate means non-durable future execution input eligibility only; it is not provider execution or authorization.',
      'Future execution must rebuild local-first posture from trusted local state and current gates before any provider movement.',
      'Renderer-provided local labels, storage posture, External I/O posture, live/cadence posture, and gate summaries are explanation only, not authority.',
      'Local-first short-circuit must happen again at future execution time.'
    ]
  };
}

function pickupCandidate(posture) {
  const state = posture.request_posture_state;
  const providerPosture = posture.posture_row?.provider_posture || null;
  if (state === 'provider_needed' && providerPosture === 'released_to_normal_gates_only') {
    return {
      accepted: true,
      state: 'pickup_candidate',
      reason_codes: [
        'provider_needed',
        'released_to_normal_gates_only',
        'non_durable_candidate_only',
        'revalidation_required_before_execution',
        'not_authorization'
      ]
    };
  }
  return {
    accepted: false,
    state: NON_CANDIDATE_STATES.includes(state) ? 'not_pickup_candidate' : 'not_pickup_candidate',
    reason_codes: [
      `request_posture_state:${state || 'unknown'}`,
      `provider_posture:${providerPosture || 'unknown'}`,
      'pickup_candidate_rejected',
      'execution_not_authorized'
    ]
  };
}

function executionInputHints(posture, requestInput = {}, input = {}) {
  const request = posture.request || {};
  return {
    id_type: request.id_type || null,
    id_value: request.id_value || null,
    source_surface: request.source_surface || 'unspecified',
    source_context: request.source_context || null,
    basis_anchor: request.basis_anchor || null,
    basis_layer: request.basis_layer || input.basis_layer || input.basisLayer || null,
    request_reason: input.request_reason || input.requestReason || requestInput.request_reason || requestInput.requestReason || 'operator_attention',
    request_posture_id: posture.request_posture_id || null,
    request_digest: digest({
      id_type: request.id_type || null,
      id_value: request.id_value || null,
      source_surface: request.source_surface || 'unspecified',
      source_context: request.source_context || null,
      basis_anchor: request.basis_anchor || null,
      basis_layer: request.basis_layer || input.basis_layer || input.basisLayer || null,
      request_reason: input.request_reason || input.requestReason || requestInput.request_reason || requestInput.requestReason || 'operator_attention'
    }),
    posture_gate_summary: {
      request_posture_state: posture.request_posture_state,
      label_state: posture.posture_row?.label_state || null,
      provider_needed: posture.posture_row?.provider_needed === true,
      provider_posture: posture.posture_row?.provider_posture || null,
      external_io: posture.external_io || null,
      storage_write_posture: posture.storage_write_posture || null,
      live_provider_gate: posture.live_provider_gate
        ? {
          allowed: posture.live_provider_gate.allowed === true,
          state: posture.live_provider_gate.state,
          blocker_codes: (posture.live_provider_gate.blockers || []).map((entry) => entry.code || 'unknown')
        }
        : null
    },
    hint_authority: 'explanation_only_rebuild_required'
  };
}

function postureSummary(posture) {
  return {
    action: posture.action,
    request_posture_id: posture.request_posture_id,
    request_posture_state: posture.request_posture_state,
    label_state: posture.posture_row?.label_state || null,
    provider_needed: posture.posture_row?.provider_needed === true,
    provider_posture: posture.posture_row?.provider_posture || null,
    pickup_eligible_from_request_posture: posture.posture_row?.pickup_eligible === true,
    pickup_eligible_is_authorization: false,
    reason_codes: posture.posture_row?.reason_codes || []
  };
}

function digestComparison({ suppliedPosture, rebuiltPosture, contractDigest }) {
  const suppliedId = suppliedPosture?.request_posture_id || suppliedPosture?.requestPostureId || null;
  return {
    supplied_request_posture_id: suppliedId,
    rebuilt_request_posture_id: rebuiltPosture.request_posture_id || null,
    request_posture_id_matches_rebuilt: suppliedId ? suppliedId === rebuiltPosture.request_posture_id : null,
    future_execution_input_digest: contractDigest,
    comparison_is_authority: false,
    comparison_is_freshness_evidence_only: true
  };
}

function rendererAuthorityReadout(input = {}, context = {}) {
  const ignoredKeys = context.source === 'renderer'
    ? FORGED_AUTHORITY_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(input, key))
    : [];
  return {
    source: context.source || 'trusted-main',
    renderer_payload_authoritative: false,
    forged_authority_keys_ignored: ignoredKeys,
    local_labels_authoritative: false,
    storage_posture_authoritative: false,
    external_io_posture_authoritative: false,
    live_cadence_posture_authoritative: false,
    gate_summary_authoritative: false
  };
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
}

module.exports = {
  buildHydrationPickupContractPreview
};
