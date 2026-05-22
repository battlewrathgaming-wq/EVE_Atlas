# Complete: Queue Expansion Selection UX

Status: Complete For IPC Shell Preparation

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

## Current Implementation

- `queue.selection` service command previews queued refs selected for explicit ESI expansion.
- Selection modes include selected IDs, next, oldest, newest, and priority.
- Selection applies a global expansion cap.
- Cached, expanded, superseded, and cap-skipped refs are labeled with skip reasons.
- Preview fields are explicitly labeled as zKill discovery preview metadata and not evidence.
- Exposed preview fields currently include killmail time, victim ship type ID, attacker count, and zKill total value when present.
- Verification confirms selection creates no killmails and no activity events.
- Verified by `verify:queue-selection` and `verify:service-registry`.

## Remaining Follow-On Work

- Renderer controls still need to present selection modes and require confirmation before expansion.
- Manual expansion remains the evidence-creating step.
- Preview usefulness can improve as discovery preview fields mature, but preview must remain non-evidence.
