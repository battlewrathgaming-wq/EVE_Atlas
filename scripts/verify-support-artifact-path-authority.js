const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const previous = captureEnv();
  const root = path.join(projectRoot(), '.tmp', 'support-artifact-path-authority-should-not-exist');
  fs.rmSync(root, { recursive: true, force: true });
  process.env.AURA_ATLAS_TEST_TMP = root;
  process.env.AURA_ATLAS_CACHE_DIR = path.join(root, 'cache');
  process.env.AURA_ATLAS_SDE_CACHE_DIR = path.join(root, 'sde');

  const db = openDatabase(':memory:');
  migrate(db);

  try {
    const beforeRootExists = fs.existsSync(root);
    const beforeCounts = tableCounts(db);
    const preview = await invokeServiceCommand('support.artifact_path_authority.preview', {
      outputDir: 'C:\\renderer-forged-trace-pack',
      destinationPath: 'C:\\renderer-forged-snapshot.sqlite',
      storageRoot: 'C:\\renderer-forged-storage',
      databasePath: 'C:\\renderer-forged-atlas.sqlite'
    }, {
      db,
      databasePath: path.join(root, 'candidate-atlas.sqlite'),
      source: 'renderer'
    });
    const afterCounts = tableCounts(db);
    const afterRootExists = fs.existsSync(root);

    verifyReadOnlyBoundary(preview);
    verifyNoSideEffects({ beforeRootExists, afterRootExists, beforeCounts, afterCounts });
    verifyRendererAntiForgery(preview);
    verifyClassInventory(preview);
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'support artifact path authority verified',
      command: preview.action,
      renderer_payload_ignored: preview.renderer_payload_ignored,
      class_count: preview.summary.total_classes,
      families: preview.summary.by_family,
      cleanup_stages: preview.summary.by_cleanup_stage,
      cache_origins: preview.summary.cache_origins,
      snapshot_postures: preview.summary.snapshot_postures,
      storage_budget_included: preview.summary.storage_budget_included,
      provider_capable: preview.summary.provider_capable,
      boundary: preview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
    restoreEnv(previous);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'support.artifact_path_authority.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should declare read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.creates_files === false, 'preview should not create files');
  assert(preview.creates_directories === false, 'preview should not create directories');
  assert(preview.deletes_files === false, 'preview should not delete files');
  assert(preview.moves_or_copies_storage === false, 'preview should not move/copy storage');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.storage_config_written === false, 'preview should not write storage config');
  assert(preview.enforcement_active === false, 'preview should not activate enforcement');
}

function verifyNoSideEffects({ beforeRootExists, afterRootExists, beforeCounts, afterCounts }) {
  assert(beforeRootExists === false, 'fixture temp root should start missing');
  assert(afterRootExists === false, 'preview must not create the fixture temp root');
  assertSame(afterCounts, beforeCounts, 'preview should not mutate DB table counts');
}

function verifyRendererAntiForgery(preview) {
  const text = JSON.stringify(preview);
  assert(preview.renderer_payload_ignored === true, 'renderer path claims should be reported as ignored');
  assert(!text.includes('renderer-forged'), 'preview should not echo renderer-forged path claims');
}

function verifyClassInventory(preview) {
  assert(preview.summary.total_classes >= 9, 'preview should include representative artifact classes');
  assert(preview.summary.by_family.operational_support >= 4, 'preview should classify operational support');
  assert(preview.summary.by_family.corpus_adjacent_support >= 3, 'preview should classify corpus-adjacent support');

  const rollingSnapshot = classById(preview, 'runtime_snapshot_rolling');
  const retainedSnapshot = classById(preview, 'runtime_snapshot_retained');
  const tracePack = classById(preview, 'operator_debug_trace_pack');
  const logs = classById(preview, 'light_operational_logs');
  const readiness = classById(preview, 'readiness_preflight_reports');
  const runtimeCache = classById(preview, 'runtime_temp_cache');
  const providerCache = classById(preview, 'provider_activity_cache');
  const sdeSource = classById(preview, 'sde_source_import_material');
  const sdeDerived = classById(preview, 'sde_derived_lookup_material');
  const fixtureProof = classById(preview, 'fixture_config_write_proofs');

  assert(rollingSnapshot.snapshot_posture === 'rolling_or_overwritten_recovery_copy', 'rolling snapshot posture should be explicit');
  assert(retainedSnapshot.snapshot_posture === 'retained_recovery_copy', 'retained snapshot posture should be explicit');
  assert(rollingSnapshot.cleanup_stage === 'recovery_cleanup', 'rolling snapshots should be recovery cleanup');
  assert(retainedSnapshot.cleanup_stage === 'recovery_cleanup', 'retained snapshots should be recovery cleanup');
  assert(rollingSnapshot.counts_against_storage_budget === true, 'rolling snapshots should count against storage budget');
  assert(retainedSnapshot.counts_against_storage_budget === true, 'retained snapshots should count against storage budget');

  assert(tracePack.family === 'corpus_adjacent_support', 'trace packs should be corpus-adjacent support');
  assert(tracePack.counts_against_storage_budget === true, 'trace packs should count against storage budget');
  assert(tracePack.external_io_relevance.includes('must not call providers'), 'trace packs should not use External I/O as a back door');
  assert(tracePack.privacy_sensitivity.startsWith('high'), 'trace packs should be sensitive');

  assert(logs.allowed_before_storage_setup === true, 'light operational logs should be allowed before storage setup');
  assert(logs.requires_storage_authority === false, 'light operational logs should not require storage authority');
  assert(readiness.allowed_before_storage_setup === true, 'readiness/preflight readouts should be allowed before storage setup');
  assert(readiness.counts_against_storage_budget === false, 'in-memory readiness/preflight readouts should not count against storage budget');

  assert(runtimeCache.cache_origin === 'operational_runtime', 'runtime cache origin should be operational');
  assert(providerCache.cache_origin === 'provider_activity_derived', 'provider cache origin should be provider/activity derived');
  assert(providerCache.counts_against_storage_budget === true, 'provider/activity cache should count against corpus budget');
  assert(sdeSource.cache_origin === 'sde_source_import', 'SDE source cache origin should be distinct');
  assert(sdeSource.external_io_relevance.includes('SDE download is External I/O'), 'SDE source should disclose External I/O relevance');
  assert(sdeDerived.cache_origin === 'sde_derived_db_lookup', 'SDE derived lookup origin should be distinct');
  assert(fixtureProof.cleanup_stage === 'fixture_only', 'fixture proof artifacts should remain fixture-only');
  assert(fixtureProof.renderer_safety.includes('not renderer eligible'), 'fixture proof artifacts should not be renderer-authoritative');

  for (const entry of preview.classes) {
    assert(entry.read_only === true, `${entry.id} should declare read-only`);
    assert(entry.mutates_state === false, `${entry.id} should declare no mutation`);
    assert(entry.creates_files === false, `${entry.id} should declare no file creation`);
    assert(entry.creates_directories === false, `${entry.id} should declare no directory creation`);
  }
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'support.artifact_path_authority.preview');
  assert(command, 'support artifact path authority command should be registered');
  assert(command.classification === 'read-only', 'support artifact path authority command should be read-only');
  assert(command.effects.includes('read-only'), 'support artifact path authority command should declare read-only effect');
  assert(command.renderer_allowed === true, 'support artifact path authority command should be renderer eligible as a safe readout');
}

function classById(preview, id) {
  const entry = preview.classes.find((candidate) => candidate.id === id);
  assert(entry, `missing artifact class ${id}`);
  return entry;
}

function tableCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches'),
    entities: count(db, 'entities')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function captureEnv() {
  return {
    AURA_ATLAS_TEST_TMP: process.env.AURA_ATLAS_TEST_TMP,
    AURA_ATLAS_CACHE_DIR: process.env.AURA_ATLAS_CACHE_DIR,
    AURA_ATLAS_SDE_CACHE_DIR: process.env.AURA_ATLAS_SDE_CACHE_DIR
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

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nBefore: ${JSON.stringify(expected)}\nAfter: ${JSON.stringify(actual)}`);
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
