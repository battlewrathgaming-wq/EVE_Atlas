# AURA Atlas Current Work

Status: HS172 Runtime hook coverage fact runway open
Last updated: 2026-06-01

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: close one missing runtime-enforcement fact class safely by sourcing command classification coverage inside the inactive service-boundary hook.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS172-runtime-hook-coverage-fact.md
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
- HS172 selects command classification coverage as the first canonical read-only fact class to source inside the hook.

Human / Overseer direction:

- continue system hardening before UI/body work
- do cheap proof and assurance before expensive implementation
- one seam at a time
- do not drift into broad architecture or hidden active behavior
- active runtime blocking remains out of scope

Accepted interpretation:

- Atlas is still not ready for active runtime blocking.
- Atlas now has a non-blocking live service-boundary preview hook.
- The next seam should close exactly one safe missing fact class.
- Command classification coverage is the safest first fact class because it is already an in-memory classification map.
- This packet should not source storage, budget, External I/O, provider/live gate, Watch/task, destination/path, DB, config, or runtime state facts.

Accepted source material:

- `workspace/OverseerHS171-hs170-inactive-service-boundary-hook-review.md`
- `workspace/OverseerHS172-runtime-hook-coverage-fact-runway.md`
- `workspace/DevHS170-inactive-service-boundary-hook.md`
- `workspace/EngineeringSafetyAuditHS168-runtime-enforcement-activation-readiness.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `src/main/services/serviceRegistry.js`
- `src/main/services/runtimeEnforcementDryAdapter.js`
- `src/main/services/runtimeEnforcementEvaluator.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-runtime-enforcement-hook.js`
- `scripts/verify-runtime-enforcement-adapter.js`
- `scripts/verify-enforcement-dry-run.js`

## Current State

HS142, HS144, HS146, HS148, HS150, HS152, HS154, HS156, HS158, HS160, HS162, HS164, HS166, HS168, and HS170 are accepted.

No active runtime enforcement exists yet.

Accepted live service boundary:

- `src/main/services/serviceRegistry.js`
- `invokeServiceCommand(command, payload, context)`
- order: validate envelope, resolve command, require DB, renderer eligibility, confirmation authority, inactive runtime enforcement preview hook, optional task wrapping, then handler dispatch

Accepted HS170 facts:

- The inactive hook runs after existing renderer eligibility and confirmation checks.
- The inactive hook runs before task wrapping and handler dispatch.
- The inactive hook uses the dry adapter/evaluator path.
- The inactive hook may use explicitly supplied trusted `context.runtimeEnforcementFacts` / `context.runtime_enforcement_facts`.
- The inactive hook may report preview data to an optional trusted observer.
- Observer failure does not affect command behavior.
- The inactive hook does not block, authorize, dispatch differently, alter payload, alter handler result, alter task wrapping, or activate unknown/unclassified fail-closed.
- The inactive hook does not source broad canonical facts.

## Active Runway

Source command classification coverage inside the inactive service-boundary hook.

Ordered steps:

1. Read the accepted source material and inspect the HS170 hook.
2. Import or otherwise access the existing command enforcement coverage map/report in a read-only way.
3. When the inactive hook builds preview facts, attach coverage for the current command from the existing coverage map.
4. Preserve explicitly supplied `context.runtimeEnforcementFacts` / `context.runtime_enforcement_facts`.
5. If supplied facts already include coverage, do not overwrite them unless the implementation clearly documents and tests the merge order.
6. If coverage is missing for a known command, report it as missing classification coverage; do not invent coverage.
7. Do not source any other canonical fact class in this packet.
8. Do not call readout builders, config readbacks, DB readouts, providers, repositories, task runners, file writers, config writers, or mutating services.
9. Keep the hook non-blocking and behavior-preserving.
10. Add focused verification proving:
   - the hook preview includes coverage for a covered known command without context-supplied facts
   - context-supplied facts are preserved
   - supplied coverage is not silently overwritten, or merge order is explicitly proven
   - missing coverage remains a visible missing fact class
   - no storage, budget, External I/O, provider/live gate, destination/path, Watch/task, DB, config, or runtime state facts are sourced
   - command behavior is unchanged
   - renderer-ineligible and missing-confirmation commands still stop before the hook
   - the hook still does not block or authorize
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
- Do not promote dry-run `would_allow` into authorization.
- Do not treat External I/O on as authorization.
- Do not treat trusted/internal confirmation bypass as confirmation satisfaction.
- Do not activate unknown/unclassified fail-closed behavior.

## Stop Conditions

Stop and return to Overseer/Human if:

- command coverage cannot be sourced without importing a side-effectful module
- sourcing coverage requires DB/config/provider/runtime reads
- the hook would need to block, throw, or alter dispatch
- the hook would change trusted/internal confirmation behavior
- the hook would change renderer confirmation behavior
- the implementation starts sourcing more than command coverage
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

If Dev adds a focused verifier for coverage fact sourcing, run it and list it in the handoff.

No live/API/provider verification is authorized.

## Evidence

HS172 opened as Dev runway.

No implementation evidence yet.

## Dev Handoff

Expected Dev handoff:

- `workspace/DevHS172-runtime-hook-coverage-fact.md`

Latest accepted Overseer review:

- `workspace/OverseerHS171-hs170-inactive-service-boundary-hook-review.md`
