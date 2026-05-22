const fs = require('node:fs');
const path = require('node:path');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { discoverManualRefs } = require('../src/main/workers/manualDiscoveryWorker');
const { expandManualRefs } = require('../src/main/workers/manualExpansionWorker');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');
const { hydrateExplicitEntityIds } = require('../src/main/metadata/reportHydrator');
const { buildCorpusHealthReportModel } = require('../src/main/reports/corpusHealthReport');
const { buildSdeLookupTables } = require('../src/main/sde/sdeLookupBuilder');
const { auraTempRoot, projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const previous = captureEnv();
  const root = path.join(auraTempRoot(), 'partial-failures');
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });
  process.env.AURA_ATLAS_TEST_TMP = root;
  process.env.AURA_ATLAS_CACHE_DIR = path.join(root, 'cache');
  process.env.AURA_ATLAS_SDE_CACHE_DIR = path.join(root, 'sde');
  process.env.AURA_ATLAS_LIVE_API = '1';

  try {
    await verifyDiscoveryPartialFailure();
    await verifyExpansionPartialFailureAndRetry();
    verifyPersistenceRollbackAfterKillmailInsert();
    await verifyManualExpansionPersistenceFailureState();
    await verifyMetadataHydrationFailure();
    await verifySdeInterruptedImportState(root);
    console.log('partial failure and transaction integrity verified');
  } finally {
    restoreEnv(previous);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function verifyDiscoveryPartialFailure() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedTopology(db);
  const zkillClient = {
    calls: 0,
    async discoverRefs({ targetId }) {
      this.calls += 1;
      if (targetId === 30000002) {
        throw new Error('fixture zKill outage after first system');
      }
      return [
        { killmail_id: 8801, hash: 'hash_8801' },
        { killmail_id: 8802, hash: 'hash_8802' }
      ];
    }
  };

  try {
    const result = await discoverManualRefs({
      scope: 'radius',
      centerSystemId: 30000001,
      radiusJumps: 1,
      lookbackSeconds: 86400,
      maxSystems: 2,
      maxRefsPerSystem: 2,
      trigger: 'fixture_test'
    }, { db, zkillClient });

    assert(result.queued_refs_written === 2, 'partial zKill discovery should queue refs from successful systems');
    assert(result.warnings.some((message) => message.includes('fixture zKill outage')), 'partial zKill discovery should include failed-system warning');
    assert(count(db, 'discovered_killmail_refs') === 2, 'partial zKill discovery should leave queued refs reviewable');
    assert(count(db, 'killmails') === 0, 'discovery-only partial failure should not create killmails');
    assert(count(db, 'activity_events') === 0, 'discovery-only partial failure should not create activity events');
    const run = latestFetchRun(db);
    assert(run.status === 'success', 'partial discovery with scoped warning should finalize the run');
    assert(String(run.error_summary || '').includes('fixture zKill outage'), 'partial discovery warning should be visible in run summary');
  } finally {
    closeDatabase(db);
  }
}

async function verifyExpansionPartialFailureAndRetry() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedTopology(db);
  seedQueue(db, [
    { killmail_id: 8801, hash: 'hash_8801' },
    { killmail_id: 8802, hash: 'hash_8802' }
  ]);

  try {
    const first = await expandManualRefs({
      discoveredByType: 'manual_actor',
      discoveredById: 'character:90000002',
      maxExpansions: 2,
      trigger: 'fixture_test'
    }, {
      db,
      esiClient: {
        async expandKillmail(killmailId, hash) {
          if (killmailId === 8802) {
            throw new Error('fixture ESI expansion failed for 8802');
          }
          return expandedKillmail(killmailId, hash);
        }
      }
    });

    assert(first.new_esi_expansions === 1, 'first expansion should store one successful killmail');
    assert(first.failed_expansions === 1, 'first expansion should record one failed expansion');
    assert(count(db, 'killmails') === 1, 'first expansion should persist one killmail');
    assert(queueStatus(db, 8801) === 'expanded', 'successful ref should be marked expanded');
    assert(queueStatus(db, 8802) === 'failed', 'failed ref should remain reviewable as failed');

    const second = await expandManualRefs({
      discoveredByType: 'manual_actor',
      discoveredById: 'character:90000002',
      maxExpansions: 2,
      trigger: 'fixture_test'
    }, {
      db,
      esiClient: {
        async expandKillmail(killmailId, hash) {
          return expandedKillmail(killmailId, hash);
        }
      }
    });

    assert(second.new_esi_expansions === 1, 'retry should expand the previously failed ref only');
    assert(count(db, 'killmails') === 2, 'retry should result in two stored killmails');
    assert(queueStatus(db, 8802) === 'expanded', 'retry should mark failed ref expanded after success');
    assert(duplicateEventKeys(db) === 0, 'retry should not create duplicate activity event keys');
  } finally {
    closeDatabase(db);
  }
}

function verifyPersistenceRollbackAfterKillmailInsert() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedTopology(db);

  class FailingRepository extends EvidenceRepository {
    upsertActivityEvent(event) {
      if (event.event_key.includes(':character:')) {
        throw new Error('fixture activity event persistence failed');
      }
      return super.upsertActivityEvent(event);
    }
  }

  const repository = new FailingRepository(db);
  const run = repository.createFetchRun({
    runId: 'run_persist_failure',
    trigger: 'fixture_test',
    watchType: 'manual_expand',
    watchId: 'fixture'
  });
  const pkg = evidencePackageFromExpandedKillmails({
    killmails: [{ raw: expandedKillmail(8810, 'hash_8810'), hash: 'hash_8810' }],
    run: {
      run_id: run.run_id,
      source_type: 'fixture',
      source_id: 'persistence',
      started_at: run.started_at
    },
    discoveredBy: {
      type: 'fixture',
      id: 8810
    }
  });

  try {
    assertThrows(
      () => repository.persistEvidencePackage(pkg),
      /fixture activity event persistence failed/,
      'activity event failure should throw'
    );
    assert(count(db, 'killmails') === 0, 'failed activity event persistence should roll back raw killmail insert');
    assert(count(db, 'activity_events') === 0, 'failed activity event persistence should roll back partial events');
    assert(count(db, 'ingestion_audits') === 0, 'failed persistence should not leave audit rows');
  } finally {
    closeDatabase(db);
  }
}

async function verifyManualExpansionPersistenceFailureState() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedTopology(db);
  seedQueue(db, [{ killmail_id: 8820, hash: 'hash_8820' }]);

  class FailingRepository extends EvidenceRepository {
    upsertActivityEvent(event) {
      if (event.event_key.includes(':character:')) {
        throw new Error('fixture persistence interruption during expansion');
      }
      return super.upsertActivityEvent(event);
    }
  }
  const repository = new FailingRepository(db);

  try {
    await assertRejects(
      () => expandManualRefs({
        discoveredByType: 'manual_actor',
        discoveredById: 'character:90000002',
        maxExpansions: 1,
        trigger: 'fixture_test'
      }, {
        db,
        repository,
        esiClient: {
          async expandKillmail(killmailId, hash) {
            return expandedKillmail(killmailId, hash);
          }
        }
      }),
      /fixture persistence interruption during expansion/,
      'manual expansion persistence interruption should reject'
    );

    assert(count(db, 'killmails') === 0, 'manual expansion persistence failure should not leave raw killmail');
    assert(count(db, 'activity_events') === 0, 'manual expansion persistence failure should not leave activity events');
    assert(queueStatus(db, 8820) === 'pending', 'failed persistence should leave queued ref pending for review/retry');
    assert(queueSelectedAt(db, 8820), 'failed persistence should preserve selected timestamp for review');
    const run = latestFetchRun(db);
    assert(run.status === 'failed', 'failed persistence should finalize fetch run as failed');
    assert(String(run.error_summary || '').includes('fixture persistence interruption'), 'failed fetch run should carry error summary');

    await expandManualRefs({
      discoveredByType: 'manual_actor',
      discoveredById: 'character:90000002',
      maxExpansions: 1,
      trigger: 'fixture_test'
    }, {
      db,
      esiClient: {
        async expandKillmail(killmailId, hash) {
          return expandedKillmail(killmailId, hash);
        }
      }
    });
    assert(count(db, 'killmails') === 1, 'retry after persistence failure should succeed cleanly');
    assert(duplicateEventKeys(db) === 0, 'retry after persistence failure should not duplicate events');
  } finally {
    closeDatabase(db);
  }
}

async function verifyMetadataHydrationFailure() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedTopology(db);

  try {
    await assertRejects(
      () => hydrateExplicitEntityIds(db, {
        entityIds: [90000001, 90000002],
        targetType: 'fixture',
        targetId: 'partial-metadata'
      }, {
        chunkSize: 1,
        esiClient: {
          calls: 0,
          async resolveNames(ids) {
            this.calls += 1;
            if (this.calls === 2) {
              throw new Error('fixture metadata resolution failed after partial chunk');
            }
            return ids.map((id) => ({ id, name: `Resolved ${id}`, category: 'character' }));
          }
        }
      }),
      /fixture metadata resolution failed/,
      'metadata hydration should reject when a later chunk fails'
    );

    assert(count(db, 'entities') === 0, 'failed chunked metadata hydration should not upsert partial entity labels');
    const run = latestMetadataRun(db);
    assert(run.status === 'failed', 'metadata run should finalize as failed');
    assert(String(run.error_summary || '').includes('fixture metadata resolution failed'), 'metadata failure should carry error summary');
  } finally {
    closeDatabase(db);
  }
}

async function verifySdeInterruptedImportState(root) {
  const db = openDatabase(':memory:');
  migrate(db);
  const sourcePath = createFixtureSourceDirectory(path.join(root, 'sde-interrupt-source'));
  const cacheDir = path.join(root, 'sde-interrupt-cache');

  class FailingInventoryImporter {
    importFromPath() {
      throw new Error('fixture inventory import interrupted');
    }
  }

  try {
    await assertRejects(
      () => buildSdeLookupTables(db, {
        sourcePath,
        sourceUrl: 'fixture://sde-interrupt',
        buildNumber: 'fixture-build',
        cacheDir,
        InventoryImporter: FailingInventoryImporter
      }),
      /fixture inventory import interrupted/,
      'SDE inventory interruption should reject'
    );
    assert(count(db, 'regions') > 0, 'interrupted SDE build should leave imported topology reviewable');
    assert(count(db, 'type_metadata') === 0, 'interrupted SDE build should not claim inventory metadata');
    const health = buildCorpusHealthReportModel(db);
    assert(health.integrity.some((row) => row.check === 'unresolved ship type labels'), 'corpus health should remain able to surface local warning state');
  } finally {
    closeDatabase(db);
  }
}

function seedTopology(db) {
  db.prepare(`
    INSERT INTO regions (region_id, region_name)
    VALUES (?, ?)
  `).run(10000001, 'Test Region');
  db.prepare(`
    INSERT INTO constellations (constellation_id, constellation_name, region_id, region_name)
    VALUES (?, ?, ?, ?)
  `).run(20000001, 'Test Constellation', 10000001, 'Test Region');
  for (const [systemId, systemName] of [
    [30000001, 'Atlas Prime'],
    [30000002, 'Atlas Second']
  ]) {
    db.prepare(`
      INSERT INTO solar_systems (
        solar_system_id, solar_system_name, constellation_id, constellation_name,
        region_id, region_name, security_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(systemId, systemName, 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
  }
  db.prepare(`
    INSERT INTO system_adjacency (from_system_id, to_system_id, connection_type)
    VALUES (?, ?, ?), (?, ?, ?)
  `).run(30000001, 30000002, 'stargate', 30000002, 30000001, 'stargate');
}

function seedQueue(db, refs) {
  const repository = new EvidenceRepository(db);
  repository.upsertDiscoveredKillmailRefs(refs.map((ref) => ({
    killmail_id: ref.killmail_id,
    hash: ref.hash,
    discovered_at: '2026-05-01T20:00:00Z'
  })), {
    runId: 'run_seed_queue',
    discoveredByType: 'manual_actor',
    discoveredById: 'character:90000002',
    sourceActorType: 'character',
    sourceActorId: 90000002,
    sourceScope: 'character:90000002'
  });
}

function expandedKillmail(killmailId, hash) {
  const clone = JSON.parse(JSON.stringify(fixtureKillmail));
  clone.killmail_id = killmailId;
  clone.killmail_time = `2026-05-01T20:${String(killmailId % 60).padStart(2, '0')}:00Z`;
  clone.solar_system_id = 30000001;
  clone.victim.character_id = 90000001;
  clone.victim.corporation_id = 98000001;
  clone.victim.alliance_id = 99000001;
  clone.victim.ship_type_id = 603;
  clone.attackers = (clone.attackers || []).slice(0, 2).map((attacker, index) => ({
    ...attacker,
    character_id: 90000002 + index,
    corporation_id: 98000002,
    alliance_id: 99000002,
    ship_type_id: 587,
    final_blow: index === 0
  }));
  clone.__fixture_hash = hash;
  return clone;
}

function createFixtureSourceDirectory(targetDir) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
  const fixtures = path.join(projectRoot(), 'fixtures', 'sde-jsonl');
  for (const fileName of fs.readdirSync(fixtures)) {
    fs.copyFileSync(path.join(fixtures, fileName), path.join(targetDir, fileName));
  }
  return targetDir;
}

function latestFetchRun(db) {
  return db.prepare(`
    SELECT *
    FROM fetch_runs
    ORDER BY rowid DESC
    LIMIT 1
  `).get();
}

function latestMetadataRun(db) {
  return db.prepare(`
    SELECT *
    FROM metadata_runs
    ORDER BY rowid DESC
    LIMIT 1
  `).get();
}

function queueStatus(db, killmailId) {
  return db.prepare(`
    SELECT status
    FROM discovered_killmail_refs
    WHERE killmail_id = ?
  `).get(killmailId)?.status;
}

function queueSelectedAt(db, killmailId) {
  return db.prepare(`
    SELECT selected_for_expansion_at
    FROM discovered_killmail_refs
    WHERE killmail_id = ?
  `).get(killmailId)?.selected_for_expansion_at;
}

function duplicateEventKeys(db) {
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM (
      SELECT event_key
      FROM activity_events
      GROUP BY event_key
      HAVING COUNT(*) > 1
    )
  `).get().count;
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertThrows(fn, expectedPattern, message) {
  try {
    fn();
  } catch (error) {
    if (!expectedPattern || expectedPattern.test(String(error.message || error))) {
      return error;
    }
    throw new Error(`${message}: expected ${expectedPattern}, got ${error.message}`);
  }
  throw new Error(message);
}

async function assertRejects(fn, expectedPattern, message) {
  try {
    await fn();
  } catch (error) {
    if (!expectedPattern || expectedPattern.test(String(error.message || error))) {
      return error;
    }
    throw new Error(`${message}: expected ${expectedPattern}, got ${error.message}`);
  }
  throw new Error(message);
}

function captureEnv() {
  return {
    AURA_ATLAS_TEST_TMP: process.env.AURA_ATLAS_TEST_TMP,
    AURA_ATLAS_CACHE_DIR: process.env.AURA_ATLAS_CACHE_DIR,
    AURA_ATLAS_SDE_CACHE_DIR: process.env.AURA_ATLAS_SDE_CACHE_DIR,
    AURA_ATLAS_LIVE_API: process.env.AURA_ATLAS_LIVE_API
  };
}

function restoreEnv(previous) {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
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
