# OverseerHS456 - collectActorWatch Remaining Caller / Retirement-Readiness Trace Request

Status: open
Date: 2026-06-12
Executor: Engineering / Source Trace
Expected artifact: `workspace/EngineeringTraceHS456-collect-actor-watch-remaining-caller-retirement-readiness.md`

## Purpose

Trace remaining `collectActorWatch(...)` callers and compatibility expectations after HS453/HS455.

This is not a retirement packet. It is a source trace to decide whether `collectActorWatch(...)` is now only legacy/compatibility surface, or whether any active path still depends on it.

## Accepted Context

Accepted state:

- direct actor Watch routes through `runActorWatchDirectBody(...)`
- scheduled actor Watch routes through `runScheduledActorWatch(...)`, which delegates to `runActorWatchDirectBody(...)`
- HS452 projects actor Watch handoff as `actor_watch_discovery_request` / `actor_watch_discovery_receipt`
- HS454 accepts that shape as actor-Watch-specific, not generic Discovery doctrine
- `compatibility_summary` remains temporary/debug only

Boundary model:

- Watch owns intent, cadence, accepted actor target, task emission, and receipt consumption
- Discovery owns provider-facing acquisition, candidate refs, selected-ref ESI-backed expansion, and factual receipt basis
- Discovery should be capture-rich internally; caller-specific performance/readability is protected by bounded projections, not by making Discovery sparse
- Evidence/EVEidence begins when expanded ESI killmail data lands locally
- Hydration is readability repair
- Observation is local report/story shaping
- Assessment is human judgment

Projection model:

- Discovery canonical/internal receipt basis may include provider route, candidate refs, pending refs, selection posture, expansion posture, warnings, provenance, API posture, and Evidence/EVEidence landing basis.
- Watch should consume a lean projection: handled/not handled, cadence outcome, caps, warnings, and next-safe posture.
- Future Manual / Live / Marked / Assessment callers may consume different projections without redefining Discovery ownership.

Reporting model:

- Discovery should not report every internal step to the caller.
- Discovery should report when emitted work reaches a settled posture.
- Settled posture includes refs found/landed, no refs found, capped, provider deferred, failed retryable, failed terminal, held by external I/O, or partially handled with recoverable gaps.
- "Report-worthy" does not mean success only; it means the caller can safely stop waiting on that emitted work item and make its own decision.
- Provider timing facts may cross the boundary, such as retry-after or next provider eligible time, but Watch scheduling decisions do not.
- Discovery recovery gaps remain Discovery work, not Watch work.

## Questions To Answer

1. Where is `collectActorWatch(...)` still imported or called?
2. Are any remaining callers active runtime paths, scripts, tests, fixture proofs, or historical compatibility checks?
3. Does `scripts/live-actor-watch-runner.js` still depend on `collectActorWatch(...)`, and if so, is that runner current, parked, obsolete, or needing replacement?
4. Do any verifier assertions still require `collectActorWatch(...)` to remain available?
5. Does any service command still expose old `collectActorWatch(...)` behavior?
6. Are there hidden dependencies on the old 22-field compatibility summary that would block collector retirement?
7. Does any remaining caller expect Discovery to be sparse or caller-specific instead of capture-rich with bounded projections?
8. Does any remaining caller depend on internal step-by-step reporting instead of settled-posture receipts?
9. What functionality would be lost if `collectActorWatch(...)` were retired today?
10. Which pieces of `collectActorWatch(...)` are already replaced by Discovery-owned helpers/body?
11. Which pieces, if any, still need extraction or replacement?
12. What is the smallest safe next action after the trace: no-op, update stale proofs, retire a script, write a replacement proof, or defer?

## Files To Inspect

Start with source search:

```txt
collectActorWatch
actorWatchCollector
live-actor-watch-runner
watch.actor
runActorWatchDirectBody
runScheduledActorWatch
compatibility_summary
```

Likely files:

```txt
src/main/workers/actorWatchCollector.js
src/main/discovery/actorWatchDirectBody.js
src/main/watchlist/watchExecutor.js
src/main/services/mutatingActionService.js
scripts/live-actor-watch-runner.js
scripts/verify-watch-actor-*.js
workspace/OverseerHS453-hs452-actor-watch-discovery-handoff-contract-review.md
workspace/PacketShapeHS454-actor-watch-discovery-request-receipt-acceptance.md
workspace/OverseerHS455-hs454-packet-shape-acceptance-review.md
```

Use nearby files only as needed.

## Boundaries

Do not implement code.

Do not create a Dev runway.

Do not retire `collectActorWatch(...)`.

Do not run live/provider calls.

Do not change runtime behavior, service commands, schema, Watch executor, Discovery runtime, Evidence/EVEidence writes, Hydration, Observation, Assessment, dispatcher/queue/lease/enforcement, renderer UI, source terms, or protected-word JSON.

Do not generalize actor Watch readiness to system/radius Watch.

## Expected Output

Create:

```txt
workspace/EngineeringTraceHS456-collect-actor-watch-remaining-caller-retirement-readiness.md
```

Include:

- request answered
- source files inspected
- complete caller/import map for `collectActorWatch(...)`
- classification of each caller: active runtime / script / verifier / fixture / stale / parked
- functionality still unique to `collectActorWatch(...)`
- functionality already replaced by Discovery-owned route/body/helpers
- compatibility summary dependency assessment
- capture-rich Discovery basis versus caller projection assessment
- settled-posture reporting assessment
- retirement blockers
- safe next action recommendation
- verification/evidence used
- parked items
