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

1. `watch-scheduler-and-backoff.md`
2. `report-performance-indexes.md`
3. `readiness-side-effects.md`

Supporting current-state note:

- `backend-electron-readiness.md`

Completed items are moved to `docs/gap/complete`.

`queue-status-scope-isolation.md`, `ui-language-contract.md`, `ipc-mutating-action-services.md`, `background-worker-execution.md`, `http-timeouts-and-cancellation.md`, and `structured-report-responses.md` have been completed and moved to `docs/gap/complete`.

The next implementation slice should address watch scheduler and backoff, because the service layer can now trigger collection but durable due-watch orchestration is still missing.
