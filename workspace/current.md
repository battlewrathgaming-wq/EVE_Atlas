# AURA Atlas Current Work

Status: HS41 accepted - awaiting Human review / next direction
Last updated: 2026-05-24

## Active Milestone

Milestone: Renderer Intel Console Progressive Disclosure

Source of intent:

- Human local-alpha UI trial notes from 2026-05-24.
- Human Intel Console decisions recorded in `workspace/OverseerHS38-intel-console-human-decisions.md`.
- Presentation authority note in `workspace/OverseerHS38A-presentation-authority-note.md`.
- Command authority acceptance in `workspace/OverseerHS40-command-authority-review.md`.
- `workspace/UIUXHS36-operator-intel-console-presentation-spec.md`
- `workspace/OverseerHS37-intel-console-spec-review.md`
- `workspace/DevHS39-atlas-command-authority-hardening.md`
- `docs/audits/audit-2026-05-24-local-alpha-human-ui-trial.md`
- `docs/features/presentation-layer-information-index.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Current focus: HS41 renderer-only presentation pass is complete and accepted by Overseer after verification. Await Human UI review or next selected direction.

## Executor

Current executor: none. Dev runway is complete.

Expected DevHS filename:

```txt
DevHS41-renderer-intel-console-progressive-disclosure.md
```

Expected Overseer review filename:

```txt
OverseerHS42-renderer-intel-console-review.md
```

## Purpose

Turn the existing renderer shell into a clearer Intel Console presentation without changing backend behavior.

The app should feel like a discovery/storytelling console, not a sysadmin or network configuration panel.

## Accepted Product Decisions

- Use `External API` as the honest top-bar label for zKill/ESI/live provider availability and kill-switch state.
- Top bar primary modes: `Discovery` and `Watch`.
- `Radar` is not an active product term.
- When `Discovery` is selected, the center view should focus on discovery content only.
- The left side should populate with `Observation` and `Assessment` as the investigation develops.
- `Queue Review -> Enrich` are inherent staged processes inside Discovery, not top-level navigation.
- If External API is connected and the kill switch is off, the Discovery flow may proceed through its visible staged process using existing gates/actions. Do not add passive startup/background collection.
- Stored context should have its own pane.
- Add a bottom console tray for `Top 5 relevant records`, ordered by time where current data supports it.
- zKill input is native to user behavior and should be supported if it can be done safely within existing services; otherwise create a visible deferred/unsupported state and note the gap.
- Lead/input types should use current pipeline concepts: Pilot, System, Corp, Alliance.
- Observation timeline should be a strong presentation layer for "What happened in that fight?"
- Visual direction: sci-fi teal/green, shadow-glass buttons, slightly transparent back pane. Keep it restrained and readable; textures may evolve later.
- Terminology authority: Atlas controls backend/bridge terms. Presentation may adapt human-facing wording where required, but must preserve intent and evidence boundaries.
- Longer term, Labs or a dedicated presentation layer may replace/finalize UI presentation as a focus-group surface. HS41 is not final presentation doctrine.

## Ordered Dev Runway

1. Read all source-of-intent files above and inspect current renderer structure before editing.
2. Rework renderer navigation/presentation:
   - primary top bar modes: `Discovery`, `Watch`
   - keep access to existing readiness/scopes/tasks/actions/reports details through secondary/settings/detail routes
   - do not remove capabilities
3. Rework the Discovery center view:
   - center only discovery content when Discovery is selected
   - use lead/input types: Pilot, System, Corp, Alliance
   - include External API status/gate copy in the top bar or trust strip
   - make queue review and enrich appear as staged parts of the Discovery flow, not separate top-level destinations
4. Add/preserve staged presentation:
   - lead/check state
   - discovery/possible leads
   - queue review
   - enrich selected
   - evidence created / stored evidence available
   - observation timeline/story preview
   - assessment entry point
5. Add stored-context presentation:
   - create a dedicated stored-context pane
   - add a bottom `Top 5 relevant records` tray ordered by time where available
   - if current services cannot supply true relevance, use honest labels such as recent stored records and do not fabricate relevance
6. Add or improve observation timeline presentation from existing structured report responses:
   - emphasize "what happened in that fight?"
   - keep evidence basis and observation boundary visible
   - do not infer threat, motive, ownership, staging, affiliation, or current presence
7. Apply visual polish within scope:
   - sci-fi teal/green palette
   - shadow-glass button treatment
   - slightly transparent back pane
   - fix obvious text edge handling where touched
   - stabilize flicker/label churn for `Refresh watches` / queue preview style actions where touched
8. Preserve and verify safety boundaries:
   - no backend/service/database/IPC renames
   - no new live/API behavior
   - no passive collection
   - no evidence, assessment, watch, or retention semantic changes
   - no destructive behavior
   - retain command-owned confirmation tokens and renderer command eligibility from HS39
9. Update Evidence / Dev Handoff below and create the expected DevHS file.

## Guardrails

- Renderer presentation/copy/navigation only.
- Treat this as a structured Atlas renderer pass, not final Labs presentation wiring.
- Do not change backend provider behavior, service contracts, database schema, IPC command names, migrations, or persistence semantics.
- Do not weaken HS39 command-authority hardening.
- Do not treat the parked terminology audit as approved authority.
- Do not introduce `Record`, `Intelligence`, `Finding`, or `Radar` as active product terms.
- Do not make Readiness or Scopes the primary operator journey.
- Do not hide access to diagnostics/support details; relocate or demote them.
- Do not start live/API calls from startup, page load, passive refresh, or presentation-only controls.
- Do not add automatic evidence deletion/pruning or retention behavior.
- Do not fake relevance, evidence, observations, or assessment.
- Do not block future Labs/presentation replacement by entangling UI copy with backend authority.

## Stop Conditions

Return to Overseer/Human before continuing if:

- implementing zKill link / killmail ID input requires backend/service behavior changes
- making Discovery proceed through Queue Review -> Enrich requires new automatic live/API behavior
- External API presentation cannot stay honest about current gate/refusal behavior
- stored-context relevance cannot be represented truthfully with current data
- a requested visual state would imply threat/safety semantics not supported by evidence
- verification requires live/private/destructive actions

## Required Verification

Run:

```powershell
npm.cmd run verify:renderer-shell
npm.cmd run verify:command-authority
npm.cmd run smoke:electron
git status --short --branch
```

If Dev changes broad evidence/report/live-gate copy or touches shared service-facing assumptions, also run:

```powershell
npm.cmd run verify:all
```

Do not run live smoke unless explicitly authorized by the Human.

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
- src/main/main.js (Electron visual smoke title/route expectations only)
- workspace/DevHS41-renderer-intel-console-progressive-disclosure.md
- workspace/current.md

Presentation changes:
- Reworked the renderer first screen around Discovery with a top-bar Discovery / Watch primary mode switch and secondary detail routes.
- Added External API provider-state presentation in the top bar and investigation trust/context pane.
- Reworked lead presentation copy toward Pilot, System, Corp, and Alliance concepts while preserving existing actor/system/radius resolver/service paths.
- Added a Discovery stage rail: Lead -> Discovery -> Queue Review -> Enrich Selected -> Evidence -> Observation -> Assessment Memory.
- Kept Queue Review -> Enrich staged inside Discovery and kept queue preview read-only.
- Added stored-context pane, observation timeline/story pane, and bottom Top 5 relevant records tray populated from loaded stored evidence report rows.
- Stabilized busy-button presentation by using aria-busy / CSS state without changing visible button labels to "Working...".
- Applied restrained teal/green shadow-glass styling and transparent pane treatment.

Safety boundaries preserved:
- No backend provider behavior, service contracts, DB schema, IPC command names, migrations, persistence semantics, live behavior, evidence semantics, assessment/watch/retention semantics, or passive startup collection were changed.
- zKill refs remain possible leads, not evidence.
- Enrich selected remains the explicit ESI expansion / stored evidence creation step.
- Metadata hydration remains readability-only in existing report surfaces.
- Assessment Memory remains deliberate operator judgment.
- Marked remains attention/tag/record interest; Watch remains active routine check behavior; Watch implies Marked, Marked does not imply Watch.
- Observation timeline/tray rows are rendered from existing structured report responses and avoid threat, motive, ownership, staging, affiliation, or current-presence inference.

Authority boundaries preserved:
- HS39 command authority remains intact; renderer command eligibility and command-owned confirmation tokens were not weakened.
- Renderer changes continue to use existing service.invoke paths: scope.validate, queue.selection, report.actor, and report.radius.
- Smoke harness expectations were updated to HS41 route titles only; service registry, preload, IPC handlers, and provider code were not changed.

Deferred/unsupported items:
- zKill link / killmail ID paste support is visibly deferred in the renderer because safe support would require backend/service parsing behavior outside HS41.
- True relevance ranking for Top 5 relevant records is not implemented; the UI honestly labels the tray as recent stored records from loaded report rows.
- Relationship graph, footprint story, first-class region investigation, battle clustering beyond existing Recent Timeline rows, Record/Intelligence/Finding naming, live success smoke, and evidence pruning remain out of scope.

Verification run:
- PASS: npm.cmd run verify:renderer-shell
- PASS: npm.cmd run verify:command-authority
- PASS: npm.cmd run verify:all
- PASS: npm.cmd run smoke:electron
- PASS/status captured: git status --short --branch
```

## Dev Handoff

Dev creates:

```txt
workspace/DevHS41-renderer-intel-console-progressive-disclosure.md
```

Dev completed HS41 and created `workspace/DevHS41-renderer-intel-console-progressive-disclosure.md`.

Overseer accepted HS41 in `workspace/OverseerHS42-renderer-intel-console-review.md`.

Handoff must include:

- completed renderer changes
- any zKill/paste support decision or deferral
- how External API state is represented
- how Discovery / Watch top bar behaves
- how stored context and Top 5 records are populated
- how observation timeline/story preview is grounded
- confirmation that HS39 command authority was preserved
- verification results
- remaining risks or Human questions
