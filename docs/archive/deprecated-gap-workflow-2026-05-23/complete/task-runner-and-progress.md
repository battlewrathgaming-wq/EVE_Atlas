# Complete: Task Runner And Progress Model

Status: Complete For IPC Shell Preparation

## Actionables

- Define a shared task model for long-running actions.
- Support task states: queued, running, succeeded, failed, cancelled, partial, capped.
- Add progress events for discovery, expansion, hydration, imports, and reports where useful.
- Prevent unsafe overlapping tasks.
- Surface task warnings and caps in a consistent shape.
- Preserve task history enough for inspection.

## Task Requirements

Many backend actions will be long-running:

- SDE imports
- zKill discovery
- ESI expansion
- manual expansion
- metadata hydration
- report generation over larger scopes

The UI needs a common way to show progress without each feature inventing its own state model.

## Guardrails

- Evidence-creating tasks should not silently overlap on the same scope.
- Reports may generally run concurrently.
- Pruning/destructive tasks should not run during ingestion.
- Cancellation should leave clear partial status rather than ambiguous success.

## Completion Signal

The app has one task lifecycle vocabulary and a backend path for progress updates, warnings, cancellation, and recent task history.

## Current Implementation

- Shared task states exist: queued, running, succeeded, failed, cancelled, partial, capped.
- Shared task classifications exist: read-only, metadata-only, evidence-creating, destructive, exclusive.
- Task runner records progress, warnings, result, error, and recent in-memory history.
- Non-read-only task locking prevents unsafe overlap by scope/classification.
- Service registry can run service commands as tasks with `asTask: true`.
- `task.list` and `task.get` service commands expose recent task history.
- Verified by `verify:task-runner` and `verify:service-registry`.

## Remaining Follow-On Work

- Long-running collectors/importers still need to emit richer staged progress as they are wrapped.
- Cancellation is represented in the vocabulary but not yet wired to cancellable worker operations.
- Persistent task history can be added later if in-memory history is not enough for the Electron shell.
