# Overseer HS192 - API Request Log Persistence Sanitization Runway

Status: active Dev runway
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS192-api-request-log-persistence-sanitization.md`

## Purpose

Apply the HS190 readiness finding to the smallest useful implementation seam: sanitize persisted `api_request_logs.endpoint` and `api_request_logs.error_message` before insert.

HS188 hardened trace-pack assembly. HS190 proved persisted API logs still lack endpoint query-value stripping, secret-like text redaction, and error-message length bounds before persistence. This packet should harden the persisted log row itself without changing provider execution, schema, reports, trace-pack writer behavior, or creating any light-log export.

## Read First

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `workspace/OverseerHS190-api-request-log-redaction-readiness-runway.md`
- `workspace/OverseerHS191-hs190-api-request-log-redaction-readiness-review.md`
- `workspace/DevHS190-api-request-log-redaction-readiness.md`
- `src/main/db/evidenceRepository.js`
- `src/main/api/httpClient.js`
- `src/main/services/apiRequestLogRedactionReadinessService.js`
- `src/main/services/traceLogRedactionPolicyService.js`
- relevant API log, HTTP, Hydration, report, and queue/Evidence verification scripts

## Task

Add bounded persistence sanitization for `api_request_logs` rows.

Preferred smallest insertion point:

```txt
EvidenceRepository.insertApiRequestLog(log)
```

Sanitize only the values persisted into:

- `endpoint`
- `error_message`

Keep provider execution and caller behavior unchanged.

## Required Behavior

Endpoint persistence should:

- preserve useful route shape for diagnostics and report parsing
- strip or redact query values
- preserve query key presence/count where useful
- redact secret/token/auth/cookie-like values if they appear in path or query text
- bound persisted endpoint length
- avoid storing raw provider response bodies
- avoid storing raw ESI payloads

Error-message persistence should:

- redact secret/token/auth/cookie-like values
- redact URL query values inside error text
- bound persisted free-text length
- preserve enough provider/status/route context to diagnose failures
- avoid storing raw provider response bodies
- avoid storing raw ESI payloads

Update the HS190 readiness readout so it truthfully reports the new persistence posture:

- endpoint string persistence sanitization is now proven for `EvidenceRepository.insertApiRequestLog`
- query value stripping before persistence is now proven for persisted endpoint/error text
- secret/token/auth/cookie-like redaction before persistence is now proven for tested endpoint/error patterns
- error-message free-text length bounds before persistence are now proven
- raw provider bodies/raw ESI payloads remain excluded by schema
- trace-pack assembly redaction remains separate from persisted log redaction

## Boundaries And Non-Goals

- Do not change provider request URLs before network calls.
- Do not change `HttpClient.json` fetch behavior, retry behavior, provider response handling, or provider worker behavior.
- Do not change schema.
- Do not change reports except if tests need to account for sanitized endpoint route shape.
- Do not change trace-pack writer behavior.
- Do not create a light operational log writer/export.
- Do not add support artifact classes or commands that write files.
- Do not call providers.
- Do not mutate Evidence/EVEidence, Discovery refs, Hydration labels/candidates, Assessment Memory, Watch state, storage config, External I/O config, or runtime enforcement state.
- Do not activate runtime enforcement.
- Do not add command blocking.
- Do not change renderer UI.
- Do not sanitize raw ESI killmail payloads or treat this as Evidence/EVEidence transformation.

## Stop Conditions

Stop and return to Overseer if:

- hardening requires schema changes
- route shape cannot be preserved without breaking existing report/readout parsing
- implementation would alter provider request behavior before the call is made
- implementation requires broad logging framework work
- implementation requires light-log export creation
- implementation requires provider calls, live/private/destructive actions, runtime enforcement, command blocking, or UI work
- sanitization would blur `api_request_logs` into Evidence/EVEidence, Discovery, Hydration output, Assessment Memory, Watch state, product truth, deletion authority, or pruning authority

## Verification Expectations

Run syntax checks on every changed JavaScript file.

Expected verification:

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

If useful, add or update a focused verifier proving:

- endpoint query values are not persisted
- secret-like endpoint/error values are redacted before persistence
- persisted endpoint/error strings are bounded
- route shape remains diagnosable
- provider call URL passed to fetch is unchanged
- raw provider bodies/raw ESI payloads are not persisted in `api_request_logs`

## Expected Handoff

Create:

```txt
workspace/DevHS192-api-request-log-persistence-sanitization.md
```

Include:

- files changed
- sanitization helper location
- exact endpoint/error redaction rules
- sample sanitized output
- whether HS190 readiness posture changed and how
- verification commands and results
- protected-term warning count
- confirmation that provider behavior, schema, trace-pack writer behavior, light-log export behavior, runtime enforcement, command blocking, support artifact creation, Evidence/EVEidence, Discovery, Hydration, Assessment Memory, Watch, storage config, External I/O config, and UI were not changed
