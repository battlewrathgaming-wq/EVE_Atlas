# AURA Atlas Current Work

Status: HS174 Runtime hook telemetry readout runway open
Last updated: 2026-06-01

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: make inactive runtime hook preview evidence inspectable without enabling enforcement or adding broad fact sourcing.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS174-runtime-hook-telemetry-readout.md
```

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
- HS174 selects hook telemetry/readout as the next seam before sourcing riskier fact classes.

Human / Overseer direction:

- continue system hardening before UI/body work
- do cheap proof and assurance before expensive implementation
- one seam at a time
- do not drift into broad architecture or hidden active behavior
- active runtime blocking remains out of scope

Accepted interpretation:

- Atlas is still not ready for active runtime blocking.
- Atlas now has a non-blocking live service-boundary preview hook.
- The hook now sources one safe canonical fact class: command classification coverage.
- Remaining canonical facts are riskier because they involve storage, config, DB, provider/live, Watch/task, path, or runtime state.
- Before sourcing those, Atlas should make inactive hook preview evidence easier to inspect.

Accepted source material:

- `workspace/OverseerHS171-hs170-inactive-service-boundary-hook-review.md`
- `workspace/OverseerHS173-hs172-runtime-hook-coverage-fact-review.md`
- `workspace/OverseerHS174-runtime-hook-telemetry-readout-runway.md`
- `workspace/DevHS170-inactive-service-boundary-hook.md`
- `workspace/DevHS172-runtime-hook-coverage-fact.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `src/main/services/serviceRegistry.js`
- `src/main/services/runtimeEnforcementDryAdapter.js`
- `src/main/services/runtimeEnforcementEvaluator.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-runtime-enforcement-hook.js`

## Current State

HS142, HS144, HS146, HS148, HS150, HS152, HS154, HS156, HS158, HS160, HS162, HS164, HS166, HS168, HS170, and HS172 are accepted.

No active runtime enforcement exists yet.

Accepted live service boundary:

- `src/main/services/serviceRegistry.js`
- `invokeServiceCommand(command, payload, context)`
- order: validate envelope, resolve command, require DB, renderer eligibility, confirmation authority, inactive runtime enforcement preview hook, optional task wrapping, then handler dispatch

Accepted HS172 facts:

- `serviceRegistry.js` imports the existing in-memory `COMMAND_ENFORCEMENT_COVERAGE` map.
- `runtimeEnforcementFactsFor(command, context)` attaches only current-command coverage when no explicit `coverage` key exists.
- Command-scoped supplied facts are preserved.
- Whole-context supplied facts are preserved.
- Explicit supplied `coverage`, including `coverage: null`, is not overwritten.
- Missing coverage remains visible as missing classification coverage.
- No storage authority, budget, External I/O, provider/live gate, destination/path, Watch/task, DB, config, or runtime state facts are sourced.
- The hook remains inactive, non-blocking, and behavior-preserving.

## Active Runway

Add a read-only telemetry/readout proof for inactive runtime hook previews.

Ordered steps:

1. Read the accepted source material and inspect the HS170/HS172 hook.
2. Add a small readout helper or service surface that summarizes inactive runtime hook preview objects.
3. The readout may operate on explicitly supplied preview objects or on previews captured by an explicit trusted test/diagnostic observer.
4. If runtime capture is added, it must be explicit, bounded, in-memory only, and opt-in; no default capture side effect should be added to ordinary command execution unless the implementation proves it is harmless and bounded.
5. The readout should show:
   - command
   - source
   - evaluator decision
   - missing fact classes
   - whether coverage was sourced
   - whether broad fact classes are absent
   - whether active enforcement is false
   - whether preview-only is true
   - whether dry-run `would_allow` is non-authorizing
   - whether External I/O on is non-authorizing
6. The readout must not call providers, DB readouts, config readbacks, repositories, task runners, file writers, config writers, mutating services, or target handlers.
7. The readout must not create support artifacts, snapshots, trace packs, storage files, logs, or persisted telemetry.
8. The hook must remain non-blocking and behavior-preserving.
9. Do not source any new canonical fact class in this packet beyond the already accepted command coverage.
10. Add focused verification proving:
   - readout summarizes supplied/captured previews
   - readout handles empty preview input
   - readout reports missing fact classes without treating them as failures
   - readout reports coverage sourced versus coverage missing/null
   - no broad fact classes are sourced
   - no persistence or support artifacts are created
   - command behavior remains unchanged
   - renderer-ineligible and missing-confirmation commands still stop before the hook
   - hook still does not block or authorize
11. Update Evidence / Dev Handoff and create the expected DevHS file.

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
- No support artifact creation.
- No runtime snapshot creation.
- No trace-pack creation.
- No cleanup, deletion, pruning, restore, move, copy, migration, upload, or packaging.
- No schema migration.
- No renderer redesign or UI wording work.
- Do not source storage authority facts.
- Do not source storage budget facts.
- Do not source External I/O facts.
- Do not source provider/live gate facts.
- Do not source Watch/task runtime facts.
- Do not source destination/path authority facts.
- Do not source DB/config/runtime state facts.
- Do not persist telemetry.
- Do not promote dry-run `would_allow` into authorization.
- Do not treat External I/O on as authorization.
- Do not treat trusted/internal confirmation bypass as confirmation satisfaction.
- Do not activate unknown/unclassified fail-closed behavior.

## Stop Conditions

Stop and return to Overseer/Human if:

- telemetry/readout requires DB/config/provider/runtime reads
- telemetry requires persistence
- telemetry requires support artifact creation
- the hook would need to block, throw, or alter dispatch
- the hook would change trusted/internal confirmation behavior
- the hook would change renderer confirmation behavior
- the implementation starts sourcing new fact classes
- the implementation starts becoming active enforcement

## Required Verification

Run syntax checks for every changed JavaScript file.

Run:

```powershell
node --check src\main\services\serviceRegistry.js
node --check src\main\services\runtimeEnforcementDryAdapter.js
node --check src\main\services\runtimeEnforcementEvaluator.js
node --check scripts\verify-runtime-enforcement-hook.js
node --check scripts\verify-runtime-enforcement-adapter.js
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

If Dev adds a focused verifier for telemetry/readout, run it and list it in the handoff.

No live/API/provider verification is authorized.

## Evidence

HS174 opened as Dev runway.

No implementation evidence yet.

## Dev Handoff

Expected Dev handoff:

- `workspace/DevHS174-runtime-hook-telemetry-readout.md`

Latest accepted Overseer review:

- `workspace/OverseerHS173-hs172-runtime-hook-coverage-fact-review.md`
