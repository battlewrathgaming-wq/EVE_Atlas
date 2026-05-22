# Gap To-Do: Assessment From Area Context Review

Status: Open
Priority: P3
Milestone: Structured Area Review And Watch Authoring

## Mission Statement

Decide how, or whether, an operator should create assessment memory from area/radius observations.

Actor-report assessment memory exists. Area reports introduce different semantics: repeated presence, multi-system presence, and local activity do not automatically identify ownership, staging, intent, or affiliation.

## Items For Completion

- Review current actor-report assessment artifact flow.
- Identify which area/radius observations may be assessment inputs.
- Define wording that separates area observation from assessment.
- Decide whether area-context assessment should create actor/corp-focused artifacts, system/area-focused artifacts, or remain deferred.
- If proceeding, define required reason/summary fields and source snapshot fields.
- Keep evidence deletion and compaction writes out of scope.

## Guardrails

- Do not turn repeated presence into proof.
- Do not create assessment artifacts automatically.
- Do not treat watchlist/disposition labels as evidence.
- Do not add UI implementation until radius structured report presentation exists.

## Completion Signal

There is either a clear no-build decision or an implementation-ready design for deliberate area-context assessment memory.

## Related Documents

- `docs/gap/complete/assessment-report-workflow-ui.md`
- `docs/gap/complete/retention-compaction-write-decision.md`
- `docs/terms/work-products.md`
- `docs/statements/retention-and-deprecation-policy.md`

