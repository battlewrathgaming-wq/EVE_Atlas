# OverseerHS461 - Transport Failure Parity Stale Scheduled Readout Correction Runway

Status: open  
Date: 2026-06-12  
Executor: Dev  
Expected handoff: `workspace/DevHS461-transport-failure-parity-stale-scheduled-readout-correction.md`

## Purpose

Correct the remaining stale actor Watch transport-failure parity proof/readout that still says scheduled actor Watch is legacy parked.

This is a tiny readout/assertion correction packet. It is not a runtime movement packet.

## Context

HS459 corrected the actor Watch compatibility-wrapper readouts so current runtime truth is:

```txt
direct actor.watch:
runActorWatchService -> runActorWatchDirectBody

scheduled actor Watch:
watchExecutor.dispatchFor(actor) -> actor.watch -> runScheduledActorWatch -> runActorWatchDirectBody

collectActorWatch:
legacy compatibility available retirement candidate
```

HS460 accepted HS459 and identified one remaining non-compatibility stale pair:

```txt
src/main/discovery/actorWatchTransportFailureParityProof.js
scripts/verify-watch-actor-transport-failure-parity.js
```

These still expose/assert:

```txt
scheduled_actor_watch_legacy_parked
```

That phrase is stale after HS446/HS449.

## Scope

Update only the transport-failure parity proof/readout and verifier assertions so they reflect current scheduled actor Watch runtime truth:

```txt
scheduled actor Watch:
watchExecutor.dispatchFor(actor) -> actor.watch -> runScheduledActorWatch -> runActorWatchDirectBody
```

Keep the proof's core purpose unchanged: transport/failure parity with real `HttpClient`, `ZKillDiscoveryClient`, and `EsiClient` over fake fetch/disposable DB only.

Suggested replacement posture:

```txt
scheduled_actor_watch_current_runner: runScheduledActorWatch
scheduled_actor_watch_runner_call_target: runActorWatchDirectBody
collectActorWatch_status: legacy_compatibility_available_retirement_candidate
```

Use exact field names that fit the existing proof shape, but avoid any current-state claim that scheduled actor Watch remains legacy parked.

## Boundaries

Do not:

- change production actor Watch runtime
- retire, delete, import, or invoke `collectActorWatch(...)`
- replace or modify `scripts/live-actor-watch-runner.js`
- migrate broad verifier seed paths
- change provider behavior
- run live/provider calls
- change Watch cadence, scheduling, backoff, bucket behavior, or completion decisions
- change Discovery handling/recovery behavior
- mutate Evidence/EVEidence behavior
- change Hydration, Observation, Assessment, storage, schema, dispatcher, queue, lease, enforcement, UI, source terms, or protected-word JSON

## Acceptance Criteria

- `scheduled_actor_watch_legacy_parked` is removed from the active transport-failure parity proof/readout and focused verifier.
- The proof/readout states current scheduled actor Watch runtime truth.
- The proof still asserts no `collectActorWatch(...)` import/call.
- The proof still permits source-boundary validation against the current scheduled runner.
- No runtime/provider behavior changes are introduced.

## Verification

Required:

```txt
npm.cmd run verify:watch-actor-transport-failure-parity
```

Also run syntax checks for touched files:

```txt
node --check src\main\discovery\actorWatchTransportFailureParityProof.js
node --check scripts\verify-watch-actor-transport-failure-parity.js
```

If command metadata or registry assertions are touched unexpectedly, also run:

```txt
npm.cmd run verify:service-registry
```
