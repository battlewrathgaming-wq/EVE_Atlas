# DevHS190 API Request Log Redaction Readiness

Status: Complete

## Scope

Added the HS190 read-only readiness proof:

```txt
support.api_request_log_redaction_readiness.preview
```

This maps persisted `api_request_logs` endpoint/error posture before any log persistence hardening or light-log export writer exists.

## Files Changed

- `src/main/services/apiRequestLogRedactionReadinessService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-api-request-log-redaction-readiness.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS190-api-request-log-redaction-readiness.md`

## Command Added

```txt
support.api_request_log_redaction_readiness.preview
```

Shape:

- read-only
- renderer eligible
- renderer payload ignored
- no provider calls
- no API request log writes
- no support artifact or light-log export creation
- no `HttpClient` / provider worker / repository behavior change

## Mapped Log Write Sources

- `src/main/api/httpClient.js` / `HttpClient.log(entry)`
- `src/main/db/evidenceRepository.js` / `EvidenceRepository.insertApiRequestLog(log)`
- `src/main/workers/manualDiscoveryWorker.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/metadata/reportHydrator.js`
- `scripts/*` verification fixtures that call `insertApiRequestLog`

## Current Posture

Focused verifier sample:

```json
{
  "write_source_count": 8,
  "persisted_field_count": 13,
  "current_posture": {
    "endpoint_string": "unproven",
    "query_values": "absent",
    "secret_token_auth_cookie_redaction": "unproven",
    "error_message_free_text": "unproven",
    "free_text_length_bounds": "absent",
    "provider_status_timing_cache_retry": "proven_present",
    "raw_provider_response_bodies": "excluded_by_schema",
    "raw_esi_payloads": "excluded_by_schema"
  }
}
```

The preview explicitly states:

- `api_request_logs` are provider provenance / operational diagnostics, not Evidence/EVEidence.
- `api_request_logs` do not have raw provider response body columns.
- `api_request_logs` do not have raw ESI payload columns.
- Endpoint and error strings are currently persisted as supplied by `HttpClient.log` / direct repository callers.
- Query value stripping before persistence is absent.
- Secret/token/auth/cookie-like string redaction before persistence is unproven.
- Free-text length bounds before persistence are absent.
- Trace-pack assembly redaction from HS188 is separate from persisted API log redaction.

## Recommended Later Insertion Point

Smallest later hardening point:

```txt
centralize sanitization immediately before EvidenceRepository.insertApiRequestLog persists endpoint and error_message
```

Preferred files for a later hardening packet:

- `src/main/db/evidenceRepository.js`
- `src/main/api/httpClient.js`

Reasoning:

- `EvidenceRepository.insertApiRequestLog` is the single repository helper for persisted `api_request_logs` rows.
- `HttpClient.log` is the primary runtime provider path and already has provider/method/status/timing context.
- A later hardening change can preserve route shape for report parsing while stripping query values and bounding/redacting diagnostic text before persistence.

## Conformance Map

`support.artifact_writer_conformance_gap_map.preview` remains unchanged by HS190 behaviorally:

- trace-pack checks remain conforming after HS188
- light operational log secret redaction remains `unknown`
- readiness/preflight alias normalization remains `gap`

This is intentional because HS190 is a read-only readiness proof, not log persistence hardening.

## Verification

Passed:

```powershell
node --check src\main\services\apiRequestLogRedactionReadinessService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-api-request-log-redaction-readiness.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
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
git diff --check
git status --short --branch
```

Final `verify:protected-terms` passed with warning-only advisory output: 268 warnings across 9 changed files; no renames or protected-word JSON updates were performed.

## Boundary Confirmation

- No `api_request_logs` write behavior changed.
- No `HttpClient` behavior changed.
- No provider worker behavior changed.
- No trace-pack writer behavior changed.
- No light-log writer/export was created.
- No provider calls were added.
- No Evidence/EVEidence, Discovery, Hydration, Assessment Memory, Watch, storage config, External I/O config, or schema mutation was added.
- No runtime enforcement activation or command blocking was added.
- No renderer UI work was performed.

## Risks / Follow-Up

- Persisted endpoint/query/error redaction remains unimplemented.
- Future hardening should preserve route-shape compatibility for report parsing while stripping query values.
- The next small seam, if accepted, is persisted `api_request_logs` endpoint/error sanitization before insert.
