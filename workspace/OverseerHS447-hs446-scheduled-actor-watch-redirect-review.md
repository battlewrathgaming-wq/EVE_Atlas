# OverseerHS447 - HS446 Scheduled Actor Watch Redirect Review

Status: redirected for verifier correction
Date: 2026-06-12
Role: Overseer

## Reviewed Handoff

```txt
workspace/DevHS446-scheduled-actor-watch-redirect.md
```

## Result

HS446 is not accepted yet.

The runtime movement appears to match the intended narrow shape:

- scheduled actor Watch now uses `runScheduledActorWatch`
- `runScheduledActorWatch(...)` delegates to `runActorWatchDirectBody(...)`
- `WatchSessionExecutor.tick(...)` behavior remains intact
- `TaskRunner` behavior remains intact
- `recordWatchRunResult(...)` remains intact
- system/radius Watch remains on `collectSystemRadiusWatch(...)`
- `collectActorWatch(...)` remains available

However, one relevant existing verifier now fails because it still asserts the pre-HS446 state.

## Blocking Verification Finding

This command failed during Overseer review:

```powershell
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
```

Failure:

```txt
Error: scheduled actor Watch should remain parked on legacy collector during HS433
```

The failing verifier is:

```txt
scripts/verify-watch-actor-production-like-fake-client-direct-proof.js
```

The stale proof/readout source is:

```txt
src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js
```

This is the same class of issue HS442 corrected for the controlled-adapter return-path verifier: an older proof is still teaching a pre-redirect scheduled runtime truth.

## Passing Evidence

These checks passed during Overseer review:

```powershell
node --check src\main\watchlist\watchExecutor.js
node --check scripts\verify-watch-actor-scheduled-redirect.js
npm.cmd run verify:watch-actor-scheduled-redirect
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-actor-direct-redirect
npm.cmd run verify:watch-actor-transport-failure-parity
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

## Disposition

Open HS448 as a verifier/readout correction.

Do not add more runtime movement before HS446 can be accepted cleanly.

Next runway:

```txt
workspace/OverseerHS448-production-like-fake-client-verifier-post-hs446-correction-runway.md
```

Expected handoff:

```txt
workspace/DevHS448-production-like-fake-client-verifier-post-hs446-correction.md
```
