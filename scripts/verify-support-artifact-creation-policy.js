const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const previous = captureEnv();
  const root = path.join(projectRoot(), '.tmp', 'support-artifact-creation-policy-should-not-exist');
  fs.rmSync(root, { recursive: true, force: true });
  process.env.AURA_ATLAS_TEST_TMP = root;
  process.env.AURA_ATLAS_CACHE_DIR = path.join(root, 'cache');
  process.env.AURA_ATLAS_SDE_CACHE_DIR = path.join(root, 'sde');
  delete process.env.AURA_ATLAS_LIVE_API;

  const db = openDatabase(':memory:');
  migrate(db);

  try {
    const beforeRootExists = fs.existsSync(root);
    const beforeCounts = tableCounts(db);
    const rendererPreview = await invokeServiceCommand('support.artifact_creation_policy.preview', {
      outputDir: 'C:\\renderer-forged-trace-pack',
      destinationPath: 'C:\\renderer-forged-snapshot.sqlite',
      storageRoot: 'C:\\renderer-forged-storage',
      databasePath: 'C:\\renderer-forged-atlas.sqlite',
      storageAuthority: { mode: 'selected_storage' },
      fallbackAcknowledgement: 'renderer-forged',
      storageBudgetBytes: 1,
      trustedContext: true,
      probePath: 'C:\\renderer-forged-probe'
    }, {
      db,
      databasePath: path.join(root, 'candidate-atlas.sqlite'),
      source: 'renderer'
    });
    const afterCounts = tableCounts(db);
    const afterRootExists = fs.existsSync(root);

    const readyPreview = await fixturePreview(db, root, {
      name: 'ready',
      mode: 'configured',
      source: 'configured',
      exists: true,
      budgetBytes: 4096,
      storageAuthority: {
        mode: 'selected_storage',
        selected: true,
        config_source: 'fixture_explicit_selection',
        config_version: 1,
        budget_source: 'fixture_configured',
        budget_bytes: 4096
      }
    });
    const hardLockPreview = await fixturePreview(db, root, {
      name: 'hard-lock',
      mode: 'configured',
      source: 'configured',
      exists: true,
      budgetBytes: 1000,
      databaseBytes: 700,
      controlledBytes: 300,
      storageAuthority: {
        mode: 'selected_storage',
        selected: true,
        config_source: 'fixture_explicit_selection',
        config_version: 1,
        budget_source: 'fixture_configured',
        budget_bytes: 1000
      }
    });

    verifyReadOnlyBoundary(rendererPreview);
    verifyNoSideEffects({ beforeRootExists, afterRootExists, beforeCounts, afterCounts });
    verifyRendererAntiForgery(rendererPreview);
    verifyExternalIoLocalOnly(rendererPreview);
    verifyCreationClasses(rendererPreview);
    verifyReadyPosture(readyPreview);
    verifyBudgetBlockedPosture(hardLockPreview);
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'support artifact creation policy verified',
      command: rendererPreview.action,
      renderer_payload_ignored: rendererPreview.renderer_payload_ignored,
      sample_renderer_summary: rendererPreview.summary,
      sample_ready_postures: compactPostures(readyPreview),
      sample_budget_blocked_postures: compactPostures(hardLockPreview),
      external_io_policy: rendererPreview.external_io_policy,
      anti_forgery: rendererPreview.renderer_anti_forgery,
      boundary: rendererPreview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
    restoreEnv(previous);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function fixturePreview(db, root, options) {
  const dbPath = path.join(root, options.name, 'atlas.sqlite');
  return invokeServiceCommand('support.artifact_creation_policy.preview', {
    storagePreflight: fixturePreflight({
      mode: options.mode,
      source: options.source,
      path: dbPath,
      exists: options.exists,
      databaseBytes: options.databaseBytes,
      controlledBytes: options.controlledBytes
    }),
    storageAuthority: options.storageAuthority
  }, {
    db,
    allowStorageSetupGateFixtureInput: true,
    storageBudgetBytes: options.budgetBytes
  });
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'support.artifact_creation_policy.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should declare read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.creates_support_artifacts === false, 'preview should not create support artifacts');
  assert(preview.creates_snapshots === false, 'preview should not create snapshots');
  assert(preview.creates_trace_packs === false, 'preview should not create trace packs');
  assert(preview.creates_files === false, 'preview should not create files');
  assert(preview.creates_directories === false, 'preview should not create directories');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.zkill_calls === 0, 'preview should not call zKill');
  assert(preview.esi_calls === 0, 'preview should not call ESI');
  assert(preview.sde_download_calls === 0, 'preview should not download SDE');
  assert(preview.storage_config_written === false, 'preview should not write storage config');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate enforcement');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
  assert(preview.would_allow_is_authorization === false, 'would_allow should not be authorization');
}

function verifyNoSideEffects({ beforeRootExists, afterRootExists, beforeCounts, afterCounts }) {
  assert(beforeRootExists === false, 'fixture temp root should start missing');
  assert(afterRootExists === false, 'preview must not create the fixture temp root');
  assertSame(afterCounts, beforeCounts, 'preview should not mutate DB table counts');
}

function verifyRendererAntiForgery(preview) {
  const text = JSON.stringify(preview);
  assert(preview.renderer_payload_ignored === true, 'renderer claims should be reported as ignored');
  assert(preview.renderer_anti_forgery.path_claims_accepted === false, 'renderer paths must not be accepted');
  assert(preview.renderer_anti_forgery.storage_authority_claims_accepted === false, 'renderer storage authority must not be accepted');
  assert(preview.renderer_anti_forgery.fallback_acknowledgement_claims_accepted === false, 'renderer fallback acknowledgement must not be accepted');
  assert(preview.renderer_anti_forgery.budget_claims_accepted === false, 'renderer budget must not be accepted');
  assert(preview.renderer_anti_forgery.trusted_context_claims_accepted === false, 'renderer trusted context must not be accepted');
  assert(preview.renderer_anti_forgery.filesystem_probe_performed === false, 'renderer must not trigger filesystem probe');
  assert(!text.includes('renderer-forged'), 'preview should not echo renderer-forged path/authority claims');
}

function verifyExternalIoLocalOnly(preview) {
  assert(preview.sources.external_io_state === 'off', 'renderer forged External I/O state should remain safe off');
  assert(preview.external_io_policy.off_blocks_local_support_policy_readout === false, 'External I/O off should not block local policy readout');
  assert(preview.external_io_policy.off_blocks_support_artifact_creation_policy === false, 'External I/O off should not block support artifact policy');
  assert(preview.external_io_policy.on_authorizes_creation === false, 'External I/O on should not authorize creation');
  assert(preview.external_io_policy.support_artifact_creation_calls_providers === false, 'support artifact policy must not call providers');
  assert(preview.external_io_policy.reenable_catch_up_flood === false, 'External I/O re-enable should not imply catch-up flood');
  for (const entry of preview.classes) {
    assert(entry.external_io.blocks_this_policy_readout === false, `${entry.id} should remain locally readable`);
    assert(entry.external_io.authorizes_creation === false, `${entry.id} should not be authorized by External I/O`);
    assert(entry.requirements.external_io_required === false, `${entry.id} should not require External I/O`);
  }
}

function verifyCreationClasses(preview) {
  const rolling = classById(preview, 'runtime_snapshot_rolling');
  const retained = classById(preview, 'runtime_snapshot_retained');
  const tracePack = classById(preview, 'operator_debug_trace_pack');
  const readiness = classById(preview, 'readiness_preflight_export');

  assert(preview.summary.total_classes === 4, 'preview should include four representative classes');
  assert(rolling.command === 'runtime.db_snapshot.create', 'rolling snapshot should map to snapshot create command');
  assert(retained.command === 'runtime.db_snapshot.create', 'retained snapshot should map to snapshot create command');
  assert(tracePack.command === 'support.debug_trace_pack', 'trace pack should map to trace-pack command');
  assert(readiness.command === null, 'readiness export should remain future/no current write surface');
  assert(readiness.reason_codes.includes('no_existing_write_capable_surface'), 'readiness export should disclose no current write-capable surface');
  for (const entry of [rolling, retained, tracePack]) {
    assert(entry.requirements.confirmation_required === true, `${entry.id} should require confirmation`);
    assert(entry.requirements.trusted_context_required === true, `${entry.id} should require trusted context`);
    assert(entry.path_authority.renderer_authoritative === false, `${entry.id} path should not be renderer-authoritative`);
    assert(entry.effects_if_future_creation_is_authorized.creates_evidence === false, `${entry.id} should not create Evidence/EVEidence`);
    assert(entry.effects_if_future_creation_is_authorized.calls_zkill === false, `${entry.id} should not call zKill`);
    assert(entry.effects_if_future_creation_is_authorized.calls_esi === false, `${entry.id} should not call ESI`);
  }
}

function verifyReadyPosture(preview) {
  assert(preview.sources.storage_state === 'configured_storage_ready', 'ready fixture should be configured storage ready');
  assert(classById(preview, 'runtime_snapshot_rolling').creation_posture === 'would_allow', 'ready rolling snapshot should would_allow subject to non-authorizing preview');
  assert(classById(preview, 'runtime_snapshot_retained').creation_posture === 'would_allow', 'ready retained snapshot should would_allow subject to non-authorizing preview');
  assert(classById(preview, 'operator_debug_trace_pack').creation_posture === 'would_allow', 'ready trace pack should would_allow subject to non-authorizing preview');
  assert(preview.classes.every((entry) => entry.would_allow_is_authorization === false), 'would_allow must not authorize runtime creation');
}

function verifyBudgetBlockedPosture(preview) {
  assert(preview.sources.storage_state === 'budget_hard_lock_full', 'hard-lock fixture should expose budget hard-lock');
  for (const id of ['runtime_snapshot_rolling', 'runtime_snapshot_retained', 'operator_debug_trace_pack']) {
    const entry = classById(preview, id);
    assert(entry.creation_posture === 'budget_blocked', `${id} should be budget blocked`);
    assert(entry.requirements.budget_blocks_creation === true, `${id} should expose budget blocker`);
  }
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'support.artifact_creation_policy.preview');
  assert(command, 'support artifact creation policy command should be registered');
  assert(command.classification === 'read-only', 'support artifact creation policy command should be read-only');
  assert(command.effects.includes('read-only'), 'support artifact creation policy command should declare read-only effect');
  assert(command.renderer_allowed === true, 'support artifact creation policy command should be renderer eligible as a safe readout');
}

function compactPostures(preview) {
  return Object.fromEntries(preview.classes.map((entry) => [entry.id, entry.creation_posture]));
}

function classById(preview, id) {
  const entry = preview.classes.find((candidate) => candidate.id === id);
  assert(entry, `missing policy class ${id}`);
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

function fixturePreflight({
  mode,
  source,
  path: dbPath,
  exists,
  databaseBytes = 32,
  controlledBytes = 96
}) {
  const parentPath = dbPath ? path.dirname(dbPath) : null;
  return {
    action: 'storage.authority_preflight',
    read_only: true,
    database: {
      path: dbPath,
      source,
      mode,
      mode_flags: {
        configured: source === 'configured',
        fallback: source === 'fallback',
        missing: !exists,
        outside_policy: false,
        demo_fixture: false
      },
      parent: {
        path: parentPath,
        exists: true,
        is_directory: true
      },
      exists,
      total_bytes: databaseBytes
    },
    snapshot: {
      settings: {
        path: path.join(parentPath, 'snapshot-settings.json'),
        exists: false,
        status: 'ready',
        configured_budget_bytes: null
      },
      destination: {
        path: path.join(parentPath, 'snapshots'),
        source: 'configured',
        exists: true,
        status: 'present',
        usage_bytes: controlledBytes
      }
    },
    trace_pack: {
      output: {
        path: path.join(parentPath, 'trace-packs'),
        source: 'configured_request',
        exists: true,
        status: 'present',
        usage_bytes: 0
      }
    },
    paths: {
      cache_dir: {
        path: path.join(parentPath, 'cache'),
        exists: true,
        is_directory: true,
        usage_bytes: 0,
        posture: ['project-local', 'runtime']
      },
      sde_cache_dir: {
        path: path.join(parentPath, 'sde'),
        exists: true,
        is_directory: true,
        usage_bytes: 0,
        posture: ['project-local', 'runtime']
      }
    },
    byte_usage: {
      database_bytes: databaseBytes,
      known_controlled_locations_bytes: controlledBytes,
      locations: []
    }
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
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
