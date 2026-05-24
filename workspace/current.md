# AURA Atlas Current Work

Status: Active - specialist planning
Last updated: 2026-05-24

## Active Milestone

Milestone: Operator Experience Story Pass

Source of intent:

- Human local-alpha UI trial notes from 2026-05-24.
- `docs/audits/audit-2026-05-24-local-alpha-human-ui-trial.md`
- `docs/audits/audit-2026-05-24-local-alpha-readiness-closure.md`
- `docs/roadmap/operator-investigation-desk.md`
- `docs/features/presentation-layer-information-index.md`
- `docs/current-state/current-ipc-ui-preparation.md`

Current focus: convert Human UI friction into concrete operator stories and a bounded future Dev slice.

## Executor

Current executor: UI/UX specialist or Planner.

Dev is not active.

Expected handoff filename:

```txt
UIUXHS34-operator-experience-story-pass.md
```

## Purpose

Atlas has passed readiness mechanics, but the Human UI trial found that the first experience still reads like configuration, diagnostics, and backend surfaces rather than discovery and story.

This packet should turn that feedback into clear product stories, presentation priorities, and one bounded Dev-ready recommendation. It should not implement code.

## Accepted Human Feedback

- Window movement feels smooth.
- The app is much improved.
- Text edge handling is odd in places.
- Verbiage is abstract.
- Readiness should feel like diagnostics/settings, not the main user flow.
- Scopes exposes too many choices at once and feels internal.
- Scope data should appear as the end state of a journey, not the first burden.
- `Refresh watches` and `Preview queue` flicker strangely.
- The UI remains too information-dense.
- Live API / zKill / ESI state should likely be represented by one clear operator-facing "Power on" control, with details behind it.
- The current surface reads more like network configuration than a discovery and storytelling tool.

## Ordered Runway

1. Read the accepted source documents and the Human trial note.
2. Write 4-6 operator user stories for the first Investigation experience.
3. For each story, define:
   - operator intent
   - plain-language UI promise
   - primary information shown
   - secondary/detail information hidden or deferred
   - safety/evidence boundary
   - acceptance check
4. Recommend a progressive flow for Investigation, Readiness, Scopes, Queue / Watches, and Reports:
   - what belongs in the first operator path
   - what belongs in diagnostics/settings
   - what belongs only after a lead or action exists
5. Decide whether the "Power on" idea should be accepted as:
   - one global live/API affordance
   - a label/copy change only
   - deferred pending more design work
6. Recommend exactly one bounded next Dev packet if implementation is justified.
7. Create the expected handoff file and update Evidence / Handoff below.

## Guardrails

- Do not implement code.
- Do not authorize live/API behavior changes.
- Do not collapse Discovery, Evidence, Observation, and Assessment boundaries.
- Do not treat Scopes/backend IDs/service counts as primary user story content unless the story requires detail inspection.
- Do not make Readiness the main product journey.
- Do not broaden into public release, map rendering, AI commentary, relationship graph, or fight-clustering.
- Do not rewrite product doctrine from Lab/shared work.

## Stop Conditions

Stop and return to Human/Overseer if:

- the story pass requires a product term decision such as Record, Intelligence, Finding, or final Assessment naming
- the recommended flow requires live/private/destructive actions
- the "Power on" model would weaken explicit live/API gates
- the proposed Dev packet cannot be verified with bounded smoke or renderer checks

## Required Verification

No code verification is required for this specialist planning packet.

Required checks:

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
Stories written:
Presentation decisions:
Deferred decisions:
Recommended next Dev packet:
Verification notes:
```

## Handoff

Specialist creates:

```txt
workspace/UIUXHS34-operator-experience-story-pass.md
```

Handoff must include:

- user stories
- accepted presentation direction
- rejected/deferred ideas
- exact next Dev packet if recommended
- acceptance checks
- risks and Human questions
