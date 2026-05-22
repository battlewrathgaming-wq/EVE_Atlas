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

1. `report-performance-indexes.md`
2. `readiness-side-effects.md`

Supporting current-state note:

- `backend-electron-readiness.md`

Completed items are moved to `docs/gap/complete`.

`queue-status-scope-isolation.md`, `ui-language-contract.md`, `ipc-mutating-action-services.md`, `background-worker-execution.md`, `http-timeouts-and-cancellation.md`, `structured-report-responses.md`, and `watch-scheduler-and-backoff.md` have been completed and moved to `docs/gap/complete`.

The next implementation slice should address report performance indexes, because the service layer can now expose reports to UI surfaces and repeated renderer reads should stay predictable.
