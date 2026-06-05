const { buildReportResponse } = require('./reportResponseService');

const PROVIDER_ID_TYPES = Object.freeze(['character', 'corporation', 'alliance']);
const LOCAL_LOOKUP_TYPES = Object.freeze(['inventory_type', 'solar_system']);
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function buildSelectedIdResolveCandidatePreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const reportContext = buildReportContext(db, input);
  const visibleRefs = visibleRefsFor(db, reportContext, input);
  const selectedId = normalizeSelectedId(input);
  const selectedRef = selectedId.normalized ? {
    id_type: selectedId.id_type,
    id_value: selectedId.id_value,
    source: 'explicit_selected_id'
  } : null;
  const refs = dedupeRefs([
    ...visibleRefs,
    ...(selectedRef ? [selectedRef] : [])
  ]);
  const candidates = refs
    .map((ref) => candidateFor(db, ref, reportContext, selectedId))
    .sort(candidateSort)
    .slice(0, boundedLimit(input.limit || input.previewLimit || input.preview_limit));
  const selectedCandidate = selectedId.normalized
    ? candidates.find((candidate) => candidate.selected_id_match) || candidateFor(db, selectedRef, reportContext, selectedId)
    : invalidSelectedCandidate(selectedId, reportContext);
  const unresolvedVisibleIds = candidates.filter((candidate) => candidate.visible_in_report_context && candidate.current_local_label_state !== 'known_local_label');
  const after = stateSnapshot(db);

  return {
    action: 'metadata.selected_id_resolve_candidate.preview',
    classification: 'read-only selected-ID Resolve candidate/report handoff preview',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    renderer_eligible: true,
    explanation_only: true,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_live_calls: 0,
    resolve_execution_invoked: false,
    product_execution_started: false,
    old_report_scoped_metadata_hydration_used: false,
    hydration_writes: 0,
    metadata_run_writes: 0,
    api_request_log_writes: 0,
    entity_writes: 0,
    entity_upserts: 0,
    activity_event_label_patches: 0,
    evidence_writes: 0,
    discovery_ref_mutations: 0,
    watch_mutations: 0,
    marked_mutations: 0,
    assessment_memory_mutations: 0,
    support_artifacts_created: 0,
    schema_changes: 0,
    queue_dispatches: 0,
    persisted_queue: false,
    bucket_persistence: false,
    dispatcher_created: false,
    worker_created: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    report_context: reportContext.identity,
    report_context_status: reportContext.status,
    report_context_error: reportContext.error,
    report_raw_id_summary: reportContext.raw_id_summary,
    unresolved_visible_ids: unresolvedVisibleIds,
    visible_candidate_count: candidates.filter((candidate) => candidate.visible_in_report_context).length,
    candidate_count: candidates.length,
    selected_id: selectedId,
    selected_candidate: selectedCandidate,
    candidates,
    candidate_derivation: {
      source: reportContext.status === 'built_from_local_report'
        ? 'local_report_response_raw_ids_plus_local_basis_queries'
        : 'equivalent_local_candidate_queries',
      report_response_invoked: reportContext.status === 'built_from_local_report',
      local_only: true,
      provider_queries: 0,
      writes: 0,
      old_metadata_hydration_command_used: false
    },
    handoff: {
      preview_to_future_preflight_command: 'metadata.selected_id_readability_repair.product_preflight',
      future_execution_command: 'metadata.selected_id_readability_repair.execute',
      future_run_type: 'selected_id_readability_repair',
      user_facing_act: 'Resolve',
      handoff_is_request: false,
      visibility_is_request: false,
      focus_is_request: false,
      candidate_is_provider_execution: false,
      report_wide_hydration_used: false,
      multi_id_hydration_used: false,
      later_resolve_must_revalidate_trusted_gates: true,
      renderer_preview_can_explain: true,
      renderer_preview_can_execute: false
    },
    evidence_boundary: {
      ids_are_facts: true,
      labels_are_readability: true,
      resolve_repairs_readability_only: true,
      hydration_creates_evidence: false,
      discovery_outputs_possible_leads: true,
      evidence_expansion_outputs_evidence: true,
      observation_derives_from_local_evidence: true,
      assessment_memory_is_deliberate_judgment: true,
      fourth_lane_reopened: false
    },
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
    },
    boundary: [
      'Read-only local selected-ID Resolve candidate/report handoff preview only.',
      'Report visibility, focus, and candidate status are not a provider request and do not authorize provider contact.',
      'Candidate preview does not execute Resolve, does not call metadata.hydration, and does not use report-wide or multi-ID Hydration as the selected-ID product path.',
      'Later Resolve execution must revalidate selected ID, local basis, local label state, storage/write posture, External I/O, live/provider gate, cadence, and command authority from trusted state.',
      'Hydration/readability repair does not create Evidence/EVEidence and does not replace raw numeric IDs as facts.'
    ]
  };
}

function buildReportContext(db, input) {
  const reportType = normalizeReportType(input.report_type || input.reportType);
  const reportParams = input.report_params || input.reportParams || input.params || {};
  if (!reportType) {
    return fallbackReportContext('no_report_input_supplied', reportType, reportParams);
  }

  try {
    const response = buildReportResponse(db, {
      reportType,
      params: reportParams,
      options: input.report_options || input.reportOptions || input.options || {}
    });
    const rawIds = response.raw_ids || {};
    return {
      status: 'built_from_local_report',
      error: null,
      response,
      raw_ids: rawIds,
      raw_id_summary: rawIdSummary(rawIds),
      identity: {
        report_type: response.report_type || reportType,
        response_mode: response.response_mode || 'text-parsed',
        parameters: response.scope?.parameters || reportParams,
        sample_status: response.evidence_basis?.sample_status || null,
        evidence_source: response.evidence_basis?.source || null,
        generated_at: response.generated_at || null,
        source: 'local_report_response'
      }
    };
  } catch (error) {
    return {
      ...fallbackReportContext('local_report_build_failed_fallback_to_equivalent_query', reportType, reportParams),
      error: error.message
    };
  }
}

function fallbackReportContext(status, reportType, reportParams) {
  return {
    status,
    error: null,
    response: null,
    raw_ids: {},
    raw_id_summary: rawIdSummary({}),
    identity: {
      report_type: reportType || null,
      response_mode: 'equivalent_local_query',
      parameters: reportParams || {},
      sample_status: null,
      evidence_source: 'local SQLite evidence and metadata tables',
      generated_at: null,
      source: 'equivalent_local_query'
    }
  };
}

function visibleRefsFor(db, reportContext, input) {
  const reportRefs = refsFromRawIds(reportContext.raw_ids);
  if (reportRefs.length) {
    return reportRefs.map((ref) => ({ ...ref, source: 'report_raw_ids' }));
  }
  return equivalentLocalRefs(db).map((ref) => ({
    ...ref,
    source: reportContext.status === 'built_from_local_report'
      ? 'local_candidate_query_no_raw_ids_in_report'
      : 'equivalent_local_candidate_query'
  }));
}

function refsFromRawIds(rawIds = {}) {
  return [
    ...idsToRefs('character', rawIds.character_ids),
    ...idsToRefs('corporation', rawIds.corporation_ids),
    ...idsToRefs('alliance', rawIds.alliance_ids),
    ...idsToRefs('solar_system', rawIds.solar_system_ids),
    ...idsToRefs('inventory_type', rawIds.type_ids)
  ];
}

function equivalentLocalRefs(db) {
  const rows = db.prepare(`
    WITH refs AS (
      SELECT 'character' AS id_type, character_id AS id_value, character_name AS visible_label
      FROM activity_events
      WHERE character_id IS NOT NULL
      UNION ALL
      SELECT 'corporation', corporation_id, corporation_name
      FROM activity_events
      WHERE corporation_id IS NOT NULL
      UNION ALL
      SELECT 'alliance', alliance_id, alliance_name
      FROM activity_events
      WHERE alliance_id IS NOT NULL
      UNION ALL
      SELECT 'inventory_type', ship_type_id, ship_type_name
      FROM activity_events
      WHERE ship_type_id IS NOT NULL
      UNION ALL
      SELECT 'inventory_type', weapon_type_id, NULL
      FROM activity_events
      WHERE weapon_type_id IS NOT NULL
      UNION ALL
      SELECT 'solar_system', solar_system_id, solar_system_name
      FROM activity_events
      WHERE solar_system_id IS NOT NULL
      UNION ALL
      SELECT entity_type, entity_id, entity_name
      FROM entities
      WHERE entity_id IS NOT NULL
    )
    SELECT id_type, id_value
    FROM refs
    WHERE id_value IS NOT NULL
    GROUP BY id_type, id_value
    HAVING SUM(CASE WHEN visible_label IS NULL OR TRIM(visible_label) = '' THEN 1 ELSE 0 END) > 0
    ORDER BY id_type, id_value
    LIMIT 100
  `).all();
  return rows.map((row) => ({
    id_type: row.id_type,
    id_value: Number(row.id_value)
  }));
}

function candidateFor(db, ref, reportContext, selectedId) {
  const idType = normalizeIdType(ref?.id_type || ref?.idType || ref?.type);
  const idValue = normalizeIdValue(ref?.id_value ?? ref?.idValue ?? ref?.id);
  const normalized = Boolean(idType && Number.isSafeInteger(idValue) && idValue > 0);
  const reportBenefit = reportBenefitFor(db, idType, idValue, reportContext);
  const label = normalized ? localLabelFor(db, idType, idValue) : { local_label: null, local_label_basis: null };
  const basis = normalized ? basisFor(db, idType, idValue) : emptyBasis();
  const classification = classifyCandidate({ idType, idValue, normalized, label, basis });
  const selectedMatch = selectedId.normalized && selectedId.id_type === idType && selectedId.id_value === idValue;

  return {
    candidate_key: normalized ? `${idType}:${idValue}` : 'invalid:selected-id',
    id_type: idType,
    id_value: idValue,
    selected_id_match: selectedMatch,
    visible_in_report_context: Boolean(ref?.source && ref.source !== 'explicit_selected_id'),
    visibility_source: ref?.source || null,
    supported_provider_backed_resolve_type: PROVIDER_ID_TYPES.includes(idType),
    static_local_lookup_type: LOCAL_LOOKUP_TYPES.includes(idType),
    current_local_label_state: label.local_label ? 'known_local_label' : 'missing_local_label',
    local_label: label.local_label,
    local_label_basis: label.local_label_basis,
    classification: classification.state,
    reason_codes: classification.reason_codes,
    selected_id_resolve_preflight_relevant: classification.preflightRelevant,
    provider_contact_needed_for_later_resolve: classification.providerContactNeeded,
    provider_call_authorized: false,
    resolve_execution_authorized: false,
    strong_local_basis: basis.strong_basis,
    parked_or_conditional_basis: basis.parked_basis,
    local_basis_layer: basis.layer,
    report_or_corpus_context_that_would_benefit: reportBenefit,
    explanation: classification.explanation,
    future_handoff_hint: {
      command: classification.preflightRelevant ? 'metadata.selected_id_readability_repair.product_preflight' : null,
      execution_command: classification.preflightRelevant ? 'metadata.selected_id_readability_repair.execute' : null,
      payload_hint_only: classification.preflightRelevant ? {
        idType,
        idValue,
        operatorAct: true,
        action: 'Resolve',
        sourceSurface: 'selected-id-resolve-candidate-preview',
        reportContext: reportContext.identity
      } : null,
      hint_is_authority: false,
      future_execution_must_revalidate: true
    }
  };
}

function classifyCandidate({ idType, normalized, label, basis }) {
  if (!normalized) {
    return classification(
      'invalid_or_missing_selected_id',
      ['invalid_or_missing_selected_id'],
      false,
      false,
      'Selected ID is missing or malformed; no provider-backed Resolve path is implied.'
    );
  }
  if (LOCAL_LOOKUP_TYPES.includes(idType)) {
    return classification(
      label.local_label ? 'already_local_readable_static_lookup' : 'unsupported_static_local_lookup',
      [label.local_label ? 'local_static_label_available' : 'local_static_lookup_gap', 'not_esi_names_resolve_type'],
      false,
      false,
      'Static type/system readability belongs to local lookup readiness, not ESI selected-ID Resolve.'
    );
  }
  if (!PROVIDER_ID_TYPES.includes(idType)) {
    return classification(
      'unsupported_selected_id_type',
      ['unsupported_selected_id_type', 'not_esi_names_resolve_type'],
      false,
      false,
      'Only character, corporation, and alliance IDs are supported provider-backed Resolve types.'
    );
  }
  if (label.local_label) {
    return classification(
      'already_local_readable',
      ['local_label_available', 'provider_not_needed'],
      false,
      false,
      'A local readable label already exists; report construction should reuse it without provider contact.'
    );
  }
  if (basis.strong_basis.length) {
    return classification(
      'provider_backed_resolve_candidate_with_strong_local_basis',
      ['strong_local_basis', 'selected_id_resolve_preflight_relevant', 'provider_call_not_authorized'],
      true,
      true,
      'This visible unresolved provider-backed ID has strong local basis and may be suitable for later one-ID Resolve preflight.'
    );
  }
  if (basis.parked_basis.length) {
    return classification(
      'parked_conditional_basis_only',
      ['parked_or_conditional_basis_only', 'not_first_product_authority', 'provider_call_not_authorized'],
      false,
      false,
      'This ID has parked/conditional attention only; it does not authorize first product Resolve.'
    );
  }
  return classification(
    'insufficient_basis',
    ['missing_strong_local_basis', 'provider_call_not_authorized'],
    false,
    false,
    'No strong local Evidence/EVEidence activity or unlabeled entity basis was found for first product Resolve.'
  );
}

function classification(state, reasonCodes, preflightRelevant, providerContactNeeded, explanation) {
  return {
    state,
    reason_codes: reasonCodes,
    preflightRelevant,
    providerContactNeeded,
    explanation
  };
}

function basisFor(db, idType, idValue) {
  if (!PROVIDER_ID_TYPES.includes(idType)) {
    return emptyBasis('local_static_or_unsupported_lookup');
  }
  const strong = [];
  const parked = [];
  const activity = activityBasis(db, idType, idValue);
  const entity = db.prepare('SELECT entity_name FROM entities WHERE entity_type = ? AND entity_id = ?')
    .get(idType, idValue);
  const watch = db.prepare('SELECT COUNT(*) AS count FROM watchlist_entities WHERE entity_type = ? AND entity_id = ?')
    .get(idType, idValue).count;
  const assessment = db.prepare('SELECT COUNT(*) AS count FROM assessment_artifacts WHERE entity_type = ? AND entity_id = ?')
    .get(idType, idValue).count;
  const discovery = discoveryBasisCount(db, idType, idValue);

  if (activity.appearances > 0) {
    strong.push({
      kind: 'activity_events',
      authority: 'strong',
      appearances: activity.appearances,
      killmail_count: activity.killmail_count,
      sample_killmail_ids: activity.sample_killmail_ids,
      meaning: 'Evidence/EVEidence-derived local activity appearance'
    });
  }
  if (entity && !nonEmpty(entity.entity_name)) {
    strong.push({
      kind: 'entities',
      authority: 'strong',
      appearances: 1,
      meaning: 'Existing local entity row is missing a readability label'
    });
  }
  if (watch > 0) {
    parked.push({
      kind: 'watchlist_entities',
      authority: 'parked',
      appearances: Number(watch),
      meaning: 'Watch/Marked attention is not standalone Resolve authority'
    });
  }
  if (assessment > 0) {
    parked.push({
      kind: 'assessment_artifacts',
      authority: 'parked',
      appearances: Number(assessment),
      meaning: 'Assessment Memory is deliberate judgment, not provider Hydration authority'
    });
  }
  if (discovery > 0) {
    parked.push({
      kind: 'discovered_killmail_refs',
      authority: 'parked',
      appearances: Number(discovery),
      meaning: 'Discovery refs are possible leads/provenance, not Evidence/EVEidence'
    });
  }

  return {
    layer: 'Evidence/EVEidence activity appearance or existing local unlabeled entities row; Watch/Discovery/Assessment stay parked',
    strong_basis: strong,
    parked_basis: parked,
    strong_basis_exists: strong.length > 0,
    parked_or_conditional_basis_exists: parked.length > 0
  };
}

function emptyBasis(layer = 'none') {
  return {
    layer,
    strong_basis: [],
    parked_basis: [],
    strong_basis_exists: false,
    parked_or_conditional_basis_exists: false
  };
}

function localLabelFor(db, idType, idValue) {
  if (PROVIDER_ID_TYPES.includes(idType)) {
    const entity = db.prepare('SELECT entity_name, last_enriched_at, last_seen_at FROM entities WHERE entity_type = ? AND entity_id = ?')
      .get(idType, idValue);
    if (nonEmpty(entity?.entity_name)) {
      return {
        local_label: entity.entity_name.trim(),
        local_label_basis: 'entities.entity_name',
        last_resolved_at: entity.last_enriched_at || entity.last_seen_at || null
      };
    }
    const idColumn = idColumnFor(idType);
    const nameColumn = `${idType}_name`;
    const event = db.prepare(`
      SELECT ${nameColumn} AS entity_name, ingested_at
      FROM activity_events
      WHERE ${idColumn} = ? AND ${nameColumn} IS NOT NULL AND TRIM(${nameColumn}) != ''
      ORDER BY ingested_at DESC
      LIMIT 1
    `).get(idValue);
    if (nonEmpty(event?.entity_name)) {
      return {
        local_label: event.entity_name.trim(),
        local_label_basis: `activity_events.${nameColumn}`,
        last_resolved_at: event.ingested_at || null
      };
    }
  }
  if (idType === 'inventory_type') {
    const label = nonEmpty(db.prepare('SELECT type_name FROM type_metadata WHERE type_id = ?').get(idValue)?.type_name);
    return { local_label: label, local_label_basis: label ? 'type_metadata.type_name' : null, last_resolved_at: null };
  }
  if (idType === 'solar_system') {
    const label = nonEmpty(db.prepare('SELECT solar_system_name FROM solar_systems WHERE solar_system_id = ?').get(idValue)?.solar_system_name);
    return { local_label: label, local_label_basis: label ? 'solar_systems.solar_system_name' : null, last_resolved_at: null };
  }
  return { local_label: null, local_label_basis: null, last_resolved_at: null };
}

function activityBasis(db, idType, idValue) {
  const idColumn = idColumnFor(idType);
  const rows = db.prepare(`
    SELECT killmail_id
    FROM activity_events
    WHERE (entity_type = ? AND entity_id = ?) OR ${idColumn} = ?
    ORDER BY killmail_time DESC
    LIMIT 20
  `).all(idType, idValue, idValue);
  const ids = [...new Set(rows.map((row) => Number(row.killmail_id)).filter(Number.isFinite))];
  return {
    appearances: rows.length,
    killmail_count: ids.length,
    sample_killmail_ids: ids.slice(0, 8)
  };
}

function discoveryBasisCount(db, idType, idValue) {
  const rows = db.prepare('SELECT discovered_by_type, discovered_by_id FROM discovered_killmail_refs').all();
  const plain = String(idValue);
  const typed = `${idType}:${idValue}`;
  return rows.filter((row) => (
    String(row.discovered_by_type || '').includes(idType) &&
    [plain, typed].includes(String(row.discovered_by_id || ''))
  )).length;
}

function reportBenefitFor(db, idType, idValue, reportContext) {
  if (!idType || !idValue) {
    return {
      context: reportContext.identity,
      would_benefit: false,
      matching_activity_events: 0,
      matching_killmail_count: 0,
      sample_killmail_ids: []
    };
  }
  if (!PROVIDER_ID_TYPES.includes(idType)) {
    const lookup = localLookupBenefit(db, idType, idValue);
    return {
      context: reportContext.identity,
      would_benefit: lookup.appearances > 0,
      matching_activity_events: lookup.appearances,
      matching_killmail_count: lookup.killmail_count,
      sample_killmail_ids: lookup.sample_killmail_ids,
      benefit_kind: 'local_static_readability_only'
    };
  }
  const activity = activityBasis(db, idType, idValue);
  return {
    context: reportContext.identity,
    would_benefit: activity.appearances > 0,
    matching_activity_events: activity.appearances,
    matching_killmail_count: activity.killmail_count,
    sample_killmail_ids: activity.sample_killmail_ids,
    benefit_kind: 'future_report_construction_reuses_local_readability_label'
  };
}

function localLookupBenefit(db, idType, idValue) {
  if (idType === 'inventory_type') {
    const rows = db.prepare(`
      SELECT killmail_id
      FROM activity_events
      WHERE ship_type_id = ? OR weapon_type_id = ?
      ORDER BY killmail_time DESC
      LIMIT 20
    `).all(idValue, idValue);
    return benefitFromRows(rows);
  }
  if (idType === 'solar_system') {
    const rows = db.prepare(`
      SELECT killmail_id
      FROM activity_events
      WHERE solar_system_id = ?
      ORDER BY killmail_time DESC
      LIMIT 20
    `).all(idValue);
    return benefitFromRows(rows);
  }
  return { appearances: 0, killmail_count: 0, sample_killmail_ids: [] };
}

function benefitFromRows(rows) {
  const ids = [...new Set(rows.map((row) => Number(row.killmail_id)).filter(Number.isFinite))];
  return {
    appearances: rows.length,
    killmail_count: ids.length,
    sample_killmail_ids: ids.slice(0, 8)
  };
}

function invalidSelectedCandidate(selectedId, reportContext) {
  return {
    candidate_key: 'invalid:selected-id',
    id_type: selectedId.id_type,
    id_value: selectedId.id_value,
    selected_id_match: false,
    visible_in_report_context: false,
    supported_provider_backed_resolve_type: false,
    static_local_lookup_type: false,
    current_local_label_state: 'unknown',
    local_label: null,
    local_label_basis: null,
    classification: 'invalid_or_missing_selected_id',
    reason_codes: selectedId.reason_codes,
    selected_id_resolve_preflight_relevant: false,
    provider_contact_needed_for_later_resolve: false,
    provider_call_authorized: false,
    resolve_execution_authorized: false,
    strong_local_basis: [],
    parked_or_conditional_basis: [],
    report_or_corpus_context_that_would_benefit: {
      context: reportContext.identity,
      would_benefit: false,
      matching_activity_events: 0,
      matching_killmail_count: 0,
      sample_killmail_ids: []
    },
    explanation: 'Selected ID is missing or malformed; no provider-backed Resolve path is implied.',
    future_handoff_hint: {
      command: null,
      execution_command: null,
      payload_hint_only: null,
      hint_is_authority: false,
      future_execution_must_revalidate: true
    }
  };
}

function normalizeSelectedId(input = {}) {
  const request = input.selected_id || input.selectedId || input.request_facts || input.requestFacts || input;
  const idType = normalizeIdType(request.selected_id_type || request.selectedIdType || request.id_type || request.idType || request.type);
  const idValue = normalizeIdValue(request.selected_id_value ?? request.selectedIdValue ?? request.id_value ?? request.idValue ?? request.id);
  const reasonCodes = [];
  if (!idType) {
    reasonCodes.push('missing_selected_id_type');
  } else if (![...PROVIDER_ID_TYPES, ...LOCAL_LOOKUP_TYPES].includes(idType)) {
    reasonCodes.push('unsupported_selected_id_type');
  }
  if (!Number.isSafeInteger(idValue) || idValue <= 0) {
    reasonCodes.push('invalid_selected_id_value');
  }
  return {
    id_type: idType,
    id_value: idValue,
    normalized: reasonCodes.length === 0,
    supported_provider_backed_resolve_type: PROVIDER_ID_TYPES.includes(idType),
    static_local_lookup_type: LOCAL_LOOKUP_TYPES.includes(idType),
    reason_codes: reasonCodes
  };
}

function idsToRefs(idType, values = []) {
  return (values || [])
    .map((value) => normalizeIdValue(value))
    .filter((value) => Number.isSafeInteger(value) && value > 0)
    .map((value) => ({ id_type: idType, id_value: value }));
}

function dedupeRefs(refs) {
  const seen = new Set();
  return refs.filter((ref) => {
    const idType = normalizeIdType(ref.id_type);
    const idValue = normalizeIdValue(ref.id_value);
    const key = `${idType}:${idValue}`;
    if (!idType || !Number.isSafeInteger(idValue) || seen.has(key)) {
      return false;
    }
    seen.add(key);
    ref.id_type = idType;
    ref.id_value = idValue;
    return true;
  });
}

function rawIdSummary(rawIds = {}) {
  return {
    character_ids: (rawIds.character_ids || []).length,
    corporation_ids: (rawIds.corporation_ids || []).length,
    alliance_ids: (rawIds.alliance_ids || []).length,
    solar_system_ids: (rawIds.solar_system_ids || []).length,
    type_ids: (rawIds.type_ids || []).length
  };
}

function candidateSort(a, b) {
  if (a.selected_id_match !== b.selected_id_match) {
    return a.selected_id_match ? -1 : 1;
  }
  const strongDiff = Number(b.strong_local_basis.length > 0) - Number(a.strong_local_basis.length > 0);
  if (strongDiff !== 0) {
    return strongDiff;
  }
  const visibleDiff = Number(b.visible_in_report_context) - Number(a.visible_in_report_context);
  if (visibleDiff !== 0) {
    return visibleDiff;
  }
  return a.candidate_key.localeCompare(b.candidate_key);
}

function idColumnFor(idType) {
  if (idType === 'character') {
    return 'character_id';
  }
  if (idType === 'corporation') {
    return 'corporation_id';
  }
  return 'alliance_id';
}

function normalizeIdType(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/-/g, '_');
  if (['type', 'ship_type', 'item_type', 'inventory'].includes(normalized)) {
    return 'inventory_type';
  }
  if (['system', 'solar_system', 'solar-system'].includes(normalized)) {
    return 'solar_system';
  }
  return normalized || null;
}

function normalizeReportType(value) {
  return String(value || '').trim().toLowerCase() || null;
}

function normalizeIdValue(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

function boundedLimit(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(MAX_LIMIT, Math.floor(number));
}

function nonEmpty(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || null;
}

function stateSnapshot(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    entities: count(db, 'entities'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  buildSelectedIdResolveCandidatePreview
};
