# Overseer HS216 Runtime Enforcement Active Semantics Fixture Matrix Runway

Status: opened
Date: 2026-06-02
Project: AURA Atlas
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev

## Purpose

Create a pure/non-blocking active runtime enforcement semantics fixture matrix.

This packet should define and verify active decision semantics before any command blocking implementation is considered.

## Read

- `AGENTS.md`
- `workspace/overview.md`
- `workspace/current.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-assets.md`
- `workspace/critical/critical-terms.md`
- `workspace/EngineeringSafetyAuditHS214-runtime-enforcement-semantics-design.md`
- `workspace/OverseerHS215-hs214-runtime-enforcement-semantics-review.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/features/data-layer-boundaries.md`
- `src/main/services/runtimeEnforcementEvaluator.js`
- `src/main/services/runtimeEnforcementDryAdapter.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/composedGatePolicyService.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/gateStackReadoutService.js`
- `package.json`

## Task

Add a pure active runtime enforcement semantics fixture matrix, preferably as a new read-only/pure service module plus verifier.

Suggested command/action name:

```txt
runtime.enforcement_active_semantics.preview
```

Preferred outcome:

- define active decision meanings for `pass`, `block`, `hold`, `conditional`, `unknown`, `stop_before_boundary`, missing facts, malformed facts, stale facts, and spoofed facts
- define mandatory fact families by command family
- define first-active excluded command families
- prove `conditional` and `hold` do not dispatch
- prove `hold` is non-failure and non-mutating
- prove missing/malformed/spoofed mandatory facts cannot silently pass
- prove renderer-origin authority facts are ignored/rejected
- prove trusted supplied facts are allowed only under explicit trusted/test posture
- prove External I/O on, dry-run `would_allow`, provider `allowed`, Watch arming, and destination/path authority are each non-authorizing alone
- prove fixture/proof and destructive execution commands cannot active-pass in production semantics

This proof must not insert anything into `invokeServiceCommand`.

## Preserve

- no active runtime enforcement
- no command blocking
- no insertion into `invokeServiceCommand`
- no handler dispatch from the semantics proof
- no task wrapping or task execution
- no provider calls
- no provider attempt recording
- no service-memory cooldown/lockout mutation
- no Watch arming/disarming/tick execution
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

Stop if the proof requires active command blocking, runtime authorization, insertion into `invokeServiceCommand`, calling target handlers, task dispatch or task wrapping, provider calls, provider attempt recording, service-memory cooldown/lockout mutation, Watch mutation, DB writes, config writes, support artifact creation, schema changes, UI work, treating any single preview fact as authorization, or broad global enforcement semantics.

## Verification Expectations

Add and run a focused verifier for the new semantics matrix, likely:

```txt
npm.cmd run verify:runtime-enforcement-active-semantics
```

Also run:

```txt
node --check <new service/module>
node --check <new verifier>
npm.cmd run verify:runtime-enforcement-adapter
npm.cmd run verify:runtime-enforcement-hook
npm.cmd run verify:runtime-hook-telemetry
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:gate-stack-readout
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
workspace/DevHS216-runtime-enforcement-active-semantics-fixture-matrix.md
```

The handoff must include:

- files changed
- semantics matrix shape
- command families covered
- first-active exclusions
- trusted fact supply treatment
- proof that this does not insert active enforcement or command blocking
- verification commands and results
- boundaries preserved
