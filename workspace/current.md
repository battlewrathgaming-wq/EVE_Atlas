# AURA Atlas Current Work

Status: Resting / no active Dev runway
Last updated: 2026-05-31

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: rest after accepted HS123 storage gate action-class matrix proof and prepare for the next bounded Atlas hardening seam.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Current State

No active Dev runway is open.

Atlas is resting after accepted storage/runtime hardening proofs:

- `storage.authority_preflight`
- `support.gate_stack_readout`
- `verify:cadence-simulation`
- `storage.setup_gate_readout`

Recent accepted restart/surface state:

- `workspace/OverseerHS119-restart-state-audit.md`
- `workspace/OverseerHS120-surface-discovery-review.md`
- `workspace/OverseerHS121-local-first-api-lane-model-adoption.md`
- `workspace/OverseerHS122-storage-gate-action-matrix.md`
- `workspace/OverseerHS124-hs123-storage-gate-action-matrix-review.md`
- `workspace/OverseerHS126-hs125-storage-hardening-orientation-review.md`

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

Non-active workspace material has begun moving to:

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

## Next Shaping Direction

Do not open Dev work until the next seam is deliberately selected.

Likely next shaping candidates:

1. Storage config and acknowledgement behavior.
   - Decide how explicit storage setup, app-local/current-file fallback acknowledgement, missing storage recovery, and portable config should behave.
   - Accepted as the recommended next seam in `workspace/OverseerHS126-hs125-storage-hardening-orientation-review.md`.
   - Prefer read-only or fixture-only proof before any real storage config write.

2. Storage enforcement dry-run / lockout boundary.
   - Use `storage.setup_gate_readout.action_class_matrix` as proof input, but do not enforce until the acknowledgement/config model is accepted.
   - Viable later, but do not jump to real enforcement before storage config/acknowledgement is shaped.

3. External I/O held-state follow-up.
   - Clarify due work while off, re-enable behavior, and no-catch-up-flood posture.

4. Hydration backlog preview.
   - Derive unresolved ID/readability pressure from existing rows before adding durable hydration queues.

## Guardrails

- Read-only proof only.
- Use existing storage setup/gate facts where possible.
- No storage enforcement.
- No runtime lockout enforcement.
- No storage config writing.
- No DB movement, copy, migration, relocation, or deletion.
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
- Do not treat HS122 as UI copy authority.
- Do not treat action-class posture as enforcement yet.
- Do not treat `workspace/to-be-sorted/` as active work.
- Do not use archived or sorted material as task queues.
- Do not treat Shapespace, Orchestration shelves, or shared checkpoints as Atlas authority.
- Do not implement persistent hydration backlog tables yet.
- Do not broaden into UI work while the current heading is system hardening.
- Do not rename Atlas source/bridge terms from advisory or shaping material.
- Do not run live/provider/private/destructive actions without explicit Human authorization and an accepted runway.

## Stop Conditions

Stop and return to Overseer/Human before implementation if:

- the next seam would enforce storage lockout without accepted storage config/acknowledgement behavior
- the next seam would write real storage config without explicit runway
- the next seam would move, copy, migrate, relocate, restore, or delete DB/storage
- the next seam would run live/provider/API calls
- the next seam would change Discovery/Evidence/Hydration semantics
- the next seam would treat `workspace/to-be-sorted/` as current task input
- the next seam would broaden into UI wording or renderer design

## Required Verification

No verification is required while resting.

Future Dev packets should name exact commands.

## Evidence

HS123 accepted with Overseer correction.

Accepted implementation:

- `storage.setup_gate_readout` now includes read-only `action_class_matrix`.
- The matrix reports action-class posture for HS122 storage states and action classes.
- Verifier coverage proves every state/action-class mapping and basis fields.
- Overseer corrected matrix state precedence so missing/unselected storage is not hidden by budget hard-lock.
- HS126 accepted DevHS125 orientation: next selected seam should be storage config / acknowledgement proof, not real enforcement.

Overseer verification:

```powershell
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:service-registry
node --check src\main\services\storageSetupGateReadoutService.js
node --check scripts\verify-storage-setup-gate.js
git diff --check
```

Result:

- all commands passed
- `git diff --check` passed with LF-to-CRLF working-copy warnings only

## Dev Handoff

No Dev handoff is expected while resting.
