# DevHS442 - Post-Redirect Return-Path Verifier Correction

Status: ready for Overseer review
Date: 2026-06-12
Executor: Dev

## Summary

HS442 corrected the stale controlled-adapter return-path verifier readout so it reflects the accepted HS440 world.

Before this correction, the verifier emitted:

```txt
production_runtime_unchanged.actor_watch_redirected: false
```

That was true when the return-path proof was first created, but it is misleading after HS440 because direct production `actor.watch` is now intentionally redirected to the boundary-owned direct body.

## Files Changed

- `scripts/verify-watch-actor-controlled-adapter-return-path.js`
- `workspace/current.md`
- `workspace/DevHS442-post-redirect-return-path-verifier-correction.md`

## Exact Correction

Replaced the misleading readout block:

```txt
production_runtime_unchanged
```

with three explicit post-HS440 blocks:

```txt
production_direct_redirect_status
scheduled_runtime_status
controlled_adapter_preview_status
```

The verifier now reports:

```txt
production_direct_redirect_status:
  actor_watch_redirected_after_hs440: true
  runtime_entry_point: runActorWatchService
  runActorWatchService_call_target: runActorWatchDirectBody
  direct_body_imports_collectActorWatch: false
  direct_body_invokes_collectActorWatch: false

scheduled_runtime_status:
  scheduled_actor_watch_legacy_parked: true
  watchExecutor_dispatchFor_uses_collectActorWatch: true
  current_runner: collectActorWatch

controlled_adapter_preview_status:
  fixture_only: true
  non_production: true
  preview_performed_redirect: false
  preview_changed_runActorWatchService: false
  preview_changed_watchExecutor_dispatchFor: false
  collectActorWatch_imported_by_preview: false
  collectActorWatch_invoked_by_preview: false
```

Updated assertion wording so the verifier distinguishes:

- HS440 direct production redirect is accepted current state
- the controlled-adapter proof itself remains fixture-only and non-production
- scheduled actor Watch remains parked on `collectActorWatch(...)`

Also renamed the field-set source check from production wording to legacy compatibility wording:

```txt
verifyLegacyCollectorCompatibilityFieldSet(...)
```

## Sample Corrected Output

```txt
production_direct_redirect_status.actor_watch_redirected_after_hs440: true
production_direct_redirect_status.runActorWatchService_call_target: runActorWatchDirectBody
production_direct_redirect_status.direct_body_invokes_collectActorWatch: false
scheduled_runtime_status.watchExecutor_dispatchFor_uses_collectActorWatch: true
controlled_adapter_preview_status.preview_performed_redirect: false
compatibility_field_set_parity.matches: true
```

## Boundary Confirmation

This was readout/verifier correction only.

No runtime behavior changed:

- no scheduled actor Watch redirect
- no `watchExecutor.dispatchFor(...)` replacement
- no `collectActorWatch(...)` retirement
- no system/radius Watch work
- no live/provider calls
- no schema change
- no Discovery task/packet persistence
- no dispatcher/queue/lease work
- no Hydration write
- no Observation/report behavior change
- no Evidence/EVEidence behavior change
- no runtime enforcement or command blocking
- no renderer UI
- no source-term rename
- no protected-word JSON update

Direct production redirect remains the HS440 change. Scheduled actor Watch remains parked.

## Verification

Passed:

```txt
node --check scripts\verify-watch-actor-controlled-adapter-return-path.js
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-direct-redirect
npm.cmd run verify:watch-actor-transport-failure-parity
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Final hygiene commands are run after this handoff/current update:

```txt
git diff --check
git status --short --branch
```
