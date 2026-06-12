# OverseerHS459 - Stale Actor Watch Compatibility Readout Correction Runway

Status: open  
Date: 2026-06-12  
Executor: Dev  
Expected handoff: `workspace/DevHS459-stale-actor-watch-compatibility-readout-correction.md`

## Purpose

Correct stale actor Watch compatibility readouts and verifier assertions that still claim direct or scheduled actor Watch currently runs through `collectActorWatch(...)`.

This is a cleanup/correction packet, not collector retirement.

## Context

Accepted state:

- HS440 redirected direct production `actor.watch` through `runActorWatchDirectBody(...)`.
- HS446 redirected scheduled actor Watch through `runScheduledActorWatch(...) -> runActorWatchDirectBody(...)`.
- HS456 found `collectActorWatch(...)` is no longer the active direct/scheduled actor Watch runtime path, but is not retirement-ready.
- HS458 accepted HS456 and identified stale compatibility readouts/assertions as the next safest seam.

Clarified primitive:

```txt
Watch scheduled work bucket
-> Discovery repeatable handling/recovery
-> settled factual receipt
-> Watch bucket/cadence interpretation
```

Discovery returns factual handling/receipt posture. Watch interprets cadence from Watch state.

## Scope

Update stale compatibility/readout surfaces so they describe current runtime truth:

- direct actor Watch: `runActorWatchService(...) -> runActorWatchDirectBody(...)`
- scheduled actor Watch: `watchExecutor.dispatchFor(actor) -> runScheduledActorWatch(...) -> runActorWatchDirectBody(...)`
- `collectActorWatch(...)`: legacy/compatibility/retirement candidate, still available for now, not current direct/scheduled actor Watch runtime

Likely files to inspect:

```txt
src/main/services/watchActorCompatibilityWrapperRuntimePreviewService.js
scripts/verify-watch-actor-compatibility-wrapper-runtime-preview.js
scripts/verify-service-registry.js
src/main/services/watchActorCompatibilityWrapperContractService.js
scripts/verify-watch-actor-compatibility-wrapper-contract.js
```

Only update contract surfaces if they contain the same stale "current runtime" claim and can be corrected without widening the packet.

## Boundaries

Do not:

- retire or delete `collectActorWatch(...)`
- change provider behavior
- run live/provider calls
- change Watch cadence, scheduling, backoff, or bucket behavior
- give Discovery authority over Watch cadence/completion decisions
- change Discovery handling/recovery behavior
- mutate Evidence/EVEidence behavior
- change Hydration, Observation, Assessment, storage, schema, dispatcher, queue, lease, enforcement, UI, or protected terminology
- migrate broad verifier seed paths in this packet
- replace `scripts/live-actor-watch-runner.js` in this packet

## Acceptance Criteria

- stale readouts no longer claim `runActorWatchService(...)` still calls `collectActorWatch(...)`.
- stale readouts no longer claim scheduled actor Watch currently uses `collectActorWatch(...)` as runner.
- readouts clearly state that `collectActorWatch(...)` remains available/parked as legacy compatibility and retirement candidate.
- assertions match current runtime truth.
- compatibility summary remains temporary/debug, not future durable Discovery contract.
- no runtime provider movement or collector retirement is introduced.

## Verification

Required:

```txt
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:service-registry
```

If contract surfaces are touched:

```txt
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
```

Report any verifier that remains stale but is intentionally deferred.

