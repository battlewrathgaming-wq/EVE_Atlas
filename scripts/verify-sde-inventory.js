const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { SdeInventoryImporter } = require('../src/main/sde/sdeInventoryImporter');
const { auraTempRoot, projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const tempRoot = auraTempRoot();
  process.env.AURA_ATLAS_TEST_TMP = process.env.AURA_ATLAS_TEST_TMP || tempRoot;
  process.env.AURA_ATLAS_SDE_CACHE_DIR = process.env.AURA_ATLAS_SDE_CACHE_DIR || path.join(tempRoot, 'sde');

  assertProjectLocalPath(process.env.AURA_ATLAS_TEST_TMP, 'AURA_ATLAS_TEST_TMP');
  assertProjectLocalPath(process.env.AURA_ATLAS_SDE_CACHE_DIR, 'AURA_ATLAS_SDE_CACHE_DIR');

  const sdePath = resolveSdePath();
  assertProjectLocalPath(sdePath, 'SDE path');
  const dbPath = path.join(tempRoot, 'sde-inventory-local.sqlite');
  if (fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { force: true });
  }

  const db = openDatabase(dbPath);
  migrate(db);

  try {
    const importer = new SdeInventoryImporter(db);
    const first = await importer.importFromPath(sdePath, {
      sourceUrl: sdePath,
      tempRoot: process.env.AURA_ATLAS_SDE_CACHE_DIR
    });
    const second = await importer.importFromPath(sdePath, {
      sourceUrl: sdePath,
      tempRoot: process.env.AURA_ATLAS_SDE_CACHE_DIR
    });

    const rifter = db.prepare('SELECT * FROM type_metadata WHERE type_id = ?').get(587);
    assert(rifter, 'expected type 587 to exist');
    assert(rifter.type_name === 'Rifter', `expected type 587 to resolve to Rifter, got ${rifter.type_name}`);
    assert(rifter.group_name, 'expected Rifter group name');
    assert(rifter.category_name === 'Ship', `expected Rifter category Ship, got ${rifter.category_name}`);
    assert(first.categories > 0, 'expected categories to import');
    assert(first.groups > 0, 'expected groups to import');
    assert(first.types > 0, 'expected types to be scanned');
    assert(first.typeMetadata > 0, 'expected published type metadata to import');
    assert(count(db, 'type_metadata') === first.typeMetadata, 'type_metadata count should match first import');
    assert(count(db, 'type_metadata') === second.typeMetadata, 'repeated import should be idempotent');
    assert(count(db, 'sde_inventory_imports') === 2, 'each import should record provenance');

    console.log(JSON.stringify({
      status: 'sde inventory verified',
      db_path: dbPath,
      sde_path: sdePath,
      first_import: first,
      second_import: second,
      rifter: {
        type_id: rifter.type_id,
        type_name: rifter.type_name,
        group_id: rifter.group_id,
        group_name: rifter.group_name,
        category_id: rifter.category_id,
        category_name: rifter.category_name
      },
      type_metadata_count: count(db, 'type_metadata')
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

function resolveSdePath() {
  if (process.env.AURA_ATLAS_LIVE_SDE_JSONL_PATH) {
    return process.env.AURA_ATLAS_LIVE_SDE_JSONL_PATH;
  }

  const sdeRoot = process.env.AURA_ATLAS_SDE_CACHE_DIR || path.join(auraTempRoot(), 'sde');
  const zips = fs.existsSync(sdeRoot)
    ? fs.readdirSync(sdeRoot)
      .filter((name) => /^eve-online-static-data-.*-jsonl\.zip$/i.test(name))
      .map((name) => path.join(sdeRoot, name))
      .sort()
    : [];

  if (zips.length === 1) {
    return zips[0];
  }

  if (!zips.length) {
    throw new Error(`No JSONL SDE zip found in ${sdeRoot}; set AURA_ATLAS_LIVE_SDE_JSONL_PATH`);
  }

  throw new Error(`Multiple JSONL SDE zips found in ${sdeRoot}; set AURA_ATLAS_LIVE_SDE_JSONL_PATH`);
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertProjectLocalPath(targetPath, label) {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedProject = projectRoot();
  const relative = path.relative(resolvedProject, resolvedTarget);
  const isInsideProject = relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  if (!isInsideProject) {
    throw new Error(`${label} must stay under ${resolvedProject}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
