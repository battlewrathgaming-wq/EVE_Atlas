# Gap To-Do: Runtime Process Isolation Review

Status: Complete
Priority: P3
Milestone: Presentation Validation And Controlled Execution

## Actionables

- Review whether current detached tasks are sufficient for expected batch sizes.
- Measure or simulate heavier collection/reporting paths before introducing worker threads or child processes.
- Identify which operations are CPU-heavy, synchronous SQLite-heavy, network-wait-heavy, or UI-sensitive.
- Decide whether to keep the current main-process service model or move selected work into worker threads, utility processes, child processes, or a separate local service.

## Task Requirements

This is a review before a rebuild.

Current known fact:

Detached tasks avoid blocking the immediate IPC response, but synchronous CPU/SQLite work may still execute in the Electron main process.

Review should consider:

- large radius report generation
- bulk manual expansion
- large SDE import
- metadata hydration batches
- watch executor runs while UI is open
- task progress responsiveness
- cancellation responsiveness
- SQLite locking and transaction behavior

## Guardrails

- Do not introduce process isolation only because it sounds cleaner.
- Do not duplicate evidence-writing logic across processes without a clear ownership model.
- Keep SQLite write authority explicit.
- Preserve task progress, cancellation, warnings, and audit logs.
- Keep F: runtime/cache path policy intact.

## Completion Signal

There is a short recommendation stating either:

- current detached task model is acceptable for the next milestone, or
- specific workloads should move to a separate runtime boundary, with the first target named.

## Completion Notes

Recommendation: current detached task model is acceptable for the next milestone.

Do not introduce worker threads, utility processes, child processes, or a separate local service yet. The first future isolation target, if measured pressure appears, should be SDE import / future SDE sync-compare. The second likely candidate is large report generation or evidence compaction over large local corp/radius scopes.

Review record:

- `docs/audits/audit-2026-05-22-runtime-process-isolation-review.md`

Verification signal:

- `verify:bulk` measured at roughly 3.4 seconds in this review
- `verify:all` passed with 44 scripts
- `smoke:electron` passed

## Related Documents

- `docs/gap/complete/background-worker-execution.md`
- `docs/gap/complete/http-timeouts-and-cancellation.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `src/main/services/taskRunner.js`
