# AURA Atlas Current Work

Status: Resting / no active Dev runway
Last updated: 2026-05-31

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: rest after accepted HS128 storage config acknowledgement proof and prepare for the next bounded Atlas hardening seam.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Current State

No active Dev runway is open.

Atlas has accepted storage/runtime hardening proofs:

- `storage.authority_preflight`
- `support.gate_stack_readout`
- `verify:cadence-simulation`
- `storage.setup_gate_readout`
- `storage.setup_gate_readout.action_class_matrix`
- `storage.setup_gate_readout.storage_authority`

Recent accepted state:

- `workspace/OverseerHS119-restart-state-audit.md`
- `workspace/OverseerHS120-surface-discovery-review.md`
- `workspace/OverseerHS121-local-first-api-lane-model-adoption.md`
- `workspace/OverseerHS122-storage-gate-action-matrix.md`
- `workspace/OverseerHS124-hs123-storage-gate-action-matrix-review.md`
- `workspace/OverseerHS126-hs125-storage-hardening-orientation-review.md`
- `workspace/OverseerHS127-storage-config-acknowledgement-proof-scope.md`
- `workspace/OverseerHS129-hs128-storage-config-acknowledgement-review.md`

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

## Next Shaping Direction

Do not open Dev work until the next seam is deliberately selected.

Likely next shaping candidates:

1. Write-capable storage config shape.
   - Decide whether Atlas is ready to move from readout proof to a first persisted storage config model.
   - Requires Human/Overseer decision on portable config filename/location.

2. Acknowledgement persistence proof.
   - Prove how app-local/current-file fallback acknowledgement would be recorded, cleared, and invalidated.
   - Still avoid enforcement unless explicitly selected.

3. Enforcement dry-run / command-effect mapping.
   - Use `storage.setup_gate_readout.action_class_matrix` and `storage_authority` to report would-block decisions by service command/effect class.
   - Do not enforce until config/acknowledgement persistence is accepted.

4. External I/O held-state follow-up.
   - Clarify due work while off, re-enable behavior, and no-catch-up-flood posture.

5. Hydration backlog preview.
   - Derive unresolved ID/readability pressure from existing rows before adding durable hydration queues.

## Guardrails

- No active Dev work while resting.
- Do not treat action-class posture as enforcement yet.
- Do not treat storage authority readout as persisted config.
- Do not treat app-local/current-file fallback as accepted storage without explicit acknowledgement state.
- Do not write real storage config without accepted runway.
- Do not persist acknowledgement without accepted runway.
- Do not enforce lockout without accepted config/acknowledgement model.
- Do not move, copy, migrate, relocate, restore, or delete DB/storage without explicit runway.
- Do not run live/provider/private/destructive actions without explicit Human authorization and accepted runway.
- Do not treat `workspace/to-be-sorted/` as active work.
- Do not broaden into UI work while the current heading is system hardening.

## Stop Conditions

Stop and return to Overseer/Human before implementation if:

- the next seam would choose final portable config filename/location without Human/Overseer decision
- the next seam would write real storage config
- the next seam would persist acknowledgement
- the next seam would enforce storage lockout
- the next seam would move, copy, migrate, relocate, restore, or delete DB/storage
- the next seam would run live/provider/API calls
- the next seam would change Discovery/Evidence/Hydration semantics
- the next seam would treat `workspace/to-be-sorted/` as current task input
- the next seam would broaden into UI wording or renderer design

## Required Verification

No verification is required while resting.

Future Dev packets should name exact commands.

## Evidence

HS128 accepted with Overseer correction.

Accepted implementation:

- `storage.setup_gate_readout` now includes read-only `storage_authority`.
- `storage_authority` exposes selected storage, fallback availability, fallback acknowledgement, acknowledgement invalidation, selected storage validation, budget posture, and future enforcement allowance fields.
- Renderer-style payloads cannot forge storage authority, fallback acknowledgement, database path, or budget bytes.
- Overseer corrected budget-source coherence so trusted context budget appears in `storage_authority` when no fixture/config budget is supplied.

Overseer verification:

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
```

Result:

- all commands passed
- `verify:protected-terms` passed as warning-only with no renames and no protected-word JSON updates
- `git diff --check` passed with LF-to-CRLF working-copy warnings only

## Dev Handoff

No Dev handoff is expected while resting.
