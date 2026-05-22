# Gap To-Do: Session-Armed Watch Executor Implementation

Status: Complete
Priority: P1
Milestone: Presentation Validation And Controlled Execution

## Actionables

- Implement the watch executor only from `docs/contracts/session-armed-watch-executor-contract.md`.
- Add an explicit renderer arm/disarm control for the current app session.
- Default to disarmed on app start.
- Use `watch.schedule` for due/blocked/backoff state.
- Dispatch due watches through task-wrapped `actor.watch` or `system.radius.watch`.
- Record success/failure timing through `watch.recordRun`.

## Task Requirements

Executor behavior should start conservative:

- immediate schedule check when armed
- fixed interval check while armed
- at most one due watch per tick
- at most one evidence-creating watch task at a time
- no burst-run of overdue watches after sleep/restart
- no passive collection from page load, readiness refresh, report display, queue preview, or watch status refresh

The renderer may display status, but it must not invent due state.

## Guardrails

- Session arming is volatile and must not persist across app restarts.
- Live API disabled blocks dispatch.
- Task locks block overlapping evidence-creating work.
- Failure must back off rather than tight-loop.
- Disarming stops future dispatch but does not silently cancel an already-running task.
- Disposition/watch labels affect display only and must not erase evidence.

## Completion Signal

The app can be armed for the current session, dispatch one due watch through the existing task system, record success/failure, and return to disarmed state after restart.

Verification should prove:

- startup is disarmed
- passive views do not dispatch
- live disabled blocks dispatch
- one due watch dispatches per tick
- `watch.recordRun` receives success/failure state

## Completion Notes

Implemented through the backend service boundary as volatile session state:

- `watch.executor.status`
- `watch.executor.arm`
- `watch.executor.disarm`
- `watch.executor.tick`

The renderer exposes explicit Arm/Disarm controls in Queue / Watches. Passive readiness, report, queue, and watch status refreshes remain read-only and do not dispatch collection.

Verification:

- `verify:watch-executor`
- `verify:service-registry`
- `verify:renderer-shell`

## Related Documents

- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/gap/complete/watch-scheduler-and-backoff.md`
- `docs/gap/complete/task-progress-and-cancellation-ui.md`
- `docs/gap/complete/background-worker-execution.md`
