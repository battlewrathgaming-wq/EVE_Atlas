# Gap To-Do: Frameless Widget Shell

Status: Complete
Priority: P1

## Completed

- Converted the first Electron shell to a frameless draggable window.
- Added renderer controls for minimize, close, and always-on-top.
- Persisted always-on-top state across app restarts.
- Kept window controls separate from evidence/report authority.
- Verified the renderer still uses only preload bridges for service and window operations.

## Task Requirements

Atlas should feel like an operator utility rather than a conventional document app.

The shell should support:

- frameless BrowserWindow
- draggable header or widget region
- explicit non-draggable buttons and controls
- always-on-top toggle
- persisted always-on-top preference
- no hidden live collection or evidence mutation from window controls

## Guardrails

- Renderer must not import Electron, Node, repositories, workers, CLI scripts, or SQLite.
- Window controls must go through preload IPC only.
- Runtime state should stay under approved Atlas runtime paths when development env overrides are set.
- Always-on-top must be user-controlled, not forced as the only mode.

## Completion Signal

The app opens as a frameless draggable shell with visible window controls. The user can toggle always-on-top, the preference is persisted, and renderer verification proves the service/data boundary remains intact.

## Verification

- `verify:renderer-shell`
- `verify:all`

## Related Documents

- `docs/gap/complete/renderer-shell-service-boundary.md`
- `docs/gap/to-do/readiness-settings-screen.md`
- `docs/current-state/current-ipc-ui-preparation.md`
