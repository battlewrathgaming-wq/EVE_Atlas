# Overseer HS209 - HS208 Runtime Hook Destination Path Authority Review

Status: accepted
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening

## Reviewed Handoff

```txt
workspace/DevHS208-runtime-hook-destination-path-authority-fact-preview.md
```

## Decision

Accepted.

HS208 adds compact, read-only `destination_path_authority` fact sourcing to the inactive runtime enforcement hook preview for mapped support-artifact commands.

The implementation preserves the important boundary:

- destination/path authority is preview posture only
- destination/path authority is not runtime authorization
- renderer path claims are ignored and not echoed in hook facts
- support artifact creation remains unopened
- runtime enforcement remains inactive
- command blocking remains unopened

## Accepted Behavior

Accepted:

- `runtime.db_snapshot.create` maps to:
  - `runtime_snapshot_rolling`
  - `runtime_snapshot_retained`
- `support.debug_trace_pack` maps to:
  - `operator_debug_trace_pack`
- commands without support-artifact destination needs report not-applicable posture
- mapped facts include compact class summaries without raw path inventory
- supplied `runtimeEnforcementFacts.destination_path_authority` is preserved and not overwritten
- runtime hook telemetry now reports `destination_path_authority` as sourced

## Verification Run

Overseer verified:

```powershell
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-runtime-enforcement-hook.js
npm.cmd run verify:runtime-enforcement-hook
npm.cmd run verify:runtime-hook-telemetry
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:support-artifact-creation-policy
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:operator-debug-trace
npm.cmd run verify:support-trace-log-redaction-policy
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
node --check src\main\services\runtimeEnforcementDryAdapter.js
node --check src\main\services\runtimeHookTelemetryReadoutService.js
node --check src\main\services\supportArtifactPathAuthorityService.js
node --check scripts\verify-support-artifact-path-authority.js
```

Result:

- all available verification commands passed
- `verify:protected-terms` completed with warning-only advisory output: 289 warnings across 5 changed working-set files; no renames or protected-word JSON updates performed
- `git diff --check` passed with CRLF normalization warnings only

Verifier note:

- HS208's runway listed `verify:trace-pack-redaction`, but `package.json` does not define that script.
- Dev correctly ran the available trace-pack/redaction verifiers instead:
  - `npm.cmd run verify:operator-debug-trace`
  - `npm.cmd run verify:support-trace-log-redaction-policy`

## Boundaries Preserved

- no active runtime enforcement
- no command blocking
- no target handler dispatch from the hook
- no task wrapping or task execution from the hook
- no provider calls
- no provider attempt recording
- no service-memory cooldown/lockout mutation from the hook
- no support artifact creation from the hook
- no snapshot creation from the hook
- no trace-pack creation from the hook
- no file or directory creation from the hook
- no filesystem deletion/move/copy
- no SDE download/import
- no Hydration writes
- no Evidence/EVEidence creation
- no Discovery ref mutation
- no Watch, Assessment Memory, or Marked mutation
- no schema changes
- no config writes
- no storage movement or migration
- no renderer UI work
- no pruning or deletion behavior

## Resting State

HS208 can rest.

The inactive runtime hook now sources:

- command classification coverage
- storage authority
- storage budget
- External I/O
- provider/live gate posture
- compact composed policy posture
- compact destination/path authority posture

Still separate / unopened:

- Watch/task runtime fact sourcing
- active runtime enforcement
- command blocking

Recommended next options:

1. Rest runtime hook fact sourcing and move to another storage/runtime seam.
2. Request engineering/security readiness review before any active runtime enforcement packet.
3. Shape Watch/task runtime fact sourcing only if the runtime hook proof line continues and Human/Overseer agree it is needed before readiness review.
