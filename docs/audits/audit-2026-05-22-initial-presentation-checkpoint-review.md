# Audit: Initial Presentation Checkpoint Review

Date: 2026-05-22
Scope: Renderer shell, IPC/service boundary, completed gap items, current risks, and clean checkpoint `26f37a7`

## Review Summary

AURA Atlas has reached an initial presentation checkpoint.

The project now has enough renderer and backend rigging to show Atlas state and work products through the governed service boundary:

- Electron main process initializes the runtime DB and registers service IPC handlers.
- The preload bridge exposes `window.atlasServices` and `window.atlasWindow`.
- The renderer uses the preload service bridge rather than importing backend modules.
- Readiness/settings, task history, scope validation, queue selection, watch schedule, queue report, and actor report views exist.
- Evidence-creating backend actions are exposed through services and task wrapping, but the current renderer does not trigger passive live collection from page load.
- Session-armed watch execution is contracted, not implemented.
- Assessment compaction and retention behavior is contracted, but executable evidence pruning remains blocked.

The clean local checkpoint reported for this review is `26f37a7`.

## Implementation Trace

The current renderer path is:

```txt
renderer
-> window.atlasServices
-> atlas:service:invoke
-> serviceRegistry
-> scope/live/task/readiness/queue/report services
-> SQLite evidence, metadata, and report surfaces
-> renderer presentation
```

The renderer path should stay this way. UI components should not call repositories, workers, CLI scripts, raw SQLite, or ESI/zKill clients directly.

## Current Confidence

The following confidence signals are in place:

- `verify:renderer-shell` statically checks the renderer shell, preload bridge, window controls, service calls, and boundary rules.
- `verify:all` runs the offline verification suite and currently contains 42 scripts, including Electron runtime verification.
- Live smoke commands remain separate from `verify:all` and require `AURA_ATLAS_LIVE_API=1`.
- `docs/gap/to-do` is cleared except for its README; completed rigging items are now archived in `docs/gap/complete`.

Visual smoke caveat:

The Codex in-app browser blocks direct `file:///F:/...` navigation by policy. This was not worked around. Current visual confidence comes from static renderer verification and the offline suite. A future manual/app smoke should launch Electron through `npm start` or the project dev launcher instead of direct file navigation.

## Confirmed Boundaries

### Evidence Boundary

The renderer is presentation only. It can request service commands and render service responses. It must not construct evidence, mutate activity events, or reinterpret queue previews as evidence.

### Live API Boundary

Live zKill/ESI work remains explicit and gated. The queue/watch views are previews/status surfaces, not passive collection triggers.

### Session Boundary

Session-armed watch execution is documented in `docs/contracts/session-armed-watch-executor-contract.md`.

Until implemented, app startup, navigation, readiness refresh, queue preview, report display, and watch status refresh must remain non-collecting actions.

### Retention Boundary

Retention preflight and assessment compaction contracts exist, but deletion/pruning is not executable. Evidence pruning should stay blocked until assessment artifact persistence exists and is verified.

## Current Gaps

### Evidence-Creating UI Actions

The backend has service commands for manual discovery, manual expansion, actor watch, system/radius watch, metadata hydration, SDE imports, and watchlist actions.

The renderer has not yet grown the full execution UX for those actions. When it does, each action should use:

- backend scope validation
- explicit user confirmation where appropriate
- live gate state
- task execution for long-running or mutating work
- task progress/error/warning presentation

### Session-Armed Watch Executor

The scheduler can report due/blocked/backoff state, but no executor loop should be added casually.

Implementation must follow the contract:

- default disarmed on app start
- explicit arm/disarm control
- one due watch per tick by default
- no passive page-load collection
- run watch work through existing evidence-creating task services
- record success/failure through `watch.recordRun`

### Assessment Artifacts And Retention Execution

Retention remains a design/preflight area. The next real retention step is not deletion; it is assessment artifact persistence and compaction preview.

### Runtime Performance

Detached tasks prevent long IPC waits but do not make synchronous SQLite or CPU-heavy work leave the Electron main process.

True worker-thread, utility-process, child-process, or separate service isolation remains a future scaling decision after heavier batch/runtime testing.

### Visual/Manual Smoke

Static verification is good for boundary regression. It is not a replacement for opening the Electron app and checking layout, scrolling, text fit, and interaction ergonomics.

The next visual smoke should use the app runtime, not `file:///F:/...`.

## Recommended Next Steps

1. Run an Electron app smoke through `npm start` or `npm run dev`, using the F: runtime path policy.
2. Inspect the initial shell visually: readiness, scopes, tasks, queue/watch, actor report, window controls, long text, empty states, and error states.
3. Add renderer-side execution controls only after choosing the first evidence-creating UX path, preferably manual discovery or metadata hydration before routine watch execution.
4. Implement the session-armed watch executor only after a small dedicated slice, following the contract exactly.
5. Design and implement assessment artifact persistence before any executable evidence pruning.
6. Keep `verify:all` as the offline gate and keep live smoke gated/separate.
7. Push the local commits to GitHub if the remote should reflect this checkpoint.

## Suggested Next Gap Items

If more `docs/gap/to-do` files are needed, create them from this review rather than reopening the retired readiness umbrella.

Good candidates:

- `electron-app-visual-smoke.md`
- `evidence-creating-ui-actions.md`
- `session-armed-watch-executor-implementation.md`
- `assessment-artifact-persistence.md`
- `runtime-process-isolation-review.md`

## Related Files

- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/gap/to-do/README.md`
- `docs/gap/complete`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/contracts/assessment-compaction-contract.md`
- `src/main/main.js`
- `src/main/preload.js`
- `src/main/services/serviceRegistry.js`
- `src/renderer/index.html`
- `src/renderer/app.js`
- `scripts/verify-renderer-shell.js`
