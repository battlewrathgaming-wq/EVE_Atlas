# TODO: Queue Expansion Selection UX

## Actionables

- Define selection modes for queued discovery refs.
- Show which refs are cached, pending, selected, skipped, or expanded.
- Support explicit expansion of selected refs.
- Support capped expansion modes such as top N, oldest, newest, or highest priority.
- Show expected ESI expansion count before running.
- Preserve manual discovery as non-evidence until expansion.

## Task Requirements

Manual discovery creates queued refs, not evidence.

The UI needs a safe way to turn selected refs into evidence through explicit ESI expansion.

Selection modes to consider:

- selected refs
- next N pending
- newest N
- oldest N
- by system
- by actor
- by priority

## Guardrails

- Queue preview metadata is not evidence.
- Expansion is the evidence-creating step.
- Cached killmails should be skipped.
- Global expansion caps should apply.

## Completion Signal

The user can inspect discovery results, understand what is pending, and explicitly choose what becomes evidence.

