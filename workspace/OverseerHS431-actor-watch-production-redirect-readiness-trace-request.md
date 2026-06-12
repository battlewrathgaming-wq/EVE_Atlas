# OverseerHS431 - Actor Watch Production Redirect Readiness Trace Request

Status: advisory/source-trace request
Date: 2026-06-11
Executor: Engineering / source trace

## Purpose

Trace whether production `actor.watch` redirect is structurally ready after the disabled seam, and identify the exact code changes, verification requirements, and stop conditions before any Dev redirect runway is considered.

HS428 accepted a disabled, non-renderer, proof-only adapter seam:

```txt
watch.actor_controlled_adapter_disabled.preview
```

HS431 must not implement redirect. It should determine whether redirect is ready, risky, blocked, or needs another proof first.

## Source Truth

Read first:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS429-hs428-actor-watch-controlled-adapter-disabled-seam-review.md`
- `workspace/OverseerHS430-actor-watch-disabled-seam-next-decision-surface.md`
- `workspace/DevHS428-actor-watch-controlled-adapter-disabled-seam.md`

Then trace only the source needed to answer the request.

Likely source areas:

- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/services/watchActorControlledAdapterDisabledService.js`
- `src/main/services/watchActorControlledRuntimeAdapterFixtureService.js`
- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js`
- `src/main/discovery/actorWatchCompatibilitySummary.js`
- command authority / service registry / passive side-effect / enforcement dry-run verifiers
- existing `scripts/verify-watch-actor-*`

## Questions To Answer

1. What exact production files/functions would change for a direct `actor.watch` redirect?
2. What exact production files/functions would change for scheduled actor Watch redirect?
3. Can direct `actor.watch` redirect happen without scheduled Watch redirect?
4. Can scheduled Watch redirect remain parked safely while direct `actor.watch` is redirected?
5. Does the disabled seam currently prove enough for redirect, or is a production-like fake-client redirect proof still needed?
6. What provider/client injection boundary would production redirect need?
7. What operator DB mutation boundary would production redirect cross?
8. What compatibility fields must remain stable for callers after redirect?
9. What command authority, confirmation, external I/O, storage gate, and enforcement posture must production `actor.watch` retain?
10. What must be verified to prove `collectActorWatch(...)` is no longer used by direct `actor.watch` but remains available for scheduled legacy path if scheduled redirect is parked?
11. What risks remain around fetch runs, Discovery refs, Evidence/EVEidence writes, warnings, and API request logging?
12. What is the smallest safe next packet if redirect is ready?
13. What must remain parked if redirect is not ready?

## Must Not Merge

Do not blur:

- disabled proof seam with production redirect
- direct `actor.watch` redirect with scheduled Watch redirect
- Watch cadence with Discovery provider execution
- Discovery refs with Evidence/EVEidence
- ESI-backed expansion with Hydration
- Evidence landing with Observation meaning
- Assessment with proof
- compatibility summary with future Discovery receipt doctrine

## Boundaries

Do not implement code.

Do not change:

- production `actor.watch`
- `runActorWatchService(...)`
- `watchExecutor.dispatchFor(...)`
- `WatchSessionExecutor.tick(...)`
- `TaskRunner`
- `collectActorWatch(...)`
- service registry behavior
- command authority
- provider/live/API behavior
- operator DB writes
- Discovery ref writes
- Evidence/EVEidence writes
- Hydration writes
- Watch cadence
- schema
- dispatcher / queue / lease behavior
- runtime enforcement
- UI
- source terms / protected-word JSON

No live zKill or ESI calls.

## Expected Output

Create:

```txt
workspace/EngineeringTraceHS431-actor-watch-production-redirect-readiness.md
```

The artifact should include:

1. Request restatement.
2. Files traced.
3. Direct `actor.watch` redirect change map.
4. Scheduled Watch redirect change map.
5. Separation analysis: direct redirect vs scheduled redirect.
6. Provider/client injection readiness.
7. Operator DB mutation and write-boundary readiness.
8. Compatibility summary and caller-shape requirements.
9. Command authority / confirmation / external I/O / storage gate posture.
10. Verification required for a future redirect packet.
11. Risks and stop conditions.
12. Recommendation:
    - ready for direct redirect runway
    - needs production-like fake-client redirect proof first
    - needs broader stack review first
    - should remain parked
13. Smallest safe next packet if any.

## Acceptance Lens

The trace is acceptable if it lets Overseer decide whether the next movement can be a direct `actor.watch` redirect runway, a production-like fake-client redirect proof, a broader stack review, or a parked state.

This request does not authorize runtime redirect, collector retirement, scheduled Watch redirect, live provider movement, or Dev implementation.
