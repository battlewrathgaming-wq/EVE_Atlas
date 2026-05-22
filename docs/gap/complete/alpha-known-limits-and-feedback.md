# Alpha Known Limits And Feedback

Milestone: Local Alpha Trial Readiness

## Mission

Document what Atlas is known not to do yet, and how alpha feedback should be captured.

This prevents alpha testing from turning into vague disappointment or uncontrolled feature creep.

## Actionables

- Add a known-limits document.
- Include current boundaries:
  - no passive broad ingestion
  - no automatic queue expansion
  - no evidence pruning
  - no public packaging
  - no map rendering
  - no AI commentary
  - live APIs gated and respectful
- Include accepted rough edges:
  - local-only DB
  - operator-selected scopes
  - partial samples
  - metadata may be incomplete until hydrated/imported
- Add a simple feedback template:
  - question being asked
  - steps taken
  - expected outcome
  - actual outcome
  - DB/snapshot/trace artifact path
  - whether live APIs were enabled
- Keep feedback tied to evidence/report/support surfaces.

## Acceptance Checks

- Known limits are easy to find from the README or runbook.
- Feedback template encourages reproducible reports.
- Document reinforces evidence/observation/assessment boundaries.

## Dev Notes

```txt
Completed 2026-05-22.

Added docs/runbooks/local-alpha-known-limits-and-feedback.md.

The document captures known non-goals, accepted rough edges, layer boundaries,
a reproducible feedback template, examples of useful feedback, and alpha review
questions.
```
