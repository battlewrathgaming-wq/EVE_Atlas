# Operator Debug Trace Pack

Milestone: Operator Evidence Operations Readiness

## Mission

Give operators and reviewers a compact way to collect the useful traces after a run fails or behaves unexpectedly.

This is a supportability task, not a new intelligence feature.

## Actionables

- Define a trace pack command or documented collection path.
- Include:
  - latest fetch runs
  - latest API request logs
  - latest task history
  - data quality warnings
  - queue status summary
  - corpus health summary if available
  - app readiness summary
  - relevant smoke artifacts
- Redact or avoid sensitive values if any are introduced later.
- Store trace packs under `.tmp` by default.
- Add a fixture-backed verification that produces a trace pack without live APIs.

## Acceptance Checks

- Trace pack is explicit operator action.
- Trace pack does not call live APIs.
- Trace pack does not create evidence, observations, or assessments.
- Trace pack can be attached to an audit handover without needing the full runtime DB.

## Dev Notes

```txt

```
