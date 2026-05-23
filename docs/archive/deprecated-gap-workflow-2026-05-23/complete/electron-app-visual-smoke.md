# Gap To-Do: Electron App Visual Smoke

Status: Complete
Priority: P1
Milestone: Presentation Validation And Controlled Execution

## Actionables

- Run the Atlas renderer as an Electron app, not by direct `file:///F:/...` browser navigation.
- Verify the shell visually for layout, text fit, scrolling, window controls, empty states, readiness messages, task details, queue/watch previews, and actor report sections.
- Confirm the renderer still uses `window.atlasServices` and `window.atlasWindow` only.
- Capture screenshots or concise notes for any layout/interaction failure.
- Keep runtime DB/cache/test artifacts under `F:\Projects\AURA-Atlas\.tmp`.

## File Navigation Issue Resolution

Observed issue:

The Codex in-app browser blocks direct navigation to:

```txt
file:///F:/Projects/AURA-Atlas/src/renderer/index.html
```

This is a browser security/policy limitation, not an Atlas renderer requirement.

Resolution path:

1. Do not bypass the policy by moving files to C:, weakening security, or building around direct `file:///` navigation.
2. Launch Atlas through Electron from the project root:

```powershell
npm.cmd run dev
```

or, if environment paths are already configured:

```powershell
npm.cmd start
```

3. Validate the app window opened by Electron. Electron uses `BrowserWindow.loadFile(...)` with the preload bridge, which is the real runtime path for Atlas.
4. Treat `verify:renderer-shell` as the static boundary check and the Electron app window as the visual smoke target.
5. If an in-browser visual harness is later desired, create a separate localhost mock harness. Do not treat that harness as IPC/evidence-boundary verification because it cannot exercise the real preload bridge.

## Task Requirements

The smoke should cover:

- app opens without crashing
- frameless shell can be dragged
- minimize, close, and always-on-top controls are visible and usable
- readiness view renders status cards, paths, topology, inventory, API state, messages, and next action
- scope view validates payloads and shows normalized backend output
- task view handles no-task and task-detail states
- queue/watch view renders previews without triggering live collection
- report view can request an actor report or shows a clear error if no actor data exists
- long text does not overflow unusably
- no passive live collection happens on app start or view refresh

## Guardrails

- Do not add live API calls just to satisfy visual smoke.
- Do not use direct renderer imports to make the smoke easier.
- Do not convert queue previews into evidence language.
- Do not add hidden filesystem writes to readiness refresh.
- Do not use a browser-only mock as proof that Electron IPC works.

## Completion Signal

There is a short visual smoke note or audit entry confirming that the Electron app opens and the initial shell is usable, with any failures recorded for follow-up.

`verify:renderer-shell` remains green.

## Completion Notes

Completed: 2026-05-22

Command used:

```powershell
npm.cmd run smoke:electron
```

Runtime paths used:

```txt
DB: F:\Projects\AURA-Atlas\.tmp\electron-visual-smoke\aura-atlas-electron-smoke.sqlite
Artifacts: F:\Projects\AURA-Atlas\.tmp\electron-visual-smoke
```

Screenshots produced:

- `readiness.png`
- `scopes.png`
- `tasks.png`
- `queue-watch.png`
- `reports.png`

Result:

- Electron app opens through the real `BrowserWindow.loadFile(...)` path.
- Renderer initializes through `window.atlasServices` and `window.atlasWindow`.
- No Node `require` or Electron globals are exposed to the renderer.
- Readiness, scopes, tasks, queue/watch, and reports views are reachable.
- Startup created no fetch runs, killmails, or activity events.
- App readiness is `degraded` in the disposable smoke DB because SDE topology/inventory are not imported there; this is expected for an isolated smoke DB.

Hardening added after the first pass:

- `verify:electron-runtime` checks Electron's bundled Node can load and use `node:sqlite`.
- `app.readiness` now exposes `killmails` and `activity_events` counts so the smoke's no-evidence-startup assertion is direct.
- `verify:renderer-shell` guards against redeclaring preload-exposed global names in renderer code.

Issues found and fixed during smoke:

- Electron `v30.5.1` did not include the `node:sqlite` built-in used by the backend. Electron was updated to `v42.2.0`, which resolves the runtime mismatch.
- Renderer initialization failed because `const atlasWindow = window.atlasWindow` redeclared the exposed global in Electron. The local renderer variable was renamed to `windowBridge`.

Verification:

- `verify:renderer-shell`
- `verify:electron-runtime`
- `smoke:electron`

## Dev Worker Notes / Failure Comment

Use this section if visual smoke fails or Electron cannot be launched.

```txt
Date:
Command used:
DB/cache path used:
Observed failure:
Screenshot/log reference:
Was verify:renderer-shell still passing?
Likely cause:
Suggested next action:
```

## Related Documents

- `docs/audits/audit-2026-05-22-initial-presentation-checkpoint-review.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/gap/complete/renderer-shell-service-boundary.md`
- `docs/gap/complete/frameless-widget-shell.md`
- `scripts/verify-renderer-shell.js`
