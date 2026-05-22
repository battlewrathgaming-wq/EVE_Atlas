# Gap To-Do: Local Scale And Stability Smoke

Status: Open
Priority: P2
Milestone: Structured Area Review And Watch Authoring

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

## Related Documents

- `docs/gap/complete/runtime-process-isolation-review.md`
- `docs/audits/audit-2026-05-22-overseer-controlled-workflow-checkpoint.md`
- `docs/gap/complete/report-performance-indexes.md`
- `scripts/verify-bulk-synthetic.js`

