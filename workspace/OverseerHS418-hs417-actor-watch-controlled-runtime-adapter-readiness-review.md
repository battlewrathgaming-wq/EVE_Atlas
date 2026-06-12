# Overseer HS418 - HS417 Actor Watch Controlled Runtime Adapter Readiness Review

Status: accepted
Date: 2026-06-08
Role: Overseer

## Reviewed

- `workspace/OverseerHS417-actor-watch-controlled-runtime-adapter-readiness-request.md`
- `workspace/EngineeringTraceHS417-actor-watch-controlled-runtime-adapter-readiness.md`
- `src/main/workers/actorWatchCollector.js`
- `src/main/services/mutatingActionService.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js`
- `src/main/services/watchActorDiscoveryRouteBodyFixtureService.js`
- `src/main/db/evidenceRepository.js`

## Decision

HS417 is accepted.

Atlas is not ready for default `actor.watch` redirect, scheduled Watch redirect, or `collectActorWatch(...)` retirement.

Atlas is ready for a narrower Dev seam:

```txt
actor Watch controlled runtime adapter fixture proof
```

This should prove the missing mutation choreography in a disposable DB with injected fake provider clients, while leaving production runtime untouched.

## Accepted Finding

HS415 proved route-body composition, not runtime replacement.

The missing runtime-adapter evidence is:

- `fetch_runs` create/finalize lifecycle
- real repository pending-ref drain
- candidate-ref persistence through `upsertDiscoveredKillmailRefs(...)`
- candidate-ref selected / expanded / cached / failed status mutation
- Evidence/EVEidence writer landing through `persistEvidencePackage(...)`
- warning persistence or explicit exclusion
- failure finalization behavior
- old caller-facing compatibility summary from a mutation-capable proof

## Source Sanity Check

Confirmed current `collectActorWatch(...)` owns mutation choreography in `src/main/workers/actorWatchCollector.js`:

- `createFetchRun(...)`
- `pendingDiscoveryRefs(...)`
- `upsertDiscoveredKillmailRefs(...)`
- `markDiscoveryRefsSelected(...)`
- `markDiscoveryRefsFailed(...)`
- `persistEvidencePackage(...)`
- `markDiscoveryRefsExpanded(...)`
- `markDiscoveryRefsCached(...)`
- `insertWarning(...)`
- `finalizeFetchRun(...)`
- API count readback

Confirmed current direct runtime path:

```txt
runActorWatchService(...)
-> resolveActorInput(...)
-> normalizeActorWatchScope(...)
-> assertLiveAllowed('actor.watch', ...)
-> collectActorWatch(...)
```

Confirmed current scheduled runtime path:

```txt
watchExecutor.dispatchFor(actor)
-> command: actor.watch
-> runner: collectActorWatch
```

Confirmed HS415 route-body proof composes Discovery helpers but does not write `fetch_runs`, `api_request_logs`, Discovery refs, Evidence/EVEidence, Hydration, or Watch cadence state.

## Accepted Next Seam

Open Dev runway:

```txt
workspace/OverseerHS419-actor-watch-controlled-runtime-adapter-fixture-proof-runway.md
```

Expected handoff:

```txt
workspace/DevHS419-actor-watch-controlled-runtime-adapter-fixture-proof.md
```

## Parked

Still parked:

- default `actor.watch` redirect
- `runActorWatchService(...)` replacement
- scheduled `watchExecutor.dispatchFor(...)` replacement
- scheduled Watch cadence mutation from the new path
- `collectActorWatch(...)` retirement
- live zKill calls
- live ESI calls
- operator DB Discovery ref writes through the new adapter
- operator DB Evidence/EVEidence writes through the new adapter
- Hydration metadata writes
- durable Discovery task/packet schema
- dispatcher / queue / lease / sequencer behavior
- system/radius Watch replacement
- renderer UI
- runtime enforcement / command blocking changes
- support artifacts
- source-term rename
- protected-word JSON updates
