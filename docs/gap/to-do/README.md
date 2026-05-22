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

1. `structured-report-responses.md`
2. `watch-scheduler-and-backoff.md`
3. `report-performance-indexes.md`
4. `readiness-side-effects.md`

Supporting current-state note:

- `backend-electron-readiness.md`

Completed items are moved to `docs/gap/complete`.

`queue-status-scope-isolation.md`, `ui-language-contract.md`, `ipc-mutating-action-services.md`, `background-worker-execution.md`, and `http-timeouts-and-cancellation.md` have been completed and moved to `docs/gap/complete`.

The next implementation slice should address native structured report responses, because the renderer should consume structured report data instead of parsed CLI text.
