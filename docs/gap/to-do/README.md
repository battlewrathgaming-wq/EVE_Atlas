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

1. `app-readiness-and-settings.md`
2. `ipc-service-contract.md`
3. `scope-controls-contract.md`
4. `task-runner-and-progress.md`
5. `live-api-gate-ux.md`
6. `report-response-contract.md`
7. `queue-expansion-selection.md`
8. `error-warning-taxonomy.md`
9. `concurrency-and-locking.md`
10. `destructive-actions-and-retention.md`
11. `ui-language-contract.md`

Supporting current-state note:

- `backend-electron-readiness.md`

The first implementation slice should probably be app readiness plus IPC service shape, because those define what the renderer is allowed to ask for before any UI component starts shaping backend behavior.
