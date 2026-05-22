const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildMetadataStatusReport } = require('../src/main/reports/metadataStatusReport');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');

function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  const empty = buildMetadataStatusReport(db);
  assertIncludes(empty, 'AURA Atlas Metadata Status');
  assertIncludes(empty, 'Topology imported: no');
  assertIncludes(empty, 'Inventory imported: no');
  assertIncludes(empty, 'Topology lookup ready: no');
  assertIncludes(empty, 'Inventory/type lookup ready: no');
  assertIncludes(empty, 'SDE zip files are import material only');

  seedMetadata(db);
  const ready = buildMetadataStatusReport(db);
  assertIncludes(ready, 'Topology imported: yes');
  assertIncludes(ready, 'Topology build: fixture-build');
  assertIncludes(ready, 'Inventory imported: yes');
  assertIncludes(ready, 'Inventory build: fixture-build');
  assertIncludes(ready, 'Topology lookup ready: yes');
  assertIncludes(ready, 'Inventory/type lookup ready: yes');
  assertIncludes(ready, 'character');
  assertIncludes(ready, 'report_actor_candidates');
  assertIncludes(ready, 'SDE sync/compare/update is a backlog feature');

  closeDatabase(db);
  console.log('metadata status verified');
}

function seedMetadata(db) {
  db.prepare(`
    INSERT INTO regions (region_id, region_name, source_sde_build, imported_at)
    VALUES (?, ?, ?, ?)
  `).run(10000001, 'Test Region', 'fixture-build', '2026-05-22T00:00:00Z');
  db.prepare(`
    INSERT INTO constellations (constellation_id, constellation_name, region_id, region_name, source_sde_build, imported_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(20000001, 'Test Constellation', 10000001, 'Test Region', 'fixture-build', '2026-05-22T00:00:00Z');
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
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
  `).run('fixture-build', 'jsonl', 'fixtures/sde-jsonl', '2026-05-22T00:00:00Z', 'checksum', 1, 1, 1, 1);
  db.prepare(`
    INSERT INTO type_metadata (
      type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(587, 'Rifter', 25, 'Frigate', 6, 'Ship', '2026-05-22T00:00:00Z');
  db.prepare(`
    INSERT INTO sde_inventory_imports (
      build_number, variant, source_url, imported_at, file_checksum,
      categories_count, groups_count, types_count, type_metadata_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('fixture-build', 'jsonl', 'fixtures/sde-jsonl', '2026-05-22T00:00:00Z', 'checksum', 1, 1, 1, 1);
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at, last_enriched_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run('character', 90000002, 'Atlas Scout', '2026-05-22T00:00:00Z', '2026-05-22T00:00:00Z', '2026-05-22T00:00:00Z');

  const repository = new EvidenceRepository(db);
  const run = repository.createMetadataRun({
    runId: 'metadata_fixture',
    trigger: 'fixture_test',
    runType: 'report_actor_candidates',
    targetType: 'character',
    targetId: '90000002'
  });
  repository.finalizeMetadataRun(run.run_id, {
    ids_discovered: 1,
    already_known: 1,
    resolved: 1,
    entities_upserted: 1,
    activity_events_patched: 2,
    api_calls_esi: 0
  }, 'success');
}

function assertIncludes(text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`Expected metadata status report to include "${expected}"`);
  }
}

main();
