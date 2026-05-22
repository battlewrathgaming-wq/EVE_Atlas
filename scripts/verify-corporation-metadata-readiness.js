const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { collectActorWatch } = require('../src/main/workers/actorWatchCollector');
const { buildCorporationMetadataReadinessReport } = require('../src/main/reports/corporationMetadataReadinessReport');
const { hydrateCorporationReportCandidates } = require('../src/main/metadata/reportHydrator');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedSystem(db);
  seedCorporation(db);

  await collectActorWatch({
    entityType: 'corporation',
    entityId: 98000002,
    entityName: 'Signal Cartel Test',
    lookbackSeconds: 86400,
    maxRefs: 1,
    maxExpansions: 1,
    trigger: 'fixture_test',
    watchId: 'actor:corporation:98000002'
  }, {
    db,
    zkillClient: {
      async discoverRefs() {
        return [{ killmail_id: 6001, hash: 'fixture_hash_6001' }];
      }
    },
    esiClient: {
      async expandKillmail() {
        return stripNames({
          ...fixtureKillmail,
          killmail_id: 6001,
          killmail_time: '2026-05-01T21:01:00Z',
          solar_system_id: 30000001
        });
      }
    }
  });

  const missing = buildCorporationMetadataReadinessReport(db, {
    entityId: 98000002,
    entityName: 'Signal Cartel Test'
  });
  assertIncludes(missing, 'Missing ship/type labels: 3');
  assertIncludes(missing, 'Missing member pilot labels: 2');
  assertIncludes(missing, 'Missing counterpart corporation labels: 1');
  assertIncludes(missing, 'Missing counterpart alliance labels: 1');
  assertIncludes(missing, 'Ready for readable corporation observation report: no');

  const hydration = await hydrateCorporationReportCandidates(db, {
    entityId: 98000002,
    entityName: 'Signal Cartel Test'
  }, {
    httpClient: fakeHttpClient(),
    topN: 10,
    threshold: 1
  });
  assert(hydration.requested_from_esi > 0, 'corporation hydration should request unresolved report-scoped IDs');
  assert(hydration.resolved > 0, 'corporation hydration should resolve fake IDs');
  assert(hydration.activity_events_patched > 0, 'corporation hydration should patch cached display labels');

  const hydrated = buildCorporationMetadataReadinessReport(db, {
    entityId: 98000002,
    entityName: 'Signal Cartel Test'
  });
  assertIncludes(hydrated, 'Missing ship/type labels: 3');
  assertIncludes(hydrated, 'Missing member pilot labels: 0');
  assertIncludes(hydrated, 'Missing counterpart corporation labels: 0');
  assertIncludes(hydrated, 'Missing counterpart alliance labels: 0');

  seedKnownTypes(db);
  const ready = buildCorporationMetadataReadinessReport(db, {
    entityId: 98000002,
    entityName: 'Signal Cartel Test'
  });
  assertIncludes(ready, 'Missing ship/type labels: 0');
  assertIncludes(ready, 'Missing member pilot labels: 0');
  assertIncludes(ready, 'Missing counterpart corporation labels: 0');
  assertIncludes(ready, 'Missing counterpart alliance labels: 0');
  assertIncludes(ready, 'Ready for readable corporation observation report: yes');

  closeDatabase(db);
  console.log('corporation metadata readiness verified');
}

function seedSystem(db) {
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
}

function seedCorporation(db) {
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run('corporation', 98000002, 'Signal Cartel Test', '2026-05-01T21:01:00Z', '2026-05-01T21:03:00Z');
}

function seedKnownTypes(db) {
  const now = new Date().toISOString();
  const typeStatement = db.prepare(`
    INSERT INTO type_metadata (
      type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  typeStatement.run(587, 'Rifter', 25, 'Frigate', 6, 'Ship', now);
  typeStatement.run(602, 'Kestrel', 25, 'Frigate', 6, 'Ship', now);
  typeStatement.run(603, 'Merlin', 25, 'Frigate', 6, 'Ship', now);
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

function fakeHttpClient() {
  return {
    async json(provider, endpoint, options = {}) {
      assert(provider === 'esi', 'corporation metadata hydration should only call ESI');
      const ids = JSON.parse(options.body || '[]');
      for (const typeId of [587, 602, 603]) {
        assert(!ids.includes(typeId), `corporation hydration should not request inventory typeID ${typeId} from live ESI`);
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

function nameFor(id) {
  return {
    90000001: 'Observed Victim',
    90000002: 'Atlas Scout',
    90000003: 'Atlas Wing',
    98000001: 'Victim Logistics',
    98000002: 'Signal Cartel Test',
    99000001: 'Quiet Coalition',
    99000002: 'Observed Operators'
  }[id] || `Resolved ${id}`;
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
  return null;
}

function assertIncludes(text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`Expected corporation metadata report to include "${expected}"`);
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
