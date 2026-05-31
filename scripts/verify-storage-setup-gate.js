const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildStorageSetupGateReadout } = require('../src/main/services/storageSetupGateReadoutService');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const previous = captureEnv();
  const root = path.join(projectRoot(), '.tmp', 'storage-setup-gate-fixture');
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });

  try {
    const ready = await verifyConfiguredReady(root);
    const fallback = verifyFixturePosture('fallback_ack_required', fixturePreflight({
      mode: 'fallback',
      source: 'fallback',
      path: path.join(root, 'fallback', 'aura-atlas.sqlite'),
      exists: true
    }));
    const demo = verifyFixturePosture('demo_fixture_only', fixturePreflight({
      mode: 'demo_fixture',
      source: 'fallback',
      path: path.join(root, 'demo-fixture', 'demo.sqlite'),
      exists: true,
      demoFixture: true
    }));
    const missing = verifyFixturePosture('missing_unavailable_blocked', fixturePreflight({
      mode: 'missing',
      source: 'configured',
      path: path.join(root, 'missing', 'atlas.sqlite'),
      exists: false
    }));
    const degraded = verifyFixturePosture('invalid_degraded_setup_required', fixturePreflight({
      mode: 'configured',
      source: 'configured',
      path: path.join(root, 'degraded', 'atlas.sqlite'),
      exists: true,
      snapshotStatus: 'degraded'
    }));
    const budget = verifyBudgetStates(root);
    const matrix = verifyActionClassMatrix(root);
    await verifyRendererPayloadCannotOverrideStorageFacts(root);
    verifyCommand();

    console.log(JSON.stringify({
      status: 'storage setup gate readout verified',
      sample_ready: compactReadout(ready),
      sample_fallback: compactReadout(fallback),
      sample_missing: compactReadout(missing),
      sample_budget_states: budget,
      sample_action_matrix: matrix,
      sample_allowed_while_locked: missing.work_classes.allowed_while_locked,
      sample_blocked_while_locked: missing.work_classes.blocked_while_locked,
      boundary: ready.boundary
    }, null, 2));
  } finally {
    restoreEnv(previous);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function verifyConfiguredReady(root) {
  resetStorageEnv();
  const dbPath = path.join(root, 'configured', 'atlas-configured.sqlite');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, 'configured-db');
  process.env.AURA_ATLAS_DB_PATH = dbPath;
  process.env.AURA_ATLAS_TEST_TMP = path.join(root, 'configured', 'tmp');

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const before = sideEffectCounts(db);
    const readout = await invokeServiceCommand('storage.setup_gate_readout', {}, {
      db,
      databasePath: dbPath,
      storageBudgetBytes: 4096
    });
    const after = sideEffectCounts(db);
    assertSame(after, before, 'storage setup gate readout should not mutate DB tables');
    assert(readout.read_only === true, 'configured readout should be read-only');
    assert(readout.mutates_state === false, 'configured readout should not mutate state');
    assert(readout.enforcement_state === 'not_implemented_readout_only', 'readout must not enforce lockout');
    assert(readout.storage.state === 'configured_ready', `configured storage should be ready, got ${readout.storage.state}`);
    assert(readout.storage.blocks_real_collection === false, 'configured storage should not block real collection by itself');
    assert(readout.budget.state === 'within_budget', `configured budget should be within budget, got ${readout.budget.state}`);
    assert(readout.work_classes.locked === false, 'ready configured storage should not be locked');
    return readout;
  } finally {
    closeDatabase(db);
  }
}

function verifyFixturePosture(expectedState, preflight) {
  const readout = buildStorageSetupGateReadout({
    storagePreflight: preflight
  }, {
    allowStorageSetupGateFixtureInput: true,
    storageBudgetBytes: 4096
  });
  assert(readout.storage.state === expectedState, `expected ${expectedState}, got ${readout.storage.state}`);
  assert(readout.work_classes.locked === true, `${expectedState} should lock write/acquisition posture`);
  assert(readout.work_classes.allowed_while_locked.includes('storage setup/re-establish'), 'locked readout should name setup as allowed');
  assert(readout.work_classes.allowed_while_locked.includes('clearly separated demo/fixture mode'), 'locked readout should name demo/fixture mode as allowed');
  assert(readout.work_classes.blocked_while_locked.includes('provider-backed acquisition'), 'locked readout should block provider-backed acquisition');
  assert(readout.work_classes.blocked_while_locked.includes('Evidence/EVEidence writes'), 'locked readout should block Evidence/EVEidence writes');
  assert(readout.work_classes.blocked_while_locked.includes('hydration writes'), 'locked readout should block hydration writes');
  assert(readout.work_classes.blocked_while_locked.includes('destructive pruning/deletion execution'), 'locked readout should block pruning/deletion execution');
  return readout;
}

function verifyBudgetStates(root) {
  const base = fixturePreflight({
    mode: 'configured',
    source: 'configured',
    path: path.join(root, 'budget', 'atlas.sqlite'),
    exists: true,
    databaseBytes: 700,
    controlledBytes: 300
  });
  const unconfigured = buildStorageSetupGateReadout({ storagePreflight: base }, {
    allowStorageSetupGateFixtureInput: true
  });
  const within = budgetReadout(base, 2000);
  const warning = budgetReadout(base, 1400);
  const strong = budgetReadout(base, 1050);
  const hardLock = budgetReadout(base, 1000);

  assert(unconfigured.budget.state === 'budget_unconfigured', 'budget unconfigured should be reported');
  assert(within.budget.state === 'within_budget', `within budget state mismatch: ${within.budget.state}`);
  assert(warning.budget.state === 'budget_warning', `70% budget state mismatch: ${warning.budget.state}`);
  assert(strong.budget.state === 'budget_strong_warning', `95% budget state mismatch: ${strong.budget.state}`);
  assert(hardLock.budget.state === 'budget_hard_lock', `100% budget state mismatch: ${hardLock.budget.state}`);
  assert(hardLock.work_classes.locked === true, 'hard-lock budget should lock write/acquisition posture');
  assert(hardLock.work_classes.blocked_reasons.includes('budget_hard_lock'), 'hard-lock budget should be named as a lock reason');

  return {
    unconfigured: unconfigured.budget.state,
    within: within.budget.state,
    warning: warning.budget.state,
    strong_warning: strong.budget.state,
    hard_lock: hardLock.budget.state,
    hard_lock_blocks: hardLock.work_classes.blocked_reasons
  };
}

function verifyActionClassMatrix(root) {
  const states = {
    configured_storage_ready: buildFixtureReadout({
      mode: 'configured',
      source: 'configured',
      path: path.join(root, 'matrix', 'ready.sqlite'),
      exists: true,
      budgetBytes: 4096
    }),
    no_storage_selected: buildFixtureReadout({
      mode: 'no_storage_selected',
      source: 'fallback',
      path: null,
      exists: false,
      budgetBytes: 4096
    }),
    current_file_fallback_unacknowledged: buildFixtureReadout({
      mode: 'fallback',
      source: 'fallback',
      path: path.join(root, 'matrix', 'fallback.sqlite'),
      exists: true,
      budgetBytes: 4096
    }),
    demo_fixture_mode: buildFixtureReadout({
      mode: 'demo_fixture',
      source: 'fallback',
      path: path.join(root, 'matrix', 'demo-fixture.sqlite'),
      exists: true,
      demoFixture: true,
      budgetBytes: 4096
    }),
    configured_storage_missing_unavailable: buildFixtureReadout({
      mode: 'missing',
      source: 'configured',
      path: path.join(root, 'matrix', 'missing.sqlite'),
      exists: false,
      budgetBytes: 4096
    }),
    configured_storage_invalid_degraded: buildFixtureReadout({
      mode: 'configured',
      source: 'configured',
      path: path.join(root, 'matrix', 'degraded.sqlite'),
      exists: true,
      snapshotStatus: 'degraded',
      budgetBytes: 4096
    }),
    budget_warning: buildFixtureReadout({
      mode: 'configured',
      source: 'configured',
      path: path.join(root, 'matrix', 'warning.sqlite'),
      exists: true,
      databaseBytes: 700,
      controlledBytes: 300,
      budgetBytes: 1400
    }),
    budget_strong_warning: buildFixtureReadout({
      mode: 'configured',
      source: 'configured',
      path: path.join(root, 'matrix', 'strong-warning.sqlite'),
      exists: true,
      databaseBytes: 700,
      controlledBytes: 300,
      budgetBytes: 1050
    }),
    budget_hard_lock_full: buildFixtureReadout({
      mode: 'configured',
      source: 'configured',
      path: path.join(root, 'matrix', 'hard-lock.sqlite'),
      exists: true,
      databaseBytes: 700,
      controlledBytes: 300,
      budgetBytes: 1000
    })
  };

  for (const [expectedState, readout] of Object.entries(states)) {
    assert(readout.action_class_matrix.storage_state === expectedState, `matrix should report ${expectedState}, got ${readout.action_class_matrix.storage_state}`);
    verifyAllActionClassesPresent(readout, expectedState);
    verifyBasisFields(readout, expectedState);
  }

  assertAction(states.configured_storage_ready, 'setup_config_changes', 'allow');
  assertAction(states.configured_storage_ready, 'local_db_inspection', 'allow');
  assertAction(states.configured_storage_ready, 'local_reports_observation', 'allow');
  assertAction(states.configured_storage_ready, 'assessment_writing', 'allow');
  assertAction(states.configured_storage_ready, 'zkill_discovery', 'provider_gated');
  assertAction(states.configured_storage_ready, 'esi_evidence_expansion', 'provider_gated');
  assertAction(states.configured_storage_ready, 'fast_view_metadata_hydration', 'provider_gated');
  assertAction(states.configured_storage_ready, 'background_hydration', 'provider_gated');
  assertAction(states.configured_storage_ready, 'snapshot_support_artifact_write', 'allow_if_destination_safe');
  assertAction(states.configured_storage_ready, 'pruning_deletion_preflight', 'allow');
  assertAction(states.configured_storage_ready, 'pruning_deletion_execution', 'future_runway_only');

  assertAction(states.no_storage_selected, 'local_db_inspection', 'conditional');
  assertAction(states.no_storage_selected, 'local_reports_observation', 'conditional');
  assertAction(states.no_storage_selected, 'assessment_writing', 'block');
  assertAction(states.no_storage_selected, 'zkill_discovery', 'block');
  assertAction(states.no_storage_selected, 'fast_view_metadata_hydration', 'block_writes');
  assertAction(states.no_storage_selected, 'snapshot_support_artifact_write', 'block');
  assertAction(states.no_storage_selected, 'pruning_deletion_execution', 'block');

  assertAction(states.current_file_fallback_unacknowledged, 'local_db_inspection', 'allow');
  assertAction(states.current_file_fallback_unacknowledged, 'local_reports_observation', 'allow');
  assertAction(states.current_file_fallback_unacknowledged, 'assessment_writing', 'block');
  assertAction(states.current_file_fallback_unacknowledged, 'zkill_discovery', 'block');
  assertAction(states.current_file_fallback_unacknowledged, 'snapshot_support_artifact_write', 'block');

  assertAction(states.demo_fixture_mode, 'local_db_inspection', 'fixture_only');
  assertAction(states.demo_fixture_mode, 'local_reports_observation', 'fixture_only');
  assertAction(states.demo_fixture_mode, 'assessment_writing', 'fixture_only');
  assertAction(states.demo_fixture_mode, 'zkill_discovery', 'block');
  assertAction(states.demo_fixture_mode, 'fast_view_metadata_hydration', 'fixture_only');
  assertAction(states.demo_fixture_mode, 'snapshot_support_artifact_write', 'fixture_disposable_only');
  assertAction(states.demo_fixture_mode, 'pruning_deletion_execution', 'fixture_only');

  assertAction(states.configured_storage_missing_unavailable, 'local_db_inspection', 'conditional');
  assertAction(states.configured_storage_missing_unavailable, 'local_reports_observation', 'conditional');
  assertAction(states.configured_storage_missing_unavailable, 'zkill_discovery', 'block');
  assertAction(states.configured_storage_missing_unavailable, 'snapshot_support_artifact_write', 'conditional_alternate');

  assertAction(states.configured_storage_invalid_degraded, 'local_db_inspection', 'read_only_only');
  assertAction(states.configured_storage_invalid_degraded, 'local_reports_observation', 'degraded_read_only');
  assertAction(states.configured_storage_invalid_degraded, 'assessment_writing', 'block');
  assertAction(states.configured_storage_invalid_degraded, 'pruning_deletion_preflight', 'read_only_only');

  assertAction(states.budget_warning, 'assessment_writing', 'allow');
  assertAction(states.budget_warning, 'zkill_discovery', 'provider_gated');
  assertAction(states.budget_warning, 'snapshot_support_artifact_write', 'allow_if_projected_safe');

  assertAction(states.budget_strong_warning, 'assessment_writing', 'conditional');
  assertAction(states.budget_strong_warning, 'zkill_discovery', 'conditional');
  assertAction(states.budget_strong_warning, 'fast_view_metadata_hydration', 'active_view_only');
  assertAction(states.budget_strong_warning, 'background_hydration', 'defer_by_default');
  assertAction(states.budget_strong_warning, 'snapshot_support_artifact_write', 'conditional');

  assertAction(states.budget_hard_lock_full, 'local_db_inspection', 'allow_if_safe');
  assertAction(states.budget_hard_lock_full, 'local_reports_observation', 'allow_if_safe');
  assertAction(states.budget_hard_lock_full, 'assessment_writing', 'block');
  assertAction(states.budget_hard_lock_full, 'zkill_discovery', 'block');
  assertAction(states.budget_hard_lock_full, 'fast_view_metadata_hydration', 'block_writes');
  assertAction(states.budget_hard_lock_full, 'snapshot_support_artifact_write', 'block');
  assertAction(states.budget_hard_lock_full, 'pruning_deletion_preflight', 'allow_readout');
  assertAction(states.budget_hard_lock_full, 'pruning_deletion_execution', 'future_runway_only');

  assert(states.configured_storage_ready.action_class_matrix.actions.zkill_discovery.basis.provider_movement_required === true, 'zKill Discovery should disclose provider movement');
  assert(states.configured_storage_ready.action_class_matrix.actions.local_reports_observation.basis.provider_movement_required === false, 'local Observation/report should not require provider movement');
  assert(states.budget_hard_lock_full.action_class_matrix.actions.esi_evidence_expansion.basis.block_hold_reason === 'write_blocked_by_budget', 'hard-lock expansion should name budget block');
  assert(states.demo_fixture_mode.action_class_matrix.actions.local_reports_observation.basis.result_basis.includes('fixture'), 'demo local reports should disclose fixture basis');
  assert(states.configured_storage_invalid_degraded.action_class_matrix.actions.local_db_inspection.basis.result_basis.includes('degraded'), 'degraded local inspection should disclose degraded basis');
  assert(buildFixtureReadout({
    mode: 'missing',
    source: 'configured',
    path: path.join(root, 'matrix', 'missing-over-budget.sqlite'),
    exists: false,
    databaseBytes: 700,
    controlledBytes: 300,
    budgetBytes: 1000
  }).action_class_matrix.storage_state === 'configured_storage_missing_unavailable', 'missing storage should not be hidden by budget hard-lock');
  assert(buildFixtureReadout({
    mode: 'no_storage_selected',
    source: 'fallback',
    path: null,
    exists: false,
    databaseBytes: 700,
    controlledBytes: 300,
    budgetBytes: 1000
  }).action_class_matrix.storage_state === 'no_storage_selected', 'no selected storage should not be hidden by budget hard-lock');

  return {
    states: Object.fromEntries(Object.entries(states).map(([key, readout]) => [
      key,
      compactMatrix(readout)
    ])),
    action_classes: Object.keys(states.configured_storage_ready.action_class_matrix.actions)
  };
}

function buildFixtureReadout({
  mode,
  source,
  path: dbPath,
  exists,
  outsidePolicy,
  demoFixture,
  snapshotStatus,
  databaseBytes,
  controlledBytes,
  budgetBytes
}) {
  return buildStorageSetupGateReadout({
    storagePreflight: fixturePreflight({
      mode,
      source,
      path: dbPath,
      exists,
      outsidePolicy,
      demoFixture,
      snapshotStatus,
      databaseBytes,
      controlledBytes
    })
  }, {
    allowStorageSetupGateFixtureInput: true,
    storageBudgetBytes: budgetBytes
  });
}

function budgetReadout(preflight, budgetBytes) {
  return buildStorageSetupGateReadout({
    storagePreflight: preflight
  }, {
    allowStorageSetupGateFixtureInput: true,
    storageBudgetBytes: budgetBytes
  });
}

async function verifyRendererPayloadCannotOverrideStorageFacts(root) {
  resetStorageEnv();
  const trustedPath = path.join(root, 'renderer-safe', 'trusted.sqlite');
  const payloadPath = path.join(root, 'renderer-safe', 'payload.sqlite');
  fs.mkdirSync(path.dirname(trustedPath), { recursive: true });
  fs.writeFileSync(trustedPath, 'trusted-db');
  process.env.AURA_ATLAS_DB_PATH = trustedPath;
  process.env.AURA_ATLAS_TEST_TMP = path.join(root, 'renderer-safe', 'tmp');

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const readout = await invokeServiceCommand('storage.setup_gate_readout', {
      databasePath: payloadPath,
      storagePreflight: fixturePreflight({
        mode: 'missing',
        source: 'configured',
        path: payloadPath,
        exists: false
      }),
      storageBudgetBytes: 1
    }, {
      db,
      databasePath: trustedPath,
      source: 'renderer',
      storageBudgetBytes: 4096
    });
    assert(readout.storage.database.path === trustedPath, 'renderer payload must not override trusted storage path');
    assert(readout.storage.state === 'configured_ready', `renderer payload should not override storage facts, got ${readout.storage.state}`);
    assert(readout.budget.state === 'within_budget', 'renderer payload budget should not override trusted context budget');
    assert(readout.source.renderer_payload_storage_facts_ignored === true, 'renderer safety flag should be visible');
  } finally {
    closeDatabase(db);
  }
}

function verifyCommand() {
  const command = listServiceCommands().find((entry) => entry.command === 'storage.setup_gate_readout');
  assert(command, 'storage.setup_gate_readout should be listed');
  assert(command.classification === 'read-only', 'storage.setup_gate_readout should be read-only');
  assert(command.effects.includes('read-only'), 'storage.setup_gate_readout should declare read-only effect');
  assert(command.renderer_allowed === true, 'storage.setup_gate_readout should be renderer eligible');
}

function fixturePreflight({
  mode,
  source,
  path: dbPath,
  exists,
  outsidePolicy = false,
  demoFixture = false,
  snapshotStatus = 'ready',
  databaseBytes = 32,
  controlledBytes = 96
}) {
  const parentPath = dbPath ? path.dirname(dbPath) : null;
  return {
    action: 'storage.authority_preflight',
    read_only: true,
    mutates_state: false,
    database: {
      path: dbPath,
      source,
      mode,
      mode_flags: {
        configured: source === 'configured',
        fallback: source !== 'configured',
        missing: !exists,
        outside_policy: outsidePolicy,
        demo_fixture: demoFixture
      },
      parent: {
        path: parentPath,
        exists: exists !== false,
        is_directory: exists !== false && Boolean(parentPath)
      },
      exists: exists === true,
      total_bytes: databaseBytes
    },
    snapshot: {
      settings: {
        status: snapshotStatus
      }
    },
    byte_usage: {
      database_bytes: databaseBytes,
      known_controlled_locations_bytes: controlledBytes
    }
  };
}

function verifyAllActionClassesPresent(readout, expectedState) {
  const actions = readout.action_class_matrix.actions;
  for (const actionClass of expectedActionClasses()) {
    assert(actions[actionClass], `${expectedState} should include ${actionClass}`);
    assert(actions[actionClass].enforcement_state === 'not_implemented_readout_only', `${actionClass} should remain readout-only`);
  }
}

function verifyBasisFields(readout, expectedState) {
  const basis = readout.action_class_matrix.basis;
  assert(basis.storage_state, `${expectedState} should include storage state basis`);
  assert(basis.budget_state, `${expectedState} should include budget state basis`);
  assert(typeof basis.local_inspection_available === 'boolean', `${expectedState} should expose local inspection availability`);
  assert(basis.write_posture, `${expectedState} should expose write posture`);
  assert(Array.isArray(basis.result_basis), `${expectedState} should expose result basis`);
  for (const [actionClass, decision] of Object.entries(readout.action_class_matrix.actions)) {
    assert(decision.basis.storage_state === expectedState, `${actionClass} should carry matrix storage state`);
    assert(typeof decision.basis.provider_movement_required === 'boolean', `${actionClass} should expose provider movement requirement`);
    assert(decision.basis.write_posture, `${actionClass} should expose write posture`);
    assert(Array.isArray(decision.basis.result_basis), `${actionClass} should expose result basis`);
  }
}

function expectedActionClasses() {
  return [
    'setup_config_changes',
    'local_db_inspection',
    'local_reports_observation',
    'assessment_writing',
    'zkill_discovery',
    'esi_evidence_expansion',
    'fast_view_metadata_hydration',
    'background_hydration',
    'snapshot_support_artifact_write',
    'pruning_deletion_preflight',
    'pruning_deletion_execution'
  ];
}

function assertAction(readout, actionClass, posture) {
  const decision = readout.action_class_matrix.actions[actionClass];
  assert(decision, `${actionClass} should exist for ${readout.action_class_matrix.storage_state}`);
  assert(decision.posture === posture, `${readout.action_class_matrix.storage_state} ${actionClass} should be ${posture}, got ${decision.posture}`);
}

function compactMatrix(readout) {
  const actions = readout.action_class_matrix.actions;
  return {
    storage_state: readout.action_class_matrix.storage_state,
    local_db_inspection: actions.local_db_inspection.posture,
    local_reports_observation: actions.local_reports_observation.posture,
    assessment_writing: actions.assessment_writing.posture,
    zkill_discovery: actions.zkill_discovery.posture,
    esi_evidence_expansion: actions.esi_evidence_expansion.posture,
    fast_view_metadata_hydration: actions.fast_view_metadata_hydration.posture,
    background_hydration: actions.background_hydration.posture,
    snapshot_support_artifact_write: actions.snapshot_support_artifact_write.posture,
    pruning_deletion_preflight: actions.pruning_deletion_preflight.posture,
    pruning_deletion_execution: actions.pruning_deletion_execution.posture
  };
}

function compactReadout(readout) {
  return {
    storage_state: readout.storage.state,
    setup_gate: readout.storage.setup_gate,
    budget_state: readout.budget.state,
    locked: readout.work_classes.locked,
    local_read_report: readout.work_classes.local_read_report.state,
    blocked_reasons: readout.work_classes.blocked_reasons
  };
}

function sideEffectCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    actor_watches: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function resetStorageEnv() {
  delete process.env.AURA_ATLAS_DB_PATH;
  delete process.env.AURA_ATLAS_TEST_TMP;
  delete process.env.AURA_ATLAS_CACHE_DIR;
  delete process.env.AURA_ATLAS_SDE_CACHE_DIR;
  delete process.env.AURA_ATLAS_RUNTIME_SNAPSHOT_SETTINGS_PATH;
  delete process.env.AURA_ATLAS_SETTINGS_PATH;
  delete process.env.AURA_ATLAS_ALLOW_EXTERNAL_PATHS;
  delete process.env.AURA_ATLAS_STORAGE_PREFLIGHT_FALLBACK_SETTINGS_WITH_DB;
}

function captureEnv() {
  return {
    AURA_ATLAS_DB_PATH: process.env.AURA_ATLAS_DB_PATH,
    AURA_ATLAS_TEST_TMP: process.env.AURA_ATLAS_TEST_TMP,
    AURA_ATLAS_CACHE_DIR: process.env.AURA_ATLAS_CACHE_DIR,
    AURA_ATLAS_SDE_CACHE_DIR: process.env.AURA_ATLAS_SDE_CACHE_DIR,
    AURA_ATLAS_RUNTIME_SNAPSHOT_SETTINGS_PATH: process.env.AURA_ATLAS_RUNTIME_SNAPSHOT_SETTINGS_PATH,
    AURA_ATLAS_SETTINGS_PATH: process.env.AURA_ATLAS_SETTINGS_PATH,
    AURA_ATLAS_ALLOW_EXTERNAL_PATHS: process.env.AURA_ATLAS_ALLOW_EXTERNAL_PATHS,
    AURA_ATLAS_STORAGE_PREFLIGHT_FALLBACK_SETTINGS_WITH_DB: process.env.AURA_ATLAS_STORAGE_PREFLIGHT_FALLBACK_SETTINGS_WITH_DB
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
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
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
