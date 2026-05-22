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

1. `retention-assessment-compaction-design.md`

## Milestone Todo

Current milestone: initial presentation shell.

The goal is not to build the final interface. The goal is to prove that the renderer can present Atlas work products through the service boundary without becoming a data authority.

The milestone should leave Atlas with:

- a minimal Electron renderer shell
- a frameless draggable widget shell with optional always-on-top state
- a visible readiness/settings screen
- common task progress and cancellation UI
- a first structured report presentation surface
- scope controls backed by service validation
- queue/watch status views that do not trigger hidden live work
- an agreed session-armed watch executor contract
- an accepted retention/assessment compaction design before destructive pruning work

## Supporting Notes

- `backend-electron-readiness.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/audits/audit-2026-05-22-rigging-checkpoint-review.md`

Completed items are moved to `docs/gap/complete`.

`queue-status-scope-isolation.md`, `ui-language-contract.md`, `ipc-mutating-action-services.md`, `background-worker-execution.md`, `http-timeouts-and-cancellation.md`, `structured-report-responses.md`, `watch-scheduler-and-backoff.md`, `report-performance-indexes.md`, `readiness-side-effects.md`, `renderer-shell-service-boundary.md`, `frameless-widget-shell.md`, `readiness-settings-screen.md`, `task-progress-and-cancellation-ui.md`, `report-presentation-actor-first.md`, `scope-controls-ui.md`, `queue-and-watch-status-views.md`, and `session-armed-watch-executor-contract.md` have been completed and moved to `docs/gap/complete`.

The next implementation slice should continue with retention/assessment compaction design before broader report/UI polishing.
