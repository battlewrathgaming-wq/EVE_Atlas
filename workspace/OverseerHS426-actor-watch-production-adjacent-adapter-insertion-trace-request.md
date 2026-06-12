# OverseerHS426 - Actor Watch Production-Adjacent Adapter Insertion Trace Request

Status: advisory/source-trace request
Date: 2026-06-11
Executor: Engineering / source trace

## Purpose

Trace where a future boundary-owned actor Watch controlled adapter could attach near production runtime surfaces without authorizing that attachment yet.

HS423 proved direct caller and scheduled-style return-path compatibility in proof form. HS426 should answer the next assurance question: what exact insertion points, caller expectations, command-authority implications, and stop conditions must be understood before Dev creates any disabled production-adjacent adapter seam.

This is not implementation authorization.

## Source Truth

Read first:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS424-hs423-actor-watch-controlled-adapter-return-path-review.md`
- `workspace/OverseerHS425-actor-watch-runtime-replacement-decision-surface.md`
- `workspace/DevHS423-actor-watch-controlled-adapter-return-path-proof.md`

Then trace only the source needed to answer the request.

Likely source areas:

- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/discovery/actorWatchCompatibilitySummary.js`
- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js`
- `src/main/services/watchActorControlledRuntimeAdapterFixtureService.js`
- related command-authority / service-registry / passive-side-effect verifiers
- related `scripts/verify-watch-actor-*`

## Questions To Answer

1. Where are the current direct `actor.watch` insertion points?
2. Where are the current scheduled actor Watch insertion points?
3. What caller return shape must a future adapter preserve at each insertion point?
4. What command-authority, service-registry, passive-side-effect, and enforcement dry-run surfaces would be touched by adding a disabled adapter seam?
5. Can a disabled adapter seam exist without changing production `actor.watch`, `runActorWatchService(...)`, `watchExecutor.dispatchFor(...)`, or `collectActorWatch(...)`?
6. What should the disabled seam be called so it does not imply production redirect?
7. What fake/provider-injection boundaries would be needed for a disabled seam?
8. What verification would prove no default redirect, no scheduled redirect, no provider movement, and no operator DB mutation?
9. What exact stop conditions should block Dev from proceeding?
10. If favorable, what is the smallest next Dev packet?

## Must Not Merge

Do not blur:

- Watch cadence with Discovery provider execution
- Discovery refs with Evidence/EVEidence
- ESI-backed expansion with Hydration
- Evidence landing with Observation meaning
- Assessment with proof
- fixture/proof seam with production redirect
- compatibility summary with future Discovery receipt doctrine
- disabled adapter seam with default command behavior

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
workspace/EngineeringTraceHS426-actor-watch-production-adjacent-adapter-insertion.md
```

The artifact should include:

1. Request restatement.
2. Files traced.
3. Direct `actor.watch` insertion-point map.
4. Scheduled Watch insertion-point map.
5. Caller/return-shape requirements.
6. Command-authority / service-registry / enforcement dry-run implications.
7. Disabled seam naming recommendation.
8. Provider/fake-client injection boundary.
9. Required verification for a future Dev packet.
10. Stop conditions.
11. Recommendation:
   - ready for disabled controlled adapter seam
   - needs one more proof first
   - should remain parked
12. Smallest safe next packet if any.

## Acceptance Lens

The trace is acceptable if it lets Overseer decide whether the next movement can be a disabled production-adjacent adapter seam, or whether Atlas should keep the actor Watch replacement away from production service/runtime surfaces for now.

This request does not authorize runtime redirect, collector retirement, live provider movement, or Dev implementation.
