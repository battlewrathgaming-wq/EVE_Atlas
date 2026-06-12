# DevHS461 - Transport Failure Parity Stale Scheduled Readout Correction

Status: ready for Overseer review
Date: 2026-06-12
Executor: Dev

## Summary

Corrected the remaining stale transport/failure parity proof readout that still described scheduled actor Watch as legacy parked.

The proof now reports current scheduled actor Watch runtime truth:

```txt
scheduled_actor_watch_current_runner: runScheduledActorWatch
scheduled_actor_watch_runner_call_target: runActorWatchDirectBody
collectActorWatch_status: legacy_compatibility_available_retirement_candidate
```

No runtime behavior was changed.

## Files Changed

```txt
src/main/discovery/actorWatchTransportFailureParityProof.js
scripts/verify-watch-actor-transport-failure-parity.js
workspace/current.md
workspace/DevHS461-transport-failure-parity-stale-scheduled-readout-correction.md
```

Existing broad working tree remains noisy from earlier milestone work.

## Readout / Assertion Changes

Removed active proof/verifier use of:

```txt
scheduled_actor_watch_legacy_parked
```

Replaced it with:

```txt
scheduled_actor_watch_current_runner: runScheduledActorWatch
scheduled_actor_watch_runner_call_target: runActorWatchDirectBody
collectActorWatch_status: legacy_compatibility_available_retirement_candidate
```

Updated source-boundary assertions to require:

```txt
runActorWatchService -> runActorWatchDirectBody
watchExecutor.dispatchFor(actor) -> runScheduledActorWatch
runScheduledActorWatch -> runActorWatchDirectBody
```

The proof still asserts:

```txt
collect_actor_watch_imported: false
collect_actor_watch_called: false
```

## Verification

Passed:

```txt
node --check src\main\discovery\actorWatchTransportFailureParityProof.js
node --check scripts\verify-watch-actor-transport-failure-parity.js
npm.cmd run verify:watch-actor-transport-failure-parity
```

Focused stale scan:

```txt
rg -n "scheduled_actor_watch_legacy_parked|scheduled actor Watch should remain parked|runner: collectActorWatch|pre-HS446 legacy" src\main\discovery\actorWatchTransportFailureParityProof.js scripts\verify-watch-actor-transport-failure-parity.js
```

Result:

- no matches in the active target files

Final workspace checks after handoff:

```txt
git diff --check
git status --short --branch
```

Results:

- `git diff --check` passed with CRLF normalization warnings only.
- `git status --short --branch` reported `main...origin/main [ahead 19]` with the existing broad uncommitted/untracked milestone stack plus HS461 changes.

## Sample Verifier Output

```json
{
  "status": "Actor Watch transport/failure parity proof validated",
  "action": "watch.actor_transport_failure_parity_proof",
  "real_http_client": true,
  "fake_fetch_impl_only": true,
  "manual_synthetic_api_logs": false,
  "provider_calls": 0,
  "live_api_calls": 0,
  "scheduled_actor_watch_current_runner": "runScheduledActorWatch",
  "scheduled_actor_watch_runner_call_target": "runActorWatchDirectBody",
  "collectActorWatch_status": "legacy_compatibility_available_retirement_candidate"
}
```

## Boundary Confirmation

Confirmed:

- no production actor Watch runtime change
- no `collectActorWatch(...)` retirement, deletion, import, or invocation
- no `scripts/live-actor-watch-runner.js` change
- no broad verifier seed-path migration
- no provider behavior change
- no live/provider calls
- no Watch cadence, scheduling, backoff, bucket, or completion behavior change
- no Discovery handling/recovery behavior change
- no Evidence/EVEidence behavior change
- no Hydration, Observation, Assessment, storage, schema, dispatcher, queue, lease, enforcement, UI, source-term, or protected-word change

## Recommended Next Action

Overseer review HS461. If accepted, the remaining collector-retirement blockers are the active live/script callers and broader verifier seed paths identified by HS456, not this stale transport-failure parity readout.
