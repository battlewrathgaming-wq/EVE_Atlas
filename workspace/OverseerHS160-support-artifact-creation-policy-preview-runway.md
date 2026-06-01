# OverseerHS160 - Support Artifact Creation Policy Preview Runway

Status: runway opened
Date: 2026-06-01
Role: Overseer

## Purpose

Open a bounded Dev packet for support artifact creation policy preview.

This packet should prove Atlas can explain whether snapshot and trace-pack creation would be safe, blocked, conditional, or require confirmation before Atlas activates broader support-artifact creation behavior.

## Source Of Intent

Human selected the next seam:

- Snapshot/trace-pack creation policy.
- "Laying down all the heavy equipment."

Accepted source material:

- `workspace/OverseerHS147-hs146-support-artifact-path-authority-review.md`
- `workspace/OverseerHS159-hs158-storage-authority-real-config-review.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- existing read-only command `support.artifact_path_authority.preview`
- existing storage authority commands `storage.authority_config.readback` and `storage.authority_config.write`
- existing storage setup gate `storage.setup_gate_readout`
- existing composed gate preview `storage.composed_gate_policy.preview`
- existing enforcement dry-run `storage.enforcement_dry_run.command_effect_map`

## Accepted Advisory / Specialist Disposition

- HS147 support-artifact path authority: accepted.
- HS159 real storage authority config: accepted.
- Security posture from HS140/HS141 remains accepted as advisory breadcrumb: `would_allow` is not runtime authorization, and runtime enforcement needs composed gate state before activation.
- No new Lab/UIUX/advisory material is accepted into this runway.
- UI and renderer presentation remain deferred.

## Current Executor

Current executor: Dev

Expected handoff:

```txt
workspace/DevHS160-support-artifact-creation-policy-preview.md
```

## Runway

1. Inspect existing runtime snapshot and operator debug trace-pack scripts/services/verifiers, plus `support.artifact_path_authority.preview`, storage setup/readback, composed gate policy, enforcement dry-run, passive side-effect checks, service registry, and renderer eligibility metadata.
2. Add a read-only policy preview that reports how representative support artifact creation requests would be classified before creation.
3. Cover at minimum rolling runtime DB snapshot, retained/manual runtime DB snapshot, and operator debug trace pack.
4. For each class, report creation posture such as `would_allow`, `would_block`, `conditional`, `confirmation_required`, `storage_setup_required`, `budget_blocked`, `path_untrusted`, `trusted_context_required`, and `local_only_available`, or a clearer equivalent.
5. Compose policy from storage authority config/readback, storage setup gate state, support artifact path authority, budget posture, External I/O posture, command metadata, renderer eligibility, composed gate policy, and enforcement dry-run posture where possible.
6. Prove renderer payloads cannot choose output paths, forge storage authority, forge fallback acknowledgement, forge budget, forge trusted context, or turn this preview into a filesystem probe.
7. Prove External I/O off does not block local support policy/readout, and support artifact creation policy does not call zKill, ESI, SDE download, or any provider.
8. Add focused verification and update service registry, command authority, passive side-effect, enforcement dry-run, and composed-policy coverage if a new command is added.
9. Update Evidence / Dev Handoff and create the expected DevHS file.

## Guardrails And Non-Goals

- No actual support artifact creation.
- No runtime snapshot creation.
- No trace-pack creation.
- No file or directory creation.
- No cleanup, delete, prune, restore, move, copy, migration, upload, or packaging.
- No runtime command interception or command blocking.
- No runtime authorization activation.
- No provider-backed movement or live calls.
- No zKill, ESI, or SDE download calls.
- No Evidence/EVEidence writes.
- No Discovery ref mutation.
- No Hydration writes.
- No metadata label writes.
- No storage config writes.
- No DB/storage movement.
- No renderer redesign or UI wording work.
- No renderer-origin filesystem path authority.
- Do not treat support artifacts as Evidence/EVEidence, Discovery, Observation, or Assessment Memory.
- Do not treat trace packs as evidence exports.
- Do not treat `would_allow` as runtime authorization.

## Stop Conditions

Stop and return to Overseer/Human if:

- the proof requires actual snapshot, trace-pack, log, export, cache, or support artifact creation
- the proof requires writing files or directories
- runtime interception or actual command blocking is required
- live/provider/API calls are required
- moving, copying, migrating, relocating, restoring, pruning, deleting, or uploading DB/storage/support artifacts is required
- renderer path selection or renderer filesystem probing is required
- budget/path policy cannot be derived without inventing a new storage authority model
- support artifacts blur into Evidence/EVEidence, Discovery, Observation, or Assessment Memory
- trace packs become evidence exports or raw payload exports
- External I/O off would make local-only support readout unavailable
- External I/O on would become authorization for creation
- implementation requires broad UI work

## Required Verification

Run syntax checks on every new or changed JavaScript file.

Run:

```powershell
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:storage-authority-config-write
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If Dev adds a focused verifier such as `verify:support-artifact-creation-policy`, run it and list it in the handoff.

Only run `npm.cmd run verify:runtime-snapshot` or `npm.cmd run verify:operator-debug-trace` if implementation touches existing snapshot/trace-pack creation code or verifier expectations. If run, clearly state these are existing fixture/verifier writes, not the new policy preview creating real operator artifacts.

## Evidence

To be filled by Dev:

- command/readout added or intentionally reused
- sample output showing snapshot and trace-pack creation classes
- renderer-forgery/path-authority proof
- External I/O local-only proof
- confirmation/storage/budget/path posture proof
- verification commands and results
- explicit confirmation that no support artifacts, snapshots, trace packs, files, directories, provider calls, Evidence/EVEidence writes, Discovery mutations, Hydration writes, storage config writes, runtime enforcement, schema migrations, or UI changes were performed

## Dev Handoff

Expected:

- `workspace/DevHS160-support-artifact-creation-policy-preview.md`
