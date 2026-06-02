# Overseer HS193 - HS192 API Log Persistence Sanitization Review

Status: accepted
Date: 2026-06-02
Reviewed handoff: `workspace/DevHS192-api-request-log-persistence-sanitization.md`
Accepted runway: `workspace/OverseerHS192-api-request-log-persistence-sanitization-runway.md`

## Review Result

HS192 is accepted.

The implementation matches the bounded runway: persisted `api_request_logs.endpoint` and `api_request_logs.error_message` are sanitized at the repository insert seam while provider request behavior remains unchanged.

Accepted insertion point:

```txt
EvidenceRepository.insertApiRequestLog(log)
```

## Accepted Work

Accepted files and behavior:

- `src/main/db/evidenceRepository.js`
- `src/main/services/apiRequestLogRedactionReadinessService.js`
- `scripts/verify-api-request-log-redaction-readiness.js`
- `workspace/DevHS192-api-request-log-persistence-sanitization.md`

Accepted helper surface:

- `sanitizeApiRequestLogPersistence(log)`
- `sanitizeApiLogEndpoint(endpoint)`
- `sanitizeApiLogErrorMessage(message)`
- `API_REQUEST_LOG_SANITIZATION_LIMITS`

Accepted persisted limits:

- endpoint: 160 characters
- error_message: 240 characters

Accepted endpoint behavior:

- preserves useful route shape
- preserves query keys while redacting values
- redacts secret-like path values after secret-like path segments
- bounds persisted endpoint text

Accepted error-message behavior:

- redacts URL query values inside diagnostic text
- redacts token/auth/cookie/session/secret/password/key-like assignments
- redacts bearer/basic authorization values
- redacts provider-payload-like fragments for tested patterns
- bounds persisted error text

## Boundary Check

Confirmed:

- no provider request URL changes before network calls
- no `HttpClient.json` fetch/retry/provider execution behavior changes
- no provider worker behavior changes
- no schema changes
- no report behavior changes
- no trace-pack writer behavior changes
- no light-log writer or export creation
- no provider calls added
- no Evidence/EVEidence writes added
- no Discovery ref mutation
- no Hydration writes
- no Assessment Memory writes
- no Watch mutation
- no storage config or External I/O config mutation
- no runtime enforcement activation
- no command blocking
- no support artifact creation
- no renderer UI work

`api_request_logs` remain provider provenance / operational diagnostics, not Evidence/EVEidence, Discovery, Hydration output, Assessment Memory, Watch state, product truth, deletion authority, or pruning authority.

## Verification Re-Run

Overseer re-ran:

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
git diff --check
git status --short --branch
```

Results:

- all syntax and npm verification commands passed
- `verify:protected-terms` passed warning-only with 127 warnings across 7 changed files
- no renames or protected-word JSON updates were performed
- `git diff --check` passed with only CRLF normalization warnings

## Accepted Posture Movement

`support.api_request_log_redaction_readiness.preview` now truthfully reports:

- endpoint string persistence: `proven_at_insert`
- query value stripping: `proven_at_insert`
- secret/token/auth/cookie-like redaction: `proven_for_tested_patterns`
- error message free-text sanitization: `proven_at_insert`
- free-text length bounds: `proven_at_insert`
- raw provider response bodies: `excluded_by_schema`
- raw ESI payloads: `excluded_by_schema`

## Residual Risk

Pattern-based redaction is accepted for this slice and should not be treated as universal secret detection. Unusual provider-specific secret formats may need later pattern expansion.

Already-persisted historical `api_request_logs` rows are not backfilled or migrated.

Light operational log writer/export hardening remains unopened.

## Resting Recommendation

Atlas can now rest the API log persistence seam.

Reasonable next candidates:

1. light-log redaction / writer proof, if support artifact hardening continues
2. readiness/preflight class-id alias normalization
3. rest support artifacts and continue a different storage/runtime seam

Do not open broad logging framework work, historical log migration, runtime enforcement activation, command blocking, provider work, or UI work from HS192 alone.
