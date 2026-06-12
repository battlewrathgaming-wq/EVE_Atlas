# DevHS459 - Stale Actor Watch Compatibility Readout Correction

Status: ready for Overseer review
Date: 2026-06-12
Executor: Dev

## Summary

Corrected stale actor Watch compatibility readouts/assertions that still described current direct or scheduled actor Watch as running through `collectActorWatch(...)`.

Current readout now reports:

```txt
direct actor.watch:
runActorWatchService -> runActorWatchDirectBody

scheduled actor Watch:
watchExecutor.dispatchFor(actor) -> actor.watch -> runScheduledActorWatch -> runActorWatchDirectBody

collectActorWatch:
legacy compatibility available retirement candidate
```

No runtime behavior was changed.

## Files Changed

```txt
src/main/services/watchActorCompatibilityWrapperRuntimePreviewService.js
src/main/services/watchActorCompatibilityWrapperContractService.js
scripts/verify-watch-actor-compatibility-wrapper-runtime-preview.js
scripts/verify-watch-actor-compatibility-wrapper-contract.js
scripts/verify-service-registry.js
workspace/current.md
workspace/DevHS459-stale-actor-watch-compatibility-readout-correction.md
```

Existing broad working tree remains noisy from earlier milestone work.

## Readout Shape Updated

Runtime preview now emits:

```txt
existing_runtime_preserved.actor_watch_runtime_entry_point: runActorWatchService
existing_runtime_preserved.runActorWatchService_current_call_target: runActorWatchDirectBody
existing_runtime_preserved.scheduled_actor_watch_dispatch_command: actor.watch
existing_runtime_preserved.scheduled_actor_watch_current_runner: runScheduledActorWatch
existing_runtime_preserved.scheduled_actor_watch_runner_call_target: runActorWatchDirectBody
existing_runtime_preserved.collectActorWatch_status: legacy_compatibility_available_retirement_candidate
```

Contract proof now emits:

```txt
direct_command_path_basis.current_path:
  resolveActorInput(...)
  normalizeActorWatchScope(...)
  assertLiveAllowed("actor.watch", ...)
  runActorWatchDirectBody(input, { ...dependencies, db })

scheduled_dispatch_path_basis.current_runner: runScheduledActorWatch
scheduled_dispatch_path_basis.runner_call_target: runActorWatchDirectBody
scheduled_dispatch_path_basis.collectActorWatch_status: legacy_compatibility_available_retirement_candidate
```

Boundary strings were updated to state current runtime truth and to park `collectActorWatch(...)` as legacy compatibility / retirement candidate.

## Verification

Syntax checks passed:

```txt
node --check src\main\services\watchActorCompatibilityWrapperRuntimePreviewService.js
node --check src\main\services\watchActorCompatibilityWrapperContractService.js
node --check scripts\verify-watch-actor-compatibility-wrapper-runtime-preview.js
node --check scripts\verify-watch-actor-compatibility-wrapper-contract.js
node --check scripts\verify-service-registry.js
```

Required verification passed:

```txt
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
npm.cmd run verify:service-registry
```

Final workspace checks:

```txt
git diff --check
git status --short --branch
```

Results:

- `verify:watch-actor-compatibility-wrapper-runtime-preview` passed and sample output showed `runActorWatchService_current_call_target: runActorWatchDirectBody`, `scheduled_actor_watch_current_runner: runScheduledActorWatch`, and `collectActorWatch_status: legacy_compatibility_available_retirement_candidate`.
- `verify:watch-actor-compatibility-wrapper-contract` passed and sample output showed direct/scheduled path bases through `runActorWatchDirectBody`.
- `verify:service-registry` passed.
- `git diff --check` passed with CRLF normalization warnings only.
- `git status --short --branch` reported `main...origin/main [ahead 19]` with the existing broad uncommitted/untracked milestone stack plus HS459 changes.

## Deferred Stale References

The focused stale scan still found historical workspace text and one non-compatibility proof/verifier pair:

```txt
src/main/discovery/actorWatchTransportFailureParityProof.js
scripts/verify-watch-actor-transport-failure-parity.js
```

Those still expose/assert `scheduled_actor_watch_legacy_parked`. They were not changed because HS459 targeted stale compatibility wrapper readouts/assertions and explicitly avoided broad verifier migration. This should be a separate small correction if Overseer wants all remaining stale proof text updated next.

Historical accepted artifacts and archive/current legacy text also contain old pre-HS440/pre-HS446 claims; those were left unchanged as historical record.

## Boundary Confirmation

Confirmed:

- no `collectActorWatch(...)` retirement or deletion
- no provider behavior change
- no live/provider calls
- no Watch cadence, scheduling, backoff, or bucket behavior change
- no Discovery handling/recovery behavior change
- no Evidence/EVEidence behavior change
- no Hydration, Observation, Assessment, storage, schema, dispatcher, queue, lease, enforcement, UI, source-term, or protected-word change
- no broad verifier seed-path migration
- no live actor Watch runner replacement

## Recommended Next Action

Overseer review HS459. If accepted, a clean next seam would be a tiny correction packet for the remaining non-compatibility transport-failure parity readout, or a separate migration packet for active non-live verifier callers that still import `collectActorWatch(...)`.
