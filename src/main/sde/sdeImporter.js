const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const childProcess = require('node:child_process');
const { readJsonLines } = require('./jsonl');
const { makeAuraTempDir } = require('../util/tempPaths');

class SdeTopologyImporter {
  constructor(db) {
    this.db = db;
    ensureImportScratchTables(this.db);
    this.prepareStatements();
  }

  prepareStatements() {
    this.statements = {
      upsertRegion: this.db.prepare(`
        INSERT INTO regions (region_id, region_name, source_sde_build, imported_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(region_id) DO UPDATE SET region_name = excluded.region_name
      `),
      upsertScratchRegion: this.db.prepare(`
        INSERT INTO sde_import_regions (region_id, region_name)
        VALUES (?, ?)
        ON CONFLICT(region_id) DO UPDATE SET region_name = excluded.region_name
      `),
      upsertConstellation: this.db.prepare(`
        INSERT INTO constellations (
          constellation_id, constellation_name, region_id, region_name, source_sde_build, imported_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(constellation_id) DO UPDATE SET
          constellation_name = excluded.constellation_name,
          region_id = excluded.region_id,
          region_name = excluded.region_name
      `),
      upsertScratchConstellation: this.db.prepare(`
        INSERT INTO sde_import_constellations (constellation_id, constellation_name, region_id)
        VALUES (?, ?, ?)
        ON CONFLICT(constellation_id) DO UPDATE SET
          constellation_name = excluded.constellation_name,
          region_id = excluded.region_id
      `),
      upsertSystem: this.db.prepare(`
        INSERT INTO solar_systems (
          solar_system_id, solar_system_name, constellation_id,
          constellation_name, region_id, region_name, security_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(solar_system_id) DO UPDATE SET
          solar_system_name = excluded.solar_system_name,
          constellation_id = excluded.constellation_id,
          constellation_name = excluded.constellation_name,
          region_id = excluded.region_id,
          region_name = excluded.region_name,
          security_status = excluded.security_status
      `),
      upsertAdjacency: this.db.prepare(`
        INSERT OR IGNORE INTO system_adjacency (from_system_id, to_system_id, connection_type)
        VALUES (?, ?, ?)
      `),
      insertImport: this.db.prepare(`
        INSERT INTO sde_imports (
          build_number, variant, source_url, etag, last_modified, imported_at,
          file_checksum, latest_metadata_checksum, changes_metadata_checksum,
          systems_count, constellations_count, regions_count, adjacency_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
    };
  }

  async importFromPath(inputPath, options = {}) {
    clearImportScratchTables(this.db);

    const source = await prepareInput(inputPath, options);
    const checksum = checksumFileOrDirectory(inputPath);
    const files = listJsonlFiles(source.directory);
    const classified = classifyFiles(files);
    const counts = {
      systems: 0,
      constellations: 0,
      regions: 0,
      adjacency: 0
    };

    try {
      for (const filePath of classified.regions) {
        counts.regions += await this.importRegions(filePath, options);
      }

      for (const filePath of classified.constellations) {
        counts.constellations += await this.importConstellations(filePath, options);
      }

      for (const filePath of classified.systems) {
        counts.systems += await this.importSystems(filePath);
      }

      for (const filePath of classified.stargates) {
        counts.adjacency += await this.importStargates(filePath);
      }

      this.backfillSystemNames();
      this.insertManifest({
        buildNumber: options.buildNumber || null,
        variant: 'jsonl',
        sourceUrl: options.sourceUrl || inputPath,
        etag: options.etag || null,
        lastModified: options.lastModified || null,
        fileChecksum: checksum,
        latestMetadataChecksum: options.latestMetadataChecksum || null,
        changesMetadataChecksum: options.changesMetadataChecksum || null,
        counts
      });

      return {
        ...counts,
        file_checksum: checksum,
        files: classified
      };
    } finally {
      if (source.cleanupPath) {
        fs.rmSync(source.cleanupPath, { recursive: true, force: true });
      }
    }
  }

  async importRegions(filePath, options = {}) {
    let count = 0;
    const importedAt = new Date().toISOString();
    await readJsonLines(filePath, ({ key, value }) => {
      const regionId = numberFrom(value, ['regionID', 'region_id', 'id']) ?? Number(key);
      const regionName = stringFrom(value, ['name', 'regionName', 'region_name']);
      if (!regionId || !regionName) {
        return;
      }

      this.statements.upsertRegion.run(regionId, regionName, options.buildNumber || buildNumberFromFilename(options.sourceUrl || '') || null, importedAt);
      this.statements.upsertScratchRegion.run(regionId, regionName);
      count += 1;
    });
    return count;
  }

  async importConstellations(filePath, options = {}) {
    let count = 0;
    const importedAt = new Date().toISOString();
    await readJsonLines(filePath, ({ key, value }) => {
      const constellationId = numberFrom(value, ['constellationID', 'constellation_id', 'id']) ?? Number(key);
      const constellationName = stringFrom(value, ['name', 'constellationName', 'constellation_name']);
      const regionId = numberFrom(value, ['regionID', 'region_id']);
      if (!constellationId || !constellationName) {
        return;
      }

      const region = regionId
        ? this.db.prepare('SELECT region_name FROM regions WHERE region_id = ?').get(regionId)
        : null;
      this.statements.upsertConstellation.run(
        constellationId,
        constellationName,
        regionId || null,
        region?.region_name || null,
        options.buildNumber || buildNumberFromFilename(options.sourceUrl || '') || null,
        importedAt
      );
      this.statements.upsertScratchConstellation.run(constellationId, constellationName, regionId || null);
      count += 1;
    });
    return count;
  }

  async importSystems(filePath) {
    let count = 0;
    await readJsonLines(filePath, ({ key, value }) => {
      const systemId = numberFrom(value, ['solarSystemID', 'solar_system_id', 'systemID', 'id']) ?? Number(key);
      const systemName = stringFrom(value, ['name', 'solarSystemName', 'solar_system_name']);
      const constellationId = numberFrom(value, ['constellationID', 'constellation_id']);
      const directRegionId = numberFrom(value, ['regionID', 'region_id']);
      const securityStatus = numberFrom(value, ['security', 'securityStatus', 'security_status']);
      if (!systemId || !systemName) {
        return;
      }

      const constellation = constellationId
        ? this.db.prepare('SELECT constellation_name, region_id FROM sde_import_constellations WHERE constellation_id = ?').get(constellationId)
        : null;
      const regionId = directRegionId || constellation?.region_id || null;
      const region = regionId
        ? this.db.prepare('SELECT region_name FROM sde_import_regions WHERE region_id = ?').get(regionId)
        : null;

      this.statements.upsertSystem.run(
        systemId,
        systemName,
        constellationId || null,
        constellation?.constellation_name || null,
        regionId,
        region?.region_name || null,
        securityStatus
      );
      count += 1;
    });
    return count;
  }

  async importStargates(filePath) {
    let count = 0;
    await readJsonLines(filePath, ({ value }) => {
      const fromSystemId = numberFrom(value, [
        'solarSystemID',
        'solar_system_id',
        'systemID',
        'fromSystemID',
        'from_system_id'
      ]);
      const destination = value?.destination || value?.destinationSystem || value?.target || {};
      const toSystemId = numberFrom(destination, ['solarSystemID', 'solar_system_id', 'systemID'])
        ?? numberFrom(value, ['destinationSolarSystemID', 'destination_solar_system_id', 'toSystemID', 'to_system_id']);

      if (!fromSystemId || !toSystemId || fromSystemId === toSystemId) {
        return;
      }

      const before = this.db.prepare('SELECT COUNT(*) AS count FROM system_adjacency').get().count;
      this.statements.upsertAdjacency.run(fromSystemId, toSystemId, 'stargate');
      this.statements.upsertAdjacency.run(toSystemId, fromSystemId, 'stargate');
      const after = this.db.prepare('SELECT COUNT(*) AS count FROM system_adjacency').get().count;
      count += after - before;
    });
    return count;
  }

  backfillSystemNames() {
    this.db.exec(`
      UPDATE solar_systems
      SET constellation_name = (
        SELECT constellation_name
        FROM sde_import_constellations
        WHERE sde_import_constellations.constellation_id = solar_systems.constellation_id
      )
      WHERE constellation_name IS NULL;

      UPDATE solar_systems
      SET region_id = (
        SELECT region_id
        FROM sde_import_constellations
        WHERE sde_import_constellations.constellation_id = solar_systems.constellation_id
      )
      WHERE region_id IS NULL;

      UPDATE solar_systems
      SET region_name = (
        SELECT region_name
        FROM sde_import_regions
        WHERE sde_import_regions.region_id = solar_systems.region_id
      )
      WHERE region_name IS NULL;
    `);
  }

  insertManifest({ buildNumber, variant, sourceUrl, etag, lastModified, fileChecksum, latestMetadataChecksum, changesMetadataChecksum, counts }) {
    this.statements.insertImport.run(
      buildNumber,
      variant,
      sourceUrl,
      etag,
      lastModified,
      new Date().toISOString(),
      fileChecksum,
      latestMetadataChecksum,
      changesMetadataChecksum,
      counts.systems,
      counts.constellations,
      counts.regions,
      counts.adjacency
    );
  }
}

function ensureImportScratchTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sde_import_regions (
      region_id INTEGER PRIMARY KEY,
      region_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sde_import_constellations (
      constellation_id INTEGER PRIMARY KEY,
      constellation_name TEXT NOT NULL,
      region_id INTEGER
    );
  `);
}

function clearImportScratchTables(db) {
  db.exec('DELETE FROM sde_import_regions; DELETE FROM sde_import_constellations;');
}

async function prepareInput(inputPath, options = {}) {
  const stats = fs.statSync(inputPath);
  if (stats.isDirectory()) {
    return { directory: inputPath, cleanupPath: null };
  }

  if (path.extname(inputPath).toLowerCase() !== '.zip') {
    throw new Error(`SDE input must be a JSONL directory or zip: ${inputPath}`);
  }

  const extractDir = options.tempRoot
    ? fs.mkdtempSync(path.join(options.tempRoot, 'aura-atlas-sde-'))
    : makeAuraTempDir('sde-import');
  extractZip(inputPath, extractDir);
  return { directory: extractDir, cleanupPath: extractDir };
}

function extractZip(zipPath, destination) {
  const command = [
    'Expand-Archive',
    '-LiteralPath',
    powershellQuote(zipPath),
    '-DestinationPath',
    powershellQuote(destination),
    '-Force'
  ].join(' ');
  childProcess.execFileSync('powershell.exe', ['-NoProfile', '-Command', command], { stdio: 'pipe' });
}

function listJsonlFiles(root) {
  const found = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      found.push(...listJsonlFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.jsonl')) {
      found.push(fullPath);
    }
  }
  return found;
}

function classifyFiles(files) {
  return {
    systems: files.filter((filePath) => /mapsolarsystems/i.test(filePath)),
    constellations: files.filter((filePath) => /mapconstellations/i.test(filePath)),
    regions: files.filter((filePath) => /mapregions/i.test(filePath)),
    stargates: files.filter((filePath) => /stargates|mapstargates/i.test(filePath))
  };
}

function checksumFileOrDirectory(inputPath) {
  const stats = fs.statSync(inputPath);
  const hash = crypto.createHash('sha256');
  if (stats.isFile()) {
    hash.update(fs.readFileSync(inputPath));
  } else {
    for (const filePath of listJsonlFiles(inputPath).sort()) {
      hash.update(path.relative(inputPath, filePath));
      hash.update(fs.readFileSync(filePath));
    }
  }
  return hash.digest('hex');
}

function numberFrom(value, keys) {
  for (const key of keys) {
    const candidate = value?.[key];
    if (candidate === null || candidate === undefined) {
      continue;
    }
    const number = Number(candidate);
    if (Number.isFinite(number)) {
      return number;
    }
  }
  return null;
}

function stringFrom(value, keys) {
  for (const key of keys) {
    const candidate = value?.[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
    if (candidate && typeof candidate === 'object') {
      const localized = candidate['en-us'] || candidate.en || candidate.en_US;
      if (typeof localized === 'string' && localized.trim()) {
        return localized.trim();
      }
    }
  }
  return null;
}

function powershellQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildNumberFromFilename(filePath) {
  const match = String(filePath || '').match(/static-data-(\d+)-jsonl/i);
  return match ? match[1] : null;
}

module.exports = {
  SdeTopologyImporter,
  classifyFiles,
  listJsonlFiles,
  prepareInput,
  checksumFileOrDirectory,
  numberFrom,
  stringFrom,
  buildNumberFromFilename
};
