# README And Operator Quickstart Refresh

Milestone: Local Alpha Trial Readiness

## Mission

Update the top-level README so it reflects the current Atlas app instead of the early evidence-pipeline-only foundation.

This should help a careful local operator understand what Atlas can do, what it must not do automatically, and how to start safely.

## Actionables

- Preserve the evidence doctrine at the top:
  - zKill is discovery only
  - expanded ESI killmails are evidence
  - reports are presentation
  - assessments are deliberate memory
- Replace stale Milestone 1/2 language with current capability sections.
- Document the main safe paths:
  - readiness
  - corpus health
  - scoped discovery
  - manual expansion
  - actor/radius reports
  - assessment artifacts
  - runtime snapshot
  - debug trace pack
- Document key scripts:
  - `npm run dev`
  - `npm run verify:all`
  - `npm run smoke:electron`
  - `npm run report:corpus-health`
  - `npm run snapshot:runtime-db`
  - `npm run report:debug-trace`
- Document the F: storage rule.
- Document live gate basics without encouraging casual live calls.
- Keep the README operator-facing, not exhaustive architecture documentation.

## Acceptance Checks

- README no longer implies Atlas is only Milestone 1/2.
- README clearly distinguishes evidence, observation, assessment, and support products.
- README states that live APIs are explicitly gated.
- README states that Atlas does not perform passive broad ingestion.
- `verify:all` still passes.

## Dev Notes

```txt
Completed 2026-05-22.

Top-level README now reflects the current local Electron/operator workflow rather
than the early Milestone 1/2 pipeline-only state.

It covers:
- evidence doctrine
- current safe app capabilities
- F: storage rule
- first local start
- readiness, corpus health, scoped discovery, manual expansion, reports,
  assessment artifacts, runtime snapshots, and debug trace packs
- live API gate basics
- key local scripts

It remains operator-facing and points deeper architecture readers to docs.
```
