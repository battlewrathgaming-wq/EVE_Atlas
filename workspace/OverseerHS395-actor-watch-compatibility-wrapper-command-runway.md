# OverseerHS395 - Actor Watch Compatibility Wrapper Command Runway

Status: open
Date: 2026-06-07
Role: Overseer
Executor: Dev

## Purpose

Add a narrow explicit no-provider actor Watch compatibility-wrapper command/path before any default `actor.watch` redirect, scheduled Watch redirect, live provider movement, or collector retirement.

This proves the wrapper can be called as runtime service code while preserving the old actor Watch command and scheduler behavior.

## Command

Add a new explicit preview command:

```txt
watch.actor_compatibility_wrapper.preview
```

This is a temporary compatibility surface. It does not rename or redefine the future Watch/Discovery boundary.

## Task

Create a callable service command that:

- accepts old actor Watch payload shape
- uses already-proven boundary-owned fixture/adapter surfaces, especially HS383 adapter mapping
- returns old caller-facing compatibility result shape
- marks output as no-provider / no-write / compatibility-wrapper preview
- exposes represented, approximate, not-represented, and parked old result fields
- proves existing `actor.watch` runtime remains unchanged
- proves scheduled actor Watch dispatch remains unchanged

The command may reuse:

- `watchActorCompatibilityWrapperAdapterFixtureService`
- `watchActorCompatibilityWrapperContractService`
- `watchActorReplacementParityService`
- `discoveryAcquisitionToEvidenceHandoffFixtureService`
- `discoveryEsiExpansionIntakePostureService`
- Evidence writer fixture proof only as represented proof basis, not as runtime corpus mutation

## Must Not Change

Do not change:

- `actor.watch` handler
- `runActorWatchService(...)`
- `collectActorWatch(...)`
- `watchExecutor.dispatchFor(...)`
- scheduled Watch task result handling
- system/radius Watch behavior
- provider clients
- schema
- renderer UI

## Boundaries

No:

- zKill calls
- ESI calls
- live/API/provider movement
- Discovery ref writes
- Evidence/EVEidence writes
- Hydration/metadata behavior
- Observation/report output
- Assessment writes
- Watch cadence/state mutation
- mixed collector invocation/rewrite/retirement
- dispatchers, queues, leases, or workers
- runtime enforcement activation or command blocking
- support artifact behavior
- source-term rename
- protected-word JSON update

## Required Proofs

The verifier should prove:

- the new command exists and is read-only/no-provider/no-write
- `actor.watch` still resolves to `runActorWatchService(...)`
- `runActorWatchService(...)` still calls `collectActorWatch(...)`
- `watchExecutor.dispatchFor(actor)` still returns command `actor.watch` and runner `collectActorWatch`
- the new wrapper command does not import or invoke `actorWatchCollector.js`
- no provider clients are invoked
- durable Atlas table counts are unchanged before/after
- old caller-facing fields are represented or explicitly disclosed as approximate/not represented/parked
- old mixed terminology is clearly compatibility/legacy only, not future doctrine

## Suggested Files

Likely touched:

- `src/main/services/watchActorCompatibilityWrapperRuntimePreviewService.js` or similarly named service
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-watch-actor-compatibility-wrapper-runtime-preview.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `workspace/DevHS395-actor-watch-compatibility-wrapper-command.md`

Use a clearer filename if Dev prefers, but keep the command explicit and no-provider.

## Verification

Run focused checks:

```txt
node --check src\main\services\watchActorCompatibilityWrapperRuntimePreviewService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-watch-actor-compatibility-wrapper-runtime-preview.js
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:watch-actor-compatibility-wrapper-adapter-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
npm.cmd run verify:watch-actor-replacement-parity
```

Run boundary checks:

```txt
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:evidence-rules
npm.cmd run verify:watch-executor
npm.cmd run verify:mutating-services
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If any implementation touches `actor.watch`, `runActorWatchService(...)`, `collectActorWatch(...)`, or `watchExecutor.dispatchFor(...)`, stop and route back to Overseer unless the change is a verifier assertion proving old behavior is preserved.

## Expected Handoff

Create:

```txt
workspace/DevHS395-actor-watch-compatibility-wrapper-command.md
```

The handoff should include:

- changed files
- command name and classification
- proof output
- verification commands and results
- explicit old-runtime-preserved checks
- boundary confirmation

