# AURA Atlas Current Work

Status: Active Dev runway for HS131 storage config persistence dry-run
Last updated: 2026-05-31

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: prove the future storage authority config write as a dry run before any persisted config, acknowledgement, or enforcement.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS131-storage-config-persistence-dry-run.md
```

## Current State

Active Dev runway is open for a fixture/offline dry run.

Accepted Human decisions:

- Atlas is file-portable.
- Atlas should avoid hidden/user-device-invasive storage authority.
- Config home pattern:

```text
<Atlas app/root>/config/storage-authority.json
```

- Acknowledged app-local/current-file fallback counts as accepted storage for action posture, but remains visibly distinct as fallback mode.
- Budget is mandatory before real provider-backed acquisition or EVEidence writes.
- This packet is one more dry run, not persisted config.

Atlas has accepted storage/runtime hardening proofs:

- `storage.authority_preflight`
- `support.gate_stack_readout`
- `verify:cadence-simulation`
- `storage.setup_gate_readout`
- `storage.setup_gate_readout.action_class_matrix`
- `storage.setup_gate_readout.storage_authority`

Recent accepted state:

- `workspace/OverseerHS121-local-first-api-lane-model-adoption.md`
- `workspace/OverseerHS122-storage-gate-action-matrix.md`
- `workspace/OverseerHS124-hs123-storage-gate-action-matrix-review.md`
- `workspace/OverseerHS126-hs125-storage-hardening-orientation-review.md`
- `workspace/OverseerHS127-storage-config-acknowledgement-proof-scope.md`
- `workspace/OverseerHS129-hs128-storage-config-acknowledgement-review.md`
- `workspace/OverseerHS130-storage-config-decision-brief.md`
- `workspace/OverseerHS131-storage-config-dry-run-scope.md`

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

Dev should implement a fixture/offline dry-run readout for the future storage authority config write.

Source of intent:

- `workspace/OverseerHS130-storage-config-decision-brief.md`
- `workspace/OverseerHS131-storage-config-dry-run-scope.md`
- existing `storage.setup_gate_readout.storage_authority`
- existing storage setup/gate verifier patterns

Ordered steps:

1. Inspect storage setup/gate, storage authority/preflight, service registry, and verifier patterns.
2. Add a dry-run readout for the future storage authority config write, integrated with or adjacent to `storage.setup_gate_readout`.
3. Use the accepted target path pattern:

```text
<Atlas app/root>/config/storage-authority.json
```

4. Do not write the file. Simulate only.
5. Prove the dry-run payload shape includes:
   - schema/version
   - selected storage mode
   - selected storage root or DB path basis
   - fallback acknowledgement status
   - fallback acknowledgement provenance
   - budget bytes
   - path basis
   - validation status
   - simulated created/updated timestamp or placeholder
   - invalidation basis if applicable
6. Prove states:
   - explicit selected storage with budget
   - app-local fallback available but unacknowledged
   - app-local fallback acknowledged with budget
   - acknowledgement invalidated
   - no storage selected
   - selected storage missing/unavailable
   - selected storage invalid/degraded
   - budget missing while provider-backed work would be requested
7. Expose dry-run readout fields:
   - `dry_run`
   - `would_write`
   - `target_path`
   - `target_path_basis`
   - `path_allowed`
   - `path_block_reason`
   - `payload`
   - `readback_simulation`
   - `validation_result`
   - `renderer_payload_ignored`
   - `enforcement_state`
8. Prove renderer payloads cannot choose arbitrary config paths, storage roots, fallback acknowledgement, or budget bytes through the readout payload.
9. Add or update focused fixture/offline verification.
10. Update Evidence / Dev Handoff in `workspace/current.md` and create the expected DevHS file with files changed, sample output, verification commands, and boundary confirmation.

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

Stop and return to Overseer/Human before implementation if:

- the proof requires writing a real config file
- the proof requires persisting acknowledgement
- the proof requires enforcing storage lockout
- the proof requires moving, copying, migrating, relocating, restoring, or deleting DB/storage
- the proof requires live/provider/API calls
- the proof requires changing Discovery/Evidence/Hydration semantics
- the proof requires renderer path selection or filesystem probing
- the proof requires treating `workspace/to-be-sorted/` as current task input
- the proof requires UI wording or renderer design

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

## Evidence

HS131 opens from:

- HS130 decisions: file-portable config home, acknowledged fallback remains visibly distinct, budget mandatory before provider-backed acquisition/EVEidence writes, one more dry run before persisted config.
- HS131 scope: prove would-write payload, target path, simulated readback, and renderer safety before real writes.

Dev should replace this section with concise proof evidence after implementation.

## Dev Handoff

Pending Dev handoff.

Expected:

- `workspace/DevHS131-storage-config-persistence-dry-run.md`
