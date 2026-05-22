# Gap To-Do: Compaction Preservation Preflight

Status: Complete
Priority: P2
Milestone: Operational Workflow Hardening

## Mission Statement

Design and implement the preservation preview that must exist before Atlas can ever prune evidence: show what assessment memory would survive, without deleting anything.

## Items For Completion

- Extend or add preflight for `assessment.compact_from_evidence`.
- Given a scoped evidence window, preview the assessment artifact that could be created.
- Show entity IDs, cached labels, evidence window, appearance counts, systems/regions, ships, sample killmail IDs, and source report parameters.
- Require user reason/summary before any artifact creation.
- Keep preflight read-only.
- Do not implement evidence deletion in this slice.
- Verify that existing `retention.preflight` remains non-destructive.

## Guardrails

- This is preservation preview, not pruning.
- Assessment memory does not replace raw evidence while evidence remains available.
- No evidence row should be deleted silently or as a side effect.
- Compaction must be scoped and auditable.
- Assessment artifact creation must remain deliberate.

## Completion Signal

Atlas can preview a would-be assessment artifact from scoped evidence, and the user can understand what memory would survive future pruning, while no evidence is deleted.

Completed:

- `retention.preflight` now returns an `assessment_preview` for `assessment.compact_from_evidence`.
- Preview requires typed actor scope to produce a ready snapshot.
- Preview includes entity ID/name, evidence window, sample killmail IDs, appearance counts, attacker/victim counts, observed systems, regions, ships, source report parameters, source run IDs, and boundary wording.
- User reason/summary is represented as preview metadata and `creation_ready`; no artifact is created by preflight.
- Evidence deletion remains unimplemented.
- Verification proves compaction preflight does not delete killmails/activity events and does not insert assessment artifacts.

Verification should include:

- `verify:retention-preflight`
- `verify:assessment-artifacts`
- `verify:db-integrity`

## Related Documents

- `docs/contracts/assessment-compaction-contract.md`
- `docs/features/evidence-compaction-to-assessment.md`
- `docs/statements/retention-and-deprecation-policy.md`
- `docs/gap/complete/destructive-actions-and-retention.md`
