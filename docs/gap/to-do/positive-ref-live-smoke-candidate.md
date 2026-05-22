# Positive-Ref Live Smoke Candidate

Milestone: Operator UI Workflow Polish

## Mission

Run a positive-ref scoped discovery-only live smoke only when a respectful target/window is known.

This is deferred by decision, but it remains useful. A non-empty live zKill result would prove artifact shape and queue behavior under real refs while still writing no evidence.

## Actionables

- Wait for a suitable target/window.
- Use a disposable `.tmp` DB.
- Set `AURA_ATLAS_LIVE_API=1` explicitly.
- Use scoped zKill discovery only.
- Make zero ESI calls.
- Write queued refs only.
- Write no `killmails`.
- Write no `activity_events`.
- Preserve the generated smoke artifact.
- Record an audit note with counts and boundaries.

## Acceptance Checks

- Positive refs are queued as possible evidence.
- The smoke artifact includes route, lookback, counts, queued ref sample, and boundary wording.
- No expansion happens.
- No evidence tables are written.
- API footprint is scoped and reported.

## Dev Notes

```txt

```
