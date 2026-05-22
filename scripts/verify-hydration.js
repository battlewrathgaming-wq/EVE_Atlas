const path = require('node:path');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { SdeTopologyImporter } = require('../src/main/sde/sdeImporter');
const { collectSystemRadiusWatch } = require('../src/main/workers/systemRadiusCollector');
const { buildObservedOperatorsReport } = require('../src/main/reports/operatorReport');
const { hydrateActorReportCandidates, hydrateOperatorReportCandidates } = require('../src/main/metadata/reportHydrator');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  const importer = new SdeTopologyImporter(db);
  await importer.importFromPath(path.resolve(__dirname, '..', 'fixtures', 'sde-jsonl'), {
    buildNumber: 'fixture-build',
    sourceUrl: 'fixtures/sde-jsonl'
  });

  const zkillClient = {
    async discoverRefs() {
      return [
        { killmail_id: 1001, hash: 'fixture_hash_1001' },
        { killmail_id: 1002, hash: 'fixture_hash_1002' }
      ];
    }
  };
  const esiKillmailClient = {
    async expandKillmail(killmailId) {
      return stripNames({
        ...fixtureKillmail,
        killmail_id: killmailId,
        solar_system_id: 30000001,
        killmail_time: `2026-05-01T20:${10 + killmailId - 1001}:00Z`
      });
    }
  };

  const summary = await collectSystemRadiusWatch({
    centerSystemId: 30000001,
    radiusJumps: 0,
    lookbackSeconds: 86400,
    maxSystems: 1,
    maxRefsPerSystem: 2,
    maxExpansions: 2,
    trigger: 'fixture_test',
    watchId: 'hydration-fixture'
  }, { db, zkillClient, esiClient: esiKillmailClient });

  const repository = new EvidenceRepository(db);
  repository.insertApiRequestLog({
    run_id: summary.run_id,
    provider: 'zkill',
    endpoint: 'https://zkillboard.com/api/systemID/30000001/pastSeconds/86400/',
    method: 'GET',
    status_code: 200,
    duration_ms: 1,
    cache_status: 'fixture',
    requested_at: new Date().toISOString()
  });

  const before = buildObservedOperatorsReport(db, 'Atlas Prime');
  assertIncludes(before, '90000002');

  const hydration = await hydrateOperatorReportCandidates(db, 'Atlas Prime', {
    httpClient: fakeHttpClient(),
    topN: 10
  });
  const after = buildObservedOperatorsReport(db, 'Atlas Prime');

  assert(hydration.ids_discovered > 0, 'hydration should discover candidate IDs');
  assert(hydration.requested_from_esi > 0, 'hydration should request unresolved IDs');
  assert(hydration.resolved > 0, 'hydration should resolve fake IDs');
  assert(hydration.entities_upserted > 0, 'hydration should upsert entities');
  assert(hydration.types_upserted === 0, 'hydration should not resolve inventory types through live ESI');
  assert(hydration.activity_events_patched > 0, 'hydration should patch activity event display names');
  assert(count(db, 'metadata_runs') === 1, 'hydration should write metadata runs');
  assert(countMetadataRun(db, hydration.run_id).resolved === hydration.resolved, 'metadata run should keep resolved count');
  assert(countMetadataRun(db, hydration.run_id).api_calls_esi === 1, 'metadata run should count logged ESI calls');
  assert(apiLogRunType(db, hydration.run_id) === 'metadata', 'metadata hydration API logs should use metadata run type');
  assert(count(db, 'fetch_runs') === 1, 'hydration should not add a fetch run');
  assertIncludes(after, 'Atlas Scout');
  assertIncludes(after, 'Signal Cartel Test');
  assertIncludes(after, 'typeID 603 [unresolved]');

  const actorHydration = await hydrateActorReportCandidates(db, {
    entityType: 'character',
    entityId: 90000002,
    entityName: 'Atlas Scout'
  }, {
    httpClient: fakeHttpClient(),
    topN: 10,
    threshold: 1
  });
  assert(actorHydration.ids_discovered > 0, 'actor hydration should discover report-scoped IDs');
  assert(actorHydration.requested_from_esi === 0, 'actor hydration should skip already known report-scoped IDs');
  assert(actorHydration.types_upserted === 0, 'actor hydration should not resolve inventory types through live ESI');
  assert(count(db, 'metadata_runs') === 2, 'actor hydration should write a metadata run');

  closeDatabase(db);
  console.log('report candidate hydration verified');
}

function nameFor(id) {
  const names = {
    90000001: 'Observed Victim',
    90000002: 'Atlas Scout',
    90000003: 'Atlas Wing',
    98000001: 'Victim Logistics',
    98000002: 'Signal Cartel Test',
    99000001: 'Quiet Coalition',
    99000002: 'Observed Operators',
    587: 'Rifter',
    602: 'Kestrel',
    603: 'Merlin'
  };
  return names[id] || `Resolved ${id}`;
}

function stripNames(killmail) {
  const clone = JSON.parse(JSON.stringify(killmail));
  for (const participant of [clone.victim, ...(clone.attackers || [])]) {
    if (!participant) {
      continue;
    }
    delete participant.character_name;
    delete participant.corporation_name;
    delete participant.alliance_name;
    delete participant.ship_type_name;
  }
  return clone;
}

function categoryFor(id) {
  if (id >= 98000000 && id < 99000000) {
    return 'corporation';
  }
  if (id >= 99000000) {
    return 'alliance';
  }
  if (id >= 90000000) {
    return 'character';
  }
  if (id < 100000) {
    return 'inventory_type';
  }
  return null;
}

function fakeHttpClient() {
  return {
    async json(provider, endpoint, options = {}) {
      assert(provider === 'esi', 'metadata hydration should only call ESI');
      const ids = JSON.parse(options.body || '[]');
      for (const typeId of [587, 602, 603]) {
        assert(!ids.includes(typeId), `hydration should not request inventory typeID ${typeId} from live ESI`);
      }
      this.repository.insertApiRequestLog({
        run_id: this.runId,
        run_type: this.runType,
        provider,
        endpoint,
        method: options.method || 'GET',
        status_code: 200,
        duration_ms: 1,
        cache_status: 'fixture',
        requested_at: new Date().toISOString()
      });
      return ids.map((id) => ({
        id,
        name: nameFor(id),
        category: categoryFor(id)
      })).filter((row) => row.category);
    },
    set repository(value) {
      this._repository = value;
    },
    get repository() {
      return this._repository;
    },
    runId: null,
    runType: 'metadata'
  };
}

function assertIncludes(text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`Expected text to include "${expected}"`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function countMetadataRun(db, runId) {
  return db.prepare('SELECT * FROM metadata_runs WHERE run_id = ?').get(runId);
}

function apiLogRunType(db, runId) {
  return db.prepare('SELECT run_type FROM api_request_logs WHERE run_id = ?').get(runId)?.run_type;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
