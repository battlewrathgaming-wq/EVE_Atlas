# Feature: Evidence Compaction To Assessment

Status: Read-only preflight and assessment preservation path exist; evidence deletion remains blocked
Updated: 2026-05-23

## Purpose

Evidence compaction to assessment is the planned path for preserving what was learned from old evidence before any future evidence pruning exists.

The safe model is:

```text
old scoped evidence
-> read-only compaction preview
-> deliberate assessment artifact
-> future pruning only if explicitly implemented and confirmed
```

## Data Classification

Compaction preview is support/readiness data.

Assessment artifacts are operator memory.

Neither preview nor assessment is raw evidence.

## Current Behavior

Atlas currently supports:

- retention/compaction preflight
- assessment preview from scoped evidence
- explicit assessment creation from preview/report context
- citation validation for assessment artifacts
- no evidence deletion

Evidence pruning remains blocked.

## User Value

- old trails can become durable memory before they cool
- assessment survives separately from raw evidence
- future retention work has a safe preflight boundary
- operator judgement stays explicit

## Must Not Do

- Delete evidence silently.
- Treat assessment as replacement evidence.
- Hide the evidence window behind a score.
- Create artifacts automatically for every entity.
- Run compaction from passive report display.
- Add destructive pruning without snapshot/preflight/confirmation and a separate implementation decision.

## Future Acceptance Conditions For Pruning

Before any evidence deletion exists, Atlas should have:

- DB snapshot path
- preflight impact summary
- assessment preservation option
- explicit confirmation language
- non-destructive verification
- destructive verification in disposable DBs only
- clear failure records for any bug found

Related docs:

- `docs/gap/complete/retention-compaction-write-decision.md`
- `docs/gap/complete/retention-assessment-compaction-design.md`
- `docs/gap/complete/runtime-db-snapshot-and-restore-preflight.md`
- `docs/statements/retention-and-deprecation-policy.md`
- `docs/terms/work-products.md`
