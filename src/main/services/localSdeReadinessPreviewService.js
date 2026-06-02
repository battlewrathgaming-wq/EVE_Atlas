const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 25;

function buildLocalSdeReadinessPreview(db, input = {}) {
  const limit = boundedLimit(input.limit || input.previewLimit || input.preview_limit);
  const tables = tablePosture(db);
  const provenance = importProvenance(db);
  const gaps = representativeGaps(db, limit, { tables, provenance });

  return {
    action: 'metadata.local_sde_readiness.preview',
    classification: 'read-only local SDE readiness gap lens',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    provider_calls: 0,
    sde_downloads: 0,
    sde_imports_started: 0,
    lookup_writes: 0,
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
    readiness: readinessFor(tables, provenance),
    tables,
    import_provenance: provenance,
    gap_groups: gaps.groups,
    representative_gaps: gaps.representatives,
    source_material_posture: {
      sde_source_or_import_material_needed_later: gaps.groups.import_provenance_gap.count > 0 ||
        tables.inventory.ready === false ||
        tables.topology.ready === false,
      preview_downloads_or_imports_now: false,
      runtime_reports_should_use_sqlite_lookup_tables: true
    },
    hydration_boundary: {
      local_sde_gaps_are_esi_hydration: false,
      local_sde_gaps_are_provider_needed_entity_labels: false,
      esi_hydration_repairs_entity_readability: true,
      sde_readiness_repairs_static_type_and_geography_labels: true,
      missing_static_labels_trigger_live_esi_label_work: false
    },
    evidence_boundary: {
      ids_are_facts: true,
      static_labels_are_readability: true,
      missing_static_labels_create_evidence_gap: false,
      missing_static_labels_invalidate_evidence: false,
      local_sde_readiness_creates_evidence: false
    },
    boundary: [
      'Local SDE readiness gaps are local lookup/import gaps, not ESI provider-needed Hydration.',
      'Missing static type or geography labels degrade display/readiness but do not create or invalidate Evidence/EVEidence.',
      'This preview does not download or import SDE and does not write lookup tables.',
      'Static type/geography labels should come from local SDE lookup tables during normal reporting.',
      'SDE lookup readiness repairs static local labels and geometry; ESI Hydration repairs entity readability labels.'
    ]
  };
}

function tablePosture(db) {
  const tableCounts = {
    type_metadata: count(db, 'type_metadata'),
    solar_systems: count(db, 'solar_systems'),
    regions: count(db, 'regions'),
    constellations: count(db, 'constellations'),
    system_adjacency: count(db, 'system_adjacency'),
    sde_imports: count(db, 'sde_imports'),
    sde_inventory_imports: count(db, 'sde_inventory_imports')
  };
  return {
    counts: tableCounts,
    inventory: {
      ready: tableCounts.type_metadata > 0,
      required_tables: ['type_metadata'],
      empty_tables: tableCounts.type_metadata > 0 ? [] : ['type_metadata'],
      role: 'static inventory/type lookup labels'
    },
    topology: {
      ready: tableCounts.regions > 0 &&
        tableCounts.constellations > 0 &&
        tableCounts.solar_systems > 0 &&
        tableCounts.system_adjacency > 0,
      required_tables: ['regions', 'constellations', 'solar_systems', 'system_adjacency'],
      empty_tables: ['regions', 'constellations', 'solar_systems', 'system_adjacency']
        .filter((tableName) => tableCounts[tableName] <= 0),
      role: 'static topology/geography lookup and system-radius geometry'
    },
    import_provenance: {
      topology_import_recorded: tableCounts.sde_imports > 0,
      inventory_import_recorded: tableCounts.sde_inventory_imports > 0,
      empty_tables: [
        ...(tableCounts.sde_imports > 0 ? [] : ['sde_imports']),
        ...(tableCounts.sde_inventory_imports > 0 ? [] : ['sde_inventory_imports'])
      ],
      role: 'SDE import/source provenance'
    }
  };
}

function importProvenance(db) {
  return {
    topology: latestRow(db, 'sde_imports', `
      SELECT id, build_number, variant, source_url, imported_at, file_checksum,
             systems_count, constellations_count, regions_count, adjacency_count
      FROM sde_imports
      ORDER BY id DESC
      LIMIT 1
    `),
    inventory: latestRow(db, 'sde_inventory_imports', `
      SELECT id, build_number, variant, source_url, imported_at, file_checksum,
             categories_count, groups_count, types_count, type_metadata_count
      FROM sde_inventory_imports
      ORDER BY id DESC
      LIMIT 1
    `),
    context_only: true,
    writes_import_provenance: false
  };
}

function readinessFor(tables, provenance) {
  return {
    topology_lookup_ready: tables.topology.ready,
    inventory_type_lookup_ready: tables.inventory.ready,
    import_provenance_ready: Boolean(provenance.topology && provenance.inventory),
    overall_ready: tables.topology.ready && tables.inventory.ready && Boolean(provenance.topology && provenance.inventory),
    missing_table_groups: [
      ...(tables.inventory.ready ? [] : ['inventory_type_lookup_gap']),
      ...(tables.topology.ready ? [] : ['topology_lookup_gap']),
      ...(provenance.topology && provenance.inventory ? [] : ['import_provenance_gap'])
    ],
    ready_means_provider_authorized: false
  };
}

function representativeGaps(db, limit, { tables, provenance }) {
  const inventory = inventoryTypeGaps(db, limit);
  const topology = topologyGaps(db, limit);
  const importGaps = importProvenanceGaps({ tables, provenance });
  return {
    groups: {
      inventory_type_lookup_gap: group('inventory_type_lookup_gap', inventory, 'Missing static inventory/type lookup labels from local Evidence/EVEidence-derived rows.'),
      topology_lookup_gap: group('topology_lookup_gap', topology, 'Missing static topology/geography lookup labels or geometry from local Evidence/EVEidence-derived rows.'),
      import_provenance_gap: group('import_provenance_gap', importGaps, 'Missing SDE import provenance records for readiness review.')
    },
    representatives: [...inventory, ...topology, ...importGaps].slice(0, limit * 3)
  };
}

function inventoryTypeGaps(db, limit) {
  return db.prepare(`
    WITH refs AS (
      SELECT 'ship_type_id' AS basis, ship_type_id AS lookup_id, ship_type_name AS event_label, killmail_id, killmail_time
      FROM activity_events
      WHERE ship_type_id IS NOT NULL
      UNION ALL
      SELECT 'weapon_type_id', weapon_type_id, NULL AS event_label, killmail_id, killmail_time
      FROM activity_events
      WHERE weapon_type_id IS NOT NULL
    )
    SELECT 'inventory_type_lookup_gap' AS gap_group,
           'inventory_type' AS lookup_type,
           refs.lookup_id,
           tm.type_name AS local_lookup_label,
           COUNT(*) AS appearance_count,
           COUNT(DISTINCT refs.killmail_id) AS killmail_count,
           SUM(CASE WHEN tm.type_id IS NULL THEN 1 ELSE 0 END) AS missing_lookup_count,
           SUM(CASE WHEN refs.event_label IS NULL THEN 1 ELSE 0 END) AS missing_event_label_count,
           GROUP_CONCAT(DISTINCT refs.killmail_id) AS killmail_ids,
           GROUP_CONCAT(DISTINCT refs.basis) AS source_basis,
           MAX(refs.killmail_time) AS last_seen_in_evidence
    FROM refs
    LEFT JOIN type_metadata tm ON tm.type_id = refs.lookup_id
    GROUP BY refs.lookup_id
    HAVING missing_lookup_count > 0
    ORDER BY missing_lookup_count DESC, missing_event_label_count DESC, killmail_count DESC, refs.lookup_id
    LIMIT ?
  `).all(limit).map((row) => gapRow(row, {
    gapGroup: 'inventory_type_lookup_gap',
    recommended_source: 'local SDE inventory/type metadata import',
    provider_needed: false,
    boundary: 'Static inventory/type labels should be repaired through local SDE lookup readiness, not live ESI Hydration.'
  }));
}

function topologyGaps(db, limit) {
  return db.prepare(`
    WITH refs AS (
      SELECT 'activity_events.solar_system_id' AS basis, solar_system_id AS lookup_id,
             solar_system_name AS event_label, killmail_id, killmail_time
      FROM activity_events
      WHERE solar_system_id IS NOT NULL
      UNION ALL
      SELECT 'killmails.solar_system_id', solar_system_id, NULL AS event_label, killmail_id, killmail_time
      FROM killmails
      WHERE solar_system_id IS NOT NULL
    )
    SELECT 'topology_lookup_gap' AS gap_group,
           'solar_system' AS lookup_type,
           refs.lookup_id,
           ss.solar_system_name AS local_lookup_label,
           COUNT(*) AS appearance_count,
           COUNT(DISTINCT refs.killmail_id) AS killmail_count,
           SUM(CASE WHEN ss.solar_system_id IS NULL THEN 1 ELSE 0 END) AS missing_lookup_count,
           SUM(CASE WHEN refs.event_label IS NULL THEN 1 ELSE 0 END) AS missing_event_label_count,
           GROUP_CONCAT(DISTINCT refs.killmail_id) AS killmail_ids,
           GROUP_CONCAT(DISTINCT refs.basis) AS source_basis,
           MAX(refs.killmail_time) AS last_seen_in_evidence
    FROM refs
    LEFT JOIN solar_systems ss ON ss.solar_system_id = refs.lookup_id
    GROUP BY refs.lookup_id
    HAVING missing_lookup_count > 0
    ORDER BY missing_lookup_count DESC, missing_event_label_count DESC, killmail_count DESC, refs.lookup_id
    LIMIT ?
  `).all(limit).map((row) => gapRow(row, {
    gapGroup: 'topology_lookup_gap',
    recommended_source: 'local SDE topology/geography import',
    provider_needed: false,
    boundary: 'Static topology/geography labels and radius geometry should be repaired through local SDE lookup readiness, not live ESI Hydration.'
  }));
}

function importProvenanceGaps({ tables, provenance }) {
  const gaps = [];
  if (!provenance.topology) {
    gaps.push(importGap('sde_imports', 'topology import provenance is missing', tables.topology.ready));
  }
  if (!provenance.inventory) {
    gaps.push(importGap('sde_inventory_imports', 'inventory/type import provenance is missing', tables.inventory.ready));
  }
  return gaps;
}

function importGap(tableName, reason, lookupReady) {
  return {
    gap_group: 'import_provenance_gap',
    lookup_type: tableName,
    lookup_id: null,
    local_lookup_label: null,
    appearance_count: 0,
    killmail_count: 0,
    missing_lookup_count: 1,
    missing_event_label_count: 0,
    killmail_ids: [],
    source_basis: [tableName],
    last_seen_in_evidence: null,
    recommended_source: 'local SDE import provenance review',
    provider_needed: false,
    lookup_ready_without_provenance: lookupReady,
    reason,
    boundary: 'Import provenance gaps are local readiness review gaps, not ESI Hydration work or Evidence/EVEidence gaps.'
  };
}

function gapRow(row, extras) {
  return {
    gap_group: extras.gapGroup,
    lookup_type: row.lookup_type,
    lookup_id: Number(row.lookup_id),
    local_lookup_label: row.local_lookup_label || null,
    appearance_count: Number(row.appearance_count || 0),
    killmail_count: Number(row.killmail_count || 0),
    missing_lookup_count: Number(row.missing_lookup_count || 0),
    missing_event_label_count: Number(row.missing_event_label_count || 0),
    killmail_ids: splitList(row.killmail_ids).map(Number),
    source_basis: splitList(row.source_basis),
    last_seen_in_evidence: row.last_seen_in_evidence || null,
    recommended_source: extras.recommended_source,
    provider_needed: extras.provider_needed,
    boundary: extras.boundary
  };
}

function group(groupId, representatives, meaning) {
  return {
    group_id: groupId,
    count: representatives.length,
    representatives,
    provider_needed: false,
    esi_hydration_work: false,
    meaning
  };
}

function latestRow(db, tableName, sql) {
  if (!tableExists(db, tableName)) {
    return null;
  }
  return db.prepare(sql).get() || null;
}

function count(db, tableName) {
  if (!tableExists(db, tableName)) {
    return 0;
  }
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function tableExists(db, tableName) {
  return Boolean(db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type IN ('table', 'view') AND name = ?
  `).get(tableName));
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

module.exports = {
  buildLocalSdeReadinessPreview
};
