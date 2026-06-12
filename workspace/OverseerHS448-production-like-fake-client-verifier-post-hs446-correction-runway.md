# OverseerHS448 - Production-Like Fake-Client Verifier Post-HS446 Correction Runway

Status: open
Date: 2026-06-12
Executor: Dev
Expected handoff: `workspace/DevHS448-production-like-fake-client-verifier-post-hs446-correction.md`

## Purpose

Correct the stale HS433 production-like fake-client direct proof/verifier so it reflects the post-HS446 state.

HS446 moved scheduled actor Watch from `collectActorWatch(...)` to `runScheduledActorWatch(...)`.

The older fake-client direct proof still asserts:

```txt
scheduled actor Watch should remain parked on legacy collector during HS433
```

That is now stale and blocks HS446 acceptance.

This packet is verifier/proof readout correction only.

## Required Work

Update:

```txt
scripts/verify-watch-actor-production-like-fake-client-direct-proof.js
src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js
```

as needed so the proof distinguishes:

- the HS433 fake-client proof itself does not perform runtime redirect
- direct production `actor.watch` is already redirected after HS440
- scheduled actor Watch is already redirected after HS446
- `collectActorWatch(...)` remains available but is no longer used by direct or scheduled actor Watch runtime
- system/radius Watch remains legacy

Do not weaken the fake-client proof's original purpose:

- fixture-owned DBs only
- injected fake clients only
- no live/provider calls
- no operator corpus mutation
- fake zKill/ESI invocation and API-count posture remains represented
- 22-field compatibility summary parity remains enforced

## Boundaries

Do not add:

- runtime behavior change
- scheduled actor Watch redirect changes
- direct actor Watch changes
- `WatchSessionExecutor.tick(...)` redesign
- `TaskRunner` redesign
- `recordWatchRunResult(...)` redesign
- `collectActorWatch(...)` retirement
- system/radius Watch redirect
- live/provider calls
- schema change
- dispatcher/queue/lease behavior
- Hydration writes
- Observation/report changes
- Assessment behavior
- renderer UI
- source-term rename
- protected-word JSON update

## Verification

Run:

```powershell
node --check scripts\verify-watch-actor-production-like-fake-client-direct-proof.js
node --check src\main\discovery\actorWatchProductionLikeFakeClientDirectProof.js
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
npm.cmd run verify:watch-actor-scheduled-redirect
npm.cmd run verify:watch-actor-direct-redirect
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-transport-failure-parity
npm.cmd run verify:watch-executor
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
git status --short --branch
```

## Stop Conditions

Stop and report if:

- the correction requires runtime changes
- the fake-client proof cannot represent post-HS446 state truthfully
- source assertions conflict between direct, scheduled, and system/radius Watch
- any live/provider call is required
- any schema/UI/enforcement change appears necessary

## Expected Handoff

Create:

```txt
workspace/DevHS448-production-like-fake-client-verifier-post-hs446-correction.md
```

Include:

- files changed
- stale assertion/readout corrected
- verification commands and results
- confirmation this was proof/verifier correction only
- confirmation HS446 runtime movement was not expanded
