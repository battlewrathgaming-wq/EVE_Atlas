const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildLocalSdeSourcePosturePreview } = require('../src/main/services/localSdeSourcePostureService');

async function main() {
  delete process.env.AURA_ATLAS_LIVE_API;
  delete process.env.AURA_ATLAS_SDE_SOURCE_PATH;
  delete process.env.AURA_ATLAS_LIVE_SDE_JSONL_PATH;
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedGapFixture(db);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('metadata.local_sde_source_posture.preview', {
      externalIoState: 'off',
      sourcePath: 'C:\\renderer-forged\\eve-online-static-data-jsonl.zip',
      limit: 10
    }, {
      db,
      source: 'renderer'
    });
    const after = sideEffectCounts(db);

    assertSame(after, before, 'local SDE source posture preview should not mutate DB tables');
    verifyPreview(preview);
    verifyDirectBuilder(db);
    verifyReadyFixture();
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'local SDE source posture verified',
      command: preview.action,
      source_posture_summary: preview.source_posture_summary,
      readiness_summary: preview.readiness_summary,
      source_path_authority: preview.source_path_authority,
      command_family_posture: preview.command_family_posture.map((entry) => ({
        command: entry.command,
        future_action_kind: entry.future_action_kind,
        external_io_required: entry.external_io_required,
        external_io_posture: entry.external_io_posture,
        source_path_status: entry.source_path_status,
        future_lookup_rewrite_blocked: entry.storage.future_lookup_rewrite_blocked,
        reason_codes: entry.reason_codes
      })),
      external_io_posture: preview.external_io_posture,
      storage_posture: preview.storage_posture,
      support_corpus_posture: preview.support_corpus_posture,
      representative_missing_groups: Object.fromEntries(Object.entries(preview.representative_missing_groups).map(([key, value]) => [
        key,
        {
          count: value.count,
          provider_needed: value.provider_needed,
          esi_hydration_work: value.esi_hydration_work,
          representatives: value.representatives.map(compactGap)
        }
      ])),
      boundary_statements: preview.boundary_statements,
      boundary: preview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

function verifyPreview(preview) {
  assert(preview.action === 'metadata.local_sde_source_posture.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should be read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.sde_downloads === 0, 'preview should not download SDE');
  assert(preview.sde_imports_started === 0, 'preview should not import SDE');
  assert(preview.lookup_writes === 0, 'preview should not write lookup tables');
  assert(preview.hydration_writes === 0, 'preview should not write Hydration labels');
  assert(preview.metadata_run_writes === 0, 'preview should not write metadata_runs');
  assert(preview.evidence_writes === 0, 'preview should not create Evidence/EVEidence');
  assert(preview.discovery_ref_mutations === 0, 'preview should not mutate Discovery refs');
  assert(preview.watch_mutations === 0, 'preview should not mutate Watch');
  assert(preview.assessment_memory_mutations === 0, 'preview should not mutate Assessment Memory');
  assert(preview.marked_mutations === 0, 'preview should not mutate Marked');
  assert(preview.support_artifacts_created === 0, 'preview should not create support artifacts');
  assert(preview.storage_config_written === false, 'preview should not write storage config');
  assert(preview.storage_moves === 0, 'preview should not move storage');
  assert(preview.schema_changes === false, 'preview should not change schema');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate runtime enforcement');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
  assert(preview.ui_work === false, 'preview should not do UI work');

  assert(preview.source_posture_summary.readiness_state === 'partial', 'fixture should report partial local SDE readiness');
  assert(preview.source_posture_summary.missing_material.includes('topology/geography lookup'), 'fixture should report topology/geography missing material');
  assert(preview.source_posture_summary.missing_material.includes('import provenance'), 'fixture should report provenance missing material');
  assert(preview.source_posture_summary.local_sde_lookup_readiness_is_provider_hydration === false, 'readiness should not become provider-backed Hydration');
  assert(preview.readiness_summary.action === 'metadata.local_sde_readiness.preview', 'source posture should reuse local SDE readiness preview');
  assert(preview.readiness_summary.inventory_type_lookup_ready === true, 'fixture should report inventory table readiness');
  assert(preview.readiness_summary.topology_lookup_ready === false, 'fixture should report topology not ready');
  assert(preview.readiness_summary.import_provenance_ready === false, 'fixture should report missing provenance');

  assert(preview.source_path_authority.status === 'not_inspected_renderer_payload_ignored', 'renderer source path should be ignored and not inspected');
  assert(preview.source_path_authority.renderer_payload_ignored === true, 'renderer payload should be marked ignored');
  assert(preview.source_path_authority.arbitrary_file_inspection === false, 'preview should not inspect arbitrary files');

  const topologyImport = family(preview, 'sde.import.topology');
  const inventoryImport = family(preview, 'sde.import.inventory');
  const buildLookups = family(preview, 'sde.build-lookups');
  assert(topologyImport.future_action_kind === 'local_source_import_rewrite', 'topology import should be local source import/rewrite');
  assert(inventoryImport.future_action_kind === 'local_source_import_rewrite', 'inventory import should be local source import/rewrite');
  assert(topologyImport.external_io_required === false, 'local topology import should not require External I/O');
  assert(inventoryImport.external_io_required === false, 'local inventory import should not require External I/O');
  assert(buildLookups.future_action_kind === 'provider_backed_download_build', 'build without trusted source should be provider-backed download/build posture');
  assert(buildLookups.external_io_required === true, 'provider-backed SDE build should require External I/O');
  assert(buildLookups.external_io_posture === 'held_by_external_io', 'External I/O off should hold provider-backed SDE build');
  assert(buildLookups.downloads_authorized === false, 'build posture should not authorize downloads');
  assert(buildLookups.lookup_rewrites_authorized === false, 'build posture should not authorize rewrites');

  for (const entry of preview.command_family_posture) {
    assert(entry.provider_calls_authorized === false, `${entry.command} should not authorize provider calls`);
    assert(entry.imports_authorized === false, `${entry.command} should not authorize imports`);
    assert(entry.lookup_rewrites_authorized === false, `${entry.command} should not authorize lookup rewrites`);
    assert(entry.storage.local_readout_available === true, `${entry.command} should leave readout available`);
    assert(entry.storage.local_readout_blocked === false, `${entry.command} should not block readout`);
  }

  assert(preview.external_io_posture.provider_backed_download_commands.includes('sde.build-lookups'), 'External I/O summary should name provider-backed SDE build');
  assert(preview.external_io_posture.local_only_import_commands.includes('sde.import.topology'), 'External I/O summary should name topology local import');
  assert(preview.external_io_posture.external_io_on_is_authorization === false, 'External I/O on should not authorize work');
  assert(preview.storage_posture.local_readout_available === true, 'storage posture should keep readout available');
  assert(preview.storage_posture.future_lookup_rewrite.storage_posture_is_authorization === false, 'storage posture should not authorize rewrites');
  assert(preview.support_corpus_posture.sde_source_external_io_relevance.includes('SDE download is External I/O'), 'support posture should disclose SDE External I/O relevance');
  assert(preview.support_corpus_posture.support_artifact_created === false, 'support posture should not create artifacts');

  const inventoryGap = preview.representative_missing_groups.inventory_type_lookup_gap.representatives.find((entry) => entry.lookup_id === 999999);
  const topologyGap = preview.representative_missing_groups.topology_lookup_gap.representatives.find((entry) => entry.lookup_id === 30099999);
  assert(inventoryGap, 'fixture should expose inventory/type gap representative');
  assert(topologyGap, 'fixture should expose topology/geography gap representative');
  assert(preview.representative_missing_groups.inventory_type_lookup_gap.esi_hydration_work === false, 'inventory gap should not be ESI Hydration work');
  assert(preview.representative_missing_groups.topology_lookup_gap.esi_hydration_work === false, 'topology gap should not be ESI Hydration work');

  assert(preview.boundary_statements.local_sde_readiness_is_hydration === false, 'local SDE readiness should not be Hydration');
  assert(preview.boundary_statements.local_sde_readiness_is_evidence === false, 'local SDE readiness should not be Evidence/EVEidence');
  assert(preview.boundary_statements.readiness_authorizes_downloads === false, 'readiness should not authorize downloads');
  assert(preview.boundary_statements.arbitrary_user_file_inspection === false, 'preview should not inspect arbitrary user files');
}

function verifyDirectBuilder(db) {
  const preview = buildLocalSdeSourcePosturePreview(db, {
    externalIoState: 'on',
    sourcePath: 'F:\\Projects\\AURA-Atlas\\.tmp\\sde\\eve-online-static-data-jsonl.zip',
    limit: 1
  }, {
    source: 'trusted'
  });
  assert(preview.source_path_authority.status === 'local_candidate_not_inspected', 'trusted local source shape should be classified without inspection');
  const buildLookups = family(preview, 'sde.build-lookups');
  assert(buildLookups.future_action_kind === 'local_source_build_rewrite', 'trusted local source should make build posture local-source');
  assert(buildLookups.external_io_required === false, 'local-source build should not require External I/O');
  assert(buildLookups.external_io_posture === 'not_required_for_local_source_build', 'local-source build should not be provider-held');
  assert(preview.provider_calls === 0, 'direct builder should not call providers');
  assert(preview.sde_downloads === 0, 'direct builder should not download SDE');
  assert(preview.lookup_writes === 0, 'direct builder should not write lookups');

  const unsupported = buildLocalSdeSourcePosturePreview(db, {
    sourcePath: 'https://example.invalid/eve-online-static-data.zip'
  }, {
    source: 'trusted'
  });
  assert(unsupported.source_path_authority.status === 'unsupported_remote_source_reference', 'remote source references should be unsupported in this readout');
  assert(unsupported.source_path_authority.arbitrary_file_inspection === false, 'unsupported source should not be inspected');
}

function verifyReadyFixture() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedReadyFixture(db);
    const preview = buildLocalSdeSourcePosturePreview(db, { limit: 5 });
    assert(preview.source_posture_summary.readiness_state === 'complete', 'ready fixture should report complete readiness');
    assert(preview.source_posture_summary.missing_material.length === 0, 'ready fixture should not report missing material');
    assert(preview.readiness_summary.overall_ready === true, 'ready fixture should report overall readiness');
  } finally {
    closeDatabase(db);
  }
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'metadata.local_sde_source_posture.preview');
  assert(command, 'local SDE source posture command should be registered');
  assert(command.classification === 'read-only', 'local SDE source posture should be read-only');
  assert(command.effects.includes('read-only'), 'local SDE source posture should declare read-only effect');
  assert(command.renderer_allowed === true, 'local SDE source posture should be renderer eligible');
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

function family(preview, command) {
  const entry = preview.command_family_posture.find((item) => item.command === command);
  assert(entry, `${command} should be represented`);
  return entry;
}

function compactGap(gap = {}) {
  return {
    lookup_type: gap.lookup_type,
    lookup_id: gap.lookup_id,
    killmail_ids: gap.killmail_ids,
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
