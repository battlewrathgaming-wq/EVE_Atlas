const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { HttpClient } = require('../src/main/api/httpClient');
const {
  CONFIRMATION,
  invokeServiceCommand,
  listServiceCommands,
  registerIpcServiceHandlers
} = require('../src/main/services/serviceRegistry');
const { auraTempRoot } = require('../src/main/util/tempPaths');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const commands = new Map(listServiceCommands().map((entry) => [entry.command, entry]));
    assert(commands.get('manual.discovery')?.effects.includes('local-data-mutation'), 'manual.discovery should declare queue/local mutation effect');
    assert(commands.get('manual.discovery')?.effects.includes('external-live-api'), 'manual.discovery should declare live provider effect');
    assert(!commands.get('manual.discovery')?.effects.includes('evidence-creation'), 'manual.discovery must not claim evidence creation');
    assert(commands.get('manual.expansion')?.effects.includes('evidence-creation'), 'manual.expansion should declare evidence creation');
    assert(commands.get('external_io.state_readout')?.classification === 'read-only', 'external_io.state_readout should be read-only');
    assert(commands.get('external_io.state_readout')?.effects.includes('read-only'), 'external_io.state_readout should declare read-only effect');
    assert(commands.get('external_io.state_persistence_proof')?.classification === 'metadata-only', 'external_io.state_persistence_proof should be metadata-only');
    assert(commands.get('external_io.state_persistence_proof')?.effects.includes('local-data-mutation'), 'external_io.state_persistence_proof should declare fixture local mutation effect');
    assert(commands.get('external_io.state_config_readback')?.classification === 'read-only', 'external_io.state_config_readback should be read-only');
    assert(commands.get('external_io.state_config_readback')?.effects.includes('read-only'), 'external_io.state_config_readback should declare read-only effect');
    assert(commands.get('external_io.state_config_write')?.classification === 'metadata-only', 'external_io.state_config_write should be metadata-only');
    assert(commands.get('external_io.state_config_write')?.effects.includes('local-data-mutation'), 'external_io.state_config_write should declare local mutation effect');
    assert(commands.get('metadata.hydration')?.effects.includes('metadata-readability'), 'metadata.hydration should declare readability metadata effect');
    assert(commands.get('metadata.hydration_backlog.preview')?.classification === 'read-only', 'metadata.hydration_backlog.preview should be read-only');
    assert(commands.get('metadata.hydration_backlog.preview')?.effects.includes('read-only'), 'metadata.hydration_backlog.preview should declare read-only effect');
    assert(commands.get('metadata.hydration_execution_policy.preview')?.classification === 'read-only', 'metadata.hydration_execution_policy.preview should be read-only');
    assert(commands.get('metadata.hydration_execution_policy.preview')?.effects.includes('read-only'), 'metadata.hydration_execution_policy.preview should declare read-only effect');
    assert(commands.get('metadata.hydration_candidates.preview')?.classification === 'read-only', 'metadata.hydration_candidates.preview should be read-only');
    assert(commands.get('metadata.hydration_candidates.preview')?.effects.includes('read-only'), 'metadata.hydration_candidates.preview should declare read-only effect');
    assert(commands.get('metadata.hydration_attention_lens.preview')?.classification === 'read-only', 'metadata.hydration_attention_lens.preview should be read-only');
    assert(commands.get('metadata.hydration_attention_lens.preview')?.effects.includes('read-only'), 'metadata.hydration_attention_lens.preview should declare read-only effect');
    assert(commands.get('metadata.hydration_attention_runtime.preview')?.classification === 'read-only', 'metadata.hydration_attention_runtime.preview should be read-only');
    assert(commands.get('metadata.hydration_attention_runtime.preview')?.effects.includes('read-only'), 'metadata.hydration_attention_runtime.preview should declare read-only effect');
    assert(commands.get('metadata.hydration_request_posture.preview')?.classification === 'read-only', 'metadata.hydration_request_posture.preview should be read-only');
    assert(commands.get('metadata.hydration_request_posture.preview')?.effects.includes('read-only'), 'metadata.hydration_request_posture.preview should declare read-only effect');
    assert(commands.get('metadata.hydration_pickup_contract.preview')?.classification === 'read-only', 'metadata.hydration_pickup_contract.preview should be read-only');
    assert(commands.get('metadata.hydration_pickup_contract.preview')?.effects.includes('read-only'), 'metadata.hydration_pickup_contract.preview should declare read-only effect');
    assert(commands.get('metadata.hydration_selected_id_real_execution_preflight.preview')?.classification === 'read-only', 'metadata.hydration_selected_id_real_execution_preflight.preview should be read-only');
    assert(commands.get('metadata.hydration_selected_id_real_execution_preflight.preview')?.effects.includes('read-only'), 'metadata.hydration_selected_id_real_execution_preflight.preview should declare read-only effect');
    assert(commands.get('metadata.selected_id_readability_repair.product_preflight')?.classification === 'read-only', 'metadata.selected_id_readability_repair.product_preflight should be read-only');
    assert(commands.get('metadata.selected_id_readability_repair.product_preflight')?.effects.includes('read-only'), 'metadata.selected_id_readability_repair.product_preflight should declare read-only effect');
    assert(commands.get('metadata.selected_id_resolve_candidate.preview')?.classification === 'read-only', 'metadata.selected_id_resolve_candidate.preview should be read-only');
    assert(commands.get('metadata.selected_id_resolve_candidate.preview')?.effects.includes('read-only'), 'metadata.selected_id_resolve_candidate.preview should declare read-only effect');
    assert(commands.get('metadata.selected_id_readability_repair.execute')?.classification === 'metadata-only', 'metadata.selected_id_readability_repair.execute should be metadata-only');
    assert(commands.get('metadata.selected_id_readability_repair.execute')?.effects.includes('external-live-api'), 'metadata.selected_id_readability_repair.execute should declare live provider effect');
    assert(commands.get('metadata.selected_id_readability_repair.execute')?.effects.includes('metadata-readability'), 'metadata.selected_id_readability_repair.execute should declare readability metadata effect');
    assert(commands.get('metadata.local_sde_readiness.preview')?.classification === 'read-only', 'metadata.local_sde_readiness.preview should be read-only');
    assert(commands.get('metadata.local_sde_readiness.preview')?.effects.includes('read-only'), 'metadata.local_sde_readiness.preview should declare read-only effect');
    assert(commands.get('metadata.local_sde_source_posture.preview')?.classification === 'read-only', 'metadata.local_sde_source_posture.preview should be read-only');
    assert(commands.get('metadata.local_sde_source_posture.preview')?.effects.includes('read-only'), 'metadata.local_sde_source_posture.preview should declare read-only effect');
    assert(commands.get('metadata.hydration_write_fixture_proof')?.classification === 'metadata-only', 'metadata.hydration_write_fixture_proof should be metadata-only');
    assert(commands.get('metadata.hydration_write_fixture_proof')?.effects.includes('metadata-readability'), 'metadata.hydration_write_fixture_proof should declare readability metadata effect');
    assert(commands.get('metadata.hydration_selected_id_execution_fixture_proof')?.classification === 'metadata-only', 'metadata.hydration_selected_id_execution_fixture_proof should be metadata-only');
    assert(commands.get('metadata.hydration_selected_id_execution_fixture_proof')?.effects.includes('metadata-readability'), 'metadata.hydration_selected_id_execution_fixture_proof should declare readability metadata effect');
    assert(commands.get('metadata.hydration_selected_id_real_execution_proof')?.classification === 'metadata-only', 'metadata.hydration_selected_id_real_execution_proof should be metadata-only');
    assert(commands.get('metadata.hydration_selected_id_real_execution_proof')?.effects.includes('external-live-api'), 'metadata.hydration_selected_id_real_execution_proof should declare live provider effect');
    assert(commands.get('metadata.hydration_selected_id_real_execution_proof')?.effects.includes('metadata-readability'), 'metadata.hydration_selected_id_real_execution_proof should declare readability metadata effect');
    assert(commands.get('sde.topology_import_rewrite_authority.proof')?.classification === 'metadata-only', 'sde topology authority proof should be metadata-only');
    assert(commands.get('sde.topology_import_rewrite_authority.proof')?.effects.includes('local-data-mutation'), 'sde topology authority proof should declare fixture local mutation effect');
    assert(commands.get('sde.inventory_import_rewrite_authority.proof')?.classification === 'metadata-only', 'sde inventory authority proof should be metadata-only');
    assert(commands.get('sde.inventory_import_rewrite_authority.proof')?.effects.includes('local-data-mutation'), 'sde inventory authority proof should declare fixture local mutation effect');
    assert(commands.get('runtime.db_snapshot.create')?.effects.includes('support-artifact'), 'snapshot create should declare support artifact effect');
    assert(commands.get('support.debug_trace_pack')?.effects.includes('support-artifact'), 'trace pack should declare support artifact effect');
    assert(commands.get('storage.authority_preflight')?.classification === 'read-only', 'storage authority preflight should be read-only');
    assert(commands.get('storage.authority_preflight')?.effects.includes('read-only'), 'storage authority preflight should declare read-only effect');
    assert(commands.get('storage.setup_gate_readout')?.classification === 'read-only', 'storage setup gate readout should be read-only');
    assert(commands.get('storage.setup_gate_readout')?.effects.includes('read-only'), 'storage setup gate readout should declare read-only effect');
    assert(commands.get('storage.authority_config.write_proof')?.classification === 'metadata-only', 'storage config write proof should be metadata-only');
    assert(commands.get('storage.authority_config.write_proof')?.effects.includes('local-data-mutation'), 'storage config write proof should declare local mutation effect');
    assert(commands.get('storage.authority_config.readback')?.classification === 'read-only', 'storage config readback should be read-only');
    assert(commands.get('storage.authority_config.readback')?.effects.includes('read-only'), 'storage config readback should declare read-only effect');
    assert(commands.get('storage.authority_config.write')?.classification === 'metadata-only', 'storage config write should be metadata-only');
    assert(commands.get('storage.authority_config.write')?.effects.includes('local-data-mutation'), 'storage config write should declare local mutation effect');
    assert(commands.get('storage.authority_config.acknowledgement_persistence_proof')?.classification === 'metadata-only', 'storage acknowledgement persistence proof should be metadata-only');
    assert(commands.get('storage.authority_config.acknowledgement_persistence_proof')?.effects.includes('local-data-mutation'), 'storage acknowledgement persistence proof should declare local mutation effect');
    assert(commands.get('storage.enforcement_dry_run.command_effect_map')?.classification === 'read-only', 'enforcement dry-run map should be read-only');
    assert(commands.get('storage.enforcement_dry_run.command_effect_map')?.effects.includes('read-only'), 'enforcement dry-run map should declare read-only effect');
    assert(commands.get('storage.composed_gate_policy.preview')?.classification === 'read-only', 'composed gate policy preview should be read-only');
    assert(commands.get('storage.composed_gate_policy.preview')?.effects.includes('read-only'), 'composed gate policy preview should declare read-only effect');
    assert(commands.get('support.gate_stack_readout')?.classification === 'read-only', 'gate stack readout should be read-only');
    assert(commands.get('support.gate_stack_readout')?.effects.includes('read-only'), 'gate stack readout should declare read-only effect');
    assert(commands.get('support.artifact_path_authority.preview')?.classification === 'read-only', 'support artifact path authority should be read-only');
    assert(commands.get('support.artifact_path_authority.preview')?.effects.includes('read-only'), 'support artifact path authority should declare read-only effect');
    assert(commands.get('support.artifact_creation_policy.preview')?.classification === 'read-only', 'support artifact creation policy should be read-only');
    assert(commands.get('support.artifact_creation_policy.preview')?.effects.includes('read-only'), 'support artifact creation policy should declare read-only effect');
    assert(commands.get('support.artifact_contents_contract.preview')?.classification === 'read-only', 'support artifact contents contract should be read-only');
    assert(commands.get('support.artifact_contents_contract.preview')?.effects.includes('read-only'), 'support artifact contents contract should declare read-only effect');
    assert(commands.get('support.artifact_writer_conformance_gap_map.preview')?.classification === 'read-only', 'support artifact writer gap map should be read-only');
    assert(commands.get('support.artifact_writer_conformance_gap_map.preview')?.effects.includes('read-only'), 'support artifact writer gap map should declare read-only effect');
    assert(commands.get('support.trace_log_redaction_policy.preview')?.classification === 'read-only', 'trace/log redaction policy should be read-only');
    assert(commands.get('support.trace_log_redaction_policy.preview')?.effects.includes('read-only'), 'trace/log redaction policy should declare read-only effect');
    assert(commands.get('support.api_request_log_redaction_readiness.preview')?.classification === 'read-only', 'API request log redaction readiness should be read-only');
    assert(commands.get('support.api_request_log_redaction_readiness.preview')?.effects.includes('read-only'), 'API request log redaction readiness should declare read-only effect');
    assert(commands.get('runtime.enforcement_boundary.preview')?.classification === 'read-only', 'runtime enforcement boundary preview should be read-only');
    assert(commands.get('runtime.enforcement_boundary.preview')?.effects.includes('read-only'), 'runtime enforcement boundary preview should declare read-only effect');
    assert(commands.get('runtime.enforcement_active_semantics.preview')?.classification === 'read-only', 'runtime active semantics preview should be read-only');
    assert(commands.get('runtime.enforcement_active_semantics.preview')?.effects.includes('read-only'), 'runtime active semantics preview should declare read-only effect');
    assert(commands.get('runtime.enforcement_hook_telemetry.readout')?.classification === 'read-only', 'runtime hook telemetry readout should be read-only');
    assert(commands.get('runtime.enforcement_hook_telemetry.readout')?.effects.includes('read-only'), 'runtime hook telemetry readout should declare read-only effect');
    assert(commands.get('runtime.queue_clock_posture.preview')?.classification === 'read-only', 'queue/clock posture preview should be read-only');
    assert(commands.get('runtime.queue_clock_posture.preview')?.effects.includes('read-only'), 'queue/clock posture preview should declare read-only effect');
    assert(commands.get('runtime.watch_task_outcome_map.preview')?.classification === 'read-only', 'Watch/task outcome map preview should be read-only');
    assert(commands.get('runtime.watch_task_outcome_map.preview')?.effects.includes('read-only'), 'Watch/task outcome map preview should declare read-only effect');
    assert(commands.get('watch.scope_authority_conformance.preview')?.classification === 'read-only', 'Watch scope authority conformance preview should be read-only');
    assert(commands.get('watch.scope_authority_conformance.preview')?.effects.includes('read-only'), 'Watch scope authority conformance preview should declare read-only effect');
    assert(commands.get('watch.authored_execution_readiness.preview')?.classification === 'read-only', 'authored Watch execution readiness preview should be read-only');
    assert(commands.get('watch.authored_execution_readiness.preview')?.effects.includes('read-only'), 'authored Watch execution readiness preview should declare read-only effect');
    assert(commands.get('watch.system_radius_setup_readout.preview')?.classification === 'read-only', 'system/radius setup readout should be read-only');
    assert(commands.get('watch.system_radius_setup_readout.preview')?.effects.includes('read-only'), 'system/radius setup readout should declare read-only effect');
    assert(commands.get('watch.system_radius_readout_readiness_bridge.preview')?.classification === 'read-only', 'system/radius readout/readiness bridge should be read-only');
    assert(commands.get('watch.system_radius_readout_readiness_bridge.preview')?.effects.includes('read-only'), 'system/radius readout/readiness bridge should declare read-only effect');
    assert(commands.get('watch.runtime_packet_plan.preview')?.classification === 'read-only', 'Watch runtime packet plan preview should be read-only');
    assert(commands.get('watch.runtime_packet_plan.preview')?.effects.includes('read-only'), 'Watch runtime packet plan preview should declare read-only effect');
    assert(commands.get('watch.executor_tick_dry_run.preview')?.classification === 'read-only', 'Watch executor tick dry-run preview should be read-only');
    assert(commands.get('watch.executor_tick_dry_run.preview')?.effects.includes('read-only'), 'Watch executor tick dry-run preview should declare read-only effect');
    assert(commands.get('watch.packet_dry_run_dispatch_parity.preview')?.classification === 'read-only', 'Watch packet/dry-run/dispatch parity preview should be read-only');
    assert(commands.get('watch.packet_dry_run_dispatch_parity.preview')?.effects.includes('read-only'), 'Watch packet/dry-run/dispatch parity preview should declare read-only effect');
    assert(commands.get('watch.task_creation_boundary.preview')?.classification === 'read-only', 'Watch task creation boundary preview should be read-only');
    assert(commands.get('watch.task_creation_boundary.preview')?.effects.includes('read-only'), 'Watch task creation boundary preview should declare read-only effect');
    assert(commands.get('watch.system_radius_run_stub.preview')?.classification === 'read-only', 'system/radius Watch-run stub preview should be read-only');
    assert(commands.get('watch.system_radius_run_stub.preview')?.effects.includes('read-only'), 'system/radius Watch-run stub preview should declare read-only effect');
    assert(commands.get('watch.bucket_identity_projection.preview')?.classification === 'read-only', 'Watch bucket identity projection should be read-only');
    assert(commands.get('watch.bucket_identity_projection.preview')?.effects.includes('read-only'), 'Watch bucket identity projection should declare read-only effect');
    assert(commands.get('watch.bucket_pickup_posture_bridge.preview')?.classification === 'read-only', 'Watch bucket pickup posture bridge should be read-only');
    assert(commands.get('watch.bucket_pickup_posture_bridge.preview')?.effects.includes('read-only'), 'Watch bucket pickup posture bridge should declare read-only effect');
    assert(commands.get('watch.bucket_disposable_persistence_fixture.preview')?.classification === 'read-only', 'Watch bucket disposable persistence fixture should be read-only');
    assert(commands.get('watch.bucket_disposable_persistence_fixture.preview')?.effects.includes('read-only'), 'Watch bucket disposable persistence fixture should declare read-only effect');
    assert(commands.get('watch.bucket_product_persistence.emit')?.classification === 'metadata-only', 'Watch bucket product persistence should be metadata-only');
    assert(commands.get('watch.bucket_product_persistence.emit')?.effects.includes('local-data-mutation'), 'Watch bucket product persistence should declare local-data-mutation effect');
    assert(!commands.get('watch.bucket_product_persistence.emit')?.effects.includes('external-live-api'), 'Watch bucket product persistence should not declare external-live-api effect');
    assert(!commands.get('watch.bucket_product_persistence.emit')?.effects.includes('evidence-creation'), 'Watch bucket product persistence should not declare Evidence/EVEidence creation effect');
    assert(commands.get('watch.bucket_product_pickup_readout.preview')?.classification === 'read-only', 'Watch bucket product pickup readout should be read-only');
    assert(commands.get('watch.bucket_product_pickup_readout.preview')?.effects.includes('read-only'), 'Watch bucket product pickup readout should declare read-only effect');
    assert(!commands.get('watch.bucket_product_pickup_readout.preview')?.effects.includes('external-live-api'), 'Watch bucket product pickup readout should not declare external-live-api effect');
    assert(!commands.get('watch.bucket_product_pickup_readout.preview')?.effects.includes('evidence-creation'), 'Watch bucket product pickup readout should not declare Evidence/EVEidence creation effect');
    assert(commands.get('watch.discovery_pickup_packet_proof.preview')?.classification === 'read-only', 'Watch Discovery pickup packet proof should be read-only');
    assert(commands.get('watch.discovery_pickup_packet_proof.preview')?.effects.includes('read-only'), 'Watch Discovery pickup packet proof should declare read-only effect');
    assert(commands.get('discovery.pickup_consumer_fixture.preview')?.classification === 'read-only', 'Discovery pickup consumer fixture should be read-only');
    assert(commands.get('discovery.pickup_consumer_fixture.preview')?.effects.includes('read-only'), 'Discovery pickup consumer fixture should declare read-only effect');
    assert(commands.get('discovery.pickup_consumer_hold_contract.preview')?.classification === 'read-only', 'Discovery pickup consumer hold contract should be read-only');
    assert(commands.get('discovery.pickup_consumer_hold_contract.preview')?.effects.includes('read-only'), 'Discovery pickup consumer hold contract should declare read-only effect');
    assert(commands.get('discovery.pickup_selection_contract.preview')?.classification === 'read-only', 'Discovery pickup selection contract should be read-only');
    assert(commands.get('discovery.pickup_selection_contract.preview')?.effects.includes('read-only'), 'Discovery pickup selection contract should declare read-only effect');
    assert(!commands.get('discovery.pickup_selection_contract.preview')?.effects.includes('external-live-api'), 'Discovery pickup selection contract should not declare external-live-api effect');
    assert(!commands.get('discovery.pickup_selection_contract.preview')?.effects.includes('evidence-creation'), 'Discovery pickup selection contract should not declare Evidence/EVEidence creation effect');
    assert(commands.get('discovery.provider_route_packet.preview')?.classification === 'read-only', 'Discovery provider route packet preview should be read-only');
    assert(commands.get('discovery.provider_route_packet.preview')?.effects.includes('read-only'), 'Discovery provider route packet preview should declare read-only effect');
    assert(!commands.get('discovery.provider_route_packet.preview')?.effects.includes('external-live-api'), 'Discovery provider route packet preview should not declare external-live-api effect');
    assert(!commands.get('discovery.provider_route_packet.preview')?.effects.includes('evidence-creation'), 'Discovery provider route packet preview should not declare Evidence/EVEidence creation effect');
    assert(commands.get('discovery.pickup_execution_boundary.preview')?.classification === 'read-only', 'Discovery pickup execution boundary preview should be read-only');
    assert(commands.get('discovery.pickup_execution_boundary.preview')?.effects.includes('read-only'), 'Discovery pickup execution boundary preview should declare read-only effect');
    assert(!commands.get('discovery.pickup_execution_boundary.preview')?.effects.includes('external-live-api'), 'Discovery pickup execution boundary preview should not declare external-live-api effect');
    assert(!commands.get('discovery.pickup_execution_boundary.preview')?.effects.includes('evidence-creation'), 'Discovery pickup execution boundary preview should not declare Evidence/EVEidence creation effect');
    assert(commands.get('discovery.dispatcher_lease_boundary.preview')?.classification === 'read-only', 'Discovery dispatcher lease boundary preview should be read-only');
    assert(commands.get('discovery.dispatcher_lease_boundary.preview')?.effects.includes('read-only'), 'Discovery dispatcher lease boundary preview should declare read-only effect');
    assert(!commands.get('discovery.dispatcher_lease_boundary.preview')?.effects.includes('external-live-api'), 'Discovery dispatcher lease boundary preview should not declare external-live-api effect');
    assert(!commands.get('discovery.dispatcher_lease_boundary.preview')?.effects.includes('evidence-creation'), 'Discovery dispatcher lease boundary preview should not declare Evidence/EVEidence creation effect');
    assert(commands.get('discovery.candidate_ref_landing_boundary.preview')?.classification === 'read-only', 'Discovery candidate ref landing boundary preview should be read-only');
    assert(commands.get('discovery.candidate_ref_landing_boundary.preview')?.effects.includes('read-only'), 'Discovery candidate ref landing boundary preview should declare read-only effect');
    assert(!commands.get('discovery.candidate_ref_landing_boundary.preview')?.effects.includes('external-live-api'), 'Discovery candidate ref landing boundary preview should not declare external-live-api effect');
    assert(!commands.get('discovery.candidate_ref_landing_boundary.preview')?.effects.includes('evidence-creation'), 'Discovery candidate ref landing boundary preview should not declare Evidence/EVEidence creation effect');
    assert(commands.get('discovery.settled_receipt_boundary.preview')?.classification === 'read-only', 'Discovery settled receipt boundary preview should be read-only');
    assert(commands.get('discovery.settled_receipt_boundary.preview')?.effects.includes('read-only'), 'Discovery settled receipt boundary preview should declare read-only effect');
    assert(!commands.get('discovery.settled_receipt_boundary.preview')?.effects.includes('external-live-api'), 'Discovery settled receipt boundary preview should not declare external-live-api effect');
    assert(!commands.get('discovery.settled_receipt_boundary.preview')?.effects.includes('evidence-creation'), 'Discovery settled receipt boundary preview should not declare Evidence/EVEidence creation effect');
    assert(commands.get('discovery.outcome_derivation.preview')?.classification === 'read-only', 'Discovery outcome derivation should be read-only');
    assert(commands.get('discovery.outcome_derivation.preview')?.effects.includes('read-only'), 'Discovery outcome derivation should declare read-only effect');
    assert(commands.get('discovery.receipt_projection_fixture.preview')?.classification === 'read-only', 'Discovery receipt projection fixture should be read-only');
    assert(commands.get('discovery.receipt_projection_fixture.preview')?.effects.includes('read-only'), 'Discovery receipt projection fixture should declare read-only effect');
    assert(commands.get('watch.discovery_acquisition_split_fixture.preview')?.classification === 'read-only', 'Watch Discovery acquisition split fixture should be read-only');
    assert(commands.get('watch.discovery_acquisition_split_fixture.preview')?.effects.includes('read-only'), 'Watch Discovery acquisition split fixture should declare read-only effect');
    assert(commands.get('discovery.acquisition_to_evidence_handoff_fixture.preview')?.classification === 'read-only', 'Discovery acquisition to Evidence handoff fixture should be read-only');
    assert(commands.get('discovery.acquisition_to_evidence_handoff_fixture.preview')?.effects.includes('read-only'), 'Discovery acquisition to Evidence handoff fixture should declare read-only effect');
    assert(commands.get('discovery.esi_expansion_intake_posture.preview')?.classification === 'read-only', 'Discovery ESI expansion intake posture should be read-only');
    assert(commands.get('discovery.esi_expansion_intake_posture.preview')?.effects.includes('read-only'), 'Discovery ESI expansion intake posture should declare read-only effect');
    assert(commands.get('evidence.writer_landing_package_fixture.preview')?.classification === 'metadata-only', 'Evidence writer landing package fixture should be metadata-only');
    assert(commands.get('evidence.writer_landing_package_fixture.preview')?.effects.includes('local-data-mutation'), 'Evidence writer landing package fixture should declare fixture local mutation');
    assert(commands.get('watch.mixed_collector_replacement_route.preview')?.classification === 'read-only', 'Watch mixed collector replacement route preview should be read-only');
    assert(commands.get('watch.mixed_collector_replacement_route.preview')?.effects.includes('read-only'), 'Watch mixed collector replacement route preview should declare read-only effect');
    assert(commands.get('watch.actor_replacement_parity.preview')?.classification === 'read-only', 'Actor Watch replacement parity preview should be read-only');
    assert(commands.get('watch.actor_replacement_parity.preview')?.effects.includes('read-only'), 'Actor Watch replacement parity preview should declare read-only effect');
    assert(commands.get('watch.actor_compatibility_wrapper_contract.preview')?.classification === 'read-only', 'Actor Watch compatibility wrapper contract preview should be read-only');
    assert(commands.get('watch.actor_compatibility_wrapper_contract.preview')?.effects.includes('read-only'), 'Actor Watch compatibility wrapper contract preview should declare read-only effect');
    assert(commands.get('watch.actor_compatibility_wrapper_adapter_fixture.preview')?.classification === 'read-only', 'Actor Watch compatibility wrapper adapter fixture preview should be read-only');
    assert(commands.get('watch.actor_compatibility_wrapper_adapter_fixture.preview')?.effects.includes('read-only'), 'Actor Watch compatibility wrapper adapter fixture preview should declare read-only effect');
    assert(commands.get('watch.actor_compatibility_wrapper.preview')?.classification === 'read-only', 'Actor Watch compatibility wrapper runtime preview should be read-only');
    assert(commands.get('watch.actor_compatibility_wrapper.preview')?.effects.includes('read-only'), 'Actor Watch compatibility wrapper runtime preview should declare read-only effect');
    assert(commands.get('watch.actor_discovery_route_body_fixture.preview')?.classification === 'read-only', 'Actor Watch Discovery route body fixture preview should be read-only');
    assert(commands.get('watch.actor_discovery_route_body_fixture.preview')?.effects.includes('read-only'), 'Actor Watch Discovery route body fixture preview should declare read-only effect');
    assert(commands.get('watch.actor_discovery_handoff_contract.preview')?.classification === 'read-only', 'Actor Watch / Discovery handoff contract preview should be read-only');
    assert(commands.get('watch.actor_discovery_handoff_contract.preview')?.effects.includes('read-only'), 'Actor Watch / Discovery handoff contract preview should declare read-only effect');
    assert(commands.get('watch.actor_controlled_runtime_adapter_fixture.preview')?.classification === 'metadata-only', 'Actor Watch controlled runtime adapter fixture proof should be metadata-only');
    assert(commands.get('watch.actor_controlled_runtime_adapter_fixture.preview')?.effects.includes('local-data-mutation'), 'Actor Watch controlled runtime adapter fixture proof should declare fixture local mutation effect');
    assert(commands.get('watch.actor_controlled_adapter_disabled.preview')?.classification === 'metadata-only', 'Actor Watch controlled adapter disabled seam should be metadata-only');
    assert(commands.get('watch.actor_controlled_adapter_disabled.preview')?.effects.includes('local-data-mutation'), 'Actor Watch controlled adapter disabled seam should declare fixture local mutation effect');
    assert(!commands.get('watch.actor_controlled_adapter_disabled.preview')?.effects.includes('external-live-api'), 'Actor Watch controlled adapter disabled seam should not declare external-live-api effect');
    assert(!commands.get('watch.actor_controlled_adapter_disabled.preview')?.effects.includes('evidence-creation'), 'Actor Watch controlled adapter disabled seam should not declare Evidence/EVEidence creation effect');
    assert(commands.get('watch.operator_confirmation_contract.preview')?.classification === 'read-only', 'Watch operator confirmation contract preview should be read-only');
    assert(commands.get('watch.operator_confirmation_contract.preview')?.effects.includes('read-only'), 'Watch operator confirmation contract preview should declare read-only effect');
    assert(commands.get('watch.system_radius_authoring_preflight.preview')?.classification === 'read-only', 'system/radius authoring preflight should be read-only');
    assert(commands.get('watch.system_radius_authoring_preflight.preview')?.effects.includes('read-only'), 'system/radius authoring preflight should declare read-only effect');
    assert(commands.get('watch.system_radius_acceptance_payload.preview')?.classification === 'read-only', 'system/radius acceptance payload should be read-only');
    assert(commands.get('watch.system_radius_acceptance_payload.preview')?.effects.includes('read-only'), 'system/radius acceptance payload should declare read-only effect');
    assert(commands.get('watch.create_mutation_safety_map.preview')?.classification === 'read-only', 'watch.create mutation safety map should be read-only');
    assert(commands.get('watch.create_mutation_safety_map.preview')?.effects.includes('read-only'), 'watch.create mutation safety map should declare read-only effect');
    assert(commands.get('runtime.patient_packet_identity.preview')?.classification === 'read-only', 'patient packet identity preview should be read-only');
    assert(commands.get('runtime.patient_packet_identity.preview')?.effects.includes('read-only'), 'patient packet identity preview should declare read-only effect');
    assert(commands.get('task.cancel')?.classification === 'runtime-control', 'task.cancel should be runtime-control');
    assert(commands.get('task.cancel')?.effects.includes('runtime-control'), 'task.cancel should declare runtime control effect');

    assert(commands.get('manual.expansion')?.authority.confirmation_required === true, 'manual.expansion should require confirmation');
    assert(commands.get('manual.expansion')?.authority.token === CONFIRMATION.MANUAL_EXPANSION, 'manual.expansion should expose its confirmation token');

    const rendererCommands = listServiceCommands({ forRenderer: true });
    const rendererNames = new Set(rendererCommands.map((entry) => entry.command));
    assert(rendererNames.has('manual.expansion'), 'manual.expansion should be renderer eligible');
    assert(rendererNames.has('external_io.state_readout'), 'external_io.state_readout should be renderer eligible');
    assert(rendererNames.has('external_io.state_config_readback'), 'external_io.state_config_readback should be renderer eligible');
    assert(!rendererNames.has('external_io.state_config_write'), 'external_io.state_config_write should not be renderer eligible');
    assert(!rendererNames.has('external_io.state_persistence_proof'), 'external_io.state_persistence_proof should not be renderer eligible');
    assert(rendererNames.has('metadata.hydration_execution_policy.preview'), 'metadata.hydration_execution_policy.preview should be renderer eligible');
    assert(rendererNames.has('metadata.hydration_candidates.preview'), 'metadata.hydration_candidates.preview should be renderer eligible');
    assert(rendererNames.has('metadata.hydration_attention_lens.preview'), 'metadata.hydration_attention_lens.preview should be renderer eligible');
    assert(rendererNames.has('metadata.hydration_attention_runtime.preview'), 'metadata.hydration_attention_runtime.preview should be renderer eligible');
    assert(rendererNames.has('metadata.hydration_request_posture.preview'), 'metadata.hydration_request_posture.preview should be renderer eligible');
    assert(rendererNames.has('metadata.hydration_pickup_contract.preview'), 'metadata.hydration_pickup_contract.preview should be renderer eligible');
    assert(rendererNames.has('metadata.hydration_selected_id_real_execution_preflight.preview'), 'metadata.hydration_selected_id_real_execution_preflight.preview should be renderer eligible');
    assert(rendererNames.has('metadata.selected_id_readability_repair.product_preflight'), 'metadata.selected_id_readability_repair.product_preflight should be renderer eligible');
    assert(rendererNames.has('metadata.selected_id_resolve_candidate.preview'), 'metadata.selected_id_resolve_candidate.preview should be renderer eligible');
    assert(!rendererNames.has('metadata.selected_id_readability_repair.execute'), 'metadata.selected_id_readability_repair.execute should not be renderer eligible');
    assert(rendererNames.has('metadata.local_sde_readiness.preview'), 'metadata.local_sde_readiness.preview should be renderer eligible');
    assert(rendererNames.has('metadata.local_sde_source_posture.preview'), 'metadata.local_sde_source_posture.preview should be renderer eligible');
    assert(!rendererNames.has('metadata.hydration_write_fixture_proof'), 'metadata.hydration_write_fixture_proof should not be renderer eligible');
    assert(!rendererNames.has('metadata.hydration_selected_id_execution_fixture_proof'), 'metadata.hydration_selected_id_execution_fixture_proof should not be renderer eligible');
    assert(!rendererNames.has('metadata.hydration_selected_id_real_execution_proof'), 'metadata.hydration_selected_id_real_execution_proof should not be renderer eligible');
    assert(!rendererNames.has('sde.topology_import_rewrite_authority.proof'), 'sde topology authority proof should not be renderer eligible');
    assert(!rendererNames.has('sde.inventory_import_rewrite_authority.proof'), 'sde inventory authority proof should not be renderer eligible');
    assert(rendererNames.has('storage.authority_preflight'), 'storage authority preflight should be renderer eligible');
    assert(rendererNames.has('storage.setup_gate_readout'), 'storage setup gate readout should be renderer eligible');
    assert(!rendererNames.has('storage.authority_config.write_proof'), 'storage config write proof should not be renderer eligible');
    assert(rendererNames.has('storage.authority_config.readback'), 'storage config readback should be renderer eligible');
    assert(!rendererNames.has('storage.authority_config.write'), 'storage config write should not be renderer eligible');
    assert(!rendererNames.has('storage.authority_config.acknowledgement_persistence_proof'), 'storage acknowledgement persistence proof should not be renderer eligible');
    assert(rendererNames.has('storage.enforcement_dry_run.command_effect_map'), 'enforcement dry-run map should be renderer eligible as read-only');
    assert(rendererNames.has('storage.composed_gate_policy.preview'), 'composed gate policy preview should be renderer eligible as read-only');
    assert(rendererNames.has('support.gate_stack_readout'), 'gate stack readout should be renderer eligible');
    assert(rendererNames.has('support.artifact_path_authority.preview'), 'support artifact path authority should be renderer eligible as read-only');
    assert(rendererNames.has('support.artifact_creation_policy.preview'), 'support artifact creation policy should be renderer eligible as read-only');
    assert(rendererNames.has('support.artifact_contents_contract.preview'), 'support artifact contents contract should be renderer eligible as read-only');
    assert(rendererNames.has('support.artifact_writer_conformance_gap_map.preview'), 'support artifact writer gap map should be renderer eligible as read-only');
    assert(rendererNames.has('support.trace_log_redaction_policy.preview'), 'trace/log redaction policy should be renderer eligible as read-only');
    assert(rendererNames.has('support.api_request_log_redaction_readiness.preview'), 'API request log redaction readiness should be renderer eligible as read-only');
    assert(rendererNames.has('runtime.enforcement_boundary.preview'), 'runtime enforcement boundary preview should be renderer eligible as read-only');
    assert(rendererNames.has('runtime.enforcement_active_semantics.preview'), 'runtime active semantics preview should be renderer eligible as read-only');
    assert(rendererNames.has('runtime.enforcement_hook_telemetry.readout'), 'runtime hook telemetry readout should be renderer eligible as read-only');
    assert(rendererNames.has('runtime.queue_clock_posture.preview'), 'queue/clock posture preview should be renderer eligible as read-only');
    assert(rendererNames.has('runtime.watch_task_outcome_map.preview'), 'Watch/task outcome map preview should be renderer eligible as read-only');
    assert(rendererNames.has('watch.scope_authority_conformance.preview'), 'Watch scope authority conformance preview should be renderer eligible as read-only');
    assert(rendererNames.has('watch.authored_execution_readiness.preview'), 'authored Watch execution readiness preview should be renderer eligible as read-only');
    assert(rendererNames.has('watch.system_radius_setup_readout.preview'), 'system/radius setup readout should be renderer eligible as read-only');
    assert(rendererNames.has('watch.system_radius_readout_readiness_bridge.preview'), 'system/radius readout/readiness bridge should be renderer eligible as read-only');
    assert(rendererNames.has('watch.runtime_packet_plan.preview'), 'Watch runtime packet plan preview should be renderer eligible as read-only');
    assert(rendererNames.has('watch.executor_tick_dry_run.preview'), 'Watch executor tick dry-run preview should be renderer eligible as read-only');
    assert(rendererNames.has('watch.packet_dry_run_dispatch_parity.preview'), 'Watch packet/dry-run/dispatch parity preview should be renderer eligible as read-only');
    assert(rendererNames.has('watch.task_creation_boundary.preview'), 'Watch task creation boundary preview should be renderer eligible as read-only');
    assert(rendererNames.has('watch.system_radius_run_stub.preview'), 'system/radius Watch-run stub preview should be renderer eligible as read-only');
    assert(rendererNames.has('watch.bucket_identity_projection.preview'), 'Watch bucket identity projection should be renderer eligible as read-only');
    assert(rendererNames.has('watch.bucket_pickup_posture_bridge.preview'), 'Watch bucket pickup posture bridge should be renderer eligible as read-only');
    assert(rendererNames.has('watch.bucket_disposable_persistence_fixture.preview'), 'Watch bucket disposable persistence fixture should be renderer eligible as read-only');
    assert(!rendererNames.has('watch.bucket_product_persistence.emit'), 'Watch bucket product persistence should not be renderer eligible');
    assert(rendererNames.has('watch.bucket_product_pickup_readout.preview'), 'Watch bucket product pickup readout should be renderer eligible as read-only');
    assert(rendererNames.has('watch.discovery_pickup_packet_proof.preview'), 'Watch Discovery pickup packet proof should be renderer eligible as read-only');
    assert(rendererNames.has('discovery.pickup_consumer_fixture.preview'), 'Discovery pickup consumer fixture should be renderer eligible as read-only');
    assert(rendererNames.has('discovery.pickup_consumer_hold_contract.preview'), 'Discovery pickup consumer hold contract should be renderer eligible as read-only');
    assert(rendererNames.has('discovery.pickup_selection_contract.preview'), 'Discovery pickup selection contract should be renderer eligible as read-only');
    assert(rendererNames.has('discovery.provider_route_packet.preview'), 'Discovery provider route packet preview should be renderer eligible as read-only');
    assert(rendererNames.has('discovery.pickup_execution_boundary.preview'), 'Discovery pickup execution boundary preview should be renderer eligible as read-only');
    assert(rendererNames.has('discovery.dispatcher_lease_boundary.preview'), 'Discovery dispatcher lease boundary preview should be renderer eligible as read-only');
    assert(rendererNames.has('discovery.candidate_ref_landing_boundary.preview'), 'Discovery candidate ref landing boundary preview should be renderer eligible as read-only');
    assert(rendererNames.has('discovery.settled_receipt_boundary.preview'), 'Discovery settled receipt boundary preview should be renderer eligible as read-only');
    assert(rendererNames.has('discovery.outcome_derivation.preview'), 'Discovery outcome derivation should be renderer eligible as read-only');
    assert(rendererNames.has('discovery.receipt_projection_fixture.preview'), 'Discovery receipt projection fixture should be renderer eligible as read-only');
    assert(rendererNames.has('watch.discovery_acquisition_split_fixture.preview'), 'Watch Discovery acquisition split fixture should be renderer eligible as read-only');
    assert(rendererNames.has('discovery.acquisition_to_evidence_handoff_fixture.preview'), 'Discovery acquisition to Evidence handoff fixture should be renderer eligible as read-only');
    assert(rendererNames.has('discovery.esi_expansion_intake_posture.preview'), 'Discovery ESI expansion intake posture should be renderer eligible as read-only');
    assert(!rendererNames.has('evidence.writer_landing_package_fixture.preview'), 'Evidence writer landing package fixture should not be renderer eligible');
    assert(rendererNames.has('watch.mixed_collector_replacement_route.preview'), 'Watch mixed collector replacement route preview should be renderer eligible as read-only');
    assert(rendererNames.has('watch.actor_replacement_parity.preview'), 'Actor Watch replacement parity preview should be renderer eligible as read-only');
    assert(rendererNames.has('watch.actor_compatibility_wrapper_contract.preview'), 'Actor Watch compatibility wrapper contract preview should be renderer eligible as read-only');
    assert(rendererNames.has('watch.actor_compatibility_wrapper_adapter_fixture.preview'), 'Actor Watch compatibility wrapper adapter fixture preview should be renderer eligible as read-only');
    assert(rendererNames.has('watch.actor_compatibility_wrapper.preview'), 'Actor Watch compatibility wrapper runtime preview should be renderer eligible as read-only');
    assert(rendererNames.has('watch.actor_discovery_route_body_fixture.preview'), 'Actor Watch Discovery route body fixture preview should be renderer eligible as read-only');
    assert(rendererNames.has('watch.actor_discovery_handoff_contract.preview'), 'Actor Watch / Discovery handoff contract preview should be renderer eligible as read-only');
    assert(!rendererNames.has('watch.actor_controlled_runtime_adapter_fixture.preview'), 'Actor Watch controlled runtime adapter fixture proof should not be renderer eligible');
    assert(!rendererNames.has('watch.actor_controlled_adapter_disabled.preview'), 'Actor Watch controlled adapter disabled seam should not be renderer eligible');
    assert(rendererNames.has('watch.operator_confirmation_contract.preview'), 'Watch operator confirmation contract preview should be renderer eligible as read-only');
    assert(rendererNames.has('watch.system_radius_authoring_preflight.preview'), 'system/radius authoring preflight should be renderer eligible as read-only');
    assert(rendererNames.has('watch.system_radius_acceptance_payload.preview'), 'system/radius acceptance payload should be renderer eligible as read-only');
    assert(rendererNames.has('watch.create_mutation_safety_map.preview'), 'watch.create mutation safety map should be renderer eligible as read-only');
    assert(rendererNames.has('runtime.patient_packet_identity.preview'), 'patient packet identity preview should be renderer eligible as read-only');
    assert(rendererNames.has('runtime.db_snapshot.create'), 'snapshot create should be renderer eligible');
    assert(!rendererNames.has('sde.import.topology'), 'SDE import should not be renderer eligible');
    assert(!rendererNames.has('watch.executor.tick'), 'watch executor tick should not be renderer eligible');
    assert(!rendererNames.has('retention.preflight'), 'retention preflight should not be renderer eligible in this packet');

    await assertRejects(
      () => invokeServiceCommand('manual.expansion', { killmailIds: [9301] }, { db, enforceAuthority: true }),
      'SERVICE_CONFIRMATION_REQUIRED',
      'manual.expansion should reject direct authority-enforced invocation without confirmation'
    );
    await assertRejects(
      () => invokeServiceCommand('runtime.db_snapshot.create', {}, { db, enforceAuthority: true, databasePath: ':memory:' }),
      'SERVICE_CONFIRMATION_REQUIRED',
      'snapshot create should reject direct authority-enforced invocation without confirmation'
    );

    const ipcMain = fakeIpcMain();
    registerIpcServiceHandlers(ipcMain, () => ({
      db,
      databasePath: path.join(auraTempRoot(), 'command-authority.sqlite')
    }));
    const invoke = ipcMain.handlers.get('atlas:service:invoke');
    const list = ipcMain.handlers.get('atlas:service:list');
    const ipcList = await list();
    assert(ipcList.every((entry) => entry.renderer_allowed === true), 'IPC service list should expose renderer-eligible commands only');

    await assertRejects(
      () => invoke(null, { command: 'sde.import.topology', payload: { path: 'fixture.jsonl' } }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject non-eligible commands'
    );
    await assertRejects(
      () => invoke(null, { command: 'external_io.state_persistence_proof', payload: { state: 'on' } }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject External I/O persistence proof'
    );
    await assertRejects(
      () => invoke(null, { command: 'external_io.state_config_write', payload: { state: 'on' } }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject External I/O config write'
    );
    await assertRejects(
      () => invoke(null, { command: 'storage.authority_config.write', payload: { storageAuthority: { mode: 'selected_storage' } } }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject storage authority config write'
    );
    await assertRejects(
      () => invoke(null, { command: 'metadata.hydration_write_fixture_proof', payload: { entityIds: [90000001] } }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject Hydration write fixture proof'
    );
    await assertRejects(
      () => invoke(null, { command: 'metadata.hydration_selected_id_real_execution_proof', payload: { idValue: 92418041 } }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject selected-ID real Hydration execution proof'
    );
    await assertRejects(
      () => invoke(null, { command: 'metadata.selected_id_readability_repair.execute', payload: { idValue: 90000002, operatorAct: true, action: 'Resolve' } }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject selected-ID readability repair execution'
    );
    await assertRejects(
      () => invoke(null, { command: 'sde.topology_import_rewrite_authority.proof', payload: { sourcePath: 'fixture.zip' } }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject SDE topology authority proof'
    );
    await assertRejects(
      () => invoke(null, { command: 'sde.inventory_import_rewrite_authority.proof', payload: { sourcePath: 'fixture.zip' } }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject SDE inventory authority proof'
    );
    await assertRejects(
      () => invoke(null, { command: 'watch.bucket_product_persistence.emit', payload: {} }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject Watch bucket product persistence'
    );
    await assertRejects(
      () => invoke(null, { command: 'evidence.writer_landing_package_fixture.preview', payload: {} }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject Evidence writer landing package fixture proof'
    );
    await assertRejects(
      () => invoke(null, { command: 'watch.actor_controlled_runtime_adapter_fixture.preview', payload: {} }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject actor Watch controlled runtime adapter fixture proof'
    );
    await assertRejects(
      () => invoke(null, { command: 'watch.actor_controlled_adapter_disabled.preview', payload: {} }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject actor Watch controlled adapter disabled seam'
    );
    await assertRejects(
      () => invoke(null, { command: 'manual.discovery', payload: { scope: 'actor', entityType: 'character', entityId: 90000002 } }),
      'SERVICE_CONFIRMATION_REQUIRED',
      'renderer IPC should reject confirmed-action command without token'
    );
    await assertRejects(
      () => invoke(null, {
        command: 'manual.discovery',
        payload: {
          scope: 'actor',
          entityType: 'character',
          entityId: 90000002,
          confirmation: CONFIRMATION.MANUAL_DISCOVERY
        }
      }),
      'LIVE_API_DISABLED',
      'renderer IPC with confirmation should proceed to live gate enforcement'
    );

    await verifyHttpNonRetryableStatus();
  } finally {
    closeDatabase(db);
  }

  console.log('command authority verified');
}

async function verifyHttpNonRetryableStatus() {
  let attempts = 0;
  const client = new HttpClient({
    userAgent: 'AURA Atlas authority verification',
    maxAttempts: 3,
    fetchImpl: async () => {
      attempts += 1;
      return {
        ok: false,
        status: 400,
        headers: {
          get: () => null
        },
        text: async () => JSON.stringify({ error: 'bad request' })
      };
    }
  });
  await assertRejects(
    () => client.json('test-provider', 'https://example.invalid/non-retryable'),
    'HTTP_STATUS_ERROR',
    'non-retryable HTTP statuses should reject'
  );
  assert(attempts === 1, `non-retryable HTTP status should not be retried; got ${attempts} attempts`);
}

function fakeIpcMain() {
  return {
    handlers: new Map(),
    handle(channel, handler) {
      this.handlers.set(channel, handler);
    }
  };
}

async function assertRejects(fn, expectedCode, message) {
  try {
    await fn();
  } catch (error) {
    if (error.code === expectedCode) {
      return error;
    }
    throw new Error(`${message}; expected ${expectedCode}, got ${error.code || error.message}`);
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
