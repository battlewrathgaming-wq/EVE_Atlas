# Gap To-Do

This folder tracks known unfinished work before formal gap analysis.

These notes are not failures and not roadmap commitments. They are practical gaps noticed during development that should be reviewed, accepted, changed, or retired during a later gap analysis pass.

Use this folder for:

- backend readiness gaps
- UI readiness gaps
- audit follow-ups
- missing contracts or validation layers
- deferred but important implementation work

## IPC/UI Readiness Checklist

The current checklist is grouped around preparing the Electron shell and renderer without weakening the evidence pipeline.

Recommended order:

1. `concurrency-and-locking.md`
2. `destructive-actions-and-retention.md`
3. `ui-language-contract.md`

Supporting current-state note:

- `backend-electron-readiness.md`

Completed items are moved to `docs/gap/complete`.

The next implementation slice should tighten concurrency and locking rules, because evidence-creating and destructive actions need predictable task overlap behavior before UI triggers exist.
