# DevHS192 API Request Log Persistence Sanitization

Status: Complete

## Scope

Applied bounded persistence sanitization for `api_request_logs.endpoint` and `api_request_logs.error_message` at the repository insert seam:

```txt
EvidenceRepository.insertApiRequestLog(log)
```

Provider request URLs, fetch/retry behavior, provider workers, schema, reports, trace-pack writer behavior, light-log exports, runtime enforcement, command blocking, and renderer UI were not changed.

## Files Changed

- `src/main/db/evidenceRepository.js`
- `src/main/services/apiRequestLogRedactionReadinessService.js`
- `scripts/verify-api-request-log-redaction-readiness.js`
- `workspace/current.md`
- `workspace/DevHS192-api-request-log-persistence-sanitization.md`

Pre-existing workspace packet files already changed on disk before Dev source edits:

- `workspace/overview.md`
- `workspace/OverseerHS192-api-request-log-persistence-sanitization-runway.md`

## Sanitization Helper Location

Implemented in `src/main/db/evidenceRepository.js`:

- `sanitizeApiRequestLogPersistence(log)`
- `sanitizeApiLogEndpoint(endpoint)`
- `sanitizeApiLogErrorMessage(message)`
- `API_REQUEST_LOG_SANITIZATION_LIMITS`

Limits:

- endpoint: 160 characters
- error_message: 240 characters

## Redaction Rules

Endpoint persistence:

- preserves scheme/host/path route shape where present
- preserves path segments used by reports, such as `/systemID/.../`, `/characterID/.../`, `/corporationID/.../`, `/allianceID/.../`, `/pastSeconds/.../`, and ESI killmail route segments
- preserves query key names
- replaces query values with `[redacted]`
- redacts secret-like path values following token/auth/cookie/session/secret/password/key-like path segments
- bounds the persisted endpoint string

Error-message persistence:

- redacts URL query values inside diagnostic text
- redacts token/auth/cookie/session/secret/password/key-like assignments
- redacts bearer/basic authorization values
- redacts provider/ESI-payload-like JSON fragments with `[redacted: provider payload]`
- bounds the persisted error text

Provider/status/timing/cache/retry provenance fields are stored unchanged.

## Sample Sanitized Output

Input endpoint:

```txt
https://esi.evetech.net/latest/killmails/123456/abcDEF/?token=secret-token&scope=esi-killmails.read.v1&cookie=private-cookie
```

Persisted endpoint:

```txt
https://esi.evetech.net/latest/killmails/123456/abcDEF/?token=[redacted]&scope=[redacted]&cookie=[redacted]
```

Input error text included a provider URL, bearer token, and raw-ish ESI payload fragment.

Persisted error text keeps the route context, redacts URL query values and authorization material, replaces the provider payload fragment with `[redacted: provider payload]`, and is bounded to 240 characters.

## HS190 Readiness Posture Update

`support.api_request_log_redaction_readiness.preview` now reports:

- endpoint string persistence: `proven_at_insert`
- query values: `proven_at_insert`
- secret/token/auth/cookie-like redaction: `proven_for_tested_patterns`
- error message free text: `proven_at_insert`
- free-text length bounds: `proven_at_insert`
- raw provider response bodies: `excluded_by_schema`
- raw ESI payloads: `excluded_by_schema`

The readout also distinguishes that invoking the preview remains read-only; the persistence hardening is active at repository insert.

## Verification

Passed:

```powershell
node --check src\main\db\evidenceRepository.js
node --check src\main\services\apiRequestLogRedactionReadinessService.js
node --check scripts\verify-api-request-log-redaction-readiness.js
npm.cmd run verify:api-request-log-redaction-readiness
npm.cmd run verify:support-artifact-writer-conformance-gap-map
npm.cmd run verify:support-trace-log-redaction-policy
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:http-boundaries
npm.cmd run verify:hydration
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
```

`verify:protected-terms` passed with warning-only advisory output after this handoff file was added: 127 warnings across 7 changed files; no renames or protected-word JSON updates were performed.

Focused verifier coverage proves:

- endpoint query values are not persisted
- secret-like endpoint/error values are redacted before persistence
- persisted endpoint/error strings are bounded
- route shape remains diagnosable
- provider fetch URL passed to `fetchImpl` is unchanged
- raw provider/ESI-payload-like fragments are not persisted in `error_message`
- provider/status/timing/cache/retry provenance fields are preserved

## Boundary Confirmation

- No provider request URL changes before network calls.
- No `HttpClient.json` fetch/retry/provider execution behavior changes.
- No provider worker behavior changes.
- No schema changes.
- No report behavior changes.
- No trace-pack writer behavior changes.
- No light-log writer/export was created.
- No provider calls were added.
- No Evidence/EVEidence writes were added.
- No Discovery, Hydration, Assessment Memory, Watch, storage config, or External I/O config mutation was added.
- No runtime enforcement activation or command blocking was added.
- No support artifact creation was added.
- No renderer UI work was performed.

## Risks / Follow-Up

- Already-persisted historical `api_request_logs` rows are not backfilled or migrated.
- Secret redaction is pattern-based and covered for tested token/auth/cookie/session/key/bearer/basic shapes; unusual provider-specific secret formats may need later pattern expansion.
- Light operational log writer/export hardening remains unopened.
