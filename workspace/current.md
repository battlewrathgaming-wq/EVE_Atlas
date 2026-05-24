# AURA Atlas Current Work

Status: Active - presentation specification
Last updated: 2026-05-24

## Active Milestone

Milestone: Operator Intel Console Presentation Specification

Source of intent:

- Human local-alpha UI trial notes from 2026-05-24.
- `docs/audits/audit-2026-05-24-local-alpha-human-ui-trial.md`
- `workspace/UIUXHS34-operator-experience-story-pass.md`
- `docs/audits/audit-2026-05-24-terminology-bridge.md`
- `workspace/OverseerHS35-operator-experience-advisory-review.md`
- `docs/features/presentation-layer-information-index.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/roadmap/operator-investigation-desk.md`

Current focus: produce a screen-level presentation specification for the first operator path before any Dev implementation.

## Executor

Current executor: UI/UX specialist or Planner.

Dev is not active.

Expected handoff filename:

```txt
UIUXHS36-operator-intel-console-presentation-spec.md
```

## Purpose

Integrate the Human UI trial, UI/UX story pass, and terminology bridge audit into a concrete presentation specification.

This packet should answer what the first operator experience should look like and say, using existing Atlas backend/service capabilities. It should define a future bounded Dev slice only after the screen/spec work is clear.

## Accepted Direction

Use an operator-facing guided pipeline:

```txt
Lead
-> Discovery / possible leads
-> Queue review
-> Enrich selected
-> Evidence
-> Observation
-> Assessment Memory
```

This is a presentation model over existing services. It is not a new backend pipeline.

Accepted principles:

- Investigation is the primary path.
- Readiness is diagnostics/settings.
- Scopes are progressive refinement after a lead or action exists.
- Queue refs are possible leads until ESI expansion.
- `Enrich selected` explicitly calls ESI and creates stored killmail evidence.
- `Refresh labels` is readability-only metadata hydration.
- `Power on live lookups` is provisional as a global live/API affordance, but it must not start work.
- Raw/internal detail remains available through drawers/details/settings.
- Marked and Watch remain asymmetric.
- Deletion/pruning remains blocked.

## Ordered Runway

1. Read all source-of-intent files above.
2. Restate the screen-level problem in plain operator language.
3. Define the first Investigation screen layout:
   - primary regions
   - lead input/state
   - compact local/stored context
   - live/API affordance
   - current stage indicator
   - next action
   - detail/drawer affordances
4. Define stage grammar for each pipeline stage:
   - what the operator sees
   - what action is available
   - what must be hidden/deferred
   - evidence/live/API/assessment boundary copy
   - loading, empty, blocked, degraded, and error states
5. Define navigation disposition:
   - what remains top-level
   - what moves under Settings / Diagnostics
   - what Scopes becomes as progressive refinement
   - how Queue Review and Watch/Radar should be separated conceptually
6. Define terminology and copy rules using the terminology bridge audit:
   - backend/internal terms that must not appear in primary copy
   - user-facing aliases
   - risky terms to avoid
   - approved wording for Discovery, Evidence, Observation, Assessment Memory, Marked, Watch, Enrich selected, Refresh labels, and retention/deletion.
7. Decide whether `Power on live lookups` should be specified exactly, renamed, or left as a placeholder with constraints.
8. Recommend exactly one future bounded Dev packet only if enough specification exists.
9. Create the expected handoff and update Evidence / Handoff below.

## Guardrails

- Do not implement code.
- Do not authorize live/API behavior changes.
- Do not rename database tables, services, IPC commands, or files.
- Do not pass UI/UX or terminology audit recommendations directly to Dev unless accepted in this packet.
- Do not collapse Discovery, Evidence, Observation, and Assessment boundaries.
- Do not make Readiness or Scopes the primary operator journey.
- Do not introduce final `Record`, `Intelligence`, or `Finding` semantics.
- Do not introduce evidence deletion/pruning or destructive retention behavior.
- Do not adopt shared/Lab doctrine unless it is explicitly accepted for Atlas.

## Stop Conditions

Stop and return to Human/Overseer if:

- the spec requires final naming for `Record`, `Intelligence`, `Finding`, or Assessment variants
- the `Power on` affordance cannot be specified without weakening explicit live/API gates
- the desired first screen would require backend/service behavior changes
- the future Dev packet cannot be verified by renderer/Electron smoke checks
- deletion/retention wording appears to imply an available destructive capability

## Required Verification

No code verification is required for this specification packet.

Required status check:

```powershell
git status --short --branch
```

If a future Dev packet is recommended, include likely verification commands, expected to include:

```powershell
npm.cmd run verify:renderer-shell
npm.cmd run smoke:electron
```

## Evidence

Specialist fills this before handoff:

```txt
Files reviewed:
Screen spec written:
Accepted terminology:
Deferred terminology:
Navigation disposition:
Power on disposition:
Recommended next Dev packet:
Verification notes:
```

## Handoff

Specialist creates:

```txt
workspace/UIUXHS36-operator-intel-console-presentation-spec.md
```

Handoff must include:

- screen-level layout specification
- stage-by-stage presentation grammar
- terminology/copy rules
- navigation disposition
- `Power on` disposition
- future Dev packet recommendation, if any
- acceptance checks
- risks and Human questions
