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
    const authority = verifyStorageAuthorityReadout(root);
    const matrix = verifyActionClassMatrix(root);
    const dryRun = verifyStorageConfigDryRun(root);
    await verifyRendererPayloadCannotOverrideStorageFacts(root);
    verifyCommand();

    console.log(JSON.stringify({
      status: 'storage setup gate readout verified',
      sample_ready: compactReadout(ready),
      sample_fallback: compactReadout(fallback),
      sample_missing: compactReadout(missing),
      sample_budget_states: budget,
      sample_storage_authority: authority,
      sample_storage_config_dry_run: dryRun,
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

function verifyStorageAuthorityReadout(root) {
  const noStorage = buildFixtureReadout({
    mode: 'no_storage_selected',
    source: 'fallback',
    path: null,
    exists: false,
    budgetBytes: 4096
  });
  const selected = buildFixtureReadout({
    mode: 'configured',
    source: 'configured',
    path: path.join(root, 'authority', 'selected', 'atlas.sqlite'),
    exists: true,
    budgetBytes: 4096,
    storageAuthority: {
      mode: 'selected_storage',
      selected: true,
      config_source: 'fixture_explicit_selection',
      config_version: 1,
      budget_bytes: 4096
    }
  });
  const fallbackAvailable = buildFixtureReadout({
    mode: 'fallback',
    source: 'fallback',
    path: path.join(root, 'authority', 'fallback', 'atlas.sqlite'),
    exists: true,
    budgetBytes: 4096,
    storageAuthority: {
      mode: 'app_local_fallback_available',
      fallback_available: true,
      acknowledgement_status: 'not_acknowledged',
      config_source: 'fixture_no_config',
      config_version: 1
    }
  });
  const fallbackAcknowledged = buildFixtureReadout({
    mode: 'fallback',
    source: 'fallback',
    path: path.join(root, 'authority', 'fallback-ack', 'atlas.sqlite'),
    exists: true,
    budgetBytes: 4096,
    storageAuthority: {
      mode: 'app_local_fallback_acknowledged',
      fallback_available: true,
      acknowledgement_status: 'acknowledged',
      acknowledgement_basis: 'fixture operator accepted app-local fallback',
      config_source: 'fixture_acknowledgement',
      config_version: 1,
      budget_bytes: 4096
    }
  });
  const acknowledgementInvalidated = buildFixtureReadout({
    mode: 'fallback',
    source: 'fallback',
    path: path.join(root, 'authority', 'fallback-invalid', 'atlas.sqlite'),
    exists: true,
    budgetBytes: 4096,
    storageAuthority: {
      mode: 'acknowledgement_invalidated',
      fallback_available: true,
      acknowledgement_status: 'invalidated',
      acknowledgement_basis: 'fixture previous acknowledgement',
      acknowledgement_invalid_reason: 'app path changed',
      config_source: 'fixture_acknowledgement',
      config_version: 1
    }
  });
  const missing = buildFixtureReadout({
    mode: 'missing',
    source: 'configured',
    path: path.join(root, 'authority', 'missing', 'atlas.sqlite'),
    exists: false,
    budgetBytes: 4096,
    storageAuthority: {
      mode: 'selected_storage_missing_unavailable',
      selected: true,
      config_source: 'fixture_config',
      config_version: 1
    }
  });
  const degraded = buildFixtureReadout({
    mode: 'configured',
    source: 'configured',
    path: path.join(root, 'authority', 'degraded', 'atlas.sqlite'),
    exists: true,
    snapshotStatus: 'degraded',
    budgetBytes: 4096,
    storageAuthority: {
      mode: 'selected_storage_invalid_degraded',
      selected: true,
      validation_status: 'invalid_degraded',
      config_source: 'fixture_config',
      config_version: 1
    }
  });
  const budgetWarning = buildFixtureReadout({
    mode: 'configured',
    source: 'configured',
    path: path.join(root, 'authority', 'budget-warning', 'atlas.sqlite'),
    exists: true,
    databaseBytes: 700,
    controlledBytes: 300,
    budgetBytes: 1400,
    storageAuthority: {
      mode: 'selected_storage',
      selected: true,
      budget_source: 'fixture_configured',
      budget_bytes: 1400,
      config_version: 1
    }
  });
  const budgetStrong = buildFixtureReadout({
    mode: 'configured',
    source: 'configured',
    path: path.join(root, 'authority', 'budget-strong', 'atlas.sqlite'),
    exists: true,
    databaseBytes: 700,
    controlledBytes: 300,
    budgetBytes: 1050,
    storageAuthority: {
      mode: 'selected_storage',
      selected: true,
      budget_source: 'fixture_configured',
      budget_bytes: 1050,
      config_version: 1
    }
  });
  const budgetHardLock = buildFixtureReadout({
    mode: 'configured',
    source: 'configured',
    path: path.join(root, 'authority', 'budget-hard-lock', 'atlas.sqlite'),
    exists: true,
    databaseBytes: 700,
    controlledBytes: 300,
    budgetBytes: 1000,
    storageAuthority: {
      mode: 'selected_storage',
      selected: true,
      budget_source: 'fixture_configured',
      budget_bytes: 1000,
      config_version: 1
    }
  });

  assert(noStorage.storage_authority.mode === 'no_storage_selected', 'no storage selected should be visible');
  assert(noStorage.storage_authority.selected === false, 'no storage selected should not be selected');
  assert(noStorage.storage_authority.read_allowed === false, 'no storage selected should not allow reads by default');
  assert(noStorage.storage_authority.budget_source === 'trusted_context', 'trusted budget should be visible even when storage is not selected');
  assert(noStorage.storage_authority.budget_bytes === 4096, 'trusted budget bytes should be visible even when storage is not selected');
  assert(selected.storage_authority.mode === 'selected_storage', 'explicit selected storage should be visible');
  assert(selected.storage_authority.selected === true, 'explicit selected storage should be selected');
  assert(selected.storage_authority.write_allowed_if_enforced_later === true, 'explicit selected storage should allow writes if enforced later');
  assert(fallbackAvailable.storage_authority.mode === 'app_local_fallback_available', 'fallback available should be visible');
  assert(fallbackAvailable.storage_authority.fallback_available === true, 'fallback availability should be true');
  assert(fallbackAvailable.storage_authority.fallback_acknowledged === false, 'fallback available should not be acknowledged');
  assert(fallbackAvailable.storage_authority.write_allowed_if_enforced_later === false, 'unacknowledged fallback should not allow writes');
  assert(fallbackAcknowledged.storage_authority.mode === 'app_local_fallback_acknowledged', 'acknowledged fallback should be visible');
  assert(fallbackAcknowledged.storage_authority.fallback_acknowledged === true, 'acknowledged fallback should expose acknowledgement');
  assert(fallbackAcknowledged.storage_authority.write_allowed_if_enforced_later === true, 'acknowledged fallback should allow writes if enforced later');
  assert(fallbackAcknowledged.storage.state === 'configured_ready', 'acknowledged fallback should feed ready setup posture for fixture proof');
  assert(acknowledgementInvalidated.storage_authority.acknowledgement_status === 'invalidated', 'invalidated acknowledgement should be visible');
  assert(acknowledgementInvalidated.storage_authority.acknowledgement_invalid_reason === 'app path changed', 'invalidated acknowledgement should name reason');
  assert(acknowledgementInvalidated.storage_authority.write_allowed_if_enforced_later === false, 'invalidated acknowledgement should block writes');
  assert(missing.storage_authority.validation_status === 'missing_unavailable', 'missing selected storage should show unavailable validation');
  assert(missing.storage_authority.write_allowed_if_enforced_later === false, 'missing selected storage should block writes');
  assert(degraded.storage_authority.validation_status === 'invalid_degraded', 'degraded selected storage should show degraded validation');
  assert(degraded.storage_authority.write_allowed_if_enforced_later === false, 'degraded selected storage should block writes');
  assert(budgetWarning.budget.state === 'budget_warning', 'budget warning should be visible through storage authority fixture');
  assert(budgetWarning.storage_authority.budget_bytes === 1400, 'budget warning bytes should be visible');
  assert(budgetStrong.budget.state === 'budget_strong_warning', 'budget strong warning should be visible through storage authority fixture');
  assert(budgetHardLock.budget.state === 'budget_hard_lock', 'budget hard-lock should be visible through storage authority fixture');
  assert(budgetHardLock.storage_authority.write_allowed_if_enforced_later === false, 'budget hard-lock should block future writes in authority readout');
  assert(budgetHardLock.storage_authority.provider_movement_allowed_if_enforced_later === false, 'budget hard-lock should block future provider movement in authority readout');

  return {
    no_storage_selected: compactAuthority(noStorage),
    selected_storage: compactAuthority(selected),
    app_local_fallback_available: compactAuthority(fallbackAvailable),
    app_local_fallback_acknowledged: compactAuthority(fallbackAcknowledged),
    acknowledgement_invalidated: compactAuthority(acknowledgementInvalidated),
    selected_storage_missing_unavailable: compactAuthority(missing),
    selected_storage_invalid_degraded: compactAuthority(degraded),
    budget_warning: compactAuthority(budgetWarning),
    budget_strong_warning: compactAuthority(budgetStrong),
    budget_hard_lock: compactAuthority(budgetHardLock)
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

function verifyStorageConfigDryRun(root) {
  const selected = buildFixtureReadout({
    mode: 'configured',
    source: 'configured',
    path: path.join(root, 'dry-run', 'selected', 'atlas.sqlite'),
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
  const fallbackAvailable = buildFixtureReadout({
    mode: 'fallback',
    source: 'fallback',
    path: path.join(root, 'dry-run', 'fallback', 'atlas.sqlite'),
    exists: true,
    budgetBytes: 4096,
    storageAuthority: {
      mode: 'app_local_fallback_available',
      fallback_available: true,
      acknowledgement_status: 'not_acknowledged',
      config_source: 'fixture_no_config',
      config_version: 1
    }
  });
  const fallbackAcknowledged = buildFixtureReadout({
    mode: 'fallback',
    source: 'fallback',
    path: path.join(root, 'dry-run', 'fallback-ack', 'atlas.sqlite'),
    exists: true,
    budgetBytes: 4096,
    storageAuthority: {
      mode: 'app_local_fallback_acknowledged',
      fallback_available: true,
      acknowledgement_status: 'acknowledged',
      acknowledgement_basis: 'fixture operator accepted app-local fallback',
      config_source: 'fixture_acknowledgement',
      config_version: 1,
      budget_source: 'fixture_configured',
      budget_bytes: 4096
    }
  });
  const acknowledgementInvalidated = buildFixtureReadout({
    mode: 'fallback',
    source: 'fallback',
    path: path.join(root, 'dry-run', 'fallback-invalid', 'atlas.sqlite'),
    exists: true,
    budgetBytes: 4096,
    storageAuthority: {
      mode: 'acknowledgement_invalidated',
      fallback_available: true,
      acknowledgement_status: 'invalidated',
      acknowledgement_basis: 'fixture previous acknowledgement',
      acknowledgement_invalid_reason: 'app path changed',
      config_source: 'fixture_acknowledgement',
      config_version: 1,
      budget_source: 'fixture_configured',
      budget_bytes: 4096
    }
  });
  const noStorage = buildFixtureReadout({
    mode: 'no_storage_selected',
    source: 'fallback',
    path: null,
    exists: false,
    budgetBytes: 4096
  });
  const missing = buildFixtureReadout({
    mode: 'missing',
    source: 'configured',
    path: path.join(root, 'dry-run', 'missing', 'atlas.sqlite'),
    exists: false,
    budgetBytes: 4096,
    storageAuthority: {
      mode: 'selected_storage_missing_unavailable',
      selected: true,
      config_source: 'fixture_config',
      config_version: 1,
      budget_source: 'fixture_configured',
      budget_bytes: 4096
    }
  });
  const degraded = buildFixtureReadout({
    mode: 'configured',
    source: 'configured',
    path: path.join(root, 'dry-run', 'degraded', 'atlas.sqlite'),
    exists: true,
    snapshotStatus: 'degraded',
    budgetBytes: 4096,
    storageAuthority: {
      mode: 'selected_storage_invalid_degraded',
      selected: true,
      validation_status: 'invalid_degraded',
      config_source: 'fixture_config',
      config_version: 1,
      budget_source: 'fixture_configured',
      budget_bytes: 4096
    }
  });
  const budgetMissing = buildFixtureReadout({
    mode: 'configured',
    source: 'configured',
    path: path.join(root, 'dry-run', 'budget-missing', 'atlas.sqlite'),
    exists: true,
    storageAuthority: {
      mode: 'selected_storage',
      selected: true,
      config_source: 'fixture_explicit_selection',
      config_version: 1
    }
  });

  assert(selected.storage_config_dry_run.dry_run === true, 'storage config readout should be dry-run only');
  assert(selected.storage_config_dry_run.would_write === true, 'selected storage with budget should simulate a write');
  assert(selected.storage_config_dry_run.target_path === path.join(projectRoot(), 'config', 'storage-authority.json'), 'dry-run target should use app-root config path');
  assert(selected.storage_config_dry_run.target_path_basis === '<Atlas app/root>/config/storage-authority.json', 'dry-run target should name accepted pattern');
  assert(selected.storage_config_dry_run.path_allowed === true, 'app-root config path should be allowed');
  assert(selected.storage_config_dry_run.path_block_reason === null, 'allowed target should have no path block reason');
  assert(selected.storage_config_dry_run.payload.schema === 'aura.atlas.storage_authority', 'dry-run payload should include schema');
  assert(selected.storage_config_dry_run.payload.version === 1, 'dry-run payload should include version');
  assert(selected.storage_config_dry_run.payload.selected_storage_mode === 'selected_storage', 'dry-run payload should include selected mode');
  assert(selected.storage_config_dry_run.payload.selected_database_path.endsWith(path.join('dry-run', 'selected', 'atlas.sqlite')), 'dry-run payload should include selected DB path basis');
  assert(selected.storage_config_dry_run.payload.fallback_acknowledgement.status === 'not_required', 'selected storage should not require fallback acknowledgement');
  assert(selected.storage_config_dry_run.payload.fallback_acknowledgement.provenance, 'dry-run payload should include acknowledgement provenance');
  assert(selected.storage_config_dry_run.payload.budget_bytes === 4096, 'dry-run payload should include budget bytes');
  assert(selected.storage_config_dry_run.payload.path_basis === 'explicit_selected_storage', 'dry-run payload should include path basis');
  assert(selected.storage_config_dry_run.payload.validation_status === 'valid', 'dry-run payload should include validation status');
  assert(selected.storage_config_dry_run.payload.created_at === 'DRY_RUN_TIMESTAMP_PLACEHOLDER', 'dry-run payload should use a timestamp placeholder');
  assert(selected.storage_config_dry_run.payload.updated_at === 'DRY_RUN_TIMESTAMP_PLACEHOLDER', 'dry-run payload should use an updated timestamp placeholder');
  assert(selected.storage_config_dry_run.readback_simulation.status === 'would_read_back', 'valid dry-run should simulate readback');
  assert(selected.storage_config_dry_run.readback_simulation.equals_payload === true, 'readback simulation should match payload');
  assert(selected.storage_config_dry_run.enforcement_state === 'not_implemented_readout_only', 'dry-run must not enforce storage');

  assert(fallbackAvailable.storage_config_dry_run.would_write === false, 'unacknowledged fallback should not simulate write');
  assert(fallbackAvailable.storage_config_dry_run.validation_result.issues.includes('fallback_acknowledgement_required'), 'fallback available should require acknowledgement');
  assert(fallbackAcknowledged.storage_config_dry_run.would_write === true, 'acknowledged fallback with budget should simulate write');
  assert(fallbackAcknowledged.storage_config_dry_run.payload.fallback_acknowledgement.status === 'acknowledged', 'acknowledged fallback should persist acknowledgement status in simulated payload');
  assert(acknowledgementInvalidated.storage_config_dry_run.would_write === false, 'invalidated acknowledgement should not simulate write');
  assert(acknowledgementInvalidated.storage_config_dry_run.validation_result.invalidation_basis === 'app path changed', 'invalidated acknowledgement should expose invalidation basis');
  assert(noStorage.storage_config_dry_run.would_write === false, 'no storage selected should not simulate write');
  assert(noStorage.storage_config_dry_run.validation_result.issues.includes('storage_not_selected'), 'no storage selected should block dry-run write');
  assert(missing.storage_config_dry_run.would_write === false, 'missing selected storage should not simulate write');
  assert(missing.storage_config_dry_run.validation_result.issues.includes('selected_storage_missing_unavailable'), 'missing storage should expose unavailable issue');
  assert(degraded.storage_config_dry_run.would_write === false, 'degraded selected storage should not simulate write');
  assert(degraded.storage_config_dry_run.validation_result.issues.includes('selected_storage_invalid_degraded'), 'degraded storage should expose degraded issue');
  assert(budgetMissing.storage_config_dry_run.would_write === false, 'missing budget should block provider-backed dry-run write');
  assert(budgetMissing.storage_config_dry_run.validation_result.issues.includes('budget_required_for_provider_backed_work'), 'missing budget should be visible as provider-backed block');

  return {
    selected_storage: compactDryRun(selected),
    app_local_fallback_available: compactDryRun(fallbackAvailable),
    app_local_fallback_acknowledged: compactDryRun(fallbackAcknowledged),
    acknowledgement_invalidated: compactDryRun(acknowledgementInvalidated),
    no_storage_selected: compactDryRun(noStorage),
    selected_storage_missing_unavailable: compactDryRun(missing),
    selected_storage_invalid_degraded: compactDryRun(degraded),
    budget_missing_provider_backed: compactDryRun(budgetMissing)
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
  budgetBytes,
  storageAuthority
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
    }),
    storageAuthority
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
      storageAuthority: {
        mode: 'app_local_fallback_acknowledged',
        acknowledgement_status: 'acknowledged',
        database_path: payloadPath,
        storage_root: path.dirname(payloadPath),
        budget_bytes: 1
      },
      storageBudgetBytes: 1,
      storageConfigDryRun: {
        target_path: path.join(root, 'renderer-safe', 'forged', 'storage-authority.json')
      }
    }, {
      db,
      databasePath: trustedPath,
      source: 'renderer',
      storageBudgetBytes: 4096
    });
    assert(readout.storage.database.path === trustedPath, 'renderer payload must not override trusted storage path');
    assert(readout.storage.state === 'configured_ready', `renderer payload should not override storage facts, got ${readout.storage.state}`);
    assert(readout.storage_authority.mode === 'selected_storage', 'renderer payload must not override storage authority mode');
    assert(readout.storage_authority.database_path === trustedPath, 'renderer payload must not override storage authority DB path');
    assert(readout.storage_authority.fallback_acknowledged === false, 'renderer payload must not forge fallback acknowledgement');
    assert(readout.budget.state === 'within_budget', 'renderer payload budget should not override trusted context budget');
    assert(readout.source.renderer_payload_storage_facts_ignored === true, 'renderer safety flag should be visible');
    assert(readout.storage_config_dry_run.target_path === path.join(projectRoot(), 'config', 'storage-authority.json'), 'renderer payload must not choose config target path');
    assert(readout.storage_config_dry_run.payload.selected_database_path === trustedPath, 'renderer payload must not choose storage DB path in dry-run payload');
    assert(readout.storage_config_dry_run.payload.selected_storage_root === path.dirname(trustedPath), 'renderer payload must not choose storage root in dry-run payload');
    assert(readout.storage_config_dry_run.payload.fallback_acknowledgement.status === 'not_required', 'renderer payload must not forge fallback acknowledgement in dry-run payload');
    assert(readout.storage_config_dry_run.payload.budget_bytes === 4096, 'renderer payload must not forge budget bytes in dry-run payload');
    assert(readout.storage_config_dry_run.renderer_payload_ignored === true, 'dry-run should flag ignored renderer config claims');
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

function compactAuthority(readout) {
  return {
    mode: readout.storage_authority.mode,
    selected: readout.storage_authority.selected,
    fallback_available: readout.storage_authority.fallback_available,
    fallback_acknowledged: readout.storage_authority.fallback_acknowledged,
    acknowledgement_status: readout.storage_authority.acknowledgement_status,
    acknowledgement_invalid_reason: readout.storage_authority.acknowledgement_invalid_reason,
    config_source: readout.storage_authority.config_source,
    validation_status: readout.storage_authority.validation_status,
    budget_source: readout.storage_authority.budget_source,
    budget_bytes: readout.storage_authority.budget_bytes,
    read_allowed: readout.storage_authority.read_allowed,
    write_allowed_if_enforced_later: readout.storage_authority.write_allowed_if_enforced_later,
    provider_movement_allowed_if_enforced_later: readout.storage_authority.provider_movement_allowed_if_enforced_later
  };
}

function compactDryRun(readout) {
  return {
    would_write: readout.storage_config_dry_run.would_write,
    target_path_basis: readout.storage_config_dry_run.target_path_basis,
    path_allowed: readout.storage_config_dry_run.path_allowed,
    validation_status: readout.storage_config_dry_run.validation_result.status,
    issues: readout.storage_config_dry_run.validation_result.issues,
    readback_status: readout.storage_config_dry_run.readback_simulation.status,
    renderer_payload_ignored: readout.storage_config_dry_run.renderer_payload_ignored,
    enforcement_state: readout.storage_config_dry_run.enforcement_state
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
