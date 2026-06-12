# OverseerHS437 - HS436 Actor Watch Failure / Logging Parity Review

Status: accepted
Date: 2026-06-12
Role: Overseer

## Review Target

Accepted advisory artifact:

```txt
workspace/EngineeringTraceHS436-actor-watch-failure-logging-parity.md
```

Request answered:

```txt
workspace/OverseerHS436-actor-watch-failure-logging-parity-trace-request.md
```

## Decision

HS436 is accepted.

Finding:

```txt
direct production actor.watch redirect should not open yet
```

Accepted next movement:

```txt
transport/failure parity proof using real HttpClient with fake fetchImpl
```

This is still a no-live proof packet. It is not a production redirect packet.

## Accepted Findings

Current production direct `actor.watch` uses:

```txt
runActorWatchService(...)
-> collectActorWatch(...)
-> HttpClient({ repository, runId, signal, timeoutMs })
-> ZKillDiscoveryClient(httpClient)
-> EsiClient(httpClient)
```

API request logs are written by `HttpClient` through `EvidenceRepository.insertApiRequestLog(...)`.

HS433 represented API count posture with synthetic fixture `api_request_logs`. That was acceptable for HS433, but it is not enough for direct redirect.

The current boundary-owned direct body has a plausible place to preserve the semantics, but it has not yet proven:

- real `HttpClient` logging parity
- retry count / Retry-After / rate-limited posture
- terminal HTTP failure posture
- invalid JSON / validation failure posture
- cancellation / timeout behavior
- top-level failed fetch-run finalization parity

## Boundary Confirmation

Still not open:

- production direct `actor.watch` redirect
- scheduled actor Watch redirect
- `runActorWatchService(...)` production call-target change
- `watchExecutor.dispatchFor(...)` replacement
- `WatchSessionExecutor.tick(...)` changes
- `TaskRunner` changes
- `collectActorWatch(...)` retirement
- live zKill / ESI provider movement
- operator corpus writes through the new direct path
- Hydration writes
- Observation/report changes
- system/radius Watch movement
- schema changes
- durable Discovery task/packet persistence
- dispatcher / queue / lease behavior
- runtime enforcement activation
- renderer UI
- source-term rename or protected-word JSON updates

## Next Step

Open HS438:

```txt
workspace/OverseerHS438-actor-watch-transport-failure-parity-proof-runway.md
```

Expected Dev handoff:

```txt
workspace/DevHS438-actor-watch-transport-failure-parity-proof.md
```

