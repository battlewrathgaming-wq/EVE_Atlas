# Task Concurrency And Cancellation Stress

## Mission

Stress task locks, cancellation, and retry behavior across evidence-creating, metadata-only, destructive-preflight, and exclusive task classes.

Atlas should fail loudly and safely when operators click too quickly, cancel mid-flight, or start conflicting work.

## Task Requirements

- Start overlapping tasks and verify correct lock behavior:
  - manual expansion vs manual expansion for same scope
  - manual expansion vs watch executor dispatch
  - metadata hydration vs metadata hydration for same scope
  - SDE lookup build vs evidence-creating task
  - runtime snapshot create vs other exclusive work
- Cancel running tasks during:
  - HTTP wait
  - queued ref processing
  - metadata hydration
  - report/debug trace generation if supported
- Verify cancellation:
  - records task state
  - releases locks
  - preserves already-stored evidence
  - leaves queue/run state reviewable
  - allows a clean rerun
- Verify disarming the watch executor stops future dispatch but does not silently kill an already-running task.

## Suggested Verification

Add or expand:

```txt
npm.cmd run verify:task-stress
```

## Acceptance Criteria

- No stuck locks after failed/cancelled tasks.
- Conflicting work reports `TASK_LOCKED` or a clearer taxonomy message.
- Reruns after cancellation are deterministic.
- Task history remains useful for operator review.

