const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedDb(db);
    verifyRegistration();
    verifySourceDoesNotCallForbiddenCommands();

    const strong = await assertNoTableEffects(db, 'strong report candidate', () => invokeServiceCommand('metadata.selected_id_resolve_candidate.preview', {
      report_type: 'actor',
      report_params: {
        entityType: 'character',
        entityId: 91000001
      },
      selected_id_type: 'character',
      selected_id_value: 91000001
    }, {
      db,
      source: 'renderer',
      esiClient: throwingProvider()
    }));
    verifyStrongCandidate(strong);

    const alreadyReadable = await assertNoTableEffects(db, 'already readable selected candidate', () => invokeServiceCommand('metadata.selected_id_resolve_candidate.preview', {
      selected_id_type: 'character',
      selected_id_value: 91000002
    }, {
      db,
      source: 'renderer',
      esiClient: throwingProvider()
    }));
    verifyAlreadyReadable(alreadyReadable);

    const staticLookup = await assertNoTableEffects(db, 'static lookup selected candidate', () => invokeServiceCommand('metadata.selected_id_resolve_candidate.preview', {
      report_type: 'actor',
      report_params: {
        entityType: 'character',
        entityId: 91000001
      },
      selected_id_type: 'inventory_type',
      selected_id_value: 999999
    }, {
      db,
      source: 'renderer',
      esiClient: throwingProvider()
    }));
    verifyStaticLookup(staticLookup);

    const parkedOnly = await assertNoTableEffects(db, 'parked selected candidate', () => invokeServiceCommand('metadata.selected_id_resolve_candidate.preview', {
      selected_id_type: 'alliance',
      selected_id_value: 99000999
    }, {
      db,
      source: 'renderer',
      esiClient: throwingProvider()
    }));
    verifyParkedOnly(parkedOnly);

    const malformed = await assertNoTableEffects(db, 'malformed selected candidate', () => invokeServiceCommand('metadata.selected_id_resolve_candidate.preview', {
      selected_id_type: 'region',
      selected_id_value: 10000001
    }, {
      db,
      source: 'renderer',
      esiClient: throwingProvider()
    }));
    verifyMalformed(malformed);

    console.log(JSON.stringify({
      status: 'selected-ID Resolve candidate preview verified',
      sample_strong: compact(strong.selected_candidate),
      sample_static: compact(staticLookup.selected_candidate),
      sample_parked: compact(parkedOnly.selected_candidate),
      visible_unresolved_count: strong.unresolved_visible_ids.length,
      provider_calls: strong.provider_calls,
      resolve_execution_invoked: strong.resolve_execution_invoked,
      old_report_scoped_metadata_hydration_used: strong.old_report_scoped_metadata_hydration_used,
      table_unchanged: strong.table_mutation_proof.unchanged,
      boundary: strong.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

function verifyRegistration() {
  const commands = listServiceCommands();
  const command = commands.find((entry) => entry.command === 'metadata.selected_id_resolve_candidate.preview');
  assert(command, 'selected-ID Resolve candidate preview command should be registered');
  assert(command.classification === 'read-only', 'candidate preview should be read-only');
  assert(command.effects.includes('read-only'), 'candidate preview should declare read-only effect');
  assert(command.renderer_allowed === true, 'candidate preview should be renderer eligible as read-only explanation');
}

function verifyStrongCandidate(result) {
  assert(result.action === 'metadata.selected_id_resolve_candidate.preview', 'result should name the preview action');
  assert(result.read_only === true, 'result should be read-only');
  assert(result.provider_calls === 0, 'preview should not call providers');
  assert(result.hydration_writes === 0, 'preview should not write Hydration output');
  assert(result.metadata_run_writes === 0, 'preview should not write metadata runs');
  assert(result.api_request_log_writes === 0, 'preview should not write API logs');
  assert(result.entity_writes === 0, 'preview should not write entities');
  assert(result.activity_event_label_patches === 0, 'preview should not patch activity events');
  assert(result.resolve_execution_invoked === false, 'preview should not execute selected-ID Resolve');
  assert(result.old_report_scoped_metadata_hydration_used === false, 'preview should not use metadata.hydration');
  assert(result.handoff.visibility_is_request === false, 'visibility should not be a provider request');
  assert(result.handoff.candidate_is_provider_execution === false, 'candidate should not be provider execution');
  assert(result.handoff.report_wide_hydration_used === false, 'report-wide Hydration should not be used');
  assert(result.handoff.multi_id_hydration_used === false, 'multi-ID Hydration should not be used');
  assert(result.report_context_status === 'built_from_local_report', 'actor report context should be built locally');
  assert(result.unresolved_visible_ids.length >= 1, 'preview should expose unresolved visible IDs');
  assert(result.selected_candidate.classification === 'provider_backed_resolve_candidate_with_strong_local_basis', 'selected actor should be strong provider-backed candidate');
  assert(result.selected_candidate.selected_id_resolve_preflight_relevant === true, 'strong selected candidate should make preflight relevant');
  assert(result.selected_candidate.strong_local_basis.some((entry) => entry.kind === 'activity_events'), 'strong basis should include activity_events');
  assert(result.selected_candidate.report_or_corpus_context_that_would_benefit.would_benefit === true, 'report context should benefit after readability repair');
  assert(result.selected_candidate.future_handoff_hint.command === 'metadata.selected_id_readability_repair.product_preflight', 'handoff should point at selected-ID product preflight');
  assert(result.selected_candidate.future_handoff_hint.execution_command === 'metadata.selected_id_readability_repair.execute', 'handoff should disclose future execution command');
  assert(result.selected_candidate.future_handoff_hint.hint_is_authority === false, 'handoff hint should not be authority');
  assert(result.table_mutation_proof.unchanged === true, 'table mutation proof should stay unchanged');
}

function verifyAlreadyReadable(result) {
  assert(result.provider_calls === 0, 'already-readable preview should not call providers');
  assert(result.selected_candidate.classification === 'already_local_readable', 'local label should short-circuit candidate');
  assert(result.selected_candidate.local_label === 'Known Local Pilot', 'local entity label should be reported');
  assert(result.selected_candidate.selected_id_resolve_preflight_relevant === false, 'already-readable candidate should not need preflight');
}

function verifyStaticLookup(result) {
  assert(result.provider_calls === 0, 'static lookup preview should not call providers');
  assert(result.selected_candidate.classification === 'unsupported_static_local_lookup', 'inventory type should be local/static lookup gap');
  assert(result.selected_candidate.supported_provider_backed_resolve_type === false, 'inventory type should not be provider-backed Resolve type');
  assert(result.selected_candidate.static_local_lookup_type === true, 'inventory type should be static local lookup');
  assert(result.selected_candidate.selected_id_resolve_preflight_relevant === false, 'static lookup should not use selected-ID Resolve preflight');
}

function verifyParkedOnly(result) {
  assert(result.provider_calls === 0, 'parked-only preview should not call providers');
  assert(result.selected_candidate.classification === 'parked_conditional_basis_only', 'parked-only candidate should be classified separately');
  assert(result.selected_candidate.parked_or_conditional_basis.some((entry) => entry.kind === 'watchlist_entities'), 'parked basis should include Watch/Marked row');
  assert(result.selected_candidate.parked_or_conditional_basis.some((entry) => entry.kind === 'assessment_artifacts'), 'parked basis should include Assessment Memory row');
  assert(result.selected_candidate.selected_id_resolve_preflight_relevant === false, 'parked basis must not authorize first product preflight');
}

function verifyMalformed(result) {
  assert(result.provider_calls === 0, 'malformed preview should not call providers');
  assert(result.selected_candidate.classification === 'invalid_or_missing_selected_id', 'unsupported selected type should be invalid');
  assert(result.selected_id.reason_codes.includes('unsupported_selected_id_type'), 'unsupported reason should be reported');
}

function verifySourceDoesNotCallForbiddenCommands() {
  const servicePath = path.join(__dirname, '..', 'src', 'main', 'services', 'selectedIdResolveCandidatePreviewService.js');
  const source = fs.readFileSync(servicePath, 'utf8');
  assert(!source.includes("invokeServiceCommand('metadata.selected_id_readability_repair.execute'"), 'service must not invoke selected-ID Resolve execution');
  assert(!source.includes("invokeServiceCommand('metadata.hydration'"), 'service must not invoke old report-scoped metadata.hydration');
  assert(!source.includes('runSelectedIdReadabilityRepairExecution'), 'service must not import/execute selected-ID Resolve');
  assert(!source.includes('runMetadataHydrationService'), 'service must not import/execute metadata.hydration');
}

function seedDb(db) {
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.5);
  db.prepare(`
    INSERT INTO killmails (
      killmail_id, killmail_hash, killmail_time, solar_system_id, raw_esi_payload,
      raw_payload_checksum, source, first_seen_at, last_seen_at, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    880001,
    'fixture_hash_880001',
    '2026-06-01T10:00:00Z',
    30000001,
    '{}',
    'checksum_880001',
    'fixture',
    '2026-06-01T10:01:00Z',
    '2026-06-01T10:01:00Z',
    '2026-06-01T10:01:00Z'
  );
  db.prepare(`
    INSERT INTO activity_events (
      event_key, killmail_id, role, entity_type, entity_id, entity_name,
      character_id, character_name, corporation_id, corporation_name,
      alliance_id, alliance_name, ship_type_id, ship_type_name, weapon_type_id,
      final_blow, damage_done, solar_system_id, solar_system_name, region_id,
      region_name, killmail_time, ingested_at, discovered_by_type,
      discovered_by_id, normalizer_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    '880001:attacker:91000001',
    880001,
    'attacker',
    'character',
    91000001,
    null,
    91000001,
    null,
    98000111,
    null,
    99000111,
    null,
    999999,
    null,
    null,
    1,
    321,
    30000001,
    'Atlas Prime',
    10000001,
    'Test Region',
    '2026-06-01T10:00:00Z',
    '2026-06-01T10:01:00Z',
    'manual_actor',
    '91000001',
    'fixture'
  );
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at, last_enriched_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run('character', 91000002, 'Known Local Pilot', '2026-06-01T09:00:00Z', '2026-06-01T09:30:00Z', '2026-06-01T09:30:00Z');
  db.prepare(`
    INSERT INTO watchlist_entities (
      entity_type, entity_id, entity_name, lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes, next_poll_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('alliance', 99000999, 'Parked Alliance', 30, 5, 1, 60, '2026-06-01T11:00:00Z', 'parked-only fixture');
  db.prepare(`
    INSERT INTO assessment_artifacts (
      artifact_type, status, entity_type, entity_id, entity_name,
      assessment_reason, citation_status, appearance_count, created_at, updated_at, assessed_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'entity_interest',
    'active',
    'alliance',
    99000999,
    'Parked Alliance',
    'Parked-only fixture assessment.',
    'not_applicable',
    1,
    '2026-06-01T11:01:00Z',
    '2026-06-01T11:01:00Z',
    'fixture'
  );
}

async function assertNoTableEffects(db, label, call) {
  const before = sideEffectCounts(db);
  const result = await call();
  const after = sideEffectCounts(db);
  assert(JSON.stringify(after) === JSON.stringify(before), `${label} changed table counts\nBefore: ${JSON.stringify(before)}\nAfter: ${JSON.stringify(after)}`);
  return result;
}

function sideEffectCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    entities: count(db, 'entities'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function throwingProvider() {
  return {
    names: async () => {
      throw new Error('provider must not be called by selected-ID Resolve candidate preview');
    }
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function compact(candidate) {
  return {
    candidate_key: candidate.candidate_key,
    classification: candidate.classification,
    selected_id_resolve_preflight_relevant: candidate.selected_id_resolve_preflight_relevant,
    provider_call_authorized: candidate.provider_call_authorized,
    strong_basis_count: candidate.strong_local_basis.length,
    parked_basis_count: candidate.parked_or_conditional_basis.length,
    local_label: candidate.local_label
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
