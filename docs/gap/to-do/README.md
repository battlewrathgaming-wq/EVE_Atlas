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

1. `ipc-mutating-action-services.md`
2. `background-worker-execution.md`
3. `http-timeouts-and-cancellation.md`
4. `structured-report-responses.md`
5. `watch-scheduler-and-backoff.md`
6. `report-performance-indexes.md`
7. `readiness-side-effects.md`

Supporting current-state note:

- `backend-electron-readiness.md`

Completed items are moved to `docs/gap/complete`.

`queue-status-scope-isolation.md` and `ui-language-contract.md` have been completed and moved to `docs/gap/complete`.

The next implementation slice should expose governed IPC service commands for mutating actions, because the renderer needs a controlled boundary before it can trigger discovery, expansion, collection, hydration, or watch changes.
