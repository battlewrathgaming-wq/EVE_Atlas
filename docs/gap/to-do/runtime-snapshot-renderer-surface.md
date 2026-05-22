# Runtime Snapshot Renderer Surface

Milestone: Operator Evidence Operations Readiness

## Mission

Expose runtime DB snapshot preflight and explicit snapshot creation in the Electron renderer as a safety/support surface.

This is not a restore feature and not a retention/pruning feature.

## Actionables

- Decide where snapshot safety belongs in the current shell:
  - Readiness
  - future Support/Diagnostics
  - another minimal operator safety panel
- Prefer the smallest useful renderer addition.
- Invoke `runtime.db_snapshot.preflight` through the service bridge.
- Show:
  - source DB path
  - destination path
  - DB size
  - WAL/SHM state
  - core table counts
  - latest fetch run
  - latest evidence timestamp
  - assessment artifact counts
  - boundary wording
- Add an explicit create action through `runtime.db_snapshot.create`.
- Require a visible confirmation before create.
- Do not add restore UI.
- Do not add pruning UI.
- Do not call live APIs.
- Add renderer shell verification for the new surface.

## Acceptance Checks

- `verify:renderer-shell` covers the snapshot controls/text.
- `verify:runtime-snapshot` still passes.
- `verify:all` still passes.
- Snapshot preflight does not write files.
- Snapshot create writes only under the approved project `.tmp` path by default.
- The UI states that snapshot creation does not prune, compact, or delete evidence.

## Dev Notes

```txt

```
