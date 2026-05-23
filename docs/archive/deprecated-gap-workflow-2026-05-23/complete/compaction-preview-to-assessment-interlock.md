# Gap To-Do: Compaction Preview To Assessment Interlock

Status: Complete
Roadmap: `docs/roadmap/evidence-safe-assessment-and-discovery-ux.md`

Completed: 2026-05-22

## Task Requirement

Connect compaction preview output to validated assessment artifact creation without enabling raw evidence pruning.

## Why It Matters

Atlas already has read-only compaction preview. The next useful step is preserving deliberate memory from that preview, while keeping deletion blocked.

## Actionables

- Review `retention.preflight` assessment preview shape.
- Add or verify a path to create an `evidence_compaction` assessment artifact from the preview.
- Require user reason or summary.
- Validate cited evidence IDs and scope before writing.
- Keep the retention action itself read-only.

## Guardrails

- Do not delete raw killmails.
- Do not delete activity events.
- Do not auto-create compaction artifacts during preflight.
- Do not let AI commentary become accepted assessment without user action.

## Completion Signal

- A compaction preview can be converted into an assessment artifact only through explicit creation.
- The artifact citation status is validated.
- Evidence counts remain unchanged after the workflow.

## Completion Notes

Implemented a deliberate conversion helper:

```txt
assessmentArtifactInputFromCompactionPreview(preview, overrides)
```

The helper does not write anything by itself. It converts a ready read-only compaction preview into an `assessment.create` compatible payload. The caller must still explicitly create the assessment artifact.

Rules now verified:

- `retention.preflight` remains read-only
- compaction preview does not create assessment artifacts
- conversion requires assessment reason or summary
- resulting artifact type is `evidence_compaction`
- cited sample killmail IDs are validated by assessment artifact creation
- citation status is `verified` when the preview cites local evidence correctly
- killmail and activity event counts remain unchanged

Verified:

- `npm.cmd run verify:retention-preflight`
- `npm.cmd run verify:assessment-artifacts`

## Related Files

- `src/main/services/retentionActionService.js`
- `src/main/assessment/assessmentArtifactRepository.js`
- `scripts/verify-retention-preflight.js`
- `scripts/verify-assessment-artifacts.js`
