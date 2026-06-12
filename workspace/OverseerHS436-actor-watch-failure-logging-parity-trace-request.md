# OverseerHS436 - Actor Watch Failure / Logging Parity Trace Request

Status: advisory/source-trace request
Date: 2026-06-12
Executor: Engineering / source trace

## Purpose

Trace whether direct production `actor.watch` can be redirected after HS433, or whether failure/logging behavior needs another proof first.

HS433 proved production-like fake-client movement through fixture-owned DBs. It deliberately did not prove true provider transport logging parity or the broader retry/rate-limit/cancellation matrix.

This request resolves HS435 option 2 before any behavior-changing redirect.

## Source Truth

Read:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS435-actor-watch-direct-redirect-decision-surface.md`
- `workspace/OverseerHS434-hs433-actor-watch-production-like-fake-client-direct-proof-review.md`
- `workspace/DevHS433-actor-watch-production-like-fake-client-direct-proof.md`
- `workspace/EngineeringTraceHS431-actor-watch-production-redirect-readiness.md`

Then trace only source needed to answer.

Likely source areas:

- `src/main/services/mutatingActionService.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js`
- `src/main/discovery/zkillCandidateAcquisition.js`
- `src/main/discovery/esiBackedExpansionPackage.js`
- `src/main/discovery/candidateRefMemory.js`
- `src/main/discovery/expansionQueueSelection.js`
- `src/main/db/evidenceRepository.js`
- provider/client and API logging code used by the current collector path
- live/external-I/O gate and command authority code only where relevant
- existing verifiers for HS419, HS423, HS428, and HS433

## Questions To Answer

1. What exact provider/client objects does current production direct `actor.watch` use today?
2. Where do zKill and ESI API request logs get written in the old direct collector path?
3. Does the HS433 boundary-owned fake-client body mirror that logging path, bypass it, or deliberately represent only count posture?
4. If direct redirect used the same production clients as the old collector, would API request logging parity likely hold?
5. What retryable provider failures exist today for zKill and ESI, and how are they represented?
6. What terminal failures exist today, and how are they represented?
7. How are cancellation/timeouts/rate limits/Retry-After represented today, if at all?
8. Does the boundary-owned direct body have a place to preserve those semantics without reintroducing mixed collector ownership?
9. Is another fake-client proof needed before direct redirect, or is a strict redirect packet acceptable with known limitations?
10. What verification should a direct redirect packet require if accepted next?

## Must Not Merge

Do not blur:

- failure/logging parity trace with implementation
- direct production redirect with scheduled Watch redirect
- provider transport logging with synthetic fixture API counts
- Discovery refs with Evidence/EVEidence
- ESI-backed expansion with Hydration
- Evidence landing with Observation meaning
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
workspace/EngineeringTraceHS436-actor-watch-failure-logging-parity.md
```

The artifact should include:

1. Request restatement.
2. Files traced.
3. Current production direct `actor.watch` provider/client path.
4. Current API request logging path for zKill and ESI.
5. HS433 logging/count posture comparison.
6. Retryable failure / terminal failure / timeout / rate-limit / cancellation semantics.
7. Whether the boundary-owned body can preserve those semantics.
8. Risks and stop conditions.
9. Recommendation:
   - direct redirect can proceed with strict verification
   - another fake-client proof is needed first
   - broader provider/client review is needed first
   - redirect should remain parked
10. Verification required for the next packet.

## Acceptance Lens

The trace is acceptable if it lets Overseer decide whether to open a direct production `actor.watch` redirect runway next, run another fake-client proof, request broader provider/client review, or keep redirect parked.

This request does not authorize runtime redirect, collector retirement, scheduled Watch redirect, live provider movement, or Dev implementation.

