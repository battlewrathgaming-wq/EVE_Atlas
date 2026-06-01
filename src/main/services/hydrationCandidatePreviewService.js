const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
const LANE_ORDER = Object.freeze([
  'view_local_record',
  'target_report_scoped',
  'watch_background',
  'corpus_hygiene_low_priority'
]);

function buildHydrationCandidatePreview(db, input = {}) {
  const limit = boundedLimit(input.limit || input.previewLimit || input.preview_limit);
  const now = input.now || new Date().toISOString();
  const externalIoState = normalizeExternalIoState(input.externalIoState || input.external_io_state || 'off');
  const reportTarget = normalizeReportTarget(input.reportTarget || input.report_target || input.target || {});
  const entityCandidates = entityHydrationCandidates(db, { now, reportTarget });
  const localLookupCandidates = localSdeLookupCandidates(db);
  const candidates = orderCandidates([...entityCandidates, ...localLookupCandidates]).slice(0, limit);
  const lanes = buildLanes(candidates);

  return {
    action: 'metadata.hydration_candidates.preview',
    classification: 'read-only hydration candidate preview',
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
    support_artifacts_created: 0,
    persisted_queue: false,
    schema_changes: false,
    candidate_deduped_by: ['entity_type:entity_id', 'local_sde_lookup_type:id'],
    external_io: {
      requested_readout_state: externalIoState,
      provider_backed_hydration_posture: externalIoState === 'on' ? 'released_to_normal_gates' : 'held_by_external_io',
      held_is_failure: false,
      external_io_on_is_authorization: false
    },
    evidence_boundary: {
      ids_are_facts: true,
      labels_are_readability: true,
      hydration_creates_evidence: false,
      provider_needed_labels_are_evidence_work: false,
      esi_evidence_expansion_called_hydration: false,
      discovery_refs_are_evidence: false
    },
    summary: summaryFor(candidates, lanes),
    lanes,
    candidates,
    metadata_run_context: metadataRunContext(db),
    boundary: [
      'Read-only Hydration candidate preview only; it does not create a persisted queue or provider work packet.',
      'Candidates are derived from local activity_events, entities, metadata_runs, Watch tables, Assessment anchors, and local SDE lookup tables.',
      'Hydration repairs labels/readability after local facts exist; it does not create Evidence/EVEidence or replace numeric IDs.',
      'Local SDE lookup gaps are local metadata gaps, not ESI provider-needed entity Hydration.',
      'External I/O off is held posture for provider-backed Hydration, not failure.'
    ]
  };
}

function entityHydrationCandidates(db, { now, reportTarget }) {
  const rows = db.prepare(`
    WITH refs AS (
      SELECT 'character' AS entity_type, character_id AS entity_id, character_name AS event_label,
             killmail_id, killmail_time, discovered_by_type, discovered_by_id, 'character_label' AS basis
      FROM activity_events
      WHERE character_id IS NOT NULL
      UNION ALL
      SELECT 'corporation', corporation_id, corporation_name,
             killmail_id, killmail_time, discovered_by_type, discovered_by_id, 'corporation_label'
      FROM activity_events
      WHERE corporation_id IS NOT NULL
      UNION ALL
      SELECT 'alliance', alliance_id, alliance_name,
             killmail_id, killmail_time, discovered_by_type, discovered_by_id, 'alliance_label'
      FROM activity_events
      WHERE alliance_id IS NOT NULL
      UNION ALL
      SELECT entity_type, entity_id, entity_name,
             killmail_id, killmail_time, discovered_by_type, discovered_by_id, 'primary_entity_label'
      FROM activity_events
      WHERE entity_id IS NOT NULL
    )
    SELECT refs.entity_type,
           refs.entity_id,
           known.entity_name AS local_label,
           known.last_enriched_at,
           COUNT(*) AS appearances,
           COUNT(DISTINCT refs.killmail_id) AS killmail_count,
           SUM(CASE WHEN refs.event_label IS NULL THEN 1 ELSE 0 END) AS missing_event_labels,
           MIN(refs.killmail_time) AS first_seen_in_evidence,
           MAX(refs.killmail_time) AS last_seen_in_evidence,
           GROUP_CONCAT(DISTINCT refs.killmail_id) AS killmail_ids,
           GROUP_CONCAT(DISTINCT refs.discovered_by_type) AS discovery_routes,
           GROUP_CONCAT(DISTINCT refs.discovered_by_id) AS discovery_route_ids,
           GROUP_CONCAT(DISTINCT refs.basis) AS bases
    FROM refs
    LEFT JOIN entities known
      ON known.entity_type = refs.entity_type
     AND known.entity_id = refs.entity_id
    GROUP BY refs.entity_type, refs.entity_id
    HAVING missing_event_labels > 0 OR known.entity_name IS NULL OR known.last_enriched_at IS NULL
  `).all();

  return rows.map((row) => {
    const marked = markedEntity(db, row.entity_type, row.entity_id);
    const watch = watchContext(db, row.entity_type, row.entity_id, row.discovery_routes);
    const reportScoped = matchesReportTarget(reportTarget, row.entity_type, row.entity_id) ||
      marked ||
      Number(row.killmail_count || 0) >= 2 ||
      metadataRunMentions(db, row.entity_type, row.entity_id);
    const labelState = labelStateFor(row, now);
    const providerNeeded = labelState === 'provider_needed' || labelState === 'stale_local_label';
    const lanes = laneMembership({ watch, reportScoped });

    return {
      dedupe_key: `entity:${row.entity_type}:${row.entity_id}`,
      candidate_kind: 'entity_label',
      entity_type: row.entity_type,
      entity_id: Number(row.entity_id),
      lookup_type: null,
      lookup_id: null,
      label_state: labelState,
      local_label: row.local_label || null,
      provider_needed: providerNeeded,
      lanes,
      source_anchors: sourceAnchors({
        killmailIds: splitList(row.killmail_ids).map(Number),
        discoveryRoutes: splitList(row.discovery_routes),
        discoveryRouteIds: splitList(row.discovery_route_ids),
        reportScoped,
        watch,
        marked
      }),
      appearance_count: Number(row.appearances || 0),
      killmail_count: Number(row.killmail_count || 0),
      first_seen_in_evidence: row.first_seen_in_evidence || null,
      last_seen_in_evidence: row.last_seen_in_evidence || null,
      source_basis: splitList(row.bases),
      priority_rationale: priorityRationale(lanes, providerNeeded, labelState),
      hydration_boundary: 'Hydration repairs readability labels for already-stored IDs; numeric IDs remain facts.',
      evidence_boundary: 'Provider-needed labels are Hydration work, not Evidence/EVEidence creation or ESI Evidence Expansion.'
    };
  });
}

function localSdeLookupCandidates(db) {
  const typeRows = db.prepare(`
    WITH type_refs AS (
      SELECT ship_type_id AS lookup_id, ship_type_name AS event_label, killmail_id, killmail_time, 'ship_type' AS basis
      FROM activity_events
      WHERE ship_type_id IS NOT NULL
      UNION ALL
      SELECT weapon_type_id AS lookup_id, NULL AS event_label, killmail_id, killmail_time, 'weapon_type' AS basis
      FROM activity_events
      WHERE weapon_type_id IS NOT NULL
    )
    SELECT 'inventory_type' AS lookup_type,
           refs.lookup_id,
           tm.type_name AS local_label,
           COUNT(*) AS appearances,
           COUNT(DISTINCT refs.killmail_id) AS killmail_count,
           SUM(CASE WHEN COALESCE(refs.event_label, tm.type_name) IS NULL THEN 1 ELSE 0 END) AS missing_labels,
           GROUP_CONCAT(DISTINCT refs.killmail_id) AS killmail_ids,
           GROUP_CONCAT(DISTINCT refs.basis) AS bases,
           MAX(refs.killmail_time) AS last_seen_in_evidence
    FROM type_refs refs
    LEFT JOIN type_metadata tm ON tm.type_id = refs.lookup_id
    GROUP BY refs.lookup_id
    HAVING missing_labels > 0
  `).all();
  const systemRows = db.prepare(`
    SELECT 'solar_system' AS lookup_type,
           ae.solar_system_id AS lookup_id,
           ss.solar_system_name AS local_label,
           COUNT(*) AS appearances,
           COUNT(DISTINCT ae.killmail_id) AS killmail_count,
           SUM(CASE WHEN COALESCE(ae.solar_system_name, ss.solar_system_name) IS NULL THEN 1 ELSE 0 END) AS missing_labels,
           GROUP_CONCAT(DISTINCT ae.killmail_id) AS killmail_ids,
           'solar_system' AS bases,
           MAX(ae.killmail_time) AS last_seen_in_evidence
    FROM activity_events ae
    LEFT JOIN solar_systems ss ON ss.solar_system_id = ae.solar_system_id
    WHERE ae.solar_system_id IS NOT NULL
    GROUP BY ae.solar_system_id
    HAVING missing_labels > 0
  `).all();

  return [...typeRows, ...systemRows].map((row) => ({
    dedupe_key: `local_sde:${row.lookup_type}:${row.lookup_id}`,
    candidate_kind: 'local_sde_lookup',
    entity_type: null,
    entity_id: null,
    lookup_type: row.lookup_type,
    lookup_id: Number(row.lookup_id),
    label_state: row.local_label ? 'known_local_label' : 'local_sde_gap',
    local_label: row.local_label || null,
    provider_needed: false,
    lanes: ['view_local_record', 'corpus_hygiene_low_priority'],
    source_anchors: [
      anchor('killmail_ids', splitList(row.killmail_ids).map(Number)),
      anchor('local_lookup_table', row.lookup_type === 'inventory_type' ? 'type_metadata' : 'solar_systems')
    ],
    appearance_count: Number(row.appearances || 0),
    killmail_count: Number(row.killmail_count || 0),
    first_seen_in_evidence: null,
    last_seen_in_evidence: row.last_seen_in_evidence || null,
    source_basis: splitList(row.bases),
    priority_rationale: 'Local SDE lookup gap supports readability but must not become ESI provider-needed entity Hydration.',
    hydration_boundary: 'Local SDE lookup repair is local metadata/readability; do not use live ESI for static type or geography labels.',
    evidence_boundary: 'Local lookup labels are not Evidence/EVEidence and do not change local Evidence facts.'
  }));
}

function buildLanes(candidates) {
  return LANE_ORDER.map((laneId) => {
    const laneCandidates = candidates.filter((candidate) => candidate.lanes.includes(laneId));
    return {
      lane_id: laneId,
      priority: priorityForLane(laneId),
      candidate_count: laneCandidates.length,
      provider_needed_count: laneCandidates.filter((candidate) => candidate.provider_needed).length,
      local_sde_gap_count: laneCandidates.filter((candidate) => candidate.label_state === 'local_sde_gap').length,
      dedupe_keys: laneCandidates.map((candidate) => candidate.dedupe_key),
      representatives: laneCandidates.slice(0, 5),
      waiting_is_failure: false,
      persisted_queue: false,
      meaning: laneMeaning(laneId)
    };
  });
}

function summaryFor(candidates, lanes) {
  return {
    total_candidates: candidates.length,
    unique_dedupe_keys: new Set(candidates.map((candidate) => candidate.dedupe_key)).size,
    provider_needed_candidates: candidates.filter((candidate) => candidate.provider_needed).length,
    local_sde_gap_candidates: candidates.filter((candidate) => candidate.label_state === 'local_sde_gap').length,
    known_or_stale_local_label_candidates: candidates.filter((candidate) => candidate.label_state === 'known_local_label' || candidate.label_state === 'stale_local_label').length,
    lane_counts: Object.fromEntries(lanes.map((lane) => [lane.lane_id, lane.candidate_count])),
    view_local_record_first: lanes[0]?.lane_id === 'view_local_record',
    watch_background_starves_view_local_record: false,
    labels_are_readability: true,
    ids_are_facts: true,
    provider_needed_labels_are_evidence_work: false,
    persisted_queue: false,
    provider_calls: 0,
    hydration_writes: 0
  };
}

function orderCandidates(candidates) {
  return candidates.sort((a, b) => {
    const laneDiff = laneRank(a) - laneRank(b);
    if (laneDiff !== 0) {
      return laneDiff;
    }
    const providerDiff = Number(b.provider_needed) - Number(a.provider_needed);
    if (providerDiff !== 0) {
      return providerDiff;
    }
    const countDiff = b.killmail_count - a.killmail_count;
    if (countDiff !== 0) {
      return countDiff;
    }
    return a.dedupe_key.localeCompare(b.dedupe_key);
  });
}

function laneMembership({ watch, reportScoped }) {
  const lanes = ['view_local_record'];
  if (reportScoped) {
    lanes.push('target_report_scoped');
  }
  if (watch.present) {
    lanes.push('watch_background');
  }
  lanes.push('corpus_hygiene_low_priority');
  return lanes;
}

function sourceAnchors({ killmailIds, discoveryRoutes, discoveryRouteIds, reportScoped, watch, marked }) {
  const anchors = [anchor('killmail_ids', killmailIds.slice(0, 8))];
  if (discoveryRoutes.length) {
    anchors.push(anchor('discovery_routes', discoveryRoutes));
  }
  if (discoveryRouteIds.length) {
    anchors.push(anchor('discovery_route_ids', discoveryRouteIds));
  }
  if (reportScoped) {
    anchors.push(anchor('report_target_or_scoped_interest', true));
  }
  if (watch.present) {
    anchors.push(anchor('watch_derived_route', watch.basis));
  }
  if (marked) {
    anchors.push(anchor('marked_or_assessment_presence', true));
  }
  return anchors;
}

function anchor(type, value) {
  return {
    type,
    value
  };
}

function labelStateFor(row, now) {
  if (!row.local_label) {
    return 'provider_needed';
  }
  if (freshnessFor(row.last_enriched_at, now) === 'stale_over_30_days') {
    return 'stale_local_label';
  }
  return 'known_local_label';
}

function freshnessFor(lastEnrichedAt, now) {
  if (!lastEnrichedAt) {
    return 'never_enriched_or_unknown';
  }
  const parsed = Date.parse(lastEnrichedAt);
  const reference = Date.parse(now);
  if (!Number.isFinite(parsed) || !Number.isFinite(reference)) {
    return 'unknown';
  }
  return (reference - parsed) / 86400000 > 30 ? 'stale_over_30_days' : 'recently_enriched';
}

function markedEntity(db, entityType, entityId) {
  const row = db.prepare(`
    SELECT artifact_id
    FROM assessment_artifacts
    WHERE artifact_type = 'entity_interest'
      AND status IN ('active', 'cooling')
      AND entity_type = ?
      AND entity_id = ?
    LIMIT 1
  `).get(entityType, entityId);
  return Boolean(row);
}

function metadataRunMentions(db, entityType, entityId) {
  const row = db.prepare(`
    SELECT run_id
    FROM metadata_runs
    WHERE target_type = ?
      AND target_id = ?
    LIMIT 1
  `).get(entityType, String(entityId));
  return Boolean(row);
}

function watchContext(db, entityType, entityId, discoveryRoutesValue) {
  const routes = splitList(discoveryRoutesValue);
  const routeWatch = routes.some((route) => ['actor', 'system_radius', 'watch', 'system'].includes(route));
  const entityWatch = db.prepare(`
    SELECT watch_id
    FROM watchlist_entities
    WHERE entity_type = ?
      AND entity_id = ?
      AND is_active = 1
    LIMIT 1
  `).get(entityType, entityId);
  return {
    present: routeWatch || Boolean(entityWatch),
    basis: [
      ...(routeWatch ? ['activity_events.discovered_by_type'] : []),
      ...(entityWatch ? [`watchlist_entities:${entityWatch.watch_id}`] : [])
    ]
  };
}

function matchesReportTarget(reportTarget, entityType, entityId) {
  return reportTarget.entity_type === entityType && Number(reportTarget.entity_id) === Number(entityId);
}

function normalizeReportTarget(value) {
  return {
    entity_type: value.entityType || value.entity_type || null,
    entity_id: value.entityId || value.entity_id || null
  };
}

function priorityRationale(lanes, providerNeeded, labelState) {
  if (lanes.includes('target_report_scoped')) {
    return 'Report-visible or operator-interest candidate stays ahead of background readability repair.';
  }
  if (lanes.includes('view_local_record')) {
    return providerNeeded
      ? 'Point-of-need local record readability; provider-backed label repair remains held by gates.'
      : `Point-of-need local record readability with ${labelState} posture.`;
  }
  return 'Low-priority corpus readability candidate.';
}

function priorityForLane(laneId) {
  if (laneId === 'view_local_record') {
    return 'point_of_need_not_starved';
  }
  if (laneId === 'target_report_scoped') {
    return 'selected_or_report_visible';
  }
  if (laneId === 'watch_background') {
    return 'patient_background';
  }
  return 'deferred_low_priority';
}

function laneMeaning(laneId) {
  if (laneId === 'view_local_record') {
    return 'Immediate local-record readability candidates appear before background lanes.';
  }
  if (laneId === 'target_report_scoped') {
    return 'Selected, report-visible, Marked, Assessment, or repeated-appearance candidates are scoped separately.';
  }
  if (laneId === 'watch_background') {
    return 'Watch-derived readability candidates wait patiently and must not starve view/local-record needs.';
  }
  return 'Corpus hygiene candidates are low-priority and not a persisted queue.';
}

function laneRank(candidate) {
  return Math.min(...candidate.lanes.map((lane) => LANE_ORDER.indexOf(lane)).filter((index) => index >= 0));
}

function metadataRunContext(db) {
  return {
    recent_runs: db.prepare(`
      SELECT run_id, run_type, target_type, target_id, status, started_at, finished_at,
             ids_discovered, already_known, requested_from_esi, resolved, unresolved,
             activity_events_patched, api_calls_esi
      FROM metadata_runs
      ORDER BY started_at DESC
      LIMIT 5
    `).all(),
    context_only: true,
    writes_metadata_runs: false
  };
}

function splitList(value) {
  if (!value) {
    return [];
  }
  return String(value).split(',').map((entry) => entry.trim()).filter(Boolean);
}

function boundedLimit(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(MAX_LIMIT, Math.floor(number));
}

function normalizeExternalIoState(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ['on', 'enabled', 'allow', 'allowed'].includes(normalized) ? 'on' : 'off';
}

module.exports = {
  buildHydrationCandidatePreview
};
