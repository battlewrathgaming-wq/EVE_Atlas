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

1. `scope-controls-contract.md`
2. `task-runner-and-progress.md`
3. `live-api-gate-ux.md`
4. `report-response-contract.md`
5. `queue-expansion-selection.md`
6. `error-warning-taxonomy.md`
7. `concurrency-and-locking.md`
8. `destructive-actions-and-retention.md`
9. `ui-language-contract.md`

Supporting current-state note:

- `backend-electron-readiness.md`

Completed items are moved to `docs/gap/complete`.

The next implementation slice should expose scope controls through the service boundary, because UI forms need the same defaults and validation as the CLI.
