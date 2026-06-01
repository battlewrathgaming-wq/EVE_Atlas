# OverseerHS162 - Runtime Enforcement Boundary Preview Runway

Status: runway opened
Date: 2026-06-01
Role: Overseer

## Purpose

Open a bounded Dev packet for the first runtime enforcement boundary proof.

This packet should prove where Atlas would place runtime enforcement and what decisions it would make before command handlers run, without activating command blocking.

## Source Of Intent

Human selected runtime enforcement as the next seam:

- "I'd hold off the writer design (if) we need to know what fills it. We still have a bit of ambiguity there to review."
- "1 sounds good. I have more confidence in our structural members."

Accepted interpretation:

- Hydration writer design remains parked.
- Atlas should use the accepted structural proofs before activating enforcement.
- This is a design/proof packet, not active runtime enforcement.

## Accepted Advisory / Specialist Disposition

- HS138 Engineering/Safety audit: accepted as enforcement coverage advisory.
- HS140/HS141 Security audit: accepted as enforcement posture advisory.
- HS148/HS149 composed gate policy: accepted.
- HS150/HS151 Hydration execution policy: accepted as policy preview, not writer design.
- HS156/HS157 real External I/O config: accepted.
- HS158/HS159 real storage authority config: accepted.
- HS160/HS161 support artifact creation policy: accepted.
- Hydration writer design: deferred.
- UI/renderer presentation: deferred.

## Current Executor

Current executor: Dev

Expected handoff:

```txt
workspace/DevHS162-runtime-enforcement-boundary-preview.md
```

## Runway

1. Inspect `serviceRegistry.invokeServiceCommand`, renderer eligibility checks, confirmation authority checks, task wrapping, `storage.enforcement_dry_run.command_effect_map`, `storage.composed_gate_policy.preview`, `support.gate_stack_readout`, storage setup/readback, External I/O config/readback, support artifact creation policy, and command metadata.
2. Add a read-only preview that models the exact first enforcement boundary at the service command invocation layer before handler dispatch.
3. The preview must not call target command handlers. It should inspect command metadata and accepted gate/readout surfaces only.
4. Report the proposed insertion point and order, including whether enforcement would run before or after renderer eligibility and confirmation authority checks.
5. Report representative envelope decisions for safe local read/report/preflight, trusted config readback/write, provider-backed Discovery, ESI Evidence/EVEidence expansion, Hydration write, Watch execution, runtime snapshot creation, trace-pack creation, task cancellation/runtime control, fixture-only proof command, and unknown/unclassified future command.
6. For each representative, separate command eligibility, confirmation state, storage authority, budget posture, External I/O posture, provider/live gate posture, destination/path authority if relevant, trusted-context requirement, composed decision, and whether the decision is active or preview-only.
7. Prove `would_allow` remains non-authorizing and unknown/unclassified future commands remain inactive fail-closed intent.
8. Prove the preview creates no command blocking, runtime interception, handler execution, task execution, provider movement, file writes, DB mutations, or schema changes.
9. Add focused verification and update service registry, command authority, passive side-effect, enforcement dry-run, and composed-gate coverage if a new read-only command is added.
10. Update Evidence / Dev Handoff and create the expected DevHS file.

## Guardrails And Non-Goals

- No active runtime enforcement.
- No command interception.
- No actual command blocking.
- No handler dispatch from the preview.
- No task execution from the preview.
- No provider calls or provider movement.
- No zKill, ESI, or SDE download calls.
- No Evidence/EVEidence writes.
- No Discovery mutation.
- No Hydration writes.
- No storage config writes.
- No support artifact creation.
- No runtime snapshot creation.
- No trace-pack creation.
- No file or directory creation.
- No DB/storage movement.
- No cleanup, delete, prune, restore, move, copy, migration, upload, or packaging.
- No renderer redesign or UI wording work.
- Do not promote `would_allow` into authorization.
- Do not collapse External I/O, storage authority, confirmation, live/API gate, Watch arming, or path authority into one boolean.
- Do not let runtime enforcement design become Hydration writer design.

## Stop Conditions

Stop and return to Overseer/Human if:

- active runtime command blocking is required
- command execution behavior must change
- the proof must move below service handlers/repositories before the service boundary is proven
- live/provider/API calls are required
- storage config, Evidence/EVEidence, Discovery refs, Hydration labels, support artifacts, snapshots, trace packs, files, or directories must be written
- UI/renderer redesign is required
- preview-only posture cannot be distinguished from active authorization
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

To be filled by Dev:

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

Expected:

- `workspace/DevHS162-runtime-enforcement-boundary-preview.md`
