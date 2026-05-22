# Gap To-Do: Retention Compaction Write Decision

Status: Open
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

## Related Documents

- `docs/contracts/assessment-compaction-contract.md`
- `docs/gap/complete/compaction-preservation-preflight.md`
- `docs/gap/complete/assessment-artifact-persistence.md`
- `docs/statements/retention-and-deprecation-policy.md`
