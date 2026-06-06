# OverseerHS341 HS340 Watch Discovery Bus Input Review

Status: accepted
Date: 2026-06-06
Role: Overseer

## Reviewed

- `workspace/OverseerHS340-watch-task-to-discovery-bus-input-envelope-runway.md`
- `workspace/DevHS340-watch-discovery-bus-input-envelope.md`
- `src/main/services/watchDiscoveryBusInputEnvelopeService.js`
- `scripts/verify-watch-discovery-bus-input-envelope.js`
- `src/main/services/watchPacketDryRunDispatchParityService.js`
- `package.json`
- `workspace/current.md`

## Result

Accepted.

HS340 proves the next pre-live Watch seam:

```txt
Watch task envelope -> Discovery bus input envelope
```

The accepted shape keeps Discovery bus input as acquisition intent only. It is not Discovery refs and not Evidence/EVEidence.

## Accepted Behavior

- New helper: `buildWatchDiscoveryBusInputEnvelopeProof(...)`.
- New verifier: `npm.cmd run verify:watch-discovery-bus-input-envelope`.
- No renderer/product service command was added.
- The proof composes HS338 `buildWatchTaskCreationFixtureProof(...)`.
- Discovery bus input envelopes are plain data only.
- Actor Watch envelope preserves:
  - `source_lane: watch`
  - `source_kind: actor`
  - selected scope key
  - Watch ID
  - `task_type: watch.executor.actor.watch`
  - `task_classification: evidence-creating`
  - `candidate_only: true`
  - lookback/caps
  - entity type / entity ID
  - local entity name when available.
- System/radius Watch envelope preserves:
  - `source_lane: watch`
  - `source_kind: system_radius`
  - selected scope key
  - Watch ID
  - `task_type: watch.executor.system.radius.watch`
  - `task_classification: evidence-creating`
  - `candidate_only: true`
  - lookback/caps
  - stored accepted `included_system_ids`
  - `accepted_scope_source: stored_watch_scope`
  - center/radius as provenance and management only.
- Invalid stored system/radius scope emits no Discovery bus input and reports `watch_scope_authority_invalid`.
- Disarmed, active-task, live/provider-gated, no-due, inactive, not-due, and backoff states emit no Discovery bus input.
- Watch packet/dry-run/dispatch parity payload shape now includes local actor `entity_name`, preserving already-local naming without provider lookup.

## Boundary Confirmation

No Watch execution, Watch dispatch runner invocation, collector call, zKillboard call, ESI call, provider/live/API call, Discovery ref write, Evidence/EVEidence write, Hydration/metadata write, API log/warning write, real/operator Watch mutation, real runtime packet persistence, broad provider queue, schema change, renderer UI work, popup/modal behavior, R-Scanner redesign, runtime enforcement, command blocking, support artifact creation, durable Watch result identity, relationship tag, protected-word JSON update, or fourth-lane behavior was opened.

## Verification

Ran and passed:

```txt
node --check src\main\services\watchDiscoveryBusInputEnvelopeService.js
node --check scripts\verify-watch-discovery-bus-input-envelope.js
node --check src\main\services\watchPacketDryRunDispatchParityService.js
npm.cmd run verify:watch-discovery-bus-input-envelope
npm.cmd run verify:watch-task-creation-fixture-proof
npm.cmd run verify:watch-task-creation-boundary
npm.cmd run verify:watch-packet-dry-run-dispatch-parity
npm.cmd run verify:watch-executor-tick-dry-run
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
```

Notes:

- `verify:watch-discovery-bus-input-envelope` proved due actor, due system/radius, invalid stored scope, disarmed, active-task, live-gated, no-due, inactive, not-due, and backoff cases.
- Durable Atlas table counts stayed unchanged in emitted, invalid, blocked, and idle cases.
- `verify:protected-terms` exited 0 with warning-only advisory output. The warning count was inflated by scanning `workspace/current.md`; no protected-word JSON updates or source-term renames were made.
- `git diff --check` passed with CRLF normalization warnings only.

## Acceptance Meaning

HS340 proves Watch can feed a shared Discovery candidate-intake envelope without becoming Discovery refs or Evidence.

This does not authorize provider movement, Discovery ref writes, Evidence generation, real task execution, or live Watch testing.

## Resting Next Options

1. No-provider Discovery intake consumer proof: convert the bus input envelope into stubbed candidate refs without provider calls or durable ref writes.
2. Discovery ref write fixture proof: if accepted later, prove stubbed candidate refs can become durable Discovery refs with Watch provenance in disposable fixture scope only.
3. Rest Watch runtime and shape User-driven Discovery as the shorter non-repeatable path into the same Discovery bus.

Human / Overseer decision is needed before another Dev runway.
