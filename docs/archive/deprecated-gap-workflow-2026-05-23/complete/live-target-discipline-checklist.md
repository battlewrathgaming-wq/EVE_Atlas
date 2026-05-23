# Live Target Discipline Checklist

Milestone: Operator UI Workflow Polish

## Mission

Define the operator-facing guardrails for selecting live test or live collection targets.

Atlas is now capable enough that accidental broad collection is the main practical risk. Live operations should remain scoped, reviewable, and easy to stop.

## Actionables

- Document target-selection guidance for live smoke and operator testing.
- Include:
  - prefer known low/moderate activity systems or actors
  - use disposable `.tmp` DBs for smoke tests
  - set lookback/caps explicitly
  - prefer discovery-only before expansion when exploring
  - keep expansion caps global
  - never use trade hubs or high-volume chokepoints for first-pass tests
  - preserve generated smoke/debug artifacts
- Decide whether this belongs in a term, statement, or UI support note.
- Update the relevant live smoke scripts/docs only if a concrete behavior change is needed.

## Acceptance Checks

- Live target selection guidance is written where future operators/devs will find it.
- The guidance distinguishes discovery-only from expansion.
- The guidance keeps zKill discovery and ESI expansion separate.
- The guidance does not encourage passive or broad live collection.

## Dev Notes

```txt
Completed 2026-05-22.

Added docs/statements/live-target-discipline.md as an operational statement.

The statement covers target selection, disposable .tmp DBs, explicit lookback/caps,
discovery-only before expansion, global expansion caps, high-volume target avoidance,
artifact preservation, and the distinction between zKill discovery and ESI expansion.

No script behavior change was needed in this slice.
```
