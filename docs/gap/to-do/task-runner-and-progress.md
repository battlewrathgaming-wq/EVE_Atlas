# TODO: Task Runner And Progress Model

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

