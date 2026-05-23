# Complete: Concurrency And Locking

Status: Complete For IPC Shell Preparation

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

## Current Implementation

- Read-only tasks do not acquire locks and may overlap.
- Metadata tasks serialize by metadata scope.
- Evidence-creating tasks serialize by evidence scope.
- Exclusive tasks block active non-read tasks and block new non-read tasks while active.
- Destructive tasks use exclusive/global locking and are blocked during active evidence or metadata work.
- Lock conflicts return taxonomy-shaped `TASK_LOCKED` errors.
- Verified by `verify:task-runner`.

## Remaining Follow-On Work

- Individual worker/service wrappers still need to choose correct task classification and scope keys as they are exposed to UI.
- Persistent task history can be revisited if in-memory task history is insufficient.
- Cancellation remains vocabulary-level until worker operations support abort signals.
