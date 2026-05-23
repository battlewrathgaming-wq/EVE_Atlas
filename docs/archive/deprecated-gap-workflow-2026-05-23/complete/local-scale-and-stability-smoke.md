# Gap To-Do: Local Scale And Stability Smoke

Status: Complete
Priority: P2
Milestone: Structured Area Review And Watch Authoring

Completed: 2026-05-22

## Mission Statement

Measure local app stability before adding process isolation or heavier runtime architecture.

The goal is to discover practical pressure points in reports, renderer rendering, SQLite queries, and task execution using local fixture/synthetic data.

## Items For Completion

- Define a synthetic local corpus size for the first smoke: killmails, activity events, entities, refs, and watches.
- Keep all test DB and generated artifacts under `F:\Projects\AURA-Atlas\.tmp`.
- Run key reports over the synthetic corpus: actor, corporation, radius, queue, and metadata status.
- Measure elapsed time and row counts for the heaviest report paths.
- Run `smoke:electron` against a prepared local DB if practical.
- Record whether synchronous main-process work causes visible startup/render issues.
- Decide whether current detached task model remains acceptable.

## Guardrails

- No live/API calls for scale smoke.
- Do not introduce worker threads/process isolation unless the smoke exposes a measured need.
- Do not optimize by weakening evidence or report semantics.
- Keep generated DB artifacts disposable.

## Completion Signal

There is a documented local scale smoke result with timings, data size, pass/fail notes, and a decision on whether process isolation remains deferred.

## Completion Notes

Implemented `verify:local-scale-smoke` as an offline disposable-DB scale harness. Generated artifacts remain under `F:\Projects\AURA-Atlas\.tmp\local-scale-smoke`.

First corpus:

- killmails: 120
- activity events: 840
- queued discovery refs: 80
- actor watches: 3
- system/radius watches: 2
- fetch runs: 1
- metadata runs: 0

Measured report timings from the first successful run:

- actor report: 13.25 ms
- corporation report: 21.67 ms
- radius report: 34.07 ms
- queue report: 7.54 ms
- metadata status report: 1.91 ms

Decision:

The detached task model remains acceptable. No worker-thread or process-isolation implementation is justified by this smoke. The first future isolation candidate remains SDE import or SDE sync/compare if measured pressure appears.

Electron note:

The existing `smoke:electron` harness intentionally verifies a clean zero-evidence startup and is not suitable for opening a prepared evidence corpus without changing that contract. A prepared-corpus visual smoke should be a separate future harness if needed.

## Related Documents

- `docs/gap/complete/runtime-process-isolation-review.md`
- `docs/audits/audit-2026-05-22-overseer-controlled-workflow-checkpoint.md`
- `docs/gap/complete/report-performance-indexes.md`
- `scripts/verify-bulk-synthetic.js`
