# OverseerHS76 - Queue Stale Expiration Design Input

Date: 2026-05-25
Role: Atlas Overseer
Status: design input only; not a Dev runway

## Purpose

Capture Human intent for a possible Queue stale/expiration policy lane after HS74.

This note does not authorize implementation. It should inform the next Overseer-shaped packet if the Human selects queue stale/expiration policy.

## Human Intent Captured

Atlas queue policy should not treat queued refs as a generic inbox.

The queue should be understood as ongoing Watch-scheduled work:

- Watch configurations schedule scoped API request work.
- Watch cadence may be daily with a one-day lookback, every five days with a five-day lookback, or user-defined within abuse-prevention controls.
- The Watch system adds request work to the queue on scoped intervals.
- Queue freshness should be tied to the originating Watch interval/lookback and schedule, not only wall-clock age.
- Live searches should also enter the queue with priority instead of bypassing queue/rate controls by pulsing live search directly.
- Queue policy does not affect local hydration; readability/label hydration remains a separate local process.

## Ref Meaning To Clarify

`ref` needs explicit definition before policy hardening.

Working meaning:

```txt
queued ref = a queued Discovery reference to a provider item or expansion target, not Evidence
```

For killmail expansion, a queued ref currently points at a zKill-provided `killmail_id`/hash pair plus provenance/scope metadata. It remains Discovery/provenance until successful ESI expansion writes Evidence.

## Initial Policy Shape

Fresh:

- A queued ref is fresh while it is the current work item for its originating Watch/manual scope and has not been completed, superseded, or aged past its Watch interval/lookback policy.

Complete:

- Successful expansion writes Evidence and moves the ref out of active pending work.

Failed / Retryable:

- Failure and retry should be linked.
- A failed ref should preserve queue state and provenance.
- Failed refs may remain retryable while still relevant to the originating Watch configuration and interval/lookback policy.

Stale:

- A queued ref may become stale when it rests in the queue longer than its originating Watch interval.
- A queued ref may also become stale when a new queued request for the same Watch target/scope/time window supersedes it.

Expired:

- Expired should mean no longer useful for current Watch-driven collection/review.
- Expired must not imply Evidence deletion.
- Expired must not hide the fact that previous work failed or was skipped.

## Uniqueness Direction

For Watch-driven queue items, only one active unique work item should exist per Watch configuration identity.

Likely uniqueness ingredients:

- Watch configuration ID or manager-assigned queue-work ID
- target
- time window
- scope/lookback
- provider/source lane

This needs code/schema verification before acceptance. It may not match current storage exactly.

## Guardrails

- Do not treat queued refs as Evidence.
- Do not delete Evidence through queue stale/expiration policy.
- Do not add automatic background retry loops in the policy packet unless separately accepted.
- Do not add live/API behavior during policy verification.
- Do not assume current schema already has a Watch setup manager ID without tracing it.
- Do not apply queue stale/expiration or cadence policy to local hydration.
- Preserve Watch as active routine check behavior.
- Preserve Marked as interest/attention, not active routine checking.

## Open Questions For HS76

- What exactly is a `ref` in each queue lane?
- Does the current queue table store enough Watch identity to enforce one active work item per Watch configuration/scope/time window?
- How should manual queued refs differ from Watch-scheduled queued refs?
- Should stale be computed or persisted?
- Should expired refs remain visible in reports, and for how long?
- What operator-facing state should distinguish pending, failed, retryable, stale, expired, expanded, and cached?
- What abuse-prevention controls should govern user-defined Watch cadence?
- How should live-search priority interact with Watch-scheduled queue work without bypassing cadence/rate controls?
