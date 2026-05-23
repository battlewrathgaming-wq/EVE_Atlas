# Runtime DB Snapshot And Restore Preflight

Milestone: Operator Evidence Operations Readiness

## Mission

Add a safe snapshot and restore preflight before any future evidence pruning, retention compaction, or destructive maintenance.

This should make it harder to accidentally lose evidence while Atlas is still evolving.

## Actionables

- Add a read-only snapshot preflight that reports:
  - DB path
  - DB size
  - WAL/SHM state if present
  - table counts
  - latest fetch run
  - latest evidence timestamp
  - assessment artifact counts
- Add an explicit snapshot command or service action.
- Store snapshots under `F:\Projects\AURA-Atlas\.tmp` by default unless configured otherwise.
- Avoid silent writes outside the project policy.
- Add a verification script that creates a fixture DB, snapshots it, restores or opens the snapshot, and verifies row counts.
- Do not implement evidence pruning in this task.

## Acceptance Checks

- Snapshot command is explicit.
- Snapshot destination is reported before write.
- Restore/open verification proves the snapshot is usable.
- Snapshot task preserves evidence tables byte-for-byte or count-for-count according to the chosen approach.
- No retention delete path is added.

## Dev Notes

```txt

```
