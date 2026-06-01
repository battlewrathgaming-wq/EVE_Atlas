# AURA Atlas Current Work

Status: Resting after HS165 accepted HS164 runtime enforcement evaluator
Last updated: 2026-06-01

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: storage/runtime hardening is locally stable after extracting the non-enforcing runtime evaluator. No active Dev runway is open.

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

## Source Of Intent

Human selected runtime enforcement as the latest seam:

- "I'd hold off the writer design (if) we need to know what fills it. We still have a bit of ambiguity there to review."
- "1 sounds good. I have more confidence in our structural members."

Accepted interpretation:

- Hydration writer design remains parked until Atlas has more confidence in what fills it.
- Runtime enforcement should advance from proof surfaces toward implementation only one seam at a time.
- HS162 proved the runtime enforcement boundary as preview evidence.
- HS164 extracted a small evaluator before Atlas activates runtime command blocking.

Accepted source material:

- `workspace/OverseerHS163-hs162-runtime-enforcement-boundary-review.md`
- `workspace/OverseerHS164-runtime-enforcement-evaluator-runway.md`
- `workspace/OverseerHS165-hs164-runtime-enforcement-evaluator-review.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `src/main/services/serviceRegistry.js`
- `src/main/services/runtimeEnforcementBoundaryService.js`
- `src/main/services/runtimeEnforcementEvaluator.js`
- `src/main/services/composedGatePolicyService.js`
- `src/main/services/enforcementDryRunService.js`

Accepted proof surfaces:

- `storage.enforcement_dry_run.command_effect_map`
- `storage.composed_gate_policy.preview`
- `support.gate_stack_readout`
- `metadata.hydration_execution_policy.preview`
- `support.artifact_path_authority.preview`
- `support.artifact_creation_policy.preview`
- `external_io.state_config_readback`
- `storage.authority_config.readback`
- `storage.setup_gate_readout`
- `runtime.enforcement_boundary.preview`
- `runtimeEnforcementEvaluator.evaluateRuntimeEnforcementDecision`

## Current State

HS142, HS144, HS146, HS148, HS150, HS152, HS154, HS156, HS158, HS160, HS162, and HS164 are accepted.

No active runtime enforcement exists yet.

Known insertion point:

- `src/main/services/serviceRegistry.js`
- `invokeServiceCommand(command, payload, context)`
- current order: validate envelope, resolve command, require DB, renderer eligibility, confirmation authority, optional task wrapping, then handler dispatch
- accepted preview order: validate envelope, resolve command, require DB, renderer eligibility, confirmation authority, runtime enforcement boundary, optional task wrapping, then handler dispatch

HS162 proved where enforcement would run and what it would decide without calling target handlers or blocking commands.

HS164 made the future decision shape reusable and testable without making that decision active.

## Active Runway

No active Dev runway.

Next shaping candidates:

1. Dry active-enforcement adapter proof, still no broad command blocking.
2. Actual support artifact creation hardening, if continuing the snapshot/trace-pack lane.
3. Hydration writer/provider design, only after data-shape ambiguity is settled.
4. Storage setup renderer posture later, not now.

## Guardrails

- No active runtime enforcement without a new accepted runway.
- No command interception without a new accepted runway.
- No actual command blocking without a new accepted runway.
- No provider-backed movement without explicit scope.
- No zKill calls.
- No ESI calls.
- No SDE download calls.
- No Evidence/EVEidence writes.
- No Discovery ref mutation.
- No Hydration writes.
- No storage config writes unless specifically opened.
- No support artifact creation unless specifically opened.
- No runtime snapshot creation unless specifically opened.
- No trace-pack creation unless specifically opened.
- No cleanup, delete, prune, restore, move, copy, migration, upload, or packaging.
- No renderer redesign or UI wording work.
- Do not promote `would_allow` into authorization.
- Do not allow an active adapter to fall back to dry-run `would_allow` unless a future packet explicitly proves that behavior safe for the command class.
- Do not collapse External I/O, storage authority, confirmation, live/API gate, Watch arming, or path authority into one boolean.
- Do not let runtime enforcement design become Hydration writer design.
- Do not implement provider-backed Hydration.

## Stop Conditions

Stop and return to Overseer/Human before opening the next runway if:

- the next proof requires broad active runtime command blocking
- the next proof requires changing command execution behavior beyond a dry adapter proof
- the next proof requires live/provider/API calls
- the next proof requires writing storage config, Evidence/EVEidence, Discovery refs, Hydration labels, support artifacts, snapshots, trace packs, files, or directories outside a scoped packet
- the next proof requires UI/renderer redesign
- the next proof cannot distinguish preview-only posture from active authorization
- External I/O on would become authorization
- `would_allow` would become authorization
- unknown/unclassified command handling would become active runtime fail-closed behavior without explicit acceptance

## Required Verification

No active verification required while resting.

Most recent accepted proof set:

```powershell
node --check src\main\services\runtimeEnforcementEvaluator.js
node --check src\main\services\runtimeEnforcementBoundaryService.js
node --check scripts\verify-runtime-enforcement-evaluator.js
node --check scripts\verify-runtime-enforcement-boundary.js
npm.cmd run verify:runtime-enforcement-evaluator
npm.cmd run verify:runtime-enforcement-boundary
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:storage-authority-config-write
npm.cmd run verify:support-artifact-creation-policy
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
```

## Evidence

HS164 accepted by Overseer in `workspace/OverseerHS165-hs164-runtime-enforcement-evaluator-review.md`.

Evidence:

- Added pure evaluator helper `src/main/services/runtimeEnforcementEvaluator.js`.
- Evaluator accepts explicit input facts only and returns `command`, known/classified posture, boundary reachability, `decision`, `active: false`, `preview_only: true`, reason codes, gate inputs used, and non-authorizing notes for `would_allow` and External I/O on.
- Updated `runtime.enforcement_boundary.preview` to expose `evaluator_decision` for each representative envelope and summarize `by_evaluator_decision`.
- Added focused verifier `scripts/verify-runtime-enforcement-evaluator.js` and package script `verify:runtime-enforcement-evaluator`.
- Representative evaluator coverage includes safe local report/read, storage authority readback, storage authority trusted write, provider-backed Discovery, ESI Evidence/EVEidence expansion, Hydration write, Watch execution, support artifact creation, task cancellation, fixture-only proof command, unknown/unclassified future command, storage missing, and budget hard-lock.
- Stable reason-code proof covers `storage_missing`, `budget_hard_lock`, `external_io_held`, `confirmation_missing`, `confirmation_satisfied`, `trusted_context_required`, `path_authority_conditional`, `fixture_only`, and `unknown_unclassified`.
- Explicit confirmation:
  - no runtime enforcement, command blocking, command interception, target handler dispatch, task execution, provider calls, zKill calls, ESI calls, SDE downloads, file writes from evaluator/boundary tests, DB mutations, Evidence/EVEidence writes, Discovery mutations, Hydration writes, operator-real storage config writes, support artifact creation, snapshot creation, trace-pack creation, schema migration, or UI changes were performed.

## Dev Handoff

Accepted Dev handoff:

- `workspace/DevHS164-runtime-enforcement-evaluator.md`

Latest Overseer review:

- `workspace/OverseerHS165-hs164-runtime-enforcement-evaluator-review.md`
