# OverseerHS46: Intel Console Face/Layout Review

Date: 2026-05-24
Role: Overseer
Reviewed packet: HS43 Intel Console Face And Layout Refinement
Reviewed handoff: `workspace/DevHS43-intel-console-face-layout-refinement.md`

## Decision

Accepted.

HS43 stayed within the authorized renderer-only presentation/layout scope. The implemented face is search-first, removes the duplicate Discovery/Watch left-nav pattern, demotes detailed External API context, and progressively reveals queue, stored context, observation, top records, and assessment surfaces without changing backend or bridge semantics.

## Files Reviewed

- `workspace/current.md`
- `workspace/DevHS43-intel-console-face-layout-refinement.md`
- `scripts/verify-renderer-shell.js`
- `src/main/main.js`
- `src/renderer/app.js`
- `src/renderer/index.html`
- `src/renderer/investigation.js`
- `src/renderer/shared.js`
- `src/renderer/styles.css`
- `.tmp/electron-visual-smoke/investigation.png`
- `.tmp/electron-visual-smoke/rugged-operator-narrow.png`

## Acceptance Notes

- `src/main/main.js` changed only Electron visual-smoke readiness checks from the removed `#service-state` text to the `#external-api-state` pill.
- Renderer state still uses existing service paths and command-owned actions.
- Discovery remains possible leads and explicit operator action.
- Evidence and Observation remain stored/report-backed.
- Assessment Memory remains deliberate operator judgment.
- Watch remains active routine checking; Marked remains operator attention/interest.
- Lab presentation direction was not imported as Atlas internal authority.

## Verification

Repeated by Overseer:

```powershell
npm.cmd run verify:renderer-shell
npm.cmd run verify:command-authority
npm.cmd run smoke:electron
npm.cmd run verify:protected-terms -- --max-warnings 20
npm.cmd run verify:all
```

Result:

```txt
PASS - verify:renderer-shell
PASS - verify:command-authority
PASS - smoke:electron
PASS - verify:protected-terms -- --max-warnings 20; warning-only advisory output; 1287 warnings; no renames or protected-word JSON updates
PASS - verify:all; 62 scripts
```

## Risks / Deferred Items

- Human/UIUX should review the accepted HS43 face before another Dev packet is written.
- zKill link / killmail ID paste remains deferred because safe support needs backend/service parsing behavior outside HS43.
- Top 5 records remains recent stored report rows, not true relevance ranking.
- Final Labs presentation doctrine, relationship graphs, first-class region investigation, live/HTTPS enablement, and evidence pruning remain out of scope.

## Current State Update

`workspace/current.md` was moved from active Dev runway to HS43 accepted / awaiting Human or UIUX next direction. No new Dev runway was written.
