const fs = require('node:fs');
const {
  prepareInput,
  checksumFileOrDirectory,
  listJsonlFiles,
  numberFrom,
  stringFrom
} = require('./sdeImporter');
const { readJsonLines } = require('./jsonl');

class SdeInventoryImporter {
  constructor(db) {
    this.db = db;
    ensureInventoryScratchTables(db);
    this.statements = null;
  }

  prepareStatements() {
    this.statements = {
      upsertCategory: this.db.prepare(`
        INSERT INTO temp_sde_inventory_categories (category_id, category_name, published)
        VALUES (?, ?, ?)
        ON CONFLICT(category_id) DO UPDATE SET
          category_name = excluded.category_name,
          published = excluded.published
      `),
      upsertGroup: this.db.prepare(`
        INSERT INTO temp_sde_inventory_groups (group_id, group_name, category_id, published)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(group_id) DO UPDATE SET
          group_name = excluded.group_name,
          category_id = excluded.category_id,
          published = excluded.published
      `),
      upsertType: this.db.prepare(`
        INSERT INTO temp_sde_inventory_type_metadata (
          type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(type_id) DO UPDATE SET
          type_name = excluded.type_name,
          group_id = excluded.group_id,
          group_name = excluded.group_name,
          category_id = excluded.category_id,
          category_name = excluded.category_name,
          last_fetched = excluded.last_fetched
      `),
      insertManifest: this.db.prepare(`
        INSERT INTO sde_inventory_imports (
          build_number, variant, source_url, etag, last_modified, imported_at, file_checksum,
          categories_count, groups_count, types_count, type_metadata_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
    };
  }

  async importFromPath(inputPath, options = {}) {
    dropStagingTables(this.db);
    createStagingTables(this.db);
    this.prepareStatements();
    const cleanup = {
      temp_tables_created: [
        'temp_sde_inventory_categories',
        'temp_sde_inventory_groups',
        'temp_sde_inventory_type_metadata'
      ],
      temp_tables_dropped: false,
      extracted_source_removed: false,
      partial_stage_left_visible: false
    };
    let pendingError = null;
    const source = await prepareInput(inputPath, options);
    cleanup.extracted_source_path = source.cleanupPath || null;
    const checksum = checksumFileOrDirectory(inputPath);
    const files = classifyInventoryFiles(listJsonlFiles(source.directory));
    const counts = {
      categories: 0,
      groups: 0,
      types: 0,
      typeMetadata: 0
    };

    try {
      for (const filePath of files.categories) {
        counts.categories += await this.importCategories(filePath);
      }

      for (const filePath of files.groups) {
        counts.groups += await this.importGroups(filePath);
      }

      for (const filePath of files.types) {
        const result = await this.importTypes(filePath, options);
        counts.types += result.types;
        counts.typeMetadata += result.typeMetadata;
      }

      const stagedCounts = this.stagedInventoryCounts(counts.types);
      validateStagedInventoryComplete(stagedCounts);
      if (options.failAt === 'after_stage_before_promotion') {
        const error = new Error('SDE inventory import interrupted before promotion');
        error.code = 'SDE_INVENTORY_IMPORT_INTERRUPTED_BEFORE_PROMOTION';
        throw error;
      }

      this.promoteStagedInventory({
        buildNumber: options.buildNumber || buildNumberFromFilename(inputPath),
        sourceUrl: options.sourceUrl || inputPath,
        etag: options.etag || null,
        lastModified: options.lastModified || null,
        fileChecksum: checksum,
        counts: stagedCounts,
        failAt: options.failAt
      });

      return {
        ...stagedCounts,
        file_checksum: checksum,
        files,
        staged: true,
        promotion: {
          transactional: true,
          provenance_written_after_complete_promotion: true,
          staged_completeness_validated: true
        },
        cleanup
      };
    } catch (error) {
      pendingError = error;
      throw error;
    } finally {
      if (source.cleanupPath) {
        fs.rmSync(source.cleanupPath, { recursive: true, force: true });
        cleanup.extracted_source_removed = true;
      }
      dropStagingTables(this.db);
      cleanup.temp_tables_dropped = stagingTablesRemoved(this.db);
      if (pendingError) {
        pendingError.cleanup = cleanup;
      }
    }
  }

  async importCategories(filePath) {
    let count = 0;
    await readJsonLines(filePath, ({ key, value }) => {
      const categoryId = numberFrom(value, ['categoryID', 'category_id', 'id']) ?? Number(key);
      const categoryName = stringFrom(value, ['name', 'categoryName', 'category_name']);
      if (!categoryId || !categoryName) {
        return;
      }

      this.statements.upsertCategory.run(categoryId, categoryName, boolToInt(value?.published));
      count += 1;
    });
    return count;
  }

  async importGroups(filePath) {
    let count = 0;
    await readJsonLines(filePath, ({ key, value }) => {
      const groupId = numberFrom(value, ['groupID', 'group_id', 'id']) ?? Number(key);
      const groupName = stringFrom(value, ['name', 'groupName', 'group_name']);
      const categoryId = numberFrom(value, ['categoryID', 'category_id']);
      if (!groupId || !groupName) {
        return;
      }

      this.statements.upsertGroup.run(groupId, groupName, categoryId || null, boolToInt(value?.published));
      count += 1;
    });
    return count;
  }

  async importTypes(filePath, options = {}) {
    let types = 0;
    let typeMetadata = 0;
    const now = new Date().toISOString();
    const publishedOnly = options.publishedOnly !== false;

    await readJsonLines(filePath, ({ key, value }) => {
      const typeId = numberFrom(value, ['typeID', 'type_id', 'id']) ?? Number(key);
      const typeName = stringFrom(value, ['name', 'typeName', 'type_name']);
      const groupId = numberFrom(value, ['groupID', 'group_id']);
      const published = value?.published === true;
      types += 1;

      if (!typeId || !typeName || !groupId || (publishedOnly && !published)) {
        return;
      }

      const group = this.db.prepare(`
        SELECT sig.group_name, sig.category_id, sic.category_name
        FROM temp_sde_inventory_groups sig
        LEFT JOIN temp_sde_inventory_categories sic ON sic.category_id = sig.category_id
        WHERE sig.group_id = ?
      `).get(groupId);

      this.statements.upsertType.run(
        typeId,
        typeName,
        groupId,
        group?.group_name || null,
        group?.category_id || null,
        group?.category_name || null,
        now
      );
      typeMetadata += 1;
    });

    return { types, typeMetadata };
  }

  stagedInventoryCounts(typesScanned = 0) {
    return {
      categories: count(this.db, 'temp_sde_inventory_categories'),
      groups: count(this.db, 'temp_sde_inventory_groups'),
      types: typesScanned,
      typeMetadata: count(this.db, 'temp_sde_inventory_type_metadata')
    };
  }

  promoteStagedInventory(options) {
    runTransaction(this.db, () => {
      this.db.exec(`
        DELETE FROM type_metadata;
        DELETE FROM sde_inventory_groups;
        DELETE FROM sde_inventory_categories;
      `);
      this.db.exec(`
        INSERT INTO sde_inventory_categories (category_id, category_name, published)
        SELECT category_id, category_name, published FROM temp_sde_inventory_categories;

        INSERT INTO sde_inventory_groups (group_id, group_name, category_id, published)
        SELECT group_id, group_name, category_id, published FROM temp_sde_inventory_groups;

        INSERT INTO type_metadata (
          type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
        )
        SELECT type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
        FROM temp_sde_inventory_type_metadata;
      `);

      if (options.failAt === 'after_promotion_before_provenance') {
        const error = new Error('SDE inventory import interrupted before provenance');
        error.code = 'SDE_INVENTORY_IMPORT_INTERRUPTED_BEFORE_PROVENANCE';
        throw error;
      }

      this.insertManifest(options);
    });
  }

  insertManifest({ buildNumber, sourceUrl, etag, lastModified, fileChecksum, counts }) {
    this.statements.insertManifest.run(
      buildNumber || null,
      'jsonl',
      sourceUrl,
      etag || null,
      lastModified || null,
      new Date().toISOString(),
      fileChecksum,
      counts.categories,
      counts.groups,
      counts.types,
      counts.typeMetadata
    );
  }
}

function ensureInventoryScratchTables(db) {
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

function clearInventoryScratchTables(db) {
  db.exec('DELETE FROM sde_inventory_categories; DELETE FROM sde_inventory_groups;');
}

function createStagingTables(db) {
  db.exec(`
    CREATE TEMP TABLE temp_sde_inventory_categories (
      category_id INTEGER PRIMARY KEY,
      category_name TEXT NOT NULL,
      published INTEGER NOT NULL DEFAULT 0
    );

    CREATE TEMP TABLE temp_sde_inventory_groups (
      group_id INTEGER PRIMARY KEY,
      group_name TEXT NOT NULL,
      category_id INTEGER,
      published INTEGER NOT NULL DEFAULT 0
    );

    CREATE TEMP TABLE temp_sde_inventory_type_metadata (
      type_id INTEGER PRIMARY KEY,
      type_name TEXT,
      group_id INTEGER,
      group_name TEXT,
      category_id INTEGER,
      category_name TEXT,
      last_fetched TEXT
    );
  `);
}

function dropStagingTables(db) {
  db.exec(`
    DROP TABLE IF EXISTS temp_sde_inventory_type_metadata;
    DROP TABLE IF EXISTS temp_sde_inventory_groups;
    DROP TABLE IF EXISTS temp_sde_inventory_categories;
  `);
}

function stagingTablesRemoved(db) {
  return [
    'temp_sde_inventory_categories',
    'temp_sde_inventory_groups',
    'temp_sde_inventory_type_metadata'
  ].every((tableName) => !tempTableExists(db, tableName));
}

function tempTableExists(db, tableName) {
  return Boolean(db.prepare(`
    SELECT name
    FROM sqlite_temp_master
    WHERE type = 'table' AND name = ?
  `).get(tableName));
}

function validateStagedInventoryComplete(counts) {
  const missing = [];
  if (!counts || counts.categories <= 0) {
    missing.push('categories');
  }
  if (!counts || counts.groups <= 0) {
    missing.push('groups');
  }
  if (!counts || counts.types <= 0) {
    missing.push('types');
  }
  if (!counts || counts.typeMetadata <= 0) {
    missing.push('type_metadata');
  }
  if (!missing.length) {
    return;
  }
  const error = new Error(`SDE inventory staged import incomplete: ${missing.join(', ')}`);
  error.code = 'SDE_INVENTORY_STAGE_INCOMPLETE';
  error.missing = missing;
  throw error;
}

function runTransaction(db, callback) {
  db.exec('BEGIN');
  try {
    const result = callback();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function classifyInventoryFiles(files) {
  return {
    categories: files.filter((filePath) => /(^|[\\/])categories\.jsonl$/i.test(filePath)),
    groups: files.filter((filePath) => /(^|[\\/])groups\.jsonl$/i.test(filePath)),
    types: files.filter((filePath) => /(^|[\\/])types\.jsonl$/i.test(filePath))
  };
}

function buildNumberFromFilename(filePath) {
  const match = String(filePath).match(/static-data-(\d+)-jsonl/i);
  return match ? match[1] : null;
}

function boolToInt(value) {
  return value === true ? 1 : 0;
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

module.exports = {
  SdeInventoryImporter,
  classifyInventoryFiles
};
