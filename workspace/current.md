# AURA Atlas Current Work

Status: Resting after accepted HS135 acknowledgement persistence proof
Last updated: 2026-05-31

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: storage/runtime hardening remains the next heading, but no Dev runway is currently open.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Overseer / Human discussion

Expected handoff filename:

```txt
none
```

## Current State

HS135 is accepted after Overseer correction.

Accepted Human decisions:

- Atlas is file-portable.
- Atlas should avoid hidden/user-device-invasive storage authority.
- Config home pattern:

```text
<Atlas app/root>/config/storage-authority.json
```

- Acknowledged app-local/current-file fallback counts as accepted storage for action posture, but remains visibly distinct as fallback mode.
- Budget is mandatory before real provider-backed acquisition or EVEidence writes.
- HS135 was an acknowledgement persistence proof, not enforcement.

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

No active Dev runway.

Likely next storage/runtime seams, to choose deliberately:

1. Enforcement dry-run / command-effect mapping.
2. External I/O held-state follow-up.
3. Hydration backlog preview.

The next packet should remain one bounded hardening seam.

## Guardrails

- No broad enforcement without a dedicated runway.
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

Before opening the next runway, stop and return to Overseer/Human if:

- the proof requires broad runtime enforcement instead of a bounded seam
- the proof requires moving, copying, migrating, relocating, restoring, or deleting DB/storage
- the proof requires live/provider/API calls
- the proof requires changing Discovery/Evidence/Hydration semantics
- the proof requires renderer path selection or filesystem probing
- the proof requires treating fallback acknowledgement as selected storage
- the proof requires treating `workspace/to-be-sorted/` as current task input
- the proof requires UI wording or renderer design

## Required Verification

No verification is required while resting.

If the next storage packet changes the same surface, likely baseline verification is:

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

HS135 Dev implementation accepted after Overseer correction.

- Added non-renderer `storage.authority_config.acknowledgement_persistence_proof`.
- Added fixture/offline verifier `verify:storage-acknowledgement-persistence`.
- Persisted acknowledged app-local/current-file fallback into allowed fixture config and read it back as storage-authority memory.
- Readback posture proves mode remains `app_local_fallback_acknowledged`, `selected` remains false, `fallback_acknowledged` is true, and storage posture becomes `configured_ready`.
- Persisted acknowledgement memory preserves acknowledgement status, acknowledgement basis/provenance, fallback storage root, fallback DB path, path basis, budget bytes, and budget source.
- Invalidation proof changes fallback/app path basis and returns `acknowledgement_invalidated`, `fallback_path_basis_changed`, `fallback_ack_required`, and no future write posture.
- Missing-budget proof returns `budget_required_for_provider_backed_work`, `blocked_budget_required`, and no provider-backed config/write progression even though fallback acknowledgement memory exists.
- Non-fallback selected-storage input is rejected and does not write.
- Renderer-origin invocation is rejected as not renderer eligible.
- Boundary preserved: no real project-root config write, no enforcement/lockout, no provider calls, no storage movement, no Evidence/EVEidence writes, no hydration writes, no schema migration, no renderer redesign.

Verification:

```powershell
node --check src\main\services\storageAuthorityConfigWriteService.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-storage-acknowledgement-persistence.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-storage-authority-config-write.js
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

All listed commands passed. `verify:protected-terms` completed with warning-only discovery output and exit code 0. `git diff --check` passed with line-ending warnings only. `Test-Path config\storage-authority.json` returned `False`.

## Dev Handoff

Complete:

- `workspace/DevHS135-acknowledgement-persistence-proof.md`
