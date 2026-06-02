const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildLocalSdeReadinessPreview } = require('../src/main/services/localSdeReadinessPreviewService');

async function main() {
  delete process.env.AURA_ATLAS_LIVE_API;
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedGapFixture(db);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('metadata.local_sde_readiness.preview', { limit: 10 }, { db });
    const after = sideEffectCounts(db);

    assertSame(after, before, 'local SDE readiness preview should not mutate DB tables');
    verifyGapPreview(preview);
    verifyReadyPreview();
    verifyDirectBuilder(db);
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'local SDE readiness preview verified',
      readiness: preview.readiness,
      table_counts: preview.tables.counts,
      inventory_gap: compactGap(preview.gap_groups.inventory_type_lookup_gap.representatives[0]),
      topology_gap: compactGap(preview.gap_groups.topology_lookup_gap.representatives[0]),
      import_gap_count: preview.gap_groups.import_provenance_gap.count,
      hydration_boundary: preview.hydration_boundary,
      evidence_boundary: preview.evidence_boundary,
      boundary: preview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

function verifyGapPreview(preview) {
  assert(preview.action === 'metadata.local_sde_readiness.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should be read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.sde_downloads === 0, 'preview should not download SDE');
  assert(preview.sde_imports_started === 0, 'preview should not import SDE');
  assert(preview.lookup_writes === 0, 'preview should not write lookup tables');
  assert(preview.hydration_writes === 0, 'preview should not write Hydration labels');
  assert(preview.entity_writes === 0, 'preview should not write entities');
  assert(preview.activity_event_label_patches === 0, 'preview should not patch activity_events');
  assert(preview.metadata_run_writes === 0, 'preview should not write metadata_runs');
  assert(preview.evidence_writes === 0, 'preview should not write Evidence/EVEidence');
  assert(preview.discovery_ref_mutations === 0, 'preview should not mutate Discovery refs');
  assert(preview.watch_mutations === 0, 'preview should not mutate Watch');
  assert(preview.assessment_memory_mutations === 0, 'preview should not mutate Assessment Memory');
  assert(preview.marked_mutations === 0, 'preview should not mutate Marked state');
  assert(preview.support_artifacts_created === 0, 'preview should not create support artifacts');
  assert(preview.persisted_queue === false, 'preview should not persist a queue');
  assert(preview.schema_changes === false, 'preview should not change schema');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate runtime enforcement');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
  assert(preview.ui_work === false, 'preview should not do UI work');

  assert(preview.tables.counts.type_metadata === 1, 'fixture should expose type_metadata count');
  assert(preview.tables.counts.solar_systems === 1, 'fixture should expose solar_systems count');
  assert(preview.tables.counts.regions === 0, 'fixture should expose empty regions table');
  assert(preview.tables.counts.constellations === 0, 'fixture should expose empty constellations table');
  assert(preview.tables.counts.system_adjacency === 0, 'fixture should expose empty adjacency table');
  assert(preview.tables.counts.sde_imports === 0, 'fixture should expose missing topology provenance');
  assert(preview.tables.counts.sde_inventory_imports === 0, 'fixture should expose missing inventory provenance');

  assert(preview.readiness.inventory_type_lookup_ready === true, 'one type_metadata row should make inventory table posture ready');
  assert(preview.readiness.topology_lookup_ready === false, 'partial topology should not be ready');
  assert(preview.readiness.import_provenance_ready === false, 'missing provenance should not be ready');
  assert(preview.readiness.ready_means_provider_authorized === false, 'readiness should not authorize providers');
  assert(preview.readiness.missing_table_groups.includes('topology_lookup_gap'), 'topology readiness gap should be named');
  assert(preview.readiness.missing_table_groups.includes('import_provenance_gap'), 'import provenance gap should be named');

  const inventoryGap = preview.gap_groups.inventory_type_lookup_gap.representatives.find((entry) => entry.lookup_id === 999999);
  assert(inventoryGap, 'missing ship type should be represented as inventory/type gap');
  assert(inventoryGap.provider_needed === false, 'inventory gap should not be provider-needed Hydration');
  assert(inventoryGap.boundary.includes('local SDE'), 'inventory gap should preserve local SDE boundary');
  assert(inventoryGap.killmail_ids.includes(8301), 'inventory gap should retain local Evidence/EVEidence-derived anchor');

  const topologyGap = preview.gap_groups.topology_lookup_gap.representatives.find((entry) => entry.lookup_id === 30099999);
  assert(topologyGap, 'missing solar system should be represented as topology gap');
  assert(topologyGap.provider_needed === false, 'topology gap should not be provider-needed Hydration');
  assert(topologyGap.boundary.includes('topology'), 'topology gap should preserve topology boundary');
  assert(topologyGap.killmail_ids.includes(8302), 'topology gap should retain local Evidence/EVEidence-derived anchor');

  assert(preview.gap_groups.import_provenance_gap.count === 2, 'missing topology and inventory provenance should both be represented');
  assert(preview.gap_groups.inventory_type_lookup_gap.esi_hydration_work === false, 'inventory group should not be ESI Hydration work');
  assert(preview.gap_groups.topology_lookup_gap.esi_hydration_work === false, 'topology group should not be ESI Hydration work');
  assert(preview.hydration_boundary.local_sde_gaps_are_esi_hydration === false, 'local SDE gaps should not be ESI Hydration');
  assert(preview.hydration_boundary.local_sde_gaps_are_provider_needed_entity_labels === false, 'local SDE gaps should not be provider-needed entity labels');
  assert(preview.evidence_boundary.missing_static_labels_create_evidence_gap === false, 'missing static labels should not create Evidence gap');
  assert(preview.evidence_boundary.missing_static_labels_invalidate_evidence === false, 'missing static labels should not invalidate Evidence');
}

function verifyReadyPreview() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedReadyFixture(db);
    const preview = buildLocalSdeReadinessPreview(db, { limit: 5 });
    assert(preview.readiness.topology_lookup_ready === true, 'ready fixture should report topology ready');
    assert(preview.readiness.inventory_type_lookup_ready === true, 'ready fixture should report inventory ready');
    assert(preview.readiness.import_provenance_ready === true, 'ready fixture should report provenance ready');
    assert(preview.readiness.overall_ready === true, 'ready fixture should report overall ready');
    assert(preview.gap_groups.inventory_type_lookup_gap.count === 0, 'ready fixture should have no inventory gaps');
    assert(preview.gap_groups.topology_lookup_gap.count === 0, 'ready fixture should have no topology gaps');
    assert(preview.gap_groups.import_provenance_gap.count === 0, 'ready fixture should have no provenance gaps');
  } finally {
    closeDatabase(db);
  }
}

function verifyDirectBuilder(db) {
  const preview = buildLocalSdeReadinessPreview(db, { limit: 1 });
  assert(preview.provider_calls === 0, 'direct builder should not call providers');
  assert(preview.sde_downloads === 0, 'direct builder should not download SDE');
  assert(preview.lookup_writes === 0, 'direct builder should not write lookups');
  assert(preview.gap_groups.inventory_type_lookup_gap.representatives.length <= 1, 'direct builder should honor limit');
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'metadata.local_sde_readiness.preview');
  assert(command, 'local SDE readiness preview command should be registered');
  assert(command.classification === 'read-only', 'local SDE readiness preview should be read-only');
  assert(command.effects.includes('read-only'), 'local SDE readiness preview should declare read-only effect');
  assert(command.renderer_allowed === true, 'local SDE readiness preview should be renderer eligible');
}

function seedGapFixture(db) {
  db.prepare(`
    INSERT INTO type_metadata (
      type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(603, 'Merlin', 25, 'Frigate', 6, 'Ship', '2026-05-01T00:00:00Z');
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name, region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
  insertKillmail(db, 8301, 30000001);
  insertKillmail(db, 8302, 30099999);
  insertEvent(db, {
    eventKey: '8301:attacker:90000003',
    killmailId: 8301,
    characterId: 90000003,
    shipTypeId: 999999,
    weaponTypeId: 603,
    solarSystemId: 30000001,
    solarSystemName: 'Atlas Prime'
  });
  insertEvent(db, {
    eventKey: '8302:victim:90000004',
    killmailId: 8302,
    characterId: 90000004,
    shipTypeId: 603,
    weaponTypeId: 999999,
    solarSystemId: 30099999,
    solarSystemName: null
  });
}

function seedReadyFixture(db) {
  db.prepare(`
    INSERT INTO regions (region_id, region_name, source_sde_build, imported_at)
    VALUES (?, ?, ?, ?)
  `).run(10000001, 'Test Region', 'fixture-build', '2026-05-01T00:00:00Z');
  db.prepare(`
    INSERT INTO constellations (constellation_id, constellation_name, region_id, region_name, source_sde_build, imported_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(20000001, 'Test Constellation', 10000001, 'Test Region', 'fixture-build', '2026-05-01T00:00:00Z');
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name, region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
  db.prepare(`
    INSERT INTO system_adjacency (from_system_id, to_system_id, connection_type)
    VALUES (?, ?, ?)
  `).run(30000001, 30000002, 'stargate');
  db.prepare(`
    INSERT INTO sde_imports (
      build_number, variant, source_url, imported_at, file_checksum,
      systems_count, constellations_count, regions_count, adjacency_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('fixture-build', 'jsonl', 'fixtures/sde-jsonl', '2026-05-01T00:00:00Z', 'checksum', 1, 1, 1, 1);
  db.prepare(`
    INSERT INTO type_metadata (
      type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(603, 'Merlin', 25, 'Frigate', 6, 'Ship', '2026-05-01T00:00:00Z');
  db.prepare(`
    INSERT INTO sde_inventory_imports (
      build_number, variant, source_url, imported_at, file_checksum,
      categories_count, groups_count, types_count, type_metadata_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('fixture-build', 'jsonl', 'fixtures/sde-jsonl', '2026-05-01T00:00:00Z', 'checksum', 1, 1, 1, 1);
  insertKillmail(db, 8303, 30000001);
  insertEvent(db, {
    eventKey: '8303:attacker:90000005',
    killmailId: 8303,
    characterId: 90000005,
    shipTypeId: 603,
    weaponTypeId: 603,
    solarSystemId: 30000001,
    solarSystemName: 'Atlas Prime'
  });
}

function insertKillmail(db, killmailId, solarSystemId) {
  db.prepare(`
    INSERT INTO killmails (
      killmail_id, killmail_hash, killmail_time, solar_system_id, raw_esi_payload,
      raw_payload_checksum, source, first_seen_at, last_seen_at, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    killmailId,
    `hash_${killmailId}`,
    '2026-05-30T10:00:00Z',
    solarSystemId,
    '{}',
    `checksum_${killmailId}`,
    'fixture',
    '2026-05-30T10:00:00Z',
    '2026-05-30T10:00:00Z',
    '2026-05-30T10:00:00Z'
  );
}

function insertEvent(db, fixture) {
  db.prepare(`
    INSERT INTO activity_events (
      event_key, killmail_id, role, entity_type, entity_id, entity_name,
      character_id, character_name, corporation_id, corporation_name, alliance_id, alliance_name,
      ship_type_id, ship_type_name, weapon_type_id, final_blow, damage_done,
      solar_system_id, solar_system_name, region_id, region_name, killmail_time, ingested_at,
      discovered_by_type, discovered_by_id, normalizer_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    fixture.eventKey,
    fixture.killmailId,
    fixture.eventKey.includes(':victim:') ? 'victim' : 'attacker',
    'character',
    fixture.characterId,
    null,
    fixture.characterId,
    null,
    98000002,
    null,
    null,
    null,
    fixture.shipTypeId,
    fixture.shipTypeId === 603 ? 'Merlin' : null,
    fixture.weaponTypeId,
    0,
    100,
    fixture.solarSystemId,
    fixture.solarSystemName,
    10000001,
    'Test Region',
    '2026-05-30T10:00:00Z',
    '2026-05-30T10:00:00Z',
    'manual_actor',
    fixture.characterId,
    'fixture'
  );
}

function compactGap(gap = {}) {
  return {
    gap_group: gap.gap_group,
    lookup_type: gap.lookup_type,
    lookup_id: gap.lookup_id,
    killmail_ids: gap.killmail_ids,
    source_basis: gap.source_basis,
    provider_needed: gap.provider_needed
  };
}

function sideEffectCounts(db) {
  return {
    regions: count(db, 'regions'),
    constellations: count(db, 'constellations'),
    solar_systems: count(db, 'solar_systems'),
    system_adjacency: count(db, 'system_adjacency'),
    type_metadata: count(db, 'type_metadata'),
    sde_imports: count(db, 'sde_imports'),
    sde_inventory_imports: count(db, 'sde_inventory_imports'),
    entities: count(db, 'entities'),
    metadata_runs: count(db, 'metadata_runs'),
    activity_events: count(db, 'activity_events'),
    killmails: count(db, 'killmails'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
