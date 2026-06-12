# OverseerHS396 - HS395 Actor Watch Compatibility Wrapper Command Review

Status: accepted
Date: 2026-06-07
Role: Overseer

## Reviewed

- `workspace/OverseerHS395-actor-watch-compatibility-wrapper-command-runway.md`
- `workspace/DevHS395-actor-watch-compatibility-wrapper-command.md`
- `src/main/services/watchActorCompatibilityWrapperRuntimePreviewService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-watch-actor-compatibility-wrapper-runtime-preview.js`

## Decision

Accepted.

HS395 adds the explicit no-provider/no-write preview command:

```txt
watch.actor_compatibility_wrapper.preview
```

The command is a compatibility-wrapper preview only. It consumes old actor Watch payload shape, delegates to the accepted adapter fixture surface, returns the old caller-facing compatibility result posture, and discloses represented, approximate, not-represented, and parked old result fields.

## Acceptance Notes

- `actor.watch` remains the direct runtime entry point and still routes through `runActorWatchService(...)`.
- `runActorWatchService(...)` still calls `collectActorWatch(...)`.
- scheduled actor Watch dispatch still uses `watchExecutor.dispatchFor(actor) -> actor.watch` with `collectActorWatch` as current runner.
- the new wrapper preview does not import or invoke `actorWatchCollector.js`.
- the command reports zero provider calls and table-count equality before/after invocation.
- old mixed collector language is marked compatibility-only, not future doctrine.
- `collectActorWatch` remains a retire candidate only; it was not redirected, rewritten, or retired.

## Boundaries Preserved

No zKill calls, ESI calls, live/API/provider movement, Discovery ref writes, Evidence/EVEidence writes, Hydration writes, Observation output, Assessment writes, Watch cadence/state mutation, schema changes, runtime enforcement activation, command blocking, renderer UI work, support artifacts, source-term rename, or protected-word JSON update were added.

## Verification

Passed:

```txt
node --check src\main\services\watchActorCompatibilityWrapperRuntimePreviewService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-watch-actor-compatibility-wrapper-runtime-preview.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:watch-actor-compatibility-wrapper-adapter-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
npm.cmd run verify:watch-actor-replacement-parity
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

Notes:

- `verify:service-registry` passed with the expected long runtime.
- `verify:enforcement-dry-run` reported 113 commands covered and 0 gaps, including the new wrapper command as read-only non-enforcing proof.
- `verify:protected-terms` was warning-only and performed no renames or protected-word JSON updates.
- `git diff --check` exited 0 with CRLF normalization warnings only.
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the existing broad HS356-HS395 working set.

## Next Posture

Do not redirect `actor.watch` yet.

Recommended next seam is an advisory/source trace of the reusable helper surfaces currently sitting around the old mixed runtime and emerging Discovery/Evidence boundaries. The purpose is to classify ownership and risk before runtime redirect or collector retirement.

