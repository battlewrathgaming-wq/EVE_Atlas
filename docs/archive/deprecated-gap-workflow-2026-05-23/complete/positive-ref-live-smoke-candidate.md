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
Completed 2026-05-22.

Ran controlled positive-ref scoped discovery-only smoke:
- target: ZTS-4D [solarSystemID: 30004660]
- radius: 0
- lookback: 604800 seconds / 7 days
- max refs per system: 1
- zKill calls: 1
- ESI calls: 0
- refs discovered: 1
- queued refs written: 1
- killmails written: 0
- activity_events written: 0

Audit note:
docs/audits/audit-2026-05-22-positive-ref-live-scoped-discovery-smoke.md
```
