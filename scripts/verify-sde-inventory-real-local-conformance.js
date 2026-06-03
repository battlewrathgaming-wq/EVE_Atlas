const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');
const {
  buildSdeInventoryImportAuthority
} = require('../src/main/services/mutatingActionService');
const { auraTempRoot } = require('../src/main/util/tempPaths');

async function main() {
  const fixtureSource = createInventoryFixtureSource();
  verifyAuthorityBlocks(fixtureSource);
  await verifySuccessfulServiceImport(fixtureSource);
  await verifyFailureRecovery(fixtureSource, 'after_stage_before_promotion', 'SDE_INVENTORY_IMPORT_INTERRUPTED_BEFORE_PROMOTION');
  await verifyFailureRecovery(fixtureSource, 'after_promotion_before_provenance', 'SDE_INVENTORY_IMPORT_INTERRUPTED_BEFORE_PROVENANCE');
  await verifyConcurrentImportExclusion(fixtureSource);
  console.log(JSON.stringify({
    status: 'SDE inventory real-local conformance verified',
    command: 'sde.import.inventory'
  }, null, 2));
}

function verifyAuthorityBlocks(fixtureSource) {
  const rendererOnly = buildSdeInventoryImportAuthority({
    path: 'C:\\renderer\\forged-inventory.zip'
  }, noSelectedStorageContext());
  assert(rendererOnly.allowed === false, 'renderer-only source path should block');
  assert(rendererOnly.blocked_reasons.includes('renderer_source_path_non_authoritative'), 'renderer source should be non-authoritative');
  assert(rendererOnly.renderer_payload_ignored === true, 'renderer payload source should be ignored');

  const remote = buildSdeInventoryImportAuthority({}, {
    ...noSelectedStorageContext(),
    sdeInventorySourceAuthority: {
      path: 'https://example.invalid/sde-inventory.zip',
      basis: 'trusted_local_operator_source'
    }
  });
  assert(remote.allowed === false, 'remote trusted source reference should block local inventory import');
  assert(remote.blocked_reasons.includes('remote_source_rejected_for_local_inventory_import'), 'remote block reason should be explicit');

  const noStorage = buildSdeInventoryImportAuthority({}, {
    ...noSelectedStorageContext(),
    sdeInventorySourceAuthority: trustedSource(fixtureSource),
    projectedSdeInventoryGrowthBytes: smallProjection()
  });
  assert(noStorage.allowed === false, 'missing selected storage should block import');
  assert(noStorage.blocked_reasons.includes('selected_storage_required_for_inventory_import'), 'selected storage should be required');

  const noBudget = buildSdeInventoryImportAuthority({}, {
    allowStorageSetupGateFixtureInput: true,
    sdeInventorySourceAuthority: trustedSource(fixtureSource),
    storagePreflight: storagePreflight({ exists: true, parentExists: true }),
    storageAuthority: selectedStorage({ budgetBytes: null }),
    projectedSdeInventoryGrowthBytes: smallProjection()
  });
  assert(noBudget.allowed === false, 'unconfigured budget should block import');
  assert(noBudget.blocked_reasons.includes('budget_unconfigured_blocks_inventory_import'), 'explicit budget should be required');

  const hardLock = buildSdeInventoryImportAuthority({}, {
    allowStorageSetupGateFixtureInput: true,
    sdeInventorySourceAuthority: trustedSource(fixtureSource),
    storagePreflight: storagePreflight({ exists: true, parentExists: true, usageBytes: 4096 }),
    storageAuthority: selectedStorage({ budgetBytes: 1024 }),
    storageBudgetBytes: 1024,
    projectedSdeInventoryGrowthBytes: smallProjection()
  });
  assert(hardLock.allowed === false, 'hard-lock budget should block import');
  assert(hardLock.blocked_reasons.includes('budget_hard_lock_blocks_inventory_import'), 'hard-lock block reason should be explicit');
}

async function verifySuccessfulServiceImport(fixtureSource) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const beforeEvidence = evidenceTableCounts(db);
    const result = await invokeServiceCommand('sde.import.inventory', {
      path: 'C:\\renderer\\forged-inventory.zip'
    }, {
      db,
      ...validContext(fixtureSource)
    });

    assert(result.categories === 2, 'service import should import fixture categories');
    assert(result.groups === 2, 'service import should import fixture groups');
    assert(result.types === 3, 'service import should scan fixture types');
    assert(result.typeMetadata === 2, 'service import should import published type metadata');
    assert(result.staged === true, 'service import should stage before promotion');
    assert(result.promotion.transactional === true, 'service promotion should be transactional');
    assert(result.promotion.staged_completeness_validated === true, 'staged completeness should be validated');
    assert(result.source_authority.renderer_payload_ignored === true, 'renderer source claims should be ignored');
    assert(result.source_authority.path_used === true, 'trusted source authority should supply the path');
    assert(result.storage_budget_authority.decision === 'allow_real_local_inventory_import', 'storage and budget should allow import');
    assert(result.projected_growth.includes_temp_cache_db_growth === true, 'projected growth should include temp/cache/DB growth');
    assert(result.provider_calls === 0, 'service import should not call providers');
    assert(result.sde_downloads === 0, 'service import should not download SDE');
    assert(result.provider_backed_builds === 0, 'service import should not run provider-backed build');
    assert(result.recovery_model.concurrent_inventory_imports_excluded === true, 'service should disclose concurrency exclusion');
    assert(count(db, 'sde_inventory_imports') === 1, 'successful import should write one success provenance row');
    assert(count(db, 'type_metadata') === 2, 'successful import should promote visible type metadata');
    assertSame(evidenceTableCounts(db), beforeEvidence, 'inventory import should not mutate Evidence/EVEidence or Assessment tables');
  } finally {
    closeDatabase(db);
  }
}

async function verifyFailureRecovery(fixtureSource, failAt, expectedCode) {
  const db = openDatabase(':memory:');
  migrate(db);
  seedOldInventory(db);
  const before = inventoryCounts(db);
  try {
    await assertThrowsAsync(() => invokeServiceCommand('sde.import.inventory', {}, {
      db,
      ...validContext(fixtureSource, {
        sdeInventoryImportOptions: {
          buildNumber: `failed-${failAt}`,
          failAt
        }
      })
    }), expectedCode, `failure ${failAt} should surface expected code`);
    const after = inventoryCounts(db);
    assertSame(after, before, `failure ${failAt} should preserve previous visible inventory and provenance`);
    const manifest = latestManifest(db);
    assert(manifest.build_number === 'old-inventory', `failure ${failAt} should not write success provenance`);
    assert(noStageTables(db), `failure ${failAt} should clean up staged temp tables`);
  } finally {
    closeDatabase(db);
  }
}

async function verifyConcurrentImportExclusion(fixtureSource) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const first = invokeServiceCommand('sde.import.inventory', {}, {
      db,
      ...validContext(fixtureSource)
    });
    await assertThrowsAsync(() => invokeServiceCommand('sde.import.inventory', {}, {
      db,
      ...validContext(fixtureSource)
    }), 'SDE_INVENTORY_IMPORT_CONCURRENTLY_EXCLUDED', 'concurrent import should be excluded');
    await first;
  } finally {
    closeDatabase(db);
  }
}

function validContext(fixtureSource, overrides = {}) {
  return {
    sdeInventorySourceAuthority: trustedSource(fixtureSource),
    storagePreflight: storagePreflight({ exists: true, parentExists: true, usageBytes: 1024 }),
    storageAuthority: selectedStorage({ budgetBytes: 1024 * 1024 }),
    storageBudgetBytes: 1024 * 1024,
    projectedSdeInventoryGrowthBytes: smallProjection(),
    sdeInventoryTempRoot: auraTempRoot(),
    allowStorageSetupGateFixtureInput: true,
    sdeInventoryImportOptions: {
      buildNumber: 'fixture-real-local-inventory',
      ...overrides.sdeInventoryImportOptions
    },
    ...overrides
  };
}

function trustedSource(fixtureSource) {
  return {
    path: fixtureSource,
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
    database_path: path.join(auraTempRoot(), 'hs232', 'atlas.sqlite'),
    storage_root: path.join(auraTempRoot(), 'hs232'),
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
      path: path.join(auraTempRoot(), 'hs232', 'atlas.sqlite'),
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

function createInventoryFixtureSource() {
  const root = path.join(auraTempRoot(), 'hs232-inventory-jsonl');
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, 'categories.jsonl'), [
    JSON.stringify({ categoryID: 6, name: { en: 'Ship' }, published: true }),
    JSON.stringify({ categoryID: 7, name: { en: 'Module' }, published: true })
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'groups.jsonl'), [
    JSON.stringify({ groupID: 25, name: { en: 'Frigate' }, categoryID: 6, published: true }),
    JSON.stringify({ groupID: 53, name: { en: 'Weapon' }, categoryID: 7, published: true })
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'types.jsonl'), [
    JSON.stringify({ typeID: 587, name: { en: 'Rifter' }, groupID: 25, published: true }),
    JSON.stringify({ typeID: 2001, name: { en: 'Laser' }, groupID: 53, published: true }),
    JSON.stringify({ typeID: 9999, name: { en: 'Unpublished Fixture' }, groupID: 53, published: false })
  ].join('\n'));
  return root;
}

function ensureInventoryTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sde_inventory_categories (
      category_id INTEGER PRIMARY KEY,
      category_name TEXT NOT NULL,
      published INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sde_inventory_groups (
      group_id INTEGER PRIMARY KEY,
      group_name TEXT NOT NULL,
      category_id INTEGER,
      published INTEGER NOT NULL DEFAULT 0
    );
  `);
}

function seedOldInventory(db) {
  ensureInventoryTables(db);
  db.prepare('INSERT INTO sde_inventory_categories (category_id, category_name, published) VALUES (?, ?, ?)')
    .run(6, 'Old Ship', 1);
  db.prepare('INSERT INTO sde_inventory_groups (group_id, group_name, category_id, published) VALUES (?, ?, ?, ?)')
    .run(25, 'Old Frigate', 6, 1);
  db.prepare(`
    INSERT INTO type_metadata (
      type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(587, 'Old Rifter', 25, 'Old Frigate', 6, 'Old Ship', now());
  db.prepare(`
    INSERT INTO sde_inventory_imports (
      build_number, variant, source_url, imported_at, file_checksum,
      categories_count, groups_count, types_count, type_metadata_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('old-inventory', 'fixture-seed', 'fixture://old-inventory', now(), 'old-checksum', 1, 1, 1, 1);
}

function inventoryCounts(db) {
  ensureInventoryTables(db);
  return {
    sde_inventory_categories: count(db, 'sde_inventory_categories'),
    sde_inventory_groups: count(db, 'sde_inventory_groups'),
    type_metadata: count(db, 'type_metadata'),
    sde_inventory_imports: count(db, 'sde_inventory_imports')
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
  return db.prepare('SELECT * FROM sde_inventory_imports ORDER BY id DESC LIMIT 1').get();
}

function noStageTables(db) {
  return [
    'temp_sde_inventory_categories',
    'temp_sde_inventory_groups',
    'temp_sde_inventory_type_metadata'
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
