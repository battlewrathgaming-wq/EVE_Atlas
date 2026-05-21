const path = require('node:path');
const fixture = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');

function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  const repository = new EvidenceRepository(db);
  const run = repository.createFetchRun({
    trigger: 'fixture_test',
    watchType: 'manual_scan',
    watchId: 'fixture'
  });

  const pkg = evidencePackageFromExpandedKillmails({
    killmails: [{ raw: fixture, hash: 'fixture_hash_1001' }],
    run: {
      run_id: run.run_id,
      source_type: 'fixture',
      source_id: path.basename(__filename),
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

  assert(repository.count('killmails') === 1, 'expected one stored killmail');
  assert(repository.count('activity_events') === 7, 'expected 7 activity events after same-corp/alliance attacker dedupe');
  assert(repository.count('entities') === 7, 'expected 7 unique entities');
  assert(repository.count('ingestion_audits') === 1, 'expected one audit row');

  const fetchRun = db.prepare('SELECT * FROM fetch_runs WHERE run_id = ?').get(run.run_id);
  assert(fetchRun.activity_events_written === 7, 'fetch run should report 7 written activity events');

  closeDatabase(db);
  console.log('fixture ingestion verified');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
