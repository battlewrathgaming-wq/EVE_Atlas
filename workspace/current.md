# AURA Atlas Current Work

Status: HS169 accepted HS168 runtime enforcement activation readiness audit
Last updated: 2026-06-01

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: Human / Overseer decision on whether to open the first inactive service-boundary integration hook.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Human / Overseer decision

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

Human direction:

- continue system hardening before UI/body work
- do cheap proof and assurance before expensive implementation
- one seam at a time
- do not drift into broad architecture or hidden active behavior

Accepted interpretation:

- Atlas is not ready for active runtime blocking.
- Atlas is ready only for a narrower seam: a first inactive service-boundary integration hook.
- The next implementation, if opened, must be behavior-preserving and non-blocking.

Accepted source material:

- `workspace/EngineeringSafetyAuditHS168-runtime-enforcement-activation-readiness.md`
- `workspace/OverseerHS169-hs168-runtime-enforcement-readiness-review.md`
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
- accepted preview order: validate envelope, resolve command, require DB, renderer eligibility, confirmation authority, runtime enforcement boundary, optional task wrapping, then handler dispatch

Accepted HS168 finding:

- The runtime-enforcement proof chain is coherent.
- The insertion point is known.
- The evaluator and dry adapter are useful.
- The live service boundary still lacks enough canonical fact assembly to justify active blocking.
- The next safe implementation seam is a non-blocking preview hook only.

## Decision Point

Human / Overseer should decide whether to open HS170 as:

```txt
First inactive service-boundary integration hook
```

Recommended bounds if accepted:

- Dev may touch `src/main/services/serviceRegistry.js`.
- The hook must run after existing renderer eligibility and confirmation authority checks.
- The hook must run before task wrapping and handler dispatch.
- The hook must be non-blocking and behavior-preserving.
- The hook may compute evaluator decisions from command definition, payload, context, and canonical read-only facts.
- The hook must not dispatch differently, call providers, write files, mutate DB state, create support artifacts, or change trusted/internal behavior.
- Missing canonical fact classes should remain telemetry/readout only for this seam.
- Unknown/unclassified fail-closed remains inactive policy intent only.

Open decision questions:

1. Is touching `invokeServiceCommand` acceptable if the hook is strictly non-blocking and behavior-preserving?
2. Should the first hook cover all service commands, or a representative allowlist while plumbing is proven?
3. Should trusted/internal confirmation bypass remain unchanged for this seam?

## Guardrails

- Do not open active runtime blocking without a new explicit accepted runway.
- Do not introduce command blocking.
- Do not change command dispatch.
- Do not call providers.
- Do not call zKill, ESI, or SDE download.
- Do not write Evidence/EVEidence.
- Do not mutate Discovery refs.
- Do not write Hydration output.
- Do not write storage config.
- Do not create support artifacts.
- Do not run cleanup, deletion, pruning, restore, move, copy, migration, upload, or packaging.
- Do not change schema.
- Do not do renderer/UI work.
- Do not treat dry-run `would_allow` as authorization.
- Do not treat External I/O on as authorization.
- Do not treat trusted/internal confirmation bypass as confirmation satisfaction.

## Required Verification If HS170 Opens

Likely future verification:

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

No live/API/provider verification is authorized unless a future packet explicitly says so.

## Evidence

HS168 advisory accepted.

Accepted advisory artifact:

- `workspace/EngineeringSafetyAuditHS168-runtime-enforcement-activation-readiness.md`

Latest Overseer review:

- `workspace/OverseerHS169-hs168-runtime-enforcement-readiness-review.md`

## Dev Handoff

No Dev handoff expected.

No active Dev runway is open.
