# AURA Atlas Current Work

Status: HS164 Runtime enforcement evaluator runway open
Last updated: 2026-06-01

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: extract a small runtime enforcement evaluator before any active command blocking exists.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS164-runtime-enforcement-evaluator.md
```

## Source Of Intent

Human selected runtime enforcement as the latest seam:

- "I'd hold off the writer design (if) we need to know what fills it. We still have a bit of ambiguity there to review."
- "1 sounds good. I have more confidence in our structural members."

Accepted interpretation:

- Hydration writer design remains parked until Atlas has more confidence in what fills it.
- Runtime enforcement should advance from proof surfaces toward implementation only one seam at a time.
- HS162 proved the runtime enforcement boundary as preview evidence.
- HS164 should extract a small evaluator before Atlas activates runtime command blocking.

Accepted source material:

- `workspace/OverseerHS163-hs162-runtime-enforcement-boundary-review.md`
- `workspace/OverseerHS164-runtime-enforcement-evaluator-runway.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `src/main/services/serviceRegistry.js`
- `src/main/services/runtimeEnforcementBoundaryService.js`
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

## Current State

HS142, HS144, HS146, HS148, HS150, HS152, HS154, HS156, HS158, HS160, and HS162 are accepted.

No active runtime enforcement exists yet.

Known insertion point:

- `src/main/services/serviceRegistry.js`
- `invokeServiceCommand(command, payload, context)`
- current order: validate envelope, resolve command, require DB, renderer eligibility, confirmation authority, optional task wrapping, then handler dispatch
- accepted preview order: validate envelope, resolve command, require DB, renderer eligibility, confirmation authority, runtime enforcement boundary, optional task wrapping, then handler dispatch

HS162 proved where enforcement would run and what it would decide without calling target handlers or blocking commands.

HS164 should make the future decision shape reusable and testable without making that decision active.

## Active Runway

Create a non-enforcing runtime enforcement evaluator.

Ordered steps:

1. Read HS163, `runtimeEnforcementBoundaryService`, `composedGatePolicyService`, `enforcementDryRunService`, `gateStackReadoutService`, storage setup/readback, External I/O readback, support artifact creation policy, and `serviceRegistry.invokeServiceCommand`.
2. Add a pure evaluator module or helper for future runtime enforcement decisions.
3. The evaluator must accept explicit input facts; it must not call target command handlers, task runners, providers, repositories, file writers, or config writers.
4. The evaluator decision object should include at least:
   - command
   - known/classified status
   - boundary reachability
   - decision: `pass`, `block`, `conditional`, or `stop_before_boundary`
   - active: false
   - preview_only: true
   - reason codes
   - gate inputs used
   - non-authorizing notes for `would_allow` and External I/O on
5. Update `runtime.enforcement_boundary.preview` to use or expose the evaluator output where useful, without changing invocation behavior.
6. Add focused verifier coverage for representative commands:
   - safe local report/read
   - storage authority readback
   - storage authority trusted write
   - provider-backed Discovery
   - ESI Evidence/EVEidence expansion
   - Hydration write
   - Watch execution
   - support artifact creation
   - task cancellation
   - fixture-only proof command
   - unknown/unclassified future command
7. Prove the evaluator produces stable reason codes for storage missing, budget hard-lock, External I/O held, confirmation missing/satisfied, trusted-context required, path authority conditional, fixture-only, and unknown/unclassified.
8. Prove no runtime behavior changes by rerunning the boundary, registry, passive side-effect, composed policy, enforcement dry-run, gate stack, storage, support artifact, and protected-term checks.
9. Update Evidence / Dev Handoff and create the expected DevHS file.

## Guardrails

- No active runtime enforcement.
- No command interception.
- No actual command blocking.
- No handler dispatch from evaluator tests.
- No task wrapping or task execution from evaluator tests.
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
- Do not collapse External I/O, storage authority, confirmation, live/API gate, Watch arming, or path authority into one boolean.
- Do not let runtime enforcement design become Hydration writer design.
- Do not implement provider-backed Hydration.

## Stop Conditions

Stop and return to Overseer/Human if:

- evaluator extraction requires changing command execution behavior
- evaluator extraction requires active command blocking
- evaluator extraction requires live/provider/API calls
- evaluator extraction requires writing storage config, Evidence/EVEidence, Discovery refs, Hydration labels, support artifacts, snapshots, trace packs, files, or directories
- evaluator extraction requires schema or renderer work
- the evaluator cannot keep `would_allow` as non-authorizing input
- External I/O on becomes authorization
- unknown/unclassified command handling would become active runtime behavior
- the evaluator becomes a broad policy framework instead of a small command-boundary decision helper

## Required Verification

Run syntax checks on every new or changed JavaScript file.

Run:

```powershell
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
git status --short --branch
```

If Dev adds `verify:runtime-enforcement-evaluator`, run it and list it in the handoff.

## Evidence

HS164 is open. Evidence to be filled by Dev.

Expected evidence:

- evaluator module/helper added or intentionally reused
- decision object shape
- representative command decisions
- stable reason-code proof
- proof that the evaluator is non-enforcing and preview-only
- proof that target handlers, task runners, providers, repositories, file writers, and config writers are not called by evaluator tests
- verification commands and results
- explicit confirmation that no runtime enforcement, command blocking, provider calls, file writes, DB mutations, Evidence/EVEidence writes, Discovery mutations, Hydration writes, storage config writes, support artifact creation, schema migration, or UI changes were performed

## Dev Handoff

Expected Dev handoff:

- `workspace/DevHS164-runtime-enforcement-evaluator.md`

Prior accepted Dev handoff:

- `workspace/DevHS162-runtime-enforcement-boundary-preview.md`

Latest Overseer review:

- `workspace/OverseerHS163-hs162-runtime-enforcement-boundary-review.md`
