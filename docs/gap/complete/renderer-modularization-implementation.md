# Gap To-Do: Renderer Modularization Implementation

Status: Complete
Priority: P1
Milestone: Structured Area Review And Watch Authoring

## Mission Statement

Split the proven one-file renderer shell into auditable modules before adding another major workflow or report surface.

The goal is maintainability and boundary clarity, not a redesign.

## Items For Completion

- Choose a small module boundary around current surfaces: readiness, scopes, tasks, queue/watch, reports, actions, shared render helpers, and service client helpers.
- Keep `window.atlasServices` and `window.atlasWindow` as the only renderer bridge inputs.
- Keep backend meaning in backend services; renderer modules render responses and build explicit request payloads only.
- Move code in small slices so behavior remains equivalent.
- Update `index.html` script loading if needed.
- Update `verify:renderer-shell` so it scans all renderer modules, not only `src/renderer/app.js`.
- Preserve checks against renderer imports of `src/main`, SQLite, repositories, workers, Electron APIs, and raw IPC.
- Preserve visual smoke coverage through `smoke:electron`.

## Guardrails

- Do not add new product behavior during the split.
- Do not weaken live gate, confirmation, task, or service-boundary checks.
- Do not move backend validation into renderer modules.
- Do not introduce a frontend framework solely for this split.

## Completion Signal

The renderer is split into clear modules, all existing shell behavior still verifies, and `verify:renderer-shell` can audit the new module layout.

## Completion Notes

Completed on 2026-05-22.

The renderer now loads separate classic browser scripts for shared helpers, readiness, scopes, tasks, queue/watch, controlled actions, reports, and the app orchestrator. The preload bridge remains the only service/window input surface.

Verification:

- `npm.cmd run verify:renderer-shell`
- `npm.cmd run smoke:electron`

## Related Documents

- `docs/gap/complete/renderer-modularization-review.md`
- `docs/audits/audit-2026-05-22-overseer-controlled-workflow-checkpoint.md`
- `scripts/verify-renderer-shell.js`
- `src/renderer/app.js`
