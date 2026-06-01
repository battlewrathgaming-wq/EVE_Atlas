const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const root = path.join(projectRoot(), '.tmp', 'enforcement-dry-run-fixture');
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    const ready = await buildFixtureMap(db, root, {
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
    const fallbackAcknowledged = await buildFixtureMap(db, root, {
      name: 'fallback-acknowledged',
      mode: 'fallback',
      source: 'fallback',
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
    const invalidated = await buildFixtureMap(db, root, {
      name: 'invalidated',
      mode: 'fallback',
      source: 'fallback',
      exists: true,
      budgetBytes: 4096,
      storageAuthority: {
        mode: 'acknowledgement_invalidated',
        fallback_available: true,
        acknowledgement_status: 'invalidated',
        acknowledgement_basis: 'fixture previous acknowledgement',
        acknowledgement_invalid_reason: 'fallback_path_basis_changed',
        config_source: 'fixture_acknowledgement',
        config_version: 1,
        budget_source: 'fixture_configured',
        budget_bytes: 4096
      }
    });
    const missing = await buildFixtureMap(db, root, {
      name: 'missing',
      mode: 'missing',
      source: 'configured',
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
    const hardLock = await buildFixtureMap(db, root, {
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

    verifyReadOnlyMap(ready);
    verifyReadyState(ready);
    verifyAcknowledgedFallback(fallbackAcknowledged);
    verifyInvalidatedAcknowledgement(invalidated);
    verifyMissingStorage(missing);
    verifyBudgetHardLock(hardLock);
    verifyCommandRegistration();
    verifyCoverageMetadata(ready);
    verifyCoverageGapFailureSignal();

    console.log(JSON.stringify({
      status: 'enforcement dry-run command-effect map verified',
      sample_ready: compactMap(ready),
      sample_acknowledged_fallback: compactMap(fallbackAcknowledged),
      sample_invalidated_acknowledgement: compactMap(invalidated),
      sample_missing_storage: compactMap(missing),
      sample_budget_hard_lock: compactMap(hardLock),
      coverage: compactCoverage(ready),
      reason_codes: ready.reason_codes,
      boundary: ready.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

async function buildFixtureMap(db, root, options) {
  const dbPath = path.join(root, options.name, 'atlas.sqlite');
  return invokeServiceCommand('storage.enforcement_dry_run.command_effect_map', {
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

function verifyReadOnlyMap(map) {
  assert(map.read_only === true, 'dry-run map should be read-only');
  assert(map.mutates_state === false, 'dry-run map should not mutate state');
  assert(map.enforcement_active === false, 'dry-run map should not activate enforcement');
  assert(map.enforcement_state === 'not_implemented_readout_only', 'dry-run map should not implement enforcement');
  assert(map.commands.every((entry) => entry.enforcement_active === false), 'command entries should not activate enforcement');
  assert(map.effect_classes.every((entry) => entry.enforcement_active === false), 'effect entries should not activate enforcement');
}

function verifyCoverageMetadata(map) {
  const registryCommands = listServiceCommands().map((entry) => entry.command);
  assert(map.coverage.status === 'complete', `coverage should be complete; gaps: ${map.coverage.gap_commands.join(', ')}`);
  assert(map.coverage.total_commands === registryCommands.length, 'coverage should count every service registry command');
  assert(map.coverage.covered_commands === registryCommands.length, 'coverage should cover every service registry command');
  assert(map.coverage.gap_commands.length === 0, 'coverage should not report gaps');
  for (const commandName of registryCommands) {
    assert(command(map, commandName), `${commandName} should have a dry-run classification row`);
  }

  assert(command(map, 'actor.watch').runtime_context === 'scheduled_or_direct_watch_collection', 'actor.watch should be classified as Watch collection');
  assert(command(map, 'system.radius.watch').runtime_context === 'scheduled_or_direct_watch_collection', 'system.radius.watch should be classified as Watch collection');
  assert(command(map, 'watch.executor.arm').runtime_context === 'background_watch_dispatch', 'watch.executor.arm should be classified as background Watch dispatch');
  assert(command(map, 'watch.executor.tick').runtime_context === 'background_watch_dispatch', 'watch.executor.tick should be classified as background Watch dispatch');
  assert(map.coverage.scheduled_background_watch_commands.includes('watch.executor.tick'), 'coverage summary should expose background Watch commands');

  for (const commandName of ['manual.discovery', 'manual.expansion', 'actor.watch', 'system.radius.watch', 'watch.executor.arm', 'watch.executor.tick', 'metadata.hydration', 'sde.build-lookups']) {
    assert(command(map, commandName).external_io_dependency !== 'none', `${commandName} should declare External I/O dependency separately`);
    assert(map.coverage.provider_or_external_io_commands.includes(commandName), `${commandName} should appear in provider/external I/O coverage summary`);
  }
  assert(command(map, 'manual.discovery').storage_action_class === 'zkill_discovery', 'manual.discovery should map to zKill discovery storage/action class');
  assert(command(map, 'manual.expansion').storage_action_class === 'esi_evidence_expansion', 'manual.expansion should map to ESI evidence expansion storage/action class');
  assert(command(map, 'metadata.hydration').storage_action_class === 'fast_view_metadata_hydration', 'metadata.hydration should map to fast hydration storage/action class');
  assert(command(map, 'sde.build-lookups').storage_action_class === 'background_hydration', 'sde.build-lookups should map to background hydration storage/action class');

  for (const commandName of ['storage.authority_config.write_proof', 'storage.authority_config.acknowledgement_persistence_proof']) {
    assert(command(map, commandName).enforcement_status === 'fixture_only_non_production', `${commandName} should be fixture-only/non-production`);
    assert(map.coverage.fixture_only_commands.includes(commandName), `${commandName} should appear in fixture-only coverage summary`);
  }
  assert(command(map, 'storage.enforcement_dry_run.command_effect_map').enforcement_status === 'read_only_non_enforcing_proof', 'dry-run command should identify itself as a non-enforcing proof');
  assert(command(map, 'storage.enforcement_dry_run.command_effect_map').enforcement_active === false, 'dry-run command should keep enforcement inactive');
  assert(command(map, 'storage.composed_gate_policy.preview').runtime_context === 'composed_gate_policy_readout', 'composed gate policy should be classified as a readout');
  assert(command(map, 'storage.composed_gate_policy.preview').enforcement_status === 'read_only_non_enforcing_proof', 'composed gate policy should identify itself as a non-enforcing proof');
  assert(command(map, 'storage.composed_gate_policy.preview').external_io_dependency === 'none', 'composed gate policy should not declare External I/O dependency');
  assert(command(map, 'support.artifact_path_authority.preview').runtime_context === 'support_artifact_path_authority_readout', 'support artifact path authority should be classified as a readout');
  assert(command(map, 'support.artifact_path_authority.preview').enforcement_status === 'covered_read_only', 'support artifact path authority should be covered as read-only');
  assert(command(map, 'support.artifact_path_authority.preview').external_io_dependency === 'none', 'support artifact path authority should not declare External I/O dependency');
}

function verifyCoverageGapFailureSignal() {
  const commands = [
    ...listServiceCommands(),
    {
      command: 'fixture.unclassified.command',
      classification: 'metadata-only',
      effects: ['local-data-mutation'],
      renderer_allowed: false,
      authority: { confirmation_required: false },
      description: 'fixture command used to prove coverage gap behavior'
    }
  ];
  const coverage = buildCommandCoverageReport(commands);
  assert(coverage.status === 'gaps', 'coverage report should expose missing classifications');
  assert(coverage.gap_commands.includes('fixture.unclassified.command'), 'coverage report should name missing service command classifications');
}

function verifyReadyState(map) {
  assert(map.storage_state === 'configured_storage_ready', 'ready fixture should be configured storage ready');
  assert(command(map, 'app.readiness').decision === 'would_allow', 'local readiness should be allowed when ready');
  assert(command(map, 'report.actor').decision === 'would_allow', 'local report should be allowed when ready');
  assert(command(map, 'manual.discovery').decision === 'would_allow', 'provider discovery should be allowed when ready subject to provider gate');
  assert(command(map, 'manual.expansion').decision === 'would_allow', 'ESI expansion should be allowed when ready subject to provider gate');
  assert(command(map, 'metadata.hydration').decision === 'would_allow', 'metadata hydration should be allowed when ready subject to provider gate');
  assert(command(map, 'runtime.db_snapshot.create').decision === 'conditional', 'snapshot support artifact should remain conditional on destination safety');
  assert(effect(map, 'pruning_deletion_execution').decision === 'conditional', 'destructive pruning execution should remain future-runway only');
  assert(command(map, 'manual.discovery').reason_codes.includes('provider_movement_required'), 'provider command should disclose provider requirement');
}

function verifyAcknowledgedFallback(map) {
  assert(map.storage_basis.storage_authority_mode === 'app_local_fallback_acknowledged', 'fallback should retain acknowledged mode');
  assert(map.storage_basis.selected === false, 'acknowledged fallback must not become selected storage');
  assert(map.storage_basis.fallback_acknowledged === true, 'fallback acknowledgement should be visible');
  assert(map.storage_state === 'configured_storage_ready', 'acknowledged fallback should behave as accepted storage posture');
  assert(command(map, 'manual.expansion').decision === 'would_allow', 'acknowledged fallback should allow provider-backed expansion subject to provider gate');
  assert(command(map, 'manual.expansion').reason_codes.includes('fallback_acknowledged_distinct_from_selected_storage'), 'fallback distinction reason should be present');
}

function verifyInvalidatedAcknowledgement(map) {
  assert(map.storage_basis.storage_authority_mode === 'acknowledgement_invalidated', 'invalidated fixture should expose invalidated mode');
  assert(command(map, 'manual.discovery').decision === 'would_block', 'invalidated acknowledgement should block provider discovery');
  assert(command(map, 'manual.expansion').decision === 'would_block', 'invalidated acknowledgement should block ESI expansion');
  assert(command(map, 'metadata.hydration').decision === 'would_block', 'invalidated acknowledgement should block hydration writes');
  assert(command(map, 'manual.expansion').reason_codes.includes('fallback_acknowledgement_invalidated'), 'invalidation reason should be present');
}

function verifyMissingStorage(map) {
  assert(map.storage_state === 'configured_storage_missing_unavailable', 'missing fixture should expose missing storage');
  assert(command(map, 'manual.discovery').decision === 'would_block', 'missing storage should block provider discovery');
  assert(command(map, 'manual.expansion').decision === 'would_block', 'missing storage should block ESI expansion');
  assert(command(map, 'report.actor').decision === 'conditional', 'local reports should remain conditional if safe handle exists');
  assert(command(map, 'retention.actions').decision === 'would_block', 'destructive pruning execution should block when storage missing');
  assert(command(map, 'manual.discovery').reason_codes.includes('storage_missing_unavailable'), 'missing reason should be present');
}

function verifyBudgetHardLock(map) {
  assert(map.storage_state === 'budget_hard_lock_full', 'hard lock fixture should expose budget hard-lock state');
  assert(command(map, 'app.readiness').decision === 'would_allow', 'safe local readiness should remain allowed under budget hard-lock');
  assert(command(map, 'watch.list').decision === 'would_allow', 'safe local watch list should remain allowed under budget hard-lock');
  assert(command(map, 'manual.discovery').decision === 'would_block', 'budget hard-lock should block provider discovery');
  assert(command(map, 'manual.expansion').decision === 'would_block', 'budget hard-lock should block ESI expansion');
  assert(command(map, 'metadata.hydration').decision === 'would_block', 'budget hard-lock should block hydration writes');
  assert(command(map, 'runtime.db_snapshot.create').decision === 'would_block', 'budget hard-lock should block snapshot support artifact writes');
  assert(command(map, 'manual.expansion').reason_codes.includes('budget_hard_lock_blocks_writes_provider_movement'), 'budget hard-lock reason should be present');
}

function verifyCommandRegistration() {
  const commandEntry = listServiceCommands().find((entry) => entry.command === 'storage.enforcement_dry_run.command_effect_map');
  assert(commandEntry, 'enforcement dry-run command should be listed');
  assert(commandEntry.classification === 'read-only', 'enforcement dry-run command should be read-only');
  assert(commandEntry.effects.includes('read-only'), 'enforcement dry-run command should declare read-only effect');
  assert(commandEntry.renderer_allowed === true, 'enforcement dry-run command should be renderer eligible');
}

function command(map, commandName) {
  const entry = map.commands.find((candidate) => candidate.command === commandName);
  assert(entry, `${commandName} should be represented`);
  return entry;
}

function effect(map, effectClass) {
  const entry = map.effect_classes.find((candidate) => candidate.effect_class === effectClass);
  assert(entry, `${effectClass} should be represented`);
  return entry;
}

function compactMap(map) {
  return {
    storage_state: map.storage_state,
    storage_authority_mode: map.storage_basis.storage_authority_mode,
    selected: map.storage_basis.selected,
    fallback_acknowledged: map.storage_basis.fallback_acknowledged,
    budget_state: map.storage_basis.budget_state,
    enforcement_active: map.enforcement_active,
    local_status: command(map, 'app.readiness').decision,
    local_report: command(map, 'report.actor').decision,
    provider_discovery: command(map, 'manual.discovery').decision,
    esi_expansion: command(map, 'manual.expansion').decision,
    hydration: command(map, 'metadata.hydration').decision,
    snapshot_support: command(map, 'runtime.db_snapshot.create').decision,
    pruning_execution: effect(map, 'pruning_deletion_execution').decision
  };
}

function compactCoverage(map) {
  return {
    status: map.coverage.status,
    total_commands: map.coverage.total_commands,
    covered_commands: map.coverage.covered_commands,
    gap_commands: map.coverage.gap_commands,
    provider_or_external_io_commands: map.coverage.provider_or_external_io_commands,
    fixture_only_commands: map.coverage.fixture_only_commands,
    scheduled_background_watch_commands: map.coverage.scheduled_background_watch_commands
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
    mutates_state: false,
    database: {
      path: dbPath,
      source,
      mode,
      mode_flags: {
        configured: source === 'configured',
        fallback: source !== 'configured',
        missing: !exists,
        outside_policy: false,
        demo_fixture: false
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
        status: 'ready'
      }
    },
    byte_usage: {
      database_bytes: databaseBytes,
      known_controlled_locations_bytes: controlledBytes
    }
  };
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
