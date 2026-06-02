const { buildHydrationCandidatePreview } = require('./hydrationCandidatePreviewService');

const DEFAULT_SELECTED_LIMIT = 8;
const MAX_SELECTED_LIMIT = 20;
const DEFAULT_CANDIDATE_LIMIT = 50;

function buildHydrationAttentionLensPreview(db, input = {}) {
  const selectedLimit = boundedLimit(input.selectedLimit || input.selected_limit || input.limit, DEFAULT_SELECTED_LIMIT, MAX_SELECTED_LIMIT);
  const candidatePreview = buildHydrationCandidatePreview(db, {
    ...input,
    limit: boundedLimit(input.candidateLimit || input.candidate_limit || DEFAULT_CANDIDATE_LIMIT, DEFAULT_CANDIDATE_LIMIT, DEFAULT_CANDIDATE_LIMIT)
  });
  const lensInput = normalizeLensInput(input);
  const ranked = rankCandidates(candidatePreview.candidates || [], lensInput);
  const selected = ranked
    .filter((entry) => entry.attention_score > 0)
    .slice(0, selectedLimit);
  const selectedKeys = new Set(selected.map((entry) => entry.dedupe_key));
  const deferred = ranked
    .filter((entry) => !selectedKeys.has(entry.dedupe_key))
    .map((entry) => ({
      ...entry,
      deferred_reason: deferredReason(entry, selectedKeys.size >= selectedLimit)
    }));

  return {
    action: 'metadata.hydration_attention_lens.preview',
    classification: 'read-only Hydration attention lens preview',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    provider_calls: 0,
    hydration_writes: 0,
    entity_writes: 0,
    activity_event_label_patches: 0,
    metadata_run_writes: 0,
    evidence_writes: 0,
    discovery_ref_mutations: 0,
    watch_mutations: 0,
    assessment_memory_mutations: 0,
    marked_mutations: 0,
    support_artifacts_created: 0,
    persisted_queue: false,
    schema_changes: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    lens_input: lensInput,
    source_preview: {
      action: candidatePreview.action,
      candidate_count: candidatePreview.summary.total_candidates,
      candidate_deduped_by: candidatePreview.candidate_deduped_by,
      provider_calls: candidatePreview.provider_calls,
      hydration_writes: candidatePreview.hydration_writes,
      persisted_queue: candidatePreview.persisted_queue
    },
    summary: summaryFor({ selected, deferred, candidatePreview }),
    selected_candidates: selected.map(selectedCandidate),
    deferred_candidates: deferred.slice(0, selectedLimit).map(deferredCandidate),
    candidate_groups: candidateGroups(selected, deferred),
    priority_posture: {
      view_local_record_not_starved_by_watch_background: true,
      watch_background_candidates_are_patient: true,
      corpus_hygiene_can_defer: true,
      selected_attention_is_not_provider_authorization: true,
      no_catch_up_flood: true
    },
    evidence_boundary: {
      ids_are_facts: true,
      labels_are_readability: true,
      hydration_creates_evidence: false,
      unhydrated_ids_are_failure: false,
      unhydrated_ids_are_missing_evidence: false,
      selected_attention_is_assessment_memory: false,
      selected_attention_is_product_truth: false,
      discovery_refs_are_evidence: false,
      esi_evidence_expansion_called_hydration: false
    },
    boundary: [
      'IDs remain facts; labels are readability landmarks over local records.',
      'Unhydrated IDs are not failure, missing Evidence/EVEidence, or proof gaps.',
      'The lens is a read-only preview, not a persisted Hydration queue and not authorization to call providers.',
      'Provider-needed labels, known-local labels, and local SDE gaps remain separate candidate groups.',
      'Watch/background readability demand is patient and must not starve view/local-record readability.'
    ]
  };
}

function normalizeLensInput(input = {}) {
  const reportTarget = normalizeReportTarget(input.reportTarget || input.report_target || input.target || {});
  const explicitKeys = uniqueStrings(input.candidateKeys || input.candidate_keys || input.dedupeKeys || input.dedupe_keys);
  const explicitIds = normalizeExplicitIds(input.explicitIds || input.explicit_ids || input.ids || []);
  const lensType = explicitKeys.length || explicitIds.length
    ? 'explicit_ids'
    : reportTarget.entity_type && reportTarget.entity_id
      ? 'target_report_scope'
      : 'current_local_record_scope';
  return {
    lens_type: lensType,
    report_target: reportTarget,
    explicit_candidate_keys: explicitKeys,
    explicit_ids: explicitIds,
    basis: lensBasis(lensType),
    persisted_queue: false,
    provider_authorization: false,
    real_operator_data_inspection: false
  };
}

function rankCandidates(candidates, lensInput) {
  return candidates
    .map((candidate) => {
      const attention = attentionFor(candidate, lensInput);
      return {
        ...candidate,
        attention_score: attention.score,
        attention_basis: attention.basis,
        attention_role: attention.role
      };
    })
    .sort((a, b) => {
      const scoreDiff = b.attention_score - a.attention_score;
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      const laneDiff = laneRank(a) - laneRank(b);
      if (laneDiff !== 0) {
        return laneDiff;
      }
      const countDiff = Number(b.killmail_count || 0) - Number(a.killmail_count || 0);
      if (countDiff !== 0) {
        return countDiff;
      }
      return a.dedupe_key.localeCompare(b.dedupe_key);
    });
}

function attentionFor(candidate, lensInput) {
  const basis = [];
  let score = 0;
  let role = 'deferred_background';

  if (lensInput.explicit_candidate_keys.includes(candidate.dedupe_key) || matchesExplicitId(candidate, lensInput.explicit_ids)) {
    score += 200;
    basis.push('explicit_lens_id');
    role = 'selected_readability_landmark';
  }
  if (matchesReportTarget(lensInput.report_target, candidate)) {
    score += 80;
    basis.push('report_target_match');
    role = 'selected_readability_landmark';
  }
  if (candidate.lanes.includes('target_report_scoped')) {
    score += 45;
    basis.push('target_or_report_scoped_lane');
    role = 'selected_readability_landmark';
  }
  if (candidate.lanes.includes('view_local_record')) {
    score += 30;
    basis.push('view_local_record_lane');
    role = 'selected_readability_landmark';
  }
  if (Number(candidate.killmail_count || 0) > 1) {
    score += 10;
    basis.push('repeated_local_appearance');
  }
  if (candidate.label_state === 'local_sde_gap') {
    score += 5;
    basis.push('local_sde_lookup_gap_visible');
  }
  if (candidate.lanes.includes('watch_background') && !candidate.lanes.includes('target_report_scoped')) {
    score -= 20;
    basis.push('watch_background_deferred_behind_view');
  }
  if (candidate.lanes.includes('corpus_hygiene_low_priority') && candidate.lanes.length === 1) {
    score -= 30;
    basis.push('corpus_hygiene_low_priority');
  }

  return {
    score: Math.max(0, score),
    basis,
    role
  };
}

function selectedCandidate(candidate) {
  return {
    dedupe_key: candidate.dedupe_key,
    candidate_kind: candidate.candidate_kind,
    entity_type: candidate.entity_type,
    entity_id: candidate.entity_id,
    lookup_type: candidate.lookup_type,
    lookup_id: candidate.lookup_id,
    label_state: candidate.label_state,
    local_label: candidate.local_label,
    provider_needed: candidate.provider_needed,
    group: groupFor(candidate),
    attention_role: candidate.attention_role,
    attention_basis: candidate.attention_basis,
    lanes: candidate.lanes,
    source_anchors: candidate.source_anchors,
    source_basis: candidate.source_basis,
    killmail_count: candidate.killmail_count,
    appearance_count: candidate.appearance_count,
    hydration_boundary: candidate.hydration_boundary,
    evidence_boundary: candidate.evidence_boundary
  };
}

function deferredCandidate(candidate) {
  return {
    dedupe_key: candidate.dedupe_key,
    candidate_kind: candidate.candidate_kind,
    entity_type: candidate.entity_type,
    entity_id: candidate.entity_id,
    lookup_type: candidate.lookup_type,
    lookup_id: candidate.lookup_id,
    label_state: candidate.label_state,
    provider_needed: candidate.provider_needed,
    group: groupFor(candidate),
    deferred_reason: candidate.deferred_reason,
    lanes: candidate.lanes,
    source_anchors: candidate.source_anchors,
    killmail_count: candidate.killmail_count,
    appearance_count: candidate.appearance_count
  };
}

function summaryFor({ selected, deferred, candidatePreview }) {
  return {
    source_candidate_count: candidatePreview.summary.total_candidates,
    selected_candidate_count: selected.length,
    deferred_background_candidate_count: deferred.length,
    provider_needed_selected_count: selected.filter((entry) => entry.provider_needed === true).length,
    known_local_selected_count: selected.filter((entry) => isKnownLocal(entry)).length,
    local_sde_gap_selected_count: selected.filter((entry) => entry.label_state === 'local_sde_gap').length,
    provider_needed_deferred_count: deferred.filter((entry) => entry.provider_needed === true).length,
    known_local_deferred_count: deferred.filter((entry) => isKnownLocal(entry)).length,
    local_sde_gap_deferred_count: deferred.filter((entry) => entry.label_state === 'local_sde_gap').length,
    labels_are_readability: true,
    ids_are_facts: true,
    unhydrated_ids_are_failure: false,
    unhydrated_ids_are_missing_evidence: false,
    selected_attention_is_queue: false,
    selected_attention_authorizes_provider_calls: false,
    view_local_record_not_starved_by_watch_background: true
  };
}

function candidateGroups(selected, deferred) {
  return {
    selected: countGroups(selected),
    deferred: countGroups(deferred),
    group_meaning: {
      provider_needed: 'Entity label readability may need future provider-backed Hydration under gates.',
      known_local: 'Readable local label already exists or is stale local metadata.',
      local_sde_gap: 'Static type/geography label gap belongs to local SDE lookup readiness, not ESI Hydration.'
    }
  };
}

function countGroups(candidates) {
  return candidates.reduce((counts, candidate) => {
    const group = groupFor(candidate);
    counts[group] = (counts[group] || 0) + 1;
    return counts;
  }, {
    provider_needed: 0,
    known_local: 0,
    local_sde_gap: 0
  });
}

function groupFor(candidate) {
  if (candidate.label_state === 'local_sde_gap') {
    return 'local_sde_gap';
  }
  return isKnownLocal(candidate) ? 'known_local' : 'provider_needed';
}

function deferredReason(candidate, selectionWasCapped) {
  if (selectionWasCapped && candidate.attention_score > 0) {
    return 'selection_limit_keeps_candidate_unresolved_visible';
  }
  if (candidate.lanes.includes('watch_background') && !candidate.lanes.includes('target_report_scoped')) {
    return 'watch_background_patient_not_point_of_need';
  }
  if (candidate.lanes.includes('corpus_hygiene_low_priority')) {
    return 'corpus_hygiene_deferred_low_priority';
  }
  return 'outside_current_lens';
}

function isKnownLocal(candidate) {
  return candidate.label_state === 'known_local_label' || candidate.label_state === 'stale_local_label';
}

function matchesReportTarget(reportTarget, candidate) {
  return reportTarget.entity_type === candidate.entity_type && Number(reportTarget.entity_id) === Number(candidate.entity_id);
}

function matchesExplicitId(candidate, explicitIds) {
  return explicitIds.some((entry) => (
    (entry.dedupe_key && entry.dedupe_key === candidate.dedupe_key) ||
    (entry.entity_type === candidate.entity_type && Number(entry.entity_id) === Number(candidate.entity_id)) ||
    (entry.lookup_type === candidate.lookup_type && Number(entry.lookup_id) === Number(candidate.lookup_id))
  ));
}

function normalizeReportTarget(value = {}) {
  return {
    entity_type: value.entityType || value.entity_type || null,
    entity_id: value.entityId || value.entity_id || null
  };
}

function normalizeExplicitIds(value) {
  const entries = Array.isArray(value) ? value : [value];
  return entries
    .filter(Boolean)
    .map((entry) => {
      if (typeof entry === 'string') {
        return { dedupe_key: entry };
      }
      return {
        dedupe_key: entry.dedupeKey || entry.dedupe_key || null,
        entity_type: entry.entityType || entry.entity_type || null,
        entity_id: entry.entityId || entry.entity_id || null,
        lookup_type: entry.lookupType || entry.lookup_type || null,
        lookup_id: entry.lookupId || entry.lookup_id || entry.id || null
      };
    });
}

function uniqueStrings(value) {
  const entries = Array.isArray(value) ? value : [value];
  return [...new Set(entries.filter(Boolean).map((entry) => String(entry)))];
}

function lensBasis(lensType) {
  if (lensType === 'explicit_ids') {
    return 'explicit candidate IDs supplied for preview only';
  }
  if (lensType === 'target_report_scope') {
    return 'target/report-scoped local Hydration candidate context';
  }
  return 'current local-record readability context from existing Hydration candidate derivation';
}

function laneRank(candidate) {
  const order = ['view_local_record', 'target_report_scoped', 'watch_background', 'corpus_hygiene_low_priority'];
  return Math.min(...candidate.lanes.map((lane) => order.indexOf(lane)).filter((index) => index >= 0));
}

function boundedLimit(value, fallback, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return fallback;
  }
  return Math.min(max, Math.floor(number));
}

module.exports = {
  buildHydrationAttentionLensPreview
};
