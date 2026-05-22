# Operator Debug Trace Pack

Milestone: Operator Workflow Closure And Debuggability

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
- Include enough detail for another chat/dev worker to understand the failure context.
- Prefer summaries, counts, command results, and artifact paths over raw evidence payloads.

## Acceptance Checks

- Trace pack is explicit operator action.
- Trace pack does not call live APIs.
- Trace pack does not create evidence, observations, or assessments.
- Trace pack can be attached to an audit handover without needing the full runtime DB.
- Trace pack makes clear what it excludes by default, especially raw ESI payloads.

## Dev Notes

```txt
Completed 2026-05-22.

Implemented report:debug-trace through scripts/operator-debug-trace-pack.js and
src/main/support/operatorDebugTracePack.js.

Trace packs are explicit local support/debug artifacts written under .tmp by default.
They include recent fetch runs, API request logs, in-memory task history summaries,
data quality warning groups/latest warnings, queue status, corpus health summary,
app readiness summary, and smoke artifact paths.

They do not call zKill or ESI, do not parse SDE zip files, do not create evidence,
observations, or assessments, and exclude raw expanded ESI payloads by default.

Added verify:operator-debug-trace to produce a fixture trace pack and confirm it is
read-only for killmails, activity_events, discovered refs, fetch runs, API logs,
warnings, and assessment artifacts.
```
