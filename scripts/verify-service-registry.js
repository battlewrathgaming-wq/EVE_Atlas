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
