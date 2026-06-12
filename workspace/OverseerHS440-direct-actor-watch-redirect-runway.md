# OverseerHS440 - Direct Actor Watch Redirect Runway

Status: open
Date: 2026-06-12
Executor: Dev

## Purpose

Redirect direct production `actor.watch` away from the legacy mixed collector and onto the boundary-owned actor Watch direct body proven through HS433 and HS438.

This is the first behavior-changing actor Watch replacement packet.

Scope is direct operator `actor.watch` only.

## Source Truth

Read:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS439-hs438-actor-watch-transport-failure-parity-proof-review.md`
- `workspace/DevHS438-actor-watch-transport-failure-parity-proof.md`
- `workspace/OverseerHS437-hs436-actor-watch-failure-logging-parity-review.md`
- `workspace/EngineeringTraceHS436-actor-watch-failure-logging-parity.md`
- `workspace/DevHS433-actor-watch-production-like-fake-client-direct-proof.md`
- `src/main/services/mutatingActionService.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js`
- `src/main/discovery/actorWatchTransportFailureParityProof.js`
- current boundary-owned Discovery helper modules under `src/main/discovery/`
- `src/main/api/httpClient.js`
- `src/main/api/zkillClient.js`
- `src/main/api/esiClient.js`
- `src/main/db/evidenceRepository.js`

## Required Change

Change only the direct `actor.watch` path:

```txt
serviceRegistry -> runActorWatchService(...)
```

Preserve the existing direct command envelope:

- actor input resolution
- actor Watch scope normalization
- `assertLiveAllowed('actor.watch', input, dependencies)`
- production command metadata/effects
- confirmation / External I/O / storage/write gate posture

Replace the final direct call to legacy `collectActorWatch(...)` with the boundary-owned direct body.

The redirected direct path must:

- create/use real `HttpClient` with repository, run id, signal, and timeout posture equivalent to old direct path
- use real `ZKillDiscoveryClient`
- use real `EsiClient`
- preserve API request logging through `HttpClient -> EvidenceRepository.insertApiRequestLog(...)`
- preserve fetch-run lifecycle / finalization posture
- preserve candidate-ref status movement
- preserve Evidence/EVEidence writer landing behavior
- preserve caller compatibility summary shape

## Must Not Change

Do not change:

- scheduled actor Watch runtime
- `watchExecutor.dispatchFor(...)`
- `WatchSessionExecutor.tick(...)`
- `TaskRunner`
- system/radius Watch behavior
- `collectActorWatch(...)` availability for scheduled legacy path
- service registry production `actor.watch` metadata/effects
- command authority classification
- Hydration
- Observation/report behavior
- Assessment
- schema
- dispatcher / queue / lease behavior
- runtime enforcement activation
- renderer UI
- source terms / protected-word JSON

No live provider calls in verification.

## Compatibility Constraint

The direct `actor.watch` return shape must remain compatible with the current caller-facing 22-field summary contract.

Compatibility/debug field names such as `collection_plan`, `expansion_queue`, and `zkill_refs_discovered` may remain for caller compatibility only. Do not promote them to future doctrine.

## Verification Required

Add or update a focused verifier, recommended:

```txt
npm.cmd run verify:watch-actor-direct-redirect
```

The verifier must prove:

- direct `runActorWatchService(...)` no longer calls `collectActorWatch(...)`
- scheduled actor Watch still imports/uses `collectActorWatch(...)`
- production `actor.watch` registry metadata/effects remain unchanged
- direct caller return shape retains the 22-field compatibility summary
- no live provider calls occur in tests
- no Hydration, Observation, system/radius, schema, dispatcher, runtime enforcement, UI, or source-term change
- failure/logging parity remains covered by HS438 verifier

Also run:

```txt
node --check <touched JavaScript files>
npm.cmd run verify:watch-actor-direct-redirect
npm.cmd run verify:watch-actor-transport-failure-parity
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
npm.cmd run verify:watch-actor-controlled-adapter-disabled-seam
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
git status --short --branch
```

If `verify:service-registry` times out at the default timeout, rerun with a longer timeout and report it.

## Stop Conditions

Stop and report if direct redirect requires:

- scheduled actor Watch redirect
- system/radius Watch changes
- live provider access during verification
- schema changes
- command authority/effects changes
- runtime enforcement activation
- renderer/UI changes
- Hydration writes or Observation changes
- collector retirement
- source-term or protected-word changes
- using synthetic fixture API logs as production logging parity
- changing fatal cancellation/timeout finalization semantics

## Expected Handoff

Create:

```txt
workspace/DevHS440-direct-actor-watch-redirect.md
```

The handoff must include:

- files changed
- exact redirect shape
- confirmation that only direct `actor.watch` changed
- confirmation that scheduled actor Watch remains legacy/parked
- compatibility summary proof
- failure/logging parity proof status
- verification commands and results
- limitations still remaining before scheduled actor Watch split/retirement

