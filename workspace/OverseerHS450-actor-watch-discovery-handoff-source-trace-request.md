# OverseerHS450 - Actor Watch / Discovery Handoff Source Trace Request

Status: open
Date: 2026-06-12
Executor: Engineering / Source Trace
Expected artifact: `workspace/EngineeringTraceHS450-actor-watch-discovery-handoff-boundary.md`

## Purpose

Trace how actor Watch currently communicates with the Discovery-owned actor route after HS449.

The goal is not to trim Watch yet. The goal is to determine whether the two boundaries have a clear request/receipt handshake:

```txt
Watch intent/cadence/scope -> Discovery acquisition/expansion route -> caller-compatible receipt/result
```

## Accepted Boundary Model

Use this as the model to test, not as something to rubber-stamp:

- Watch owns intent, cadence, accepted actor target, task emission, and receipt consumption.
- Discovery owns provider-facing acquisition and ESI-backed selected-ref expansion.
- Evidence/EVEidence begins only when expanded ESI killmails land in memory.
- Hydration remains readability repair, not ESI killmail expansion.
- Observation remains local report/story shaping, not acquisition.
- Assessment remains human judgment, not proof.

## Questions To Answer

1. What exact input shape does actor Watch currently hand into the boundary-owned route?
2. Which fields are Watch-owned intent/cadence/scope fields?
3. Which fields become Discovery-owned acquisition or expansion fields?
4. Does `runActorWatchDirectBody(...)` currently behave as a clear Discovery intake body, or is it still mainly a compatibility wrapper around mixed legacy semantics?
5. What receipt/result shape comes back to direct actor Watch callers?
6. What receipt/result shape comes back to scheduled actor Watch through `runScheduledActorWatch(...)` / `WatchSessionExecutor`?
7. Does the current 22-field compatibility summary hide or expose the boundary between Watch-owned request and Discovery-owned work?
8. What is the smallest stable handoff contract we can name without creating schema or runtime changes?
9. What remaining compatibility terms should be treated as temporary rather than doctrine?
10. What would be the safest next proof after this trace: fixture proof, runtime adapter adjustment, caller contract update, or collector-retirement trace?

## Files To Inspect

Start from:

```txt
src/main/discovery/actorWatchDirectBody.js
src/main/watchlist/watchExecutor.js
src/main/services/mutatingActionService.js
src/main/workers/actorWatchCollector.js
src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js
scripts/verify-watch-actor-scheduled-redirect.js
scripts/verify-watch-actor-direct-redirect.js
scripts/verify-watch-actor-controlled-adapter-return-path.js
scripts/verify-watch-actor-production-like-fake-client-direct-proof.js
workspace/OverseerHS449-hs448-production-like-fake-client-verifier-correction-review.md
```

Use other nearby files only if needed to answer the trace.

## Boundaries

Do not implement code.

Do not create a Dev runway.

Do not run live/provider calls.

Do not change schema, Watch runtime, Discovery runtime, Evidence/EVEidence writes, Hydration, Observation, Assessment, dispatcher/queue/lease/enforcement, renderer UI, source terms, or protected-word JSON.

Do not propose retiring `collectActorWatch(...)` unless the trace clearly separates it as a later decision.

## Expected Output

Create:

```txt
workspace/EngineeringTraceHS450-actor-watch-discovery-handoff-boundary.md
```

Include:

- request answered
- source files inspected
- current handoff path
- Watch-owned fields/responsibilities
- Discovery-owned fields/responsibilities
- direct caller return path
- scheduled caller return path
- compatibility terms that should remain temporary
- boundary risks
- smallest stable handoff contract candidate
- recommended next seam
- verification/evidence used
- parked items
