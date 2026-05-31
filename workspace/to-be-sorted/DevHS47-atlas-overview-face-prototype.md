# DevHS47: Atlas Overview Face Prototype

Date: 2026-05-24
Role: Dev
Milestone: Atlas Overview Face Concept Prototype

## Scope

Executed the HS47 renderer-only runway. This pass builds one Atlas Overview Face as the opening renderer screen, adapted from the concept render's hierarchy and atmosphere without treating the concept as a pixel-perfect spec or terminology authority.

## Completed Atlas Overview Face Changes

- Reframed the opening `view-investigation` surface as `Atlas Overview` while keeping the existing route, service paths, and action/test IDs intact.
- Added a central current-lead/search area with the existing lead type, actor type, radius, Check Lead, Discover Possible Leads, Load Stored Context, Queue Review -> Enrich, and Observation / Assessment controls.
- Added an overview source strip that updates while typing and states local stored-context behavior versus External API state.
- Added a right-side Atlas status stack: Stored Evidence, Possible Leads, Watch Status, and Assessment Memory.
- Added a bottom local/security/status strip that says opening the face is passive and does not discover, enrich, hydrate, assess, or run watches.
- Added responsive containment so the right rail stacks under the center at rugged Electron smoke width.

## Concept Adaptation

The concept was used for dark instrument-shell atmosphere, calm cyan highlighting, left navigation, central search/current-lead hierarchy, right status stack, and bottom status-strip composition.

It was not used to rename backend concepts, create new authority, alter service paths, or redesign the full app. Existing supporting surfaces remain reachable through the current renderer structure.

## Local Stored Context Vs External API

The center communicates that typing remains passive and local. `Check Lead` uses the existing scope validation and local lookup where available. Stored context is read through existing report services. External API remains the existing enabled/disabled provider gate and still requires explicit operator actions for live Discovery, ESI expansion, or hydration paths.

## Right Rail Routes

- Stored Evidence: calls the existing `Load Stored Context` behavior and report-backed stored evidence/provenance path.
- Possible Leads: calls the existing Queue Review / Enrich preview route. Queued refs remain Discovery output until Enrich selected succeeds.
- Watch Status: opens the existing Watch surface.
- Assessment Memory: opens the existing Observation / Assessment surface.

## Meaning Boundaries

Confirmed preserved:

- Evidence and Discovery remain separate.
- Possible Leads remain Discovery output, not Evidence.
- Stored Evidence remains expanded ESI killmail/activity-event context and provenance/report basis.
- Watch remains active routine checking.
- Marked remains operator interest/attention and does not imply Watch.
- Assessment Memory remains deliberate saved operator judgment, not evidence.

## Boundary Confirmation

No backend, bridge, IPC contract, service payload, persistence, schema, migration, provider behavior, live/API behavior, or command authority behavior changed. The only `src/main/main.js` change updates Electron visual-smoke expectations for the new opening title.

## Screenshot Notes

Electron smoke wrote screenshots under:

```txt
F:\Projects\AURA-Atlas\.tmp\electron-visual-smoke
```

Observed `investigation.png`: the app opens on Atlas Overview with the current-lead/search face visible, External API pill visible, and no obvious text overlap or horizontal clipping at rugged smoke width. The right rail stacks below the center on the narrow smoke viewport by design.

## Verification

```powershell
npm.cmd run verify:renderer-shell
npm.cmd run verify:command-authority
npm.cmd run smoke:electron
npm.cmd run verify:protected-terms -- --max-warnings 20
npm.cmd run verify:all
git status --short --branch
```

Result:

```txt
PASS - verify:renderer-shell
PASS - verify:command-authority
PASS - smoke:electron
PASS - verify:protected-terms -- --max-warnings 20; warning-only advisory output; 1692 warnings across final working set; no renames or protected-word JSON updates
PASS - verify:all; 62 scripts
STATUS - ## main...origin/main with HS47 modified renderer/check/workspace files and new DevHS artifact
```

## Broad Questions

<form>
  <table>
    <tr>
      <th>Question</th>
      <th>Human answer / ticket note</th>
    </tr>
    <tr>
      <td>No broad scoping question blocked HS47. Future direction remains whether Atlas Overview should become the durable primary navigation label after prototype review, or whether it should stay a presentation prototype over the existing investigation route.</td>
      <td></td>
    </tr>
  </table>
</form>

## Recommended Next Action

Overseer should review the Atlas Overview Face against `workspace/current.md`, the Electron smoke screenshots, and the preserved Evidence / Discovery / Watch / Assessment boundaries, then accept HS47 or write a narrowly scoped correction packet.
