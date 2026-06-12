const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const {
  invokeServiceCommand,
  listServiceCommands,
  registerIpcServiceHandlers
} = require('../src/main/services/serviceRegistry');
const { auraTempRoot } = require('../src/main/util/tempPaths');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    db.prepare(`
      INSERT INTO solar_systems (
        solar_system_id, solar_system_name, constellation_id, constellation_name,
        region_id, region_name, security_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);

    const commands = listServiceCommands();
    const readinessCommand = commands.find((entry) => entry.command === 'app.readiness');
    const prepareCommand = commands.find((entry) => entry.command === 'app.prepare');
    const liveGateCommand = commands.find((entry) => entry.command === 'live.gate');
    const externalIoStateReadoutCommand = commands.find((entry) => entry.command === 'external_io.state_readout');
    const externalIoStatePersistenceCommand = commands.find((entry) => entry.command === 'external_io.state_persistence_proof');
    const externalIoStateConfigReadbackCommand = commands.find((entry) => entry.command === 'external_io.state_config_readback');
    const externalIoStateConfigWriteCommand = commands.find((entry) => entry.command === 'external_io.state_config_write');
    const reportActorCommand = commands.find((entry) => entry.command === 'report.actor');
    const queueSelectionCommand = commands.find((entry) => entry.command === 'queue.selection');
    const retentionPreflightCommand = commands.find((entry) => entry.command === 'retention.preflight');
    const assessmentCreateCommand = commands.find((entry) => entry.command === 'assessment.create');
    const assessmentListCommand = commands.find((entry) => entry.command === 'assessment.list');
    const assessmentGetCommand = commands.find((entry) => entry.command === 'assessment.get');
    const scopeDefaultsCommand = commands.find((entry) => entry.command === 'scope.defaults');
    const scopeValidateCommand = commands.find((entry) => entry.command === 'scope.validate');
    const taskListCommand = commands.find((entry) => entry.command === 'task.list');
    const taskCancelCommand = commands.find((entry) => entry.command === 'task.cancel');
    const manualDiscoveryCommand = commands.find((entry) => entry.command === 'manual.discovery');
    const manualExpansionCommand = commands.find((entry) => entry.command === 'manual.expansion');
    const actorWatchCommand = commands.find((entry) => entry.command === 'actor.watch');
    const systemRadiusWatchCommand = commands.find((entry) => entry.command === 'system.radius.watch');
    const metadataHydrationCommand = commands.find((entry) => entry.command === 'metadata.hydration');
    const hydrationBacklogPreviewCommand = commands.find((entry) => entry.command === 'metadata.hydration_backlog.preview');
    const hydrationExecutionPolicyCommand = commands.find((entry) => entry.command === 'metadata.hydration_execution_policy.preview');
    const hydrationCandidatePreviewCommand = commands.find((entry) => entry.command === 'metadata.hydration_candidates.preview');
    const hydrationAttentionLensCommand = commands.find((entry) => entry.command === 'metadata.hydration_attention_lens.preview');
    const hydrationAttentionRuntimeCommand = commands.find((entry) => entry.command === 'metadata.hydration_attention_runtime.preview');
    const hydrationRequestPostureCommand = commands.find((entry) => entry.command === 'metadata.hydration_request_posture.preview');
    const hydrationPickupContractCommand = commands.find((entry) => entry.command === 'metadata.hydration_pickup_contract.preview');
    const hydrationSelectedIdRealExecutionPreflightCommand = commands.find((entry) => entry.command === 'metadata.hydration_selected_id_real_execution_preflight.preview');
    const selectedIdReadabilityRepairProductPreflightCommand = commands.find((entry) => entry.command === 'metadata.selected_id_readability_repair.product_preflight');
    const selectedIdResolveCandidatePreviewCommand = commands.find((entry) => entry.command === 'metadata.selected_id_resolve_candidate.preview');
    const selectedIdReadabilityRepairExecuteCommand = commands.find((entry) => entry.command === 'metadata.selected_id_readability_repair.execute');
    const localSdeReadinessCommand = commands.find((entry) => entry.command === 'metadata.local_sde_readiness.preview');
    const localSdeSourcePostureCommand = commands.find((entry) => entry.command === 'metadata.local_sde_source_posture.preview');
    const hydrationWriteFixtureCommand = commands.find((entry) => entry.command === 'metadata.hydration_write_fixture_proof');
    const hydrationSelectedIdFixtureCommand = commands.find((entry) => entry.command === 'metadata.hydration_selected_id_execution_fixture_proof');
    const hydrationSelectedIdRealExecutionCommand = commands.find((entry) => entry.command === 'metadata.hydration_selected_id_real_execution_proof');
    const sdeTopologyAuthorityProofCommand = commands.find((entry) => entry.command === 'sde.topology_import_rewrite_authority.proof');
    const sdeInventoryAuthorityProofCommand = commands.find((entry) => entry.command === 'sde.inventory_import_rewrite_authority.proof');
    const sdeBuildLookupsCommand = commands.find((entry) => entry.command === 'sde.build-lookups');
    const watchCreateCommand = commands.find((entry) => entry.command === 'watch.create');
    const watchListCommand = commands.find((entry) => entry.command === 'watch.list');
    const watchScheduleCommand = commands.find((entry) => entry.command === 'watch.schedule');
    const watchRecordRunCommand = commands.find((entry) => entry.command === 'watch.recordRun');
    const watchExecutorStatusCommand = commands.find((entry) => entry.command === 'watch.executor.status');
    const watchExecutorArmCommand = commands.find((entry) => entry.command === 'watch.executor.arm');
    const watchExecutorDisarmCommand = commands.find((entry) => entry.command === 'watch.executor.disarm');
    const watchExecutorTickCommand = commands.find((entry) => entry.command === 'watch.executor.tick');
    const storageAuthorityPreflightCommand = commands.find((entry) => entry.command === 'storage.authority_preflight');
    const storageSetupGateReadoutCommand = commands.find((entry) => entry.command === 'storage.setup_gate_readout');
    const storageAuthorityConfigWriteCommand = commands.find((entry) => entry.command === 'storage.authority_config.write_proof');
    const storageAuthorityConfigReadbackCommand = commands.find((entry) => entry.command === 'storage.authority_config.readback');
    const storageAuthorityOperatorConfigWriteCommand = commands.find((entry) => entry.command === 'storage.authority_config.write');
    const storageAcknowledgementPersistenceCommand = commands.find((entry) => entry.command === 'storage.authority_config.acknowledgement_persistence_proof');
    const enforcementDryRunCommand = commands.find((entry) => entry.command === 'storage.enforcement_dry_run.command_effect_map');
    const composedGatePolicyCommand = commands.find((entry) => entry.command === 'storage.composed_gate_policy.preview');
    const gateStackReadoutCommand = commands.find((entry) => entry.command === 'support.gate_stack_readout');
    const supportArtifactPathAuthorityCommand = commands.find((entry) => entry.command === 'support.artifact_path_authority.preview');
    const supportArtifactCreationPolicyCommand = commands.find((entry) => entry.command === 'support.artifact_creation_policy.preview');
    const supportArtifactContentsContractCommand = commands.find((entry) => entry.command === 'support.artifact_contents_contract.preview');
    const supportArtifactWriterGapMapCommand = commands.find((entry) => entry.command === 'support.artifact_writer_conformance_gap_map.preview');
    const traceLogRedactionPolicyCommand = commands.find((entry) => entry.command === 'support.trace_log_redaction_policy.preview');
    const apiRequestLogRedactionReadinessCommand = commands.find((entry) => entry.command === 'support.api_request_log_redaction_readiness.preview');
    const runtimeEnforcementBoundaryCommand = commands.find((entry) => entry.command === 'runtime.enforcement_boundary.preview');
    const runtimeHookTelemetryCommand = commands.find((entry) => entry.command === 'runtime.enforcement_hook_telemetry.readout');
    const queueClockPostureCommand = commands.find((entry) => entry.command === 'runtime.queue_clock_posture.preview');
    const watchTaskOutcomeMapCommand = commands.find((entry) => entry.command === 'runtime.watch_task_outcome_map.preview');
    const watchScopeAuthorityConformanceCommand = commands.find((entry) => entry.command === 'watch.scope_authority_conformance.preview');
    const watchAuthoredExecutionReadinessCommand = commands.find((entry) => entry.command === 'watch.authored_execution_readiness.preview');
    const systemRadiusSetupReadoutCommand = commands.find((entry) => entry.command === 'watch.system_radius_setup_readout.preview');
    const systemRadiusReadoutReadinessBridgeCommand = commands.find((entry) => entry.command === 'watch.system_radius_readout_readiness_bridge.preview');
    const watchRuntimePacketPlanCommand = commands.find((entry) => entry.command === 'watch.runtime_packet_plan.preview');
    const watchExecutorTickDryRunCommand = commands.find((entry) => entry.command === 'watch.executor_tick_dry_run.preview');
    const watchPacketDryRunDispatchParityCommand = commands.find((entry) => entry.command === 'watch.packet_dry_run_dispatch_parity.preview');
    const watchTaskCreationBoundaryCommand = commands.find((entry) => entry.command === 'watch.task_creation_boundary.preview');
    const watchSystemRadiusRunStubCommand = commands.find((entry) => entry.command === 'watch.system_radius_run_stub.preview');
    const watchBucketIdentityProjectionCommand = commands.find((entry) => entry.command === 'watch.bucket_identity_projection.preview');
    const watchBucketPickupPostureBridgeCommand = commands.find((entry) => entry.command === 'watch.bucket_pickup_posture_bridge.preview');
    const watchBucketDisposablePersistenceFixtureCommand = commands.find((entry) => entry.command === 'watch.bucket_disposable_persistence_fixture.preview');
    const watchBucketProductPersistenceCommand = commands.find((entry) => entry.command === 'watch.bucket_product_persistence.emit');
    const watchBucketProductPickupReadoutCommand = commands.find((entry) => entry.command === 'watch.bucket_product_pickup_readout.preview');
    const watchDiscoveryPickupPacketCommand = commands.find((entry) => entry.command === 'watch.discovery_pickup_packet_proof.preview');
    const discoveryPickupConsumerFixtureCommand = commands.find((entry) => entry.command === 'discovery.pickup_consumer_fixture.preview');
    const discoveryPickupConsumerHoldContractCommand = commands.find((entry) => entry.command === 'discovery.pickup_consumer_hold_contract.preview');
    const discoveryPickupSelectionContractCommand = commands.find((entry) => entry.command === 'discovery.pickup_selection_contract.preview');
    const discoveryProviderRoutePacketCommand = commands.find((entry) => entry.command === 'discovery.provider_route_packet.preview');
    const discoveryPickupExecutionBoundaryCommand = commands.find((entry) => entry.command === 'discovery.pickup_execution_boundary.preview');
    const discoveryDispatcherLeaseBoundaryCommand = commands.find((entry) => entry.command === 'discovery.dispatcher_lease_boundary.preview');
    const discoveryCandidateRefLandingBoundaryCommand = commands.find((entry) => entry.command === 'discovery.candidate_ref_landing_boundary.preview');
    const discoverySettledReceiptBoundaryCommand = commands.find((entry) => entry.command === 'discovery.settled_receipt_boundary.preview');
    const discoveryOutcomeDerivationCommand = commands.find((entry) => entry.command === 'discovery.outcome_derivation.preview');
    const discoveryReceiptProjectionFixtureCommand = commands.find((entry) => entry.command === 'discovery.receipt_projection_fixture.preview');
    const watchDiscoveryAcquisitionSplitFixtureCommand = commands.find((entry) => entry.command === 'watch.discovery_acquisition_split_fixture.preview');
    const discoveryAcquisitionToEvidenceHandoffFixtureCommand = commands.find((entry) => entry.command === 'discovery.acquisition_to_evidence_handoff_fixture.preview');
    const discoveryEsiExpansionIntakePostureCommand = commands.find((entry) => entry.command === 'discovery.esi_expansion_intake_posture.preview');
    const evidenceWriterLandingPackageFixtureCommand = commands.find((entry) => entry.command === 'evidence.writer_landing_package_fixture.preview');
    const watchMixedCollectorReplacementRouteCommand = commands.find((entry) => entry.command === 'watch.mixed_collector_replacement_route.preview');
    const watchActorReplacementParityCommand = commands.find((entry) => entry.command === 'watch.actor_replacement_parity.preview');
    const watchActorCompatibilityWrapperContractCommand = commands.find((entry) => entry.command === 'watch.actor_compatibility_wrapper_contract.preview');
    const watchActorCompatibilityWrapperAdapterFixtureCommand = commands.find((entry) => entry.command === 'watch.actor_compatibility_wrapper_adapter_fixture.preview');
    const watchActorCompatibilityWrapperCommand = commands.find((entry) => entry.command === 'watch.actor_compatibility_wrapper.preview');
    const watchActorDiscoveryRouteBodyFixtureCommand = commands.find((entry) => entry.command === 'watch.actor_discovery_route_body_fixture.preview');
    const watchActorDiscoveryHandoffContractCommand = commands.find((entry) => entry.command === 'watch.actor_discovery_handoff_contract.preview');
    const watchActorControlledRuntimeAdapterFixtureCommand = commands.find((entry) => entry.command === 'watch.actor_controlled_runtime_adapter_fixture.preview');
    const watchActorControlledAdapterDisabledCommand = commands.find((entry) => entry.command === 'watch.actor_controlled_adapter_disabled.preview');
    const watchOperatorConfirmationContractCommand = commands.find((entry) => entry.command === 'watch.operator_confirmation_contract.preview');
    const systemRadiusAuthoringPreflightCommand = commands.find((entry) => entry.command === 'watch.system_radius_authoring_preflight.preview');
    const systemRadiusAcceptancePayloadCommand = commands.find((entry) => entry.command === 'watch.system_radius_acceptance_payload.preview');
    const watchCreateMutationSafetyMapCommand = commands.find((entry) => entry.command === 'watch.create_mutation_safety_map.preview');
    const patientPacketIdentityCommand = commands.find((entry) => entry.command === 'runtime.patient_packet_identity.preview');
    const snapshotSettingsGetCommand = commands.find((entry) => entry.command === 'runtime.db_snapshot.settings.get');
    const snapshotSettingsUpdateCommand = commands.find((entry) => entry.command === 'runtime.db_snapshot.settings.update');
    assert(readinessCommand, 'app.readiness should be listed');
    assert(readinessCommand.classification === 'read-only', 'app.readiness should be read-only');
    assert(prepareCommand, 'app.prepare should be listed');
    assert(prepareCommand.classification === 'metadata-only', 'app.prepare should be metadata-only');
    assert(liveGateCommand, 'live.gate should be listed');
    assert(liveGateCommand.classification === 'read-only', 'live.gate should be read-only');
    assert(externalIoStateReadoutCommand, 'external_io.state_readout should be listed');
    assert(externalIoStateReadoutCommand.classification === 'read-only', 'external_io.state_readout should be read-only');
    assert(externalIoStateReadoutCommand.renderer_allowed === true, 'external_io.state_readout should be renderer eligible');
    assert(externalIoStatePersistenceCommand, 'external_io.state_persistence_proof should be listed');
    assert(externalIoStatePersistenceCommand.classification === 'metadata-only', 'external_io.state_persistence_proof should be metadata-only');
    assert(externalIoStatePersistenceCommand.renderer_allowed === false, 'external_io.state_persistence_proof should not be renderer eligible');
    assert(externalIoStateConfigReadbackCommand, 'external_io.state_config_readback should be listed');
    assert(externalIoStateConfigReadbackCommand.classification === 'read-only', 'external_io.state_config_readback should be read-only');
    assert(externalIoStateConfigReadbackCommand.renderer_allowed === true, 'external_io.state_config_readback should be renderer eligible');
    assert(externalIoStateConfigWriteCommand, 'external_io.state_config_write should be listed');
    assert(externalIoStateConfigWriteCommand.classification === 'metadata-only', 'external_io.state_config_write should be metadata-only');
    assert(externalIoStateConfigWriteCommand.renderer_allowed === false, 'external_io.state_config_write should not be renderer eligible');
    assert(reportActorCommand, 'report.actor should be listed');
    assert(reportActorCommand.classification === 'read-only', 'report.actor should be read-only');
    assert(queueSelectionCommand, 'queue.selection should be listed');
    assert(queueSelectionCommand.classification === 'read-only', 'queue.selection should be read-only');
    assert(retentionPreflightCommand, 'retention.preflight should be listed');
    assert(retentionPreflightCommand.classification === 'read-only', 'retention.preflight should be read-only');
    assert(assessmentCreateCommand, 'assessment.create should be listed');
    assert(assessmentCreateCommand.classification === 'metadata-only', 'assessment.create should be metadata-only');
    assert(assessmentListCommand, 'assessment.list should be listed');
    assert(assessmentListCommand.classification === 'read-only', 'assessment.list should be read-only');
    assert(assessmentGetCommand, 'assessment.get should be listed');
    assert(assessmentGetCommand.classification === 'read-only', 'assessment.get should be read-only');
    assert(scopeDefaultsCommand, 'scope.defaults should be listed');
    assert(scopeDefaultsCommand.classification === 'read-only', 'scope.defaults should be read-only');
    assert(scopeValidateCommand, 'scope.validate should be listed');
    assert(scopeValidateCommand.classification === 'read-only', 'scope.validate should be read-only');
    assert(taskListCommand, 'task.list should be listed');
    assert(taskListCommand.classification === 'read-only', 'task.list should be read-only');
    assert(taskCancelCommand, 'task.cancel should be listed');
    assert(taskCancelCommand.classification === 'runtime-control', 'task.cancel should be runtime-control');
    assert(manualDiscoveryCommand?.classification === 'evidence-creating', 'manual.discovery should be evidence-creating');
    assert(manualExpansionCommand?.classification === 'evidence-creating', 'manual.expansion should be evidence-creating');
    assert(actorWatchCommand?.classification === 'evidence-creating', 'actor.watch should be evidence-creating');
    assert(systemRadiusWatchCommand?.classification === 'evidence-creating', 'system.radius.watch should be evidence-creating');
    assert(metadataHydrationCommand?.classification === 'metadata-only', 'metadata.hydration should be metadata-only');
    assert(hydrationBacklogPreviewCommand?.classification === 'read-only', 'metadata.hydration_backlog.preview should be read-only');
    assert(hydrationBacklogPreviewCommand?.effects.includes('read-only'), 'metadata.hydration_backlog.preview should declare read-only effect');
    assert(hydrationBacklogPreviewCommand?.renderer_allowed === true, 'metadata.hydration_backlog.preview should be renderer eligible');
    assert(hydrationExecutionPolicyCommand?.classification === 'read-only', 'metadata.hydration_execution_policy.preview should be read-only');
    assert(hydrationExecutionPolicyCommand?.effects.includes('read-only'), 'metadata.hydration_execution_policy.preview should declare read-only effect');
    assert(hydrationExecutionPolicyCommand?.renderer_allowed === true, 'metadata.hydration_execution_policy.preview should be renderer eligible');
    assert(hydrationCandidatePreviewCommand?.classification === 'read-only', 'metadata.hydration_candidates.preview should be read-only');
    assert(hydrationCandidatePreviewCommand?.effects.includes('read-only'), 'metadata.hydration_candidates.preview should declare read-only effect');
    assert(hydrationCandidatePreviewCommand?.renderer_allowed === true, 'metadata.hydration_candidates.preview should be renderer eligible');
    assert(hydrationAttentionLensCommand?.classification === 'read-only', 'metadata.hydration_attention_lens.preview should be read-only');
    assert(hydrationAttentionLensCommand?.effects.includes('read-only'), 'metadata.hydration_attention_lens.preview should declare read-only effect');
    assert(hydrationAttentionLensCommand?.renderer_allowed === true, 'metadata.hydration_attention_lens.preview should be renderer eligible');
    assert(hydrationAttentionRuntimeCommand?.classification === 'read-only', 'metadata.hydration_attention_runtime.preview should be read-only');
    assert(hydrationAttentionRuntimeCommand?.effects.includes('read-only'), 'metadata.hydration_attention_runtime.preview should declare read-only effect');
    assert(hydrationAttentionRuntimeCommand?.renderer_allowed === true, 'metadata.hydration_attention_runtime.preview should be renderer eligible');
    assert(hydrationRequestPostureCommand?.classification === 'read-only', 'metadata.hydration_request_posture.preview should be read-only');
    assert(hydrationRequestPostureCommand?.effects.includes('read-only'), 'metadata.hydration_request_posture.preview should declare read-only effect');
    assert(hydrationRequestPostureCommand?.renderer_allowed === true, 'metadata.hydration_request_posture.preview should be renderer eligible');
    assert(hydrationPickupContractCommand?.classification === 'read-only', 'metadata.hydration_pickup_contract.preview should be read-only');
    assert(hydrationPickupContractCommand?.effects.includes('read-only'), 'metadata.hydration_pickup_contract.preview should declare read-only effect');
    assert(hydrationPickupContractCommand?.renderer_allowed === true, 'metadata.hydration_pickup_contract.preview should be renderer eligible');
    assert(hydrationSelectedIdRealExecutionPreflightCommand?.classification === 'read-only', 'metadata.hydration_selected_id_real_execution_preflight.preview should be read-only');
    assert(hydrationSelectedIdRealExecutionPreflightCommand?.effects.includes('read-only'), 'metadata.hydration_selected_id_real_execution_preflight.preview should declare read-only effect');
    assert(hydrationSelectedIdRealExecutionPreflightCommand?.renderer_allowed === true, 'metadata.hydration_selected_id_real_execution_preflight.preview should be renderer eligible');
    assert(selectedIdReadabilityRepairProductPreflightCommand?.classification === 'read-only', 'metadata.selected_id_readability_repair.product_preflight should be read-only');
    assert(selectedIdReadabilityRepairProductPreflightCommand?.effects.includes('read-only'), 'metadata.selected_id_readability_repair.product_preflight should declare read-only effect');
    assert(selectedIdReadabilityRepairProductPreflightCommand?.renderer_allowed === true, 'metadata.selected_id_readability_repair.product_preflight should be renderer eligible');
    assert(selectedIdResolveCandidatePreviewCommand?.classification === 'read-only', 'metadata.selected_id_resolve_candidate.preview should be read-only');
    assert(selectedIdResolveCandidatePreviewCommand?.effects.includes('read-only'), 'metadata.selected_id_resolve_candidate.preview should declare read-only effect');
    assert(selectedIdResolveCandidatePreviewCommand?.renderer_allowed === true, 'metadata.selected_id_resolve_candidate.preview should be renderer eligible');
    assert(selectedIdReadabilityRepairExecuteCommand?.classification === 'metadata-only', 'metadata.selected_id_readability_repair.execute should be metadata-only');
    assert(selectedIdReadabilityRepairExecuteCommand?.effects.includes('external-live-api'), 'metadata.selected_id_readability_repair.execute should declare external live API');
    assert(selectedIdReadabilityRepairExecuteCommand?.effects.includes('metadata-readability'), 'metadata.selected_id_readability_repair.execute should declare metadata readability');
    assert(selectedIdReadabilityRepairExecuteCommand?.renderer_allowed === false, 'metadata.selected_id_readability_repair.execute should not be renderer eligible');
    assert(localSdeReadinessCommand?.classification === 'read-only', 'metadata.local_sde_readiness.preview should be read-only');
    assert(localSdeReadinessCommand?.effects.includes('read-only'), 'metadata.local_sde_readiness.preview should declare read-only effect');
    assert(localSdeReadinessCommand?.renderer_allowed === true, 'metadata.local_sde_readiness.preview should be renderer eligible');
    assert(localSdeSourcePostureCommand?.classification === 'read-only', 'metadata.local_sde_source_posture.preview should be read-only');
    assert(localSdeSourcePostureCommand?.effects.includes('read-only'), 'metadata.local_sde_source_posture.preview should declare read-only effect');
    assert(localSdeSourcePostureCommand?.renderer_allowed === true, 'metadata.local_sde_source_posture.preview should be renderer eligible');
    assert(hydrationWriteFixtureCommand?.classification === 'metadata-only', 'metadata.hydration_write_fixture_proof should be metadata-only');
    assert(hydrationWriteFixtureCommand?.effects.includes('metadata-readability'), 'metadata.hydration_write_fixture_proof should declare metadata readability');
    assert(hydrationWriteFixtureCommand?.renderer_allowed === false, 'metadata.hydration_write_fixture_proof should not be renderer eligible');
    assert(hydrationSelectedIdFixtureCommand?.classification === 'metadata-only', 'metadata.hydration_selected_id_execution_fixture_proof should be metadata-only');
    assert(hydrationSelectedIdFixtureCommand?.effects.includes('metadata-readability'), 'metadata.hydration_selected_id_execution_fixture_proof should declare metadata readability');
    assert(hydrationSelectedIdFixtureCommand?.renderer_allowed === false, 'metadata.hydration_selected_id_execution_fixture_proof should not be renderer eligible');
    assert(hydrationSelectedIdRealExecutionCommand?.classification === 'metadata-only', 'metadata.hydration_selected_id_real_execution_proof should be metadata-only');
    assert(hydrationSelectedIdRealExecutionCommand?.effects.includes('external-live-api'), 'metadata.hydration_selected_id_real_execution_proof should declare external live API');
    assert(hydrationSelectedIdRealExecutionCommand?.effects.includes('metadata-readability'), 'metadata.hydration_selected_id_real_execution_proof should declare metadata readability');
    assert(hydrationSelectedIdRealExecutionCommand?.renderer_allowed === false, 'metadata.hydration_selected_id_real_execution_proof should not be renderer eligible');
    assert(sdeTopologyAuthorityProofCommand?.classification === 'metadata-only', 'sde topology authority proof should be metadata-only');
    assert(sdeTopologyAuthorityProofCommand?.effects.includes('local-data-mutation'), 'sde topology authority proof should declare fixture local mutation');
    assert(sdeTopologyAuthorityProofCommand?.renderer_allowed === false, 'sde topology authority proof should not be renderer eligible');
    assert(sdeInventoryAuthorityProofCommand?.classification === 'metadata-only', 'sde inventory authority proof should be metadata-only');
    assert(sdeInventoryAuthorityProofCommand?.effects.includes('local-data-mutation'), 'sde inventory authority proof should declare fixture local mutation');
    assert(sdeInventoryAuthorityProofCommand?.renderer_allowed === false, 'sde inventory authority proof should not be renderer eligible');
    assert(sdeBuildLookupsCommand?.classification === 'exclusive', 'sde.build-lookups should be exclusive');
    assert(watchCreateCommand?.classification === 'metadata-only', 'watch.create should be metadata-only');
    assert(watchListCommand?.classification === 'read-only', 'watch.list should be read-only');
    assert(watchScheduleCommand?.classification === 'read-only', 'watch.schedule should be read-only');
    assert(watchRecordRunCommand?.classification === 'metadata-only', 'watch.recordRun should be metadata-only');
    assert(watchExecutorStatusCommand?.classification === 'read-only', 'watch.executor.status should be read-only');
    assert(watchExecutorArmCommand?.classification === 'evidence-creating', 'watch.executor.arm should be evidence-creating');
    assert(watchExecutorDisarmCommand?.classification === 'metadata-only', 'watch.executor.disarm should be metadata-only');
    assert(watchExecutorTickCommand?.classification === 'evidence-creating', 'watch.executor.tick should be evidence-creating');
    assert(storageAuthorityPreflightCommand?.classification === 'read-only', 'storage authority preflight should be read-only');
    assert(storageSetupGateReadoutCommand?.classification === 'read-only', 'storage setup gate readout should be read-only');
    assert(storageAuthorityConfigWriteCommand?.classification === 'metadata-only', 'storage authority config write proof should be metadata-only');
    assert(storageAuthorityConfigWriteCommand?.renderer_allowed === false, 'storage authority config write proof should not be renderer eligible');
    assert(storageAuthorityConfigReadbackCommand?.classification === 'read-only', 'storage authority config readback should be read-only');
    assert(storageAuthorityConfigReadbackCommand?.renderer_allowed === true, 'storage authority config readback should be renderer eligible');
    assert(storageAuthorityOperatorConfigWriteCommand?.classification === 'metadata-only', 'storage authority config write should be metadata-only');
    assert(storageAuthorityOperatorConfigWriteCommand?.renderer_allowed === false, 'storage authority config write should not be renderer eligible');
    assert(storageAcknowledgementPersistenceCommand?.classification === 'metadata-only', 'storage acknowledgement persistence proof should be metadata-only');
    assert(storageAcknowledgementPersistenceCommand?.renderer_allowed === false, 'storage acknowledgement persistence proof should not be renderer eligible');
    assert(enforcementDryRunCommand?.classification === 'read-only', 'enforcement dry-run map should be read-only');
    assert(enforcementDryRunCommand?.renderer_allowed === true, 'enforcement dry-run map should be renderer eligible');
    assert(composedGatePolicyCommand?.classification === 'read-only', 'composed gate policy preview should be read-only');
    assert(composedGatePolicyCommand?.renderer_allowed === true, 'composed gate policy preview should be renderer eligible');
    assert(gateStackReadoutCommand?.classification === 'read-only', 'gate stack readout should be read-only');
    assert(supportArtifactPathAuthorityCommand?.classification === 'read-only', 'support artifact path authority should be read-only');
    assert(supportArtifactPathAuthorityCommand?.renderer_allowed === true, 'support artifact path authority should be renderer eligible');
    assert(supportArtifactCreationPolicyCommand?.classification === 'read-only', 'support artifact creation policy should be read-only');
    assert(supportArtifactCreationPolicyCommand?.renderer_allowed === true, 'support artifact creation policy should be renderer eligible');
    assert(supportArtifactContentsContractCommand?.classification === 'read-only', 'support artifact contents contract should be read-only');
    assert(supportArtifactContentsContractCommand?.renderer_allowed === true, 'support artifact contents contract should be renderer eligible');
    assert(supportArtifactWriterGapMapCommand?.classification === 'read-only', 'support artifact writer gap map should be read-only');
    assert(supportArtifactWriterGapMapCommand?.renderer_allowed === true, 'support artifact writer gap map should be renderer eligible');
    assert(traceLogRedactionPolicyCommand?.classification === 'read-only', 'trace/log redaction policy should be read-only');
    assert(traceLogRedactionPolicyCommand?.renderer_allowed === true, 'trace/log redaction policy should be renderer eligible');
    assert(apiRequestLogRedactionReadinessCommand?.classification === 'read-only', 'API request log redaction readiness should be read-only');
    assert(apiRequestLogRedactionReadinessCommand?.renderer_allowed === true, 'API request log redaction readiness should be renderer eligible');
    assert(runtimeEnforcementBoundaryCommand?.classification === 'read-only', 'runtime enforcement boundary preview should be read-only');
    assert(runtimeEnforcementBoundaryCommand?.renderer_allowed === true, 'runtime enforcement boundary preview should be renderer eligible');
    assert(runtimeHookTelemetryCommand?.classification === 'read-only', 'runtime hook telemetry readout should be read-only');
    assert(runtimeHookTelemetryCommand?.renderer_allowed === true, 'runtime hook telemetry readout should be renderer eligible');
    assert(queueClockPostureCommand?.classification === 'read-only', 'queue/clock posture preview should be read-only');
    assert(queueClockPostureCommand?.renderer_allowed === true, 'queue/clock posture preview should be renderer eligible');
    assert(watchTaskOutcomeMapCommand?.classification === 'read-only', 'Watch/task outcome map preview should be read-only');
    assert(watchTaskOutcomeMapCommand?.renderer_allowed === true, 'Watch/task outcome map preview should be renderer eligible');
    assert(watchScopeAuthorityConformanceCommand?.classification === 'read-only', 'Watch scope authority conformance preview should be read-only');
    assert(watchScopeAuthorityConformanceCommand?.renderer_allowed === true, 'Watch scope authority conformance preview should be renderer eligible');
    assert(watchAuthoredExecutionReadinessCommand?.classification === 'read-only', 'authored Watch execution readiness preview should be read-only');
    assert(watchAuthoredExecutionReadinessCommand?.renderer_allowed === true, 'authored Watch execution readiness preview should be renderer eligible');
    assert(systemRadiusSetupReadoutCommand?.classification === 'read-only', 'system/radius setup readout should be read-only');
    assert(systemRadiusSetupReadoutCommand?.renderer_allowed === true, 'system/radius setup readout should be renderer eligible');
    assert(systemRadiusReadoutReadinessBridgeCommand?.classification === 'read-only', 'system/radius readout/readiness bridge should be read-only');
    assert(systemRadiusReadoutReadinessBridgeCommand?.renderer_allowed === true, 'system/radius readout/readiness bridge should be renderer eligible');
    assert(watchRuntimePacketPlanCommand?.classification === 'read-only', 'Watch runtime packet plan preview should be read-only');
    assert(watchRuntimePacketPlanCommand?.renderer_allowed === true, 'Watch runtime packet plan preview should be renderer eligible');
    assert(watchExecutorTickDryRunCommand?.classification === 'read-only', 'Watch executor tick dry-run preview should be read-only');
    assert(watchExecutorTickDryRunCommand?.renderer_allowed === true, 'Watch executor tick dry-run preview should be renderer eligible');
    assert(watchPacketDryRunDispatchParityCommand?.classification === 'read-only', 'Watch packet/dry-run/dispatch parity preview should be read-only');
    assert(watchPacketDryRunDispatchParityCommand?.renderer_allowed === true, 'Watch packet/dry-run/dispatch parity preview should be renderer eligible');
    assert(watchTaskCreationBoundaryCommand?.classification === 'read-only', 'Watch task creation boundary preview should be read-only');
    assert(watchTaskCreationBoundaryCommand?.renderer_allowed === true, 'Watch task creation boundary preview should be renderer eligible');
    assert(watchSystemRadiusRunStubCommand?.classification === 'read-only', 'system/radius Watch-run stub preview should be read-only');
    assert(watchSystemRadiusRunStubCommand?.renderer_allowed === true, 'system/radius Watch-run stub preview should be renderer eligible');
    assert(watchBucketIdentityProjectionCommand?.classification === 'read-only', 'Watch bucket identity projection should be read-only');
    assert(watchBucketIdentityProjectionCommand?.renderer_allowed === true, 'Watch bucket identity projection should be renderer eligible');
    assert(watchBucketPickupPostureBridgeCommand?.classification === 'read-only', 'Watch bucket pickup posture bridge should be read-only');
    assert(watchBucketPickupPostureBridgeCommand?.renderer_allowed === true, 'Watch bucket pickup posture bridge should be renderer eligible');
    assert(watchBucketDisposablePersistenceFixtureCommand?.classification === 'read-only', 'Watch bucket disposable persistence fixture should be read-only');
    assert(watchBucketDisposablePersistenceFixtureCommand?.renderer_allowed === true, 'Watch bucket disposable persistence fixture should be renderer eligible');
    assert(watchBucketProductPersistenceCommand?.classification === 'metadata-only', 'Watch bucket product persistence should be metadata-only');
    assert(watchBucketProductPersistenceCommand?.renderer_allowed === false, 'Watch bucket product persistence should not be renderer eligible');
    assert(watchBucketProductPersistenceCommand?.effects.includes('local-data-mutation'), 'Watch bucket product persistence should declare local-data-mutation effect');
    assert(watchBucketProductPickupReadoutCommand?.classification === 'read-only', 'Watch bucket product pickup readout should be read-only');
    assert(watchBucketProductPickupReadoutCommand?.renderer_allowed === true, 'Watch bucket product pickup readout should be renderer eligible');
    assert(watchBucketProductPickupReadoutCommand?.effects.includes('read-only'), 'Watch bucket product pickup readout should declare read-only effect');
    assert(watchDiscoveryPickupPacketCommand?.classification === 'read-only', 'Watch Discovery pickup packet proof should be read-only');
    assert(watchDiscoveryPickupPacketCommand?.renderer_allowed === true, 'Watch Discovery pickup packet proof should be renderer eligible');
    assert(discoveryPickupConsumerFixtureCommand?.classification === 'read-only', 'Discovery pickup consumer fixture should be read-only');
    assert(discoveryPickupConsumerFixtureCommand?.renderer_allowed === true, 'Discovery pickup consumer fixture should be renderer eligible');
    assert(discoveryPickupConsumerHoldContractCommand?.classification === 'read-only', 'Discovery pickup consumer hold contract should be read-only');
    assert(discoveryPickupConsumerHoldContractCommand?.renderer_allowed === true, 'Discovery pickup consumer hold contract should be renderer eligible');
    assert(discoveryPickupSelectionContractCommand?.classification === 'read-only', 'Discovery pickup selection contract should be read-only');
    assert(discoveryPickupSelectionContractCommand?.renderer_allowed === true, 'Discovery pickup selection contract should be renderer eligible');
    assert(discoveryPickupSelectionContractCommand?.effects.includes('read-only'), 'Discovery pickup selection contract should declare read-only effect');
    assert(discoveryProviderRoutePacketCommand?.classification === 'read-only', 'Discovery provider route packet preview should be read-only');
    assert(discoveryProviderRoutePacketCommand?.renderer_allowed === true, 'Discovery provider route packet preview should be renderer eligible');
    assert(discoveryProviderRoutePacketCommand?.effects.includes('read-only'), 'Discovery provider route packet preview should declare read-only effect');
    assert(discoveryPickupExecutionBoundaryCommand?.classification === 'read-only', 'Discovery pickup execution boundary preview should be read-only');
    assert(discoveryPickupExecutionBoundaryCommand?.renderer_allowed === true, 'Discovery pickup execution boundary preview should be renderer eligible');
    assert(discoveryPickupExecutionBoundaryCommand?.effects.includes('read-only'), 'Discovery pickup execution boundary preview should declare read-only effect');
    assert(discoveryDispatcherLeaseBoundaryCommand?.classification === 'read-only', 'Discovery dispatcher lease boundary preview should be read-only');
    assert(discoveryDispatcherLeaseBoundaryCommand?.renderer_allowed === true, 'Discovery dispatcher lease boundary preview should be renderer eligible');
    assert(discoveryDispatcherLeaseBoundaryCommand?.effects.includes('read-only'), 'Discovery dispatcher lease boundary preview should declare read-only effect');
    assert(discoveryCandidateRefLandingBoundaryCommand?.classification === 'read-only', 'Discovery candidate ref landing boundary preview should be read-only');
    assert(discoveryCandidateRefLandingBoundaryCommand?.renderer_allowed === true, 'Discovery candidate ref landing boundary preview should be renderer eligible');
    assert(discoveryCandidateRefLandingBoundaryCommand?.effects.includes('read-only'), 'Discovery candidate ref landing boundary preview should declare read-only effect');
    assert(discoverySettledReceiptBoundaryCommand?.classification === 'read-only', 'Discovery settled receipt boundary preview should be read-only');
    assert(discoverySettledReceiptBoundaryCommand?.renderer_allowed === true, 'Discovery settled receipt boundary preview should be renderer eligible');
    assert(discoverySettledReceiptBoundaryCommand?.effects.includes('read-only'), 'Discovery settled receipt boundary preview should declare read-only effect');
    assert(discoveryOutcomeDerivationCommand?.classification === 'read-only', 'Discovery outcome derivation should be read-only');
    assert(discoveryOutcomeDerivationCommand?.renderer_allowed === true, 'Discovery outcome derivation should be renderer eligible');
    assert(discoveryReceiptProjectionFixtureCommand?.classification === 'read-only', 'Discovery receipt projection fixture should be read-only');
    assert(discoveryReceiptProjectionFixtureCommand?.renderer_allowed === true, 'Discovery receipt projection fixture should be renderer eligible');
    assert(watchDiscoveryAcquisitionSplitFixtureCommand?.classification === 'read-only', 'Watch Discovery acquisition split fixture should be read-only');
    assert(watchDiscoveryAcquisitionSplitFixtureCommand?.renderer_allowed === true, 'Watch Discovery acquisition split fixture should be renderer eligible');
    assert(discoveryAcquisitionToEvidenceHandoffFixtureCommand?.classification === 'read-only', 'Discovery acquisition to Evidence handoff fixture should be read-only');
    assert(discoveryAcquisitionToEvidenceHandoffFixtureCommand?.renderer_allowed === true, 'Discovery acquisition to Evidence handoff fixture should be renderer eligible');
    assert(discoveryEsiExpansionIntakePostureCommand?.classification === 'read-only', 'Discovery ESI expansion intake posture should be read-only');
    assert(discoveryEsiExpansionIntakePostureCommand?.renderer_allowed === true, 'Discovery ESI expansion intake posture should be renderer eligible');
    assert(evidenceWriterLandingPackageFixtureCommand?.classification === 'metadata-only', 'Evidence writer landing package fixture should be metadata-only');
    assert(evidenceWriterLandingPackageFixtureCommand?.renderer_allowed === false, 'Evidence writer landing package fixture should not be renderer eligible');
    assert(watchMixedCollectorReplacementRouteCommand?.classification === 'read-only', 'Watch mixed collector replacement route preview should be read-only');
    assert(watchMixedCollectorReplacementRouteCommand?.renderer_allowed === true, 'Watch mixed collector replacement route preview should be renderer eligible');
    assert(watchActorReplacementParityCommand?.classification === 'read-only', 'Actor Watch replacement parity preview should be read-only');
    assert(watchActorReplacementParityCommand?.renderer_allowed === true, 'Actor Watch replacement parity preview should be renderer eligible');
    assert(watchActorCompatibilityWrapperContractCommand?.classification === 'read-only', 'Actor Watch compatibility wrapper contract preview should be read-only');
    assert(watchActorCompatibilityWrapperContractCommand?.renderer_allowed === true, 'Actor Watch compatibility wrapper contract preview should be renderer eligible');
    assert(watchActorCompatibilityWrapperAdapterFixtureCommand?.classification === 'read-only', 'Actor Watch compatibility wrapper adapter fixture preview should be read-only');
    assert(watchActorCompatibilityWrapperAdapterFixtureCommand?.renderer_allowed === true, 'Actor Watch compatibility wrapper adapter fixture preview should be renderer eligible');
    assert(watchActorCompatibilityWrapperCommand?.classification === 'read-only', 'Actor Watch compatibility wrapper runtime preview should be read-only');
    assert(watchActorCompatibilityWrapperCommand?.renderer_allowed === true, 'Actor Watch compatibility wrapper runtime preview should be renderer eligible');
    assert(watchActorDiscoveryRouteBodyFixtureCommand?.classification === 'read-only', 'Actor Watch Discovery route body fixture preview should be read-only');
    assert(watchActorDiscoveryRouteBodyFixtureCommand?.renderer_allowed === true, 'Actor Watch Discovery route body fixture preview should be renderer eligible');
    assert(watchActorDiscoveryHandoffContractCommand?.classification === 'read-only', 'Actor Watch / Discovery handoff contract preview should be read-only');
    assert(watchActorDiscoveryHandoffContractCommand?.renderer_allowed === true, 'Actor Watch / Discovery handoff contract preview should be renderer eligible');
    assert(watchActorControlledRuntimeAdapterFixtureCommand?.classification === 'metadata-only', 'Actor Watch controlled runtime adapter fixture proof should be metadata-only');
    assert(watchActorControlledRuntimeAdapterFixtureCommand?.renderer_allowed === false, 'Actor Watch controlled runtime adapter fixture proof should not be renderer eligible');
    assert(watchActorControlledAdapterDisabledCommand?.classification === 'metadata-only', 'Actor Watch controlled adapter disabled seam should be metadata-only');
    assert(watchActorControlledAdapterDisabledCommand?.renderer_allowed === false, 'Actor Watch controlled adapter disabled seam should not be renderer eligible');
    assert(watchOperatorConfirmationContractCommand?.classification === 'read-only', 'Watch operator confirmation contract preview should be read-only');
    assert(watchOperatorConfirmationContractCommand?.renderer_allowed === true, 'Watch operator confirmation contract preview should be renderer eligible');
    assert(systemRadiusAuthoringPreflightCommand?.classification === 'read-only', 'system/radius authoring preflight should be read-only');
    assert(systemRadiusAuthoringPreflightCommand?.renderer_allowed === true, 'system/radius authoring preflight should be renderer eligible');
    assert(systemRadiusAcceptancePayloadCommand?.classification === 'read-only', 'system/radius acceptance payload should be read-only');
    assert(systemRadiusAcceptancePayloadCommand?.renderer_allowed === true, 'system/radius acceptance payload should be renderer eligible');
    assert(watchCreateMutationSafetyMapCommand?.classification === 'read-only', 'watch.create mutation safety map should be read-only');
    assert(watchCreateMutationSafetyMapCommand?.renderer_allowed === true, 'watch.create mutation safety map should be renderer eligible');
    assert(patientPacketIdentityCommand?.classification === 'read-only', 'patient packet identity preview should be read-only');
    assert(patientPacketIdentityCommand?.renderer_allowed === true, 'patient packet identity preview should be renderer eligible');
    assert(snapshotSettingsGetCommand?.classification === 'read-only', 'runtime snapshot settings get should be read-only');
    assert(snapshotSettingsUpdateCommand?.classification === 'metadata-only', 'runtime snapshot settings update should be metadata-only');

    const readiness = await invokeServiceCommand('app.readiness', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(readiness.checks.migrations_applied === true, 'readiness command should return migrated DB state');
    assert(readiness.app.name === 'AURA Atlas', 'readiness command should return app identity');

    const storagePreflight = await invokeServiceCommand('storage.authority_preflight', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(storagePreflight.read_only === true, 'storage authority preflight should declare read-only behavior');
    assert(storagePreflight.database.path.endsWith('service-registry.sqlite'), 'storage authority preflight should use context DB path');

    const externalIoStateReadout = await invokeServiceCommand('external_io.state_readout', {
      state: 'on',
      path: 'C:\\renderer-forged-external-io-state.json'
    }, {
      db,
      source: 'renderer'
    });
    assert(externalIoStateReadout.read_only === true, 'external_io.state_readout should be read-only');
    assert(externalIoStateReadout.state === 'off', 'renderer payload should not forge External I/O state');
    assert(externalIoStateReadout.provider_backed_posture === 'held_by_external_io', 'forged renderer state should not release provider-backed posture');

    const storageSetupGate = await invokeServiceCommand('storage.setup_gate_readout', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(storageSetupGate.read_only === true, 'storage setup gate readout should declare read-only behavior');
    assert(storageSetupGate.enforcement_state === 'not_implemented_readout_only', 'storage setup gate readout should not enforce lockout');

    const storageAuthorityReadback = await invokeServiceCommand('storage.authority_config.readback', {
      storageAuthority: {
        mode: 'app_local_fallback_acknowledged',
        acknowledgement_status: 'acknowledged',
        budget_bytes: 1
      },
      configPath: 'C:\\renderer-forged-storage-authority.json'
    }, {
      db,
      source: 'renderer'
    });
    assert(storageAuthorityReadback.read_only === true, 'storage authority config readback should be read-only');
    assert(storageAuthorityReadback.renderer_payload_ignored === true, 'storage authority readback should ignore renderer claims');
    assert(storageAuthorityReadback.filesystem_writes === 0, 'storage authority readback should not write files');

    const enforcementDryRun = await invokeServiceCommand('storage.enforcement_dry_run.command_effect_map', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(enforcementDryRun.read_only === true, 'enforcement dry-run map should be read-only');
    assert(enforcementDryRun.enforcement_active === false, 'enforcement dry-run map should not activate enforcement');

    const composedGatePolicy = await invokeServiceCommand('storage.composed_gate_policy.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(composedGatePolicy.read_only === true, 'composed gate policy preview should be read-only');
    assert(composedGatePolicy.enforcement_active === false, 'composed gate policy preview should not activate enforcement');
    assert(composedGatePolicy.authorization_semantics.would_allow_is_authorization === false, 'composed gate policy should not treat would_allow as authorization');

    const hydrationBacklog = await invokeServiceCommand('metadata.hydration_backlog.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(hydrationBacklog.read_only === true, 'hydration backlog preview should be read-only');
    assert(hydrationBacklog.provider_calls === 0, 'hydration backlog preview should not call providers');
    assert(hydrationBacklog.hydration_writes === 0, 'hydration backlog preview should not write hydration output');

    const hydrationExecutionPolicy = await invokeServiceCommand('metadata.hydration_execution_policy.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(hydrationExecutionPolicy.read_only === true, 'hydration execution policy should be read-only');
    assert(hydrationExecutionPolicy.provider_calls === 0, 'hydration execution policy should not call providers');
    assert(hydrationExecutionPolicy.eligibility_is_authorization === false, 'hydration execution policy should not authorize execution');

    const hydrationCandidatePreview = await invokeServiceCommand('metadata.hydration_candidates.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(hydrationCandidatePreview.read_only === true, 'hydration candidate preview should be read-only');
    assert(hydrationCandidatePreview.provider_calls === 0, 'hydration candidate preview should not call providers');
    assert(hydrationCandidatePreview.persisted_queue === false, 'hydration candidate preview should not persist a queue');

    const hydrationAttentionLens = await invokeServiceCommand('metadata.hydration_attention_lens.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(hydrationAttentionLens.read_only === true, 'hydration attention lens should be read-only');
    assert(hydrationAttentionLens.provider_calls === 0, 'hydration attention lens should not call providers');
    assert(hydrationAttentionLens.persisted_queue === false, 'hydration attention lens should not persist a queue');
    assert(hydrationAttentionLens.command_blocking_active === false, 'hydration attention lens should not activate command blocking');

    const hydrationAttentionRuntime = await invokeServiceCommand('metadata.hydration_attention_runtime.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(hydrationAttentionRuntime.read_only === true, 'hydration attention runtime posture should be read-only');
    assert(hydrationAttentionRuntime.provider_calls === 0, 'hydration attention runtime posture should not call providers');
    assert(hydrationAttentionRuntime.persisted_queue === false, 'hydration attention runtime posture should not persist a queue');
    assert(hydrationAttentionRuntime.command_blocking_active === false, 'hydration attention runtime posture should not activate command blocking');

    const localSdeReadiness = await invokeServiceCommand('metadata.local_sde_readiness.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(localSdeReadiness.read_only === true, 'local SDE readiness preview should be read-only');
    assert(localSdeReadiness.provider_calls === 0, 'local SDE readiness preview should not call providers');
    assert(localSdeReadiness.sde_downloads === 0, 'local SDE readiness preview should not download SDE');
    assert(localSdeReadiness.lookup_writes === 0, 'local SDE readiness preview should not write lookup tables');

    const localSdeSourcePosture = await invokeServiceCommand('metadata.local_sde_source_posture.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(localSdeSourcePosture.read_only === true, 'local SDE source posture should be read-only');
    assert(localSdeSourcePosture.provider_calls === 0, 'local SDE source posture should not call providers');
    assert(localSdeSourcePosture.sde_downloads === 0, 'local SDE source posture should not download SDE');
    assert(localSdeSourcePosture.sde_imports_started === 0, 'local SDE source posture should not import SDE');
    assert(localSdeSourcePosture.lookup_writes === 0, 'local SDE source posture should not write lookup tables');

    const gateStack = await invokeServiceCommand('support.gate_stack_readout', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(gateStack.read_only === true, 'gate stack readout should declare read-only behavior');
    assert(gateStack.external_io.implementation_state === 'operator_config_readout', 'gate stack readout should report External I/O operator config posture');
    assert(gateStack.external_io.enforced === false, 'gate stack readout should not enforce External I/O');

    const supportArtifactPathAuthority = await invokeServiceCommand('support.artifact_path_authority.preview', {
      outputDir: 'C:\\renderer-forged-support-output'
    }, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite'),
      source: 'renderer'
    });
    assert(supportArtifactPathAuthority.read_only === true, 'support artifact path authority should declare read-only behavior');
    assert(supportArtifactPathAuthority.renderer_payload_ignored === true, 'support artifact path authority should ignore renderer path claims');
    assert(supportArtifactPathAuthority.provider_calls === 0, 'support artifact path authority should not call providers');

    const supportArtifactCreationPolicy = await invokeServiceCommand('support.artifact_creation_policy.preview', {
      outputDir: 'C:\\renderer-forged-support-output',
      storageAuthority: { mode: 'selected_storage' },
      storageBudgetBytes: 1,
      trustedContext: true
    }, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite'),
      source: 'renderer'
    });
    assert(supportArtifactCreationPolicy.read_only === true, 'support artifact creation policy should declare read-only behavior');
    assert(supportArtifactCreationPolicy.renderer_payload_ignored === true, 'support artifact creation policy should ignore renderer forged claims');
    assert(supportArtifactCreationPolicy.creates_support_artifacts === false, 'support artifact creation policy should not create artifacts');
    assert(supportArtifactCreationPolicy.provider_calls === 0, 'support artifact creation policy should not call providers');

    const supportArtifactContentsContract = await invokeServiceCommand('support.artifact_contents_contract.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite'),
      source: 'renderer'
    });
    assert(supportArtifactContentsContract.read_only === true, 'support artifact contents contract should declare read-only behavior');
    assert(supportArtifactContentsContract.creates_support_artifacts === false, 'support artifact contents contract should not create artifacts');
    assert(supportArtifactContentsContract.provider_calls === 0, 'support artifact contents contract should not call providers');

    const supportArtifactWriterGapMap = await invokeServiceCommand('support.artifact_writer_conformance_gap_map.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite'),
      source: 'renderer'
    });
    assert(supportArtifactWriterGapMap.read_only === true, 'support artifact writer gap map should declare read-only behavior');
    assert(supportArtifactWriterGapMap.creates_support_artifacts === false, 'support artifact writer gap map should not create artifacts');
    assert(supportArtifactWriterGapMap.writer_behavior_changed === false, 'support artifact writer gap map should not change writer behavior');
    assert(supportArtifactWriterGapMap.provider_calls === 0, 'support artifact writer gap map should not call providers');

    const traceLogRedactionPolicy = await invokeServiceCommand('support.trace_log_redaction_policy.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite'),
      source: 'renderer'
    });
    assert(traceLogRedactionPolicy.read_only === true, 'trace/log redaction policy should declare read-only behavior');
    assert(traceLogRedactionPolicy.creates_support_artifacts === false, 'trace/log redaction policy should not create artifacts');
    assert(traceLogRedactionPolicy.writer_behavior_changed === false, 'trace/log redaction policy should not change writer behavior');
    assert(traceLogRedactionPolicy.provider_calls === 0, 'trace/log redaction policy should not call providers');

    const apiRequestLogRedactionReadiness = await invokeServiceCommand('support.api_request_log_redaction_readiness.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite'),
      source: 'renderer'
    });
    assert(apiRequestLogRedactionReadiness.read_only === true, 'API request log redaction readiness should declare read-only behavior');
    assert(apiRequestLogRedactionReadiness.api_request_log_writes === 0, 'API request log redaction readiness should not write API logs');
    assert(apiRequestLogRedactionReadiness.log_write_behavior_changed === false, 'API request log redaction readiness should not change log writes');
    assert(apiRequestLogRedactionReadiness.provider_calls === 0, 'API request log redaction readiness should not call providers');

    const runtimeEnforcementBoundary = await invokeServiceCommand('runtime.enforcement_boundary.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(runtimeEnforcementBoundary.read_only === true, 'runtime enforcement boundary preview should declare read-only behavior');
    assert(runtimeEnforcementBoundary.handler_dispatches === 0, 'runtime enforcement boundary preview should not dispatch handlers');
    assert(runtimeEnforcementBoundary.command_blocking_active === false, 'runtime enforcement boundary preview should not activate command blocking');
    assert(runtimeEnforcementBoundary.runtime_enforcement_active === false, 'runtime enforcement boundary preview should not activate enforcement');

    const runtimeHookTelemetry = await invokeServiceCommand('runtime.enforcement_hook_telemetry.readout', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(runtimeHookTelemetry.read_only === true, 'runtime hook telemetry readout should declare read-only behavior');
    assert(runtimeHookTelemetry.telemetry_persisted === false, 'runtime hook telemetry readout should not persist telemetry');
    assert(runtimeHookTelemetry.command_blocking_active === false, 'runtime hook telemetry readout should not activate command blocking');
    assert(runtimeHookTelemetry.active_runtime_enforcement === false, 'runtime hook telemetry readout should not activate enforcement');

    const queueClockPosture = await invokeServiceCommand('runtime.queue_clock_posture.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(queueClockPosture.read_only === true, 'queue/clock posture preview should declare read-only behavior');
    assert(queueClockPosture.provider_calls === 0, 'queue/clock posture preview should not call providers');
    assert(queueClockPosture.queue_dispatches === 0, 'queue/clock posture preview should not dispatch queues');
    assert(queueClockPosture.evidence_writes === 0, 'queue/clock posture preview should not write evidence');
    assert(queueClockPosture.hydration_writes === 0, 'queue/clock posture preview should not write hydration output');
    assert(queueClockPosture.runtime_enforcement_active === false, 'queue/clock posture preview should not activate enforcement');

    const watchTaskOutcomeMap = await invokeServiceCommand('runtime.watch_task_outcome_map.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchTaskOutcomeMap.read_only === true, 'Watch/task outcome map preview should declare read-only behavior');
    assert(watchTaskOutcomeMap.provider_calls === 0, 'Watch/task outcome map preview should not call providers');
    assert(watchTaskOutcomeMap.watch_dispatches === 0, 'Watch/task outcome map preview should not dispatch Watch execution');
    assert(watchTaskOutcomeMap.tasks_created === 0, 'Watch/task outcome map preview should not create tasks');
    assert(watchTaskOutcomeMap.evidence_writes === 0, 'Watch/task outcome map preview should not write Evidence/EVEidence');
    assert(watchTaskOutcomeMap.schema_changes === 0, 'Watch/task outcome map preview should not change schema');
    assert(watchTaskOutcomeMap.runtime_enforcement_active === false, 'Watch/task outcome map preview should not activate enforcement');

    const watchScopeAuthorityConformance = await invokeServiceCommand('watch.scope_authority_conformance.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchScopeAuthorityConformance.read_only === true, 'Watch scope authority conformance preview should declare read-only behavior');
    assert(watchScopeAuthorityConformance.provider_calls === 0, 'Watch scope authority conformance preview should not call providers');
    assert(watchScopeAuthorityConformance.watch_dispatches === 0, 'Watch scope authority conformance preview should not dispatch Watch execution');
    assert(watchScopeAuthorityConformance.tasks_created === 0, 'Watch scope authority conformance preview should not create tasks');
    assert(watchScopeAuthorityConformance.evidence_writes === 0, 'Watch scope authority conformance preview should not write Evidence/EVEidence');
    assert(watchScopeAuthorityConformance.schema_changes === 0, 'Watch scope authority conformance preview should not change schema');
    assert(watchScopeAuthorityConformance.runtime_enforcement_active === false, 'Watch scope authority conformance preview should not activate enforcement');

    const watchAuthoredExecutionReadiness = await invokeServiceCommand('watch.authored_execution_readiness.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchAuthoredExecutionReadiness.read_only === true, 'authored Watch execution readiness preview should declare read-only behavior');
    assert(watchAuthoredExecutionReadiness.provider_calls === 0, 'authored Watch execution readiness preview should not call providers');
    assert(watchAuthoredExecutionReadiness.watch_dispatches === 0, 'authored Watch execution readiness preview should not dispatch Watch execution');
    assert(watchAuthoredExecutionReadiness.tasks_created === 0, 'authored Watch execution readiness preview should not create tasks');
    assert(watchAuthoredExecutionReadiness.evidence_writes === 0, 'authored Watch execution readiness preview should not write Evidence/EVEidence');
    assert(watchAuthoredExecutionReadiness.schema_changes === 0, 'authored Watch execution readiness preview should not change schema');
    assert(watchAuthoredExecutionReadiness.runtime_enforcement_active === false, 'authored Watch execution readiness preview should not activate enforcement');

    const systemRadiusSetupReadout = await invokeServiceCommand('watch.system_radius_setup_readout.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(systemRadiusSetupReadout.read_only === true, 'system/radius setup readout should declare read-only behavior');
    assert(systemRadiusSetupReadout.provider_calls === 0, 'system/radius setup readout should not call providers');
    assert(systemRadiusSetupReadout.watch_dispatches === 0, 'system/radius setup readout should not dispatch Watch execution');
    assert(systemRadiusSetupReadout.tasks_created === 0, 'system/radius setup readout should not create tasks');
    assert(systemRadiusSetupReadout.evidence_writes === 0, 'system/radius setup readout should not write Evidence/EVEidence');
    assert(systemRadiusSetupReadout.hydration_writes === 0, 'system/radius setup readout should not write Hydration output');
    assert(systemRadiusSetupReadout.watch_mutations === 0, 'system/radius setup readout should not mutate Watch rows');
    assert(systemRadiusSetupReadout.schema_changes === 0, 'system/radius setup readout should not change schema');
    assert(systemRadiusSetupReadout.runtime_enforcement_active === false, 'system/radius setup readout should not activate enforcement');

    const systemRadiusReadoutReadinessBridge = await invokeServiceCommand('watch.system_radius_readout_readiness_bridge.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(systemRadiusReadoutReadinessBridge.read_only === true, 'system/radius readout/readiness bridge should declare read-only behavior');
    assert(systemRadiusReadoutReadinessBridge.provider_calls === 0, 'system/radius readout/readiness bridge should not call providers');
    assert(systemRadiusReadoutReadinessBridge.watch_dispatches === 0, 'system/radius readout/readiness bridge should not dispatch Watch execution');
    assert(systemRadiusReadoutReadinessBridge.tasks_created === 0, 'system/radius readout/readiness bridge should not create tasks');
    assert(systemRadiusReadoutReadinessBridge.evidence_writes === 0, 'system/radius readout/readiness bridge should not write Evidence/EVEidence');
    assert(systemRadiusReadoutReadinessBridge.hydration_writes === 0, 'system/radius readout/readiness bridge should not write Hydration output');
    assert(systemRadiusReadoutReadinessBridge.watch_mutations === 0, 'system/radius readout/readiness bridge should not mutate Watch rows');
    assert(systemRadiusReadoutReadinessBridge.schema_changes === 0, 'system/radius readout/readiness bridge should not change schema');
    assert(systemRadiusReadoutReadinessBridge.runtime_enforcement_active === false, 'system/radius readout/readiness bridge should not activate enforcement');

    const watchRuntimePacketPlan = await invokeServiceCommand('watch.runtime_packet_plan.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchRuntimePacketPlan.read_only === true, 'Watch runtime packet plan preview should declare read-only behavior');
    assert(watchRuntimePacketPlan.provider_calls === 0, 'Watch runtime packet plan preview should not call providers');
    assert(watchRuntimePacketPlan.watch_dispatches === 0, 'Watch runtime packet plan preview should not dispatch Watch execution');
    assert(watchRuntimePacketPlan.tasks_created === 0, 'Watch runtime packet plan preview should not create tasks');
    assert(watchRuntimePacketPlan.would_create_task === false, 'Watch runtime packet plan preview should not claim task creation');
    assert(watchRuntimePacketPlan.evidence_writes === 0, 'Watch runtime packet plan preview should not write Evidence/EVEidence');
    assert(watchRuntimePacketPlan.hydration_writes === 0, 'Watch runtime packet plan preview should not write Hydration output');
    assert(watchRuntimePacketPlan.watch_mutations === 0, 'Watch runtime packet plan preview should not mutate Watch rows');
    assert(watchRuntimePacketPlan.runtime_packet_rows_persisted === 0, 'Watch runtime packet plan preview should not persist packet rows');
    assert(watchRuntimePacketPlan.schema_changes === 0, 'Watch runtime packet plan preview should not change schema');
    assert(watchRuntimePacketPlan.runtime_enforcement_active === false, 'Watch runtime packet plan preview should not activate enforcement');

    const watchExecutorTickDryRun = await invokeServiceCommand('watch.executor_tick_dry_run.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchExecutorTickDryRun.read_only === true, 'Watch executor tick dry-run preview should declare read-only behavior');
    assert(watchExecutorTickDryRun.tick_called === false, 'Watch executor tick dry-run preview should not call tick');
    assert(watchExecutorTickDryRun.provider_calls === 0, 'Watch executor tick dry-run preview should not call providers');
    assert(watchExecutorTickDryRun.watch_dispatches === 0, 'Watch executor tick dry-run preview should not dispatch Watch execution');
    assert(watchExecutorTickDryRun.tasks_created === 0, 'Watch executor tick dry-run preview should not create tasks');
    assert(watchExecutorTickDryRun.would_create_task === false, 'Watch executor tick dry-run preview should not claim task creation');
    assert(watchExecutorTickDryRun.evidence_writes === 0, 'Watch executor tick dry-run preview should not write Evidence/EVEidence');
    assert(watchExecutorTickDryRun.hydration_writes === 0, 'Watch executor tick dry-run preview should not write Hydration output');
    assert(watchExecutorTickDryRun.watch_mutations === 0, 'Watch executor tick dry-run preview should not mutate Watch rows');
    assert(watchExecutorTickDryRun.schema_changes === 0, 'Watch executor tick dry-run preview should not change schema');
    assert(watchExecutorTickDryRun.runtime_enforcement_active === false, 'Watch executor tick dry-run preview should not activate enforcement');

    const watchPacketDryRunDispatchParity = await invokeServiceCommand('watch.packet_dry_run_dispatch_parity.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchPacketDryRunDispatchParity.read_only === true, 'Watch packet/dry-run/dispatch parity preview should declare read-only behavior');
    assert(watchPacketDryRunDispatchParity.provider_calls === 0, 'Watch packet/dry-run/dispatch parity preview should not call providers');
    assert(watchPacketDryRunDispatchParity.watch_dispatches === 0, 'Watch packet/dry-run/dispatch parity preview should not dispatch Watch execution');
    assert(watchPacketDryRunDispatchParity.tasks_created === 0, 'Watch packet/dry-run/dispatch parity preview should not create tasks');
    assert(watchPacketDryRunDispatchParity.dispatch_runner_invocations === 0, 'Watch packet/dry-run/dispatch parity preview should not invoke dispatch runners');
    assert(watchPacketDryRunDispatchParity.evidence_writes === 0, 'Watch packet/dry-run/dispatch parity preview should not write Evidence/EVEidence');
    assert(watchPacketDryRunDispatchParity.hydration_writes === 0, 'Watch packet/dry-run/dispatch parity preview should not write Hydration output');
    assert(watchPacketDryRunDispatchParity.watch_mutations === 0, 'Watch packet/dry-run/dispatch parity preview should not mutate Watch rows');
    assert(watchPacketDryRunDispatchParity.schema_changes === 0, 'Watch packet/dry-run/dispatch parity preview should not change schema');
    assert(watchPacketDryRunDispatchParity.runtime_enforcement_active === false, 'Watch packet/dry-run/dispatch parity preview should not activate enforcement');

    const watchTaskCreationBoundary = await invokeServiceCommand('watch.task_creation_boundary.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchTaskCreationBoundary.read_only === true, 'Watch task creation boundary preview should declare read-only behavior');
    assert(watchTaskCreationBoundary.provider_calls === 0, 'Watch task creation boundary preview should not call providers');
    assert(watchTaskCreationBoundary.watch_dispatches === 0, 'Watch task creation boundary preview should not dispatch Watch execution');
    assert(watchTaskCreationBoundary.tasks_created === 0, 'Watch task creation boundary preview should not create tasks');
    assert(watchTaskCreationBoundary.task_runner_untouched === true, 'Watch task creation boundary preview should not touch TaskRunner');
    assert(Array.isArray(watchTaskCreationBoundary.task_runner_methods_called) && watchTaskCreationBoundary.task_runner_methods_called.length === 0, 'Watch task creation boundary preview should call no TaskRunner methods');
    assert(watchTaskCreationBoundary.evidence_writes === 0, 'Watch task creation boundary preview should not write Evidence/EVEidence');
    assert(watchTaskCreationBoundary.hydration_writes === 0, 'Watch task creation boundary preview should not write Hydration output');
    assert(watchTaskCreationBoundary.watch_mutations === 0, 'Watch task creation boundary preview should not mutate Watch rows');
    assert(watchTaskCreationBoundary.schema_changes === 0, 'Watch task creation boundary preview should not change schema');
    assert(watchTaskCreationBoundary.runtime_enforcement_active === false, 'Watch task creation boundary preview should not activate enforcement');

    const watchSystemRadiusRunStub = await invokeServiceCommand('watch.system_radius_run_stub.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchSystemRadiusRunStub.read_only === true, 'system/radius Watch-run stub preview should declare read-only behavior');
    assert(watchSystemRadiusRunStub.provider_calls === 0, 'system/radius Watch-run stub preview should not call providers');
    assert(watchSystemRadiusRunStub.watch_dispatches === 0, 'system/radius Watch-run stub preview should not dispatch Watch execution');
    assert(watchSystemRadiusRunStub.watch_executor_tick_called === false, 'system/radius Watch-run stub preview should not call executor tick');
    assert(watchSystemRadiusRunStub.tasks_created === 0, 'system/radius Watch-run stub preview should not create tasks');
    assert(watchSystemRadiusRunStub.bucket_rows_created === 0, 'system/radius Watch-run stub preview should not create bucket rows');
    assert(watchSystemRadiusRunStub.discovery_pickup_packets_created === 0, 'system/radius Watch-run stub preview should not create Discovery pickup packets');
    assert(watchSystemRadiusRunStub.discovery_refs_mutated === 0, 'system/radius Watch-run stub preview should not mutate Discovery refs');
    assert(watchSystemRadiusRunStub.evidence_writes === 0, 'system/radius Watch-run stub preview should not write Evidence/EVEidence');
    assert(watchSystemRadiusRunStub.hydration_writes === 0, 'system/radius Watch-run stub preview should not write Hydration output');
    assert(watchSystemRadiusRunStub.watch_mutations === 0, 'system/radius Watch-run stub preview should not mutate Watch rows');
    assert(watchSystemRadiusRunStub.cadence_mutations === 0, 'system/radius Watch-run stub preview should not mutate cadence');
    assert(watchSystemRadiusRunStub.schema_changes === 0, 'system/radius Watch-run stub preview should not change schema');
    assert(watchSystemRadiusRunStub.runtime_enforcement_active === false, 'system/radius Watch-run stub preview should not activate enforcement');

    const watchBucketIdentityProjection = await invokeServiceCommand('watch.bucket_identity_projection.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchBucketIdentityProjection.read_only === true, 'Watch bucket identity projection should declare read-only behavior');
    assert(watchBucketIdentityProjection.fixture_only === true, 'Watch bucket identity projection should be fixture-only');
    assert(watchBucketIdentityProjection.projection_only === true, 'Watch bucket identity projection should be projection-only');
    assert(watchBucketIdentityProjection.provider_calls === 0, 'Watch bucket identity projection should not call providers');
    assert(watchBucketIdentityProjection.provider_packets === 0, 'Watch bucket identity projection should not create provider packets');
    assert(watchBucketIdentityProjection.discovery_pickup_started === false, 'Watch bucket identity projection should not start Discovery pickup');
    assert(watchBucketIdentityProjection.bucket_rows_persisted === 0, 'Watch bucket identity projection should not persist bucket rows');
    assert(watchBucketIdentityProjection.durable_bucket_rows_written === 0, 'Watch bucket identity projection should not write durable bucket rows');
    assert(watchBucketIdentityProjection.fetch_runs_as_bucket_state === false, 'Watch bucket identity projection should not use fetch_runs as bucket state');
    assert(watchBucketIdentityProjection.discovered_killmail_refs_as_bucket_state === false, 'Watch bucket identity projection should not use discovered refs as bucket state');
    assert(watchBucketIdentityProjection.discovery_refs_mutated === 0, 'Watch bucket identity projection should not mutate Discovery refs');
    assert(watchBucketIdentityProjection.evidence_writes === 0, 'Watch bucket identity projection should not write Evidence/EVEidence');
    assert(watchBucketIdentityProjection.hydration_writes === 0, 'Watch bucket identity projection should not write Hydration output');
    assert(watchBucketIdentityProjection.watch_mutations === 0, 'Watch bucket identity projection should not mutate Watch rows');
    assert(watchBucketIdentityProjection.cadence_mutations === 0, 'Watch bucket identity projection should not mutate cadence');
    assert(watchBucketIdentityProjection.watch_executor_tick_called === false, 'Watch bucket identity projection should not call executor tick');
    assert(watchBucketIdentityProjection.schema_changes === 0, 'Watch bucket identity projection should not change schema');
    assert(watchBucketIdentityProjection.runtime_enforcement_active === false, 'Watch bucket identity projection should not activate enforcement');

    const watchBucketPickupPostureBridge = await invokeServiceCommand('watch.bucket_pickup_posture_bridge.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchBucketPickupPostureBridge.read_only === true, 'Watch bucket pickup posture bridge should declare read-only behavior');
    assert(watchBucketPickupPostureBridge.fixture_only === true, 'Watch bucket pickup posture bridge should be fixture-only');
    assert(watchBucketPickupPostureBridge.projection_only === true, 'Watch bucket pickup posture bridge should be projection-only');
    assert(watchBucketPickupPostureBridge.provider_calls === 0, 'Watch bucket pickup posture bridge should not call providers');
    assert(watchBucketPickupPostureBridge.provider_packets === 0, 'Watch bucket pickup posture bridge should not create provider packets');
    assert(watchBucketPickupPostureBridge.discovery_pickup_started === false, 'Watch bucket pickup posture bridge should not start Discovery pickup');
    assert(watchBucketPickupPostureBridge.discovery_pickup_packets_created === 0, 'Watch bucket pickup posture bridge should not create Discovery pickup packets');
    assert(watchBucketPickupPostureBridge.bucket_rows_persisted === 0, 'Watch bucket pickup posture bridge should not persist bucket rows');
    assert(watchBucketPickupPostureBridge.durable_bucket_rows_written === 0, 'Watch bucket pickup posture bridge should not write durable bucket rows');
    assert(watchBucketPickupPostureBridge.fetch_runs_as_bucket_state === false, 'Watch bucket pickup posture bridge should not use fetch_runs as bucket state');
    assert(watchBucketPickupPostureBridge.discovered_killmail_refs_as_bucket_state === false, 'Watch bucket pickup posture bridge should not use discovered refs as bucket state');
    assert(watchBucketPickupPostureBridge.candidate_refs_written === 0, 'Watch bucket pickup posture bridge should not write candidate refs');
    assert(watchBucketPickupPostureBridge.discovery_refs_mutated === 0, 'Watch bucket pickup posture bridge should not mutate Discovery refs');
    assert(watchBucketPickupPostureBridge.evidence_writes === 0, 'Watch bucket pickup posture bridge should not write Evidence/EVEidence');
    assert(watchBucketPickupPostureBridge.hydration_writes === 0, 'Watch bucket pickup posture bridge should not write Hydration output');
    assert(watchBucketPickupPostureBridge.watch_mutations === 0, 'Watch bucket pickup posture bridge should not mutate Watch rows');
    assert(watchBucketPickupPostureBridge.cadence_mutations === 0, 'Watch bucket pickup posture bridge should not mutate cadence');
    assert(watchBucketPickupPostureBridge.watch_executor_tick_called === false, 'Watch bucket pickup posture bridge should not call executor tick');
    assert(watchBucketPickupPostureBridge.schema_changes === 0, 'Watch bucket pickup posture bridge should not change schema');
    assert(watchBucketPickupPostureBridge.runtime_enforcement_active === false, 'Watch bucket pickup posture bridge should not activate enforcement');

    const watchBucketDisposablePersistenceFixture = await invokeServiceCommand('watch.bucket_disposable_persistence_fixture.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchBucketDisposablePersistenceFixture.read_only === true, 'Watch bucket disposable persistence fixture should declare read-only behavior');
    assert(watchBucketDisposablePersistenceFixture.fixture_only === true, 'Watch bucket disposable persistence fixture should be fixture-only');
    assert(watchBucketDisposablePersistenceFixture.disposable_only === true, 'Watch bucket disposable persistence fixture should be disposable-only');
    assert(watchBucketDisposablePersistenceFixture.operator_corpus_mutated === false, 'Watch bucket disposable persistence fixture should not mutate operator corpus');
    assert(watchBucketDisposablePersistenceFixture.product_schema_updated === false, 'Watch bucket disposable persistence fixture should not update product schema');
    assert(watchBucketDisposablePersistenceFixture.fixture_schema_accepted_as_product_schema === false, 'Watch bucket disposable persistence fixture should not accept fixture schema as product schema');
    assert(watchBucketDisposablePersistenceFixture.provider_calls === 0, 'Watch bucket disposable persistence fixture should not call providers');
    assert(watchBucketDisposablePersistenceFixture.provider_packets === 0, 'Watch bucket disposable persistence fixture should not create provider packets');
    assert(watchBucketDisposablePersistenceFixture.discovery_pickup_started === false, 'Watch bucket disposable persistence fixture should not start Discovery pickup');
    assert(watchBucketDisposablePersistenceFixture.discovery_pickup_packets_created === 0, 'Watch bucket disposable persistence fixture should not create Discovery pickup packets');
    assert(watchBucketDisposablePersistenceFixture.durable_bucket_rows_written === 0, 'Watch bucket disposable persistence fixture should not write durable bucket rows');
    assert(watchBucketDisposablePersistenceFixture.fetch_runs_as_bucket_state === false, 'Watch bucket disposable persistence fixture should not use fetch_runs as bucket state');
    assert(watchBucketDisposablePersistenceFixture.discovered_killmail_refs_as_bucket_state === false, 'Watch bucket disposable persistence fixture should not use discovered refs as bucket state');
    assert(watchBucketDisposablePersistenceFixture.candidate_refs_written === 0, 'Watch bucket disposable persistence fixture should not write candidate refs');
    assert(watchBucketDisposablePersistenceFixture.discovery_refs_mutated === 0, 'Watch bucket disposable persistence fixture should not mutate Discovery refs');
    assert(watchBucketDisposablePersistenceFixture.evidence_writes === 0, 'Watch bucket disposable persistence fixture should not write Evidence/EVEidence');
    assert(watchBucketDisposablePersistenceFixture.hydration_writes === 0, 'Watch bucket disposable persistence fixture should not write Hydration output');
    assert(watchBucketDisposablePersistenceFixture.watch_mutations === 0, 'Watch bucket disposable persistence fixture should not mutate Watch rows');
    assert(watchBucketDisposablePersistenceFixture.cadence_mutations === 0, 'Watch bucket disposable persistence fixture should not mutate cadence');
    assert(watchBucketDisposablePersistenceFixture.schema_changes === 0, 'Watch bucket disposable persistence fixture should not change schema');
    assert(watchBucketDisposablePersistenceFixture.runtime_enforcement_active === false, 'Watch bucket disposable persistence fixture should not activate enforcement');

    const watchDiscoveryPickupPacket = await invokeServiceCommand('watch.discovery_pickup_packet_proof.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchDiscoveryPickupPacket.read_only === true, 'Watch Discovery pickup packet proof should declare read-only behavior');
    assert(watchDiscoveryPickupPacket.provider_calls === 0, 'Watch Discovery pickup packet proof should not call providers');
    assert(watchDiscoveryPickupPacket.watch_dispatches === 0, 'Watch Discovery pickup packet proof should not dispatch Watch execution');
    assert(watchDiscoveryPickupPacket.tasks_created === 0, 'Watch Discovery pickup packet proof should not create tasks');
    assert(Array.isArray(watchDiscoveryPickupPacket.task_runner_methods_called) && watchDiscoveryPickupPacket.task_runner_methods_called.length === 0, 'Watch Discovery pickup packet proof should call no TaskRunner methods');
    assert(watchDiscoveryPickupPacket.discovery_refs_mutated === 0, 'Watch Discovery pickup packet proof should not mutate Discovery refs');
    assert(watchDiscoveryPickupPacket.evidence_writes === 0, 'Watch Discovery pickup packet proof should not write Evidence/EVEidence');
    assert(watchDiscoveryPickupPacket.hydration_writes === 0, 'Watch Discovery pickup packet proof should not write Hydration output');
    assert(watchDiscoveryPickupPacket.watch_mutations === 0, 'Watch Discovery pickup packet proof should not mutate Watch rows');
    assert(watchDiscoveryPickupPacket.schema_changes === 0, 'Watch Discovery pickup packet proof should not change schema');
    assert(watchDiscoveryPickupPacket.runtime_enforcement_active === false, 'Watch Discovery pickup packet proof should not activate enforcement');

    const discoveryPickupConsumerFixture = await invokeServiceCommand('discovery.pickup_consumer_fixture.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(discoveryPickupConsumerFixture.read_only === true, 'Discovery pickup consumer fixture should declare read-only behavior');
    assert(discoveryPickupConsumerFixture.fixture_only === true, 'Discovery pickup consumer fixture should be fixture-only');
    assert(discoveryPickupConsumerFixture.provider_calls === 0, 'Discovery pickup consumer fixture should not call providers');
    assert(discoveryPickupConsumerFixture.live_api_calls === 0, 'Discovery pickup consumer fixture should not make live/API calls');
    assert(discoveryPickupConsumerFixture.watch_dispatches === 0, 'Discovery pickup consumer fixture should not dispatch Watch execution');
    assert(discoveryPickupConsumerFixture.tasks_created === 0, 'Discovery pickup consumer fixture should not create tasks');
    assert(Array.isArray(discoveryPickupConsumerFixture.task_runner_methods_called) && discoveryPickupConsumerFixture.task_runner_methods_called.length === 0, 'Discovery pickup consumer fixture should call no TaskRunner methods');
    assert(discoveryPickupConsumerFixture.discovery_refs_mutated === 0, 'Discovery pickup consumer fixture should not mutate Discovery refs');
    assert(discoveryPickupConsumerFixture.discovered_killmail_refs_written === 0, 'Discovery pickup consumer fixture should not write discovered_killmail_refs');
    assert(discoveryPickupConsumerFixture.evidence_writes === 0, 'Discovery pickup consumer fixture should not write Evidence/EVEidence');
    assert(discoveryPickupConsumerFixture.hydration_writes === 0, 'Discovery pickup consumer fixture should not write Hydration output');
    assert(discoveryPickupConsumerFixture.watch_mutations === 0, 'Discovery pickup consumer fixture should not mutate Watch rows');
    assert(discoveryPickupConsumerFixture.schema_changes === 0, 'Discovery pickup consumer fixture should not change schema');
    assert(discoveryPickupConsumerFixture.runtime_enforcement_active === false, 'Discovery pickup consumer fixture should not activate enforcement');

    const discoveryPickupConsumerHoldContract = await invokeServiceCommand('discovery.pickup_consumer_hold_contract.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(discoveryPickupConsumerHoldContract.read_only === true, 'Discovery pickup consumer hold contract should declare read-only behavior');
    assert(discoveryPickupConsumerHoldContract.fixture_only === true, 'Discovery pickup consumer hold contract should be fixture-only');
    assert(discoveryPickupConsumerHoldContract.contract_only === true, 'Discovery pickup consumer hold contract should be contract-only');
    assert(discoveryPickupConsumerHoldContract.production_bucket_consumption === false, 'Discovery pickup consumer hold contract should not consume production bucket rows');
    assert(discoveryPickupConsumerHoldContract.operator_corpus_mutated === false, 'Discovery pickup consumer hold contract should not mutate operator corpus');
    assert(discoveryPickupConsumerHoldContract.provider_calls === 0, 'Discovery pickup consumer hold contract should not call providers');
    assert(discoveryPickupConsumerHoldContract.live_api_calls === 0, 'Discovery pickup consumer hold contract should not make live/API calls');
    assert(discoveryPickupConsumerHoldContract.provider_packets === 0, 'Discovery pickup consumer hold contract should not create provider packets');
    assert(discoveryPickupConsumerHoldContract.discovery_pickup_started === false, 'Discovery pickup consumer hold contract should not start Discovery pickup');
    assert(discoveryPickupConsumerHoldContract.discovery_pickup_packets_created === 0, 'Discovery pickup consumer hold contract should not create Discovery pickup packets');
    assert(discoveryPickupConsumerHoldContract.leases_created === 0, 'Discovery pickup consumer hold contract should not create leases');
    assert(discoveryPickupConsumerHoldContract.queue_items_created === 0, 'Discovery pickup consumer hold contract should not create queue items');
    assert(discoveryPickupConsumerHoldContract.dispatcher_queue_lease_behavior === false, 'Discovery pickup consumer hold contract should not implement dispatcher/queue/lease behavior');
    assert(discoveryPickupConsumerHoldContract.candidate_refs_written === 0, 'Discovery pickup consumer hold contract should not write candidate refs');
    assert(discoveryPickupConsumerHoldContract.discovery_refs_mutated === 0, 'Discovery pickup consumer hold contract should not mutate Discovery refs');
    assert(discoveryPickupConsumerHoldContract.discovered_killmail_refs_written === 0, 'Discovery pickup consumer hold contract should not write discovered_killmail_refs');
    assert(discoveryPickupConsumerHoldContract.evidence_writes === 0, 'Discovery pickup consumer hold contract should not write Evidence/EVEidence');
    assert(discoveryPickupConsumerHoldContract.hydration_writes === 0, 'Discovery pickup consumer hold contract should not write Hydration output');
    assert(discoveryPickupConsumerHoldContract.observation_created === false, 'Discovery pickup consumer hold contract should not create Observation');
    assert(discoveryPickupConsumerHoldContract.watch_mutations === 0, 'Discovery pickup consumer hold contract should not mutate Watch rows');
    assert(discoveryPickupConsumerHoldContract.cadence_mutations === 0, 'Discovery pickup consumer hold contract should not mutate cadence');
    assert(discoveryPickupConsumerHoldContract.schema_changes === 0, 'Discovery pickup consumer hold contract should not change schema');
    assert(discoveryPickupConsumerHoldContract.runtime_enforcement_active === false, 'Discovery pickup consumer hold contract should not activate enforcement');

    const watchBucketProductPickupReadout = await invokeServiceCommand('watch.bucket_product_pickup_readout.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchBucketProductPickupReadout.read_only === true, 'Watch bucket product pickup readout should declare read-only behavior');
    assert(watchBucketProductPickupReadout.product_bucket_readout === true, 'Watch bucket product pickup readout should be product bucket readout');
    assert(watchBucketProductPickupReadout.fixture_only === false, 'Watch bucket product pickup readout should not be fixture-only');
    assert(watchBucketProductPickupReadout.product_schema_used === true, 'Watch bucket product pickup readout should use product schema rows');
    assert(watchBucketProductPickupReadout.product_schema_updated === false, 'Watch bucket product pickup readout should not update product schema');
    assert(watchBucketProductPickupReadout.operator_corpus_mutated === false, 'Watch bucket product pickup readout should not mutate operator corpus');
    assert(watchBucketProductPickupReadout.provider_calls === 0, 'Watch bucket product pickup readout should not call providers');
    assert(watchBucketProductPickupReadout.live_api_calls === 0, 'Watch bucket product pickup readout should not make live/API calls');
    assert(watchBucketProductPickupReadout.provider_packets === 0, 'Watch bucket product pickup readout should not create provider packets');
    assert(watchBucketProductPickupReadout.discovery_pickup_started === false, 'Watch bucket product pickup readout should not start Discovery pickup');
    assert(watchBucketProductPickupReadout.discovery_pickup_packets_created === 0, 'Watch bucket product pickup readout should not create Discovery pickup packets');
    assert(watchBucketProductPickupReadout.leases_created === 0, 'Watch bucket product pickup readout should not create leases');
    assert(watchBucketProductPickupReadout.queue_items_created === 0, 'Watch bucket product pickup readout should not create queue items');
    assert(watchBucketProductPickupReadout.dispatcher_queue_lease_behavior === false, 'Watch bucket product pickup readout should not implement dispatcher/queue/lease behavior');
    assert(watchBucketProductPickupReadout.candidate_refs_written === 0, 'Watch bucket product pickup readout should not write candidate refs');
    assert(watchBucketProductPickupReadout.discovery_refs_mutated === 0, 'Watch bucket product pickup readout should not mutate Discovery refs');
    assert(watchBucketProductPickupReadout.discovered_killmail_refs_written === 0, 'Watch bucket product pickup readout should not write discovered_killmail_refs');
    assert(watchBucketProductPickupReadout.evidence_writes === 0, 'Watch bucket product pickup readout should not write Evidence/EVEidence');
    assert(watchBucketProductPickupReadout.hydration_writes === 0, 'Watch bucket product pickup readout should not write Hydration output');
    assert(watchBucketProductPickupReadout.observation_created === false, 'Watch bucket product pickup readout should not create Observation');
    assert(watchBucketProductPickupReadout.watch_mutations === 0, 'Watch bucket product pickup readout should not mutate Watch rows');
    assert(watchBucketProductPickupReadout.cadence_mutations === 0, 'Watch bucket product pickup readout should not mutate cadence');
    assert(watchBucketProductPickupReadout.watch_bucket_status_mutations === 0, 'Watch bucket product pickup readout should not mutate bucket status');
    assert(watchBucketProductPickupReadout.receipt_mutations === 0, 'Watch bucket product pickup readout should not mutate receipts');
    assert(watchBucketProductPickupReadout.schema_changes === 0, 'Watch bucket product pickup readout should not change schema');
    assert(watchBucketProductPickupReadout.runtime_enforcement_active === false, 'Watch bucket product pickup readout should not activate enforcement');
    assert(watchBucketProductPickupReadout.command_blocking_active === false, 'Watch bucket product pickup readout should not activate command blocking');
    assert(watchBucketProductPickupReadout.ui_work === false, 'Watch bucket product pickup readout should not do UI work');

    const discoveryPickupSelectionContract = await invokeServiceCommand('discovery.pickup_selection_contract.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(discoveryPickupSelectionContract.read_only === true, 'Discovery pickup selection contract should declare read-only behavior');
    assert(discoveryPickupSelectionContract.contract_only === true, 'Discovery pickup selection contract should be contract-only');
    assert(discoveryPickupSelectionContract.product_bucket_readout_basis === true, 'Discovery pickup selection contract should use product bucket readout basis');
    assert(discoveryPickupSelectionContract.product_schema_used === true, 'Discovery pickup selection contract should use product schema rows');
    assert(discoveryPickupSelectionContract.product_schema_updated === false, 'Discovery pickup selection contract should not update product schema');
    assert(discoveryPickupSelectionContract.operator_corpus_mutated === false, 'Discovery pickup selection contract should not mutate operator corpus');
    assert(discoveryPickupSelectionContract.selection_creates_pickup_units === false, 'Discovery pickup selection contract should not create pickup units');
    assert(discoveryPickupSelectionContract.production_pickup_execution === false, 'Discovery pickup selection contract should not execute pickup');
    assert(discoveryPickupSelectionContract.provider_calls === 0, 'Discovery pickup selection contract should not call providers');
    assert(discoveryPickupSelectionContract.live_api_calls === 0, 'Discovery pickup selection contract should not make live/API calls');
    assert(discoveryPickupSelectionContract.provider_packets === 0, 'Discovery pickup selection contract should not create provider packets');
    assert(discoveryPickupSelectionContract.discovery_pickup_started === false, 'Discovery pickup selection contract should not start Discovery pickup');
    assert(discoveryPickupSelectionContract.discovery_pickup_packets_created === 0, 'Discovery pickup selection contract should not create Discovery pickup packets');
    assert(discoveryPickupSelectionContract.pickup_units_created === 0, 'Discovery pickup selection contract should not create pickup units');
    assert(discoveryPickupSelectionContract.leases_created === 0, 'Discovery pickup selection contract should not create leases');
    assert(discoveryPickupSelectionContract.queue_items_created === 0, 'Discovery pickup selection contract should not create queue items');
    assert(discoveryPickupSelectionContract.durable_discovery_task_rows_written === 0, 'Discovery pickup selection contract should not write durable Discovery task rows');
    assert(discoveryPickupSelectionContract.dispatcher_queue_lease_behavior === false, 'Discovery pickup selection contract should not implement dispatcher/queue/lease behavior');
    assert(discoveryPickupSelectionContract.candidate_refs_written === 0, 'Discovery pickup selection contract should not write candidate refs');
    assert(discoveryPickupSelectionContract.discovery_refs_mutated === 0, 'Discovery pickup selection contract should not mutate Discovery refs');
    assert(discoveryPickupSelectionContract.discovered_killmail_refs_written === 0, 'Discovery pickup selection contract should not write discovered_killmail_refs');
    assert(discoveryPickupSelectionContract.evidence_writes === 0, 'Discovery pickup selection contract should not write Evidence/EVEidence');
    assert(discoveryPickupSelectionContract.hydration_writes === 0, 'Discovery pickup selection contract should not write Hydration output');
    assert(discoveryPickupSelectionContract.observation_created === false, 'Discovery pickup selection contract should not create Observation');
    assert(discoveryPickupSelectionContract.watch_mutations === 0, 'Discovery pickup selection contract should not mutate Watch rows');
    assert(discoveryPickupSelectionContract.cadence_mutations === 0, 'Discovery pickup selection contract should not mutate cadence');
    assert(discoveryPickupSelectionContract.watch_bucket_status_mutations === 0, 'Discovery pickup selection contract should not mutate bucket status');
    assert(discoveryPickupSelectionContract.receipt_mutations === 0, 'Discovery pickup selection contract should not mutate receipts');
    assert(discoveryPickupSelectionContract.schema_changes === 0, 'Discovery pickup selection contract should not change schema');
    assert(discoveryPickupSelectionContract.runtime_enforcement_active === false, 'Discovery pickup selection contract should not activate enforcement');
    assert(discoveryPickupSelectionContract.command_blocking_active === false, 'Discovery pickup selection contract should not activate command blocking');
    assert(discoveryPickupSelectionContract.ui_work === false, 'Discovery pickup selection contract should not do UI work');

    const discoveryProviderRoutePacket = await invokeServiceCommand('discovery.provider_route_packet.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(discoveryProviderRoutePacket.read_only === true, 'Discovery provider route packet preview should declare read-only behavior');
    assert(discoveryProviderRoutePacket.contract_only === true, 'Discovery provider route packet preview should be contract-only');
    assert(discoveryProviderRoutePacket.preview_only === true, 'Discovery provider route packet preview should be preview-only');
    assert(discoveryProviderRoutePacket.product_bucket_selection_basis === true, 'Discovery provider route packet preview should use product selection basis');
    assert(discoveryProviderRoutePacket.provider_route_packet_shape_only === true, 'Discovery provider route packet preview should be shape-only');
    assert(discoveryProviderRoutePacket.provider_route_packets_are_preview_only === true, 'Discovery provider route packets should be preview-only');
    assert(discoveryProviderRoutePacket.provider_route_packets_execute === false, 'Discovery provider route packets should not execute');
    assert(discoveryProviderRoutePacket.route_packets_for_later_zkill_candidate_acquisition_only === true, 'Discovery provider route packets should be for later zKill candidate acquisition only');
    assert(discoveryProviderRoutePacket.route_packets_are_not_evidence_expansion === true, 'Discovery provider route packets should not be Evidence expansion');
    assert(discoveryProviderRoutePacket.route_packets_are_not_hydration === true, 'Discovery provider route packets should not be Hydration');
    assert(discoveryProviderRoutePacket.center_radius_execution_authority === false, 'Discovery provider route packet preview should not use center/radius as execution authority');
    assert(discoveryProviderRoutePacket.center_radius_provenance_only === true, 'Discovery provider route packet preview should keep center/radius as provenance only');
    assert(discoveryProviderRoutePacket.product_schema_updated === false, 'Discovery provider route packet preview should not update product schema');
    assert(discoveryProviderRoutePacket.operator_corpus_mutated === false, 'Discovery provider route packet preview should not mutate operator corpus');
    assert(discoveryProviderRoutePacket.production_pickup_execution === false, 'Discovery provider route packet preview should not execute pickup');
    assert(discoveryProviderRoutePacket.provider_calls === 0, 'Discovery provider route packet preview should not call providers');
    assert(discoveryProviderRoutePacket.live_api_calls === 0, 'Discovery provider route packet preview should not make live/API calls');
    assert(discoveryProviderRoutePacket.zkill_calls === 0, 'Discovery provider route packet preview should not call zKill');
    assert(discoveryProviderRoutePacket.esi_calls === 0, 'Discovery provider route packet preview should not call ESI');
    assert(discoveryProviderRoutePacket.discovery_pickup_started === false, 'Discovery provider route packet preview should not start Discovery pickup');
    assert(discoveryProviderRoutePacket.pickup_units_created === 0, 'Discovery provider route packet preview should not create pickup units');
    assert(discoveryProviderRoutePacket.leases_created === 0, 'Discovery provider route packet preview should not create leases');
    assert(discoveryProviderRoutePacket.queue_items_created === 0, 'Discovery provider route packet preview should not create queue items');
    assert(discoveryProviderRoutePacket.durable_discovery_task_rows_written === 0, 'Discovery provider route packet preview should not write durable Discovery task rows');
    assert(discoveryProviderRoutePacket.dispatcher_queue_lease_behavior === false, 'Discovery provider route packet preview should not implement dispatcher/queue/lease behavior');
    assert(discoveryProviderRoutePacket.provider_packets_created === 0, 'Discovery provider route packet preview should not create executable provider packets');
    assert(discoveryProviderRoutePacket.provider_packets_dispatched === 0, 'Discovery provider route packet preview should not dispatch provider packets');
    assert(discoveryProviderRoutePacket.candidate_refs_written === 0, 'Discovery provider route packet preview should not write candidate refs');
    assert(discoveryProviderRoutePacket.discovery_refs_mutated === 0, 'Discovery provider route packet preview should not mutate Discovery refs');
    assert(discoveryProviderRoutePacket.discovered_killmail_refs_written === 0, 'Discovery provider route packet preview should not write discovered_killmail_refs');
    assert(discoveryProviderRoutePacket.evidence_writes === 0, 'Discovery provider route packet preview should not write Evidence/EVEidence');
    assert(discoveryProviderRoutePacket.hydration_writes === 0, 'Discovery provider route packet preview should not write Hydration output');
    assert(discoveryProviderRoutePacket.observation_created === false, 'Discovery provider route packet preview should not create Observation');
    assert(discoveryProviderRoutePacket.watch_mutations === 0, 'Discovery provider route packet preview should not mutate Watch rows');
    assert(discoveryProviderRoutePacket.cadence_mutations === 0, 'Discovery provider route packet preview should not mutate cadence');
    assert(discoveryProviderRoutePacket.watch_bucket_status_mutations === 0, 'Discovery provider route packet preview should not mutate bucket status');
    assert(discoveryProviderRoutePacket.receipt_mutations === 0, 'Discovery provider route packet preview should not mutate receipts');
    assert(discoveryProviderRoutePacket.schema_changes === 0, 'Discovery provider route packet preview should not change schema');
    assert(discoveryProviderRoutePacket.runtime_enforcement_active === false, 'Discovery provider route packet preview should not activate enforcement');
    assert(discoveryProviderRoutePacket.command_blocking_active === false, 'Discovery provider route packet preview should not activate command blocking');
    assert(discoveryProviderRoutePacket.ui_work === false, 'Discovery provider route packet preview should not do UI work');

    const discoveryPickupExecutionBoundary = await invokeServiceCommand('discovery.pickup_execution_boundary.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(discoveryPickupExecutionBoundary.read_only === true, 'Discovery pickup execution boundary preview should declare read-only behavior');
    assert(discoveryPickupExecutionBoundary.boundary_preview_only === true, 'Discovery pickup execution boundary preview should be boundary-only');
    assert(discoveryPickupExecutionBoundary.contract_only === true, 'Discovery pickup execution boundary preview should be contract-only');
    assert(discoveryPickupExecutionBoundary.preview_only === true, 'Discovery pickup execution boundary preview should be preview-only');
    assert(discoveryPickupExecutionBoundary.hs489_route_packet_preview_basis === true, 'Discovery pickup execution boundary preview should use HS489 route preview basis');
    assert(discoveryPickupExecutionBoundary.pickup_execution_started === false, 'Discovery pickup execution boundary preview should not start pickup execution');
    assert(discoveryPickupExecutionBoundary.boundary_preview_is_dispatcher === false, 'Discovery pickup execution boundary preview should not be dispatcher');
    assert(discoveryPickupExecutionBoundary.boundary_preview_is_queue === false, 'Discovery pickup execution boundary preview should not be queue');
    assert(discoveryPickupExecutionBoundary.boundary_preview_is_lease === false, 'Discovery pickup execution boundary preview should not be lease');
    assert(discoveryPickupExecutionBoundary.boundary_preview_is_provider_worker === false, 'Discovery pickup execution boundary preview should not be provider worker');
    assert(discoveryPickupExecutionBoundary.executable_provider_packets_created === 0, 'Discovery pickup execution boundary preview should not create executable provider packets');
    assert(discoveryPickupExecutionBoundary.provider_calls === 0, 'Discovery pickup execution boundary preview should not call providers');
    assert(discoveryPickupExecutionBoundary.live_api_calls === 0, 'Discovery pickup execution boundary preview should not make live/API calls');
    assert(discoveryPickupExecutionBoundary.zkill_calls === 0, 'Discovery pickup execution boundary preview should not call zKill');
    assert(discoveryPickupExecutionBoundary.esi_calls === 0, 'Discovery pickup execution boundary preview should not call ESI');
    assert(discoveryPickupExecutionBoundary.pickup_units_created === 0, 'Discovery pickup execution boundary preview should not create pickup units');
    assert(discoveryPickupExecutionBoundary.leases_created === 0, 'Discovery pickup execution boundary preview should not create leases');
    assert(discoveryPickupExecutionBoundary.queue_items_created === 0, 'Discovery pickup execution boundary preview should not create queue items');
    assert(discoveryPickupExecutionBoundary.durable_discovery_task_rows_written === 0, 'Discovery pickup execution boundary preview should not write durable Discovery task rows');
    assert(discoveryPickupExecutionBoundary.dispatcher_queue_lease_behavior === false, 'Discovery pickup execution boundary preview should not implement dispatcher/queue/lease behavior');
    assert(discoveryPickupExecutionBoundary.candidate_refs_written === 0, 'Discovery pickup execution boundary preview should not write candidate refs');
    assert(discoveryPickupExecutionBoundary.discovery_refs_mutated === 0, 'Discovery pickup execution boundary preview should not mutate Discovery refs');
    assert(discoveryPickupExecutionBoundary.discovered_killmail_refs_written === 0, 'Discovery pickup execution boundary preview should not write discovered_killmail_refs');
    assert(discoveryPickupExecutionBoundary.evidence_writes === 0, 'Discovery pickup execution boundary preview should not write Evidence/EVEidence');
    assert(discoveryPickupExecutionBoundary.hydration_writes === 0, 'Discovery pickup execution boundary preview should not write Hydration output');
    assert(discoveryPickupExecutionBoundary.observation_created === false, 'Discovery pickup execution boundary preview should not create Observation');
    assert(discoveryPickupExecutionBoundary.watch_mutations === 0, 'Discovery pickup execution boundary preview should not mutate Watch rows');
    assert(discoveryPickupExecutionBoundary.cadence_mutations === 0, 'Discovery pickup execution boundary preview should not mutate cadence');
    assert(discoveryPickupExecutionBoundary.watch_bucket_status_mutations === 0, 'Discovery pickup execution boundary preview should not mutate bucket status');
    assert(discoveryPickupExecutionBoundary.receipt_mutations === 0, 'Discovery pickup execution boundary preview should not mutate receipts');
    assert(discoveryPickupExecutionBoundary.schema_changes === 0, 'Discovery pickup execution boundary preview should not change schema');
    assert(discoveryPickupExecutionBoundary.runtime_enforcement_active === false, 'Discovery pickup execution boundary preview should not activate enforcement');
    assert(discoveryPickupExecutionBoundary.command_blocking_active === false, 'Discovery pickup execution boundary preview should not activate command blocking');
    assert(discoveryPickupExecutionBoundary.ui_work === false, 'Discovery pickup execution boundary preview should not do UI work');

    const discoveryDispatcherLeaseBoundary = await invokeServiceCommand('discovery.dispatcher_lease_boundary.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(discoveryDispatcherLeaseBoundary.read_only === true, 'Discovery dispatcher lease boundary preview should declare read-only behavior');
    assert(discoveryDispatcherLeaseBoundary.lease_boundary_preview_only === true, 'Discovery dispatcher lease boundary preview should be boundary-only');
    assert(discoveryDispatcherLeaseBoundary.contract_only === true, 'Discovery dispatcher lease boundary preview should be contract-only');
    assert(discoveryDispatcherLeaseBoundary.preview_only === true, 'Discovery dispatcher lease boundary preview should be preview-only');
    assert(discoveryDispatcherLeaseBoundary.hs491_pickup_execution_boundary_basis === true, 'Discovery dispatcher lease boundary preview should use HS491 boundary basis');
    assert(discoveryDispatcherLeaseBoundary.dispatcher_runtime_started === false, 'Discovery dispatcher lease boundary preview should not start dispatcher runtime');
    assert(discoveryDispatcherLeaseBoundary.dispatcher_loop_started === false, 'Discovery dispatcher lease boundary preview should not start dispatcher loop');
    assert(discoveryDispatcherLeaseBoundary.queue_runtime_created === false, 'Discovery dispatcher lease boundary preview should not create queue runtime');
    assert(discoveryDispatcherLeaseBoundary.durable_queue_rows_written === 0, 'Discovery dispatcher lease boundary preview should not write durable queue rows');
    assert(discoveryDispatcherLeaseBoundary.durable_lease_rows_written === 0, 'Discovery dispatcher lease boundary preview should not write durable lease rows');
    assert(discoveryDispatcherLeaseBoundary.leases_created === 0, 'Discovery dispatcher lease boundary preview should not create leases');
    assert(discoveryDispatcherLeaseBoundary.lease_claims_created === 0, 'Discovery dispatcher lease boundary preview should not create lease claims');
    assert(discoveryDispatcherLeaseBoundary.lease_claimed === false, 'Discovery dispatcher lease boundary preview should not claim leases');
    assert(discoveryDispatcherLeaseBoundary.pickup_execution_started === false, 'Discovery dispatcher lease boundary preview should not start pickup execution');
    assert(discoveryDispatcherLeaseBoundary.executable_provider_packets_created === 0, 'Discovery dispatcher lease boundary preview should not create executable provider packets');
    assert(discoveryDispatcherLeaseBoundary.provider_calls === 0, 'Discovery dispatcher lease boundary preview should not call providers');
    assert(discoveryDispatcherLeaseBoundary.live_api_calls === 0, 'Discovery dispatcher lease boundary preview should not make live/API calls');
    assert(discoveryDispatcherLeaseBoundary.zkill_calls === 0, 'Discovery dispatcher lease boundary preview should not call zKill');
    assert(discoveryDispatcherLeaseBoundary.esi_calls === 0, 'Discovery dispatcher lease boundary preview should not call ESI');
    assert(discoveryDispatcherLeaseBoundary.candidate_refs_written === 0, 'Discovery dispatcher lease boundary preview should not write candidate refs');
    assert(discoveryDispatcherLeaseBoundary.discovery_refs_mutated === 0, 'Discovery dispatcher lease boundary preview should not mutate Discovery refs');
    assert(discoveryDispatcherLeaseBoundary.discovered_killmail_refs_written === 0, 'Discovery dispatcher lease boundary preview should not write discovered_killmail_refs');
    assert(discoveryDispatcherLeaseBoundary.evidence_writes === 0, 'Discovery dispatcher lease boundary preview should not write Evidence/EVEidence');
    assert(discoveryDispatcherLeaseBoundary.hydration_writes === 0, 'Discovery dispatcher lease boundary preview should not write Hydration output');
    assert(discoveryDispatcherLeaseBoundary.observation_created === false, 'Discovery dispatcher lease boundary preview should not create Observation');
    assert(discoveryDispatcherLeaseBoundary.watch_mutations === 0, 'Discovery dispatcher lease boundary preview should not mutate Watch rows');
    assert(discoveryDispatcherLeaseBoundary.cadence_mutations === 0, 'Discovery dispatcher lease boundary preview should not mutate cadence');
    assert(discoveryDispatcherLeaseBoundary.watch_bucket_status_mutations === 0, 'Discovery dispatcher lease boundary preview should not mutate bucket status');
    assert(discoveryDispatcherLeaseBoundary.receipt_mutations === 0, 'Discovery dispatcher lease boundary preview should not mutate receipts');
    assert(discoveryDispatcherLeaseBoundary.schema_changes === 0, 'Discovery dispatcher lease boundary preview should not change schema');
    assert(discoveryDispatcherLeaseBoundary.runtime_enforcement_active === false, 'Discovery dispatcher lease boundary preview should not activate enforcement');
    assert(discoveryDispatcherLeaseBoundary.command_blocking_active === false, 'Discovery dispatcher lease boundary preview should not activate command blocking');
    assert(discoveryDispatcherLeaseBoundary.ui_work === false, 'Discovery dispatcher lease boundary preview should not do UI work');

    const discoveryCandidateRefLandingBoundary = await invokeServiceCommand('discovery.candidate_ref_landing_boundary.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(discoveryCandidateRefLandingBoundary.read_only === true, 'Discovery candidate ref landing boundary preview should declare read-only behavior');
    assert(discoveryCandidateRefLandingBoundary.candidate_ref_landing_boundary_preview_only === true, 'Discovery candidate ref landing boundary preview should be boundary-only');
    assert(discoveryCandidateRefLandingBoundary.contract_only === true, 'Discovery candidate ref landing boundary preview should be contract-only');
    assert(discoveryCandidateRefLandingBoundary.preview_only === true, 'Discovery candidate ref landing boundary preview should be preview-only');
    assert(discoveryCandidateRefLandingBoundary.hs493_dispatcher_lease_boundary_basis === true, 'Discovery candidate ref landing boundary preview should use HS493 lease basis');
    assert(discoveryCandidateRefLandingBoundary.provider_results_fixture_only === true, 'Discovery candidate ref landing boundary preview should use fixture provider results only');
    assert(discoveryCandidateRefLandingBoundary.provider_result_examples_execute_provider_calls === false, 'Discovery candidate ref landing boundary preview should not execute provider result examples');
    assert(discoveryCandidateRefLandingBoundary.provider_calls === 0, 'Discovery candidate ref landing boundary preview should not call providers');
    assert(discoveryCandidateRefLandingBoundary.live_api_calls === 0, 'Discovery candidate ref landing boundary preview should not make live/API calls');
    assert(discoveryCandidateRefLandingBoundary.zkill_calls === 0, 'Discovery candidate ref landing boundary preview should not call zKill');
    assert(discoveryCandidateRefLandingBoundary.esi_calls === 0, 'Discovery candidate ref landing boundary preview should not call ESI');
    assert(discoveryCandidateRefLandingBoundary.discovery_pickup_execution === false, 'Discovery candidate ref landing boundary preview should not execute pickup');
    assert(discoveryCandidateRefLandingBoundary.dispatcher_runtime_started === false, 'Discovery candidate ref landing boundary preview should not start dispatcher runtime');
    assert(discoveryCandidateRefLandingBoundary.durable_queue_rows_written === 0, 'Discovery candidate ref landing boundary preview should not write durable queue rows');
    assert(discoveryCandidateRefLandingBoundary.durable_lease_rows_written === 0, 'Discovery candidate ref landing boundary preview should not write durable lease rows');
    assert(discoveryCandidateRefLandingBoundary.lease_claims_created === 0, 'Discovery candidate ref landing boundary preview should not create lease claims');
    assert(discoveryCandidateRefLandingBoundary.candidate_refs_written === 0, 'Discovery candidate ref landing boundary preview should not write candidate refs');
    assert(discoveryCandidateRefLandingBoundary.discovered_killmail_refs_written === 0, 'Discovery candidate ref landing boundary preview should not write discovered_killmail_refs');
    assert(discoveryCandidateRefLandingBoundary.discovery_refs_mutated === 0, 'Discovery candidate ref landing boundary preview should not mutate Discovery refs');
    assert(discoveryCandidateRefLandingBoundary.evidence_writes === 0, 'Discovery candidate ref landing boundary preview should not write Evidence/EVEidence');
    assert(discoveryCandidateRefLandingBoundary.hydration_writes === 0, 'Discovery candidate ref landing boundary preview should not write Hydration output');
    assert(discoveryCandidateRefLandingBoundary.observation_created === false, 'Discovery candidate ref landing boundary preview should not create Observation');
    assert(discoveryCandidateRefLandingBoundary.watch_completion_semantics_opened === false, 'Discovery candidate ref landing boundary preview should not open Watch completion semantics');
    assert(discoveryCandidateRefLandingBoundary.watch_mutations === 0, 'Discovery candidate ref landing boundary preview should not mutate Watch rows');
    assert(discoveryCandidateRefLandingBoundary.cadence_mutations === 0, 'Discovery candidate ref landing boundary preview should not mutate cadence');
    assert(discoveryCandidateRefLandingBoundary.watch_bucket_status_mutations === 0, 'Discovery candidate ref landing boundary preview should not mutate bucket status');
    assert(discoveryCandidateRefLandingBoundary.receipt_mutations === 0, 'Discovery candidate ref landing boundary preview should not mutate receipts');
    assert(discoveryCandidateRefLandingBoundary.schema_changes === 0, 'Discovery candidate ref landing boundary preview should not change schema');
    assert(discoveryCandidateRefLandingBoundary.runtime_enforcement_active === false, 'Discovery candidate ref landing boundary preview should not activate enforcement');
    assert(discoveryCandidateRefLandingBoundary.command_blocking_active === false, 'Discovery candidate ref landing boundary preview should not activate command blocking');
    assert(discoveryCandidateRefLandingBoundary.ui_work === false, 'Discovery candidate ref landing boundary preview should not do UI work');

    const discoverySettledReceiptBoundary = await invokeServiceCommand('discovery.settled_receipt_boundary.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(discoverySettledReceiptBoundary.read_only === true, 'Discovery settled receipt boundary preview should declare read-only behavior');
    assert(discoverySettledReceiptBoundary.settled_receipt_boundary_preview_only === true, 'Discovery settled receipt boundary preview should be boundary-only');
    assert(discoverySettledReceiptBoundary.contract_only === true, 'Discovery settled receipt boundary preview should be contract-only');
    assert(discoverySettledReceiptBoundary.preview_only === true, 'Discovery settled receipt boundary preview should be preview-only');
    assert(discoverySettledReceiptBoundary.hs495_candidate_ref_landing_basis === true, 'Discovery settled receipt boundary preview should use HS495 landing basis');
    assert(discoverySettledReceiptBoundary.caller_receipt_projection_bounded === true, 'Discovery settled receipt boundary preview should provide bounded caller projections');
    assert(discoverySettledReceiptBoundary.caller_receipt_projection_factual_only === true, 'Discovery settled receipt boundary preview should be factual-only');
    assert(discoverySettledReceiptBoundary.watch_cadence_completion_decision === 'not_decided_here', 'Discovery settled receipt boundary preview should not decide Watch cadence/completion');
    assert(discoverySettledReceiptBoundary.watch_completion_semantics_opened === false, 'Discovery settled receipt boundary preview should not open Watch completion semantics');
    assert(Array.isArray(discoverySettledReceiptBoundary.settled_receipt_boundary_rows), 'Discovery settled receipt boundary preview should expose receipt rows array');
    assert(Array.isArray(discoverySettledReceiptBoundary.caller_receipt_projections), 'Discovery settled receipt boundary preview should expose caller projections array');
    assert(discoverySettledReceiptBoundary.provider_calls === 0, 'Discovery settled receipt boundary preview should not call providers');
    assert(discoverySettledReceiptBoundary.live_api_calls === 0, 'Discovery settled receipt boundary preview should not make live/API calls');
    assert(discoverySettledReceiptBoundary.zkill_calls === 0, 'Discovery settled receipt boundary preview should not call zKill');
    assert(discoverySettledReceiptBoundary.esi_calls === 0, 'Discovery settled receipt boundary preview should not call ESI');
    assert(discoverySettledReceiptBoundary.discovery_pickup_execution === false, 'Discovery settled receipt boundary preview should not execute pickup');
    assert(discoverySettledReceiptBoundary.dispatcher_runtime_started === false, 'Discovery settled receipt boundary preview should not start dispatcher runtime');
    assert(discoverySettledReceiptBoundary.durable_queue_rows_written === 0, 'Discovery settled receipt boundary preview should not write durable queue rows');
    assert(discoverySettledReceiptBoundary.durable_lease_rows_written === 0, 'Discovery settled receipt boundary preview should not write durable lease rows');
    assert(discoverySettledReceiptBoundary.lease_claims_created === 0, 'Discovery settled receipt boundary preview should not create lease claims');
    assert(discoverySettledReceiptBoundary.candidate_refs_written === 0, 'Discovery settled receipt boundary preview should not write candidate refs');
    assert(discoverySettledReceiptBoundary.discovered_killmail_refs_written === 0, 'Discovery settled receipt boundary preview should not write discovered_killmail_refs');
    assert(discoverySettledReceiptBoundary.discovery_refs_mutated === 0, 'Discovery settled receipt boundary preview should not mutate Discovery refs');
    assert(discoverySettledReceiptBoundary.evidence_writes === 0, 'Discovery settled receipt boundary preview should not write Evidence/EVEidence');
    assert(discoverySettledReceiptBoundary.hydration_writes === 0, 'Discovery settled receipt boundary preview should not write Hydration output');
    assert(discoverySettledReceiptBoundary.observation_created === false, 'Discovery settled receipt boundary preview should not create Observation');
    assert(discoverySettledReceiptBoundary.watch_mutations === 0, 'Discovery settled receipt boundary preview should not mutate Watch rows');
    assert(discoverySettledReceiptBoundary.cadence_mutations === 0, 'Discovery settled receipt boundary preview should not mutate cadence');
    assert(discoverySettledReceiptBoundary.watch_bucket_status_mutations === 0, 'Discovery settled receipt boundary preview should not mutate bucket status');
    assert(discoverySettledReceiptBoundary.receipt_mutations === 0, 'Discovery settled receipt boundary preview should not mutate receipts');
    assert(discoverySettledReceiptBoundary.schema_changes === 0, 'Discovery settled receipt boundary preview should not change schema');
    assert(discoverySettledReceiptBoundary.runtime_enforcement_active === false, 'Discovery settled receipt boundary preview should not activate enforcement');
    assert(discoverySettledReceiptBoundary.command_blocking_active === false, 'Discovery settled receipt boundary preview should not activate command blocking');
    assert(discoverySettledReceiptBoundary.ui_work === false, 'Discovery settled receipt boundary preview should not do UI work');

    const discoveryOutcomeDerivation = await invokeServiceCommand('discovery.outcome_derivation.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(discoveryOutcomeDerivation.read_only === true, 'Discovery outcome derivation should declare read-only behavior');
    assert(discoveryOutcomeDerivation.provider_calls === 0, 'Discovery outcome derivation should not call providers');
    assert(discoveryOutcomeDerivation.live_api_calls === 0, 'Discovery outcome derivation should not make live/API calls');
    assert(discoveryOutcomeDerivation.watch_execution === false, 'Discovery outcome derivation should not execute Watch');
    assert(discoveryOutcomeDerivation.watch_dispatches === 0, 'Discovery outcome derivation should not dispatch Watch execution');
    assert(discoveryOutcomeDerivation.tasks_created === 0, 'Discovery outcome derivation should not create tasks');
    assert(Array.isArray(discoveryOutcomeDerivation.task_runner_methods_called) && discoveryOutcomeDerivation.task_runner_methods_called.length === 0, 'Discovery outcome derivation should call no TaskRunner methods');
    assert(discoveryOutcomeDerivation.discovery_refs_mutated === 0, 'Discovery outcome derivation should not mutate Discovery refs');
    assert(discoveryOutcomeDerivation.discovered_killmail_refs_written === 0, 'Discovery outcome derivation should not write discovered_killmail_refs');
    assert(discoveryOutcomeDerivation.evidence_writes === 0, 'Discovery outcome derivation should not write Evidence/EVEidence');
    assert(discoveryOutcomeDerivation.hydration_writes === 0, 'Discovery outcome derivation should not write Hydration output');
    assert(discoveryOutcomeDerivation.watch_mutations === 0, 'Discovery outcome derivation should not mutate Watch rows');
    assert(discoveryOutcomeDerivation.schema_changes === 0, 'Discovery outcome derivation should not change schema');
    assert(discoveryOutcomeDerivation.runtime_enforcement_active === false, 'Discovery outcome derivation should not activate enforcement');

    const discoveryReceiptProjectionFixture = await invokeServiceCommand('discovery.receipt_projection_fixture.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(discoveryReceiptProjectionFixture.read_only === true, 'Discovery receipt projection fixture should declare read-only behavior');
    assert(discoveryReceiptProjectionFixture.fixture_only === true, 'Discovery receipt projection fixture should be fixture-only');
    assert(discoveryReceiptProjectionFixture.provider_calls === 0, 'Discovery receipt projection fixture should not call providers');
    assert(discoveryReceiptProjectionFixture.live_api_calls === 0, 'Discovery receipt projection fixture should not make live/API calls');
    assert(discoveryReceiptProjectionFixture.watch_execution === false, 'Discovery receipt projection fixture should not execute Watch');
    assert(discoveryReceiptProjectionFixture.watch_dispatches === 0, 'Discovery receipt projection fixture should not dispatch Watch execution');
    assert(discoveryReceiptProjectionFixture.tasks_created === 0, 'Discovery receipt projection fixture should not create tasks');
    assert(Array.isArray(discoveryReceiptProjectionFixture.task_runner_methods_called) && discoveryReceiptProjectionFixture.task_runner_methods_called.length === 0, 'Discovery receipt projection fixture should call no TaskRunner methods');
    assert(discoveryReceiptProjectionFixture.discovery_refs_mutated === 0, 'Discovery receipt projection fixture should not mutate Discovery refs');
    assert(discoveryReceiptProjectionFixture.discovered_killmail_refs_written === 0, 'Discovery receipt projection fixture should not write discovered_killmail_refs');
    assert(discoveryReceiptProjectionFixture.evidence_writes === 0, 'Discovery receipt projection fixture should not write Evidence/EVEidence');
    assert(discoveryReceiptProjectionFixture.hydration_writes === 0, 'Discovery receipt projection fixture should not write Hydration output');
    assert(discoveryReceiptProjectionFixture.watch_mutations === 0, 'Discovery receipt projection fixture should not mutate Watch rows');
    assert(discoveryReceiptProjectionFixture.schema_changes === 0, 'Discovery receipt projection fixture should not change schema');
    assert(discoveryReceiptProjectionFixture.runtime_enforcement_active === false, 'Discovery receipt projection fixture should not activate enforcement');

    const watchDiscoveryAcquisitionSplitFixture = await invokeServiceCommand('watch.discovery_acquisition_split_fixture.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchDiscoveryAcquisitionSplitFixture.read_only === true, 'Watch Discovery acquisition split fixture should declare read-only behavior');
    assert(watchDiscoveryAcquisitionSplitFixture.fixture_only === true, 'Watch Discovery acquisition split fixture should be fixture-only');
    assert(watchDiscoveryAcquisitionSplitFixture.provider_calls === 0, 'Watch Discovery acquisition split fixture should not call providers');
    assert(watchDiscoveryAcquisitionSplitFixture.live_api_calls === 0, 'Watch Discovery acquisition split fixture should not make live/API calls');
    assert(watchDiscoveryAcquisitionSplitFixture.watch_execution === false, 'Watch Discovery acquisition split fixture should not execute Watch');
    assert(watchDiscoveryAcquisitionSplitFixture.watch_dispatches === 0, 'Watch Discovery acquisition split fixture should not dispatch Watch execution');
    assert(watchDiscoveryAcquisitionSplitFixture.dispatch_runner_invoked === false, 'Watch Discovery acquisition split fixture should not invoke dispatch runner');
    assert(watchDiscoveryAcquisitionSplitFixture.mixed_collectors_invoked === false, 'Watch Discovery acquisition split fixture should not invoke mixed collectors');
    assert(watchDiscoveryAcquisitionSplitFixture.tasks_created === 0, 'Watch Discovery acquisition split fixture should not create tasks');
    assert(Array.isArray(watchDiscoveryAcquisitionSplitFixture.task_runner_methods_called) && watchDiscoveryAcquisitionSplitFixture.task_runner_methods_called.length === 0, 'Watch Discovery acquisition split fixture should call no TaskRunner methods');
    assert(watchDiscoveryAcquisitionSplitFixture.discovery_refs_mutated === 0, 'Watch Discovery acquisition split fixture should not mutate Discovery refs');
    assert(watchDiscoveryAcquisitionSplitFixture.discovered_killmail_refs_written === 0, 'Watch Discovery acquisition split fixture should not write discovered_killmail_refs');
    assert(watchDiscoveryAcquisitionSplitFixture.evidence_writes === 0, 'Watch Discovery acquisition split fixture should not write Evidence/EVEidence');
    assert(watchDiscoveryAcquisitionSplitFixture.esi_evidence_expansion_run === false, 'Watch Discovery acquisition split fixture should not run ESI Evidence Expansion');
    assert(watchDiscoveryAcquisitionSplitFixture.hydration_writes === 0, 'Watch Discovery acquisition split fixture should not write Hydration output');
    assert(watchDiscoveryAcquisitionSplitFixture.watch_mutations === 0, 'Watch Discovery acquisition split fixture should not mutate Watch rows');
    assert(watchDiscoveryAcquisitionSplitFixture.schema_changes === 0, 'Watch Discovery acquisition split fixture should not change schema');
    assert(watchDiscoveryAcquisitionSplitFixture.runtime_enforcement_active === false, 'Watch Discovery acquisition split fixture should not activate enforcement');

    const discoveryAcquisitionToEvidenceHandoffFixture = await invokeServiceCommand('discovery.acquisition_to_evidence_handoff_fixture.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(discoveryAcquisitionToEvidenceHandoffFixture.read_only === true, 'Discovery acquisition to Evidence handoff fixture should declare read-only behavior');
    assert(discoveryAcquisitionToEvidenceHandoffFixture.fixture_only === true, 'Discovery acquisition to Evidence handoff fixture should be fixture-only');
    assert(discoveryAcquisitionToEvidenceHandoffFixture.provider_calls === 0, 'Discovery acquisition to Evidence handoff fixture should not call providers');
    assert(discoveryAcquisitionToEvidenceHandoffFixture.live_api_calls === 0, 'Discovery acquisition to Evidence handoff fixture should not make live/API calls');
    assert(discoveryAcquisitionToEvidenceHandoffFixture.watch_execution === false, 'Discovery acquisition to Evidence handoff fixture should not execute Watch');
    assert(discoveryAcquisitionToEvidenceHandoffFixture.watch_dispatches === 0, 'Discovery acquisition to Evidence handoff fixture should not dispatch Watch execution');
    assert(discoveryAcquisitionToEvidenceHandoffFixture.mixed_collectors_invoked === false, 'Discovery acquisition to Evidence handoff fixture should not invoke mixed collectors');
    assert(discoveryAcquisitionToEvidenceHandoffFixture.tasks_created === 0, 'Discovery acquisition to Evidence handoff fixture should not create tasks');
    assert(Array.isArray(discoveryAcquisitionToEvidenceHandoffFixture.task_runner_methods_called) && discoveryAcquisitionToEvidenceHandoffFixture.task_runner_methods_called.length === 0, 'Discovery acquisition to Evidence handoff fixture should call no TaskRunner methods');
    assert(discoveryAcquisitionToEvidenceHandoffFixture.discovery_refs_mutated === 0, 'Discovery acquisition to Evidence handoff fixture should not mutate Discovery refs');
    assert(discoveryAcquisitionToEvidenceHandoffFixture.discovered_killmail_refs_written === 0, 'Discovery acquisition to Evidence handoff fixture should not write discovered_killmail_refs');
    assert(discoveryAcquisitionToEvidenceHandoffFixture.evidence_writes === 0, 'Discovery acquisition to Evidence handoff fixture should not write Evidence/EVEidence');
    assert(discoveryAcquisitionToEvidenceHandoffFixture.esi_evidence_expansion_run === false, 'Discovery acquisition to Evidence handoff fixture should not run ESI Evidence Expansion');
    assert(discoveryAcquisitionToEvidenceHandoffFixture.hydration_writes === 0, 'Discovery acquisition to Evidence handoff fixture should not write Hydration output');
    assert(discoveryAcquisitionToEvidenceHandoffFixture.watch_mutations === 0, 'Discovery acquisition to Evidence handoff fixture should not mutate Watch rows');
    assert(discoveryAcquisitionToEvidenceHandoffFixture.schema_changes === 0, 'Discovery acquisition to Evidence handoff fixture should not change schema');
    assert(discoveryAcquisitionToEvidenceHandoffFixture.runtime_enforcement_active === false, 'Discovery acquisition to Evidence handoff fixture should not activate enforcement');

    const discoveryEsiExpansionIntakePosture = await invokeServiceCommand('discovery.esi_expansion_intake_posture.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(discoveryEsiExpansionIntakePosture.read_only === true, 'Discovery ESI expansion intake posture should declare read-only behavior');
    assert(discoveryEsiExpansionIntakePosture.fixture_only === true, 'Discovery ESI expansion intake posture should be fixture-only');
    assert(discoveryEsiExpansionIntakePosture.provider_calls === 0, 'Discovery ESI expansion intake posture should not call providers');
    assert(discoveryEsiExpansionIntakePosture.live_api_calls === 0, 'Discovery ESI expansion intake posture should not make live/API calls');
    assert(discoveryEsiExpansionIntakePosture.esi_calls === 0, 'Discovery ESI expansion intake posture should not call ESI');
    assert(discoveryEsiExpansionIntakePosture.watch_execution === false, 'Discovery ESI expansion intake posture should not execute Watch');
    assert(discoveryEsiExpansionIntakePosture.watch_dispatches === 0, 'Discovery ESI expansion intake posture should not dispatch Watch execution');
    assert(discoveryEsiExpansionIntakePosture.mixed_collectors_invoked === false, 'Discovery ESI expansion intake posture should not invoke mixed collectors');
    assert(discoveryEsiExpansionIntakePosture.actor_watch_redirected === false, 'Discovery ESI expansion intake posture should not redirect actor.watch');
    assert(discoveryEsiExpansionIntakePosture.mixed_collector_retired === false, 'Discovery ESI expansion intake posture should not retire collectors');
    assert(discoveryEsiExpansionIntakePosture.tasks_created === 0, 'Discovery ESI expansion intake posture should not create tasks');
    assert(Array.isArray(discoveryEsiExpansionIntakePosture.task_runner_methods_called) && discoveryEsiExpansionIntakePosture.task_runner_methods_called.length === 0, 'Discovery ESI expansion intake posture should call no TaskRunner methods');
    assert(discoveryEsiExpansionIntakePosture.discovery_refs_mutated === 0, 'Discovery ESI expansion intake posture should not mutate Discovery refs');
    assert(discoveryEsiExpansionIntakePosture.discovered_killmail_refs_written === 0, 'Discovery ESI expansion intake posture should not write discovered_killmail_refs');
    assert(discoveryEsiExpansionIntakePosture.evidence_writes === 0, 'Discovery ESI expansion intake posture should not write Evidence/EVEidence');
    assert(discoveryEsiExpansionIntakePosture.evidence_landing_performed === false, 'Discovery ESI expansion intake posture should not land Evidence/EVEidence');
    assert(discoveryEsiExpansionIntakePosture.live_esi_backed_expansion_run === false, 'Discovery ESI expansion intake posture should not run live ESI-backed expansion');
    assert(discoveryEsiExpansionIntakePosture.hydration_writes === 0, 'Discovery ESI expansion intake posture should not write Hydration output');
    assert(discoveryEsiExpansionIntakePosture.watch_mutations === 0, 'Discovery ESI expansion intake posture should not mutate Watch rows');
    assert(discoveryEsiExpansionIntakePosture.schema_changes === 0, 'Discovery ESI expansion intake posture should not change schema');
    assert(discoveryEsiExpansionIntakePosture.runtime_enforcement_active === false, 'Discovery ESI expansion intake posture should not activate enforcement');
    assert(discoveryEsiExpansionIntakePosture.boundary_flags.system_radius_behavior_changed === false, 'Discovery ESI expansion intake posture should not change system/radius behavior');

    const evidenceWriterLandingPackageFixture = await invokeServiceCommand('evidence.writer_landing_package_fixture.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(evidenceWriterLandingPackageFixture.fixture_only === true, 'Evidence writer landing package fixture should be fixture-only');
    assert(evidenceWriterLandingPackageFixture.disposable_db.operator_corpus_mutated === false, 'Evidence writer landing package fixture should not mutate operator corpus');
    assert(evidenceWriterLandingPackageFixture.disposable_db.context_db_used === false, 'Evidence writer landing package fixture should not use caller DB');
    assert(evidenceWriterLandingPackageFixture.provider_invocation.provider_not_invoked === true, 'Evidence writer landing package fixture should not invoke providers');
    assert(evidenceWriterLandingPackageFixture.provider_invocation.zkill === 0, 'Evidence writer landing package fixture should not call zKill');
    assert(evidenceWriterLandingPackageFixture.provider_invocation.esi === 0, 'Evidence writer landing package fixture should not call ESI');
    assert(evidenceWriterLandingPackageFixture.tables_proven_unchanged.discovered_killmail_refs === true, 'Evidence writer landing package fixture should not mutate Discovery refs');
    assert(evidenceWriterLandingPackageFixture.tables_proven_unchanged.api_request_logs === true, 'Evidence writer landing package fixture should not write API logs');
    assert(evidenceWriterLandingPackageFixture.tables_proven_unchanged.watch_tables === true, 'Evidence writer landing package fixture should not mutate Watch tables');
    assert(evidenceWriterLandingPackageFixture.tables_proven_unchanged.hydration_metadata_tables === true, 'Evidence writer landing package fixture should not write Hydration/metadata tables');
    assert(evidenceWriterLandingPackageFixture.tables_proven_unchanged.assessment_tables === true, 'Evidence writer landing package fixture should not write Assessment tables');
    assert(evidenceWriterLandingPackageFixture.foreign_key_check.ok === true, 'Evidence writer landing package fixture should pass foreign key check');

    const watchMixedCollectorReplacementRoute = await invokeServiceCommand('watch.mixed_collector_replacement_route.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchMixedCollectorReplacementRoute.read_only === true, 'Watch mixed collector replacement route preview should declare read-only behavior');
    assert(watchMixedCollectorReplacementRoute.fixture_only === true, 'Watch mixed collector replacement route preview should be fixture-only');
    assert(watchMixedCollectorReplacementRoute.provider_calls === 0, 'Watch mixed collector replacement route preview should not call providers');
    assert(watchMixedCollectorReplacementRoute.live_api_calls === 0, 'Watch mixed collector replacement route preview should not make live/API calls');
    assert(watchMixedCollectorReplacementRoute.watch_execution === false, 'Watch mixed collector replacement route preview should not execute Watch');
    assert(watchMixedCollectorReplacementRoute.watch_dispatches === 0, 'Watch mixed collector replacement route preview should not dispatch Watch execution');
    assert(watchMixedCollectorReplacementRoute.mixed_collectors_invoked === false, 'Watch mixed collector replacement route preview should not invoke mixed collectors');
    assert(watchMixedCollectorReplacementRoute.mixed_collector_redirected === false, 'Watch mixed collector replacement route preview should not redirect collectors');
    assert(watchMixedCollectorReplacementRoute.mixed_collector_retired === false, 'Watch mixed collector replacement route preview should not retire collectors');
    assert(watchMixedCollectorReplacementRoute.tasks_created === 0, 'Watch mixed collector replacement route preview should not create tasks');
    assert(Array.isArray(watchMixedCollectorReplacementRoute.task_runner_methods_called) && watchMixedCollectorReplacementRoute.task_runner_methods_called.length === 0, 'Watch mixed collector replacement route preview should call no TaskRunner methods');
    assert(watchMixedCollectorReplacementRoute.discovery_refs_mutated === 0, 'Watch mixed collector replacement route preview should not mutate Discovery refs');
    assert(watchMixedCollectorReplacementRoute.discovered_killmail_refs_written === 0, 'Watch mixed collector replacement route preview should not write discovered_killmail_refs');
    assert(watchMixedCollectorReplacementRoute.evidence_writes === 0, 'Watch mixed collector replacement route preview should not write Evidence/EVEidence');
    assert(watchMixedCollectorReplacementRoute.live_esi_backed_expansion_run === false, 'Watch mixed collector replacement route preview should not run live ESI-backed expansion');
    assert(watchMixedCollectorReplacementRoute.hydration_writes === 0, 'Watch mixed collector replacement route preview should not write Hydration output');
    assert(watchMixedCollectorReplacementRoute.watch_mutations === 0, 'Watch mixed collector replacement route preview should not mutate Watch rows');
    assert(watchMixedCollectorReplacementRoute.schema_changes === 0, 'Watch mixed collector replacement route preview should not change schema');
    assert(watchMixedCollectorReplacementRoute.runtime_enforcement_active === false, 'Watch mixed collector replacement route preview should not activate enforcement');

    const watchActorReplacementParity = await invokeServiceCommand('watch.actor_replacement_parity.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchActorReplacementParity.read_only === true, 'Actor Watch replacement parity preview should declare read-only behavior');
    assert(watchActorReplacementParity.fixture_only === true, 'Actor Watch replacement parity preview should be fixture-only');
    assert(watchActorReplacementParity.actor_only === true, 'Actor Watch replacement parity preview should be actor-only');
    assert(watchActorReplacementParity.provider_calls === 0, 'Actor Watch replacement parity preview should not call providers');
    assert(watchActorReplacementParity.live_api_calls === 0, 'Actor Watch replacement parity preview should not make live/API calls');
    assert(watchActorReplacementParity.watch_execution === false, 'Actor Watch replacement parity preview should not execute Watch');
    assert(watchActorReplacementParity.watch_dispatches === 0, 'Actor Watch replacement parity preview should not dispatch Watch execution');
    assert(watchActorReplacementParity.mixed_collectors_invoked === false, 'Actor Watch replacement parity preview should not invoke mixed collectors');
    assert(watchActorReplacementParity.actor_watch_redirected === false, 'Actor Watch replacement parity preview should not redirect actor.watch');
    assert(watchActorReplacementParity.mixed_collector_retired === false, 'Actor Watch replacement parity preview should not retire collectors');
    assert(watchActorReplacementParity.tasks_created === 0, 'Actor Watch replacement parity preview should not create tasks');
    assert(Array.isArray(watchActorReplacementParity.task_runner_methods_called) && watchActorReplacementParity.task_runner_methods_called.length === 0, 'Actor Watch replacement parity preview should call no TaskRunner methods');
    assert(watchActorReplacementParity.discovery_refs_mutated === 0, 'Actor Watch replacement parity preview should not mutate Discovery refs');
    assert(watchActorReplacementParity.discovered_killmail_refs_written === 0, 'Actor Watch replacement parity preview should not write discovered_killmail_refs');
    assert(watchActorReplacementParity.evidence_writes === 0, 'Actor Watch replacement parity preview should not write Evidence/EVEidence');
    assert(watchActorReplacementParity.live_esi_backed_expansion_run === false, 'Actor Watch replacement parity preview should not run live ESI-backed expansion');
    assert(watchActorReplacementParity.hydration_writes === 0, 'Actor Watch replacement parity preview should not write Hydration output');
    assert(watchActorReplacementParity.watch_mutations === 0, 'Actor Watch replacement parity preview should not mutate Watch rows');
    assert(watchActorReplacementParity.schema_changes === 0, 'Actor Watch replacement parity preview should not change schema');
    assert(watchActorReplacementParity.runtime_enforcement_active === false, 'Actor Watch replacement parity preview should not activate enforcement');
    assert(watchActorReplacementParity.boundary_flags.system_radius_behavior_changed === false, 'Actor Watch replacement parity preview should not change system/radius behavior');

    const watchActorCompatibilityWrapperContract = await invokeServiceCommand('watch.actor_compatibility_wrapper_contract.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchActorCompatibilityWrapperContract.read_only === true, 'Actor Watch compatibility wrapper contract should declare read-only behavior');
    assert(watchActorCompatibilityWrapperContract.fixture_only === true, 'Actor Watch compatibility wrapper contract should be fixture-only');
    assert(watchActorCompatibilityWrapperContract.wrapper_status === 'contract_only_not_active', 'Actor Watch compatibility wrapper contract should be inactive contract only');
    assert(watchActorCompatibilityWrapperContract.old_entry_point === 'actor.watch', 'Actor Watch compatibility wrapper contract should identify old entry point');
    assert(watchActorCompatibilityWrapperContract.current_retire_candidate === 'collectActorWatch', 'Actor Watch compatibility wrapper contract should identify collectActorWatch as retire candidate only');
    assert(watchActorCompatibilityWrapperContract.provider_calls === 0, 'Actor Watch compatibility wrapper contract should not call providers');
    assert(watchActorCompatibilityWrapperContract.live_api_calls === 0, 'Actor Watch compatibility wrapper contract should not make live/API calls');
    assert(watchActorCompatibilityWrapperContract.watch_execution === false, 'Actor Watch compatibility wrapper contract should not execute Watch');
    assert(watchActorCompatibilityWrapperContract.watch_dispatches === 0, 'Actor Watch compatibility wrapper contract should not dispatch Watch execution');
    assert(watchActorCompatibilityWrapperContract.mixed_collectors_invoked === false, 'Actor Watch compatibility wrapper contract should not invoke mixed collectors');
    assert(watchActorCompatibilityWrapperContract.collect_actor_watch_invoked === false, 'Actor Watch compatibility wrapper contract should not invoke collectActorWatch');
    assert(watchActorCompatibilityWrapperContract.actor_watch_redirected === false, 'Actor Watch compatibility wrapper contract should not redirect actor.watch');
    assert(watchActorCompatibilityWrapperContract.mixed_collector_retired === false, 'Actor Watch compatibility wrapper contract should not retire collectors');
    assert(watchActorCompatibilityWrapperContract.tasks_created === 0, 'Actor Watch compatibility wrapper contract should not create tasks');
    assert(Array.isArray(watchActorCompatibilityWrapperContract.task_runner_methods_called) && watchActorCompatibilityWrapperContract.task_runner_methods_called.length === 0, 'Actor Watch compatibility wrapper contract should call no TaskRunner methods');
    assert(watchActorCompatibilityWrapperContract.discovered_killmail_refs_written === 0, 'Actor Watch compatibility wrapper contract should not write discovered_killmail_refs');
    assert(watchActorCompatibilityWrapperContract.evidence_writes === 0, 'Actor Watch compatibility wrapper contract should not write Evidence/EVEidence');
    assert(watchActorCompatibilityWrapperContract.evidence_landing_performed === false, 'Actor Watch compatibility wrapper contract should not land Evidence/EVEidence');
    assert(watchActorCompatibilityWrapperContract.live_esi_backed_expansion_run === false, 'Actor Watch compatibility wrapper contract should not run live ESI-backed expansion');
    assert(watchActorCompatibilityWrapperContract.hydration_writes === 0, 'Actor Watch compatibility wrapper contract should not write Hydration output');
    assert(watchActorCompatibilityWrapperContract.watch_mutations === 0, 'Actor Watch compatibility wrapper contract should not mutate Watch rows');
    assert(watchActorCompatibilityWrapperContract.schema_changes === 0, 'Actor Watch compatibility wrapper contract should not change schema');
    assert(watchActorCompatibilityWrapperContract.runtime_enforcement_active === false, 'Actor Watch compatibility wrapper contract should not activate enforcement');
    assert(watchActorCompatibilityWrapperContract.boundary_flags.system_radius_behavior_changed === false, 'Actor Watch compatibility wrapper contract should not change system/radius behavior');

    const watchActorCompatibilityWrapperAdapterFixture = await invokeServiceCommand('watch.actor_compatibility_wrapper_adapter_fixture.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchActorCompatibilityWrapperAdapterFixture.read_only === true, 'Actor Watch compatibility wrapper adapter fixture should declare read-only behavior');
    assert(watchActorCompatibilityWrapperAdapterFixture.fixture_only === true, 'Actor Watch compatibility wrapper adapter fixture should be fixture-only');
    assert(watchActorCompatibilityWrapperAdapterFixture.adapter_fixture_only === true, 'Actor Watch compatibility wrapper adapter fixture should be adapter fixture only');
    assert(watchActorCompatibilityWrapperAdapterFixture.wrapper_status === 'adapter_fixture_only_not_active', 'Actor Watch compatibility wrapper adapter fixture should be inactive adapter fixture only');
    assert(watchActorCompatibilityWrapperAdapterFixture.old_entry_point === 'actor.watch', 'Actor Watch compatibility wrapper adapter fixture should identify old entry point');
    assert(watchActorCompatibilityWrapperAdapterFixture.provider_calls === 0, 'Actor Watch compatibility wrapper adapter fixture should not call providers');
    assert(watchActorCompatibilityWrapperAdapterFixture.live_api_calls === 0, 'Actor Watch compatibility wrapper adapter fixture should not make live/API calls');
    assert(watchActorCompatibilityWrapperAdapterFixture.watch_execution === false, 'Actor Watch compatibility wrapper adapter fixture should not execute Watch');
    assert(watchActorCompatibilityWrapperAdapterFixture.watch_dispatches === 0, 'Actor Watch compatibility wrapper adapter fixture should not dispatch Watch execution');
    assert(watchActorCompatibilityWrapperAdapterFixture.mixed_collectors_invoked === false, 'Actor Watch compatibility wrapper adapter fixture should not invoke mixed collectors');
    assert(watchActorCompatibilityWrapperAdapterFixture.collect_actor_watch_invoked === false, 'Actor Watch compatibility wrapper adapter fixture should not invoke collectActorWatch');
    assert(watchActorCompatibilityWrapperAdapterFixture.actor_watch_redirected === false, 'Actor Watch compatibility wrapper adapter fixture should not redirect actor.watch');
    assert(watchActorCompatibilityWrapperAdapterFixture.mixed_collector_retired === false, 'Actor Watch compatibility wrapper adapter fixture should not retire collectors');
    assert(watchActorCompatibilityWrapperAdapterFixture.tasks_created === 0, 'Actor Watch compatibility wrapper adapter fixture should not create tasks');
    assert(Array.isArray(watchActorCompatibilityWrapperAdapterFixture.task_runner_methods_called) && watchActorCompatibilityWrapperAdapterFixture.task_runner_methods_called.length === 0, 'Actor Watch compatibility wrapper adapter fixture should call no TaskRunner methods');
    assert(watchActorCompatibilityWrapperAdapterFixture.discovered_killmail_refs_written === 0, 'Actor Watch compatibility wrapper adapter fixture should not write discovered_killmail_refs');
    assert(watchActorCompatibilityWrapperAdapterFixture.evidence_writes === 0, 'Actor Watch compatibility wrapper adapter fixture should not write Evidence/EVEidence');
    assert(watchActorCompatibilityWrapperAdapterFixture.evidence_landing_performed === false, 'Actor Watch compatibility wrapper adapter fixture should not land Evidence/EVEidence');
    assert(watchActorCompatibilityWrapperAdapterFixture.hydration_writes === 0, 'Actor Watch compatibility wrapper adapter fixture should not write Hydration output');
    assert(watchActorCompatibilityWrapperAdapterFixture.watch_mutations === 0, 'Actor Watch compatibility wrapper adapter fixture should not mutate Watch rows');
    assert(watchActorCompatibilityWrapperAdapterFixture.schema_changes === 0, 'Actor Watch compatibility wrapper adapter fixture should not change schema');
    assert(watchActorCompatibilityWrapperAdapterFixture.runtime_enforcement_active === false, 'Actor Watch compatibility wrapper adapter fixture should not activate enforcement');
    assert(watchActorCompatibilityWrapperAdapterFixture.boundary_flags.system_radius_behavior_changed === false, 'Actor Watch compatibility wrapper adapter fixture should not change system/radius behavior');

    const watchActorCompatibilityWrapper = await invokeServiceCommand('watch.actor_compatibility_wrapper.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchActorCompatibilityWrapper.read_only === true, 'Actor Watch compatibility wrapper runtime preview should declare read-only behavior');
    assert(watchActorCompatibilityWrapper.fixture_only === true, 'Actor Watch compatibility wrapper runtime preview should be fixture-only');
    assert(watchActorCompatibilityWrapper.compatibility_wrapper_preview === true, 'Actor Watch compatibility wrapper runtime preview should mark compatibility-wrapper preview posture');
    assert(watchActorCompatibilityWrapper.wrapper_status === 'explicit_preview_no_provider_no_write_not_active', 'Actor Watch compatibility wrapper runtime preview should be inactive explicit preview only');
    assert(watchActorCompatibilityWrapper.adapter_basis_action === 'watch.actor_compatibility_wrapper_adapter_fixture.preview', 'Actor Watch compatibility wrapper runtime preview should use adapter fixture basis');
    assert(watchActorCompatibilityWrapper.old_entry_point === 'actor.watch', 'Actor Watch compatibility wrapper runtime preview should identify old entry point');
    assert(watchActorCompatibilityWrapper.provider_calls === 0, 'Actor Watch compatibility wrapper runtime preview should not call providers');
    assert(watchActorCompatibilityWrapper.live_api_calls === 0, 'Actor Watch compatibility wrapper runtime preview should not make live/API calls');
    assert(watchActorCompatibilityWrapper.watch_execution === false, 'Actor Watch compatibility wrapper runtime preview should not execute Watch');
    assert(watchActorCompatibilityWrapper.watch_dispatches === 0, 'Actor Watch compatibility wrapper runtime preview should not dispatch Watch execution');
    assert(watchActorCompatibilityWrapper.mixed_collectors_invoked === false, 'Actor Watch compatibility wrapper runtime preview should not invoke mixed collectors');
    assert(watchActorCompatibilityWrapper.collect_actor_watch_invoked === false, 'Actor Watch compatibility wrapper runtime preview should not invoke collectActorWatch');
    assert(watchActorCompatibilityWrapper.actor_watch_redirected === false, 'Actor Watch compatibility wrapper runtime preview should not redirect actor.watch');
    assert(watchActorCompatibilityWrapper.mixed_collector_retired === false, 'Actor Watch compatibility wrapper runtime preview should not retire collectors');
    assert(watchActorCompatibilityWrapper.tasks_created === 0, 'Actor Watch compatibility wrapper runtime preview should not create tasks');
    assert(Array.isArray(watchActorCompatibilityWrapper.task_runner_methods_called) && watchActorCompatibilityWrapper.task_runner_methods_called.length === 0, 'Actor Watch compatibility wrapper runtime preview should call no TaskRunner methods');
    assert(watchActorCompatibilityWrapper.discovered_killmail_refs_written === 0, 'Actor Watch compatibility wrapper runtime preview should not write discovered_killmail_refs');
    assert(watchActorCompatibilityWrapper.evidence_writes === 0, 'Actor Watch compatibility wrapper runtime preview should not write Evidence/EVEidence');
    assert(watchActorCompatibilityWrapper.evidence_landing_performed === false, 'Actor Watch compatibility wrapper runtime preview should not land Evidence/EVEidence');
    assert(watchActorCompatibilityWrapper.hydration_writes === 0, 'Actor Watch compatibility wrapper runtime preview should not write Hydration output');
    assert(watchActorCompatibilityWrapper.watch_mutations === 0, 'Actor Watch compatibility wrapper runtime preview should not mutate Watch rows');
    assert(watchActorCompatibilityWrapper.schema_changes === 0, 'Actor Watch compatibility wrapper runtime preview should not change schema');
    assert(watchActorCompatibilityWrapper.runtime_enforcement_active === false, 'Actor Watch compatibility wrapper runtime preview should not activate enforcement');
    assert(watchActorCompatibilityWrapper.existing_runtime_preserved.runActorWatchService_current_call_target === 'runActorWatchDirectBody', 'Actor Watch compatibility wrapper runtime preview should disclose current direct runtime path');
    assert(watchActorCompatibilityWrapper.existing_runtime_preserved.scheduled_actor_watch_dispatch_command === 'actor.watch', 'Actor Watch compatibility wrapper runtime preview should disclose current scheduled command path');
    assert(watchActorCompatibilityWrapper.existing_runtime_preserved.scheduled_actor_watch_current_runner === 'runScheduledActorWatch', 'Actor Watch compatibility wrapper runtime preview should disclose current scheduled runner');
    assert(watchActorCompatibilityWrapper.existing_runtime_preserved.scheduled_actor_watch_runner_call_target === 'runActorWatchDirectBody', 'Actor Watch compatibility wrapper runtime preview should disclose scheduled runner direct body call target');
    assert(watchActorCompatibilityWrapper.existing_runtime_preserved.collectActorWatch_status === 'legacy_compatibility_available_retirement_candidate', 'Actor Watch compatibility wrapper runtime preview should disclose collectActorWatch parked legacy status');
    assert(watchActorCompatibilityWrapper.represented_old_result_fields.includes('actor'), 'Actor Watch compatibility wrapper runtime preview should expose represented old result fields');
    assert(watchActorCompatibilityWrapper.approximate_old_result_fields.includes('warnings'), 'Actor Watch compatibility wrapper runtime preview should expose approximate old result fields');
    assert(watchActorCompatibilityWrapper.not_represented_old_result_fields.includes('real fetch_runs run_id and lifecycle'), 'Actor Watch compatibility wrapper runtime preview should expose not represented old result fields');
    assert(watchActorCompatibilityWrapper.parked_old_result_fields.includes('actor.watch redirect'), 'Actor Watch compatibility wrapper runtime preview should expose parked redirect');
    assert(watchActorCompatibilityWrapper.legacy_term_posture.legacy_mixed_collector_language_is_compatibility_only === true, 'Actor Watch compatibility wrapper runtime preview should mark old mixed terminology as compatibility-only');
    assert(watchActorCompatibilityWrapper.boundary_flags.system_radius_behavior_changed === false, 'Actor Watch compatibility wrapper runtime preview should not change system/radius behavior');

    const watchActorDiscoveryRouteBodyFixture = await invokeServiceCommand('watch.actor_discovery_route_body_fixture.preview', {
      now: '2026-06-07T22:15:00.000Z',
      maxRefs: 5,
      maxExpansions: 2
    }, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchActorDiscoveryRouteBodyFixture.read_only === true, 'Actor Watch Discovery route body fixture should declare read-only behavior');
    assert(watchActorDiscoveryRouteBodyFixture.fixture_only === true, 'Actor Watch Discovery route body fixture should be fixture-only');
    assert(watchActorDiscoveryRouteBodyFixture.route_body_fixture_only === true, 'Actor Watch Discovery route body fixture should identify route-body fixture posture');
    assert(watchActorDiscoveryRouteBodyFixture.provider_calls === 0, 'Actor Watch Discovery route body fixture should not call providers');
    assert(watchActorDiscoveryRouteBodyFixture.live_api_calls === 0, 'Actor Watch Discovery route body fixture should not make live/API calls');
    assert(watchActorDiscoveryRouteBodyFixture.fake_zkill_client_invocations === 1, 'Actor Watch Discovery route body fixture should use fake zKill client');
    assert(watchActorDiscoveryRouteBodyFixture.fake_esi_client_invocations === 2, 'Actor Watch Discovery route body fixture should use fake ESI client for selected refs');
    assert(watchActorDiscoveryRouteBodyFixture.watch_execution === false, 'Actor Watch Discovery route body fixture should not execute Watch');
    assert(watchActorDiscoveryRouteBodyFixture.watch_dispatches === 0, 'Actor Watch Discovery route body fixture should not dispatch Watch execution');
    assert(watchActorDiscoveryRouteBodyFixture.mixed_collectors_invoked === false, 'Actor Watch Discovery route body fixture should not invoke mixed collectors');
    assert(watchActorDiscoveryRouteBodyFixture.collect_actor_watch_invoked === false, 'Actor Watch Discovery route body fixture should not invoke collectActorWatch');
    assert(watchActorDiscoveryRouteBodyFixture.production_actor_watch_redirected === false, 'Actor Watch Discovery route body fixture should not redirect actor.watch');
    assert(watchActorDiscoveryRouteBodyFixture.runActorWatchService_changed === false, 'Actor Watch Discovery route body fixture should not change runActorWatchService');
    assert(watchActorDiscoveryRouteBodyFixture.watchExecutor_dispatchFor_changed === false, 'Actor Watch Discovery route body fixture should not change watchExecutor.dispatchFor');
    assert(watchActorDiscoveryRouteBodyFixture.discovered_killmail_refs_written === 0, 'Actor Watch Discovery route body fixture should not write discovered_killmail_refs');
    assert(watchActorDiscoveryRouteBodyFixture.evidence_writes === 0, 'Actor Watch Discovery route body fixture should not write Evidence/EVEidence');
    assert(watchActorDiscoveryRouteBodyFixture.evidence_landing_performed === false, 'Actor Watch Discovery route body fixture should not land Evidence/EVEidence');
    assert(watchActorDiscoveryRouteBodyFixture.hydration_writes === 0, 'Actor Watch Discovery route body fixture should not write Hydration output');
    assert(watchActorDiscoveryRouteBodyFixture.watch_mutations === 0, 'Actor Watch Discovery route body fixture should not mutate Watch rows');
    assert(watchActorDiscoveryRouteBodyFixture.schema_changes === 0, 'Actor Watch Discovery route body fixture should not change schema');
    assert(watchActorDiscoveryRouteBodyFixture.runtime_enforcement_active === false, 'Actor Watch Discovery route body fixture should not activate enforcement');
    assert(watchActorDiscoveryRouteBodyFixture.boundary_flags.system_radius_behavior_changed === false, 'Actor Watch Discovery route body fixture should not change system/radius behavior');
    assert(watchActorDiscoveryRouteBodyFixture.non_invocation_proof.collectActorWatch_imported === false, 'Actor Watch Discovery route body fixture should prove collectActorWatch is not imported');
    assert(watchActorDiscoveryRouteBodyFixture.old_caller_facing_compatibility_result.expansion_attempted === 2, 'Actor Watch Discovery route body fixture should expose old compatibility result shape');

    const beforeActorDiscoveryHandoff = tableCounts(db);
    const watchActorDiscoveryHandoffContract = await invokeServiceCommand('watch.actor_discovery_handoff_contract.preview', {
      now: '2026-06-12T00:00:00.000Z'
    }, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    const afterActorDiscoveryHandoff = tableCounts(db);
    assertSame(afterActorDiscoveryHandoff, beforeActorDiscoveryHandoff, 'Actor Watch / Discovery handoff contract preview should not mutate caller/operator DB');
    assert(watchActorDiscoveryHandoffContract.read_only === true, 'Actor Watch / Discovery handoff contract preview should declare read-only behavior');
    assert(watchActorDiscoveryHandoffContract.fixture_only === true, 'Actor Watch / Discovery handoff contract preview should be fixture-only');
    assert(watchActorDiscoveryHandoffContract.provider_calls === 0, 'Actor Watch / Discovery handoff contract preview should not call providers');
    assert(watchActorDiscoveryHandoffContract.live_api_calls === 0, 'Actor Watch / Discovery handoff contract preview should not make live/API calls');
    assert(watchActorDiscoveryHandoffContract.watch_execution === false, 'Actor Watch / Discovery handoff contract preview should not execute Watch');
    assert(watchActorDiscoveryHandoffContract.watch_dispatches === 0, 'Actor Watch / Discovery handoff contract preview should not dispatch Watch');
    assert(watchActorDiscoveryHandoffContract.tasks_created === 0, 'Actor Watch / Discovery handoff contract preview should not create tasks');
    assert(watchActorDiscoveryHandoffContract.discovered_killmail_refs_written === 0, 'Actor Watch / Discovery handoff contract preview should not write Discovery refs');
    assert(watchActorDiscoveryHandoffContract.evidence_writes === 0, 'Actor Watch / Discovery handoff contract preview should not write Evidence/EVEidence');
    assert(watchActorDiscoveryHandoffContract.hydration_writes === 0, 'Actor Watch / Discovery handoff contract preview should not write Hydration output');
    assert(watchActorDiscoveryHandoffContract.watch_mutations === 0, 'Actor Watch / Discovery handoff contract preview should not mutate Watch rows');
    assert(watchActorDiscoveryHandoffContract.schema_changes === 0, 'Actor Watch / Discovery handoff contract preview should not change schema');
    assert(watchActorDiscoveryHandoffContract.runtime_enforcement_active === false, 'Actor Watch / Discovery handoff contract preview should not activate enforcement');
    assert(watchActorDiscoveryHandoffContract.collect_actor_watch_retired === false, 'Actor Watch / Discovery handoff contract preview should not retire collectActorWatch');
    assert(watchActorDiscoveryHandoffContract.system_radius_behavior_changed === false, 'Actor Watch / Discovery handoff contract preview should not change system/radius Watch');
    assert(watchActorDiscoveryHandoffContract.direct_projection.request.model === 'actor_watch_discovery_request', 'Actor Watch / Discovery handoff contract should expose direct request model');
    assert(watchActorDiscoveryHandoffContract.direct_projection.receipt.model === 'actor_watch_discovery_receipt', 'Actor Watch / Discovery handoff contract should expose direct receipt model');
    assert(watchActorDiscoveryHandoffContract.scheduled_projection.request.source === 'scheduled_actor_watch', 'Actor Watch / Discovery handoff contract should expose scheduled request source');
    assert(watchActorDiscoveryHandoffContract.scheduled_projection.receipt.compatibility_summary.expansion_attempted === 2, 'Actor Watch / Discovery handoff contract should preserve scheduled compatibility summary under receipt');
    assert(watchActorDiscoveryHandoffContract.compatibility_posture.field_count === 22, 'Actor Watch / Discovery handoff contract should preserve 22 compatibility fields');
    assert(watchActorDiscoveryHandoffContract.compatibility_posture.field_parity.matches === true, 'Actor Watch / Discovery handoff contract should preserve compatibility field parity');
    assert(watchActorDiscoveryHandoffContract.contract_projection_shape.compatibility_summary_is_future_contract === false, 'Actor Watch / Discovery handoff contract should not promote compatibility summary as future contract');

    const beforeControlledAdapterFixture = tableCounts(db);
    const watchActorControlledRuntimeAdapterFixture = await invokeServiceCommand('watch.actor_controlled_runtime_adapter_fixture.preview', {
      now: '2026-06-08T00:00:00.000Z'
    }, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    const afterControlledAdapterFixture = tableCounts(db);
    assertSame(afterControlledAdapterFixture, beforeControlledAdapterFixture, 'Actor Watch controlled runtime adapter fixture should not mutate caller/operator DB');
    assert(watchActorControlledRuntimeAdapterFixture.fixture_only === true, 'Actor Watch controlled runtime adapter fixture should be fixture-only');
    assert(watchActorControlledRuntimeAdapterFixture.disposable_db_only === true, 'Actor Watch controlled runtime adapter fixture should use disposable DBs only');
    assert(watchActorControlledRuntimeAdapterFixture.uses_real_repository_methods === true, 'Actor Watch controlled runtime adapter fixture should use real repository methods');
    assert(watchActorControlledRuntimeAdapterFixture.provider_calls === 0, 'Actor Watch controlled runtime adapter fixture should not call providers');
    assert(watchActorControlledRuntimeAdapterFixture.live_api_calls === 0, 'Actor Watch controlled runtime adapter fixture should not make live/API calls');
    assert(watchActorControlledRuntimeAdapterFixture.collect_actor_watch_invoked === false, 'Actor Watch controlled runtime adapter fixture should not invoke collectActorWatch');
    assert(watchActorControlledRuntimeAdapterFixture.production_actor_watch_redirected === false, 'Actor Watch controlled runtime adapter fixture should not redirect actor.watch');
    assert(watchActorControlledRuntimeAdapterFixture.runActorWatchService_changed === false, 'Actor Watch controlled runtime adapter fixture should not change runActorWatchService');
    assert(watchActorControlledRuntimeAdapterFixture.watchExecutor_dispatchFor_changed === false, 'Actor Watch controlled runtime adapter fixture should not change watchExecutor.dispatchFor');
    assert(watchActorControlledRuntimeAdapterFixture.operator_corpus_non_mutation_proof.unchanged === true, 'Actor Watch controlled runtime adapter fixture should prove operator DB unchanged');
    assert(watchActorControlledRuntimeAdapterFixture.cases.fresh_actor_candidate_acquisition.persisted_killmails === 2, 'Actor Watch controlled runtime adapter fixture should land fresh Evidence/EVEidence in disposable DB');
    assert(watchActorControlledRuntimeAdapterFixture.cases.pending_candidate_drain.fake_zkill_client_invocations === 0, 'Actor Watch controlled runtime adapter fixture should drain pending refs before zKill');
    assert(watchActorControlledRuntimeAdapterFixture.cases.local_evidence_cache_skip.discovery_ref_status_counts.cached === 1, 'Actor Watch controlled runtime adapter fixture should mark cached refs in disposable DB');
    assert(watchActorControlledRuntimeAdapterFixture.cases.expansion_failure.discovery_ref_status_counts.failed === 1, 'Actor Watch controlled runtime adapter fixture should mark failed refs in disposable DB');

    const beforeControlledAdapterDisabled = tableCounts(db);
    const watchActorControlledAdapterDisabled = await invokeServiceCommand('watch.actor_controlled_adapter_disabled.preview', {
      now: '2026-06-11T00:00:00.000Z'
    }, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    const afterControlledAdapterDisabled = tableCounts(db);
    assertSame(afterControlledAdapterDisabled, beforeControlledAdapterDisabled, 'Actor Watch controlled adapter disabled seam should not mutate caller/operator DB');
    assert(watchActorControlledAdapterDisabled.disabled === true, 'Actor Watch controlled adapter disabled seam should report disabled posture');
    assert(watchActorControlledAdapterDisabled.fixture_only === true, 'Actor Watch controlled adapter disabled seam should be fixture-only');
    assert(watchActorControlledAdapterDisabled.renderer_eligible === false, 'Actor Watch controlled adapter disabled seam should not be renderer eligible');
    assert(watchActorControlledAdapterDisabled.provider_calls === 0, 'Actor Watch controlled adapter disabled seam should not call providers');
    assert(watchActorControlledAdapterDisabled.live_api_calls === 0, 'Actor Watch controlled adapter disabled seam should not make live/API calls');
    assert(watchActorControlledAdapterDisabled.operator_corpus_non_mutation_proof.unchanged === true, 'Actor Watch controlled adapter disabled seam should prove operator DB unchanged');
    assert(watchActorControlledAdapterDisabled.production_actor_watch_redirected === false, 'Actor Watch controlled adapter disabled seam should not redirect actor.watch');
    assert(watchActorControlledAdapterDisabled.runActorWatchService_changed === false, 'Actor Watch controlled adapter disabled seam should not change runActorWatchService');
    assert(watchActorControlledAdapterDisabled.watchExecutor_dispatchFor_changed === false, 'Actor Watch controlled adapter disabled seam should not change watchExecutor.dispatchFor');
    assert(watchActorControlledAdapterDisabled.collect_actor_watch_imported === false, 'Actor Watch controlled adapter disabled seam should not import collectActorWatch');
    assert(watchActorControlledAdapterDisabled.collect_actor_watch_invoked === false, 'Actor Watch controlled adapter disabled seam should not invoke collectActorWatch');
    assert(watchActorControlledAdapterDisabled.direct_compatibility_summary_proof.top_level_is_summary_object === true, 'Actor Watch controlled adapter disabled seam should return direct compatibility summary object');
    assert(watchActorControlledAdapterDisabled.direct_compatibility_summary_proof.field_parity.matches === true, 'Actor Watch controlled adapter disabled seam should preserve compatibility summary fields');
    assert(watchActorControlledAdapterDisabled.scheduled_style_wrapper_proof.collection_under_data === true, 'Actor Watch controlled adapter disabled seam should expose scheduled-style data.collection posture');
    assert(watchActorControlledAdapterDisabled.scheduled_style_wrapper_proof.tick_invoked === false, 'Actor Watch controlled adapter disabled seam should not invoke tick');
    assert(watchActorControlledAdapterDisabled.scheduled_style_wrapper_proof.task_created === false, 'Actor Watch controlled adapter disabled seam should not create tasks');

    const watchOperatorConfirmationContract = await invokeServiceCommand('watch.operator_confirmation_contract.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchOperatorConfirmationContract.read_only === true, 'Watch operator confirmation contract preview should declare read-only behavior');
    assert(watchOperatorConfirmationContract.provider_calls === 0, 'Watch operator confirmation contract preview should not call providers');
    assert(watchOperatorConfirmationContract.watch_dispatches === 0, 'Watch operator confirmation contract preview should not dispatch Watch execution');
    assert(watchOperatorConfirmationContract.tasks_created === 0, 'Watch operator confirmation contract preview should not create tasks');
    assert(watchOperatorConfirmationContract.evidence_writes === 0, 'Watch operator confirmation contract preview should not write Evidence/EVEidence');
    assert(watchOperatorConfirmationContract.schema_changes === 0, 'Watch operator confirmation contract preview should not change schema');
    assert(watchOperatorConfirmationContract.runtime_enforcement_active === false, 'Watch operator confirmation contract preview should not activate enforcement');

    const systemRadiusAuthoringPreflight = await invokeServiceCommand('watch.system_radius_authoring_preflight.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(systemRadiusAuthoringPreflight.read_only === true, 'system/radius authoring preflight should declare read-only behavior');
    assert(systemRadiusAuthoringPreflight.provider_calls === 0, 'system/radius authoring preflight should not call providers');
    assert(systemRadiusAuthoringPreflight.watch_rows_written === 0, 'system/radius authoring preflight should not write Watch rows');
    assert(systemRadiusAuthoringPreflight.watch_dispatches === 0, 'system/radius authoring preflight should not dispatch Watch execution');
    assert(systemRadiusAuthoringPreflight.tasks_created === 0, 'system/radius authoring preflight should not create tasks');
    assert(systemRadiusAuthoringPreflight.evidence_writes === 0, 'system/radius authoring preflight should not write Evidence/EVEidence');
    assert(systemRadiusAuthoringPreflight.schema_changes === 0, 'system/radius authoring preflight should not change schema');
    assert(systemRadiusAuthoringPreflight.runtime_enforcement_active === false, 'system/radius authoring preflight should not activate enforcement');

    const systemRadiusAcceptancePayload = await invokeServiceCommand('watch.system_radius_acceptance_payload.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(systemRadiusAcceptancePayload.read_only === true, 'system/radius acceptance payload should declare read-only behavior');
    assert(systemRadiusAcceptancePayload.provider_calls === 0, 'system/radius acceptance payload should not call providers');
    assert(systemRadiusAcceptancePayload.watch_rows_written === 0, 'system/radius acceptance payload should not write Watch rows');
    assert(systemRadiusAcceptancePayload.watch_dispatches === 0, 'system/radius acceptance payload should not dispatch Watch execution');
    assert(systemRadiusAcceptancePayload.tasks_created === 0, 'system/radius acceptance payload should not create tasks');
    assert(systemRadiusAcceptancePayload.evidence_writes === 0, 'system/radius acceptance payload should not write Evidence/EVEidence');
    assert(systemRadiusAcceptancePayload.schema_changes === 0, 'system/radius acceptance payload should not change schema');
    assert(systemRadiusAcceptancePayload.runtime_enforcement_active === false, 'system/radius acceptance payload should not activate enforcement');

    const watchCreateMutationSafetyMap = await invokeServiceCommand('watch.create_mutation_safety_map.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(watchCreateMutationSafetyMap.read_only === true, 'watch.create mutation safety map should declare read-only behavior');
    assert(watchCreateMutationSafetyMap.provider_calls === 0, 'watch.create mutation safety map should not call providers');
    assert(watchCreateMutationSafetyMap.watch_rows_written === 0, 'watch.create mutation safety map should not write Watch rows');
    assert(watchCreateMutationSafetyMap.watch_dispatches === 0, 'watch.create mutation safety map should not dispatch Watch execution');
    assert(watchCreateMutationSafetyMap.tasks_created === 0, 'watch.create mutation safety map should not create tasks');
    assert(watchCreateMutationSafetyMap.evidence_writes === 0, 'watch.create mutation safety map should not write Evidence/EVEidence');
    assert(watchCreateMutationSafetyMap.schema_changes === 0, 'watch.create mutation safety map should not change schema');
    assert(watchCreateMutationSafetyMap.runtime_enforcement_active === false, 'watch.create mutation safety map should not activate enforcement');

    const patientPacketIdentity = await invokeServiceCommand('runtime.patient_packet_identity.preview', {}, {
      db,
      databasePath: path.join(auraTempRoot(), 'service-registry.sqlite')
    });
    assert(patientPacketIdentity.read_only === true, 'patient packet identity preview should declare read-only behavior');
    assert(patientPacketIdentity.provider_calls === 0, 'patient packet identity preview should not call providers');
    assert(patientPacketIdentity.dispatches === 0, 'patient packet identity preview should not dispatch work');
    assert(patientPacketIdentity.packet_tables_created === 0, 'patient packet identity preview should not create packet tables');
    assert(patientPacketIdentity.evidence_writes === 0, 'patient packet identity preview should not write evidence');
    assert(patientPacketIdentity.hydration_writes === 0, 'patient packet identity preview should not write hydration output');
    assert(patientPacketIdentity.runtime_enforcement_active === false, 'patient packet identity preview should not activate enforcement');

    const liveGate = await invokeServiceCommand('live.gate', {
      action: 'manual.expansion',
      input: { maxExpansions: 2 }
    }, { db });
    assert(liveGate.mode === 'live-required', 'manual expansion should be live-required');
    assert(liveGate.estimated_api_calls.esi === 2, 'manual expansion should estimate ESI calls from cap');

    const defaults = await invokeServiceCommand('scope.defaults', {}, { db });
    assert(defaults.manualActorDiscovery.maxRefs === 20, 'scope defaults should include manual actor defaults');

    const validated = await invokeServiceCommand('scope.validate', {
      kind: 'manual_discovery',
      input: {
        scope: 'actor',
        entityType: 'character',
        entityId: 90000002
      }
    }, { db });
    assert(validated.valid === true, 'scope.validate should return valid result');
    assert(validated.normalized.lookbackSeconds === defaults.manualActorDiscovery.lookbackSeconds, 'scope.validate should apply defaults');

    const namedSystemScope = await invokeServiceCommand('scope.validate', {
      kind: 'manual_discovery',
      input: {
        scope: 'system',
        centerSystemName: 'Atlas Prime'
      }
    }, { db });
    assert(namedSystemScope.normalized.centerSystemId === 30000001, 'scope.validate should resolve system names locally when DB context is available');
    assert(namedSystemScope.normalized.radiusJumps === 0, 'named system discovery should remain radius 0');

    await assertRejects(
      () => invokeServiceCommand('scope.validate', {
        kind: 'actor_watch',
        input: {
          entityType: 'system',
          entityId: 30000001
        }
      }, { db }),
      'invalid typed actor scope should be rejected'
    );

    await assertRejects(
      () => invokeServiceCommand('evidence.rawInsert', {}, { db }),
      'unknown evidence command should be rejected'
    );
    await assertRejects(
      () => invokeServiceCommand('app.readiness', {}, {}),
      'missing DB context should be rejected'
    );

    const ipcMain = fakeIpcMain();
    registerIpcServiceHandlers(ipcMain, () => ({
      db,
      databasePath: path.join(auraTempRoot(), 'ipc-readiness.sqlite')
    }));
    assert(ipcMain.handlers.has('atlas:service:list'), 'IPC list handler should be registered');
    assert(ipcMain.handlers.has('atlas:service:invoke'), 'IPC invoke handler should be registered');
    const ipcReadiness = await ipcMain.handlers.get('atlas:service:invoke')(null, {
      command: 'app.readiness',
      payload: {}
    });
    assert(ipcReadiness.checks.db_initialized === true, 'IPC invoke should return readiness object');

    const ipcScope = await ipcMain.handlers.get('atlas:service:invoke')(null, {
      command: 'scope.validate',
      payload: {
        kind: 'system_radius_watch',
        input: {
          centerSystemName: 'Atlas Prime',
          radiusJumps: 1
        }
      }
    });
    assert(ipcScope.normalized.maxExpansions === 2, 'IPC scope validation should apply system watch defaults');

    const taskWrappedReadiness = await ipcMain.handlers.get('atlas:service:invoke')(null, {
      command: 'app.readiness',
      payload: {},
      asTask: true
    });
    assert(taskWrappedReadiness.status === 'succeeded', 'asTask service call should return succeeded task');
    assert(taskWrappedReadiness.result.checks.db_initialized === true, 'asTask result should include command data');

    const taskHistory = await invokeServiceCommand('task.list', { limit: 5 }, { db });
    assert(taskHistory.some((task) => task.task_id === taskWrappedReadiness.task_id), 'task.list should include task-wrapped command');
  } finally {
    closeDatabase(db);
  }

  console.log('service registry verified');
}

function fakeIpcMain() {
  return {
    handlers: new Map(),
    handle(channel, handler) {
      this.handlers.set(channel, handler);
    }
  };
}

function tableCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    watchlist_entities: count(db, 'watchlist_entities')
  };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

async function assertRejects(fn, message) {
  try {
    await fn();
  } catch {
    return;
  }
  throw new Error(message);
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
