# AURA Atlas Current Work

Status: HS43 accepted - awaiting Human/UIUX next direction
Last updated: 2026-05-24

## Active Milestone

Milestone: Intel Console Face And Layout Refinement (accepted)

Source of intent:

- Human HS41 UI review captured in `workspace/OverseerHS43-human-ui-review-face-direction.md`.
- UI/UX priority advisory in `workspace/UIUXHS43-intel-console-face-layout-advisory.md`.
- HS41 acceptance in `workspace/OverseerHS42-renderer-intel-console-review.md`.
- `workspace/DevHS41-renderer-intel-console-progressive-disclosure.md`
- Human Intel Console decisions recorded in `workspace/OverseerHS38-intel-console-human-decisions.md`.
- Presentation authority note in `workspace/OverseerHS38A-presentation-authority-note.md`.
- `workspace/UIUXHS36-operator-intel-console-presentation-spec.md`
- `docs/audits/audit-2026-05-24-local-alpha-human-ui-trial.md`
- `docs/features/presentation-layer-information-index.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Current focus: HS43 renderer face/layout refinement is accepted after Overseer review and verification. Atlas is awaiting Human/UIUX review or the next selected direction before a new Dev runway is written.

## Executor

Current executor: None. Dev completed HS43; Overseer has accepted the handoff.

Completed DevHS filename:

```txt
DevHS43-intel-console-face-layout-refinement.md
```

## Purpose

Make the first Atlas screen feel more like a discovery, research, and story console while preserving the backend/bridge authority already hardened.

This is a renderer presentation/layout packet only. It is not final Labs presentation doctrine.

## Accepted Human Review Notes

- HS41 direction is good and responsive.
- Atlas is not live/HTTPS; do not add live/HTTPS behavior.
- UI placement needs refinement.
- The front page should have a prominent search bar for finding a person/entity/lead.
- Discovery and Watch are currently duplicated between top mode switch and left nav.
- External API appears duplicated and the context pane wraps badly.
- Left pane is useful but should support the journey rather than repeat top modes.
- Discovery actions should be the center action area.
- If Discovery succeeds with ESI/zKill response, Observations should slide in as the next visible surface.
- Assessment should behave like a drawer/slide-up after observations or after internal stored context is found/hydrated.
- Queue Review and Enrich are inherent staged processes, not primary navigation.
- Readiness/settings/API details belong behind settings/widgets rather than dominating the workflow.
- Future face direction should lean sci-fi, space, research, and write-up, with more Human detail expected later.

Accepted UI/UX advisory emphasis:

- Keep HS43 focused; do not add more goals.
- First viewport should answer: "Who or where are we investigating?"
- Discovery success from zKill alone should reveal possible leads / Queue Review, not Observation.
- Observation is evidence/report-backed.
- Assessment is deliberate memory and should only become ready when stored context or actor report eligibility supports it.
- Fix hierarchy before decorative polish.
- Dev should include screenshot-based handoff notes if practical: first viewport, after lead entry, after stored context, and Watch mode.

## Ordered Dev Runway

1. Read the source-of-intent files above, especially `workspace/OverseerHS43-human-ui-review-face-direction.md`, and inspect current renderer layout before editing.
2. Remove top/left duplication:
   - keep `Discovery` and `Watch` as the primary top-bar mode controls
   - make the left pane contextual/supporting rather than a second copy of the same mode switch
   - keep access to Observation/Assessment, Discovery Actions, Scope Detail, Task History, and Settings/Diagnostics without making them compete with primary modes
3. Add a prominent search-first Discovery entry:
   - front screen should lead with a large operator search/input bar
   - support current lead concepts: Pilot, System, Corp, Alliance
   - preserve existing resolver/service paths
   - do not add zKill paste/link parsing unless it can be represented as deferred/unsupported without backend changes
4. Compact provider state:
   - show one clear `External API` pill/widget area in the top bar
   - remove or demote duplicate External API state
   - fix the right-side External API context wrapping/overflow
   - move detailed provider/readiness copy behind Settings/Diagnostics or a compact detail surface
5. Reframe the Discovery journey:
   - center Discovery actions as the main action area
   - keep Queue Review -> Enrich as staged process steps, not navigation destinations
   - if existing renderer state has discovered/queued/enriched/stored context, progressively reveal the next relevant area instead of showing all technical surfaces at once
6. Add or improve progressive Observation/Assessment surfaces:
   - Observation should slide in or become visibly available after successful discovery/stored context/report data exists
   - Assessment should be a drawer/slide-up style surface after Observations or internal stored context is available
   - preserve the evidence/observation/assessment boundary and do not infer unsupported meaning
7. Apply face/layout polish:
   - keep sci-fi teal/green/shadow-glass direction
   - improve spacing, text wrapping, responsive behavior, and visual hierarchy where touched
   - avoid decorative overbuild; prioritize research-console clarity
8. Update static/smoke checks only for changed renderer expectations.
9. Update Evidence / Dev Handoff below and create the expected DevHS file.

## Guardrails

- Renderer presentation/layout only.
- Do not change backend provider behavior, service contracts, database schema, IPC command names, migrations, persistence semantics, live behavior, evidence semantics, assessment semantics, watch semantics, or retention semantics.
- Do not add live/HTTPS behavior.
- Do not weaken HS39 command authority.
- Do not make Readiness, Scopes, Queue internals, task history, or provider diagnostics the primary operator journey.
- Do not introduce `Radar`, `Record`, `Intelligence`, or `Finding` as active product terms.
- Do not treat the protected-term sniff output as authority or a rename mandate.
- Do not import Lab presentation authority into Atlas internals.
- Do not fake relevance, evidence, observations, assessment, live state, or successful discovery.
- Preserve Marked vs Watch asymmetry and Discovery -> Evidence -> Observation -> Assessment boundaries.

## Stop Conditions

Return to Overseer/Human before continuing if:

- a requested layout requires backend/service/parser behavior
- zKill paste/link support cannot be represented honestly without new backend behavior
- live/HTTPS/provider enablement seems required
- Observation/Assessment progressive reveal would require new evidence/assessment semantics
- External API presentation cannot stay honest about current gates/refusals
- responsive layout cannot avoid severe text overlap/wrapping in the available renderer structure

## Required Verification

Run:

```powershell
npm.cmd run verify:renderer-shell
npm.cmd run verify:command-authority
npm.cmd run smoke:electron
npm.cmd run verify:protected-terms -- --max-warnings 20
git status --short --branch
```

If Dev changes broad evidence/report/live-gate copy or touches shared service-facing assumptions, also run:

```powershell
npm.cmd run verify:all
```

Do not run live smoke unless explicitly authorized by the Human.

## Overseer Acceptance

Decision: accepted HS43 as a renderer-only face/layout refinement.

Accepted evidence:

- Dev created `workspace/DevHS43-intel-console-face-layout-refinement.md`.
- Diff scope stayed in renderer presentation, renderer shell verification, Electron smoke readiness selector, and `workspace/current.md`.
- `src/main/main.js` changed only the Electron smoke readiness selector from the removed service-state element to the External API pill.
- No backend provider behavior, service contracts, DB schema, migrations, IPC command names, persistence semantics, live/HTTPS behavior, Evidence semantics, Assessment semantics, Watch semantics, or retention semantics changed.
- Smoke screenshots under `.tmp/electron-visual-smoke` show the search-first Discovery face and supporting routes render at the rugged/narrow smoke width.

Verification repeated by Overseer:

- PASS: `npm.cmd run verify:renderer-shell`
- PASS: `npm.cmd run verify:command-authority`
- PASS: `npm.cmd run smoke:electron`
- PASS: `npm.cmd run verify:protected-terms -- --max-warnings 20` (warning-only advisory output: 1287 warnings; no renames or protected-word JSON updates)
- PASS: `npm.cmd run verify:all`

Remaining risks / next decision points:

- Human/UIUX should review the HS43 face before the next Dev runway.
- zKill link / killmail ID paste remains deferred because safe support needs backend/service parsing behavior outside HS43.
- Top 5 records remains recent stored report rows, not true relevance ranking.
- Final Labs presentation doctrine, relationship graphs, first-class region investigation, live/HTTPS enablement, and evidence pruning remain out of scope.

## Broad Scoping Questions Format

If Dev has broad scoping/product questions, include them in the DevHS using this two-column HTML form/table shape:

```html
<form>
  <table>
    <tr>
      <th>Question</th>
      <th>Human answer / ticket note</th>
    </tr>
    <tr>
      <td>Question text</td>
      <td></td>
    </tr>
  </table>
</form>
```

Use this for broad direction only; do not block small implementation choices that are already answered by this packet.

## Evidence

Dev updates this before handoff:

```txt
Files changed:
- src/renderer/index.html
- src/renderer/app.js
- src/renderer/investigation.js
- src/renderer/shared.js
- src/renderer/styles.css
- scripts/verify-renderer-shell.js
- src/main/main.js (Electron visual smoke readiness selector only)
- workspace/DevHS43-intel-console-face-layout-refinement.md
- workspace/current.md

Layout/presentation changes:
- Reshaped the first viewport around a search-first Discovery face asking "Who or where are we investigating?"
- Converted the left rail into Journey Support plus secondary routes, instead of duplicating top Discovery / Watch mode controls.
- Centered Discovery actions around the main Discover Possible Leads action while keeping Check Lead, Load Stored Context, Queue Review -> Enrich, and Observation / Assessment available.
- Kept Queue Review -> Enrich as staged Discovery process copy, not primary navigation.
- Added responsive/narrow-width layout fixes so Electron rugged smoke does not horizontally clip the Discovery face.

Search-first Discovery behavior:
- The primary lead input is now the first control in the Discovery face and uses a larger search-style field.
- Lead concepts remain Pilot / System / Corp / Alliance presentation over existing actor/system/radius resolver paths.
- Typing and Check Lead remain local validation only.

Duplicate controls removed/demoted:
- Left nav no longer contains Discovery Console or Watch Console entries.
- Discovery and Watch remain only in the top primary mode switch.
- Observation / Assessment, Discovery Actions, Scope Detail, Task History, and Settings / Diagnostics remain accessible as supporting routes.

External API placement/wrapping changes:
- The top bar keeps one visible External API pill.
- The duplicate service-state text was removed from the top bar.
- Detailed External API / zKill / ESI context moved behind a compact disclosure and uses narrower wrapping-safe detail rows.
- Electron smoke readiness now waits on the External API pill instead of the removed service-state element.

Observation/Assessment progressive behavior:
- Queue Review, Stored Context Detail, Observation Timeline, Top 5 records, and Assessment Memory surfaces are deferred until relevant renderer state exists.
- Stored report context reveals Observation and Top 5 records only when stored evidence/report rows support them.
- Assessment Memory appears as a drawer-style surface after stored context; it marks actor evidence context as ready while keeping radius/system context observational.

Safety boundaries preserved:
- No backend provider behavior, service contracts, database schema, IPC command names, migrations, persistence semantics, live behavior, evidence semantics, assessment semantics, watch semantics, or retention semantics changed.
- HS39 command authority remains intact.
- Existing resolver/service paths remain in use: scope.validate, queue.selection, report.actor, report.radius, and existing report/assessment surfaces.
- Discovery remains possible leads; Observation remains stored-evidence/report-backed; Assessment Memory remains deliberate operator judgment.
- Marked vs Watch asymmetry was preserved.

Deferred/unsupported items:
- zKill link / killmail ID paste remains visibly deferred because safe support requires backend/service parsing behavior outside HS43.
- True relevance ranking remains unimplemented; Top 5 records remains honest recent stored report rows.
- No live/HTTPS behavior, relationship graph, first-class region investigation, evidence pruning, or final Labs presentation doctrine was added.

Verification run:
- PASS: npm.cmd run verify:renderer-shell
- PASS: npm.cmd run verify:command-authority
- PASS: npm.cmd run smoke:electron
- PASS: npm.cmd run verify:protected-terms -- --max-warnings 20 (warning-only advisory output: 1287 warnings, exit 0; no renames or protected-word JSON updates)
- PASS: npm.cmd run verify:all
- STATUS: git status --short --branch
```

## Dev Handoff

Dev creates:

```txt
workspace/DevHS43-intel-console-face-layout-refinement.md
```

Dev completed HS43 and created `workspace/DevHS43-intel-console-face-layout-refinement.md`.

Handoff must include:

- completed layout/face changes
- how the search-first Discovery entry works
- how Discovery/Watch duplication was resolved
- how External API state is represented and where detailed API context moved
- how Observation and Assessment surfaces progressively appear
- confirmation that backend/bridge/live/evidence/watch/assessment semantics were not changed
- verification results
- any broad scoping questions in the required two-column HTML form/table shape
