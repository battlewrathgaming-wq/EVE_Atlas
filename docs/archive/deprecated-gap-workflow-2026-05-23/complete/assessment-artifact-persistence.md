# Gap To-Do: Assessment Artifact Persistence

Status: Complete
Priority: P2
Milestone: Presentation Validation And Controlled Execution

## Actionables

- Implement assessment artifact persistence before any executable evidence pruning.
- Start with explicit user-committed entity interest or assessment artifacts.
- Preserve entity ID, cached label, score, reason, evidence window, scope, sample counts, and source report parameters.
- Keep assessment artifacts separate from raw evidence and observations.
- Add preflight/verification proving assessment artifacts survive future evidence compaction.

## Task Requirements

The first implementation should support deliberate assessment memory, not automatic scoring for every observed entity.

Minimum shape should align with:

- entity type and ID
- cached display label
- artifact type
- interest/priority/impact score fields as applicable
- score reason or assessment summary
- evidence window start/end
- source report type and parameters
- appearance counts
- systems/regions observed snapshot
- created/updated timestamps

This creates a place for long-term `CorpID -> assessment score` memory without forcing Atlas to retain every old evidence row forever.

## Guardrails

- Assessment is not evidence.
- Scores require reasons or supporting summaries.
- AI or automated suggestions must not become assessment without acceptance.
- Do not prune evidence until artifact persistence and compaction preflight exist.
- Do not silently rewrite assessment meaning; use update history or supersession if needed.

## Completion Signal

A user can deliberately save an assessment artifact from a report or entity context, inspect it later, and verify that it is stored as assessment memory rather than evidence.

## Completion Notes

Implemented assessment artifact persistence as a separate storage/service layer:

- `assessment_artifacts` table
- `assessment.create`
- `assessment.list`
- `assessment.get`

The first implementation supports deliberate user-committed assessment memory only. It does not create automatic scores, does not prune evidence, and does not treat assessment as evidence.

Verification:

- `verify:assessment-artifacts`
- `verify:retention-preflight`
- `verify:db-integrity`

## Related Documents

- `docs/contracts/assessment-compaction-contract.md`
- `docs/features/entity-interest-artifacts.md`
- `docs/features/evidence-compaction-to-assessment.md`
- `docs/terms/entity-interest.md`
- `docs/terms/work-products.md`
- `docs/statements/retention-and-deprecation-policy.md`
