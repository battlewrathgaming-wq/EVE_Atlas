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
  assert(command(map, 'metadata.hydration_execution_policy.preview').runtime_context === 'hydration_execution_policy_readout', 'hydration execution policy should be classified as a readout');
  assert(command(map, 'metadata.hydration_execution_policy.preview').external_io_dependency === 'none', 'hydration execution policy readout should not declare External I/O dependency');
  assert(command(map, 'metadata.hydration_attention_runtime.preview').runtime_context === 'hydration_attention_runtime_posture_readout', 'hydration attention runtime posture should be classified as a readout');
  assert(command(map, 'metadata.hydration_attention_runtime.preview').external_io_dependency === 'none', 'hydration attention runtime posture readout should not declare External I/O dependency');
  assert(command(map, 'metadata.hydration_request_posture.preview').runtime_context === 'selected_id_hydration_request_posture_readout', 'hydration request posture should be classified as a selected-ID readout');
  assert(command(map, 'metadata.hydration_request_posture.preview').external_io_dependency === 'none', 'hydration request posture readout should not declare External I/O dependency');
  assert(command(map, 'metadata.hydration_request_posture.preview').enforcement_status === 'covered_read_only', 'hydration request posture should be covered read-only');
  assert(command(map, 'metadata.hydration_pickup_contract.preview').runtime_context === 'selected_id_hydration_pickup_contract_readout', 'hydration pickup contract should be classified as a selected-ID readout');
  assert(command(map, 'metadata.hydration_pickup_contract.preview').external_io_dependency === 'none', 'hydration pickup contract readout should not declare External I/O dependency');
  assert(command(map, 'metadata.hydration_pickup_contract.preview').enforcement_status === 'covered_read_only', 'hydration pickup contract should be covered read-only');
  assert(command(map, 'metadata.hydration_selected_id_real_execution_preflight.preview').runtime_context === 'selected_id_hydration_real_execution_preflight_readout', 'selected-ID real execution preflight should be classified as a selected-ID readout');
  assert(command(map, 'metadata.hydration_selected_id_real_execution_preflight.preview').storage_action_class === 'hydration_readability_repair', 'selected-ID real execution preflight should map to Hydration readability repair');
  assert(command(map, 'metadata.hydration_selected_id_real_execution_preflight.preview').external_io_dependency === 'none', 'selected-ID real execution preflight readout should not declare External I/O dependency because it calls no provider');
  assert(command(map, 'metadata.hydration_selected_id_real_execution_preflight.preview').enforcement_status === 'covered_read_only', 'selected-ID real execution preflight should be covered read-only');
  assert(command(map, 'metadata.selected_id_readability_repair.product_preflight').runtime_context === 'selected_id_product_readability_repair_preflight_readout', 'selected-ID product preflight should be classified as a product readability repair readout');
  assert(command(map, 'metadata.selected_id_readability_repair.product_preflight').storage_action_class === 'hydration_readability_repair', 'selected-ID product preflight should map to Hydration readability repair');
  assert(command(map, 'metadata.selected_id_readability_repair.product_preflight').external_io_dependency === 'none', 'selected-ID product preflight readout should not declare External I/O dependency because it calls no provider');
  assert(command(map, 'metadata.selected_id_readability_repair.product_preflight').enforcement_status === 'covered_read_only', 'selected-ID product preflight should be covered read-only');
  assert(command(map, 'metadata.selected_id_resolve_candidate.preview').runtime_context === 'selected_id_resolve_candidate_report_handoff_readout', 'selected-ID Resolve candidate preview should be classified as a report handoff readout');
  assert(command(map, 'metadata.selected_id_resolve_candidate.preview').storage_action_class === 'hydration_readability_repair', 'selected-ID Resolve candidate preview should map to Hydration readability repair');
  assert(command(map, 'metadata.selected_id_resolve_candidate.preview').external_io_dependency === 'none', 'selected-ID Resolve candidate preview should not declare External I/O dependency because it calls no provider');
  assert(command(map, 'metadata.selected_id_resolve_candidate.preview').enforcement_status === 'covered_read_only', 'selected-ID Resolve candidate preview should be covered read-only');
  assert(command(map, 'metadata.selected_id_readability_repair.execute').runtime_context === 'trusted_selected_id_readability_repair_execute', 'selected-ID readability repair execution should be classified as trusted execution');
  assert(command(map, 'metadata.selected_id_readability_repair.execute').storage_action_class === 'hydration_readability_repair', 'selected-ID readability repair execution should map to Hydration readability repair');
  assert(command(map, 'metadata.selected_id_readability_repair.execute').external_io_dependency === 'esi_provider_required', 'selected-ID readability repair execution should declare ESI provider dependency');
  assert(command(map, 'metadata.selected_id_readability_repair.execute').enforcement_status === 'covered_provider_and_storage_gated', 'selected-ID readability repair execution should be provider/storage gated');
  assert(command(map, 'metadata.local_sde_readiness.preview').runtime_context === 'local_sde_readiness_readout', 'local SDE readiness preview should be classified as a readout');
  assert(command(map, 'metadata.local_sde_readiness.preview').external_io_dependency === 'none', 'local SDE readiness preview should not declare External I/O dependency');
  assert(command(map, 'metadata.local_sde_readiness.preview').enforcement_status === 'covered_read_only', 'local SDE readiness preview should be covered read-only');
  assert(command(map, 'metadata.local_sde_source_posture.preview').runtime_context === 'local_sde_source_import_posture_readout', 'local SDE source posture preview should be classified as a readout');
  assert(command(map, 'metadata.local_sde_source_posture.preview').external_io_dependency === 'none', 'local SDE source posture readout should not declare External I/O dependency');
  assert(command(map, 'metadata.local_sde_source_posture.preview').enforcement_status === 'covered_read_only', 'local SDE source posture preview should be covered read-only');
  assert(command(map, 'sde.topology_import_rewrite_authority.proof').runtime_context === 'fixture_sde_topology_import_rewrite_authority_proof', 'SDE topology authority proof should be classified as fixture proof');
  assert(command(map, 'sde.topology_import_rewrite_authority.proof').external_io_dependency === 'none', 'SDE topology authority proof should not declare External I/O dependency');
  assert(command(map, 'sde.topology_import_rewrite_authority.proof').enforcement_status === 'fixture_only_non_production', 'SDE topology authority proof should be fixture-only');
  assert(command(map, 'sde.inventory_import_rewrite_authority.proof').runtime_context === 'fixture_sde_inventory_import_rewrite_authority_proof', 'SDE inventory authority proof should be classified as fixture proof');
  assert(command(map, 'sde.inventory_import_rewrite_authority.proof').external_io_dependency === 'none', 'SDE inventory authority proof should not declare External I/O dependency');
  assert(command(map, 'sde.inventory_import_rewrite_authority.proof').enforcement_status === 'fixture_only_non_production', 'SDE inventory authority proof should be fixture-only');
  assert(command(map, 'metadata.hydration_write_fixture_proof').runtime_context === 'fixture_hydration_write_proof', 'Hydration write fixture proof should be classified as fixture proof');
  assert(command(map, 'metadata.hydration_write_fixture_proof').external_io_dependency === 'none', 'Hydration write fixture proof should not declare provider dependency');
  assert(command(map, 'metadata.hydration_selected_id_execution_fixture_proof').runtime_context === 'fixture_selected_id_hydration_execution_proof', 'selected-ID Hydration execution fixture proof should be classified as fixture proof');
  assert(command(map, 'metadata.hydration_selected_id_execution_fixture_proof').external_io_dependency === 'none', 'selected-ID Hydration execution fixture proof should not declare provider dependency');
  assert(command(map, 'metadata.hydration_selected_id_execution_fixture_proof').enforcement_status === 'fixture_only_non_production', 'selected-ID Hydration execution fixture proof should be fixture-only');
  assert(command(map, 'metadata.hydration_selected_id_real_execution_proof').runtime_context === 'trusted_selected_id_real_hydration_execution_proof', 'selected-ID real Hydration execution proof should be classified as trusted proof');
  assert(command(map, 'metadata.hydration_selected_id_real_execution_proof').storage_action_class === 'hydration_readability_repair', 'selected-ID real Hydration execution proof should map to Hydration readability repair');
  assert(command(map, 'metadata.hydration_selected_id_real_execution_proof').external_io_dependency === 'esi_provider_required', 'selected-ID real Hydration execution proof should declare ESI provider dependency');
  assert(command(map, 'metadata.hydration_selected_id_real_execution_proof').enforcement_status === 'trusted_controlled_proof_only', 'selected-ID real Hydration execution proof should be trusted controlled proof only');
  assert(command(map, 'external_io.state_readout').runtime_context === 'external_io_state_readout', 'External I/O state readout should be classified as a readout');
  assert(command(map, 'external_io.state_readout').external_io_dependency === 'none', 'External I/O state readout should not declare provider dependency');
  assert(command(map, 'external_io.state_config_readback').runtime_context === 'external_io_config_readback', 'External I/O config readback should be classified as readback');
  assert(command(map, 'external_io.state_config_readback').external_io_dependency === 'none', 'External I/O config readback should not declare provider dependency');
  assert(command(map, 'external_io.state_config_write').runtime_context === 'external_io_operator_config_write', 'External I/O config write should be classified as operator config write');
  assert(command(map, 'external_io.state_config_write').external_io_dependency === 'none', 'External I/O config write should not declare provider dependency');
  assert(command(map, 'storage.authority_config.readback').runtime_context === 'storage_authority_config_readback', 'Storage authority config readback should be classified as readback');
  assert(command(map, 'storage.authority_config.readback').external_io_dependency === 'none', 'Storage authority config readback should not declare provider dependency');
  assert(command(map, 'storage.authority_config.write').runtime_context === 'storage_authority_operator_config_write', 'Storage authority config write should be classified as operator config write');
  assert(command(map, 'storage.authority_config.write').external_io_dependency === 'none', 'Storage authority config write should not declare provider dependency');

  for (const commandName of ['storage.authority_config.write_proof', 'storage.authority_config.acknowledgement_persistence_proof', 'external_io.state_persistence_proof', 'metadata.hydration_write_fixture_proof', 'metadata.hydration_selected_id_execution_fixture_proof']) {
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
  assert(command(map, 'support.artifact_creation_policy.preview').runtime_context === 'support_artifact_creation_policy_readout', 'support artifact creation policy should be classified as a readout');
  assert(command(map, 'support.artifact_creation_policy.preview').enforcement_status === 'covered_read_only', 'support artifact creation policy should be covered as read-only');
  assert(command(map, 'support.artifact_creation_policy.preview').external_io_dependency === 'none', 'support artifact creation policy should not declare External I/O dependency');
  assert(command(map, 'runtime.enforcement_boundary.preview').runtime_context === 'runtime_enforcement_boundary_readout', 'runtime enforcement boundary should be classified as a readout');
  assert(command(map, 'runtime.enforcement_boundary.preview').enforcement_status === 'read_only_non_enforcing_proof', 'runtime enforcement boundary should identify itself as a non-enforcing proof');
  assert(command(map, 'runtime.enforcement_boundary.preview').external_io_dependency === 'none', 'runtime enforcement boundary should not declare External I/O dependency');
  assert(command(map, 'runtime.queue_clock_posture.preview').runtime_context === 'queue_clock_posture_readout', 'queue/clock posture preview should be classified as a readout');
  assert(command(map, 'runtime.queue_clock_posture.preview').enforcement_status === 'read_only_non_enforcing_proof', 'queue/clock posture preview should identify itself as a non-enforcing proof');
  assert(command(map, 'runtime.queue_clock_posture.preview').external_io_dependency === 'none', 'queue/clock posture preview should not declare External I/O dependency');
  assert(command(map, 'runtime.watch_task_outcome_map.preview').storage_action_class === 'local_db_inspection', 'Watch/task outcome map preview should be a local DB inspection');
  assert(command(map, 'runtime.watch_task_outcome_map.preview').runtime_context === 'watch_task_outcome_map_readout', 'Watch/task outcome map preview should be classified as a readout');
  assert(command(map, 'runtime.watch_task_outcome_map.preview').enforcement_status === 'read_only_non_enforcing_proof', 'Watch/task outcome map preview should identify itself as a non-enforcing proof');
  assert(command(map, 'runtime.watch_task_outcome_map.preview').external_io_dependency === 'none', 'Watch/task outcome map preview should not declare External I/O dependency');
  assert(command(map, 'runtime.patient_packet_identity.preview').runtime_context === 'patient_packet_identity_readout', 'patient packet identity preview should be classified as a readout');
  assert(command(map, 'runtime.patient_packet_identity.preview').enforcement_status === 'read_only_non_enforcing_proof', 'patient packet identity preview should identify itself as a non-enforcing proof');
  assert(command(map, 'runtime.patient_packet_identity.preview').external_io_dependency === 'none', 'patient packet identity preview should not declare External I/O dependency');
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
