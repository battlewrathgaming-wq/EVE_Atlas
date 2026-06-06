# OverseerHS343 HS342 Discovery Stub Candidates Review

Status: accepted
Date: 2026-06-06
Role: Overseer

## Reviewed

- `workspace/OverseerHS342-discovery-intake-consumer-stub-candidate-proof-runway.md`
- `workspace/DevHS342-discovery-intake-consumer-stub-candidates.md`
- `src/main/services/discoveryIntakeConsumerStubCandidateService.js`
- `scripts/verify-discovery-intake-consumer-stub-candidates.js`
- `package.json`
- `workspace/current.md`

## Result

Accepted.

HS342 proves the next pre-live Discovery seam:

```txt
Discovery bus input -> stub candidate refs
```

The accepted shape keeps stub candidate refs as pre-persistence plain data. They are not durable Discovery refs and not Evidence/EVEidence.

## Accepted Behavior

- New helper: `buildDiscoveryIntakeConsumerStubCandidateProof(...)`.
- New verifier: `npm.cmd run verify:discovery-intake-consumer-stub-candidates`.
- No renderer/product service command was added.
- The proof composes HS340 `buildWatchDiscoveryBusInputEnvelopeProof(...)`.
- Stub candidates use deterministic local provider marker `zkill_stub`.
- Actor stub candidates preserve:
  - `source_lane: watch`
  - `source_kind: actor`
  - selected scope key
  - Watch ID
  - stub `killmail_id`
  - stub `killmail_hash`
  - lookback/caps
  - candidate-only posture
  - local actor context including entity name when available.
- System/radius stub candidates preserve:
  - `source_lane: watch`
  - `source_kind: system_radius`
  - selected scope key
  - Watch ID
  - stub `killmail_id`
  - stub `killmail_hash`
  - stored accepted `included_system_ids`
  - `candidate_system_id` selected from accepted stored system IDs
  - `accepted_scope_source: stored_watch_scope`
  - center/radius as provenance and management only.
- Invalid stored system/radius scope emits no stub candidates and reports `watch_scope_authority_invalid`.
- Disarmed, active-task, live/provider-gated, no-due, inactive, not-due, and backoff states emit no stub candidates.

## Boundary Confirmation

No durable Discovery refs, `discovered_killmail_refs` writes, Evidence/EVEidence writes, Hydration/metadata writes, API log/warning writes, Watch execution, Watch dispatch runner invocation, collector call, zKillboard call, ESI call, provider/live/API call, real/operator Watch mutation, real runtime packet persistence, broad provider queue, schema change, renderer UI work, popup/modal behavior, R-Scanner redesign, runtime enforcement, command blocking, support artifact creation, durable Watch result identity, relationship tag, protected-word JSON update, or fourth-lane behavior was opened.

## Verification

Ran and passed:

```txt
node --check src\main\services\discoveryIntakeConsumerStubCandidateService.js
node --check scripts\verify-discovery-intake-consumer-stub-candidates.js
npm.cmd run verify:discovery-intake-consumer-stub-candidates
npm.cmd run verify:watch-discovery-bus-input-envelope
npm.cmd run verify:watch-task-creation-fixture-proof
npm.cmd run verify:watch-task-creation-boundary
npm.cmd run verify:watch-packet-dry-run-dispatch-parity
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
```

Notes:

- `verify:discovery-intake-consumer-stub-candidates` proved due actor, due system/radius, invalid stored scope, disarmed, active-task, live-gated, no-due, inactive, not-due, and backoff cases.
- Durable Atlas table counts stayed unchanged in emitted, invalid, blocked, and idle cases.
- `verify:protected-terms` exited 0 with warning-only advisory output. The warning count was inflated by scanning `workspace/current.md`; no protected-word JSON updates or source-term renames were made.
- `git diff --check` passed with CRLF normalization warnings only.

## Acceptance Meaning

HS342 proves that shared Discovery intake can produce stub candidate refs from Watch bus input while staying before provider movement and before durable Discovery ref persistence.

This does not authorize live provider movement, durable Discovery ref writes, Evidence generation, real task execution, or live Watch testing.

## Resting Next Options

1. Fixture-only Discovery ref write proof: prove stub candidates can become durable Discovery refs with Watch provenance in disposable fixture scope only.
2. Pre-write Discovery ref contract/advisory: review exact fields, uniqueness, provenance, and source-lane semantics before writing any `discovered_killmail_refs`, even in fixture.
3. Rest Watch runtime and shape User-driven Discovery as the shorter non-repeatable path into the same Discovery bus.

Human / Overseer decision is needed before another Dev runway.
