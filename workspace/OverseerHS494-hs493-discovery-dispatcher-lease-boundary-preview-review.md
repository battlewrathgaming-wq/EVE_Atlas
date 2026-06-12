# OverseerHS494 - HS493 Discovery Dispatcher Lease Boundary Preview Review

Status: accepted
Date: 2026-06-12
Role: Overseer

Reviewed handoff:

```txt
workspace/DevHS493-discovery-dispatcher-lease-boundary-preview.md
```

Runway:

```txt
workspace/OverseerHS493-discovery-dispatcher-lease-boundary-preview-runway.md
```

## Review Result

HS493 is accepted.

Atlas can now classify accepted HS491 pickup execution boundary packets as future dispatcher/lease candidates without creating dispatcher runtime, durable queues, durable leases, lease claims, provider movement, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch mutation, schema, enforcement, or UI.

Boundary held:

- HS491 boundary packets remain the basis
- one accepted included system ID remains one not-leased lease candidate when External I/O is on
- Watch/run/bucket/scope/window/cap/provenance/source-selection basis is preserved
- every lease candidate is explicitly not leased, not executable now, not dispatchable now, and has no lease row or claim
- future lease facts are named without persisting them: identity basis, owner requirement, expiry requirement, retry/provider eligibility basis, provider pacing basis, and expired/abandoned lease recovery basis
- External I/O closed remains a hold before lease candidacy
- held-by-External-I/O rows do not enter lease candidacy
- malformed/rejected/not-input rows do not enter lease candidacy
- renderer-supplied boundary previews are not authoritative
- no dispatcher runtime, queue item, durable queue row, lease row, lease claim, provider call, zKill call, ESI call, executable provider packet, candidate ref, Discovery ref, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema change, enforcement, or UI behavior occurs

## Verification

Passed:

```txt
node --check src\main\services\discoveryDispatcherLeaseBoundaryPreviewService.js
node --check scripts\verify-discovery-dispatcher-lease-boundary-preview.js
npm.cmd run verify:discovery-dispatcher-lease-boundary-preview
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:service-registry
npm.cmd run verify:enforcement-dry-run
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

Evidence:

- focused verifier produced `source_pickup_execution_boundary_packet_count: 5`
- focused verifier produced `lease_candidate_count: 5`
- all five lease candidates were `not_leased`
- all five lease candidates exposed future owner, expiry, retry/provider eligibility, provider pacing, and expired-lease recovery basis
- External I/O off produced zero lease candidates and three held exclusions
- focused verifier showed zero provider calls, zKill calls, ESI calls, executable provider packets, dispatcher runtime, queue items, leases, lease claims, candidate refs, Discovery refs, Evidence/EVEidence writes, Hydration writes, Observation creation, Watch cadence mutation, bucket status mutation, receipt mutation, and schema changes
- service registry passed
- command authority passed
- passive side-effect sweep passed
- enforcement dry-run passed with 128/128 commands covered and no gaps
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git diff -- src\main\db\schema.sql` returned no diff

## Accepted State

HS493 proves the dispatcher/lease boundary as a read-only preview only.

It does not open live provider movement, real Discovery pickup execution, dispatcher runtime, durable queues, durable leases, lease claims, candidate-ref persistence, Discovery-ref persistence, Evidence/EVEidence writes, Watch cadence completion, receipt persistence, UI, actor Watch migration, or collector retirement.

## Recommended Landing

Rest at the boundary before the next seam.

Likely next choices, when motion resumes:

- candidate-ref landing proof
- receipt/status boundary proof
- cleanup / commit-push readiness pass

Do not open live zKill/ESI movement until candidate-ref landing, receipt/status handling, and provider execution policy are explicit.
