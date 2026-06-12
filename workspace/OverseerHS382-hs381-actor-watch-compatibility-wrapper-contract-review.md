# OverseerHS382 - HS381 Actor Watch Compatibility Wrapper Contract Review

Status: accepted
Date: 2026-06-07
Role: Overseer

## Reviewed

- `workspace/OverseerHS381-actor-watch-compatibility-wrapper-contract-runway.md`
- `workspace/DevHS381-actor-watch-compatibility-wrapper-contract.md`
- `src/main/services/watchActorCompatibilityWrapperContractService.js`
- `scripts/verify-watch-actor-compatibility-wrapper-contract.js`
- registry, authority, passive side-effect, and dry-run updates for the new command

## Result

HS381 is accepted.

The new proof command is:

```txt
watch.actor_compatibility_wrapper_contract.preview
```

The proof stays contract-only and inactive. It shows what the old `actor.watch` entry point and scheduled actor dispatch path would supply to a future compatibility wrapper, while keeping runtime movement parked.

Accepted shape:

- old entry point disclosed as `actor.watch`
- direct command path basis disclosed from `runActorWatchService(...)`
- scheduled dispatch basis disclosed from `watchExecutor.dispatchFor(...)`
- current retire candidate disclosed as `collectActorWatch`
- boundary-owned future stages disclosed for Watch intent/cadence, Discovery zKill candidate-lead acquisition, Discovery ESI-backed killmail/detail expansion intake, Evidence/EVEidence writer boundary, and Watch receipt/cadence posture
- candidate refs remain possible leads, not Evidence/EVEidence
- ESI-backed killmail/detail expansion remains Discovery-owned provider movement, not Hydration
- Evidence/EVEidence writer remains the final landed-memory boundary and is not invoked

## Boundary Check

Accepted preserved boundaries:

- no `actor.watch` redirect
- no `runActorWatchService(...)` runtime behavior change
- no `watchExecutor.dispatchFor(...)` runtime behavior change
- no `collectActorWatch(...)` invocation or retirement
- no system/radius behavior change
- no zKill, ESI, provider, or live/API calls
- no Discovery ref writes
- no Evidence/EVEidence writes
- no Hydration/metadata writes
- no API log, warning, `fetch_runs`, Watch run, or Watch cadence writes
- no DB mutation during preview
- no schema, tasks, queues, dispatchers, leases, workers, UI, enforcement, command blocking, support artifacts, source-term rename, or protected-word JSON update

## Verification

Reviewed Dev evidence and re-ran final acceptance checks.

Dev-reported focused checks passed:

```txt
node --check src\main\services\watchActorCompatibilityWrapperContractService.js
node --check scripts\verify-watch-actor-compatibility-wrapper-contract.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check src\main\services\enforcementDryRunService.js
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Overseer final checks passed:

```txt
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- `verify:protected-terms` exited 0 with warning-only advisory output; no renames or protected-word JSON updates were performed.
- `git diff --check` exited 0 with line-ending warnings only.
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the expected uncommitted Discovery/Watch proof-chain working tree plus HS381/HS382 state.

## Remaining Limits

This is not yet a runtime adapter.

Still parked:

- actual `actor.watch` redirect
- runtime replacement
- collector retirement
- live zKill acquisition
- live ESI-backed expansion
- durable Discovery ref persistence through the replacement path
- Evidence/EVEidence writer landing through the replacement path
- Watch cadence mutation from receipt
- old collector returned-summary equivalence

## Resting State

HS381 is accepted. No Dev runway is open.

Recommended next options:

1. Non-live compatibility-wrapper adapter fixture: construct the same result shape from injected boundary-owned fixtures while still not redirecting `actor.watch`.
2. Evidence/EVEidence writer landing package fixture proof, if the final memory boundary should be proven before adapter work.
3. Pause Dev and perform boundary cleanup/audit before another implementation packet.
