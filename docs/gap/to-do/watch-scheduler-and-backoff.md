# Gap To-Do: Watch Scheduler And Backoff

Status: Open
Priority: P2

## Actionables

- Implement durable watch scheduling for system/radius watches and actor watches.
- Use stored watch fields such as active state, poll interval, next poll time, last success/error, and backoff state.
- Add session-armed or user-armed scheduler behavior for Electron.
- Surface due watches, blocked watches, backoff, and last run status to the UI/service layer.

## Task Requirements

Collection workers exist, but full watch orchestration is not implemented.

The scheduler should answer:

- which watches are due?
- which watches are active?
- which watches are blocked by backoff or live API gate?
- which task should run next?
- how are successes/failures written back to watch rows?

## Guardrails

- Scheduler must not run live collection from passive page load alone.
- Live collection remains explicit, session-armed, or user-enabled.
- Poll intervals and caps must be visible and respected.
- Backoff should prevent repeated failure loops.
- Evidence-creating runs must use task locking.

## Completion Signal

A fixture or offline scheduler test creates watches with due/not-due/backoff states and proves only eligible watches are selected. A controlled run updates last success/error and next poll fields correctly.

## Related Files

- `src/main/db/schema.sql`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/watchlist/watchlistRepository.js`
- `docs/gap/to-do/backend-electron-readiness.md`
