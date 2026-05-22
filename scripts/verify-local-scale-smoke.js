const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { SdeTopologyImporter } = require('../src/main/sde/sdeImporter');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');
const { buildActorReport } = require('../src/main/reports/actorReport');
const { buildCorporationObservationReport } = require('../src/main/reports/corporationObservationReport');
const { buildMetadataStatusReport } = require('../src/main/reports/metadataStatusReport');
const { buildQueueReport } = require('../src/main/reports/queueReport');
const { buildRadiusReport } = require('../src/main/reports/radiusReport');
const { addSystemRadiusWatch, addWatchlistEntity } = require('../src/main/watchlist/watchlistRepository');

async function main() {
  const outputDir = path.join(auraTempRoot(), 'local-scale-smoke');
  fs.mkdirSync(outputDir, { recursive: true });
  const dbPath = path.join(outputDir, 'local-scale-smoke.sqlite');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const db = openDatabase(dbPath);
  migrate(db);

  try {
    await new SdeTopologyImporter(db).importFromPath(path.resolve(__dirname, '..', 'fixtures', 'sde-jsonl'), {
      buildNumber: 'fixture-build',
      sourceUrl: 'fixtures/sde-jsonl'
    });
    const seed = seedSyntheticCorpus(db, {
      killmailCount: 120,
      pendingRefs: 80,
      actorWatches: 3,
      systemWatches: 2
    });

    const timings = {
      actor_report_ms: measure(() => buildActorReport(db, {
        entityType: 'character',
        entityId: 90000002,
        entityName: 'Atlas Scout'
      })),
      corporation_report_ms: measure(() => buildCorporationObservationReport(db, {
        entityType: 'corporation',
        entityId: 98000002,
        entityName: 'Signal Cartel Test'
      })),
      radius_report_ms: measure(() => buildRadiusReport(db, 30000001, {
        radiusJumps: 2,
        maxSystems: 4
      })),
      queue_report_ms: measure(() => buildQueueReport(db, { limit: 20 })),
      metadata_status_ms: measure(() => buildMetadataStatusReport(db))
    };

    const summary = {
      status: 'local scale smoke verified',
      db_path: dbPath,
      generated_at: new Date().toISOString(),
      corpus: {
        killmails: count(db, 'killmails'),
        activity_events: count(db, 'activity_events'),
        entities: count(db, 'entities'),
        discovered_refs: count(db, 'discovered_killmail_refs'),
        actor_watches: count(db, 'watchlist_entities'),
        system_watches: count(db, 'system_watches'),
        fetch_runs: count(db, 'fetch_runs'),
        metadata_runs: count(db, 'metadata_runs')
      },
      requested_corpus: seed,
      timings,
      decision: 'Detached task model remains acceptable; no process isolation is justified by this smoke.'
    };

    assert(summary.corpus.killmails === 120, 'scale smoke should seed 120 killmails');
    assert(summary.corpus.activity_events === 840, 'scale smoke should seed 840 activity events');
    assert(summary.corpus.discovered_refs === 80, 'scale smoke should seed 80 queued refs');
    assert(Object.values(timings).every((entry) => entry.ms < 5000), 'scale smoke reports should complete under 5 seconds each');

    const resultPath = path.join(outputDir, 'local-scale-smoke-result.json');
    fs.writeFileSync(resultPath, `${JSON.stringify(summary, null, 2)}\n`);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    closeDatabase(db);
  }
}

function seedSyntheticCorpus(db, options) {
  const repository = new EvidenceRepository(db);
  const run = repository.createFetchRun({
    trigger: 'fixture_test',
    watchType: 'system_radius',
    watchId: 'local-scale-smoke'
  });
  const systems = [30000001, 30000002, 30000003, 30000004];
  const killmails = [];
  for (let index = 0; index < options.killmailCount; index += 1) {
    const killmailId = 500000 + index;
    killmails.push({
      raw: syntheticKillmail(killmailId, systems[index % systems.length], index),
      hash: `scale_hash_${killmailId}`
    });
  }
  const pkg = evidencePackageFromExpandedKillmails({
    killmails,
    run: {
      run_id: run.run_id,
      source_type: 'system_radius',
      source_id: 'local-scale-smoke',
      started_at: run.started_at
    },
    discoveredBy: {
      type: 'system_radius',
      id: 'local-scale-smoke'
    }
  });
  const persisted = repository.persistEvidencePackage(pkg);
  repository.finalizeFetchRun(run.run_id, {
    discovered_refs: options.killmailCount + options.pendingRefs,
    expanded_new: persisted.killmailsWritten,
    activity_events_written: persisted.eventsWritten,
    api_calls_zkill: 0,
    api_calls_esi: 0
  }, 'success', 'Local scale smoke uses fixture data only; no live API calls.');

  seedRefs(db, options.pendingRefs);
  seedWatches(db, options);
  return options;
}

function syntheticKillmail(killmailId, systemId, index) {
  const clone = JSON.parse(JSON.stringify(fixtureKillmail));
  clone.killmail_id = killmailId;
  clone.killmail_time = new Date(Date.UTC(2026, 4, 1, 20, 0, index)).toISOString();
  clone.solar_system_id = systemId;
  return clone;
}

function seedRefs(db, countToInsert) {
  const statement = db.prepare(`
    INSERT INTO discovered_killmail_refs (
      killmail_id, killmail_hash, discovered_by_type, discovered_by_id,
      source_scope, source_system_id, discovered_at, first_seen_run_id,
      last_seen_run_id, last_seen_at, status, priority, preview_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date().toISOString();
  for (let index = 0; index < countToInsert; index += 1) {
    statement.run(
      700000 + index,
      `queued_hash_${index}`,
      'manual_radius',
      'system:30000001:radius:2',
      'radius',
      30000001 + (index % 4),
      now,
      null,
      null,
      now,
      'pending',
      index,
      JSON.stringify({ attacker_count: 2, victim: { ship_type_id: 587 } })
    );
  }
}

function seedWatches(db, options) {
  for (let index = 0; index < options.actorWatches; index += 1) {
    addWatchlistEntity(db, {
      entityType: 'character',
      entityId: 90000002 + index,
      entityName: `Scale Actor ${index + 1}`,
      lookbackDays: 7,
      maxKillmailsPerRun: 2,
      pollIntervalMinutes: 60,
      notes: 'Local scale smoke fixture'
    });
  }
  for (let index = 0; index < options.systemWatches; index += 1) {
    addSystemRadiusWatch(db, {
      centerSystemId: 30000001 + index,
      radiusJumps: index,
      lookbackSeconds: 86400,
      maxSystems: 4,
      maxExpansions: 2,
      pollIntervalMinutes: 60,
      notes: 'Local scale smoke fixture'
    });
  }
}

function measure(callback) {
  const started = performance.now();
  const text = callback();
  return {
    ms: Math.round((performance.now() - started) * 100) / 100,
    output_chars: String(text || '').length
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
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
