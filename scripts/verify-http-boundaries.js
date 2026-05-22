const { EventEmitter } = require('node:events');
const { PassThrough } = require('node:stream');
const https = require('node:https');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { HttpClient } = require('../src/main/api/httpClient');
const { EsiClient } = require('../src/main/api/esiClient');
const { validateEndpointUrl, ENDPOINT_INVENTORY } = require('../src/main/api/endpointPolicy');
const { downloadFile } = require('../src/main/sde/sdeLookupBuilder');
const { invokeServiceCommand, validateServiceInvokeEnvelope } = require('../src/main/services/serviceRegistry');

async function main() {
  verifyEndpointInventory();
  await verifyInvalidJsonLogging();
  await verifyEsiKillmailInputValidation();
  await verifySdeDownloadEndpointPolicy();
  await verifySdeDownloadRedirectAndSizePolicy();
  await verifySdeLiveGate();
  verifyServiceEnvelopeValidation();
  console.log('HTTP endpoint boundaries verified');
}

function verifyEndpointInventory() {
  for (const key of [
    'zkill_discovery',
    'esi_killmail_expansion',
    'esi_universe_names',
    'sde_lookup_download',
    'diagnostics_readiness',
    'future_export_sync'
  ]) {
    assert(ENDPOINT_INVENTORY[key], `endpoint inventory should include ${key}`);
  }
  assert(ENDPOINT_INVENTORY.sde_lookup_download.route_class === 'external-operator-sde-source-download', 'SDE route class should be explicit');
}

async function verifyInvalidJsonLogging() {
  const db = openDatabase(':memory:');
  migrate(db);
  const repository = new EvidenceRepository(db);
  const run = repository.createFetchRun({
    trigger: 'fixture_test',
    watchType: 'manual_discovery',
    watchId: 'invalid-json'
  });
  let attempts = 0;
  const client = new HttpClient({
    repository,
    runId: run.run_id,
    fetchImpl: async () => {
      attempts += 1;
      return {
        ok: true,
        status: 200,
        text: async () => '{not valid json'
      };
    }
  });

  try {
    await assertRejects(
      () => client.json('zkill', 'https://zkillboard.com/api/systemID/30000001/pastSeconds/60/'),
      'HTTP_INVALID_JSON',
      'invalid JSON should be non-retryable'
    );
    assert(attempts === 1, 'invalid JSON should not be retried');
    const logs = db.prepare('SELECT status_code, error_message, retry_count FROM api_request_logs WHERE run_id = ?').all(run.run_id);
    assert(logs.length === 1, 'invalid JSON should write one request log');
    assert(logs[0].status_code === null, 'invalid JSON should not log a successful status');
    assert(logs[0].error_message.includes('invalid JSON'), 'invalid JSON should log failure message');
    assert(logs[0].retry_count === 0, 'invalid JSON should not add retry noise');
  } finally {
    closeDatabase(db);
  }
}

async function verifyEsiKillmailInputValidation() {
  const endpoints = [];
  const esi = new EsiClient({
    json(_provider, endpoint) {
      endpoints.push(endpoint);
      return Promise.resolve({ ok: true });
    }
  });

  await assertRejects(() => esi.expandKillmail(0, 'abcdef123456'), 'ESI_KILLMAIL_ID_INVALID', 'zero killmail ID should reject');
  await assertRejects(() => esi.expandKillmail(123, '../bad/hash'), 'ESI_KILLMAIL_HASH_INVALID', 'path-like hash should reject');
  await esi.expandKillmail(123, 'abcDEF_123-xyz');
  assert(endpoints.length === 1, 'valid expansion should construct one endpoint');
  assert(endpoints[0].includes('/latest/killmails/123/abcDEF_123-xyz/'), 'valid killmail endpoint should use safe path segments');
}

async function verifySdeDownloadEndpointPolicy() {
  assertThrows(() => validateEndpointUrl('http://developers.eveonline.com/static-data/test.zip', 'sde_lookup_download'), 'ENDPOINT_PROTOCOL_DENIED', 'SDE downloader should reject http');
  assertThrows(() => validateEndpointUrl('https://example.com/static-data/test.zip', 'sde_lookup_download'), 'ENDPOINT_HOST_DENIED', 'SDE downloader should reject unapproved host');
}

async function verifySdeDownloadRedirectAndSizePolicy() {
  await withFakeHttpsGet((url, _options, callback) => fakeRedirect(url, callback, 'https://example.com/evil.zip'), async () => {
    await assertRejects(
      () => downloadFile('https://developers.eveonline.com/static-data/test.zip', 'unused.zip'),
      'ENDPOINT_HOST_DENIED',
      'SDE downloader should reject redirect to denied host'
    );
  });

  await withFakeHttpsGet((_url, _options, callback) => fakeResponse(callback, {
    statusCode: 200,
    headers: { 'content-length': '2048' },
    body: 'too large'
  }), async () => {
    await assertRejects(
      () => downloadFile('https://developers.eveonline.com/static-data/test.zip', 'unused.zip', { maxBytes: 1024 }),
      'SDE_DOWNLOAD_TOO_LARGE',
      'SDE downloader should reject oversized response before processing'
    );
  });
}

async function verifySdeLiveGate() {
  const previous = process.env.AURA_ATLAS_LIVE_API;
  delete process.env.AURA_ATLAS_LIVE_API;
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    await assertRejects(
      () => invokeServiceCommand('sde.build-lookups', {}, { db }),
      'LIVE_API_DISABLED',
      'SDE lookup download should require explicit live enablement when no local source is supplied'
    );
  } finally {
    closeDatabase(db);
    if (previous === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = previous;
    }
  }
}

function verifyServiceEnvelopeValidation() {
  assertThrows(() => validateServiceInvokeEnvelope(null), 'SERVICE_ENVELOPE_INVALID', 'null envelope should reject');
  assertThrows(() => validateServiceInvokeEnvelope({ command: 42 }), 'SERVICE_COMMAND_INVALID', 'non-string command should reject');
  assertThrows(() => validateServiceInvokeEnvelope({ command: 'report.actor', payload: 'bad' }), 'SERVICE_PAYLOAD_INVALID', 'non-object payload should reject');
  assertThrows(() => validateServiceInvokeEnvelope({ command: 'report.actor', payload: {}, asTask: 'yes' }), 'SERVICE_ENVELOPE_INVALID', 'non-boolean task flag should reject');
  const ok = validateServiceInvokeEnvelope({ command: 'report.actor', payload: {}, asTask: true });
  assert(ok.command === 'report.actor' && ok.asTask === true, 'valid envelope should normalize');
}

function fakeRedirect(url, callback, location) {
  return fakeResponse(callback, {
    statusCode: 302,
    headers: { location },
    body: ''
  }, url);
}

function fakeResponse(callback, { statusCode, headers, body }) {
  const request = new EventEmitter();
  request.setTimeout = () => {};
  request.destroy = () => {};
  process.nextTick(() => {
    const response = new PassThrough();
    response.statusCode = statusCode;
    response.headers = headers || {};
    response.resume = () => {};
    callback(response);
    response.end(body || '');
  });
  return request;
}

async function withFakeHttpsGet(fakeGet, fn) {
  const original = https.get;
  https.get = fakeGet;
  try {
    await fn();
  } finally {
    https.get = original;
  }
}

function assertThrows(fn, expectedCode, message) {
  try {
    fn();
  } catch (error) {
    assert(error.code === expectedCode, `${message}: expected ${expectedCode}, got ${error.code || error.message}`);
    return;
  }
  throw new Error(message);
}

async function assertRejects(fn, expectedCode, message) {
  try {
    await fn();
  } catch (error) {
    assert(error.code === expectedCode, `${message}: expected ${expectedCode}, got ${error.code || error.message}`);
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
