# OverseerHS432 - HS431 Actor Watch Production Redirect Readiness Review

Status: accepted
Date: 2026-06-11
Role: Overseer

## Review Target

Accepted advisory artifact:

```txt
workspace/EngineeringTraceHS431-actor-watch-production-redirect-readiness.md
```

Request answered:

```txt
workspace/OverseerHS431-actor-watch-production-redirect-readiness-trace-request.md
```

## Decision

HS431 is accepted.

Finding:

```txt
production actor.watch redirect is not ready yet
```

Accepted next movement:

```txt
production-like fake-client direct redirect proof first
```

This is a proof packet, not a production redirect packet.

## Accepted Findings

HS431 correctly separates direct operator `actor.watch` from scheduled actor Watch runtime.

Direct path today:

```txt
serviceRegistry -> runActorWatchService(...) -> collectActorWatch(...)
```

Scheduled path today:

```txt
WatchSessionExecutor.tick -> dispatchFor(watch) -> collectActorWatch(...)
```

Direct `actor.watch` can be proven separately from scheduled actor Watch, but any divergence must remain explicit and temporary.

HS428 proved a disabled, non-production seam. It did not prove production-like provider/client injection, fixture DB mutation parity, fetch-run lifecycle, candidate-ref status mutation, Evidence/EVEidence writer landing, warning posture, or API request count posture.

## Boundary Confirmation

Still not open:

- production `actor.watch` redirect
- scheduled Watch redirect
- `runActorWatchService(...)` replacement
- `watchExecutor.dispatchFor(...)` replacement
- `collectActorWatch(...)` retirement
- live zKill or ESI calls
- operator corpus writes
- operator Discovery ref writes through a new path
- operator Evidence/EVEidence writes through a new path
- Hydration writes
- Observation/report behavior
- system/radius Watch replacement
- schema changes
- durable Discovery task/packet persistence
- dispatcher / queue / lease behavior
- runtime enforcement activation
- renderer UI
- source-term rename or protected-word updates

## Next Step

Open HS433:

```txt
workspace/OverseerHS433-actor-watch-production-like-fake-client-direct-proof-runway.md
```

Expected Dev handoff:

```txt
workspace/DevHS433-actor-watch-production-like-fake-client-direct-proof.md
```

