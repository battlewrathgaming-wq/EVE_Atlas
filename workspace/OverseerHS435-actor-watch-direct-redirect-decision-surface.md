# OverseerHS435 - Actor Watch Direct Redirect Decision Surface

Status: open decision surface
Date: 2026-06-12
Role: Overseer

## Current State

Accepted proof chain:

- HS431 / HS432: production redirect was not ready before fake-client proof
- HS433 / HS434: production-like fake-client direct proof accepted

The next possible movement is the first behavior-changing redirect:

```txt
direct actor.watch -> boundary-owned direct body
```

Scheduled actor Watch remains separate and parked.

## Decision Needed

Choose the next seam:

1. Open direct production `actor.watch` redirect runway.
2. Run a narrow failure/logging parity advisory or proof first.
3. Park direct redirect and inspect scheduled actor Watch split next.

## Recommendation

Prefer option 2 if assurance is desired before behavior change.

Reason:

- HS433 proved fixture-owned mutation choreography.
- HS433 did not prove true transport/API logging parity.
- HS433 only covered selected-ref expansion failure posture, not the broader retry/rate-limit/cancellation matrix.
- The next redirect would be the first actual production behavior change in the actor Watch replacement chain.

Option 1 is plausible if Human accepts the remaining limitation and wants to move faster.

## If Option 1

The Dev runway must:

- change only direct `actor.watch`
- preserve command metadata, confirmation, External I/O, storage/write gate, and enforcement dry-run posture
- keep scheduled actor Watch on legacy collector
- keep `collectActorWatch(...)` available for scheduled legacy path
- use no live provider calls in verification
- preserve caller compatibility summary
- preserve API request logging behavior or explicitly report any difference
- not touch system/radius, schema, dispatcher, queue, lease, runtime enforcement, Hydration, Observation, UI, or protected terms

## If Option 2

The advisory/proof should answer:

- what exact provider/client objects production direct redirect would use
- whether their API request logging behavior matches the old collector path
- how retryable provider failures, rate limits, cancellations, and terminal failures map through the boundary-owned direct body
- whether any of those states require another fake-client proof before redirect

## If Option 3

The next work should stay advisory/source-trace only and inspect scheduled actor Watch split without touching direct production behavior.

