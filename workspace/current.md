# AURA Atlas Current Work

Status: Resting after accepted HS131 storage config persistence dry-run
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

HS131 is accepted. Atlas has a read-only dry-run proof for the future storage authority config write.

Accepted Human decisions:

- Atlas is file-portable.
- Atlas should avoid hidden/user-device-invasive storage authority.
- Config home pattern:

```text
<Atlas app/root>/config/storage-authority.json
```

- Acknowledged app-local/current-file fallback counts as accepted storage for action posture, but remains visibly distinct as fallback mode.
- Budget is mandatory before real provider-backed acquisition or EVEidence writes.
- HS131 was one more dry run, not persisted config.

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

1. Write-capable storage config proof.
2. Acknowledgement persistence proof.
3. Enforcement dry-run / command-effect mapping.
4. External I/O held-state follow-up.
5. Hydration backlog preview.

The next packet should remain one bounded hardening seam.

## Guardrails

- Dry-run only.
- Fixture/offline proof only.
- No real config file writes.
- No persisted acknowledgement.
- No storage enforcement.
- No runtime lockout enforcement.
- No DB movement, copy, migration, relocation, restore, or deletion.
- No real pruning/deletion execution.
- No snapshot creation against real operator paths.
- No live/provider/API/private calls.
- No zKill calls.
- No ESI calls.
- No Evidence/EVEidence writes.
- No hydration writes.
- No schema migration unless Dev can prove it is purely fixture/test support and stops for Overseer if runtime schema is needed.
- No renderer redesign.
- No UI presentation/copy finalization.
- Do not treat dry-run payload as persisted config.
- Do not treat app-local/current-file fallback as accepted storage without explicit acknowledgement state.
- Do not allow renderer payloads to choose arbitrary paths, forge acknowledgement, forge budget, or probe the filesystem.
- Do not treat `workspace/to-be-sorted/` as active work.
- Do not broaden into UI work while the current heading is system hardening.

## Stop Conditions

Before opening the next runway, stop and return to Overseer/Human if:

- writing a real config file, persisting acknowledgement, or enforcing storage lockout is being proposed without a bounded packet
- the proof requires moving, copying, migrating, relocating, restoring, or deleting DB/storage
- the proof requires live/provider/API calls
- the proof requires changing Discovery/Evidence/Hydration semantics
- the proof requires renderer path selection or filesystem probing
- the proof requires treating `workspace/to-be-sorted/` as current task input
- the proof requires UI wording or renderer design

## Required Verification

No verification is required while resting.

If the next storage packet changes the same surface, likely baseline verification is:

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

## Evidence

HS131 Dev implementation completed.

- Extended `storage.setup_gate_readout` with read-only `storage_config_dry_run`.
- Dry-run target path is derived in main process as `<Atlas app/root>/config/storage-authority.json`.
- Simulated payload includes schema/version, selected storage mode/root/DB basis, fallback acknowledgement status/provenance, budget bytes/source, path basis, validation status, timestamp placeholders, and invalidation basis where applicable.
- Simulated readback reports `would_read_back` only for valid would-write states.
- Fixture proof covers explicit selected storage with budget, app-local fallback unacknowledged, app-local fallback acknowledged with budget, acknowledgement invalidated, no storage selected, selected storage missing/unavailable, selected storage invalid/degraded, and missing budget while provider-backed work would be requested.
- Renderer proof confirms payloads cannot choose arbitrary config paths, storage roots, fallback acknowledgement, or budget bytes through this readout.
- Boundary preserved: no real config writes, no persisted acknowledgement, no enforcement/lockout, no storage movement, no provider calls, no Evidence/EVEidence writes, no hydration writes, no schema migration, no renderer redesign.

Verification:

```powershell
node --check src\main\services\storageSetupGateReadoutService.js
node --check scripts\verify-storage-setup-gate.js
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

All listed commands passed. `verify:protected-terms` completed with warning-only discovery output and exit code 0. `git diff --check` passed with line-ending warnings only. `Test-Path config\storage-authority.json` returned `False`, confirming the dry run did not create the future config file. One initial parallel `verify:service-registry` run failed because another verifier removed its temp fixture during concurrent execution; standalone rerun passed.

## Dev Handoff

Complete:

- `workspace/DevHS131-storage-config-persistence-dry-run.md`
