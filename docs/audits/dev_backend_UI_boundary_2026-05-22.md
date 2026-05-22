# Audit: dev_backend_UI_boundary_2026-05-22

Date: 2026-05-22
Status: Handshake Note
Scope: Backend/UI boundary after Operational Workflow Hardening checkpoint.

## Purpose

This note hands off the current backend/UI boundary state for overseer review.

It is not a full gap analysis. It records what the development pass believes is currently true, what can be safely built on, and which concerns should remain visible before the next milestone.

## Current Boundary Verdict

The backend/UI boundary is in a healthy checkpoint state.

The renderer is consuming Atlas through the preload service bridge and service registry rather than directly importing backend modules, SQLite, repositories, workers, Electron IPC internals, or CLI scripts.

The current UI shell is suitable for continued controlled workflow development as long as future UI actions keep using:

- backend scope validation
- live API gates
- task runner execution for mutating/live work
- visible confirmation for evidence-creating actions
- explicit evidence / observation / assessment wording

## Current Confidence Signals

Recent work completed and verified:

- Electron runtime supports the backend `node:sqlite` dependency.
- Renderer shell uses `window.atlasServices` and `window.atlasWindow`.
- Readiness/settings are read-only unless the user explicitly runs `app.prepare`.
- Manual discovery UI runs through scope validation, live gate preflight, explicit confirmation, and detached task execution.
- Manual expansion UI previews queue refs, expected ESI calls, selected IDs, and confirmation before task execution.
- Session-armed watch executor is user-armed, volatile for the app session, and separate from passive page load.
- Actor report UI consumes structured backend report responses and keeps text export for audit/export.
- Assessment artifact UI creates/list/gets deliberate assessment memory from loaded actor report context without mutating evidence.
- Retention preflight can preview future typed-actor assessment compaction without deleting evidence or inserting artifacts.
- `docs/gap/to-do` has no active operational workflow hardening item beyond its README.

Verification signals:

- `npm.cmd run verify:all` passed after the compaction preservation preflight work.
- `npm.cmd run smoke:electron` passed after report UI changes.
- Git working tree was clean at handoff.

## Boundary Invariants To Preserve

- Renderer must not directly import backend modules, SQLite, repositories, workers, or Electron internals.
- Passive views must not trigger live API calls, evidence collection, metadata hydration, compaction, pruning, or watch execution.
- Live/API-backed actions must stay explicit, gated, and task-backed.
- zKill discovery refs and queue previews remain possible evidence, not evidence.
- Expanded ESI killmails remain the durable evidence source.
- Reports are scoped presentations of stored evidence, not the source of evidence meaning.
- Assessment artifacts are memory/interpretation, not proof and not replacement evidence.
- Retention/destructive work remains blocked until preservation, confirmation, and deletion verification exist.

## Concerns To Carry Forward

### 1. Renderer Growth Risk

The renderer now contains more workflow orchestration code.

This is acceptable for the shell checkpoint, but future growth should avoid turning `src/renderer/app.js` into a second application backend. The next larger UI slices may need small renderer-side modules or component boundaries, while still keeping all evidence/report meaning in backend services.

### 2. Assessment Workflow Is Actor-First Only

Assessment memory can currently be created from loaded actor report context.

Corporation, radius, system, and queue-derived assessment workflows are not yet first-class UI flows. They should be added only when their backend report response shape is structured enough to preserve scope and sample context cleanly.

### 3. Compaction Is Preview-Only

`assessment.compact_from_evidence` preflight now shows what memory would survive future pruning.

It does not create an assessment artifact and does not delete evidence. This is intentional. Any future compaction write or pruning action needs a separate implementation and verification pass.

### 4. Process Isolation Remains Deferred

The current main-process service model remains acceptable for the next milestone.

If UI stalls or long synchronous work appears, the first isolation target should be SDE import / SDE sync-compare. The second likely target is large report generation or future evidence compaction across large corp/radius scopes.

### 5. Live Smoke Coverage Is Still Narrow

Controlled live smoke has proven the gating path and low-footprint behavior.

It has not proven broad operational usage, high-volume corp targets, long-running live queues, or repeated session-armed watch cycles over many due watches. Keep future live expansion deliberately capped.

### 6. Metadata Hydration UI Is Deferred

Report-scoped hydration exists as backend capability, but a dedicated metadata hydration UI remains deferred.

When added, it should be metadata-only, explicit, report-scoped/top-N where possible, and clearly separate from evidence collection.

## Recommended Next Milestone Direction

Move from hardening the shell toward a scoped operator workflow milestone.

Recommended next proof:

```txt
Controlled Actor/Area Operation
```

Suggested goal:

- user defines an actor/system/radius scope
- UI validates scope and explains API impact
- user runs discovery or watch action explicitly
- task progress is visible
- queue/evidence/report states update after completion
- user can inspect evidence/observations
- user can save assessment memory if warranted

Keep this narrower than a full dashboard. The important proof is that the UI can safely operate the backend without weakening Atlas doctrine.

## Handoff Statement

The backend/UI boundary is ready for overseer review.

The current checkpoint is strong enough to continue into controlled operator workflow work, provided future implementation keeps the service boundary, task gate, live gate, and evidence/observation/assessment layer separation intact.
