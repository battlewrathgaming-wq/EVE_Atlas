# OverseerHS414 - HS413 Actor Watch Redirect Readiness Re-Check Review

Status: accepted
Date: 2026-06-07
Reviewer: Overseer

## Reviewed Input

- `workspace/OverseerHS413-actor-watch-redirect-readiness-recheck-request.md`
- `workspace/EngineeringTraceHS413-actor-watch-redirect-readiness-recheck.md`

## Decision

HS413 is accepted.

The advisory answers the request directly and does not over-claim readiness. Actor Watch is not ready for default `actor.watch` runtime redirect. It is ready for a narrower proof: a no-provider / injected-client actor-route body that composes the Discovery-owned helper surfaces without invoking `collectActorWatch(...)`.

## Accepted Findings

Current actor Watch still routes through the old mixed collector path:

```txt
actor.watch
-> runActorWatchService(...)
-> collectActorWatch(...)
```

Scheduled actor Watch still uses:

```txt
watchExecutor.dispatchFor(actor)
-> actor.watch
-> runner: collectActorWatch
```

`collectActorWatch(...)` remains the only live-capable actor Watch orchestrator that currently combines:

- `fetch_runs` lifecycle
- pending Discovery ref drain
- zKill candidate acquisition
- candidate-ref writes
- expansion selection
- selected/expanded/cached/failed ref status mutation
- ESI-backed selected-ref expansion
- Evidence/EVEidence writer landing
- warning persistence
- API log count summaries
- old caller-facing result shape
- scheduled Watch success/failure participation

Accepted Discovery-owned helper surfaces now exist, but they are ingredients rather than one redirectable actor-route body:

- zKill candidate-lead acquisition
- pending candidate-ref rehydration
- selected-ref expansion queue selection
- ESI-backed killmail/detail expansion package preparation
- Evidence/EVEidence writer landing boundary
- no-provider package builder / compatibility export

## Redirect Decision

Accepted decision:

```txt
ready only for a narrower slice
```

Not ready:

- default `actor.watch` redirect
- scheduled actor Watch redirect
- `collectActorWatch(...)` retirement
- live/provider movement through the replacement path

Ready:

- no-provider / injected-client actor-route body proof
- proof that the route can compose Discovery-owned helpers and return old caller-facing compatibility shape
- proof that `collectActorWatch(...)` is not imported or invoked by the new route body

## Next Dev Packet

Open a narrow Dev packet:

```txt
Actor Watch Discovery-owned route body fixture / injected-client proof
```

This should add/prove a new explicit actor-route service/helper without changing the production `actor.watch` command, `runActorWatchService(...)`, `watchExecutor.dispatchFor(...)`, or scheduled Watch behavior.

## Boundaries

Do not open:

- default `actor.watch` redirect
- scheduled actor Watch redirect
- collector retirement
- live zKill calls
- live ESI calls
- runtime Evidence/EVEidence writes through actor replacement path unless explicitly fixture/disposable only
- Watch cadence mutation
- durable Discovery task/packet schema
- dispatcher / queue / lease / sequencer behavior
- system/radius Watch replacement
- Hydration writes
- Observation/report changes
- renderer UI
- runtime enforcement / command blocking
- support artifacts
- source-term rename
- protected-word JSON updates

## Notes

The strongest warning from HS413 is accepted:

If Atlas redirects `actor.watch` directly to the existing compatibility wrapper preview, it would turn a live-capable command into a read-only fixture command and silently lose expected behavior. If Atlas redirects directly to a quick clone of `collectActorWatch(...)`, it preserves behavior but also preserves the mixed collector model.

The next proof must walk between those two bad outcomes.
