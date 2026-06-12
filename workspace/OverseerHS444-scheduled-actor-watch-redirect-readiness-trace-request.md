# OverseerHS444 - Scheduled Actor Watch Redirect Readiness Trace Request

Status: open
Date: 2026-06-12
Role requested: Engineering / source trace
Expected artifact: `workspace/EngineeringTraceHS444-scheduled-actor-watch-redirect-readiness.md`

## Purpose

Trace whether scheduled actor Watch is ready for a future redirect now that direct production `actor.watch` has moved to the boundary-owned direct body.

Do not implement code.

This is a source-trace advisory request only.

## Accepted Context

Direct actor Watch now routes:

```txt
serviceRegistry -> runActorWatchService(...) -> runActorWatchDirectBody(...)
```

Scheduled actor Watch still routes:

```txt
watchExecutor.dispatchFor(actor) -> runner: collectActorWatch
```

Accepted boundary:

- Watch owns cadence, accepted intent, and scheduling posture.
- Discovery owns provider-facing acquisition and selected-ref ESI-backed expansion.
- Evidence/EVEidence is final landed ESI-expanded killmail memory.
- Scheduled Watch should not revive mixed collector ownership under a new name.

## Read

Start from project root.

Read:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS441-hs440-direct-actor-watch-redirect-review.md`
- `workspace/OverseerHS443-hs442-post-redirect-return-path-verifier-correction-review.md`
- `workspace/DevHS440-direct-actor-watch-redirect.md`
- `workspace/DevHS442-post-redirect-return-path-verifier-correction.md`
- `src/main/services/mutatingActionService.js`
- `src/main/discovery/actorWatchDirectBody.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/watchlist/taskRunner.js`, if present
- `src/main/watchlist/watchScheduler.js`, if relevant
- `src/main/discovery/actorWatchCompatibilitySummary.js`
- relevant verifier scripts for actor Watch direct redirect, transport parity, and controlled adapter return path

## Questions To Answer

1. What is the current scheduled actor Watch execution path from due Watch selection to collector invocation to result recording?
2. What caller/result shape does scheduled actor Watch require?
3. What task/cadence/fetch-run/status behavior does scheduled actor Watch get today from the legacy collector path?
4. Can scheduled actor Watch reuse `runActorWatchDirectBody(...)` safely, or does it need a scheduled wrapper/body around the boundary-owned actor Watch route?
5. What dependencies are available in scheduled execution that differ from direct `actor.watch` service execution?
6. What would break if `watchExecutor.dispatchFor(actor)` simply changed `runner: collectActorWatch` to the new direct body?
7. What compatibility summary fields must remain stable for scheduled callers?
8. What logging/warning/finalization behavior must be preserved?
9. What should remain parked before scheduled redirect?
10. What is the smallest safe next Dev packet, if any?

## Boundary

Do not propose or perform:

- runtime redirect
- collector retirement
- system/radius Watch movement
- live/provider calls
- schema change
- durable Discovery task/packet persistence
- dispatcher/queue/lease work
- Hydration, Observation, Assessment, or UI work
- runtime enforcement or command blocking
- source-term rename
- protected-word JSON update

## Expected Output

Create:

```txt
workspace/EngineeringTraceHS444-scheduled-actor-watch-redirect-readiness.md
```

Include:

1. Executive finding.
2. Current scheduled actor Watch path.
3. Direct path versus scheduled path differences.
4. Caller/result shape requirements.
5. Dependency and lifecycle requirements.
6. Compatibility fields and logging/finalization requirements.
7. Risks if scheduled redirect is attempted too directly.
8. Recommended next Dev packet or reason to defer.
9. Verification evidence expected for that next packet.
10. Parked items.

Keep recommendations practical. Prefer the smallest boundary-safe next packet.
