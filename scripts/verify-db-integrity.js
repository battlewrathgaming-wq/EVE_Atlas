const fs = require('node:fs');
const path = require('node:path');
const fixture = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');
const { discoverManualRefs } = require('../src/main/workers/manualDiscoveryWorker');
const { expandManualRefs } = require('../src/main/workers/manualExpansionWorker');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  const repository = new EvidenceRepository(db);
  seedEvidence(repository);

  assertNoDuplicateEventKeys(db);
  assertActivityEventsReferenceKillmails(db);
  assertRawPayloadsParse(db);
  assertRequiredActivityFields(db);
  assertReportsDoNotUseSdeImportRuntime();
  await assertManualDiscoveryBoundary(db);

  closeDatabase(db);
  console.log('database integrity verified');
}

function seedEvidence(repository) {
  const run = repository.createFetchRun({
    trigger: 'fixture_test',
    watchType: 'manual_scan',
    watchId: 'db-integrity-fixture'
  });
  const pkg = evidencePackageFromExpandedKillmails({
    killmails: [{ raw: fixture, hash: 'fixture_hash_1001' }],
    run: {
      run_id: run.run_id,
      source_type: 'fixture',
      source_id: 'verify-db-integrity',
      started_at: run.started_at
    },
    discoveredBy: { type: 'fixture', id: 1001 }
  });
  const result = repository.persistEvidencePackage(pkg);
  repository.finalizeFetchRun(run.run_id, {
    discovered_refs: pkg.run.discovered_refs,
    already_cached: pkg.run.already_cached,
    expanded_new: pkg.run.expanded_count,
    failed_expansions: pkg.run.failed_count,
    activity_events_written: result.eventsWritten,
    api_calls_zkill: 0,
    api_calls_esi: 0
  });
}

function assertNoDuplicateEventKeys(db) {
  const duplicate = db.prepare(`
    SELECT event_key, COUNT(*) AS count
    FROM activity_events
    GROUP BY event_key
    HAVING COUNT(*) > 1
    LIMIT 1
  `).get();
  assert(!duplicate, `duplicate activity event key found: ${duplicate?.event_key}`);
}

function assertActivityEventsReferenceKillmails(db) {
  const orphan = db.prepare(`
    SELECT ae.event_key
    FROM activity_events ae
    LEFT JOIN killmails k ON k.killmail_id = ae.killmail_id
    WHERE k.killmail_id IS NULL
    LIMIT 1
  `).get();
  assert(!orphan, `activity event references missing killmail: ${orphan?.event_key}`);
}

function assertRawPayloadsParse(db) {
  const rows = db.prepare('SELECT killmail_id, raw_esi_payload FROM killmails').all();
  for (const row of rows) {
    try {
      JSON.parse(row.raw_esi_payload);
    } catch (error) {
      throw new Error(`raw ESI payload failed JSON parse for killmail ${row.killmail_id}: ${error.message}`);
    }
  }
}

function assertRequiredActivityFields(db) {
  const bad = db.prepare(`
    SELECT event_key
    FROM activity_events
    WHERE killmail_time IS NULL
       OR role IS NULL
       OR role NOT IN ('attacker', 'victim')
       OR entity_type IS NULL
       OR entity_type NOT IN ('character', 'corporation', 'alliance')
       OR entity_id IS NULL
    LIMIT 1
  `).get();
  assert(!bad, `activity event missing required fields: ${bad?.event_key}`);
}

function assertReportsDoNotUseSdeImportRuntime() {
  const roots = [
    path.resolve(__dirname, '..', 'src', 'main', 'reports'),
    path.resolve(__dirname)
  ];
  const files = [];
  for (const root of roots) {
    for (const name of fs.readdirSync(root)) {
      const filePath = path.join(root, name);
      if (!fs.statSync(filePath).isFile()) {
        continue;
      }
      if (filePath.includes(`${path.sep}reports${path.sep}`) || /^report-.*\.js$/.test(name)) {
        files.push(filePath);
      }
    }
  }

  for (const filePath of files) {
    const text = fs.readFileSync(filePath, 'utf8');
    if (/sdeImporter|sdeInventoryImporter|importFromPath|\.zip/i.test(text)) {
      throw new Error(`Report runtime file references SDE import/zip path: ${filePath}`);
    }
  }
}

async function assertManualDiscoveryBoundary(db) {
  const before = tableCounts(db);
  const zkillClient = {
    async discoverRefs({ includePreview }) {
      assert(includePreview === true, 'manual discovery should request preview metadata');
      return [
        {
          killmail_id: 8001,
          hash: 'fixture_hash_8001',
          preview: {
            killmail_time: '2026-05-01T20:00:00Z',
            victim: { ship_type_id: 587 },
            attacker_count: 1
          }
        }
      ];
    }
  };
  const esiCalls = [];
  const esiClient = {
    async expandKillmail(killmailId) {
      esiCalls.push(killmailId);
      return {
        ...fixture,
        killmail_id: killmailId,
        killmail_time: '2026-05-01T21:00:00Z'
      };
    }
  };

  await discoverManualRefs({
    scope: 'actor',
    entityType: 'character',
    entityId: 90000002,
    lookbackSeconds: 86400,
    maxRefs: 1,
    trigger: 'fixture_test'
  }, { db, zkillClient });

  const afterDiscovery = tableCounts(db);
  assert(esiCalls.length === 0, 'manual discovery should not call ESI');
  assert(afterDiscovery.killmails === before.killmails, 'manual discovery should not write killmails');
  assert(afterDiscovery.activity_events === before.activity_events, 'manual discovery should not write activity events');
  assert(afterDiscovery.discovered_killmail_refs === before.discovered_killmail_refs + 1, 'manual discovery should queue one ref');

  await expandManualRefs({
    discoveredByType: 'manual_actor',
    discoveredById: 'character:90000002',
    maxExpansions: 1,
    trigger: 'fixture_test'
  }, { db, esiClient });

  const afterExpansion = tableCounts(db);
  assertSame(esiCalls, [8001], 'manual expansion should call ESI for selected queued ref');
  assert(afterExpansion.killmails === before.killmails + 1, 'manual expansion should write a killmail');
  assert(afterExpansion.activity_events > before.activity_events, 'manual expansion should write activity events');
}

function tableCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
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
