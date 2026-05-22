# Gap To-Do: Task Progress And Cancellation UI

Status: Complete
Priority: P1

## Completed

- Built UI for `task.list`, `task.get`, and `task.cancel`.
- Shows task state, classification, scope key, progress events, warnings, result summary, and error details.
- Supports refreshing task state without starting new backend work.
- Makes cancellation available only for queued/running tasks.

## Task Requirements

Renderer-triggered long actions may return a task handle immediately. The UI needs a common way to inspect those tasks.

Task view should support:

- recent task list
- selected task detail
- progress timeline
- warnings/errors
- result preview
- cancellation request

## Guardrails

- Task history is diagnostic/status material, not evidence.
- Cancelling a task must not be shown as successful evidence collection.
- Do not hide warnings behind success labels.
- Do not run duplicate tasks just to refresh task state.

## Completion Signal

A detached service task can be started, inspected while running, cancelled when supported, and reviewed after completion/failure from the renderer.

## Verification

- `verify:renderer-shell`
- `verify:task-runner`
- `verify:all`

## Related Documents

- `docs/gap/complete/task-runner-and-progress.md`
- `docs/gap/complete/background-worker-execution.md`
- `docs/gap/complete/http-timeouts-and-cancellation.md`
