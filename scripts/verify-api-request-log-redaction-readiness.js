const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const {
  API_REQUEST_LOG_SANITIZATION_LIMITS,
  EvidenceRepository,
  sanitizeApiLogEndpoint,
  sanitizeApiLogErrorMessage
} = require('../src/main/db/evidenceRepository');
const { HttpClient } = require('../src/main/api/httpClient');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildApiRequestLogRedactionReadinessPreview } = require('../src/main/services/apiRequestLogRedactionReadinessService');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    const before = tableCounts(db);
    const preview = await invokeServiceCommand('support.api_request_log_redaction_readiness.preview', {
      endpointRedaction: 'renderer-forged',
      maxLength: 1,
      createLightLogExport: true
    }, {
      db,
      source: 'renderer'
    });
    const after = tableCounts(db);

    verifyReadOnlyBoundary(preview);
    assertSame(after, before, 'API request log readiness preview should not mutate DB tables');
    verifyCoverage(preview);
    verifyCurrentPosture(preview);
    await verifyPersistenceSanitization(db);
    verifyDirectBuilder();
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'api request log redaction readiness verified',
      command: preview.action,
      write_source_count: preview.write_sources.length,
      persisted_field_count: preview.table.persisted_fields.length,
      current_posture: Object.fromEntries(Object.entries(preview.current_posture).map(([key, value]) => [key, value.status])),
      smallest_later_insertion_point: preview.recommended_later_hardening.smallest_insertion_point,
      affected_surfaces: preview.affected_surfaces,
      boundary: preview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'support.api_request_log_redaction_readiness.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should declare read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.renderer_payload_ignored === true, 'preview should ignore renderer payload claims');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.zkill_calls === 0, 'preview should not call zKill');
  assert(preview.esi_calls === 0, 'preview should not call ESI');
  assert(preview.creates_support_artifacts === false, 'preview should not create support artifacts');
  assert(preview.creates_logs === false, 'preview should not create logs');
  assert(preview.creates_exports === false, 'preview should not create exports');
  assert(preview.creates_files === false, 'preview should not create files');
  assert(preview.creates_directories === false, 'preview should not create directories');
  assert(preview.api_request_log_writes === 0, 'preview should not write API request logs');
  assert(preview.evidence_writes === 0, 'preview should not write Evidence/EVEidence');
  assert(preview.discovery_ref_mutations === 0, 'preview should not mutate Discovery refs');
  assert(preview.hydration_writes === 0, 'preview should not write Hydration output');
  assert(preview.assessment_writes === 0, 'preview should not write Assessment Memory');
  assert(preview.watch_mutations === 0, 'preview should not mutate Watch state');
  assert(preview.storage_config_writes === 0, 'preview should not write storage config');
  assert(preview.external_io_config_writes === 0, 'preview should not write External I/O config');
  assert(preview.schema_changes === false, 'preview should not change schema');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate enforcement');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
  assert(preview.log_write_behavior_changed === false, 'preview should not change log writes');
  assert(preview.trace_pack_writer_changed === false, 'preview should not change trace-pack writer');
  assert(preview.light_log_writer_created === false, 'preview should not create a light-log writer');
}

function verifyCoverage(preview) {
  assert(preview.policy_source === 'support.trace_log_redaction_policy.preview', 'preview should name policy source');
  assert(preview.table.name === 'api_request_logs', 'preview should map api_request_logs');
  assert(preview.table.is_evidence === false, 'api_request_logs should not be Evidence/EVEidence');
  assert(preview.table.is_discovery === false, 'api_request_logs should not be Discovery');
  assert(preview.table.raw_provider_response_body_columns.length === 0, 'api_request_logs should have no response body column');
  assert(preview.table.raw_esi_payload_columns.length === 0, 'api_request_logs should have no raw ESI payload column');
  for (const field of [
    'request_id',
    'run_id',
    'run_type',
    'provider',
    'endpoint',
    'method',
    'status_code',
    'duration_ms',
    'cache_status',
    'retry_count',
    'rate_limited',
    'error_message',
    'requested_at'
  ]) {
    assert(preview.table.persisted_fields.some((entry) => entry.name === field), `missing persisted field ${field}`);
  }
  for (const sourceFile of [
    'src/main/api/httpClient.js',
    'src/main/db/evidenceRepository.js',
    'src/main/workers/manualDiscoveryWorker.js',
    'src/main/workers/manualExpansionWorker.js',
    'src/main/workers/actorWatchCollector.js',
    'src/main/workers/systemRadiusCollector.js',
    'src/main/metadata/reportHydrator.js'
  ]) {
    assert(preview.write_sources.some((entry) => entry.source_file === sourceFile), `missing write source ${sourceFile}`);
  }
}

function verifyCurrentPosture(preview) {
  assert(preview.persistence_sanitization_active === true, 'persistence sanitization should be active');
  assert(preview.persistence_sanitization_scope.includes('EvidenceRepository.insertApiRequestLog'), 'persistence sanitization should name repository helper');
  assert(preview.current_posture.endpoint_string.status === 'proven_at_insert', 'endpoint persistence redaction should be proven at insert');
  assert(preview.current_posture.query_values.status === 'proven_at_insert', 'query value stripping should be proven before persistence');
  assert(preview.current_posture.secret_token_auth_cookie_redaction.status === 'proven_for_tested_patterns', 'secret redaction should be proven for tested patterns');
  assert(preview.current_posture.error_message_free_text.status === 'proven_at_insert', 'error message redaction should be proven at insert');
  assert(preview.current_posture.free_text_length_bounds.status === 'proven_at_insert', 'free-text length bounds should be proven before persistence');
  assert(preview.current_posture.raw_provider_response_bodies.status === 'excluded_by_schema', 'raw provider bodies should be excluded by schema');
  assert(preview.current_posture.raw_esi_payloads.status === 'excluded_by_schema', 'raw ESI payloads should be excluded by schema');
  assert(preview.affected_surfaces.trace_pack_assembly_redaction === 'separate_already_hardened_by_HS188', 'trace-pack redaction should stay separate');
  assert(preview.affected_surfaces.light_log_export === 'not created', 'light-log export should not be created');
  assert(preview.recommended_later_hardening.smallest_insertion_point.includes('EvidenceRepository.insertApiRequestLog'), 'smallest insertion point should name repository helper');
}

async function verifyPersistenceSanitization(db) {
  const repository = new EvidenceRepository(db);
  const endpoint = 'https://esi.evetech.net/latest/killmails/123456/abcDEF/?token=secret-token&scope=esi-killmails.read.v1&cookie=private-cookie';
  const errorMessage = [
    `HTTP 500 for ${endpoint}`,
    'Authorization: Bearer very-secret-provider-token',
    'raw body {"killmail_id":123456,"victim":{"character_id":42},"attackers":[{"character_id":43}]}',
    'x'.repeat(API_REQUEST_LOG_SANITIZATION_LIMITS.error_message + 80)
  ].join(' ');

  repository.insertApiRequestLog({
    request_id: 'request_sanitization_direct',
    run_type: 'unscoped',
    provider: 'esi',
    endpoint,
    method: 'GET',
    status_code: 500,
    duration_ms: 42,
    cache_status: 'miss',
    retry_count: 2,
    rate_limited: true,
    error_message: errorMessage,
    requested_at: '2026-06-02T00:00:00.000Z'
  });

  const direct = db.prepare('SELECT * FROM api_request_logs WHERE request_id = ?').get('request_sanitization_direct');
  verifySanitizedEndpoint(direct.endpoint);
  verifySanitizedError(direct.error_message);
  assert(direct.provider === 'esi', 'provider provenance should be preserved');
  assert(direct.method === 'GET', 'method provenance should be preserved');
  assert(direct.status_code === 500, 'status provenance should be preserved');
  assert(direct.duration_ms === 42, 'timing provenance should be preserved');
  assert(direct.cache_status === 'miss', 'cache posture should be preserved');
  assert(direct.retry_count === 2, 'retry count should be preserved');
  assert(direct.rate_limited === 1, 'rate-limit posture should be preserved');

  const fetchedEndpoints = [];
  const client = new HttpClient({
    repository,
    fetchImpl: async (fetchEndpoint) => {
      fetchedEndpoints.push(fetchEndpoint);
      return {
        ok: true,
        status: 200,
        text: async () => '{"ok":true}'
      };
    }
  });
  await client.json('esi', endpoint);
  assertSame(fetchedEndpoints, [endpoint], 'provider fetch endpoint should be unchanged before network call');
  const httpLog = db.prepare('SELECT endpoint FROM api_request_logs WHERE request_id != ? ORDER BY rowid DESC LIMIT 1').get('request_sanitization_direct');
  verifySanitizedEndpoint(httpLog.endpoint);

  assert(sanitizeApiLogEndpoint(endpoint).includes('/latest/killmails/123456/abcDEF/'), 'direct endpoint helper should preserve route shape');
  assert(sanitizeApiLogErrorMessage(errorMessage).length <= API_REQUEST_LOG_SANITIZATION_LIMITS.error_message, 'direct error helper should bound text');
}

function verifySanitizedEndpoint(endpoint) {
  assert(endpoint.includes('/latest/killmails/123456/abcDEF/'), 'sanitized endpoint should preserve route path shape');
  assert(endpoint.includes('token=[redacted]'), 'sanitized endpoint should preserve token key with redacted value');
  assert(endpoint.includes('scope=[redacted]'), 'sanitized endpoint should preserve non-secret query key with redacted value');
  assert(endpoint.includes('cookie=[redacted]'), 'sanitized endpoint should preserve cookie key with redacted value');
  assert(!endpoint.includes('secret-token'), 'sanitized endpoint should not persist token value');
  assert(!endpoint.includes('esi-killmails.read.v1'), 'sanitized endpoint should not persist query value');
  assert(!endpoint.includes('private-cookie'), 'sanitized endpoint should not persist cookie value');
  assert(endpoint.length <= API_REQUEST_LOG_SANITIZATION_LIMITS.endpoint, 'sanitized endpoint should be bounded');
}

function verifySanitizedError(errorMessage) {
  assert(errorMessage.includes('/latest/killmails/123456/abcDEF/'), 'sanitized error should preserve route context');
  assert(errorMessage.includes('token=[redacted]'), 'sanitized error should redact URL query values');
  assert(errorMessage.includes('Authorization=[redacted]') || errorMessage.includes('Bearer [redacted]'), 'sanitized error should redact authorization material');
  assert(errorMessage.includes('[redacted: provider payload]'), 'sanitized error should redact provider payload fragments');
  assert(!errorMessage.includes('secret-token'), 'sanitized error should not persist URL token value');
  assert(!errorMessage.includes('very-secret-provider-token'), 'sanitized error should not persist bearer token value');
  assert(!errorMessage.includes('"victim"'), 'sanitized error should not persist raw ESI payload fragment');
  assert(errorMessage.length <= API_REQUEST_LOG_SANITIZATION_LIMITS.error_message, 'sanitized error should be bounded');
}

function verifyDirectBuilder() {
  const preview = buildApiRequestLogRedactionReadinessPreview();
  assert(preview.write_sources.length >= 7, 'direct builder should return write source map');
  assert(preview.api_request_log_writes === 0, 'direct builder should not write API logs');
}

function verifyCommandRegistration() {
  const command = listServiceCommands().find((entry) => entry.command === 'support.api_request_log_redaction_readiness.preview');
  assert(command, 'API request log redaction readiness command should be registered');
  assert(command.classification === 'read-only', 'API request log readiness should be read-only');
  assert(command.effects.includes('read-only'), 'API request log readiness should declare read-only effect');
  assert(command.renderer_allowed === true, 'API request log readiness should be renderer eligible');
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
    system_watches: count(db, 'system_watches')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
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
