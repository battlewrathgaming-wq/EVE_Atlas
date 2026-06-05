const { TopologyService } = require('../sde/topologyService');
const { resolveSystemIdentity } = require('../resolution/systemResolver');

function buildSystemRadiusAuthoringPreflight(db, input = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const radius = parseRadius(input.radiusJumps ?? input.radius_jumps ?? input.radius);
  const maxSystems = parsePositiveInteger(input.maxSystems ?? input.max_systems, 100);
  const maxRadius = parsePositiveInteger(input.maxRadius ?? input.max_radius, 5);
  const topology = topologyPosture(db);
  const base = {
    action: 'watch.system_radius_authoring_preflight.preview',
    classification: 'read-only system/radius Watch authoring preflight',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    renderer_eligible: true,
    provider_calls: 0,
    live_api_calls: 0,
    watch_dispatches: 0,
    watch_rows_written: 0,
    tasks_created: 0,
    discovery_ref_mutations: 0,
    evidence_writes: 0,
    hydration_writes: 0,
    metadata_writes: 0,
    schema_changes: 0,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    requested_scope: {
      center_system_id: input.centerSystemId ?? input.center_system_id ?? input.systemId ?? input.system_id ?? null,
      center_system_name: input.centerSystemName ?? input.center_system_name ?? input.systemName ?? input.system_name ?? null,
      radius_jumps: radius.value,
      max_systems: maxSystems,
      max_radius: maxRadius
    },
    topology_posture: topology,
    accepted_semantics: {
      radius_scope_includes_center: true,
      radius_0: 'center_only',
      radius_1: 'center_plus_direct_neighbors',
      direct_neighbor_count_excludes_center: true,
      center_first_and_marked: true,
      included_system_count_label: 'included_systems',
      direct_neighbor_count_role: 'diagnostic_detail_only'
    },
    selected_center_system: null,
    operator_facing_readout: null,
    included_system_count: 0,
    direct_neighbor_count: 0,
    direct_neighbor_count_role: 'diagnostic_detail_only',
    returned_included_system_ids: [],
    included_system_ids_for_acceptance: [],
    would_store_included_system_ids: [],
    would_create_watch_row: false,
    acceptable_for_watch_authoring: false,
    status: 'not_evaluated',
    issues: [],
    guardrails: [],
    table_mutation_proof: null,
    boundary: [
      'Read-only system/radius Watch authoring preflight only; it does not create or mutate Watch rows.',
      'Local topology lookup tables are runtime geometry support; no provider or live/API call is made.',
      'Radius included scope includes the center system; direct-neighbor count excludes the center and is diagnostic/detail only.',
      'The returned included_system_ids are the exact stored scope that would be accepted if the operator creates the Watch later.'
    ]
  };

  if (!topology.local_topology_tables_present || !topology.local_topology_edges_present) {
    return finish(db, {
      ...base,
      status: 'missing_topology',
      issues: [...base.issues, 'local_topology_lookup_missing']
    }, before);
  }

  if (!radius.valid) {
    return finish(db, {
      ...base,
      status: 'invalid_radius',
      issues: [...base.issues, radius.issue]
    }, before);
  }

  if (radius.value > maxRadius) {
    return finish(db, {
      ...base,
      status: 'invalid_radius',
      issues: [...base.issues, 'radius_exceeds_max_radius']
    }, before);
  }

  let center;
  try {
    center = resolveSystemIdentity(db, input);
  } catch (error) {
    return finish(db, {
      ...base,
      status: 'unknown_system',
      issues: [...base.issues, error.message]
    }, before);
  }

  const topologyService = new TopologyService(db);
  let plannedIds;
  let capped = false;
  let fullIds = [];
  try {
    fullIds = topologyService.getSystemsWithinRadius(center.solar_system_id, radius.value, {
      maxRadius,
      maxSystems: Number.MAX_SAFE_INTEGER
    });
    plannedIds = topologyService.getSystemsWithinRadius(center.solar_system_id, radius.value, {
      maxRadius,
      maxSystems
    });
  } catch (error) {
    if (!String(error.message || '').includes('exceeds guard max')) {
      return finish(db, {
        ...base,
        selected_center_system: center,
        status: 'invalid_radius',
        issues: [...base.issues, error.message]
      }, before);
    }
    fullIds = topologyService.getSystemsWithinRadius(center.solar_system_id, radius.value, {
      maxRadius,
      maxSystems: Number.MAX_SAFE_INTEGER
    });
    plannedIds = fullIds.slice(0, maxSystems);
    capped = true;
  }

  if (!capped && fullIds.length > plannedIds.length) {
    capped = true;
  }

  const orderedSystems = orderCenterFirst(
    plannedIds.map((systemId) => topologyService.getSystemDetails(systemId)).filter(Boolean),
    center.solar_system_id
  );
  const includedIds = orderedSystems.map((system) => system.solar_system_id);
  const directNeighborIds = directNeighborSystemIds(topologyService, center.solar_system_id, maxRadius);
  const issues = [];
  const guardrails = [];
  if (capped) {
    issues.push('included_system_scope_capped_by_max_systems');
    guardrails.push({
      type: 'max_systems_cap',
      max_systems: maxSystems,
      full_included_system_count: fullIds.length,
      returned_included_system_count: includedIds.length,
      acceptable_for_watch_authoring: false
    });
  }

  return finish(db, {
    ...base,
    selected_center_system: center,
    operator_facing_readout: {
      heading: `System ${center.solar_system_name} with a radius of ${radius.value} jump${radius.value === 1 ? '' : 's'}:`,
      included_systems_label: 'Included systems',
      included_systems: orderedSystems.map((system) => ({
        solar_system_id: system.solar_system_id,
        solar_system_name: system.solar_system_name,
        display_name: system.solar_system_id === center.solar_system_id
          ? `${system.solar_system_name} (center)`
          : system.solar_system_name,
        center: system.solar_system_id === center.solar_system_id,
        constellation_name: system.constellation_name || null,
        region_name: system.region_name || null,
        security_status: system.security_status
      }))
    },
    included_system_count: includedIds.length,
    direct_neighbor_count: directNeighborIds.length,
    returned_included_system_ids: includedIds,
    included_system_ids_for_acceptance: capped ? [] : includedIds,
    would_store_included_system_ids: capped ? [] : includedIds,
    acceptable_for_watch_authoring: !capped && includedIds.length > 0,
    status: capped ? 'capped_scope_not_acceptable_without_adjustment' : 'acceptable',
    issues,
    guardrails
  }, before);
}

function finish(db, result, before) {
  const after = stateSnapshot(db);
  return {
    ...result,
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
    }
  };
}

function topologyPosture(db) {
  const systems = count(db, 'solar_systems');
  const adjacency = count(db, 'system_adjacency');
  return {
    runtime_lookup_authority: 'local_topology_lookup_tables',
    sde_source_material_role: 'import/source_provenance_only',
    solar_systems: systems,
    system_adjacency: adjacency,
    local_topology_tables_present: systems > 0,
    local_topology_edges_present: adjacency > 0
  };
}

function parseRadius(value) {
  const radius = Number(value);
  if (!Number.isInteger(radius)) {
    return { valid: false, value: Number.isFinite(radius) ? radius : null, issue: 'radius_must_be_integer' };
  }
  if (radius < 0) {
    return { valid: false, value: radius, issue: 'radius_must_be_non_negative' };
  }
  return { valid: true, value: radius, issue: null };
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function orderCenterFirst(systems, centerSystemId) {
  const unique = new Map();
  for (const system of systems) {
    unique.set(Number(system.solar_system_id), system);
  }
  const rows = [...unique.values()];
  return [
    ...rows.filter((system) => system.solar_system_id === Number(centerSystemId)),
    ...rows
      .filter((system) => system.solar_system_id !== Number(centerSystemId))
      .sort((left, right) => String(left.solar_system_name).localeCompare(String(right.solar_system_name)))
  ];
}

function directNeighborSystemIds(topologyService, centerSystemId, maxRadius) {
  return topologyService
    .getSystemsWithinRadius(centerSystemId, 1, {
      maxRadius,
      maxSystems: Number.MAX_SAFE_INTEGER
    })
    .filter((systemId) => Number(systemId) !== Number(centerSystemId));
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
  buildSystemRadiusAuthoringPreflight
};
