# AURA Atlas Current Work

Status: Active Dev runway for HS137 enforcement dry-run command-effect map
Last updated: 2026-05-31

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: prove command/effect allow-block decisions as a read-only dry-run before any runtime enforcement.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS137-enforcement-dry-run-command-effect.md
```

## Current State

HS135/HS136 accepted fallback acknowledgement persistence as storage-authority memory.

Accepted Human decisions:

- Atlas is file-portable.
- Atlas should avoid hidden/user-device-invasive storage authority.
- Config home pattern:

```text
<Atlas app/root>/config/storage-authority.json
```

- Acknowledged app-local/current-file fallback counts as accepted storage for action posture, but remains visibly distinct as fallback mode.
- Budget is mandatory before real provider-backed acquisition or EVEidence writes.
- The next seam is enforcement dry-run, not enforcement.

Atlas has accepted storage/runtime hardening proofs:

- `storage.authority_preflight`
- `support.gate_stack_readout`
- `verify:cadence-simulation`
- `storage.setup_gate_readout`
- `storage.setup_gate_readout.action_class_matrix`
- `storage.setup_gate_readout.storage_authority`
- `storage.setup_gate_readout.storage_config_dry_run`
- `storage.authority_config.write_proof`
- `storage.authority_config.acknowledgement_persistence_proof`

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
- `workspace/OverseerHS134-hs133-storage-config-write-proof-review.md`
- `workspace/OverseerHS135-acknowledgement-persistence-proof-scope.md`
- `workspace/OverseerHS136-hs135-acknowledgement-persistence-review.md`
- `workspace/OverseerHS137-enforcement-dry-run-command-effect-scope.md`

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

Dev should implement a bounded enforcement dry-run / command-effect map.

Source of intent:

- `workspace/OverseerHS122-storage-gate-action-matrix.md`
- `workspace/OverseerHS134-hs133-storage-config-write-proof-review.md`
- `workspace/OverseerHS136-hs135-acknowledgement-persistence-review.md`
- `workspace/OverseerHS137-enforcement-dry-run-command-effect-scope.md`
- existing service command authority/effect metadata
- existing `storage.setup_gate_readout.action_class_matrix`

Ordered steps:

1. Inspect service command metadata/effects, storage setup/gate readout, action class matrix, and command authority verifiers.
2. Add a read-only enforcement dry-run readout that maps representative commands/effects to allow/block/conditional decisions under storage/budget states.
3. Report, for each representative command/effect:
   - command/effect
   - storage state
   - budget state
   - external I/O assumption if represented
   - decision: `would_allow`, `would_block`, or `conditional`
   - reason codes
   - enforcement active state
4. Prove local read/status/report posture remains allowed where accepted.
5. Prove provider-backed acquisition, ESI expansion, hydration writes, snapshots/support artifacts, and destructive pruning/deletion execution are blocked or conditional according to accepted storage/budget state.
6. Prove acknowledged fallback behaves as accepted storage while remaining distinct from selected storage.
7. Prove invalidated acknowledgement and missing/unavailable storage block provider-backed movement/write classes.
8. Prove budget hard-lock blocks writes/provider movement while preserving safe local read/status paths.
9. Keep the proof read-only: do not intercept or block commands at runtime.
10. Add focused fixture/offline verification and update existing verification if needed.
11. Update Evidence / Dev Handoff in `workspace/current.md` and create the expected DevHS file with files changed, sample output, verification commands, and boundary confirmation.

## Guardrails

- Read-only dry-run proof only.
- No runtime command interception.
- No real storage lockout enforcement.
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
- Do not treat app-local/current-file fallback as selected storage.
- Do not treat app-local/current-file fallback as accepted storage without explicit acknowledgement state.
- Do not allow renderer payloads to choose arbitrary paths, forge acknowledgement, forge budget, or probe the filesystem.
- Do not treat `workspace/to-be-sorted/` as active work.
- Do not broaden into UI work while the current heading is system hardening.

## Stop Conditions

Stop and return to Overseer/Human before implementation if:

- the proof requires runtime interception or actual command blocking
- the proof requires moving, copying, migrating, relocating, restoring, or deleting DB/storage
- the proof requires live/provider/API calls
- the proof requires changing Discovery/Evidence/Hydration semantics
- the proof requires renderer path selection or filesystem probing
- the proof requires treating fallback acknowledgement as selected storage
- the proof requires treating `workspace/to-be-sorted/` as current task input
- the proof requires UI wording or renderer design

## Required Verification

Run:

```powershell
npm.cmd run verify:storage-acknowledgement-persistence
npm.cmd run verify:storage-authority-config-write
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
Test-Path config\storage-authority.json
```

Run `node --check` on any new or changed JavaScript files.

## Evidence

HS137 opens from HS136 accepted acknowledgement persistence proof.

Dev should replace this section with concise proof evidence after implementation.

## Dev Handoff

Pending Dev handoff.

Expected:

- `workspace/DevHS137-enforcement-dry-run-command-effect.md`
