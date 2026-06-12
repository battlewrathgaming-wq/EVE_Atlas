# OverseerHS460 - HS459 Stale Actor Watch Compatibility Readout Review

Status: accepted  
Date: 2026-06-12  
Reviewed handoff: `workspace/DevHS459-stale-actor-watch-compatibility-readout-correction.md`

## Review Result

HS459 is accepted.

Dev corrected the stale actor Watch compatibility-wrapper readouts and matching assertions so they no longer describe current direct or scheduled actor Watch as running through `collectActorWatch(...)`.

Current readout truth is now:

```txt
direct actor.watch:
runActorWatchService -> runActorWatchDirectBody

scheduled actor Watch:
watchExecutor.dispatchFor(actor) -> actor.watch -> runScheduledActorWatch -> runActorWatchDirectBody

collectActorWatch:
legacy compatibility available retirement candidate
```

## Boundary Check

Confirmed from handoff and focused verification:

- no `collectActorWatch(...)` retirement or deletion
- no live/provider calls
- no provider behavior change
- no Watch cadence, scheduling, backoff, bucket behavior, or completion decision change
- no Discovery handling/recovery behavior change
- no Evidence/EVEidence behavior change
- no Hydration, Observation, Assessment, storage, schema, dispatcher, queue, lease, enforcement, UI, source-term, or protected-word change
- no broad verifier seed-path migration
- no live actor Watch runner replacement

The correction is signage/readout truth, not runtime replacement.

## Verification

Overseer reran the focused checks:

```txt
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
npm.cmd run verify:service-registry
```

All passed.

Note: `verify:service-registry` needed a longer timeout and completed in about 142 seconds.

## Residual Known Drift

HS459 deliberately did not clean every old reference.

Known remaining stale/non-current surfaces:

```txt
src/main/discovery/actorWatchTransportFailureParityProof.js
scripts/verify-watch-actor-transport-failure-parity.js
```

These still expose/assert `scheduled_actor_watch_legacy_parked`. They are not compatibility-wrapper readouts, so they were correctly left out of HS459.

Historical accepted artifacts and archived workspace text still contain pre-HS440/pre-HS446 claims. Treat those as historical, not current truth.

## Stability Capture

The current stable actor Watch line is:

```txt
Watch scheduled work bucket
-> Discovery repeatable handling/recovery
-> settled factual receipt
-> Watch bucket/cadence interpretation
```

`collectActorWatch(...)` remains a parked legacy compatibility surface. It should not be treated as current direct/scheduled actor Watch runtime, and it should not be retired until remaining live/script/verifier dependencies are handled deliberately.

## Next Decision Point

Do not open a broad replacement or retirement packet yet.

Safest next candidate seams:

1. Tiny correction: update the remaining transport-failure parity stale readout/assertion from `scheduled_actor_watch_legacy_parked` to current scheduled actor Watch runtime truth.
2. Migration planning: classify active non-live verifier callers that still import `collectActorWatch(...)` and decide which should migrate to the boundary-owned direct body or request/receipt projection.
3. Live runner decision: decide whether `scripts/live-actor-watch-runner.js` is current, parked, or should be replaced by a current-path live runner later.

Recommended immediate posture: pause at decision point and choose one narrow seam.

