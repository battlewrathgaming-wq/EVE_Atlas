# AURA Atlas Current Work

Status: Resting after accepting data-layer boundary support note
Last updated: 2026-06-01

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: preserve accepted runtime-enforcement proof surfaces and use the data-layer boundary note as the reference spine before the next storage/runtime seam.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Human / Overseer shaping

Expected handoff filename:

```txt
none
```

No active Dev runway is open.

## Source Of Intent

Recent accepted runtime-enforcement spine:

- HS148 proved composed gate policy preview.
- HS162 proved the runtime enforcement boundary preview.
- HS164 extracted the inactive pure runtime enforcement evaluator.
- HS166 proved dry service-boundary fact assembly for that evaluator.
- HS167 accepted HS166 after correcting trusted/internal confirmation-bypass semantics.
- HS168 audited activation readiness.
- HS169 accepted HS168.
- HS170 added the first inactive service-boundary hook.
- HS171 accepted HS170 after proof-language correction.
- HS172 sourced command classification coverage inside the inactive hook.
- HS173 accepted HS172.
- HS174 added read-only hook telemetry/readout.
- HS175 accepted HS174.

Human / Overseer direction:

- continue system hardening before UI/body work
- do cheap proof and assurance before expensive implementation
- one seam at a time
- do not drift into broad architecture or hidden active behavior
- active runtime blocking remains out of scope

Accepted interpretation:

- Atlas is still not ready for active runtime blocking.
- Atlas now has enough runtime-enforcement proof to rest this lane unless a fresh decision selects another fact class.
- Remaining canonical fact classes are riskier because they involve storage, config, DB, provider/live, Watch/task, path, or runtime state.
- Support artifact creation hardening is now the cleaner likely next lane if work continues.

Accepted source material:

- `workspace/DataAnalystHS151-data-intent-supporting-schemas.md`
- `workspace/DataAnalystHS152-current-gaps-and-milestone-slices.md`
- `docs/features/data-layer-boundaries.md`
- `workspace/OverseerHS171-hs170-inactive-service-boundary-hook-review.md`
- `workspace/OverseerHS173-hs172-runtime-hook-coverage-fact-review.md`
- `workspace/OverseerHS175-hs174-runtime-hook-telemetry-readout-review.md`
- `workspace/DevHS170-inactive-service-boundary-hook.md`
- `workspace/DevHS172-runtime-hook-coverage-fact.md`
- `workspace/DevHS174-runtime-hook-telemetry-readout.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `src/main/services/serviceRegistry.js`
- `src/main/services/runtimeHookTelemetryReadoutService.js`
- `src/main/services/runtimeEnforcementDryAdapter.js`
- `src/main/services/runtimeEnforcementEvaluator.js`
- `src/main/services/enforcementDryRunService.js`

## Current State

HS142, HS144, HS146, HS148, HS150, HS152, HS154, HS156, HS158, HS160, HS162, HS164, HS166, HS168, HS170, HS172, and HS174 are accepted.

No active runtime enforcement exists yet.

Accepted data-layer boundary support:

- `docs/features/data-layer-boundaries.md`
- Discovery Ref is a stored possible lead/provenance form, not Evidence/EVEidence.
- ESI Evidence Expansion creates Evidence/EVEidence from a Discovery Ref and the ESI killmail endpoint.
- Hydration is readability repair after local facts exist; it is not ESI Evidence Expansion.
- Watch is operational acquisition intent.
- Observation is the Atlas product layer that computes and collates local records into an operator-facing story; it is not a required UI pane.
- Relationships group appearances/anchors to keep context, provenance, and basis coherent; computed grouping is not new Evidence/EVEidence.

Accepted runtime-enforcement proof surfaces:

- `runtime.enforcement_boundary.preview`
- `runtimeEnforcementEvaluator.evaluateRuntimeEnforcementDecision`
- `runtime.enforcement_adapter.dry_preview`
- inactive hook in `invokeServiceCommand`
- command classification coverage fact in the inactive hook
- `runtime.enforcement_hook_telemetry.readout`

Accepted live service boundary:

- `src/main/services/serviceRegistry.js`
- `invokeServiceCommand(command, payload, context)`
- order: validate envelope, resolve command, require DB, renderer eligibility, confirmation authority, inactive runtime enforcement preview hook, optional task wrapping, then handler dispatch

Accepted HS174 facts:

- `runtimeHookTelemetryReadoutService` is pure and summarizes supplied preview objects.
- `runtime.enforcement_hook_telemetry.readout` is a read-only renderer-eligible service command.
- The readout accepts explicit preview object(s) via `preview` or `previews`.
- The readout does not capture runtime telemetry by default.
- The readout does not persist telemetry.
- The readout does not create support artifacts, snapshots, trace packs, storage files, or logs.
- The readout does not call providers, repositories, task runners, file writers, config writers, mutating services, DB readouts, config readbacks, or target handlers.
- No new canonical fact class was sourced beyond accepted command classification coverage.

## Resting State

No implementation packet is open.

Likely next shaping candidates:

1. Use the data-layer boundary note to audit the next storage/runtime seam before Dev work.
2. Pause runtime enforcement and continue support artifact creation hardening only after confirming what the artifact must preserve.
3. Consider Hydration candidate or patient packet preview only when that seam is deliberately opened.
4. Keep runtime enforcement resting until a stronger need for active blocking appears.

Do not jump directly to active runtime blocking.

## Guardrails

- No active runtime enforcement.
- No command blocking.
- No command interception that changes behavior.
- No command dispatch change.
- No handler result change.
- No task wrapping change.
- No provider calls.
- No zKill calls.
- No ESI calls.
- No SDE download calls.
- No Evidence/EVEidence writes.
- No Discovery ref mutation.
- No Hydration writes.
- No storage config writes.
- No support artifact creation unless explicitly opened as the next lane.
- No runtime snapshot creation unless explicitly opened as the next lane.
- No trace-pack creation unless explicitly opened as the next lane.
- No cleanup, deletion, pruning, restore, move, copy, migration, upload, or packaging.
- No schema migration.
- No renderer redesign or UI wording work.
- Do not source storage authority facts without a new runway.
- Do not source storage budget facts without a new runway.
- Do not source External I/O facts without a new runway.
- Do not source provider/live gate facts without a new runway.
- Do not source Watch/task runtime facts without a new runway.
- Do not source destination/path authority facts without a new runway.
- Do not source DB/config/runtime state facts without a new runway.
- Do not persist telemetry.
- Do not promote dry-run `would_allow` into authorization.
- Do not treat External I/O on as authorization.
- Do not treat trusted/internal confirmation bypass as confirmation satisfaction.
- Do not activate unknown/unclassified fail-closed behavior.

## Required Verification

Latest accepted HS174 verification:

```powershell
node --check src\main\services\serviceRegistry.js
node --check src\main\services\runtimeHookTelemetryReadoutService.js
node --check src\main\services\enforcementDryRunService.js
node --check src\main\services\runtimeEnforcementDryAdapter.js
node --check src\main\services\runtimeEnforcementEvaluator.js
node --check scripts\verify-runtime-hook-telemetry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-runtime-enforcement-hook.js
node --check scripts\verify-runtime-enforcement-adapter.js
npm.cmd run verify:runtime-hook-telemetry
npm.cmd run verify:runtime-enforcement-hook
npm.cmd run verify:runtime-enforcement-adapter
npm.cmd run verify:runtime-enforcement-evaluator
npm.cmd run verify:runtime-enforcement-boundary
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

`verify:protected-terms` completed exit code 0 with advisory warnings only; no protected-term JSON updates or renames were performed.

## Evidence

HS174 Dev implementation accepted after Overseer review.

Data-layer advisory material accepted into durable support note:

- `workspace/DataAnalystHS151-data-intent-supporting-schemas.md`
- `workspace/DataAnalystHS152-current-gaps-and-milestone-slices.md`
- `docs/features/data-layer-boundaries.md`

Accepted Dev handoff:

- `workspace/DevHS174-runtime-hook-telemetry-readout.md`

Latest Overseer review:

- `workspace/OverseerHS175-hs174-runtime-hook-telemetry-readout-review.md`

## Dev Handoff

No Dev handoff expected.

No active Dev runway is open.
