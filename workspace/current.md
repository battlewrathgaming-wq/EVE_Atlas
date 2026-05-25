# AURA Atlas Current Work

Status: HS47 accepted; HS50 Lab display response relay closed as material-production scope
Last updated: 2026-05-25

## Active Milestone

Milestone: Atlas Overview Face Concept Prototype (accepted)

Source of intent:

- Human concept-render direction in chat on 2026-05-24: accepted as atmosphere, hierarchy, and interaction intent; not pixel-perfect spec and not terminology authority.
- `workspace/AtlasLabAdoptionHS47-overview-face-concept-adoption.md`
- `workspace/OverseerHS46-intel-console-face-layout-review.md`
- `workspace/DevHS43-intel-console-face-layout-refinement.md`
- `workspace/OverseerHS43-human-ui-review-face-direction.md`
- `workspace/UIUXHS43-intel-console-face-layout-advisory.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/current-state/current-evidence-pipeline.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- Lab conformance input: `F:\Projects\AURA- Lab\workspace\LabRemoteConsumerConformanceHS66.md`
- Lab advisory input: `F:\Projects\AURA- Lab\workspace\archive\cross-project-relay\AtlasImportAdvisoryHS64-lab-presentation-adoption.md`

Current focus: HS47 Atlas Overview Face prototype is accepted after Overseer review and verification. Atlas display response relay is closed at the material-production scope level: Lab answered the first HS50 request batch, Human/source-project fitness discussion occurred, and the outcome is scope for future UIUX/Lab presentation materials rather than complete UI delivery or Dev authorization. UIUX should still expand the display inventory with user stories, acceptance criteria, overload risks, and journey placement before another Dev runway is written.

## Executor

Current executor: None. Dev completed HS47; Overseer has accepted the handoff. No active Dev runway is open.

Completed DevHS filename:

```txt
workspace/DevHS47-atlas-overview-face-prototype.md
```

Current Lab display request batch:

```txt
workspace/RequestDisplayHS50-atlas-initial-display-requests.md
F:\Projects\AURA- Lab\workspace\request_display.md
```

Current Lab response relay:

```txt
workspace/DisplayResponseHS51-atlas-lab-m24-response-relay.md
F:\Projects\AURA- Lab\workspace\DisplayResponseComparisonHS82-active-display-requests.md
F:\Projects\AURA- Lab\workspace\OverseerHS83-m24-acceptance.md
```

Active request ids:

- `atlas.overview.right-rail-status-stack`
- `atlas.discovery.queue-review-possible-leads`
- `atlas.watch.state-display`

Expected next action/resting record pattern, only after a further Atlas/Human decision:

```txt
workspace/DisplayResponseHS##-[request-id-or-surface]-lab-response-review.md
```

## Next Workflow

1. Use the closed HS50/HS51 relay as material-production scope for future UIUX/Lab sketches, slices, or presentation studies.
2. Run an expanded UIUX inventory pass that attaches user stories, acceptance criteria, overload risks, and journey placement to Atlas user-facing data.
3. Record only stable Atlas decisions as local resting/action records.
4. Decide which display method, if any, Atlas accepts, adapts, rejects, or parks for implementation.
5. Write a new bounded Dev runway only after Atlas/Human acceptance.

No implementation is authorized by this file at this time.

## Accepted Concept Direction

The concept render is cool and acceptable as atmosphere, hierarchy, and interaction intent.

It is not:

- pixel-perfect specification
- terminology authority
- backend authority
- full redesign authorization
- permission to rename contracts, IPC, services, payloads, persistence, or CSS/test identifiers

Keep the vibe:

- dark instrument shell
- calm cyan highlights
- left navigation
- central current-lead/search area
- right-side evidence/status stack
- bottom local/security/status strip

Correct risky wording:

- Use `Watch`, not `Watcher`, unless the Human explicitly blesses `Watcher` as presentation-only.
- `Evidence` navigation must open stored evidence/provenance, not Discovery output.
- `Possible Leads` must remain Discovery output, not Evidence.
- `Assessment Memory` is deliberate operator memory only.
- `API Gate` is acceptable only if it maps to existing External API enabled/disabled state and does not imply new backend authority.

## Closed HS47 Dev Runway Reference

The following runway is retained as accepted HS47 completion context, not as an active Dev packet.

1. Read the source-of-intent files above, then inspect the current renderer files before editing: `src/renderer/index.html`, `src/renderer/app.js`, `src/renderer/investigation.js`, `src/renderer/shared.js`, `src/renderer/styles.css`, `scripts/verify-renderer-shell.js`, and `src/main/main.js`.
2. Create one `Atlas Overview` face as the opening renderer screen using existing renderer structure and service paths. Keep the existing supporting surfaces reachable; do not redesign the full app.
3. Shape the face around:
   - left navigation / section rail
   - central current-lead and search/discovery area
   - right-side status stack: Stored Evidence, Possible Leads, Watch Status, Assessment Memory
   - bottom local/security/status strip
4. Make the center honest:
   - show whether discovery/search is using local stored context, External API, or both
   - keep typing/checking local unless an explicit operator action is pressed
   - keep Discovery and Evidence meanings separate in labels and copy
5. Wire the right rail cards only to existing Atlas-owned surfaces or routes:
   - Stored Evidence points to stored evidence/provenance/report context
   - Possible Leads points to Discovery/queue review context
   - Watch Status points to active Watch status/schedule context
   - Assessment Memory points to deliberate assessment surfaces
6. Apply bounded visual treatment from the concept render:
   - dark instrument shell, calm cyan highlights, contained panels, readable status cards
   - responsive/narrow containment suitable for Electron visual smoke
   - no decorative overbuild that hides meaning or verification
7. Update static/smoke checks only for changed renderer expectations. Update Evidence / Dev Handoff below and create the expected DevHS file.

## Guardrails

- Renderer presentation/layout only.
- Build one screen: Atlas Overview Face.
- No full app redesign.
- No backend changes.
- No provider behavior changes.
- No persistence changes.
- No bridge, IPC, service, payload, schema, migration, or contract changes.
- No CSS/test-id renames unless explicitly approved by Atlas Overseer.
- No live/HTTPS/private/destructive actions.
- Do not import Lab presentation authority into Atlas internals.
- Do not treat the concept render as terminology authority.
- Do not treat archived docs as active task queues.
- Preserve Evidence / Discovery / Observation / Assessment boundaries.
- Preserve Watch / Marked asymmetry.
- Preserve External API gate/refusal meaning.
- Do not fake relevance, evidence, observations, assessment readiness, live state, or successful discovery.

## Stop Conditions

Return to Overseer/Human before continuing if:

- Evidence and Discovery blur.
- Watch and Marked blur.
- `API Gate` implies new backend authority.
- the concept turns into a full redesign.
- implementation requires backend, bridge, persistence, service, payload, schema, migration, or contract changes.
- implementation requires live/private/destructive actions.
- renderer copy cannot honestly distinguish local stored context from External API state.
- responsive layout cannot avoid severe text overlap/wrapping in the available renderer structure.

## Required Verification

Run:

```powershell
npm.cmd run verify:renderer-shell
npm.cmd run verify:command-authority
npm.cmd run smoke:electron
npm.cmd run verify:protected-terms -- --max-warnings 20
git status --short --branch
```

If Dev touches broad evidence/report/live-gate copy or any shared service-facing assumption, also run:

```powershell
npm.cmd run verify:all
```

Do not run live smoke unless explicitly authorized by the Human.

## Overseer Acceptance

Decision: accepted HS47 as a renderer-only Atlas Overview Face prototype.

Accepted evidence:

- Dev created `workspace/DevHS47-atlas-overview-face-prototype.md`.
- Diff scope stayed in renderer presentation, renderer shell verification, Electron smoke title/route expectations, and `workspace/current.md`.
- `src/main/main.js` changed only Electron visual-smoke expectations for the opening title/route.
- Existing route IDs, service paths, command authority, backend behavior, IPC contracts, persistence, schemas, live/API behavior, and payload meanings were not changed.
- The opening face now presents Atlas Overview with central current-lead/search composition, right-side status cards, and a bottom local/security strip.
- Smoke screenshots under `.tmp/electron-visual-smoke` show the opening face is readable and contained at rugged/narrow smoke width. The right rail stacks below the center at this width by design.

Verification repeated by Overseer:

- PASS: `npm.cmd run verify:renderer-shell`
- PASS: `npm.cmd run verify:command-authority`
- PASS: `npm.cmd run smoke:electron`
- PASS: `npm.cmd run verify:protected-terms -- --max-warnings 20` (warning-only advisory output: 1692 warnings; no renames or protected-word JSON updates)
- PASS: `npm.cmd run verify:all`

Remaining risks / next decision points:

- Human/UIUX should review whether `Atlas Overview` should become the durable primary navigation label or remain prototype presentation over the existing investigation route.
- Wider viewport composition should be reviewed by Human/UIUX because the smoke screenshot is narrow and stacks the right rail below the center.
- Future refinements should remain renderer-bounded unless a new milestone explicitly opens backend, bridge, persistence, or live/API scope.

## Evidence

Dev updates this before handoff:

```txt
Files changed:
src/renderer/index.html
src/renderer/app.js
src/renderer/investigation.js
src/renderer/queueWatch.js
src/renderer/reports.js
src/renderer/shared.js
src/renderer/styles.css
scripts/verify-renderer-shell.js
src/main/main.js
workspace/current.md
workspace/DevHS47-atlas-overview-face-prototype.md

Overview face changes:
Built one renderer-only Atlas Overview Face as the opening `view-investigation` screen. The face keeps the existing service-backed lead input, Discovery action deck, queue/reports/watch routes, and progressive stored-context panels, while adding the concept-inspired central current-lead/search area, right-side status stack, and bottom local/security/status strip.

Meaning boundaries preserved:
Discovery remains Possible Leads only. Evidence remains stored expanded ESI killmail/activity-event context. Observation remains report-layer output from stored evidence. Assessment Memory remains deliberate saved operator judgment. Watch remains active routine checking; Marked remains attention/interest only and does not imply Watch.

Right rail behavior:
Stored Evidence routes through the existing stored-context/report path. Possible Leads routes through the existing Queue Review / Enrich context. Watch Status routes to the existing Watch surface. Assessment Memory routes to the existing Observation / Assessment report surface. The cards are readouts and route affordances only; they do not create backend behavior.

Local/API honesty:
The center states that typing is passive/local, Check Lead uses existing local scope validation/local lookup where available, local stored context is report-backed, and External API use remains controlled by the existing gate plus explicit operator actions. API Gate was not introduced as a new backend authority.

Verification run:
npm.cmd run verify:renderer-shell - PASS
npm.cmd run verify:command-authority - PASS
npm.cmd run smoke:electron - PASS; screenshot artifacts under `.tmp/electron-visual-smoke`
npm.cmd run verify:protected-terms -- --max-warnings 20 - PASS exit 0; warning-only advisory output, 1692 warnings across final working set
npm.cmd run verify:all - PASS; 62 scripts
git status --short --branch - ## main...origin/main with HS47 modified renderer/check/workspace files and new DevHS artifact
```

## Dev Handoff

Dev creates:

```txt
workspace/DevHS47-atlas-overview-face-prototype.md
```

Handoff must include:

- completed Atlas Overview Face changes
- how the concept render was adapted without becoming pixel-perfect spec
- how the center communicates local stored context vs External API state
- where each right-rail card points or routes
- confirmation that Evidence/Discovery, Watch/Marked, and Assessment Memory meanings were preserved
- confirmation that no backend/bridge/persistence/contract/live behavior changed
- screenshot notes from Electron smoke if available
- verification results
- any broad scoping questions in a two-column HTML form/table
