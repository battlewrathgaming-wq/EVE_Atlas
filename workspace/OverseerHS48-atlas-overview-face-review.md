# OverseerHS48: Atlas Overview Face Review

Date: 2026-05-24
Role: Overseer
Reviewed packet: HS47 Atlas Overview Face Concept Prototype
Reviewed handoff: `workspace/DevHS47-atlas-overview-face-prototype.md`

## Decision

Accepted.

HS47 stayed within the authorized renderer-only prototype scope. The concept render was adapted as atmosphere, hierarchy, and interaction intent without treating it as pixel-perfect specification or terminology authority.

## Files Reviewed

- `workspace/current.md`
- `workspace/DevHS47-atlas-overview-face-prototype.md`
- `scripts/verify-renderer-shell.js`
- `src/main/main.js`
- `src/renderer/app.js`
- `src/renderer/index.html`
- `src/renderer/investigation.js`
- `src/renderer/queueWatch.js`
- `src/renderer/reports.js`
- `src/renderer/shared.js`
- `src/renderer/styles.css`
- `.tmp/electron-visual-smoke/investigation.png`
- `.tmp/electron-visual-smoke/rugged-operator-narrow.png`

## Acceptance Notes

- `Atlas Overview` remains a presentation face over the existing `view-investigation` route.
- Existing route IDs, renderer service paths, and command-owned action behavior remain intact.
- `src/main/main.js` changed only Electron visual-smoke expectations for the opening title/route.
- Stored Evidence, Possible Leads, Watch Status, and Assessment Memory right-rail cards route to existing Atlas-owned surfaces.
- The center copy distinguishes local stored context from External API state and keeps typing/checking passive unless an explicit operator action is pressed.
- `API Gate` was not introduced as a new backend authority.
- Evidence remains stored expanded ESI killmail/activity-event context.
- Possible Leads remain Discovery output, not Evidence.
- Watch remains active routine checking; Marked remains attention/interest only.
- Assessment Memory remains deliberate saved operator judgment, not evidence.

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
PASS - verify:protected-terms -- --max-warnings 20; warning-only advisory output; 1692 warnings; no renames or protected-word JSON updates
PASS - verify:all; 62 scripts
```

## Visual Smoke Notes

- `investigation.png` opens on Atlas Overview with the central current-lead/search area visible, External API pill visible, and no obvious text overlap or horizontal clipping at rugged smoke width.
- The right rail stacks below the center at the narrow smoke width by design. Human/UIUX should review the wider viewport composition before the next refinement packet.
- `rugged-operator-narrow.png` confirms supporting routes remain reachable after the face change.

## Remaining Risks / Next Decisions

- Human/UIUX should decide whether `Atlas Overview` becomes the durable primary label or remains prototype presentation over the existing investigation route.
- Wider viewport composition should be reviewed against the concept render because automated smoke evidence is narrow.
- Do not broaden the next packet into backend, bridge, persistence, contract, or live/API work unless a new milestone explicitly opens that scope.

## Current State Update

`workspace/current.md` was moved from active Dev runway to HS47 accepted / awaiting Human or UIUX review. No new Dev runway was written.
