# Gap To-Do: Queue And Watch Status Views

Status: Complete
Priority: P2

## Actionables

- Build a queue status/selection view from queue report and `queue.selection` responses.
- Build a watch schedule/status view from `watch.schedule`.
- Show pending, expanded, cached, failed, superseded, cap-skipped, due, blocked, inactive, backoff, session-gated, and live-gated states clearly.
- Keep queue previews visually distinct from evidence.

## Task Requirements

Before live execution controls are added, the user should be able to inspect pending work and watch readiness.

Queue view should show:

- queued refs by scope/status
- preview fields as discovery context only
- expected ESI calls for selected expansion
- selected/skipped/cached/failed state

Watch view should show:

- active/inactive watches
- due/not due/backoff/live disabled/session disarmed
- next poll and last success/error times
- source actor/system scope

## Guardrails

- Queue previews are not evidence.
- Watch due state must not automatically trigger collection.
- Disposition/watch labels affect presentation only.
- Live API disabled should be visible but not alarming.

## Completion Signal

The renderer can inspect queued refs and watch schedule state without making live zKill/ESI calls or writing evidence.

## Related Documents

- `docs/contracts/discovery-queue-contract.md`
- `docs/gap/complete/queue-expansion-selection.md`
- `docs/gap/complete/watch-scheduler-and-backoff.md`
- `docs/terms/at-a-glance-preview.md`
