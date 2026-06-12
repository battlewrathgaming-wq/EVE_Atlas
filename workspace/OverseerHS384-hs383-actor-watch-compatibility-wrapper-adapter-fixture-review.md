# OverseerHS384 - HS383 Actor Watch Compatibility Wrapper Adapter Fixture Review

Status: accepted
Date: 2026-06-07
Role: Overseer

## Reviewed

- `workspace/OverseerHS383-actor-watch-compatibility-wrapper-adapter-fixture-runway.md`
- `workspace/DevHS383-actor-watch-compatibility-wrapper-adapter-fixture.md`
- `src/main/services/watchActorCompatibilityWrapperAdapterFixtureService.js`
- `scripts/verify-watch-actor-compatibility-wrapper-adapter-fixture.js`
- registry, authority, passive side-effect, and dry-run updates for the new command

## Result

HS383 is accepted.

The new proof command is:

```txt
watch.actor_compatibility_wrapper_adapter_fixture.preview
```

The proof constructs an old caller-facing actor Watch result fixture from boundary-owned fixture outputs while keeping current runtime behavior unchanged.

Accepted shape:

- adapter status is `adapter_fixture_only_not_active`
- old entry point remains `actor.watch`
- HS381 contract remains the source contract basis
- old caller-facing result fields are represented in fixture form
- old collector compatibility is split into represented, approximate, not represented, and parked categories
- candidate refs remain possible leads, not Evidence/EVEidence
- ESI-backed killmail/detail expansion remains Discovery-owned provider movement, not Hydration
- Evidence/EVEidence writer boundary is represented but not invoked
- Watch cadence/receipt handling is represented but not mutated

## Boundary Check

Accepted preserved boundaries:

- no `actor.watch` redirect
- no `runActorWatchService(...)` runtime behavior change
- no `watchExecutor.dispatchFor(...)` runtime behavior change
- no `collectActorWatch(...)` invocation, change, or retirement
- no system/radius behavior change
- no zKill, ESI, provider, or live/API calls
- no Discovery ref writes
- no Evidence/EVEidence writes
- no Hydration/metadata writes
- no API log, warning, `fetch_runs`, Watch run, or Watch cadence writes
- no DB mutation during preview
- no schema, tasks, queues, dispatchers, leases, workers, UI, enforcement, command blocking, support artifacts, source-term rename, or protected-word JSON update

## Verification

Overseer re-ran:

```txt
node --check src\main\services\watchActorCompatibilityWrapperAdapterFixtureService.js
node --check scripts\verify-watch-actor-compatibility-wrapper-adapter-fixture.js
npm.cmd run verify:watch-actor-compatibility-wrapper-adapter-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:discovery-esi-expansion-intake-posture
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

- all focused and cross-cutting verification commands exited 0
- `verify:protected-terms` exited 0 with warning-only advisory output; no renames or protected-word JSON updates were performed
- `git diff --check` exited 0 with line-ending warnings only
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the expected uncommitted Discovery/Watch proof-chain working tree plus HS383/HS384 state

## Remaining Limits

This is not yet a runtime adapter.

Still parked:

- actual `actor.watch` redirect
- `runActorWatchService(...)` runtime replacement
- `watchExecutor.dispatchFor(...)` runtime replacement
- `collectActorWatch(...)` retirement
- live zKill acquisition
- live ESI-backed expansion
- durable Discovery ref persistence through the replacement path
- Evidence/EVEidence writer landing through the replacement path
- Watch cadence mutation from Discovery receipt
- system/radius compatibility adapter behavior

## Resting State

HS383 is accepted. No Dev runway is open.

Recommended next options:

1. Source-trace or design the first minimal runtime adapter seam before any redirect.
2. Prove Evidence/EVEidence writer landing package fixture before runtime adapter work.
3. Pause Dev and run boundary cleanup/audit across the Discovery replacement chain before selecting the next implementation seam.
