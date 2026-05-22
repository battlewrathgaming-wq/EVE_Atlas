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

- No active Controlled Actor/Area Operation gap remains in this folder.

Supporting audit:

- `docs/audits/audit-2026-05-22-overseer-backend-ui-boundary-handshake.md`

Completed Controlled Actor/Area Operation items are moved to `docs/gap/complete`.

## Current Milestone: Structured Area Review And Watch Authoring

Mission statement:

Turn the proven controlled workflow into a maintainable operator surface: split the renderer, add native structured radius reporting, present area observations without renderer-side inference, and expose watch authoring as explicit metadata work.

This milestone should leave Atlas with:

- renderer modules split by app surface or workflow boundary
- renderer-shell verification updated to scan all renderer modules
- native structured radius report responses comparable to actor report responses
- first radius/area report presentation in the renderer
- explicit watch authoring UI for actor and system/radius watches
- report-scoped metadata hydration planning for non-actor reports
- a measured local scale/stability check before any process-isolation decision

Recommended order:

- No active Structured Area Review And Watch Authoring gap remains in this folder.

Supporting audit:

- `docs/audits/audit-2026-05-22-overseer-controlled-workflow-checkpoint.md`
- `docs/audits/audit-2026-05-22-overseer-complete-audit-handover.md`

Completed Structured Area Review And Watch Authoring items are moved to `docs/gap/complete`.

Completed:

- `renderer-modularization-implementation.md`
- `native-structured-radius-report-response.md`
- `queue-report-text-export-fix.md`
- `radius-report-presentation-ui.md`
- `watch-authoring-ui.md`
- `report-scoped-metadata-hydration-expansion.md`
- `local-scale-and-stability-smoke.md`
- `assessment-from-area-context-review.md`

## Current Milestone: Evidence-Safe Assessment And Discovery UX

Mission statement:

Tighten the assessment layer now that Atlas can produce reports, queue refs, and deliberate assessment memory. Assessment artifacts should remain useful long-term memory, but their cited evidence basis must be validated or explicitly labelled.

This milestone should leave Atlas with:

- validated or explicitly labelled assessment artifact citations
- a clear path from compaction preview to deliberate assessment memory
- no evidence deletion
- a decision or implementation for scoped discover-refs-only system/radius UI
- improved live scoped zKill smoke artifacts
- regression checks that protect the evidence rule

Recommended order:

- No active Evidence-Safe Assessment And Discovery UX gap remains in this folder.

Supporting audit:

- `docs/audits/audit-2026-05-22-scoped-zkill-discovery-handover.md`

Roadmap:

- `docs/roadmap/evidence-safe-assessment-and-discovery-ux.md`

Completed:

- `assessment-citation-validation.md`
- `assessment-artifact-citation-status.md`
- `compaction-preview-to-assessment-interlock.md`
- `scoped-discovery-ui-path-decision.md`
- `live-scoped-zkill-smoke-artifacts.md`
- `evidence-rule-regression-checks.md`

## Completed Milestone: Operator Evidence Operations Readiness

Mission statement:

Turn Atlas from a proven controlled workflow into a cautious operator workstation. The next work should make live operations reviewable, local evidence stores inspectable, runtime data safer to handle, and assessment memory easier to review without weakening the evidence boundary.

This milestone should leave Atlas with:

- a reviewed live scoped zKill success-smoke path and artifact checklist
- a corpus health report for local runtime databases
- a renderer-visible local corpus health surface or an explicit deferral decision
- a renderer-visible snapshot preflight/create surface or an explicit deferral decision
- a DB snapshot/restore preflight before any pruning or destructive maintenance
- an offline operator workflow scenario smoke that exercises the shell/service boundary
- assessment artifact review surfaces that display citation status and evidence basis clearly
- a support/debug trace pack that references run state without becoming a raw evidence export
- no automatic evidence deletion
- no passive broad ingestion

Supporting audit:

- `docs/audits/audit-2026-05-22-overseer-evidence-safe-assessment-review.md`
- `docs/audits/audit-2026-05-22-overseer-operator-readiness-review.md`
- `docs/audits/audit-2026-05-22-overseer-operator-readiness-handover.md`

Completed:

- `live-scoped-discovery-success-smoke-review.md`
- `evidence-corpus-health-report.md`
- `runtime-db-snapshot-and-restore-preflight.md`
- `corpus-health-renderer-surface.md`
- `runtime-snapshot-renderer-surface.md`

## Current Milestone: Operator Workflow Closure And Debuggability

Mission statement:

Prove that the existing Atlas rigging works as one coherent operator loop and make failures reviewable without dumping raw evidence by default.

This milestone should leave Atlas with:

- an offline operator workflow scenario smoke that uses service/task paths
- explicit assessment artifact review closure
- a bounded operator debug trace pack
- a decision on whether to run a positive-ref scoped discovery-only smoke
- no automatic live work
- no evidence pruning
- no passive broad ingestion

Recommended order:

- No active Operator Workflow Closure And Debuggability gap remains in this folder.

Roadmap:

- `docs/roadmap/operator-workflow-closure-and-debuggability.md`

Completed:

- `operator-workflow-scenario-smoke.md`
- `assessment-artifact-review-surface.md`
- `operator-debug-trace-pack.md`
- `positive-ref-scoped-discovery-smoke-decision.md`

## Open Discussion For Next Handoff

- The accepted live scoped discovery smoke returned zero refs. A positive-ref discovery-only smoke is deferred until a known respectful target/window is available.
- Evidence pruning remains blocked even though snapshot preflight now exists.

## Current Milestone: Operator UI Workflow Polish

Mission statement:

Turn the proven backend/service shell into a clearer operator workflow without adding passive live collection, passive expansion, or evidence deletion.

This milestone should leave Atlas with:

- renderer-visible support/debug trace pack generation
- improved assessment creation/review ergonomics
- written live target-selection discipline
- a held positive-ref discovery-only smoke candidate for when a respectful target/window is known
- no automatic live work
- no automatic queue expansion
- no evidence pruning

Recommended order:

- No active Operator UI Workflow Polish gap remains in this folder.

Roadmap:

- `docs/roadmap/operator-ui-workflow-polish.md`

Completed:

- `debug-trace-renderer-surface.md`
- `assessment-artifact-ergonomics-pass.md`
- `live-target-discipline-checklist.md`
- `positive-ref-live-smoke-candidate.md`
