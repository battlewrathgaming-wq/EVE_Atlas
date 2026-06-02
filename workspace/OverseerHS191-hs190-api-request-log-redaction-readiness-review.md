# Overseer HS191 - HS190 API Request Log Redaction Readiness Review

Status: accepted
Date: 2026-06-02
Reviewed handoff: `workspace/DevHS190-api-request-log-redaction-readiness.md`
Accepted runway: `workspace/OverseerHS190-api-request-log-redaction-readiness-runway.md`

## Review Result

HS190 is accepted.

The implementation matches the bounded runway: it adds a read-only readiness proof for persisted `api_request_logs` endpoint and error text posture before any log persistence hardening or light-log export writer exists.

Accepted command:

```txt
support.api_request_log_redaction_readiness.preview
```

## Accepted Work

Accepted files and behavior:

- `src/main/services/apiRequestLogRedactionReadinessService.js`
- `scripts/verify-api-request-log-redaction-readiness.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- command authority, service registry, passive side-effect, and package script coverage
- `workspace/DevHS190-api-request-log-redaction-readiness.md`

The readout maps:

- API request log write sources
- persisted `api_request_logs` fields
- endpoint string posture
- query value posture
- secret/token/auth/cookie-like redaction posture
- error message free-text posture
- free-text length-bound posture
- provider/status/timing/cache/retry posture
- raw provider response body and raw ESI payload exclusion by schema
- smallest later hardening insertion point

Accepted current posture:

- endpoint string redaction before persistence: `unproven`
- query value stripping before persistence: `absent`
- secret/token/auth/cookie-like redaction before persistence: `unproven`
- error message free-text redaction before persistence: `unproven`
- free-text length bounds before persistence: `absent`
- provider/status/timing/cache/retry fields: `proven_present`
- raw provider response bodies: `excluded_by_schema`
- raw ESI payloads: `excluded_by_schema`

## Boundary Check

Confirmed:

- no `api_request_logs` write behavior change
- no `HttpClient` behavior change
- no provider worker behavior change
- no trace-pack writer behavior change
- no light-log writer or export creation
- no provider calls
- no Evidence/EVEidence writes
- no Discovery ref mutation
- no Hydration writes
- no Assessment Memory writes
- no Watch mutation
- no storage config or External I/O config mutation
- no schema changes
- no runtime enforcement activation
- no command blocking
- no renderer UI work

`api_request_logs` remain provider provenance / operational diagnostics, not Evidence/EVEidence, Discovery, Hydration output, Assessment Memory, Watch state, product truth, deletion authority, or pruning authority.

## Verification Re-Run

Overseer re-ran:

```powershell
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

- all npm verification commands passed
- `verify:protected-terms` passed warning-only with 268 warnings across 9 changed files
- no renames or protected-word JSON updates were performed
- `git diff --check` passed with only CRLF normalization warnings

## Resting Recommendation

HS190 gives Atlas the next real seam:

1. persisted `api_request_logs` endpoint/error sanitization before insert
2. light-log redaction/writer proof
3. readiness/preflight class-id alias normalization

The strongest next system-hardening candidate is persisted `api_request_logs` endpoint/error sanitization because HS190 proved the gap and identified the smallest insertion point.

Do not open broad log frameworks, support artifact exports, runtime enforcement activation, command blocking, provider work, or UI work from HS190 alone.
