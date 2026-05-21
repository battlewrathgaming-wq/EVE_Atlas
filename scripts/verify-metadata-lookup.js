const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');

function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  const indexes = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'index' AND name IN (
      'idx_type_metadata_category',
      'idx_type_metadata_group',
      'idx_type_metadata_type_name'
    )
  `).all().map((row) => row.name);
  const view = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'view' AND name = 'ship_types'
  `).get();

  assert(indexes.includes('idx_type_metadata_category'), 'missing category index');
  assert(indexes.includes('idx_type_metadata_group'), 'missing group index');
  assert(indexes.includes('idx_type_metadata_type_name'), 'missing type_name index');
  assert(view, 'missing ship_types view');
  assertGeographyIndexes(db);

  assertReportsDoNotImportSde();
  assertTypeLabels();

  closeDatabase(db);
  console.log('metadata lookup hardening verified');
}

function assertGeographyIndexes(db) {
  const indexes = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'index' AND name IN (
      'idx_solar_systems_region',
      'idx_solar_systems_constellation',
      'idx_constellations_region'
    )
  `).all().map((row) => row.name);
  assert(indexes.includes('idx_solar_systems_region'), 'missing solar_systems region index');
  assert(indexes.includes('idx_solar_systems_constellation'), 'missing solar_systems constellation index');
  assert(indexes.includes('idx_constellations_region'), 'missing constellations region index');
}

function assertTypeLabels() {
  const { formatTypeLabel, formatEntityLabel, formatSystemLabel } = require('../src/main/reports/reportUtils');
  assert(formatTypeLabel('Capsule', 670) === 'Capsule [typeID: 670]', 'type label should use typeID');
  assert(formatEntityLabel('Pilot', 'character', 123) === 'Pilot [characterID: 123]', 'character label should use characterID');
  assert(formatEntityLabel(null, 'corporation', 456) === 'corporationID 456 [unresolved]', 'unresolved corporation label should use corporationID');
  assert(formatSystemLabel('ZTS-4D', 30004660) === 'ZTS-4D [solarSystemID: 30004660]', 'system label should use solarSystemID');
}

function assertReportsDoNotImportSde() {
  const roots = [
    path.resolve(__dirname, '..', 'src', 'main', 'reports'),
    path.resolve(__dirname)
  ];
  const reportFiles = [];
  for (const root of roots) {
    for (const filePath of fs.readdirSync(root).map((name) => path.join(root, name))) {
      const name = path.basename(filePath);
      if (
        filePath.includes(`${path.sep}reports${path.sep}`) ||
        /^report-.*\.js$/.test(name)
      ) {
        reportFiles.push(filePath);
      }
    }
  }

  for (const filePath of reportFiles) {
    const text = fs.readFileSync(filePath, 'utf8');
    if (/sdeImporter|sdeInventoryImporter|importFromPath|\.zip/i.test(text)) {
      throw new Error(`Report runtime file references SDE import/zip path: ${filePath}`);
    }
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
