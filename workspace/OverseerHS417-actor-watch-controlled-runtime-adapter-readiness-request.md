# Overseer HS417 - Actor Watch Controlled Runtime Adapter Readiness Request

Status: advisory request
Role requested: Engineering / source trace
Date: 2026-06-08

## Request

Review whether Atlas is ready to move from the HS415 actor Watch Discovery-owned route-body fixture proof toward a controlled actor Watch runtime adapter path.

Do not implement code.

The goal is to identify the smallest safe next runtime seam, not to authorize default `actor.watch` redirect.

## Context

Accepted model:

- Watch is a scheduler and scope-authority source.
- Discovery is the provider-facing acquisition utility.
- A due Watch emits/populates Discovery pickup intent; it does not acquire candidates itself.
- Candidate refs are possible leads/provenance, not Evidence/EVEidence.
- ESI-backed selected-ref expansion remains Discovery-owned and is not Hydration.
- Evidence/EVEidence begins when expanded ESI killmail memory lands through the Evidence/EVEidence writer.

Recent accepted proof:

- HS415 proved a Discovery-owned actor Watch route body in fixture form.
- HS416 accepted HS415.
- The proof uses injected fake clients and does not invoke `collectActorWatch(...)`.
- Production `actor.watch`, `runActorWatchService(...)`, and `watchExecutor.dispatchFor(...)` remain unchanged.

Accepted review:

```txt
workspace/OverseerHS416-hs415-actor-watch-discovery-route-body-fixture-proof-review.md
```

Dev handoff:

```txt
workspace/DevHS415-actor-watch-discovery-route-body-fixture-proof.md
```

Related prior readiness trace:

```txt
workspace/EngineeringTraceHS413-actor-watch-redirect-readiness-recheck.md
workspace/OverseerHS414-hs413-actor-watch-redirect-readiness-recheck-review.md
```

## Question

What remains before Atlas can safely introduce a controlled actor Watch runtime adapter path that calls the Discovery-owned route body or its production successor?

Specifically:

1. Which current behaviors of `collectActorWatch(...)` must be preserved before any runtime adapter can replace it for actor Watch?
2. Which of those behaviors are already represented by HS415 and surrounding fixture proofs?
3. Which behaviors are still missing, ambiguous, or only represented in old mixed-collector code?
4. Does the next safe step look like another read-only proof, a no-provider runtime adapter, or a source-code refactor?
5. What would be the smallest implementation packet if the next step is Dev?
6. What must remain parked?

## Files To Inspect

Start from project root and read only as needed:

```txt
workspace/current.md
workspace/overview.md
workspace/OverseerHS416-hs415-actor-watch-discovery-route-body-fixture-proof-review.md
workspace/DevHS415-actor-watch-discovery-route-body-fixture-proof.md
workspace/EngineeringTraceHS413-actor-watch-redirect-readiness-recheck.md
workspace/OverseerHS414-hs413-actor-watch-redirect-readiness-recheck-review.md
src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js
src/main/services/watchActorDiscoveryRouteBodyFixtureService.js
src/main/services/mutatingActionService.js
src/main/watchlist/watchExecutor.js
src/main/workers/actorWatchCollector.js
src/main/discovery/zkillCandidateAcquisition.js
src/main/discovery/candidateRefMemory.js
src/main/discovery/expansionQueueSelection.js
src/main/discovery/esiBackedExpansionPackage.js
src/main/db/evidenceRepository.js
src/main/services/serviceRegistry.js
```

Use `rg` for source traces.

## Boundaries

Do not:

- edit files
- create a Dev runway
- run live/API/provider calls
- redirect production `actor.watch`
- change `runActorWatchService(...)`
- change `watchExecutor.dispatchFor(...)`
- invoke or retire `collectActorWatch(...)`
- write real/operator Discovery refs
- write Evidence/EVEidence
- write Hydration metadata
- mutate Watch cadence
- change schema
- add dispatcher/queue/lease behavior
- change runtime enforcement or command blocking
- touch renderer UI
- create support artifacts
- rename source terms or update protected-word JSON

## Expected Output

Create:

```txt
workspace/EngineeringTraceHS417-actor-watch-controlled-runtime-adapter-readiness.md
```

Include:

1. Executive recommendation.
2. Current actor Watch runtime path summary.
3. Current HS415 Discovery route-body path summary.
4. Behavior parity matrix: old mixed collector behavior vs HS415/fixture representation vs missing.
5. Write/provider/cadence boundary risk analysis.
6. Recommendation for the smallest next seam.
7. If Dev-ready, provide a bounded implementation packet outline.
8. If not Dev-ready, state the next proof or trace needed.
9. Parked items.
10. Verification evidence expected for the next packet.

Be critical. Do not rubber-stamp runtime redirect.
