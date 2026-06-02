# Overseer HS207 - HS206 Runtime Hook Composed Policy Review

Status: accepted
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening

## Reviewed Handoff

```txt
workspace/DevHS206-runtime-hook-composed-policy-fact-preview.md
```

## Decision

Accepted.

HS206 adds compact, read-only `composed_policy` fact sourcing to the inactive runtime enforcement hook preview.

The implementation preserves the important boundary:

- composed policy is preview posture only
- composed policy is not runtime authorization
- `would_allow`, `pass`, `conditional`, `hold`, and `block` do not answer "may run now"
- runtime enforcement remains inactive
- command blocking remains unopened

## Accepted Behavior

Accepted:

- mapped commands receive compact composed policy facts with:
  - matched row id
  - composed state
  - reason codes
  - compact gate summary
  - inactive enforcement/runtime authorization flags
  - `would_allow_is_authorization: false`
  - `answers_may_run_now: false`
- unmapped commands receive explicit `sourced_unmapped` posture rather than guessed authorization
- full composed policy rows are not dumped into every hook preview
- supplied `runtimeEnforcementFacts.composed_policy` is preserved and not overwritten
- runtime hook telemetry now reports `composed_policy` as sourced while still reporting separate unsourced broad facts such as `destination_path_authority`

## Verification Run

Overseer verified:

```powershell
node --check src\main\services\serviceRegistry.js
node --check src\main\services\runtimeHookTelemetryReadoutService.js
node --check scripts\verify-runtime-enforcement-hook.js
npm.cmd run verify:runtime-enforcement-hook
npm.cmd run verify:runtime-hook-telemetry
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Result:

- all verification commands passed
- `verify:protected-terms` completed with warning-only advisory output: 268 warnings across 6 changed working-set files; no renames or protected-word JSON updates performed
- `git diff --check` passed with CRLF normalization warnings only

## Boundaries Preserved

- no active runtime enforcement
- no command blocking
- no target handler dispatch from the hook
- no task wrapping or task execution from the hook
- no provider calls
- no provider attempt recording
- no service-memory cooldown/lockout mutation from the hook
- no SDE download/import
- no Hydration writes
- no Evidence/EVEidence creation
- no Discovery ref mutation
- no Watch, Assessment Memory, or Marked mutation
- no schema changes
- no support artifact creation
- no config writes
- no storage movement or migration
- no renderer UI work
- no pruning or deletion behavior

## Resting State

HS206 can rest.

The inactive runtime hook now sources:

- command classification coverage
- storage authority
- storage budget
- External I/O
- provider/live gate posture
- compact composed policy posture

Still separate / unopened:

- destination path authority fact sourcing
- Watch/task runtime fact sourcing
- active runtime enforcement
- command blocking

Recommended next options:

1. Rest runtime hook fact sourcing and move to another storage/runtime seam.
2. Shape destination path authority fact sourcing only if the runtime hook proof line continues.
3. Request engineering/security readiness review before any active runtime enforcement packet.
