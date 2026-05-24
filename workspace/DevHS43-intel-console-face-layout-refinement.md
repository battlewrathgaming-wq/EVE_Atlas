# DevHS43: Intel Console Face And Layout Refinement

Date: 2026-05-24
Role: Dev
Milestone: Intel Console Face And Layout Refinement
Packet: HS43

## Scope

Executed the HS43 renderer-only face/layout refinement. This pass keeps HS41's Discovery direction, but fixes the hierarchy: search first, no duplicated Discovery/Watch controls, one compact External API state, and progressive Observation / Assessment surfaces.

## Completed Layout / Face Changes

- Reworked the first viewport into a Discovery face centered on: `Who or where are we investigating?`
- Promoted the lead input into a larger search-style field at the top of the Discovery flow.
- Kept `Discovery` and `Watch` as the only primary top-bar mode controls.
- Converted the left rail into contextual Journey Support and supporting detail routes.
- Kept Observation / Assessment, Discovery Actions, Scope Detail, Task History, and Settings / Diagnostics reachable without making them compete with primary modes.
- Centered the Discovery action area around `Discover Possible Leads`, with Check Lead, Load Stored Context, Queue Review -> Enrich, and Observation / Assessment as adjacent explicit actions.
- Added responsive CSS fixes for the Electron rugged-smoke width so the first viewport does not clip horizontally.

## Search-First Discovery

The Discovery screen now leads with the search field before secondary selectors. Lead concepts remain `Pilot / System / Corp / Alliance` presentation over the existing actor/system/radius resolver and service paths.

Typing remains passive. `Check Lead` remains local validation through existing scope validation. Discovery, queue preview, enrichment, report loading, and assessment routes still require explicit operator actions.

## Discovery / Watch Duplication

Left navigation no longer contains `Discovery Console` or `Watch Console` entries. The top mode switch owns those primary modes:

- `Discovery` opens the investigation/search console.
- `Watch` opens the existing queue/watch surface.

The left pane now summarizes the current lead and offers supporting routes only.

## External API State

The top bar now has one visible `External API` pill. The duplicate top-bar service-state text was removed.

Detailed zKill / ESI / startup-effect copy moved behind an `External API detail` disclosure in the Discovery view. That disclosure uses narrower, wrapping-safe rows so provider context no longer dominates or overflows the first workflow.

`src/main/main.js` was updated only so Electron visual smoke waits on the `External API` pill instead of the removed `service-state` element.

## Progressive Observation / Assessment

The renderer now defers technical surfaces until relevant state exists:

- Queue Review -> Enrich panel reveals after queue context is previewed.
- Stored Context Detail reveals after stored context is loaded.
- Observation Timeline and Top 5 records reveal only when stored report evidence/rows exist.
- Assessment Memory appears as a drawer-style surface after stored context exists.

Actor evidence context marks the Assessment drawer ready. Radius/system context remains observational and routes to the existing report/assessment surface without changing assessment eligibility semantics.

## Screenshot Notes

Electron smoke wrote screenshots under:

```txt
F:\Projects\AURA-Atlas\.tmp\electron-visual-smoke
```

Observed notes:

- `investigation.png`: search-first Discovery face is visible at rugged/narrow smoke width, with no horizontal clipping after the responsive CSS fix.
- `queue-watch.png`: Watch remains available through the top mode and the existing queue/watch surface still renders.
- `rugged-operator-narrow.png`: smoke confirms stored context, report, hydration refusal, and assessment memory flow still work in the narrow fixture run.

## Authority And Safety

Backend/bridge/live/evidence/watch/assessment semantics were not changed.

No provider behavior, service contracts, DB schema, migrations, IPC command names, persistence semantics, live/HTTPS behavior, evidence semantics, assessment semantics, watch semantics, or retention semantics changed.

HS39 command authority remains intact. The renderer continues to use existing service paths and command-owned confirmation behavior.

## Deferred / Unsupported

- zKill link / killmail ID paste remains deferred because safe support needs backend/service parsing behavior outside HS43.
- True relevance ranking remains unimplemented; the Top 5 tray remains recent stored report rows with honest copy.
- Final Labs presentation doctrine, relationship graphs, first-class region investigation, live/HTTPS enablement, and evidence pruning remain out of scope.

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
PASS - verify:protected-terms -- --max-warnings 20, warning-only advisory output, 1287 warnings, exit 0
PASS - verify:all, 62 scripts
STATUS - ## main...origin/main with HS43 modified files
```

Protected-term note: the command reported warning-only advisory candidates and explicitly confirmed no renames or protected-word JSON updates were performed.

## Broad Questions

<form>
  <table>
    <tr>
      <th>Question</th>
      <th>Human answer / ticket note</th>
    </tr>
    <tr>
      <td>No broad scoping question blocked HS43. The remaining choices are future product/presentation direction: final Atlas visual identity, zKill paste/parser support, and whether to replace the Top 5 wording before true relevance exists.</td>
      <td></td>
    </tr>
  </table>
</form>

## Recommended Next Action

Overseer should review HS43 against `workspace/current.md`, smoke screenshots, and the protected-term warning output, then accept the face/layout refinement or write a narrowly scoped correction packet.
