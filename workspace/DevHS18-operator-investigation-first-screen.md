# DevHS18: Operator Investigation First Screen

Status: Complete
Date: 2026-05-23
Role: Dev
Milestone: Operator Investigation Desk

## Scope

Executed the HS18 runway in `workspace/current.md`: first investigation-oriented opening screen for the Electron renderer while preserving the existing safe service shell and evidence boundaries.

I did not read or interact with the planner scoping document. The product model used here came from the active packet and durable term/roadmap docs: Marked is operator attention; Watch is active routine checking; Watch implies Marked, but Marked does not imply Watch.

## Changes

- Added `src/renderer/investigation.js` for the new startup view routes.
- Made `Investigation` the active first renderer view.
- Added a single lead input supporting actor, system, and system/radius intent.
- Added passive live/API context to the opening screen.
- Added Marked versus Watch wording and discovery/evidence/observation/assessment boundary hierarchy.
- Routed the opening screen into existing scope validation, manual discovery preflight, queue/enrich, reports/assessment, readiness, task, and detail surfaces.
- Updated renderer static verification and Electron visual smoke checks for the new startup view.
- Updated durable current-state documentation where renderer truth changed.

## Evidence Covered

- The app opens on `Investigation`, not `Readiness`.
- Startup remains passive and does not call zKill or ESI, queue refs, enrich evidence, hydrate metadata, create assessments, or execute watches.
- Discovery is presented as possible leads, not evidence.
- `Enrich selected` is paired with explicit ESI expansion and stored killmail evidence wording.
- Metadata hydration remains labelled readability-only in the existing Reports surface.
- Marked and Watch are separated in user-facing language.
- Raw IDs, backend payloads, queue internals, and task/service detail remain in secondary/detail surfaces.
- Existing Readiness, Scopes, Tasks, Queue / Watches, Actions, and Reports surfaces remain available.

## Verification

```txt
npm.cmd run verify:renderer-shell
Result: passed
```

```txt
npm.cmd run smoke:electron
Result: passed
Artifact: .tmp/electron-visual-smoke/visual-smoke-result.json
Notable checks: opensInvestigation=true; investigationPassiveText=true; rugged offline live-gate refusals still pass.
```

```txt
npm.cmd run verify:all
Result: passed
All verification group passed with 61 scripts.
```

No live API smoke, real SDE network download, destructive retention/pruning operation, or private runtime DB export was run.

## Files Changed

```txt
src/renderer/index.html
src/renderer/investigation.js
src/renderer/app.js
src/renderer/readiness.js
src/renderer/shared.js
src/renderer/styles.css
src/main/main.js
scripts/verify-renderer-shell.js
docs/current-state/current-ipc-ui-preparation.md
workspace/current.md
workspace/DevHS18-operator-investigation-first-screen.md
```

## Findings

No product bug was found during this packet.

The renderer can shift its first useful posture toward operator investigation without weakening the service boundary: the new first screen is routing and context only, while controlled actions still require existing validation, live gates, confirmations, and task execution.

## Deferred

- Record drawer semantics.
- Intelligence/Finding naming.
- Pasted zKill links / killmail IDs.
- First-class region investigation.
- Battle timeline implementation.
- Relationship graph or footprint story implementation.
- Live success smoke.
- Evidence pruning/deletion.

## Recommended Next Packet

Proceed with Overseer review. A good next bounded Dev slice would be either lead-input ergonomics over the existing actor/system resolver paths or a narrow investigation-detail view fed only by stored evidence, after Human/Overseer confirms the next product decision.
