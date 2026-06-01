# AURA Atlas Current Work

Status: HS170 Inactive service-boundary hook runway open
Last updated: 2026-06-01

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: prove the live service boundary can call an inactive runtime-enforcement preview hook without changing command behavior.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS170-inactive-service-boundary-hook.md
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
- HS170 accepts the first inactive service-boundary hook as a bounded Dev seam.

Human / Overseer direction:

- continue system hardening before UI/body work
- do cheap proof and assurance before expensive implementation
- one seam at a time
- do not drift into broad architecture or hidden active behavior
- active runtime blocking remains out of scope

Accepted interpretation:

- Atlas is not ready for active runtime blocking.
- Atlas is ready for boundary plumbing proof only.
- Dev may touch `src/main/services/serviceRegistry.js` for this packet.
- The hook must be non-blocking and behavior-preserving.
- The hook should run for every known command that reaches the accepted boundary.
- Missing canonical fact classes are telemetry/readout only for this seam.
- Trusted/internal confirmation bypass remains unchanged.
- Unknown/unclassified fail-closed remains inactive policy intent only.

Accepted source material:

- `workspace/EngineeringSafetyAuditHS168-runtime-enforcement-activation-readiness.md`
- `workspace/OverseerHS169-hs168-runtime-enforcement-readiness-review.md`
- `workspace/OverseerHS170-inactive-service-boundary-hook-runway.md`
- `workspace/OverseerHS149-hs148-composed-gate-policy-review.md`
- `workspace/OverseerHS163-hs162-runtime-enforcement-boundary-review.md`
- `workspace/OverseerHS165-hs164-runtime-enforcement-evaluator-review.md`
- `workspace/OverseerHS167-hs166-dry-runtime-enforcement-adapter-review.md`
- `workspace/DevHS148-composed-gate-policy.md`
- `workspace/DevHS162-runtime-enforcement-boundary-preview.md`
- `workspace/DevHS164-runtime-enforcement-evaluator.md`
- `workspace/DevHS166-dry-runtime-enforcement-adapter.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `src/main/services/serviceRegistry.js`
- `src/main/services/runtimeEnforcementBoundaryService.js`
- `src/main/services/runtimeEnforcementEvaluator.js`
- `src/main/services/runtimeEnforcementDryAdapter.js`
- `src/main/services/composedGatePolicyService.js`
- `src/main/services/enforcementDryRunService.js`

## Current State

HS142, HS144, HS146, HS148, HS150, HS152, HS154, HS156, HS158, HS160, HS162, HS164, HS166, and HS168 are accepted.

No active runtime enforcement exists yet.

Known insertion point:

- `src/main/services/serviceRegistry.js`
- `invokeServiceCommand(command, payload, context)`
- current order: validate envelope, resolve command, require DB, renderer eligibility, confirmation authority, optional task wrapping, then handler dispatch
- accepted preview order: validate envelope, resolve command, require DB, renderer eligibility, confirmation authority, runtime enforcement boundary preview hook, optional task wrapping, then handler dispatch

Accepted HS168 finding:

- The runtime-enforcement proof chain is coherent.
- The insertion point is known.
- The evaluator and dry adapter are useful.
- The live service boundary still lacks enough canonical fact assembly to justify active blocking.
- The next safe implementation seam is a non-blocking preview hook only.

## Active Runway

Implement the first inactive service-boundary hook.

Ordered steps:

1. Read the accepted source material and inspect `invokeServiceCommand`.
2. Add a small hook at the accepted boundary after `assertCommandEligible` and `assertCommandAuthority`, before task wrapping and handler dispatch.
3. The hook should build an inactive runtime-enforcement preview using the existing dry adapter/evaluator path.
4. The hook may use:
   - service command definition
   - command
   - payload
   - context source
   - explicitly supplied trusted context facts, if present
5. The hook must not source broad canonical facts yet. It should not call config readbacks, DB readouts, providers, repositories, task runners, file writers, or mutating services.
6. The hook may optionally call a trusted observer supplied in context, such as a test-only callback, to report the preview decision.
7. If no observer is supplied, the hook should not add runtime side effects.
8. The hook must never block, throw, alter payload, alter handler result, alter task wrapping, alter dispatch, or authorize dispatch.
9. Add focused verification proving:
   - the hook runs after existing renderer eligibility and confirmation checks
   - the hook runs before task wrapping and handler dispatch
   - command results are unchanged when the observer is absent
   - command results are unchanged when the observer is present
   - observer receives inactive preview data when supplied
   - renderer-ineligible commands still stop before the hook
   - missing renderer confirmation still stops before the hook
   - trusted/internal confirmation bypass remains distinct from confirmation satisfaction
   - no target handlers are called by the hook itself
   - no task runners, providers, repositories, file writers, config writers, or mutating services are called by the hook
   - dry-run `would_allow` remains non-authorizing
   - External I/O on remains non-authorizing
   - unknown/unclassified fail-closed remains inactive policy intent only
10. Update Evidence / Dev Handoff and create the expected DevHS file.

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
- Do not promote dry-run `would_allow` into authorization.
- Do not treat External I/O on as authorization.
- Do not treat trusted/internal confirmation bypass as confirmation satisfaction.
- Do not activate unknown/unclassified fail-closed behavior.
- Do not source broad canonical facts in this packet; this is boundary plumbing proof, not full policy activation.

## Stop Conditions

Stop and return to Overseer/Human if:

- Dev cannot touch `invokeServiceCommand` without changing behavior
- the hook needs real config/DB/provider/task facts to function
- the hook needs to call readout builders from the live path
- the hook would need to block, throw, or alter dispatch
- the hook would change trusted/internal confirmation behavior
- the hook would change renderer confirmation behavior
- the hook would create runtime writes or provider movement
- the implementation starts becoming a broad active enforcement framework

## Required Verification

Run syntax checks for every changed JavaScript file.

Run:

```powershell
node --check src\main\services\serviceRegistry.js
node --check src\main\services\runtimeEnforcementDryAdapter.js
node --check src\main\services\runtimeEnforcementEvaluator.js
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

If Dev adds a focused verifier for the integration hook, run it and list it in the handoff.

No live/API/provider verification is authorized.

## Evidence

HS170 opened as Dev runway.

No implementation evidence yet.

## Dev Handoff

Expected Dev handoff:

- `workspace/DevHS170-inactive-service-boundary-hook.md`

Latest accepted Overseer review:

- `workspace/OverseerHS169-hs168-runtime-enforcement-readiness-review.md`
