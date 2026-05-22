# Contract: Session-Armed Watch Executor

Status: Active
Date: 2026-05-22

## Purpose

The session-armed watch executor describes how the Electron app may run due actor and system/radius watches.

It is an execution contract, not an evidence contract. Evidence is still created only by existing watch collection services that expand ESI killmails and persist normalized activity events.

## Boundary

Owned by:

- future Electron watch execution service
- future UI arm/disarm control
- existing `watch.schedule` status service
- existing evidence-creating `actor.watch` and `system.radius.watch` service commands
- existing metadata-only `watch.recordRun` service command

Not owned by:

- passive report views
- readiness refreshes
- queue/watch status preview
- app startup alone

## Session Armed Meaning

`sessionArmed` means the user has explicitly allowed Atlas to run due watches during the current app session.

Rules:

- Default state is disarmed on app start.
- Arming is a visible UI action, such as `Arm Watch Session`.
- Disarming is always available and stops future dispatch.
- Arming is volatile session state and should not be persisted across app restarts.
- Always-on-top/window state is unrelated to watch arming.
- A page load, navigation, readiness refresh, or status refresh must not arm the session.

## Execution Loop

When armed, the executor may poll `watch.schedule` on a fixed interval.

Initial recommended behavior:

- run an immediate schedule check when the user arms the session
- poll every 60 seconds while armed
- dispatch at most one due watch per tick
- run at most one evidence-creating watch task at a time
- do not start another watch while an evidence-creating task lock is active

This keeps live API use predictable and makes task progress inspectable.

## Gate Order

Each executor tick must apply gates in this order:

1. Session armed.
2. Live API gate enabled.
3. Existing task lock allows evidence-creating work.
4. `watch.schedule` marks a watch due.
5. Watch caps and stored watch scope are valid.

If any gate is closed, the executor records no collection work.

## Due Watch Selection

Due watches come from `watch.schedule`.

The executor should pick one due watch per tick using stable ordering:

- earliest `next_poll_at`
- then oldest `last_success_at` or never-successful first
- then watch type and watch ID as tie-breakers

The executor must not invent due state in renderer code.

## Dispatch

Actor watches dispatch through:

```txt
actor.watch
```

System/radius watches dispatch through:

```txt
system.radius.watch
```

Dispatch should use task execution (`asTask` / detached task) so progress, warnings, cancellation, and errors remain visible through the task UI.

The task payload must be derived from the stored watch row. The renderer must not rebuild collection semantics itself.

## Completion Recording

After a dispatched watch task finishes:

- success records through `watch.recordRun` with `status: success`
- failure records through `watch.recordRun` with `status: failed`
- failure uses bounded backoff before the watch can be due again
- warnings stay attached to the task/fetch run diagnostics

The executor should not loop aggressively after failure.

If the user disarms while a task is running:

- no new watch starts
- the running task may finish unless the user explicitly cancels it
- cancellation is visible through the task system

## Sleep, Close, And Restart

If the app sleeps or is suspended:

- the executor resumes by checking `watch.schedule`
- it must not burst-run all overdue watches
- one due watch per tick remains the default

If the app closes:

- no background watch execution continues
- session armed state is lost

If the app restarts:

- watches may appear due
- they remain blocked by `session_not_armed` until the user arms the session again

## Guardrails

- No live collection from passive page load.
- No hidden background scraping.
- Due watches respect session gate, live API gate, poll interval, backoff, task locks, and caps.
- Watch execution uses existing evidence-creating services.
- Collection diagnostics remain visible through tasks, fetch runs, API logs, and reports.
- Disposition labels affect presentation only and must not block evidence ingestion.

## Verification Expectations

Current supporting verification:

- `verify:watch-scheduler`
- `verify:task-runner`
- `verify:background-execution`
- `verify:live-api-gate`
- `verify:renderer-shell`

Future executor implementation should add checks for:

- startup is disarmed
- arming triggers schedule check but not passive page load
- disarming stops future dispatch
- one due watch dispatches per tick
- live API disabled blocks dispatch
- task lock blocks overlapping evidence-creating work
- success/failure records through `watch.recordRun`
- restart returns to disarmed state
