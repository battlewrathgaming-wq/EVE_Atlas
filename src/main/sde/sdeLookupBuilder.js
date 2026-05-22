const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const { SdeTopologyImporter } = require('./sdeImporter');
const { SdeInventoryImporter } = require('./sdeInventoryImporter');
const { auraTempRoot, projectRoot } = require('../util/tempPaths');
const { readJsonLines } = require('./jsonl');

const LATEST_METADATA_URL = 'https://developers.eveonline.com/static-data/tranquility/latest.jsonl';
const LATEST_JSONL_ZIP_URL = 'https://developers.eveonline.com/static-data/eve-online-static-data-latest-jsonl.zip';

async function buildSdeLookupTables(db, options = {}) {
  const startedAt = new Date().toISOString();
  const cacheRoot = path.resolve(options.cacheDir || process.env.AURA_ATLAS_SDE_CACHE_DIR || path.join(auraTempRoot(), 'sde'));
  assertProjectLocalPath(cacheRoot, 'SDE cache directory');
  fs.mkdirSync(cacheRoot, { recursive: true });

  const keepSource = options.keepSource === true || process.env.AURA_ATLAS_KEEP_SDE_SOURCE === '1';
  const deleteProvidedSource = options.deleteSourceAfterImport === true;
  const workDir = fs.mkdtempSync(path.join(cacheRoot, 'lookup-build-'));
  const extractionRoot = path.join(workDir, 'extract');
  fs.mkdirSync(extractionRoot, { recursive: true });

  let sourcePath = options.sourcePath ? path.resolve(options.sourcePath) : null;
  let sourceUrl = options.sourceUrl || null;
  let buildNumber = options.buildNumber || null;
  let etag = options.etag || null;
  let lastModified = options.lastModified || null;
  let latestMetadataChecksum = options.latestMetadataChecksum || null;
  let downloaded = false;
  const download = options.downloadFile || downloadFile;
  const TopologyImporter = options.TopologyImporter || SdeTopologyImporter;
  const InventoryImporter = options.InventoryImporter || SdeInventoryImporter;

  try {
    if (sourcePath) {
      assertProjectLocalPath(sourcePath, 'SDE source path');
      sourceUrl = sourceUrl || sourcePath;
      buildNumber = buildNumber || buildNumberFromFilename(sourcePath);
    } else {
      const latestPath = path.join(workDir, 'latest.jsonl');
      const latest = await download(LATEST_METADATA_URL, latestPath);
      latestMetadataChecksum = latest.checksum;
      buildNumber = buildNumber || await readLatestBuildNumber(latestPath);
      sourceUrl = buildNumber
        ? `https://developers.eveonline.com/static-data/tranquility/eve-online-static-data-${buildNumber}-jsonl.zip`
        : LATEST_JSONL_ZIP_URL;
      sourcePath = path.join(workDir, buildNumber
        ? `eve-online-static-data-${buildNumber}-jsonl.zip`
        : 'eve-online-static-data-latest-jsonl.zip');
      const zipDownload = await download(sourceUrl, sourcePath);
      etag = zipDownload.etag || null;
      lastModified = zipDownload.lastModified || null;
      downloaded = true;
    }

    const topologyImporter = new TopologyImporter(db);
    const topology = await topologyImporter.importFromPath(sourcePath, {
      buildNumber,
      sourceUrl,
      etag,
      lastModified,
      latestMetadataChecksum,
      tempRoot: extractionRoot
    });

    const inventoryImporter = new InventoryImporter(db);
    const inventory = await inventoryImporter.importFromPath(sourcePath, {
      buildNumber,
      sourceUrl,
      etag,
      lastModified,
      tempRoot: extractionRoot
    });

    assertCompleteLookupImport(topology, inventory);

    const result = {
      status: 'sde lookup tables built',
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      source: {
        source_url: sourceUrl,
        source_path: keepSource ? sourcePath : null,
        build_number: buildNumber || null,
        etag,
        last_modified: lastModified,
        downloaded
      },
      cleanup: {
        keep_source: keepSource,
        work_dir: keepSource ? workDir : null,
        source_removed: !keepSource && (downloaded || deleteProvidedSource)
      },
      topology,
      inventory,
      readiness: lookupReadiness(db)
    };

    if (!keepSource) {
      if (deleteProvidedSource && sourcePath && fs.existsSync(sourcePath)) {
        fs.rmSync(sourcePath, { force: true });
      }
      fs.rmSync(workDir, { recursive: true, force: true });
    }

    return result;
  } catch (error) {
    if (!keepSource) {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
    throw error;
  }
}

function assertCompleteLookupImport(topology, inventory) {
  const missing = [];
  if (!topology || topology.regions <= 0) {
    missing.push('regions');
  }
  if (!topology || topology.constellations <= 0) {
    missing.push('constellations');
  }
  if (!topology || topology.systems <= 0) {
    missing.push('solar systems');
  }
  if (!topology || topology.adjacency <= 0) {
    missing.push('system adjacency');
  }
  if (!inventory || inventory.typeMetadata <= 0) {
    missing.push('type metadata');
  }
  if (missing.length) {
    const error = new Error(`SDE lookup build incomplete; missing imported ${missing.join(', ')}`);
    error.code = 'SDE_LOOKUP_BUILD_INCOMPLETE';
    error.missing = missing;
    throw error;
  }
}

async function readLatestBuildNumber(filePath) {
  let buildNumber = null;
  await readJsonLines(filePath, ({ key, value }) => {
    if (String(key) === 'sde') {
      buildNumber = typeof value === 'object'
        ? value.buildNumber || value.build_number || value.version || value.sde
        : value;
    }
  });
  return buildNumber ? String(buildNumber) : null;
}

function lookupReadiness(db) {
  const counts = {
    regions: count(db, 'regions'),
    constellations: count(db, 'constellations'),
    solar_systems: count(db, 'solar_systems'),
    system_adjacency: count(db, 'system_adjacency'),
    type_metadata: count(db, 'type_metadata')
  };
  return {
    counts,
    ready: counts.regions > 0 &&
      counts.constellations > 0 &&
      counts.solar_systems > 0 &&
      counts.system_adjacency > 0 &&
      counts.type_metadata > 0
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function buildNumberFromFilename(filePath) {
  const match = path.basename(filePath).match(/static-data-(\d+)-jsonl/i);
  return match ? match[1] : null;
}

function assertProjectLocalPath(targetPath, label) {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedProject = projectRoot();
  const relative = path.relative(resolvedProject, resolvedTarget);
  const isInsideProject = relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  if (!isInsideProject && process.env.AURA_ATLAS_ALLOW_EXTERNAL_PATHS !== '1') {
    throw new Error(`${label} must stay under ${resolvedProject}; set AURA_ATLAS_ALLOW_EXTERNAL_PATHS=1 to override`);
  }
}

function downloadFile(url, destination, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error(`Too many redirects while downloading ${url}`));
      return;
    }

    const request = https.get(url, {
      headers: {
        'User-Agent': 'AURA Atlas local SDE lookup builder'
      }
    }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        response.resume();
        const location = response.headers.location;
        if (!location) {
          reject(new Error(`Redirect without location for ${url}`));
          return;
        }
        const redirected = new URL(location, url).toString();
        downloadFile(redirected, destination, redirectCount + 1).then(resolve, reject);
        return;
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume();
        reject(new Error(`Download failed for ${url}: HTTP ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(destination);
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          resolve({
            url,
            destination,
            etag: response.headers.etag || null,
            lastModified: response.headers['last-modified'] || null,
            checksum: checksumFile(destination)
          });
        });
      });
      file.on('error', reject);
    });
    request.on('error', reject);
  });
}

function checksumFile(filePath) {
  const crypto = require('node:crypto');
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

module.exports = {
  buildSdeLookupTables,
  lookupReadiness,
  LATEST_METADATA_URL,
  LATEST_JSONL_ZIP_URL
};
