# AURA Atlas Current Work

Status: Resting / no active Dev runway
Last updated: 2026-05-31

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: reduce workspace noise, preserve recent provenance, and prepare for the next bounded Atlas hardening seam.

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

1. Storage gate action matrix.
   - Shaped in `workspace/OverseerHS122-storage-gate-action-matrix.md`.
   - Next likely Dev packet: extend `storage.setup_gate_readout` with read-only action-class posture proof.
   - Do not enforce lockout yet.

2. Local-first API lane model assurance.
   - Accepted locally as steering context in `workspace/OverseerHS121-local-first-api-lane-model-adoption.md`.
   - Use it to ask: what local state exists, which lane wants to move, which gates apply, what would be written, and what basis should the operator see?

3. External I/O held-state follow-up.
   - Clarify due work while off, re-enable behavior, and no-catch-up-flood posture.

4. Hydration backlog preview.
   - Derive unresolved ID/readability pressure from existing rows before adding durable hydration queues.

## Guardrails

- Do not treat `workspace/to-be-sorted/` as active work.
- Do not use archived or sorted material as task queues.
- Do not treat Shapespace, Orchestration shelves, or shared checkpoints as Atlas authority.
- Do not implement storage enforcement before the storage action matrix and storage config/acknowledgement behavior are accepted.
- Do not implement persistent hydration backlog tables yet.
- Do not broaden into UI work while the current heading is system hardening.
- Do not rename Atlas source/bridge terms from advisory or shaping material.
- Do not run live/provider/private/destructive actions without explicit Human authorization and an accepted runway.

## Expected Executor

Current executor: Overseer / Human discussion

Expected Dev handoff: none

## Evidence

This resting state follows:

- HS118 acceptance of `storage.setup_gate_readout`
- HS119 restart-state audit
- HS120 surface discovery review
- Human direction on 2026-05-31 to clear workspace noise before the next seam

## Dev Handoff

No Dev handoff is expected.

If Dev work is later selected, `workspace/current.md` must be rewritten with:

- executor set to Dev
- expected DevHS filename
- ordered steps
- guardrails and non-goals
- stop conditions
- exact verification commands
