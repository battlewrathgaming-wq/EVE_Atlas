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

- Active IPC/UI checklist items are listed under the current milestone below.

## Completed Milestone: Initial Presentation Shell

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

- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/audits/audit-2026-05-22-initial-presentation-checkpoint-review.md`
- `docs/audits/audit-2026-05-22-rigging-checkpoint-review.md`

Completed items are moved to `docs/gap/complete`.

`backend-electron-readiness.md`, `queue-status-scope-isolation.md`, `ui-language-contract.md`, `ipc-mutating-action-services.md`, `background-worker-execution.md`, `http-timeouts-and-cancellation.md`, `structured-report-responses.md`, `watch-scheduler-and-backoff.md`, `report-performance-indexes.md`, `readiness-side-effects.md`, `renderer-shell-service-boundary.md`, `frameless-widget-shell.md`, `readiness-settings-screen.md`, `task-progress-and-cancellation-ui.md`, `report-presentation-actor-first.md`, `scope-controls-ui.md`, `queue-and-watch-status-views.md`, `session-armed-watch-executor-contract.md`, and `retention-assessment-compaction-design.md` have been completed and moved to `docs/gap/complete`.

The next implementation slice comes from the refreshed audit/current-state review, not this retired checklist.

## Completed Milestone: Presentation Validation And Controlled Execution

Purpose:

Prove the Electron shell as an actual app experience, then add controlled execution paths without weakening Atlas doctrine.

This milestone is not a redesign milestone. It is a validation and controlled-action milestone.

The milestone should leave Atlas with:

- one documented Electron visual smoke path
- clear resolution for the blocked `file:///F:/...` browser smoke issue
- first evidence-creating UI actions wired through services/tasks/live gates
- session-armed watch execution implemented only from its contract
- assessment artifact persistence designed and started before evidence pruning
- a runtime process-isolation review based on real performance pressure, not assumption

Recommended order:

- No active presentation-validation gap remains in this folder.

## Current Milestone: Operational Workflow Hardening

Mission statement:

Turn the working Atlas shell into a cautious operator workflow: prove live paths under explicit control, improve report/assessment workflow usability, and keep all evidence, observation, assessment, and API boundaries visible.

This milestone should leave Atlas with:

- controlled live smoke notes for manual discovery and session-armed watch execution
- manual expansion and metadata hydration UI paths, or an accepted decision to defer one
- assessment artifact creation from report context
- report presentation polish based on real shell usage
- compaction/preservation preflight design before any evidence deletion
- a clear handoff for standalone Aura core extraction
- no speculative process isolation work unless measured UI/runtime pressure appears

Recommended order:

- No active operational workflow hardening gap remains in this folder.

Supporting audit:

- `docs/audits/audit-2026-05-22-overseer-runtime-handover-and-core-clone-readiness.md`

Completed operational workflow hardening items are moved to `docs/gap/complete`.

## Current Milestone: Controlled Actor/Area Operation

Mission statement:

Prove that an operator can move from a scoped actor or area question, through controlled collection and queue/evidence review, into observation and optional assessment memory without crossing Atlas boundaries.

This milestone is narrower than a dashboard. It should prove one coherent operator loop.

The milestone should leave Atlas with:

- a controlled actor operation path
- a controlled area/system/radius operation path
- one live ESI expansion smoke where the target/window intentionally contains refs
- explicit metadata hydration UI or a documented deferral
- at least one additional structured report UI beyond actor, or a chosen next report target
- renderer module/component boundaries reviewed before adding more workflow code
- a retention compaction write/no-write decision for the next milestone

Recommended order:

- `metadata-hydration-ui.md`
- `structured-report-expansion.md`
- `retention-compaction-write-decision.md`

Supporting audit:

- `docs/audits/audit-2026-05-22-overseer-backend-ui-boundary-handshake.md`
