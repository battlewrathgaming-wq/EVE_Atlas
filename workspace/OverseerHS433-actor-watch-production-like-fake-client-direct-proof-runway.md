# OverseerHS433 - Actor Watch Production-Like Fake-Client Direct Proof Runway

Status: open
Date: 2026-06-11
Executor: Dev

## Purpose

Prove that the future direct `actor.watch` replacement body can run in a production-like shape without using `collectActorWatch(...)`, while still using only fixture-owned fake clients and a disposable/fixture DB.

This packet should prove movement, not redirect production.

## Source Truth

Read:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/EngineeringTraceHS431-actor-watch-production-redirect-readiness.md`
- `workspace/OverseerHS432-hs431-actor-watch-production-redirect-readiness-review.md`
- `workspace/DevHS428-actor-watch-controlled-adapter-disabled-seam.md`
- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js`
- `src/main/discovery/actorWatchCompatibilitySummary.js`
- current Discovery helper modules under `src/main/discovery/`
- current Evidence writer repository code under `src/main/db/`

## Required Shape

Add a production-like fake-client proof for the direct actor Watch path.

The proof should exercise a function shaped like the future direct `runActorWatchService(...)` replacement body:

- actor input normalization and scope posture preserved
- live/external-I/O gate expectations represented or preserved
- fake zKill client produces candidate killmail refs
- fake ESI client expands selected candidate refs
- fixture DB receives production-like writes
- caller compatibility summary is produced from the boundary-owned path
- new boundary-owned body does not import or call `collectActorWatch(...)`

Use existing extracted boundary helpers where they fit. Do not preserve misleading ownership simply to reuse old collector structure.

## Fixture DB Mutation Allowed

Allowed only in disposable or explicitly fixture-owned storage:

- fetch-run lifecycle rows
- Discovery candidate refs / status mutations
- selected / expanded / cached / failed candidate-ref status posture
- Evidence/EVEidence writer landing for fake expanded killmail payloads
- data quality warning posture where applicable
- API request count posture where applicable

If fake clients cannot exercise the same HTTP/API logging path as production, report that limitation plainly rather than pretending parity is proven.

## Must Not Change

Do not change:

- production `actor.watch` runtime behavior
- `runActorWatchService(...)` production call target
- service registry production `actor.watch` metadata
- `watchExecutor.dispatchFor(...)`
- scheduled actor Watch behavior
- `WatchSessionExecutor.tick(...)`
- `TaskRunner`
- `collectActorWatch(...)` import/use for scheduled legacy path
- live provider behavior
- operator corpus rows
- operator Discovery refs
- operator Evidence/EVEidence
- Hydration
- Observation/report behavior
- system/radius Watch behavior
- schema
- dispatcher / queue / lease behavior
- runtime enforcement activation
- renderer UI
- source terms / protected-word JSON

No live zKill or ESI calls.

## Verification Required

Create a focused verifier, recommended:

```txt
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
```

The verifier must prove:

- no `collectActorWatch(...)` import or call in the new boundary-owned proof body
- proof uses fake clients only
- proof uses disposable/fixture DB only
- production `actor.watch` registry metadata remains unchanged
- scheduled actor Watch remains parked on the legacy collector
- caller compatibility summary field parity remains intact
- candidate refs, selected refs, expanded/cached/failed posture, fetch-run finalization, Evidence/EVEidence writer landing, warnings, and API count posture are represented where applicable
- no Hydration writes
- no Observation/UI path
- no schema, dispatcher, queue, lease, enforcement, cadence, or system/radius change

Also run:

```txt
node --check <touched JavaScript files>
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

If any broad verifier is too expensive or times out, report it and rerun only where needed with a longer timeout.

## Stop Conditions

Stop and report if the proof requires:

- production `actor.watch` redirect
- scheduled Watch redirect
- live provider access
- operator corpus mutation
- schema changes
- renderer/UI changes
- runtime enforcement changes
- using the disabled seam as production authority
- bypassing `runActorWatchService(...)` normalization or live-gate semantics
- treating compatibility summary as future Discovery receipt doctrine
- treating ESI-backed expansion as Hydration

## Expected Handoff

Create:

```txt
workspace/DevHS433-actor-watch-production-like-fake-client-direct-proof.md
```

The handoff must include:

- files changed
- proof shape
- fixture DB/write classes represented
- explicit confirmation that production `actor.watch` did not redirect
- explicit confirmation that scheduled actor Watch remains legacy/parked
- verification commands and results
- limitations or parity gaps still remaining

