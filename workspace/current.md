# AURA Atlas Current Work

Status: HS160 Support artifact creation policy preview runway open
Last updated: 2026-06-01

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: define the read-only creation policy for snapshots and trace packs before Atlas allows broader support-artifact creation.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS160-support-artifact-creation-policy-preview.md
```

## Source Of Intent

Human selected the next seam:

- Snapshot/trace-pack creation policy.
- "Laying down all the heavy equipment."

Accepted context:

- `workspace/OverseerHS147-hs146-support-artifact-path-authority-review.md`
- `workspace/OverseerHS159-hs158-storage-authority-real-config-review.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- existing read-only support path posture: `support.artifact_path_authority.preview`
- existing storage authority config posture: `storage.authority_config.readback` and `storage.authority_config.write`
- existing storage setup posture: `storage.setup_gate_readout`
- existing composed gate posture: `storage.composed_gate_policy.preview`
- existing enforcement inventory posture: `storage.enforcement_dry_run.command_effect_map`

Accepted interpretation:

- Support artifacts are support/readout material, not Evidence/EVEidence, Discovery refs, Observation, or Assessment Memory.
- Runtime snapshots and trace packs can be sensitive recovery/support artifacts.
- Renderer payloads cannot provide filesystem path authority.
- External I/O is not required for local support-artifact readout or local support-artifact policy.
- Support artifact creation must not become a provider-call back door.
- This packet previews creation policy only. It does not create snapshots, trace packs, or files.

## Current State

HS142, HS144, HS146, HS148, HS150, HS152, HS154, HS156, and HS158 are accepted.

Accepted proof surfaces include:

- `storage.authority_preflight`
- `storage.setup_gate_readout`
- `storage.setup_gate_readout.action_class_matrix`
- `storage.setup_gate_readout.storage_authority`
- `storage.setup_gate_readout.storage_config_dry_run`
- `storage.authority_config.write_proof`
- `storage.authority_config.acknowledgement_persistence_proof`
- `storage.enforcement_dry_run.command_effect_map`
- `support.gate_stack_readout`
- `support.artifact_path_authority.preview`
- `storage.composed_gate_policy.preview`
- `metadata.hydration_execution_policy.preview`
- `external_io.state_readout`
- `external_io.state_persistence_proof`
- `external_io.state_config_readback`
- `external_io.state_config_write`
- `storage.authority_config.readback`
- `storage.authority_config.write`
- `metadata.hydration_write_fixture_proof`

## Active Runway

Create a read-only support artifact creation policy preview for snapshot and trace-pack creation posture.

Recommended command name:

```txt
support.artifact_creation_policy.preview
```

If an existing surface is cleaner, Dev may choose a closely scoped alternative, but the handoff must explain why.

Ordered steps:

1. Inspect existing runtime snapshot and operator debug trace-pack scripts/services/verifiers, plus `support.artifact_path_authority.preview`, storage setup/readback, composed gate policy, enforcement dry-run, passive side-effect checks, service registry, and renderer eligibility metadata.
2. Add a read-only policy preview that reports how representative support artifact creation requests would be classified before creation.
3. Cover at minimum:
   - rolling runtime DB snapshot
   - retained/manual runtime DB snapshot
   - operator debug trace pack
   - readiness/preflight export only if an existing write-capable surface makes it relevant
4. For each class, report creation posture such as `would_allow`, `would_block`, `conditional`, `confirmation_required`, `storage_setup_required`, `budget_blocked`, `path_untrusted`, `trusted_context_required`, `local_only_available`, or a clearer equivalent.
5. Compose policy from existing Atlas facts where possible:
   - storage authority config/readback
   - storage setup gate state
   - support artifact path authority
   - storage budget posture
   - External I/O posture
   - command metadata / renderer eligibility
   - composed gate and enforcement dry-run posture
6. Prove renderer payloads cannot choose output paths, forge storage authority, forge fallback acknowledgement, forge budget, forge trusted context, or turn this preview into a filesystem probe.
7. Prove External I/O off does not block local support policy/readout, and that support artifact creation policy does not call zKill, ESI, SDE download, or any provider.
8. Add focused verification and update service registry, command authority, passive side-effect, enforcement dry-run, and composed-policy coverage if a new command is added.
9. Update Evidence / Dev Handoff and create the expected DevHS file.

## Guardrails

- No actual support artifact creation.
- No runtime snapshot creation.
- No trace-pack creation.
- No file creation.
- No directory creation.
- No cleanup, delete, prune, restore, move, copy, migration, upload, or packaging.
- No runtime command interception.
- No actual command blocking.
- No runtime authorization activation.
- No provider-backed movement.
- No zKill calls.
- No ESI calls.
- No SDE download calls.
- No Evidence/EVEidence writes.
- No Discovery ref mutation.
- No Hydration writes.
- No metadata label writes.
- No storage config writes.
- No DB/storage movement.
- No schema migration unless Dev can prove it is purely fixture/test support and stops for Overseer if runtime schema is needed.
- No renderer redesign or UI wording work.
- No renderer-origin filesystem path authority.
- Do not treat support artifacts as Evidence/EVEidence, Discovery, Observation, or Assessment Memory.
- Do not treat trace packs as evidence exports.
- Do not treat app-local/current-file fallback as selected storage.
- Do not treat the 5GB suggested/default budget as hidden acceptance.
- Do not treat `would_allow` as runtime authorization.

## Stop Conditions

Stop and return to Overseer/Human if:

- the proof requires actual snapshot, trace-pack, log, export, cache, or support artifact creation
- the proof requires writing files or directories
- the proof requires runtime interception or actual command blocking
- the proof requires live/provider/API calls
- the proof requires moving, copying, migrating, relocating, restoring, pruning, deleting, or uploading DB/storage/support artifacts
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

HS160 is open. Evidence to be filled by Dev.

Expected evidence:

- command/readout added or intentionally reused
- sample output showing snapshot and trace-pack creation classes
- renderer-forgery/path-authority proof
- External I/O local-only proof
- confirmation/storage/budget/path posture proof
- verification commands and results
- explicit confirmation that no support artifacts, snapshots, trace packs, files, directories, provider calls, Evidence/EVEidence writes, Discovery mutations, Hydration writes, storage config writes, runtime enforcement, schema migrations, or UI changes were performed

## Dev Handoff

Expected Dev handoff:

- `workspace/DevHS160-support-artifact-creation-policy-preview.md`

Prior completed Dev handoff:

- `workspace/DevHS158-storage-authority-real-config.md`

Latest Overseer review:

- `workspace/OverseerHS159-hs158-storage-authority-real-config-review.md`
