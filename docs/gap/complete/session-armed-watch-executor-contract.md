# Gap To-Do: Session-Armed Watch Executor Contract

Status: Complete
Priority: P2

## Actionables

- Define the contract for running due watches from Electron.
- Decide how the user arms/disarms watch execution for a session.
- Define how due watches are selected, started, locked, completed, and recorded.
- Keep executor design separate from passive page load behavior.

## Task Requirements

Watch schedule/status planning exists, but no executor loop should be built until its behavior is explicitly contracted.

The contract should answer:

- what does session armed mean?
- what UI action arms/disarms it?
- how often does the executor check `watch.schedule`?
- how many due watches can run at once?
- how are task locks and live gates applied?
- how are success/failure/backoff states recorded?
- what happens when the app sleeps, closes, or restarts?

## Guardrails

- No live collection from passive page load.
- No hidden background scraping.
- Due watches must respect live API gate, session gate, poll interval, backoff, and caps.
- Watch runs must use evidence-creating task services.
- Failures should update scheduling state without looping aggressively.

## Completion Signal

A contract or current-state document defines the executor behavior clearly enough that implementation can proceed without inventing polling semantics in UI code.

Completed by:

- `docs/contracts/session-armed-watch-executor-contract.md`

## Related Documents

- `docs/gap/complete/watch-scheduler-and-backoff.md`
- `docs/statements/attention-driven-intelligence.md`
- `docs/contracts/scope-definition-contract.md`
- `docs/current-state/current-ipc-ui-preparation.md`
