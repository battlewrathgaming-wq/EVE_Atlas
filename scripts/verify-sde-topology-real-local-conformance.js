const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');
const {
  buildSdeTopologyImportAuthority
} = require('../src/main/services/mutatingActionService');
const { auraTempRoot } = require('../src/main/util/tempPaths');

async function main() {
  verifyAuthorityBlocks();
  await verifySuccessfulServiceImport();
  await verifyFailureRecovery('after_stage_before_promotion', 'SDE_TOPOLOGY_IMPORT_INTERRUPTED_BEFORE_PROMOTION');
  await verifyFailureRecovery('after_promotion_before_provenance', 'SDE_TOPOLOGY_IMPORT_INTERRUPTED_BEFORE_PROVENANCE');
  await verifyConcurrentImportExclusion();
  console.log(JSON.stringify({
    status: 'SDE topology real-local conformance verified',
    command: 'sde.import.topology'
  }, null, 2));
}

function verifyAuthorityBlocks() {
  const rendererOnly = buildSdeTopologyImportAuthority({
    path: 'C:\\renderer\\forged-topology.zip'
  }, noSelectedStorageContext());
  assert(rendererOnly.allowed === false, 'renderer-only source path should block');
  assert(rendererOnly.blocked_reasons.includes('renderer_source_path_non_authoritative'), 'renderer source should be non-authoritative');
  assert(rendererOnly.renderer_payload_ignored === true, 'renderer payload source should be ignored');

  const remote = buildSdeTopologyImportAuthority({}, {
    ...noSelectedStorageContext(),
    sdeTopologySourceAuthority: {
      path: 'https://example.invalid/sde.zip',
      basis: 'trusted_local_operator_source'
    }
  });
  assert(remote.allowed === false, 'remote trusted source reference should block local topology import');
  assert(remote.blocked_reasons.includes('remote_source_rejected_for_local_topology_import'), 'remote block reason should be explicit');

  const noStorage = buildSdeTopologyImportAuthority({}, {
    ...noSelectedStorageContext(),
    sdeTopologySourceAuthority: trustedSource(),
    projectedSdeTopologyGrowthBytes: smallProjection()
  });
  assert(noStorage.allowed === false, 'missing selected storage should block import');
  assert(noStorage.blocked_reasons.includes('selected_storage_required_for_topology_import'), 'selected storage should be required');

  const noBudget = buildSdeTopologyImportAuthority({}, {
    allowStorageSetupGateFixtureInput: true,
    sdeTopologySourceAuthority: trustedSource(),
    storagePreflight: storagePreflight({ exists: true, parentExists: true }),
    storageAuthority: selectedStorage({ budgetBytes: null }),
    projectedSdeTopologyGrowthBytes: smallProjection()
  });
  assert(noBudget.allowed === false, 'unconfigured budget should block import');
  assert(noBudget.blocked_reasons.includes('budget_unconfigured_blocks_topology_import'), 'explicit budget should be required');

  const hardLock = buildSdeTopologyImportAuthority({}, {
    allowStorageSetupGateFixtureInput: true,
    sdeTopologySourceAuthority: trustedSource(),
    storagePreflight: storagePreflight({ exists: true, parentExists: true, usageBytes: 4096 }),
    storageAuthority: selectedStorage({ budgetBytes: 1024 }),
    storageBudgetBytes: 1024,
    projectedSdeTopologyGrowthBytes: smallProjection()
  });
  assert(hardLock.allowed === false, 'hard-lock budget should block import');
  assert(hardLock.blocked_reasons.includes('budget_hard_lock_blocks_topology_import'), 'hard-lock block reason should be explicit');
}

async function verifySuccessfulServiceImport() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const beforeEvidence = evidenceTableCounts(db);
    const result = await invokeServiceCommand('sde.import.topology', {
      path: 'C:\\renderer\\forged-topology.zip'
    }, {
      db,
      ...validContext()
    });

    assert(result.systems === 4, 'service import should import fixture systems');
    assert(result.constellations === 1, 'service import should import fixture constellations');
    assert(result.regions === 1, 'service import should import fixture regions');
    assert(result.adjacency === 8, 'service import should import fixture adjacency');
    assert(result.staged === true, 'service import should stage before promotion');
    assert(result.promotion.transactional === true, 'service promotion should be transactional');
    assert(result.promotion.staged_completeness_validated === true, 'staged completeness should be validated');
    assert(result.source_authority.renderer_payload_ignored === true, 'renderer source claims should be ignored');
    assert(result.source_authority.path_used === true, 'trusted source authority should supply the path');
    assert(result.storage_budget_authority.decision === 'allow_real_local_topology_import', 'storage and budget should allow import');
    assert(result.projected_growth.includes_temp_cache_db_growth === true, 'projected growth should include temp/cache/DB growth');
    assert(result.provider_calls === 0, 'service import should not call providers');
    assert(result.sde_downloads === 0, 'service import should not download SDE');
    assert(result.provider_backed_builds === 0, 'service import should not run provider-backed build');
    assert(result.recovery_model.concurrent_topology_imports_excluded === true, 'service should disclose concurrency exclusion');
    assert(count(db, 'sde_imports') === 1, 'successful import should write one success provenance row');
    assertSame(evidenceTableCounts(db), beforeEvidence, 'topology import should not mutate Evidence/EVEidence or Assessment tables');
  } finally {
    closeDatabase(db);
  }
}

async function verifyFailureRecovery(failAt, expectedCode) {
  const db = openDatabase(':memory:');
  migrate(db);
  seedOldTopology(db);
  const before = topologyCounts(db);
  try {
    await assertThrowsAsync(() => invokeServiceCommand('sde.import.topology', {}, {
      db,
      ...validContext({
        sdeTopologyImportOptions: {
          buildNumber: `failed-${failAt}`,
          failAt
        }
      })
    }), expectedCode, `failure ${failAt} should surface expected code`);
    const after = topologyCounts(db);
    assertSame(after, before, `failure ${failAt} should preserve previous visible topology and provenance`);
    const manifest = latestManifest(db);
    assert(manifest.build_number === 'old-topology', `failure ${failAt} should not write success provenance`);
    assert(noStageTables(db), `failure ${failAt} should clean up staged temp tables`);
  } finally {
    closeDatabase(db);
  }
}

async function verifyConcurrentImportExclusion() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const first = invokeServiceCommand('sde.import.topology', {}, {
      db,
      ...validContext()
    });
    await assertThrowsAsync(() => invokeServiceCommand('sde.import.topology', {}, {
      db,
      ...validContext()
    }), 'SDE_TOPOLOGY_IMPORT_CONCURRENTLY_EXCLUDED', 'concurrent import should be excluded');
    await first;
  } finally {
    closeDatabase(db);
  }
}

function validContext(overrides = {}) {
  return {
    sdeTopologySourceAuthority: trustedSource(),
    storagePreflight: storagePreflight({ exists: true, parentExists: true, usageBytes: 1024 }),
    storageAuthority: selectedStorage({ budgetBytes: 1024 * 1024 }),
    storageBudgetBytes: 1024 * 1024,
    projectedSdeTopologyGrowthBytes: smallProjection(),
    sdeTopologyTempRoot: auraTempRoot(),
    allowStorageSetupGateFixtureInput: true,
    sdeTopologyImportOptions: {
      buildNumber: 'fixture-real-local-topology',
      ...overrides.sdeTopologyImportOptions
    },
    ...overrides
  };
}

function noSelectedStorageContext() {
  return {
    allowStorageSetupGateFixtureInput: true,
    storagePreflight: {
      action: 'storage.authority_preflight',
      read_only: true,
      database: {
        source: 'missing',
        mode: 'missing',
        path: null,
        exists: false,
        parent: {
          exists: false,
          is_directory: false
        },
        mode_flags: {
          outside_policy: false,
          demo_fixture: false
        }
      },
      snapshot: {
        settings: {
          status: 'missing'
        }
      },
      byte_usage: {
        database_bytes: 0,
        known_controlled_locations_bytes: 0
      }
    }
  };
}

function trustedSource() {
  return {
    path: path.resolve(__dirname, '..', 'fixtures', 'sde-jsonl'),
    basis: 'trusted_fixture_context'
  };
}

function smallProjection() {
  return {
    source_bytes: 1024,
    temp_extract_bytes: 1024,
    staged_table_bytes: 1024,
    db_growth_bytes: 1024,
    wal_shm_headroom_bytes: 1024
  };
}

function selectedStorage({ budgetBytes }) {
  return {
    mode: 'selected_storage',
    selected: true,
    validation_status: 'valid',
    database_path: path.join(auraTempRoot(), 'hs230', 'atlas.sqlite'),
    storage_root: path.join(auraTempRoot(), 'hs230'),
    budget_bytes: budgetBytes,
    config_source: 'fixture_storage_authority'
  };
}

function storagePreflight({ exists, parentExists, usageBytes = 0 }) {
  return {
    action: 'storage.authority_preflight',
    read_only: true,
    database: {
      source: 'configured',
      mode: exists ? 'configured' : 'missing',
      path: path.join(auraTempRoot(), 'hs230', 'atlas.sqlite'),
      exists,
      parent: {
        exists: parentExists,
        is_directory: parentExists
      },
      mode_flags: {
        outside_policy: false,
        demo_fixture: false
      }
    },
    snapshot: {
      settings: {
        status: 'missing'
      }
    },
    byte_usage: {
      database_bytes: usageBytes,
      known_controlled_locations_bytes: 0
    }
  };
}

function seedOldTopology(db) {
  db.prepare('INSERT INTO regions (region_id, region_name, source_sde_build, imported_at) VALUES (?, ?, ?, ?)')
    .run(10000001, 'Old Region', 'old-topology', now());
  db.prepare(`
    INSERT INTO constellations (
      constellation_id, constellation_name, region_id, region_name, source_sde_build, imported_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(20000001, 'Old Constellation', 10000001, 'Old Region', 'old-topology', now());
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name, region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Old Gate', 20000001, 'Old Constellation', 10000001, 'Old Region', 0.5);
  db.prepare('INSERT INTO system_adjacency (from_system_id, to_system_id, connection_type) VALUES (?, ?, ?)')
    .run(30000001, 30000002, 'stargate');
  db.prepare('INSERT INTO system_adjacency (from_system_id, to_system_id, connection_type) VALUES (?, ?, ?)')
    .run(30000002, 30000001, 'stargate');
  db.prepare(`
    INSERT INTO sde_imports (
      build_number, variant, source_url, imported_at, file_checksum,
      systems_count, constellations_count, regions_count, adjacency_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('old-topology', 'fixture-seed', 'fixture://old-topology', now(), 'old-checksum', 1, 1, 1, 2);
}

function topologyCounts(db) {
  return {
    regions: count(db, 'regions'),
    constellations: count(db, 'constellations'),
    solar_systems: count(db, 'solar_systems'),
    system_adjacency: count(db, 'system_adjacency'),
    sde_imports: count(db, 'sde_imports')
  };
}

function evidenceTableCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    entities: count(db, 'entities'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function latestManifest(db) {
  return db.prepare('SELECT * FROM sde_imports ORDER BY id DESC LIMIT 1').get();
}

function noStageTables(db) {
  return [
    'temp_sde_topology_regions',
    'temp_sde_topology_constellations',
    'temp_sde_topology_solar_systems',
    'temp_sde_topology_system_adjacency'
  ].every((tableName) => !db.prepare(`
    SELECT name FROM sqlite_temp_master WHERE type = 'table' AND name = ?
  `).get(tableName));
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function now() {
  return new Date().toISOString();
}

async function assertThrowsAsync(callback, expectedCode, message) {
  try {
    await callback();
  } catch (error) {
    assert(error.code === expectedCode, `${message}: expected ${expectedCode}, got ${error.code || error.message}`);
    return error;
  }
  throw new Error(`${message}: expected throw`);
}

function assertSame(actual, expected, message) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: ${JSON.stringify({ actual, expected })}`);
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
