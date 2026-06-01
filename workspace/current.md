# AURA Atlas Current Work

Status: HS166 Dry runtime enforcement adapter runway open
Last updated: 2026-06-01

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: prove how the inactive runtime evaluator would be fed at the service boundary, without changing command execution.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS166-dry-runtime-enforcement-adapter.md
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
- HS166 should prove dry adapter fact assembly before any active enforcement exists.

Accepted source material:

- `workspace/OverseerHS165-hs164-runtime-enforcement-evaluator-review.md`
- `workspace/OverseerHS166-dry-runtime-enforcement-adapter-runway.md`
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

HS164 made the future decision shape reusable and testable without making that decision active.

HS166 should prove how service-boundary facts would be assembled for that evaluator without changing command execution.

## Active Runway

Create a dry runtime enforcement adapter proof.

Ordered steps:

1. Read HS165, `serviceRegistry.invokeServiceCommand`, `runtimeEnforcementEvaluator`, `runtimeEnforcementBoundaryService`, command metadata, composed gate policy, and dry-run coverage.
2. Add a dry adapter helper that assembles evaluator facts from service command definition, payload, and context without calling target handlers.
3. The dry adapter may use already-available command metadata and explicit context facts only. It must not call providers, repositories, file writers, config writers, task runners, or mutating services.
4. The dry adapter result should include:
   - command
   - source
   - renderer eligibility posture
   - confirmation posture
   - trusted/internal context posture
   - evaluator decision
   - `would_block_if_active`
   - `would_dispatch_if_active`
   - `active: false`
   - `preview_only: true`
   - missing fact classes that would be needed before active enforcement
5. Prove the adapter can represent:
   - safe local read/report
   - renderer-ineligible trusted command
   - missing confirmation
   - satisfied confirmation
   - trusted/internal config write
   - provider-backed Discovery
   - ESI Evidence/EVEidence expansion
   - Hydration write
   - Watch execution
   - support artifact creation
   - unknown command before boundary
6. Prove dry adapter output does not change `invokeServiceCommand` behavior.
7. Keep unknown/unclassified fail-closed as inactive policy intent only.
8. Keep dry-run `would_allow` non-authorizing. If the dry adapter lacks composed gate facts, it should say so rather than treating fallback pass as execution authority.
9. Add focused verification and update Evidence / Dev Handoff.

## Guardrails

- No active runtime enforcement.
- No command interception.
- No actual command blocking.
- No behavior change to `invokeServiceCommand`.
- No handler dispatch from dry adapter tests.
- No task wrapping or task execution from dry adapter tests.
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
- No cleanup, delete, prune, restore, move, copy, migration, upload, or packaging.
- No schema migration.
- No renderer redesign or UI wording work.
- Do not promote `would_allow` into authorization.
- Do not treat External I/O on as authorization.
- Do not make unknown/unclassified fail-closed active runtime behavior.
- Do not import readout builders into the active command path unless the helper remains explicitly dry and tests prove no runtime behavior change.

## Stop Conditions

Stop and return to Overseer/Human if:

- Dev needs to change active `invokeServiceCommand` behavior
- Dev needs to block or intercept real commands
- Dev needs to call readout builders from the live command path
- Dev needs provider/API calls
- Dev needs file/DB/config writes
- Dev cannot distinguish missing facts from pass/block decisions
- Dev cannot keep `would_allow` non-authorizing
- the adapter becomes a broad enforcement framework instead of a dry proof of fact assembly

## Required Verification

Run syntax checks on every new or changed JavaScript file.

Run:

```powershell
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

If Dev adds `verify:runtime-enforcement-adapter`, run it and list it in the handoff.

## Evidence

HS166 is open. Evidence to be filled by Dev.

Expected evidence:

- dry adapter helper added or intentionally reused
- adapter decision object shape
- representative command decisions
- missing-fact proof
- proof that adapter output is inactive and preview-only
- proof that `invokeServiceCommand` behavior is unchanged
- proof that target handlers, task runners, providers, repositories, file writers, and config writers are not called by adapter tests
- verification commands and results
- explicit confirmation that no runtime enforcement, command blocking, provider calls, file writes, DB mutations, Evidence/EVEidence writes, Discovery mutations, Hydration writes, storage config writes, support artifact creation, schema migration, or UI changes were performed

## Dev Handoff

Expected Dev handoff:

- `workspace/DevHS166-dry-runtime-enforcement-adapter.md`

Prior accepted Dev handoff:

- `workspace/DevHS164-runtime-enforcement-evaluator.md`

Latest Overseer review:

- `workspace/OverseerHS165-hs164-runtime-enforcement-evaluator-review.md`
