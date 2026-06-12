# OverseerHS462 - HS461 Transport Failure Parity Stale Readout Review

Status: accepted  
Date: 2026-06-12  
Reviewed handoff: `workspace/DevHS461-transport-failure-parity-stale-scheduled-readout-correction.md`

## Review Result

HS461 is accepted.

Dev corrected the remaining stale actor Watch transport/failure parity readout that still described scheduled actor Watch as legacy parked.

The proof now reports current scheduled actor Watch runtime truth:

```txt
scheduled_actor_watch_current_runner: runScheduledActorWatch
scheduled_actor_watch_runner_call_target: runActorWatchDirectBody
collectActorWatch_status: legacy_compatibility_available_retirement_candidate
```

## Boundary Check

Confirmed:

- no production actor Watch runtime change
- no `collectActorWatch(...)` retirement, deletion, import, or invocation
- no live actor Watch runner change
- no broad verifier seed-path migration
- no provider behavior change
- no live/provider calls
- no Watch cadence, scheduling, backoff, bucket, or completion behavior change
- no Discovery handling/recovery behavior change
- no Evidence/EVEidence behavior change
- no Hydration, Observation, Assessment, storage, schema, dispatcher, queue, lease, enforcement, UI, source-term, or protected-word change

This was a readout/assertion truth correction only.

## Verification

Overseer reran:

```txt
node --check src\main\discovery\actorWatchTransportFailureParityProof.js
node --check scripts\verify-watch-actor-transport-failure-parity.js
npm.cmd run verify:watch-actor-transport-failure-parity
```

All passed.

Focused stale scan:

```txt
rg -n "scheduled_actor_watch_legacy_parked|scheduled actor Watch should remain parked|runner: collectActorWatch|pre-HS446 legacy" src\main\discovery\actorWatchTransportFailureParityProof.js scripts\verify-watch-actor-transport-failure-parity.js
```

No matches in the active target files.

## Stable Landing

The old actor Watch runtime signage is now corrected across the known active compatibility and transport-failure parity proof surfaces.

Current stable line:

```txt
Watch scheduled work bucket
-> Discovery repeatable handling/recovery
-> settled factual receipt
-> Watch bucket/cadence interpretation
```

`collectActorWatch(...)` remains parked legacy compatibility code and a retirement candidate. It should not be treated as current direct/scheduled actor Watch runtime.

## Next Decision Point

Do not open collector retirement yet.

Remaining known blockers from HS456:

1. active live/script caller: `scripts/live-actor-watch-runner.js`
2. active non-live verifier seed paths still importing `collectActorWatch(...)`
3. broader compatibility/fixture availability assertions that may need migration before physical deletion
4. duplicated expansion-package behavior that must not be lost if the legacy collector is later retired

Safest next candidate seams:

1. classify active non-live verifier callers that still import `collectActorWatch(...)` and decide which should migrate to the boundary-owned direct body/request-receipt projection
2. decide whether `scripts/live-actor-watch-runner.js` is current, parked, or later replacement
3. pause for a compact Watch/Discovery boundary capture before more movement

