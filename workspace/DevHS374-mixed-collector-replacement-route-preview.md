# DevHS374 - Mixed Collector Replacement Route Preview

Status: complete
Date: 2026-06-07
Role: Dev

## Summary

Implemented a read-only/local-only route preview command:

```txt
watch.mixed_collector_replacement_route.preview
```

The command maps current actor Watch and system/radius Watch payload shapes into the accepted future replacement route:

```txt
Watch accepted intent / cadence
-> Discovery zKill candidate-lead acquisition lane
-> Discovery ESI-backed killmail/detail expansion lane
-> Evidence/EVEidence writer / landed memory
-> Watch receipt / cadence posture
```

This is a preview only. It does not redirect or retire legacy mixed collectors.

## Files Changed

- `src/main/services/watchMixedCollectorReplacementRouteService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-watch-mixed-collector-replacement-route.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS374-mixed-collector-replacement-route-preview.md`

Note: the working tree already contained uncommitted HS356, HS363, HS368, HS370, and workspace/review artifacts. I preserved that tree and did not revert, commit, or push it.

## Command Shape

The route preview reuses the HS370 fixture proof and reports:

- selected Watch source
- current entry point shape:
  - `actor.watch`
  - `system.radius.watch`
- current legacy collector that would have been used:
  - `collectActorWatch`
  - `collectSystemRadiusWatch`
- future route stages with owner, input, output, and boundary language
- compatibility-wrapper posture for old command entry points
- retire posture for old mixed collector functions/files
- missing proof flags
- existing proof basis from HS368 and HS370
- explicit non-invocation proof
- explicit no-mutation proof

## Fixture Coverage

The focused verifier covers:

- actor Watch route
- system/radius Watch route using stored accepted `included_system_ids`
- request-level `held_by_external_io` before provider movement
- route with no candidate refs
- route with candidate refs selected for the Discovery ESI-backed expansion lane
- route where Evidence/EVEidence writer is only a future landing boundary, not invoked

Sample focused verifier facts:

```txt
command: watch.mixed_collector_replacement_route.preview
actor entry point: actor.watch
actor retire candidate: collectActorWatch
system/radius entry point: system.radius.watch
system/radius retire candidate: collectSystemRadiusWatch
route stages: Watch -> Discovery zKill lane -> Discovery ESI-backed lane -> Evidence/EVEidence writer -> Watch receipt/cadence
held route provider-facing packets: 0
no-ref route selected handoff candidates: 0
```

## Boundary Confirmation

Confirmed by implementation and verifier assertions:

- no providers or live/API calls
- no `collectActorWatch(...)`
- no `collectSystemRadiusWatch(...)`
- no `WatchSessionExecutor.tick(...)`
- no `TaskRunner.runDetachedTask(...)`
- no live Watch dispatch
- no task creation
- no Watch mutation
- no Discovery ref writes
- no Evidence/EVEidence writes
- no live/provider ESI-backed expansion
- no Hydration or metadata writes
- no API logs, warnings, or `fetch_runs` writes
- no durable Discovery task/packet/receipt schema
- no queues, dispatcher, leases, support artifacts, UI, enforcement, command blocking, source-term rename, or protected-word JSON update
- no mixed collector redirect
- no mixed collector retirement

## Missing Proof Flags

The preview deliberately reports these still-missing facts:

- live provider movement not proven
- Discovery ESI-backed expansion intake runtime not proven
- Evidence writer landing boundary not proven
- Watch cadence mutation from receipt not proven
- compatibility wrapper not implemented
- mixed collector retirement not performed

Case-specific flags also report held External I/O or no candidate refs where applicable.

## Verification

Passed:

```txt
node --check src\main\services\watchMixedCollectorReplacementRouteService.js
node --check scripts\verify-watch-mixed-collector-replacement-route.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check src\main\services\enforcementDryRunService.js
npm.cmd run verify:watch-mixed-collector-replacement-route
npm.cmd run verify:watch-discovery-acquisition-split-fixture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- focused HS374 verifier passed and printed actor, system/radius, held, and no-ref route samples
- HS368 and HS370 dependent fixture verifiers passed
- service registry verified
- command authority verified
- passive side-effect sweep verified
- enforcement dry-run verified with complete command coverage: 107/107 commands
- protected-term scan exited 0; warnings were advisory only, with no renames and no protected-word JSON updates
- `git diff --check` exited 0 with line-ending warnings only
- `git status --short --branch` reported `main...origin/main [ahead 19]` with existing dirty work plus HS374 additions

## Recommended Next Action

Overseer review HS374, then consider the next small proof around Discovery ESI-backed expansion intake from HS370/HS374 handoff candidates, still fixture-only and without Evidence/EVEidence writes, before any compatibility wrapper or collector retirement work is opened.
