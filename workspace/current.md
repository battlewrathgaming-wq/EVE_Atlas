# AURA Atlas Current Work

Status: Active Dev runway for HS133 storage config write proof
Last updated: 2026-05-31

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: prove storage authority config writing in a bounded fixture/offline way before any enforcement, UI setup flow, or provider-backed movement depends on it.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS133-storage-config-write-proof.md
```

## Current State

HS131/HS132 accepted the read-only dry-run proof for the future storage authority config write.

Accepted Human decisions:

- Atlas is file-portable.
- Atlas should avoid hidden/user-device-invasive storage authority.
- Config home pattern:

```text
<Atlas app/root>/config/storage-authority.json
```

- Acknowledged app-local/current-file fallback counts as accepted storage for action posture, but remains visibly distinct as fallback mode.
- Budget is mandatory before real provider-backed acquisition or EVEidence writes.
- Dry-run proof is complete; the next seam is write proof, not enforcement.

Atlas has accepted storage/runtime hardening proofs:

- `storage.authority_preflight`
- `support.gate_stack_readout`
- `verify:cadence-simulation`
- `storage.setup_gate_readout`
- `storage.setup_gate_readout.action_class_matrix`
- `storage.setup_gate_readout.storage_authority`
- `storage.setup_gate_readout.storage_config_dry_run`

Recent accepted state:

- `workspace/OverseerHS121-local-first-api-lane-model-adoption.md`
- `workspace/OverseerHS122-storage-gate-action-matrix.md`
- `workspace/OverseerHS124-hs123-storage-gate-action-matrix-review.md`
- `workspace/OverseerHS126-hs125-storage-hardening-orientation-review.md`
- `workspace/OverseerHS127-storage-config-acknowledgement-proof-scope.md`
- `workspace/OverseerHS129-hs128-storage-config-acknowledgement-review.md`
- `workspace/OverseerHS130-storage-config-decision-brief.md`
- `workspace/OverseerHS131-storage-config-dry-run-scope.md`
- `workspace/OverseerHS132-hs131-storage-config-dry-run-review.md`
- `workspace/OverseerHS133-storage-config-write-proof-scope.md`

## Accepted Boundaries

- Discovery refs are possible leads / provenance, not Evidence.
- ESI-expanded killmail records are Evidence/EVEidence.
- Hydration repairs readability and labels; it does not create Evidence.
- Observation/reporting derives from local records and should disclose basis.
- Assessment Memory is human-authored judgment, not Evidence.
- Storage setup and disk-budget posture are trust boundaries.
- External I/O should hold provider-backed movement when off and must not cause catch-up flooding when re-enabled.
- Waiting is not failure.
- Atlas should remain local-first: inspect local records before provider movement.

## Active Runway

Dev should implement a bounded storage authority config write proof.

Source of intent:

- `workspace/OverseerHS130-storage-config-decision-brief.md`
- `workspace/OverseerHS131-storage-config-dry-run-scope.md`
- `workspace/OverseerHS132-hs131-storage-config-dry-run-review.md`
- `workspace/OverseerHS133-storage-config-write-proof-scope.md`
- existing `storage.setup_gate_readout.storage_config_dry_run`

Ordered steps:

1. Inspect the storage setup/gate readout, storage authority preflight, dry-run payload, service registry, and verifier patterns.
2. Add a write-capable storage authority config helper or narrow service surface that reuses the HS131 normalized payload shape where practical.
3. Derive the default production target as:

```text
<Atlas app/root>/config/storage-authority.json
```

4. Allow fixture/test target injection only from trusted main-process/test context, not renderer payload.
5. Implement atomic or clearly staged safe write behavior.
6. Read back the written fixture/test file and verify it matches the normalized payload.
7. Reject unsafe target paths outside the allowed config root.
8. Preserve fallback acknowledgement, invalidation, and budget-required semantics.
9. Prove renderer-origin payloads cannot choose arbitrary config paths, storage roots, fallback acknowledgement, or budget bytes.
10. Add focused fixture/offline verification and update existing verification if needed.
11. Update Evidence / Dev Handoff in `workspace/current.md` and create the expected DevHS file with files changed, sample output, verification commands, and boundary confirmation.

## Guardrails

- Fixture/offline proof only.
- No runtime storage lockout enforcement.
- No provider-backed movement.
- No zKill calls.
- No ESI calls.
- No Evidence/EVEidence writes.
- No hydration writes.
- No DB movement, copy, migration, relocation, restore, or deletion.
- No real pruning/deletion execution.
- No snapshot creation against real operator paths.
- No schema migration unless Dev can prove it is purely fixture/test support and stops for Overseer if runtime schema is needed.
- No renderer redesign.
- No UI presentation/copy finalization.
- Do not treat app-local/current-file fallback as accepted storage without explicit acknowledgement state.
- Do not allow renderer payloads to choose arbitrary paths, forge acknowledgement, forge budget, or probe the filesystem.
- Do not treat `workspace/to-be-sorted/` as active work.
- Do not broaden into UI work while the current heading is system hardening.

## Stop Conditions

Stop and return to Overseer/Human before implementation if:

- the proof requires writing an operator-real config file outside fixture/test control
- the proof requires enforcing storage lockout
- the proof requires moving, copying, migrating, relocating, restoring, or deleting DB/storage
- the proof requires live/provider/API calls
- the proof requires changing Discovery/Evidence/Hydration semantics
- the proof requires renderer path selection or filesystem probing
- the proof requires treating `workspace/to-be-sorted/` as current task input
- the proof requires UI wording or renderer design
- the proof cannot prevent unsafe path targets

## Required Verification

Run:

```powershell
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Run `node --check` on any new or changed JavaScript files.

If snapshot/support settings are touched, also run:

```powershell
npm.cmd run verify:runtime-snapshot
```

The handoff must state whether the real project-root file exists after verification:

```powershell
Test-Path config\storage-authority.json
```

## Evidence

HS133 opens from HS132 accepted dry-run proof.

Dev should replace this section with concise proof evidence after implementation.

## Dev Handoff

Pending Dev handoff.

Expected:

- `workspace/DevHS133-storage-config-write-proof.md`
