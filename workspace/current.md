# AURA Atlas Current Work

Status: Active Dev runway for HS128 storage config acknowledgement proof
Last updated: 2026-05-31

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: prove a read-only/fixture storage config and acknowledgement readout before any storage enforcement or real config writing.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS128-storage-config-acknowledgement-proof.md
```

## Current State

Active Dev runway is open for a read-only/fixture proof.

Atlas has accepted storage/runtime hardening proofs:

- `storage.authority_preflight`
- `support.gate_stack_readout`
- `verify:cadence-simulation`
- `storage.setup_gate_readout`
- `storage.setup_gate_readout.action_class_matrix`

Recent accepted state:

- `workspace/OverseerHS119-restart-state-audit.md`
- `workspace/OverseerHS120-surface-discovery-review.md`
- `workspace/OverseerHS121-local-first-api-lane-model-adoption.md`
- `workspace/OverseerHS122-storage-gate-action-matrix.md`
- `workspace/OverseerHS124-hs123-storage-gate-action-matrix-review.md`
- `workspace/OverseerHS126-hs125-storage-hardening-orientation-review.md`
- `workspace/OverseerHS127-storage-config-acknowledgement-proof-scope.md`

Recent advisory inputs still visible in the active workspace:

- `workspace/DataHS116-local-data-shape-hydration-backlog-review.md`
- `workspace/DataHS117-relationship-pivot-data-substrate-assurance.md`
- `workspace/SystemsAuditHS100-storage-path-budget-authority.md`
- `workspace/SystemsAuditHS101-local-lookup-vs-esi-enrichment.md`
- `workspace/SystemsAuditHS102-pruning-readiness.md`
- `workspace/SystemsAuditHS103-sequencer-provider-cadence.md`
- `workspace/SystemsAuditHS107-zkill-esi-trust-boundary.md`
- `workspace/SystemsAuditHS109-external-io-policy-fit.md`
- `workspace/SystemsAuditHS110-external-io-storage-edge-policy-table.md`
- `workspace/SystemsProposalHS104-two-clock-recovery-sequencer.md`
- `workspace/SystemsTraceHS105-search-watch-recovery-rewire-map.md`

Non-active workspace material is in:

- `workspace/to-be-sorted/`

That folder is an inactive sorting tray, not an archive, backlog, authority source, or Dev queue.

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

Dev should implement a read-only/fixture proof for storage config and fallback acknowledgement posture.

Source of intent:

- `workspace/OverseerHS126-hs125-storage-hardening-orientation-review.md`
- `workspace/OverseerHS127-storage-config-acknowledgement-proof-scope.md`
- existing `storage.authority_preflight`
- existing `storage.setup_gate_readout`
- existing storage setup/gate verifier patterns

Ordered steps:

1. Inspect current storage authority/preflight/setup gate services, service registry, runtime snapshot settings service, and relevant verifiers.
2. Add a read-only or fixture-only storage authority/config acknowledgement readout shape, preferably integrated with or adjacent to `storage.setup_gate_readout`.
3. Prove these states:
   - no storage selected
   - explicit configured storage selected
   - app-local/current-file fallback available but unacknowledged
   - app-local/current-file fallback acknowledged
   - acknowledgement invalidated
   - selected storage missing/unavailable
   - selected storage invalid/degraded
   - budget unconfigured
   - budget warning / strong warning / hard-lock
4. Expose fields sufficient for later enforcement decisions, such as:
   - mode
   - selected true/false
   - fallback available true/false
   - fallback acknowledged true/false
   - acknowledgement status
   - acknowledgement basis
   - acknowledgement invalid reason
   - config source
   - config version
   - storage root or DB path basis
   - validation status
   - budget source
   - budget bytes
   - read allowed
   - write allowed if enforced later
   - provider movement allowed if enforced later
5. Prove renderer payloads cannot select, override, or probe arbitrary filesystem paths through the readout payload.
6. Add or update focused fixture/offline verification.
7. Update Evidence / Dev Handoff in `workspace/current.md` and create the expected DevHS file with files changed, sample output, verification commands, and boundary confirmation.

## Guardrails

- Read-only proof only.
- Fixture-only config/acknowledgement inputs are allowed for verification.
- Use existing storage setup/gate facts where possible.
- No storage enforcement.
- No runtime lockout enforcement.
- No real storage config writing.
- No persisted acknowledgement writing.
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
- No bridge/IPC/service/payload rename unless unavoidable and approved by Overseer.
- Do not treat app-local/current-file fallback as accepted storage without an explicit acknowledgement state.
- Do not decide final portable config filename/location unless the proof only reports an unresolved decision.
- Do not treat action-class posture as enforcement yet.
- Do not treat `workspace/to-be-sorted/` as active work.
- Do not use archived or sorted material as task queues.
- Do not treat Shapespace, Orchestration shelves, or shared checkpoints as Atlas authority.
- Do not implement persistent hydration backlog tables yet.
- Do not broaden into UI work while the current heading is system hardening.
- Do not rename Atlas source/bridge terms from advisory or shaping material.

## Stop Conditions

Stop and return to Overseer/Human before implementation if:

- the proof requires writing real storage config
- the proof requires persisting acknowledgement
- the proof requires choosing the final portable config filename/location as production truth
- the proof requires moving, copying, migrating, relocating, restoring, or deleting DB/storage
- the proof requires live/provider/API calls
- the proof requires changing runtime provider behavior
- the proof requires changing Discovery/Evidence/Hydration semantics
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

HS128 opens from:

- HS126 accepted DevHS125 orientation: next selected seam should be storage config / acknowledgement proof, not real enforcement.
- HS127 shaped storage config / acknowledgement proof: selected storage, app-local fallback available, app-local fallback acknowledged, acknowledgement invalidated, and budget config should be visible before enforcement.

Dev should replace this section with concise proof evidence after implementation.

## Dev Handoff

Pending Dev handoff.

Expected:

- `workspace/DevHS128-storage-config-acknowledgement-proof.md`
