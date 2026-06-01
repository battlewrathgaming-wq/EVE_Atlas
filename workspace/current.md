# AURA Atlas Current Work

Status: HS162 Runtime enforcement boundary preview runway open
Last updated: 2026-06-01

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: prove the first runtime enforcement boundary and decision shape before Atlas activates command blocking.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS162-runtime-enforcement-boundary-preview.md
```

## Source Of Intent

Human selected runtime enforcement as the next seam:

- "I'd hold off the writer design (if) we need to know what fills it. We still have a bit of ambiguity there to review."
- "1 sounds good. I have more confidence in our structural members."

Accepted interpretation:

- Hydration writer design remains parked until Atlas has more confidence in what fills it.
- The next runtime hardening step should use the structural members already proven by prior read-only/offline packets.
- This packet is the first enforcement-boundary proof. It is not active runtime enforcement.

Accepted source material:

- `workspace/EngineeringSafetyAuditHS138-enforcement-dry-run-coverage-review.md`
- `workspace/OverseerHS140-hs139-enforcement-classification-coverage-review.md`
- `workspace/OverseerHS141-security-audit-hs140-review.md`
- `workspace/OverseerHS149-hs148-composed-gate-policy-review.md`
- `workspace/OverseerHS151-hs150-hydration-execution-policy-review.md`
- `workspace/OverseerHS157-hs156-external-io-real-config-review.md`
- `workspace/OverseerHS159-hs158-storage-authority-real-config-review.md`
- `workspace/OverseerHS161-hs160-support-artifact-creation-policy-review.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `src/main/services/serviceRegistry.js`

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

## Current State

HS142, HS144, HS146, HS148, HS150, HS152, HS154, HS156, HS158, and HS160 are accepted.

No active runtime enforcement exists yet.

Known insertion point:

- `src/main/services/serviceRegistry.js`
- `invokeServiceCommand(command, payload, context)`
- current order: validate envelope, resolve command, require DB, renderer eligibility, confirmation authority, optional task wrapping, then handler dispatch

The first safe proof should show where enforcement would run and what it would decide without calling target handlers or blocking commands.

## Active Runway

Create a read-only runtime enforcement boundary preview.

Recommended command name:

```txt
runtime.enforcement_boundary.preview
```

If Dev chooses a better Atlas-local name, the handoff must explain why.

Ordered steps:

1. Inspect `serviceRegistry.invokeServiceCommand`, renderer eligibility checks, confirmation authority checks, task wrapping, `storage.enforcement_dry_run.command_effect_map`, `storage.composed_gate_policy.preview`, `support.gate_stack_readout`, storage setup/readback, External I/O config/readback, support artifact creation policy, and command metadata.
2. Add a read-only preview that models the exact first enforcement boundary at the service command invocation layer before handler dispatch.
3. The preview must not call target command handlers. It should inspect command metadata and accepted gate/readout surfaces only.
4. Report the proposed insertion point and order, including whether enforcement would run before or after renderer eligibility and confirmation authority checks.
5. Report representative envelope decisions for at least:
   - safe local read/report/preflight
   - trusted config readback
   - trusted config write
   - provider-backed Discovery
   - ESI Evidence/EVEidence expansion
   - Hydration write
   - Watch execution / scheduled provider-capable command
   - runtime snapshot creation
   - trace-pack creation
   - task cancellation/runtime control
   - fixture-only proof command
   - unknown/unclassified future command
6. For each representative, separate:
   - command eligibility
   - confirmation state
   - storage authority
   - budget posture
   - External I/O posture
   - provider/live gate posture
   - destination/path authority if relevant
   - trusted-context requirement
   - composed decision
   - whether the composed decision is active or preview-only
7. Prove `would_allow` remains non-authorizing and that unknown/unclassified future commands are fail-closed intent only, not active runtime behavior.
8. Prove the preview creates no command blocking, no runtime interception, no handler execution, no task execution, no provider movement, no file writes, no DB mutations, and no schema changes.
9. Add focused verification and update service registry, command authority, passive side-effect, enforcement dry-run, and composed-gate coverage if a new read-only command is added.
10. Update Evidence / Dev Handoff and create the expected DevHS file.

## Guardrails

- No active runtime enforcement.
- No command interception.
- No actual command blocking.
- No handler dispatch from the new preview.
- No task execution from the new preview.
- No provider-backed movement.
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
- No file or directory creation.
- No DB/storage movement.
- No cleanup, delete, prune, restore, move, copy, migration, upload, or packaging.
- No schema migration unless Dev can prove it is purely fixture/test support and stops for Overseer if runtime schema is needed.
- No renderer redesign or UI wording work.
- Do not promote `would_allow` into authorization.
- Do not collapse External I/O, storage authority, confirmation, live/API gate, Watch arming, or path authority into one boolean.
- Do not let runtime enforcement design become Hydration writer design.
- Do not implement provider-backed Hydration.

## Stop Conditions

Stop and return to Overseer/Human if:

- the proof requires active runtime command blocking
- the proof requires changing command execution behavior
- the proof requires moving the enforcement boundary below service handlers/repositories before the service boundary is proven
- the proof requires live/provider/API calls
- the proof requires writing storage config, Evidence/EVEidence, Discovery refs, Hydration labels, support artifacts, snapshots, trace packs, files, or directories
- the proof requires UI/renderer redesign
- the proof cannot distinguish preview-only posture from active authorization
- External I/O on would become authorization
- `would_allow` would become authorization
- fixture/proof commands cannot be safely exempted or classified without Human/Overseer decision
- unknown/unclassified command handling would become active runtime fail-closed behavior

## Required Verification

Run syntax checks on every new or changed JavaScript file.

Run:

```powershell
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

If Dev adds a focused verifier such as `verify:runtime-enforcement-boundary`, run it and list it in the handoff.

## Evidence

HS162 is open. Evidence to be filled by Dev.

Expected evidence:

- command/readout added or intentionally reused
- proposed insertion point and ordering
- representative command/envelope decisions
- proof that handlers are not called by the preview
- proof that `would_allow` remains non-authorizing
- proof that External I/O on does not authorize execution
- proof that unknown/unclassified command fail-closed remains inactive policy intent
- verification commands and results
- explicit confirmation that no runtime enforcement, command blocking, provider calls, file writes, DB mutations, Evidence/EVEidence writes, Discovery mutations, Hydration writes, storage config writes, support artifact creation, schema migration, or UI changes were performed

## Dev Handoff

Expected Dev handoff:

- `workspace/DevHS162-runtime-enforcement-boundary-preview.md`

Prior completed Dev handoff:

- `workspace/DevHS160-support-artifact-creation-policy-preview.md`

Latest Overseer review:

- `workspace/OverseerHS161-hs160-support-artifact-creation-policy-review.md`
