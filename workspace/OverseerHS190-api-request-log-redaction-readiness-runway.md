# Overseer HS190 - API Request Log Redaction Readiness Runway

Status: active Dev runway
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS190-api-request-log-redaction-readiness.md`

## Purpose

Prove the current persistence posture for `api_request_logs` endpoint and error text before Atlas changes log persistence or creates any light-log export writer.

HS188 hardened the trace-pack assembly layer. It did not harden persisted API logs or future light operational log exports. The next useful seam is to inspect and prove where endpoint/error strings enter `api_request_logs`, what redaction already exists or does not exist, and what the smallest later hardening point should be.

This packet is read-only proof / readiness mapping. Do not change persistence behavior yet.

## Read First

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `workspace/OverseerHS189-hs188-trace-pack-writer-hardening-review.md`
- `workspace/DevHS188-trace-pack-writer-redaction-hardening.md`
- `src/main/services/traceLogRedactionPolicyService.js`
- `src/main/services/supportArtifactWriterConformanceGapMapService.js`
- `src/main/db/evidenceRepository.js`
- `src/main/api/httpClient.js`
- provider workers/services that call or write `api_request_logs`
- relevant verification scripts for HTTP boundaries, partial failures, queue/API/Evidence writes, Hydration, and reports

## Task

Add a read-only API request log redaction readiness proof, preferably:

```txt
support.api_request_log_redaction_readiness.preview
```

The preview should map current `api_request_logs` persistence posture against the HS186 trace/log policy without changing logging behavior.

## Required Coverage

Cover at minimum:

- source files / functions that write `api_request_logs`
- current persisted fields
- endpoint string posture
- query value posture
- error message posture
- provider/status/timing/cache/retry posture
- whether response bodies/raw ESI payloads are persisted
- whether secret/token/auth/cookie-like string redaction is currently proven, unproven, partial, or absent
- whether free-text length bounds are currently proven, unproven, partial, or absent
- which later insertion point would be smallest if hardening is accepted
- whether this affects trace packs, reports, Hydration, Evidence/EVEidence, Discovery, or provider execution

The readout should explicitly state:

- persisted `api_request_logs` are provider provenance / operational diagnostics, not Evidence/EVEidence
- raw provider response bodies must not be persisted as logs
- this preview does not mutate existing logs
- this preview does not create a light-log writer/export
- trace-pack assembly redaction remains separate from persisted log redaction

## Boundaries And Non-Goals

- Do not change `api_request_logs` write behavior.
- Do not change `httpClient` behavior.
- Do not change provider workers.
- Do not change trace-pack writer behavior.
- Do not create a light operational log writer/export.
- Do not add support artifact classes or commands that write files.
- Do not call providers.
- Do not mutate Evidence/EVEidence, Discovery refs, Hydration labels/candidates, Assessment Memory, Watch state, storage config, External I/O config, or schema.
- Do not activate runtime enforcement.
- Do not add command blocking.
- Do not change renderer UI.

## Stop Conditions

Stop and return to Overseer if:

- proof requires live provider calls or inspecting real operator data
- proof requires changing API request logging behavior
- proof requires schema changes
- proof becomes a broad logging framework or export writer
- raw provider/ESI payload persistence is discovered and cannot be safely classified without Human/Overseer review
- runtime enforcement, command blocking, destructive actions, or UI work become necessary

## Verification Expectations

Run syntax checks on changed JavaScript files.

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

If a listed verifier is unavailable or named differently, report the exact alternative used.

## Expected Handoff

Create:

```txt
workspace/DevHS190-api-request-log-redaction-readiness.md
```

Include:

- files changed
- command/readout added, if any
- mapped log write sources
- current redaction/truncation posture
- whether raw response bodies/raw ESI payloads are persisted
- recommended smallest later hardening insertion point
- whether conformance map statuses changed or remain unknown/partial
- verification commands and results
- protected-term warning count
- confirmation that no log write behavior, provider calls, schema changes, runtime enforcement, command blocking, support artifact export, or UI work were performed
