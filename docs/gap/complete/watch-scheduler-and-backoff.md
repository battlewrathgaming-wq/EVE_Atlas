# Gap To-Do: Watch Scheduler And Backoff

Status: Complete For Scheduler Planning
Priority: P2

## Completed

- Added a shared watch scheduler service for actor watches and system/radius watches.
- Uses stored active state, poll interval, next poll time, last success/error timestamp, and backoff state.
- Surfaces due watches, blocked watches, backoff state, live API gate state, session-armed state, and source scope details.
- Added service commands:
  - `watch.schedule` as read-only schedule/status planning.
  - `watch.recordRun` as metadata-only success/failure scheduling state update.
- Added offline verification for due, not-due, backoff, inactive, session-disarmed, and live-gate-disabled states.

## Important Boundary

This slice does not add passive live collection.

The scheduler can answer what is due and can record run outcomes, but an Electron session-armed executor/poll loop is still future work. Page load or report display must not run live collection by itself.

Current scheduler answers:

- which watches are due
- which watches are active/inactive
- which watches are blocked by backoff, future next poll, session gate, or live API gate
- how success/failure updates `last_polled_at`, `last_success_at`, `last_error_at`, `next_poll_at`, and `backoff_until`

## Guardrails

- Scheduler must not run live collection from passive page load alone.
- Live collection remains explicit, session-armed, or user-enabled.
- Poll intervals and caps must be visible and respected.
- Backoff should prevent repeated failure loops.
- Evidence-creating runs must use task locking.

## Verification

- `verify:watch-scheduler`
- `verify:service-registry`
- `verify:all`

## Remaining Work

- Add the actual Electron session-armed watch executor loop.
- Decide how the UI exposes arming/disarming and due-watch execution.
- Wire due watch execution through existing task locking and evidence-creating service commands.

## Related Files

- `src/main/db/schema.sql`
- `src/main/watchlist/watchScheduler.js`
- `src/main/services/serviceRegistry.js`
- `scripts/verify-watch-scheduler.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/watchlist/watchlistRepository.js`
- `docs/gap/to-do/backend-electron-readiness.md`
