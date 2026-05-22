# Operator UI Workflow Polish Handoff

Date: 2026-05-22

## Context

The Operator Workflow Closure And Debuggability milestone is complete.

Completed signals:

- offline operator workflow scenario smoke
- assessment artifact review closure
- bounded operator debug trace pack
- positive-ref scoped discovery smoke decision
- `verify:all` passed with 53 scripts after the code-bearing slices

The next work should not add new ingestion logic by default. The backend/service shell is proven enough to begin polishing how an operator uses the existing safe paths.

## Recommended Next Milestone

Operator UI Workflow Polish.

Purpose:

Make existing safe backend capabilities easier to trigger, review, and understand in the Electron shell without weakening Atlas boundaries.

## Attention Items

1. Debug trace pack UI exposure

The CLI/support module exists, but the renderer does not yet expose it. This should be a deliberate operator action, likely in Readiness or Tasks/Support.

2. Assessment artifact ergonomics

The assessment review surface is safe and citation-aware. The next pass should improve operator clarity around creating assessment memory from report context without making it feel like evidence.

3. Live target discipline

Atlas can now run meaningful live paths. Guardrails for target/window/cap selection should be written clearly before more live testing.

4. Positive-ref scoped discovery-only smoke

Deferred until a respectful target/window is known. This is useful but not urgent. It should remain discovery-only, with zero ESI expansion and zero evidence writes.

## Boundary Risks

- Do not let support/debug trace packs become evidence exports.
- Do not let assessment artifacts become inputs to observation reports.
- Do not run positive-ref live smoke just to satisfy curiosity.
- Do not add passive collection or passive queue expansion from renderer page loads.
- Do not implement evidence pruning until retention policy is explicitly accepted.

## Current To-Do Files

- `docs/gap/to-do/debug-trace-renderer-surface.md`
- `docs/gap/to-do/assessment-artifact-ergonomics-pass.md`
- `docs/gap/to-do/live-target-discipline-checklist.md`
- `docs/gap/to-do/positive-ref-live-smoke-candidate.md`

## Roadmap

- `docs/roadmap/operator-ui-workflow-polish.md`
