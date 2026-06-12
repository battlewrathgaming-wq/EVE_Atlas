# OverseerHS443 - HS442 Post-Redirect Return-Path Verifier Correction Review

Status: accepted
Date: 2026-06-12
Role: Overseer

## Reviewed Handoff

```txt
workspace/DevHS442-post-redirect-return-path-verifier-correction.md
```

## Result

HS442 is accepted.

The old actor Watch controlled-adapter return-path verifier no longer claims the whole production runtime is unchanged after HS440. It now distinguishes the three relevant states:

- direct production `actor.watch` is intentionally redirected after HS440
- scheduled actor Watch remains legacy/parked on `collectActorWatch(...)`
- the controlled-adapter proof remains fixture-only and non-production

## Boundary Check

Accepted:

- verifier/readout wording correction
- source assertions proving direct production `actor.watch` calls `runActorWatchDirectBody(...)`
- source assertions proving the direct body does not import or invoke `collectActorWatch(...)`
- source assertions proving scheduled actor Watch remains parked on `watchExecutor.dispatchFor(actor) -> runner: collectActorWatch`
- corrected compatibility language around the legacy collector field set

Not accepted:

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
- runtime enforcement or command blocking
- renderer UI
- source-term rename
- protected-word JSON update

## Verification Run

Overseer reran:

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

Results:

- syntax check passed
- corrected return-path verifier passed
- direct redirect verifier passed
- transport/failure parity passed
- production-like fake-client proof passed
- controlled runtime adapter fixture passed
- service registry, command authority, passive side-effects, and enforcement dry-run passed
- `git diff --check` reported only existing LF/CRLF warnings, no whitespace errors
- tree remains `main...origin/main [ahead 19]` with the expected large milestone stack

## Accepted Current State

Direct actor Watch:

```txt
serviceRegistry -> runActorWatchService(...) -> runActorWatchDirectBody(...)
```

Scheduled actor Watch:

```txt
watchExecutor.dispatchFor(actor) -> runner: collectActorWatch
```

The direct path has moved. The scheduled path has not.

## Next Seam

Open a source trace before attempting scheduled runtime movement:

```txt
workspace/OverseerHS444-scheduled-actor-watch-redirect-readiness-trace-request.md
```

Expected advisory artifact:

```txt
workspace/EngineeringTraceHS444-scheduled-actor-watch-redirect-readiness.md
```

Purpose:

Determine what scheduled actor Watch needs before it can redirect from the legacy mixed collector to the boundary-owned model without losing task/cadence/result-recording behavior.
