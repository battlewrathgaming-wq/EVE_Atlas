# Overseer HS212 Runtime Hook Watch/Task Runtime Fact Preview Runway

Status: opened
Date: 2026-06-02
Project: AURA Atlas
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev

## Purpose

Close the main HS210 readiness gap by adding read-only, non-enforcing Watch/task runtime fact posture to the inactive runtime enforcement hook preview.

This is another proof seam, not enforcement activation.

## Read

- `AGENTS.md`
- `workspace/overview.md`
- `workspace/current.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-assets.md`
- `workspace/critical/critical-terms.md`
- `workspace/EngineeringSafetyAuditHS210-runtime-enforcement-readiness-review.md`
- `workspace/OverseerHS211-hs210-runtime-enforcement-readiness-review.md`
- `src/main/services/serviceRegistry.js`
- `src/main/services/runtimeEnforcementDryAdapter.js`
- `src/main/services/runtimeHookTelemetryReadoutService.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/gateStackReadoutService.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/services/taskRunner.js`
- `scripts/verify-runtime-enforcement-hook.js`
- `scripts/verify-runtime-hook-telemetry.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-watch-executor.js`
- `scripts/verify-watch-offline-readout.js`
- `package.json`

## Task

Add compact, read-only `watch_runtime` fact sourcing to the inactive runtime enforcement hook preview.

Preferred outcome:

- `actor.watch`, `system.radius.watch`, `watch.executor.arm`, and `watch.executor.tick` receive explicit Watch/task runtime posture.
- Non-Watch commands report not-applicable Watch posture.
- Missing or malformed Watch/task state is reported as posture rather than guessed.
- Supplied `runtimeEnforcementFacts.watch_runtime` remains preserved and is not overwritten.
- The inactive dry adapter no longer reports `watch_runtime` missing for covered Watch/background commands when sourced posture is available.
- Runtime hook telemetry can show `watch_runtime` as a sourced broad fact class when present.
- Active runtime enforcement remains false.

Use existing local readout/state only. Prefer current Watch executor/status/readout/task-runner posture already available in the codebase. If exact active-task facts are not available, report that limitation explicitly instead of inventing state.

## Preserve

- no active runtime enforcement
- no command blocking
- no handler dispatch from the hook
- no task wrapping or task execution from the hook
- no provider calls
- no provider attempt recording
- no service-memory cooldown/lockout mutation from the hook
- no Watch arming/disarming/tick execution from the hook
- no Watch mutation
- no DB writes
- no config writes
- no support artifact creation
- no snapshot or trace-pack creation
- no storage movement or migration
- no Hydration writes
- no Evidence/EVEidence creation
- no Discovery ref mutation
- no Assessment Memory or Marked mutation
- no schema changes
- no renderer UI work
- no pruning or deletion behavior
- no terminology renames

## Stop If

Stop if the proof requires active command blocking, runtime authorization, calling target handlers from the hook, task dispatch or task wrapping from the hook, provider calls, provider attempt recording, service-memory cooldown/lockout mutation, Watch mutation, DB writes, config writes, support artifact creation, schema changes, UI work, treating `watch_runtime` as may-run-now authorization, guessing missing Watch/task state, or changing Watch execution behavior.

## Verification Expectations

Run the focused local verification that exists in `package.json`, likely:

```txt
node --check src\main\services\serviceRegistry.js
node --check src\main\services\runtimeEnforcementDryAdapter.js
node --check src\main\services\runtimeHookTelemetryReadoutService.js
node --check scripts\verify-runtime-enforcement-hook.js
node --check scripts\verify-runtime-hook-telemetry.js
npm.cmd run verify:runtime-enforcement-hook
npm.cmd run verify:runtime-hook-telemetry
npm.cmd run verify:runtime-enforcement-adapter
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:task-runner
npm.cmd run verify:task-concurrency
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Adjust only if a named script does not exist; if adjusted, state why and run the nearest available verifier.

## Expected Handoff

Create:

```txt
workspace/DevHS212-runtime-hook-watch-task-runtime-fact-preview.md
```

The handoff must include:

- files changed
- Watch/task runtime fact shape added
- commands covered
- limitations or not-applicable posture
- proof that the hook remains inactive and behavior-preserving
- verification commands and results
- boundaries preserved
