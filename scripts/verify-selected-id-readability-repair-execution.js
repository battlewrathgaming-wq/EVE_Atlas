const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands, CONFIRMATION } = require('../src/main/services/serviceRegistry');
const { resetLiveGateState } = require('../src/main/services/liveApiGateService');

async function main() {
  const previousLive = process.env.AURA_ATLAS_LIVE_API;
  try {
    process.env.AURA_ATLAS_LIVE_API = '1';
    const character = await runCase('success_character', (db) => seedEvidenceActivity(db, { idType: 'character', idValue: 90000021 }), payload('character', 90000021), readyContext({
      fetchImpl: fakeNamesFetch([{ category: 'character', id: 90000021, name: 'Resolved Pilot' }])
    }));
    const corporation = await runCase('success_corporation', (db) => seedEvidenceActivity(db, { idType: 'corporation', idValue: 98000021 }), payload('corporation', 98000021), readyContext({
      fetchImpl: fakeNamesFetch([{ category: 'corporation', id: 98000021, name: 'Resolved Corp' }])
    }));
    const alliance = await runCase('success_alliance', (db) => seedEvidenceActivity(db, { idType: 'alliance', idValue: 99000021 }), payload('alliance', 99000021), readyContext({
      fetchImpl: fakeNamesFetch([{ category: 'alliance', id: 99000021, name: 'Resolved Alliance' }])
    }));
    const hs276 = await runCase('hs276_not_special', (db) => seedEvidenceActivity(db, { idType: 'character', idValue: 92418041 }), payload('character', 92418041), readyContext({
      fetchImpl: fakeNamesFetch([{ category: 'character', id: 92418041, name: 'HS276 Ordinary Resolve' }])
    }));
    const alreadyReadable = await runCase('already_readable', (db) => seedEvidenceActivity(db, { idType: 'character', idValue: 90000022, label: 'Already Local' }, { entityLabel: 'Already Local' }), payload('character', 90000022), readyContext({
      fetchImpl: failIfFetched()
    }));
    const raceResolved = await runCase('race_resolved', (db) => seedEvidenceActivity(db, { idType: 'character', idValue: 90000023 }), payload('character', 90000023), readyContext({
      fetchImpl: fakeNamesFetch([{ category: 'character', id: 90000023, name: 'Provider Race Name' }], {
        beforeResponse: (db) => setActivityLabel(db, 'character', 90000023, 'Race Local')
      })
    }));
    const malformed = await runCase('malformed', seedEmpty, payload('character', -1), readyContext({ fetchImpl: failIfFetched() }));
    const localLookup = await runCase('local_lookup', seedLocalLookup, payload('inventory_type', 603), readyContext({ fetchImpl: failIfFetched() }));
    const missingBasis = await runCase('missing_basis', seedEmpty, payload('character', 90000024), readyContext({ fetchImpl: failIfFetched() }));
    const discoveryOnly = await runCase('discovery_only', seedDiscoveryOnly, payload('character', 90000025), readyContext({ fetchImpl: failIfFetched() }));
    const watchOnly = await runCase('watch_only', seedWatchOnly, payload('character', 90000026), readyContext({ fetchImpl: failIfFetched() }));
    const assessmentOnly = await runCase('assessment_only', seedAssessmentOnly, payload('character', 90000027), readyContext({ fetchImpl: failIfFetched() }));
    const held = await runCase('held_external_io', (db) => seedEvidenceActivity(db, { idType: 'character', idValue: 90000028 }), payload('character', 90000028), readyContext({
      externalIoState: 'off',
      fetchImpl: failIfFetched()
    }));
    delete process.env.AURA_ATLAS_LIVE_API;
    const liveBlocked = await runCase('live_blocked', (db) => seedEvidenceActivity(db, { idType: 'character', idValue: 90000029 }), payload('character', 90000029), readyContext({ fetchImpl: failIfFetched() }));
    process.env.AURA_ATLAS_LIVE_API = '1';
    const storageBlocked = await runCase('storage_blocked', (db) => seedEvidenceActivity(db, { idType: 'character', idValue: 90000030 }), payload('character', 90000030), readyContext({
      storageAuthority: blockedStorageAuthority(),
      fetchImpl: failIfFetched()
    }));
    const unresolved = await runCase('provider_unresolved', (db) => seedEvidenceActivity(db, { idType: 'character', idValue: 90000031 }), payload('character', 90000031), readyContext({
      fetchImpl: fakeNamesFetch([])
    }));
    const categoryMismatch = await runCase('category_mismatch', (db) => seedEvidenceActivity(db, { idType: 'character', idValue: 90000032 }), payload('character', 90000032), readyContext({
      fetchImpl: fakeNamesFetch([{ category: 'corporation', id: 90000032, name: 'Wrong Kind' }])
    }));
    const unsafeLabel = await runCase('unsafe_label', (db) => seedEvidenceActivity(db, { idType: 'character', idValue: 90000033 }), payload('character', 90000033), readyContext({
      fetchImpl: fakeNamesFetch([{ category: 'character', id: 90000033, name: '' }])
    }));
    const providerError = await runCase('provider_error', (db) => seedEvidenceActivity(db, { idType: 'character', idValue: 90000034 }), payload('character', 90000034), readyContext({
      fetchImpl: fakeErrorFetch()
    }));
    const proofFlags = await runCase('proof_flags', (db) => seedEvidenceActivity(db, { idType: 'character', idValue: 90000035 }), payload('character', 90000035), {
      ...readyContext({ fetchImpl: failIfFetched() }),
      allowHydrationSelectedIdRealExecutionProof: true,
      controlledTempAtlasStore: true
    });
    const missingConfirmation = await verifyMissingConfirmation();
    const rendererRejected = await verifyRendererRejected();

    verifySuccess(character.result, 'character', 'Resolved Pilot');
    verifySuccess(corporation.result, 'corporation', 'Resolved Corp');
    verifySuccess(alliance.result, 'alliance', 'Resolved Alliance');
    verifySuccess(hs276.result, 'character', 'HS276 Ordinary Resolve');
    assert(hs276.result.preflight_summary.hs276_target_match === true, 'HS276 target should only be disclosed');
    assert(hs276.result.preflight_summary.fixed_hs276_id_special === false, 'HS276 target should not be special');
    verifyNoProviderNoWrite(alreadyReadable, 'already_readable');
    verifyRace(raceResolved);
    verifyNoProviderNoWrite(malformed, 'invalid_selected_id_value');
    verifyNoProviderNoWrite(localLookup, 'selected_id_not_supported_for_esi_names_hydration');
    verifyNoProviderNoWrite(missingBasis, 'missing_local_basis');
    verifyNoProviderNoWrite(discoveryOnly, 'non_authorizing_basis');
    verifyNoProviderNoWrite(watchOnly, 'non_authorizing_basis');
    verifyNoProviderNoWrite(assessmentOnly, 'non_authorizing_basis');
    verifyNoProviderNoWrite(held, 'held_by_external_io');
    verifyNoProviderNoWrite(liveBlocked, 'live_provider_gate_blocked');
    verifyNoProviderNoWrite(storageBlocked, 'storage_write_blocked');
    verifyProviderContactNoLabel(unresolved, 'partial_unresolved', 'partial');
    verifyProviderContactNoLabel(categoryMismatch, 'provider_response_rejected', 'failed');
    verifyProviderContactNoLabel(unsafeLabel, 'provider_response_rejected', 'failed');
    verifyProviderContactNoLabel(providerError, 'provider_error', 'failed');
    verifyNoProviderNoWrite(proofFlags, 'blocked_trusted_context');
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'selected-ID readability repair execution verified',
      success: compact(character.result),
      corporation: compact(corporation.result),
      alliance: compact(alliance.result),
      already_readable: compact(alreadyReadable.result),
      race_resolved: compact(raceResolved.result),
      held: compact(held.result),
      storage_blocked: compact(storageBlocked.result),
      provider_outcomes: {
        unresolved: compact(unresolved.result),
        category_mismatch: compact(categoryMismatch.result),
        unsafe_label: compact(unsafeLabel.result),
        provider_error: compact(providerError.result)
      },
      proof_flags: compact(proofFlags.result),
      missing_confirmation: missingConfirmation,
      renderer_rejected: rendererRejected,
      success_invariants: character.result.invariants,
      provider_call: character.result.provider_call_log[0],
      boundary: character.result.boundary
    }, null, 2));
  } finally {
    if (previousLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = previousLive;
    }
  }
}

async function runCase(name, seedFn, casePayload, context) {
  resetLiveGateState();
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedFn(db);
    const before = snapshot(db);
    const fetchImpl = context.fetchImpl?.bind(null, db) || failIfFetched();
    const result = await invokeServiceCommand('metadata.selected_id_readability_repair.execute', {
      ...casePayload,
      confirmation: CONFIRMATION.METADATA_HYDRATION,
      allowHydrationSelectedIdRealExecutionProof: true,
      controlledTempAtlasStore: true
    }, {
      db,
      enforceAuthority: true,
      allowStorageSetupGateFixtureInput: true,
      storageBudgetBytes: 5 * 1024 * 1024 * 1024,
      ...context,
      fetchImpl
    });
    const after = snapshot(db);
    assertSame(result.before.counts, before, `${name} result before counts should match`);
    assertSame(result.after.counts, after, `${name} result after counts should match`);
    verifyCommon(result);
    return { result, before, after, db };
  } finally {
    closeDatabase(db);
  }
}

async function verifyMissingConfirmation() {
  resetLiveGateState();
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedEvidenceActivity(db, { idType: 'character', idValue: 90000036 });
    await assertRejects(
      () => invokeServiceCommand('metadata.selected_id_readability_repair.execute', payload('character', 90000036), {
        db,
        enforceAuthority: true,
        ...readyContext({ fetchImpl: failIfFetched() })
      }),
      'SERVICE_CONFIRMATION_REQUIRED',
      'Resolve execution should require metadata Hydration confirmation when authority is enforced'
    );
    return 'SERVICE_CONFIRMATION_REQUIRED';
  } finally {
    closeDatabase(db);
  }
}

async function verifyRendererRejected() {
  resetLiveGateState();
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedEvidenceActivity(db, { idType: 'character', idValue: 90000037 });
    await assertRejects(
      () => invokeServiceCommand('metadata.selected_id_readability_repair.execute', {
        ...payload('character', 90000037),
        confirmation: CONFIRMATION.METADATA_HYDRATION
      }, {
        db,
        source: 'renderer',
        ...readyContext({ fetchImpl: failIfFetched() })
      }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer should not invoke Resolve execution'
    );
    return 'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE';
  } finally {
    closeDatabase(db);
  }
}

function verifySuccess(result, idType, expectedLabel) {
  assert(result.outcome === 'success', `success should complete for ${idType}; got ${result.outcome} (${result.validation_result?.status || 'no status'})`);
  assert(result.user_facing_act === 'Resolve', 'user-facing act should be Resolve');
  assert(result.run_type === 'selected_id_readability_repair', 'run type should be product readability repair');
  assert(result.provider_calls === 1, 'success should call provider exactly once');
  assert(result.provider_call_log[0].body === `[${result.selected_id.id_value}]`, 'success should request exactly one selected ID');
  assert(result.provider_validation.status === 'provider_response_valid', 'success should validate provider response');
  assert(result.metadata_run.status === 'success', 'metadata run should finalize success');
  assert(result.metadata_run.run_type === 'selected_id_readability_repair', 'metadata run should use product run type');
  assert(result.write_summary.metadata_run_writes === 1, 'success should write one metadata run');
  assert(result.write_summary.api_request_log_writes === 1, 'success should write one API request log');
  assert(result.write_summary.entities_upserted === 1, 'success should upsert selected entity');
  assert(result.write_summary.activity_event_label_patches >= 1, 'success should patch readability labels');
  assert(result.after.activity_event_labels.some((row) => row.entity_name === expectedLabel || row[`${idType}_name`] === expectedLabel), 'success should persist expected label');
  assert(result.invariants.raw_killmail_payloads_unchanged === true, 'raw killmail payloads should not change');
  assert(result.invariants.numeric_activity_event_ids_unchanged === true, 'numeric activity facts should not change');
  assert(result.invariants.discovered_refs_unchanged === true, 'Discovery refs should not change');
  assert(result.invariants.watch_rows_unchanged === true, 'Watch rows should not change');
  assert(result.invariants.assessment_rows_unchanged === true, 'Assessment rows should not change');
}

function verifyNoProviderNoWrite(caseResult, outcome) {
  const { result, before, after } = caseResult;
  assert(result.outcome === outcome, `expected ${outcome}, got ${result.outcome}`);
  assert(result.provider_calls === 0, `${outcome} should not call provider`);
  assert(result.write_summary.metadata_run_writes === 0, `${outcome} should not write metadata run`);
  assert(result.write_summary.api_request_log_writes === 0, `${outcome} should not write API log`);
  assertSame(after, before, `${outcome} should not mutate DB tables`);
}

function verifyRace(caseResult) {
  const { result, before, after } = caseResult;
  assert(result.outcome === 'race_resolved_already_readable', 'race should close as already readable after provider');
  assert(result.provider_calls === 1, 'race should have one provider call');
  assert(result.write_summary.metadata_run_writes === 1, 'race should finalize metadata run');
  assert(result.write_summary.api_request_log_writes === 1, 'race should keep provider log');
  assert(result.write_summary.entities_upserted === 0, 'race should not upsert entity');
  assert(result.write_summary.activity_event_label_patches === 0, 'race should not patch via provider label');
  assert(after.activity_events === before.activity_events, 'race should not add activity rows');
}

function verifyProviderContactNoLabel(caseResult, outcome, status) {
  const { result, before, after } = caseResult;
  assert(result.outcome === outcome, `expected ${outcome}, got ${result.outcome}`);
  assert(result.provider_calls === 1, `${outcome} should call provider once`);
  assert(result.metadata_run.status === status, `${outcome} should finalize ${status}`);
  assert(result.write_summary.metadata_run_writes === 1, `${outcome} should write metadata run`);
  assert(result.write_summary.api_request_log_writes === 1, `${outcome} should write API log`);
  assert(result.write_summary.entities_upserted === 0, `${outcome} should not upsert entity`);
  assert(result.write_summary.activity_event_label_patches === 0, `${outcome} should not patch labels`);
  assert(after.entities === before.entities, `${outcome} should not change entity count`);
}

function verifyCommon(result) {
  assert(result.action === 'metadata.selected_id_readability_repair.execute', 'action should be named');
  assert(result.renderer_eligible === false, 'execution should not be renderer eligible');
  assert(result.trusted_non_renderer_only === true, 'execution should be trusted non-renderer');
  assert(result.zkill_calls === 0, 'execution should not call zKill');
  assert(result.evidence_boundary.creates_evidence === false, 'Resolve should not create Evidence/EVEidence');
  assert(result.evidence_boundary.fourth_lane_reopened === false, 'fourth lane should stay parked');
  assert(result.forbidden_mutations.discovery_ref_mutations === 0, 'Discovery refs should not mutate');
  assert(result.forbidden_mutations.watch_mutations === 0, 'Watch should not mutate');
  assert(result.forbidden_mutations.assessment_memory_mutations === 0, 'Assessment should not mutate');
  assert(result.forbidden_mutations.bucket_persistence === false, 'Bucket should not persist');
  assert(result.forbidden_mutations.dispatcher_created === false, 'Dispatcher should not be created');
  assert(result.forbidden_mutations.schema_changes === 0, 'schema should not change');
  assert(result.forbidden_mutations.runtime_enforcement_active === false, 'runtime enforcement should remain inactive');
  assert(result.forbidden_mutations.ui_work === false, 'UI should not change');
}

function verifyCommandRegistration() {
  const commands = new Map(listServiceCommands().map((entry) => [entry.command, entry]));
  const command = commands.get('metadata.selected_id_readability_repair.execute');
  assert(command, 'Resolve execution should be listed');
  assert(command.classification === 'metadata-only', 'Resolve execution should be metadata-only');
  assert(command.effects.includes('external-live-api'), 'Resolve execution should declare external live API effect');
  assert(command.effects.includes('local-data-mutation'), 'Resolve execution should declare local mutation effect');
  assert(command.effects.includes('metadata-readability'), 'Resolve execution should declare readability effect');
  assert(command.renderer_allowed === false, 'Resolve execution should not be renderer eligible');
  assert(command.authority.confirmation_required === true, 'Resolve execution should require confirmation');
  assert(command.authority.token === CONFIRMATION.METADATA_HYDRATION, 'Resolve execution should use metadata Hydration authority');
}

function payload(idType, idValue) {
  return {
    idType,
    idValue,
    operatorAct: true,
    action: 'Resolve',
    sourceSurface: 'selected-id-resolve-verifier',
    basisLayer: 'activity_events'
  };
}

function readyContext(overrides = {}) {
  return {
    now: '2026-06-05T12:00:00Z',
    externalIoState: 'on',
    storageAuthority: readyStorageAuthority(),
    ...overrides
  };
}

function readyStorageAuthority() {
  return {
    mode: 'selected_storage',
    selected: true,
    validation_status: 'valid',
    write_allowed_if_enforced_later: true,
    provider_movement_allowed_if_enforced_later: true,
    budget_bytes: 5 * 1024 * 1024 * 1024,
    budget_source: 'fixture_configured',
    config_source: 'trusted_fixture_runtime'
  };
}

function blockedStorageAuthority() {
  return {
    ...readyStorageAuthority(),
    mode: 'selected_storage_missing_unavailable',
    validation_status: 'missing_unavailable',
    write_allowed_if_enforced_later: false,
    provider_movement_allowed_if_enforced_later: false
  };
}

function seedEvidenceActivity(db, options = {}, extra = {}) {
  const killmailId = options.killmailId || Number(String(options.idValue).slice(-6));
  db.prepare(`
    INSERT INTO killmails (
      killmail_id, killmail_hash, killmail_time, solar_system_id, raw_esi_payload,
      raw_payload_checksum, source, first_seen_at, last_seen_at, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(killmailId, `hash_${killmailId}`, '2026-06-01T10:00:00Z', 30000001, `{"killmail_id":${killmailId}}`, `checksum_${killmailId}`, 'fixture', '2026-06-01T10:00:00Z', '2026-06-01T10:00:00Z', '2026-06-01T10:00:00Z');
  if (extra.entityLabel !== undefined) {
    db.prepare(`
      INSERT INTO entities (entity_type, entity_id, entity_name, first_seen_at, last_seen_at, last_enriched_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(options.idType, options.idValue, extra.entityLabel, '2026-06-01T09:00:00Z', '2026-06-01T09:00:00Z', '2026-06-01T09:00:00Z');
  }
  const label = options.label || null;
  db.prepare(`
    INSERT INTO activity_events (
      event_key, killmail_id, role, entity_type, entity_id, entity_name,
      character_id, character_name, corporation_id, corporation_name, alliance_id, alliance_name,
      ship_type_id, ship_type_name, weapon_type_id, final_blow, damage_done,
      solar_system_id, solar_system_name, region_id, region_name, killmail_time, ingested_at,
      discovered_by_type, discovered_by_id, normalizer_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `${killmailId}:${options.idType}:${options.idValue}`,
    killmailId,
    'attacker',
    options.idType,
    options.idValue,
    label,
    options.idType === 'character' ? options.idValue : 90000001,
    options.idType === 'character' ? label : null,
    options.idType === 'corporation' ? options.idValue : 98000001,
    options.idType === 'corporation' ? label : null,
    options.idType === 'alliance' ? options.idValue : 99000001,
    options.idType === 'alliance' ? label : null,
    603,
    'Merlin',
    null,
    1,
    42,
    30000001,
    'Atlas Prime',
    10000001,
    'Test Region',
    '2026-06-01T10:00:00Z',
    '2026-06-01T10:00:00Z',
    'manual_actor',
    90000001,
    'fixture'
  );
}

function seedDiscoveryOnly(db) {
  db.prepare(`
    INSERT INTO discovered_killmail_refs (
      killmail_id, killmail_hash, discovered_by_type, discovered_by_id, source_scope,
      discovered_at, last_seen_at, status, priority
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(9301, 'hash_9301', 'manual_character', 'character:90000025', 'manual', '2026-06-01T00:00:00Z', '2026-06-01T00:00:00Z', 'pending', 1);
}

function seedWatchOnly(db) {
  db.prepare('INSERT INTO watchlist_entities (entity_type, entity_id, entity_name, is_active) VALUES (?, ?, ?, ?)')
    .run('character', 90000026, 'Watch Interest', 1);
}

function seedAssessmentOnly(db) {
  db.prepare(`
    INSERT INTO assessment_artifacts (
      artifact_id, artifact_type, entity_type, entity_id, status,
      assessment_reason, assessment_summary, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('assessment-90000027', 'entity_interest', 'character', 90000027, 'active', 'fixture', 'fixture assessment', '2026-06-01T00:00:00Z', '2026-06-01T00:00:00Z');
}

function seedLocalLookup(db) {
  db.prepare(`
    INSERT INTO type_metadata (type_id, type_name, group_id, group_name, category_id, category_name, last_fetched)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(603, 'Merlin', 25, 'Frigate', 6, 'Ship', '2026-06-01T00:00:00Z');
}

function seedEmpty() {}

function setActivityLabel(db, idType, idValue, label) {
  const nameColumn = `${idType}_name`;
  const idColumn = idType === 'character' ? 'character_id' : idType === 'corporation' ? 'corporation_id' : 'alliance_id';
  db.prepare(`UPDATE activity_events SET ${nameColumn} = ?, entity_name = ? WHERE ${idColumn} = ?`).run(label, label, idValue);
}

function fakeNamesFetch(rows, options = {}) {
  return async (db, endpoint, requestOptions = {}) => {
    if (typeof options.beforeResponse === 'function') {
      options.beforeResponse(db);
    }
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => JSON.stringify(rows),
      endpoint,
      options: requestOptions
    };
  };
}

function fakeErrorFetch() {
  return async () => ({
    ok: false,
    status: 500,
    headers: { get: () => null },
    text: async () => JSON.stringify({ error: 'fixture provider error' })
  });
}

function failIfFetched() {
  return async () => {
    throw new Error('provider should not be called in this case');
  };
}

function snapshot(db) {
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
    assessment_artifacts: count(db, 'assessment_artifacts'),
    ingestion_audits: count(db, 'ingestion_audits'),
    data_quality_warnings: count(db, 'data_quality_warnings')
  };
}

function compact(result) {
  return {
    outcome: result.outcome,
    selected_id: result.selected_id,
    provider_calls: result.provider_calls,
    metadata_run_status: result.metadata_run?.status || null,
    write_summary: result.write_summary,
    validation_status: result.validation_result?.status || result.provider_validation?.status || null
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

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertSame(actual, expected, message) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}\nactual=${JSON.stringify(actual)}\nexpected=${JSON.stringify(expected)}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
