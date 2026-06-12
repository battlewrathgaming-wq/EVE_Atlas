# OverseerHS421 - Actor Watch Compatibility Summary / Caller Return Path Source Trace Request

Status: advisory/source-trace request
Date: 2026-06-11
Executor: Engineering / source trace

## Purpose

Determine whether production actor Watch replacement can return the expected caller-facing compatibility shape through the boundary-owned model without reviving mixed collector ownership.

HS419 proved actor Watch controlled runtime adapter mutation choreography in disposable DBs with fake providers. The next safest seam is not runtime redirect. It is a source trace of the caller return path and compatibility summary expectations.

## Current Source Truth

Read first:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS420-hs419-actor-watch-controlled-runtime-adapter-fixture-review.md`
- `workspace/DevHS419-actor-watch-controlled-runtime-adapter-fixture-proof.md`

Then trace only the source files needed to answer the request.

Likely source areas:

- `src/main/services/mutatingActionService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js`
- `src/main/services/watchActorControlledRuntimeAdapterFixtureService.js`
- `src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js`
- `src/main/services/watchActorCompatibilityWrapperRuntimePreviewService.js`
- `src/main/services/watchActorCompatibilityWrapperAdapterFixtureService.js`
- `src/main/services/watchActorCompatibilityWrapperContractService.js`
- related verifiers under `scripts/verify-watch-actor-*`

## Questions To Answer

1. What caller-facing result shape does production `actor.watch` currently return?
2. Which code paths consume or depend on that shape?
3. Which parts of the current shape are actual product/runtime contract versus incidental mixed collector output?
4. What compatibility summary fields are already proven by HS395, HS383, HS415, and HS419?
5. What fields or behaviors are still missing before a controlled runtime adapter can replace the production actor Watch return path?
6. Can the boundary-owned route produce the required caller shape without calling or importing `collectActorWatch(...)`?
7. Does any required return-path behavior force Watch, Discovery, Evidence/EVEidence, or runtime authority meanings to blur?
8. What should remain compatibility-only and not become long-term ownership language?
9. What is the smallest safe next packet if the trace is favorable?
10. What must remain parked if the trace shows gaps?

## Must Not Merge

Do not blur:

- Watch cadence with Discovery provider execution
- Discovery refs with Evidence/EVEidence
- ESI-backed expansion with Hydration
- Evidence landing with Observation meaning
- Assessment with proof
- fixture proof with production redirect
- compatibility wrapper with long-term ownership
- candidate HS421 naming with accepted state until this artifact is accepted

## Boundaries

Do not implement code.

Do not change:

- production `actor.watch`
- `runActorWatchService(...)`
- `watchExecutor.dispatchFor(...)`
- `collectActorWatch(...)`
- service registry behavior
- command authority
- provider/live/API behavior
- operator DB writes
- Discovery ref writes
- Evidence/EVEidence writes
- Hydration writes
- schema
- dispatcher / queue / lease behavior
- runtime enforcement
- UI
- support artifacts
- source terms / protected-word JSON

No live zKill or ESI calls.

## Expected Output

Create:

```txt
workspace/EngineeringTraceHS421-actor-watch-compatibility-summary-caller-return-path.md
```

The artifact should include:

1. Request restatement.
2. Files traced.
3. Current production `actor.watch` return path.
4. Caller/consumer map.
5. Compatibility summary fields and source basis.
6. Fields already proven by fixture/advisory chain.
7. Missing proof or missing source clarity.
8. Boundary risks and terminology risks.
9. Recommendation:
   - ready for narrow controlled runtime adapter runway
   - needs another proof first
   - needs source cleanup first
   - should remain parked
10. Smallest safe next packet if any.
11. Verification or source evidence commands used.

## Acceptance Lens

The trace is acceptable if it lets Overseer decide whether the next movement can be a narrow runtime-adapter implementation packet, or whether Atlas should first prove/clean another caller-return-path seam.

This request does not authorize runtime redirect, collector retirement, live provider movement, or Dev implementation.
