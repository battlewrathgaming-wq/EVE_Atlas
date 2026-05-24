# AURA Atlas Current Work

Status: Active - Dev runway
Last updated: 2026-05-24

## Active Milestone

Milestone: Atlas Overview Face Concept Prototype

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

Current focus: build one Atlas Overview Face prototype from the concept render's composition while preserving Atlas meaning and existing renderer/service boundaries.

## Executor

Current executor: Dev.

Expected DevHS filename:

```txt
workspace/DevHS47-atlas-overview-face-prototype.md
```

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

## Ordered Dev Runway

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

## Evidence

Dev updates this before handoff:

```txt
Files changed:

Overview face changes:

Meaning boundaries preserved:

Right rail behavior:

Local/API honesty:

Verification run:
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
