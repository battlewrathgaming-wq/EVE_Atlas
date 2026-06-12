# OverseerHS442 - Post-Redirect Return-Path Verifier Correction Runway

Status: open
Date: 2026-06-12
Executor: Dev
Expected handoff: `workspace/DevHS442-post-redirect-return-path-verifier-correction.md`

## Purpose

Update the old actor Watch controlled-adapter return-path verifier/proof language so it reflects the accepted HS440 world.

HS440 intentionally redirected direct production `actor.watch` into the boundary-owned direct body. The older return-path proof still reports `production_runtime_unchanged.actor_watch_redirected: false`, which is now misleading.

This packet is a verification/readout correction only.

## Accepted Current State

Direct production actor Watch:

```txt
serviceRegistry -> runActorWatchService(...) -> runActorWatchDirectBody(...)
```

Scheduled actor Watch:

```txt
watchExecutor.dispatchFor(actor) -> runner: collectActorWatch
```

Controlled adapter preview:

```txt
fixture/proof-only, non-production
```

## Required Work

Adjust the relevant verifier/proof wording and assertions so the output no longer claims the whole production runtime is unchanged.

The verifier should clearly report:

- direct production `actor.watch` is intentionally redirected after HS440
- scheduled actor Watch remains legacy/parked
- controlled adapter proof remains fixture-only / non-production
- `collectActorWatch(...)` is not imported or called by the direct body
- `watchExecutor.dispatchFor(actor)` still uses `collectActorWatch(...)`
- the compatibility summary field set remains unchanged

Acceptable implementation shapes:

- rename the misleading `production_runtime_unchanged` block
- split it into `production_direct_redirect_status`, `scheduled_runtime_status`, and `controlled_adapter_preview_status`
- update assertion names and messages so future readers understand the post-HS440 boundary

Use the smallest change that makes the verifier truthful.

## Boundaries

Do not add:

- runtime behavior change
- scheduled actor Watch redirect
- `watchExecutor.dispatchFor(...)` replacement
- `collectActorWatch(...)` retirement
- system/radius Watch work
- live/provider calls
- schema change
- Discovery task/packet persistence
- dispatcher/queue/lease work
- Hydration write
- Observation/report behavior
- Evidence/EVEidence behavior change
- runtime enforcement/command blocking
- renderer UI
- source-term rename
- protected-word JSON update

## Verification

Run:

```powershell
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
git diff --check
git status --short --branch
```

## Stop Conditions

Stop and report if:

- fixing the verifier requires runtime movement
- direct and scheduled actor Watch states cannot be represented clearly
- a verifier needs to be retired instead of corrected
- any live/provider call is required
- any schema or UI change appears necessary

## Expected Handoff

Create:

```txt
workspace/DevHS442-post-redirect-return-path-verifier-correction.md
```

Include:

- files changed
- exact wording/assertion correction
- verification commands and results
- confirmation that this was readout/verifier correction only
- confirmation that direct production redirect remains HS440 and scheduled actor Watch remains parked
