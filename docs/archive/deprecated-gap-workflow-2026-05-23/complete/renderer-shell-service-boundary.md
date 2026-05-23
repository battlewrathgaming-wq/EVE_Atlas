# Gap To-Do: Renderer Shell Service Boundary

Status: Complete
Priority: P1

## Completed

- Built the first Electron renderer shell around `atlas:service:list` and `atlas:service:invoke`.
- Added a preload bridge that exposes only `window.atlasServices`.
- Created a renderer-side service client pattern for backend command invocation.
- Added readiness, task history, and transitional report panes.
- Ensured renderer code does not import repositories, workers, CLI scripts, or raw SQLite modules.
- Added smoke/static verification for the service boundary.

## Task Requirements

The backend service surface is ready for initial presentation work. The renderer should treat backend services as its only authority.

Initial shell should support:

- app frame/navigation
- service command invocation helper
- loading/error/warning state handling
- local-only actions first
- live-gated actions visibly disabled or blocked until enabled

## Guardrails

- UI state must not become evidence or report authority.
- Renderer must not construct evidence records.
- Renderer must not bypass service classification, live gates, task locks, or scope validation.
- Keep first shell functional and restrained; avoid building a marketing/landing page.

## Completion Signal

The app opens to a usable renderer shell, reads service command availability, and can display readiness/task/report data through IPC without direct backend imports.

## Verification

- `verify:renderer-shell`
- `verify:all`

## Related Documents

- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/gap/to-do/backend-electron-readiness.md`
- `docs/gap/complete/ipc-service-contract.md`
- `docs/gap/complete/ipc-mutating-action-services.md`
