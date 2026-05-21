const fixture = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');

function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  const repository = new EvidenceRepository(db);

  const first = ingestFixture(repository);
  const second = ingestFixture(repository);
  const original = db.prepare(`
    SELECT killmail_hash, killmail_time, solar_system_id, raw_esi_payload, raw_payload_checksum
    FROM killmails
    WHERE killmail_id = ?
  `).get(1001);
  const changedPayload = {
    ...fixture,
    killmail_time: '2099-01-01T00:00:00Z',
    solar_system_id: 30000002
  };
  const third = ingestFixture(repository, {
    raw: changedPayload,
    hash: 'changed_hash_1001'
  });
  const afterConflict = db.prepare(`
    SELECT killmail_hash, killmail_time, solar_system_id, raw_esi_payload, raw_payload_checksum
    FROM killmails
    WHERE killmail_id = ?
  `).get(1001);
  const conflictWarning = db.prepare(`
    SELECT warning_type, message
    FROM data_quality_warnings
    WHERE killmail_id = ? AND warning_type = ?
  `).get(1001, 'KILLMAIL_PAYLOAD_CHECKSUM_MISMATCH');

  assert(first.eventsWritten === 7, 'first run should write 7 activity events');
  assert(second.eventsWritten === 0, 'second run should write no duplicate activity events');
  assert(second.killmailsWritten === 0, 'second run should not count rediscovered killmail as newly written');
  assert(third.killmailsWritten === 0, 'changed rediscovery should not count as newly written');
  assert(repository.count('killmails') === 1, 'killmail should remain unique');
  assert(repository.count('activity_events') === 7, 'activity events should remain unique');
  assert(repository.count('ingestion_audits') === 3, 'each run should keep its own audit trail');
  assert(afterConflict.killmail_hash === original.killmail_hash, 'rediscovery must not replace original killmail hash');
  assert(afterConflict.killmail_time === original.killmail_time, 'rediscovery must not replace original killmail time');
  assert(afterConflict.solar_system_id === original.solar_system_id, 'rediscovery must not replace original system ID');
  assert(afterConflict.raw_esi_payload === original.raw_esi_payload, 'rediscovery must not replace raw ESI payload');
  assert(afterConflict.raw_payload_checksum === original.raw_payload_checksum, 'rediscovery must not replace payload checksum');
  assert(conflictWarning, 'changed rediscovery should write a checksum mismatch warning');

  closeDatabase(db);
  console.log('idempotent re-run verified');
}

function ingestFixture(repository, options = {}) {
  const run = repository.createFetchRun({
    trigger: 'fixture_test',
    watchType: 'manual_scan',
    watchId: 'fixture'
  });
  const raw = options.raw || fixture;
  const hash = options.hash || 'fixture_hash_1001';

  const pkg = evidencePackageFromExpandedKillmails({
    killmails: [{ raw, hash }],
    run: {
      run_id: run.run_id,
      source_type: 'fixture',
      source_id: 'killmail-1001',
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

  return result;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
