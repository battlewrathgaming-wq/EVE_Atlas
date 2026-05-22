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

No remaining implementation items are currently listed in this folder.

Supporting current-state note:

- `backend-electron-readiness.md`

Completed items are moved to `docs/gap/complete`.

`queue-status-scope-isolation.md`, `ui-language-contract.md`, `ipc-mutating-action-services.md`, `background-worker-execution.md`, `http-timeouts-and-cancellation.md`, `structured-report-responses.md`, `watch-scheduler-and-backoff.md`, `report-performance-indexes.md`, and `readiness-side-effects.md` have been completed and moved to `docs/gap/complete`.

The next implementation slice should come from refreshed audit/gap review, or from the planned renderer shell once backend service semantics are accepted.
