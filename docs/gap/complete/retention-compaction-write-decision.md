# Gap To-Do: Retention Compaction Write Decision

Status: Complete - No-Write Decision
Priority: P2
Milestone: Controlled Actor/Area Operation

## Mission Statement

Decide whether the next milestone should implement assessment compaction writes, or keep compaction as preview-only until more operational evidence exists.

## Items For Completion

- Review current `assessment.compact_from_evidence` preflight behavior.
- Decide whether to implement artifact creation from compaction preview.
- Keep evidence deletion out of scope unless separately approved.
- Define confirmation language and required reason/summary if writes proceed.
- Define verification proving no evidence is deleted by compaction write.
- If deferred, document why and what signal is needed later.

## Guardrails

- Compaction write is assessment creation, not pruning.
- Evidence deletion remains blocked.
- User confirmation is required.
- Assessment artifact must cite/snapshot source scope and sample counts.
- Do not silently create assessment artifacts.

## Completion Signal

There is either a completed implementation plan for compaction artifact writes, or a clear no-write decision for the next milestone.

## Decision

Do not implement assessment compaction writes in the next milestone.

Keep `assessment.compact_from_evidence` as read-only preview for now.

## Rationale

The current project has enough assessment artifact creation for the operator proof:

- report-context assessment memory exists
- assessment artifacts persist
- compaction preview can show what would survive future pruning
- evidence deletion remains blocked

Adding compaction writes now would introduce another assessment-creating workflow before the controlled actor/area operation loop has enough real use. It would also add UI and verification pressure immediately after the renderer modularization review warned against adding more workflow mass to `app.js`.

## Current Safe Behavior

Current `assessment.compact_from_evidence` preflight:

- is read-only
- requires typed actor scope for a ready preview
- includes entity ID/name
- includes evidence window
- includes source report parameters
- includes source run IDs
- includes sample killmail IDs
- includes appearance, attacker, and victim counts
- includes observed systems, regions, and ships
- does not create assessment artifacts
- does not delete killmails or activity events

## Signal Needed Later

Reconsider compaction writes when at least one of these is true:

- a user has real operational need to preserve old scoped evidence before pruning
- retention/deprecation work becomes active rather than theoretical
- radius/corporation report responses are native structured enough to snapshot cleanly
- renderer modularization is complete enough to add a dedicated retention/compaction UI

## Future Write Requirements

If implemented later, compaction write must:

- require explicit user confirmation
- require assessment reason or summary
- create an `evidence_compaction` assessment artifact
- cite evidence scope, source report parameters, sample killmail IDs, and counts
- prove no evidence is deleted by the write action
- keep evidence pruning as a separate, still-blocked action

## Verification Required Later

Future implementation should add checks proving:

- compaction write creates exactly one assessment artifact
- compaction write does not delete killmails
- compaction write does not delete activity events
- score fields still require reason/summary
- pruning remains unavailable unless separately implemented and approved

## Related Documents

- `docs/contracts/assessment-compaction-contract.md`
- `docs/gap/complete/compaction-preservation-preflight.md`
- `docs/gap/complete/assessment-artifact-persistence.md`
- `docs/statements/retention-and-deprecation-policy.md`
