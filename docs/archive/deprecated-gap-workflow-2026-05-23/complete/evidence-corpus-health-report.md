# Evidence Corpus Health Report

Milestone: Operator Evidence Operations Readiness

## Mission

Add a read-only health report for a local Atlas runtime database.

The report should tell an operator whether the local evidence store is coherent before they run more live work, build assessments, or consider retention tasks.

## Actionables

- Add a CLI report and service response for corpus health.
- Keep it read-only.
- Report core row counts:
  - `killmails`
  - `activity_events`
  - `discovered_killmail_refs`
  - watches
  - entities
  - metadata/type tables
  - assessment artifacts
  - warnings
  - fetch/API logs
- Report integrity checks:
  - duplicate activity event keys
  - orphan activity events without killmail
  - queued refs already expanded
  - queued refs not yet expanded
  - unresolved entity labels
  - unresolved type labels
  - missing system metadata
  - data quality warnings by type
- Report operational freshness:
  - latest fetch run
  - latest evidence timestamp
  - latest metadata hydration
  - latest SDE import/build if available
- Return structured data for renderer use and text output for CLI/export.

## Acceptance Checks

- Report does not parse SDE zip files at runtime.
- Report does not call zKill or ESI.
- Report does not infer assessment.
- `verify:all` includes a fixture-backed health report check.

## Dev Notes

```txt

```
