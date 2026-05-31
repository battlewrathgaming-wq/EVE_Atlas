const { buildGateStackReadout } = require('./gateStackReadoutService');

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 25;

function buildHydrationBacklogPreview(db, input = {}, context = {}) {
  const limit = boundedLimit(input.limit || input.previewLimit || input.preview_limit);
  const externalIoState = normalizeExternalIoState(input.externalIoState || input.external_io_state || 'off');
  const entityCandidates = entityLabelCandidates(db, limit);
  const sdeGaps = localSdeGaps(db, limit);
  const recentMetadataRuns = metadataRunContext(db);
  const lanes = buildLanes({ entityCandidates, sdeGaps, limit });
  const gateStack = buildGateStackReadout(db, {
    externalIoState,
    actions: ['metadata.hydration', 'metadata.status', 'report.view']
  }, context);
  const hydrationStack = gateStack.gate_stacks.find((entry) => entry.action === 'metadata.hydration');

  return {
    action: 'metadata.hydration_backlog.preview',
    classification: 'read-only hydration backlog preview',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    provider_calls: 0,
    hydration_writes: 0,
    persisted_backlog: false,
    schema_changes: false,
    evidence_boundary: {
      evidence_facts: 'Expanded ESI killmails and derived activity_events remain Evidence/EVEidence facts.',
      discovery_refs: 'Discovery refs remain possible leads/provenance and are not hydration candidates in this preview.',
      hydration: 'Hydration is readability metadata for already-stored IDs; it does not create Evidence/EVEidence or replace numeric IDs.'
    },
    external_io: {
      requested_readout_state: externalIoState,
      provider_backed_hydration_posture: hydrationStack?.gates?.external_io?.state || 'unknown',
      held_is_failure: false,
      reenable_policy: 'Provider-backed hydration must re-enter normal External I/O, live.gate, storage, cadence, and confirmation gates; no catch-up flood.'
    },
    summary: summaryFor(entityCandidates, sdeGaps),
    candidates: {
      entity_labels: {
        total: entityCandidates.length,
        locally_known: entityCandidates.filter((entry) => entry.label_state === 'known_local_label').length,
        provider_needed: entityCandidates.filter((entry) => entry.label_state === 'provider_needed').length,
        stale_or_never_enriched: entityCandidates.filter((entry) => entry.freshness !== 'recently_enriched').length,
        representatives: entityCandidates.slice(0, limit)
      },
      local_sde_gaps: {
        total: sdeGaps.length,
        representatives: sdeGaps.slice(0, limit)
      }
    },
    lanes,
    metadata_run_context: {
      recent_runs: recentMetadataRuns,
      basis: 'metadata_runs are recent hydration context only; they are not authority to mutate or skip candidates.'
    },
    gate_stack_context: {
      metadata_hydration: compactGateStack(hydrationStack),
      local_metadata_status: compactGateStack(gateStack.gate_stacks.find((entry) => entry.action === 'metadata.status')),
      local_report_view: compactGateStack(gateStack.gate_stacks.find((entry) => entry.action === 'report.view'))
    },
    boundary: [
      'Read-only preview only; it does not call ESI, zKill, SDE download, or any provider.',
      'It does not write entities, metadata_runs, activity_events labels, Evidence/EVEidence, Discovery refs, queues, or schema.',
      'Missing labels are readability backlog, not report failure.',
      'Local SDE gaps are local lookup/import needs, not ESI evidence enrichment.',
      'Provider-backed hydration is shown as held by External I/O when External I/O is off.'
    ]
  };
}

function entityLabelCandidates(db, limit) {
  const rows = db.prepare(`
    WITH refs AS (
      SELECT 'character' AS entity_type, character_id AS entity_id, character_name AS event_label,
             killmail_id, killmail_time, discovered_by_type, 'character_label' AS basis
      FROM activity_events
      WHERE character_id IS NOT NULL
      UNION ALL
      SELECT 'corporation', corporation_id, corporation_name,
             killmail_id, killmail_time, discovered_by_type, 'corporation_label'
      FROM activity_events
      WHERE corporation_id IS NOT NULL
      UNION ALL
      SELECT 'alliance', alliance_id, alliance_name,
             killmail_id, killmail_time, discovered_by_type, 'alliance_label'
      FROM activity_events
      WHERE alliance_id IS NOT NULL
      UNION ALL
      SELECT entity_type, entity_id, entity_name,
             killmail_id, killmail_time, discovered_by_type, 'primary_entity_label'
      FROM activity_events
      WHERE entity_id IS NOT NULL
    )
    SELECT refs.entity_type,
           refs.entity_id,
           known.entity_name AS local_label,
           known.last_enriched_at,
           COUNT(*) AS appearances,
           SUM(CASE WHEN refs.event_label IS NULL THEN 1 ELSE 0 END) AS missing_event_labels,
           COUNT(DISTINCT refs.killmail_id) AS killmail_count,
           MIN(refs.killmail_time) AS first_seen_in_evidence,
           MAX(refs.killmail_time) AS last_seen_in_evidence,
           GROUP_CONCAT(DISTINCT refs.discovered_by_type) AS discovery_routes,
           GROUP_CONCAT(DISTINCT refs.basis) AS bases
    FROM refs
    LEFT JOIN entities known
      ON known.entity_type = refs.entity_type
     AND known.entity_id = refs.entity_id
    GROUP BY refs.entity_type, refs.entity_id
    HAVING missing_event_labels > 0 OR known.entity_name IS NULL OR known.last_enriched_at IS NULL
    ORDER BY
      CASE WHEN known.entity_name IS NULL THEN 0 ELSE 1 END,
      missing_event_labels DESC,
      appearances DESC,
      refs.entity_type,
      refs.entity_id
    LIMIT ?
  `).all(limit * 4);

  return rows.map((row) => {
    const routes = splitList(row.discovery_routes);
    const watchOriginated = routes.some((route) => route === 'actor' || route === 'system_radius');
    const marked = markedEntity(db, row.entity_type, row.entity_id);
    return {
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      label_state: row.local_label ? 'known_local_label' : 'provider_needed',
      local_label: row.local_label || null,
      provider_needed: !row.local_label,
      missing_event_labels: Number(row.missing_event_labels || 0),
      appearances: Number(row.appearances || 0),
      killmail_count: Number(row.killmail_count || 0),
      basis: splitList(row.bases),
      freshness: freshnessFor(row.last_enriched_at),
      last_enriched_at: row.last_enriched_at || null,
      first_seen_in_evidence: row.first_seen_in_evidence || null,
      last_seen_in_evidence: row.last_seen_in_evidence || null,
      discovery_routes: routes,
      lane_hints: laneHints({ watchOriginated, marked, row }),
      evidence_basis: 'activity_events local Evidence/EVEidence-derived rows',
      hydration_boundary: 'readability metadata only; numeric IDs remain facts'
    };
  });
}

function localSdeGaps(db, limit) {
  const typeRows = db.prepare(`
    WITH type_refs AS (
      SELECT ship_type_id AS type_id, ship_type_name AS event_label, killmail_id, killmail_time, 'ship_type' AS basis
      FROM activity_events
      WHERE ship_type_id IS NOT NULL
      UNION ALL
      SELECT weapon_type_id AS type_id, NULL AS event_label, killmail_id, killmail_time, 'weapon_type' AS basis
      FROM activity_events
      WHERE weapon_type_id IS NOT NULL
    )
    SELECT 'inventory_type' AS lookup_type,
           refs.type_id AS id,
           tm.type_name AS local_label,
           COUNT(*) AS appearances,
           SUM(CASE WHEN COALESCE(refs.event_label, tm.type_name) IS NULL THEN 1 ELSE 0 END) AS missing_labels,
           COUNT(DISTINCT refs.killmail_id) AS killmail_count,
           MAX(refs.killmail_time) AS last_seen_in_evidence,
           GROUP_CONCAT(DISTINCT refs.basis) AS bases
    FROM type_refs refs
    LEFT JOIN type_metadata tm ON tm.type_id = refs.type_id
    GROUP BY refs.type_id
    HAVING missing_labels > 0
    ORDER BY missing_labels DESC, appearances DESC, refs.type_id
    LIMIT ?
  `).all(limit);
  const systemRows = db.prepare(`
    SELECT 'solar_system' AS lookup_type,
           ae.solar_system_id AS id,
           ss.solar_system_name AS local_label,
           COUNT(*) AS appearances,
           SUM(CASE WHEN COALESCE(ae.solar_system_name, ss.solar_system_name) IS NULL THEN 1 ELSE 0 END) AS missing_labels,
           COUNT(DISTINCT ae.killmail_id) AS killmail_count,
           MAX(ae.killmail_time) AS last_seen_in_evidence,
           'solar_system' AS bases
    FROM activity_events ae
    LEFT JOIN solar_systems ss ON ss.solar_system_id = ae.solar_system_id
    WHERE ae.solar_system_id IS NOT NULL
    GROUP BY ae.solar_system_id
    HAVING missing_labels > 0
    ORDER BY missing_labels DESC, appearances DESC, ae.solar_system_id
    LIMIT ?
  `).all(limit);

  return [...typeRows, ...systemRows].map((row) => ({
    lookup_type: row.lookup_type,
    id: row.id,
    label_state: row.local_label ? 'known_local_sde_label' : 'local_sde_gap',
    local_label: row.local_label || null,
    missing_labels: Number(row.missing_labels || 0),
    appearances: Number(row.appearances || 0),
    killmail_count: Number(row.killmail_count || 0),
    basis: splitList(row.bases),
    last_seen_in_evidence: row.last_seen_in_evidence || null,
    provider_needed: false,
    recommended_source: row.lookup_type === 'inventory_type' ? 'local SDE inventory/type metadata' : 'local SDE topology/geography',
    hydration_boundary: 'local lookup metadata; do not use live ESI for static type or geography labels'
  }));
}

function buildLanes({ entityCandidates, sdeGaps, limit }) {
  const providerNeeded = entityCandidates.filter((entry) => entry.provider_needed);
  const locallyKnown = entityCandidates.filter((entry) => !entry.provider_needed && entry.missing_event_labels > 0);
  const watchCandidates = entityCandidates.filter((entry) => entry.lane_hints.includes('watch_background'));
  const reportScoped = entityCandidates.filter((entry) => entry.lane_hints.includes('target_or_report_scoped'));
  return [
    lane('view_local_record', 'view/local-record hydration', [...providerNeeded, ...locallyKnown], limit, 'Point-of-need readability from currently inspected local Evidence/EVEidence records.'),
    lane('watch_background', 'Watch/background hydration', watchCandidates, limit, 'Watch-originated local records can create patient readability backlog; waiting is normal.'),
    lane('target_report_scoped', 'target/Marked or report-scoped hydration', reportScoped, limit, 'Marked/assessment or repeated report-relevant IDs are candidates for explicit scoped hydration.'),
    lane('corpus_hygiene_low_priority', 'corpus hygiene / low-priority backlog', [...providerNeeded, ...sdeGaps], limit, 'Low-priority whole-corpus readability repair; not evidence acquisition and not a queue.')
  ];
}

function lane(id, label, candidates, limit, meaning) {
  return {
    lane_id: id,
    label,
    candidate_count: candidates.length,
    provider_needed_count: candidates.filter((entry) => entry.provider_needed === true).length,
    locally_known_count: candidates.filter((entry) => entry.label_state === 'known_local_label' || entry.label_state === 'known_local_sde_label').length,
    local_sde_gap_count: candidates.filter((entry) => entry.label_state === 'local_sde_gap').length,
    representatives: candidates.slice(0, limit),
    waiting_is_failure: false,
    persisted_queue: false,
    meaning
  };
}

function summaryFor(entityCandidates, sdeGaps) {
  return {
    evidence_records_scanned_basis: 'local activity_events and lookup/cache tables',
    entity_label_candidates: entityCandidates.length,
    local_known_label_candidates: entityCandidates.filter((entry) => entry.label_state === 'known_local_label').length,
    provider_needed_entity_label_candidates: entityCandidates.filter((entry) => entry.label_state === 'provider_needed').length,
    local_sde_gap_candidates: sdeGaps.length,
    missing_labels_are_report_failure: false,
    hydration_creates_evidence: false,
    discovery_refs_used_as_evidence: false
  };
}

function metadataRunContext(db) {
  return db.prepare(`
    SELECT run_id, run_type, target_type, target_id, status, started_at, finished_at,
           ids_discovered, already_known, requested_from_esi, resolved, unresolved,
           activity_events_patched, api_calls_esi
    FROM metadata_runs
    ORDER BY started_at DESC
    LIMIT 5
  `).all();
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

function laneHints({ watchOriginated, marked, row }) {
  const hints = ['view_local_record'];
  if (watchOriginated) {
    hints.push('watch_background');
  }
  if (marked || Number(row.appearances || 0) >= 2) {
    hints.push('target_or_report_scoped');
  }
  hints.push('corpus_hygiene_low_priority');
  return hints;
}

function freshnessFor(lastEnrichedAt) {
  if (!lastEnrichedAt) {
    return 'never_enriched_or_unknown';
  }
  const parsed = Date.parse(lastEnrichedAt);
  if (!Number.isFinite(parsed)) {
    return 'unknown';
  }
  const ageDays = (Date.now() - parsed) / 86400000;
  return ageDays > 30 ? 'stale_over_30_days' : 'recently_enriched';
}

function compactGateStack(stack = {}) {
  return {
    action: stack.action || null,
    provider_backed: stack.provider_backed === true,
    external_io_state: stack.gates?.external_io?.state || null,
    live_gate_allowed: stack.gates?.external_api?.allowed ?? null,
    readout_posture: stack.readout_posture || []
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
  buildHydrationBacklogPreview
};
