# TODO: Concurrency And Locking

## Actionables

- Define which tasks may run concurrently.
- Define locks for evidence-creating operations.
- Prevent overlapping ingestion on the same scope when unsafe.
- Allow safe concurrent read/report operations.
- Decide how hydration interacts with reports.
- Block pruning/destructive actions during ingestion.

## Task Requirements

Electron UI can trigger multiple actions quickly. The backend needs clear concurrency rules.

Initial policy to consider:

- reports: concurrent allowed
- metadata hydration: concurrent with reports, but serialized per scope if needed
- ingestion/expansion: one active evidence-writing task per scope
- SDE imports: exclusive
- pruning: exclusive and blocked during ingestion

## Guardrails

- No duplicate expansion caused by overlapping tasks.
- No destructive operation during evidence writes.
- Partial/cancelled tasks must report clear status.

## Completion Signal

The backend has clear task locks or equivalent safeguards for evidence-writing and destructive actions.

