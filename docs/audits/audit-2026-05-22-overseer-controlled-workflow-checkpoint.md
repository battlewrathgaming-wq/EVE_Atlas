# Audit: Overseer Controlled Workflow Checkpoint

Date: 2026-05-22
Reviewed through commit: `202af64`
Status: Accepted With Next-Milestone Constraints

## Review Summary

The controlled actor/area milestone is accepted.

The project now proves the core Atlas operator loop in a restrained way:

```txt
scope definition
-> live/API preflight
-> queued possible evidence
-> explicit ESI expansion
-> stored evidence
-> observation report
-> optional assessment memory
```

The important boundary remains intact:

- zKill refs are staging/provenance metadata until expanded through ESI.
- Expanded ESI killmails remain the evidence source.
- Reports derive observations from stored evidence and local lookup tables.
- Metadata hydration improves labels only.
- Assessment artifacts are deliberate memory, not proof.
- Passive renderer views are not collection triggers.

## Reviewed Handover Inputs

- `docs/audits/dev_backend_UI_boundary_2026-05-22.md`
- `docs/audits/audit-2026-05-22-live-expansion-smoke.md`
- `docs/gap/complete/controlled-actor-operation-workflow.md`
- `docs/gap/complete/controlled-area-operation-workflow.md`
- `docs/gap/complete/metadata-hydration-ui.md`
- `docs/gap/complete/structured-report-expansion.md`
- `docs/gap/complete/retention-compaction-write-decision.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-report-products.md`

## Code Review Notes

The service boundary is still healthy.

Renderer calls continue to use `window.atlasServices` and the preload bridge. The service registry remains the authority for command classification, task wrapping, and mutating/evidence-creating boundaries.

Current renderer state:

```txt
src/renderer/app.js: 1594 lines
```

This is not a blocker, but it is now a real constraint. The prior modularization review allowed one narrow operator-proof slice before splitting. That allowance has now been spent.

The next workflow/report surface should not be added to `app.js` as another broad block. The next milestone should begin with renderer modularization, then add the next structured report or watch-authoring surface through the same service boundary.

## Accepted Completed Work

Accepted as complete for this milestone:

- renderer modularization review
- controlled actor workflow proof
- controlled area workflow proof
- live expansion smoke with one stored ESI killmail
- actor metadata hydration UI
- structured report expansion no-write/defer decision
- retention compaction write no-write/defer decision

## Current Risks

### P1: Renderer Growth

`app.js` now carries readiness, scopes, tasks, queue/watch, manual discovery, manual expansion, actor report, metadata hydration, and assessment artifact workflow.

Risk:

```txt
Future UI additions become hard to audit for passive/live/evidence boundary violations.
```

Constraint:

```txt
Split renderer modules before adding radius/corporation report UI or watch authoring UI.
```

### P1: Radius UI Needs Native Structured Response

Radius reporting is product-defining for Atlas, but the current decision correctly deferred it.

Risk:

```txt
Renderer parses text output or reconstructs report meaning.
```

Constraint:

```txt
Add a native structured radius report response before radius UI presentation.
```

### P2: Watch Authoring Is Still Mostly Backend/CLI

The service surface can create/update/list watches, and the session executor can dispatch due watches. The operator-facing UI is not yet a full watch authoring surface.

Risk:

```txt
Users can inspect watch status but not yet cleanly create/modify watch intent from the shell.
```

Constraint:

```txt
Watch authoring UI should be explicit metadata-only work, never passive collection.
```

### P2: Hydration Is Actor-Report First

Actor report hydration exists and is correctly scoped. Radius/corporation contexts are not yet equally ergonomic.

Risk:

```txt
Area reports remain less readable than actor reports unless labels are already cached.
```

Constraint:

```txt
Hydration stays report-scoped and metadata-only; static inventory types stay local-SDE-first.
```

### P2: Scale/Performance Has Fixture Coverage But Not Product Thresholds

The verification suite is strong for correctness, boundaries, and smoke behavior. The next stability question is scale:

```txt
How large can a local evidence corpus become before reports, renderer rendering, or synchronous SQLite work feel bad?
```

Constraint:

```txt
Measure before introducing worker threads/process isolation.
```

## Verdict

No blocker.

Atlas is ready for the next milestone, but the next milestone should be a structure-and-area-reporting milestone rather than another broad feature push.

Recommended milestone:

```txt
Structured Area Review And Watch Authoring
```

Mission:

```txt
Turn the proven controlled workflow into a more maintainable operator surface: split the renderer, add native structured radius reporting, present radius observations without renderer-side inference, and expose watch authoring as explicit metadata work.
```

## Verification Recommendation

Before coding the next milestone, rerun:

```powershell
npm.cmd run verify:all
npm.cmd run smoke:electron
```

These checks should remain the acceptance baseline after renderer modularization and radius report UI work.

