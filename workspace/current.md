# AURA Atlas Current Work

Status: Active - Human/Overseer decision checkpoint
Last updated: 2026-05-24

## Active Milestone

Milestone: Operator Intel Console Presentation Decisions

Source of intent:

- Human local-alpha UI trial notes from 2026-05-24.
- `docs/audits/audit-2026-05-24-local-alpha-human-ui-trial.md`
- `workspace/UIUXHS34-operator-experience-story-pass.md`
- `workspace/UIUXHS36-operator-intel-console-presentation-spec.md`
- `workspace/OverseerHS35A-terminology-authority-correction.md`
- `workspace/OverseerHS37-intel-console-spec-review.md`
- `docs/features/presentation-layer-information-index.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/roadmap/operator-investigation-desk.md`

Current focus: decide the remaining presentation and terminology-authority questions before Dev implementation.

## Executor

Current executor: Human / Overseer.

Dev is not active.

Expected DevHS filename: none until a Dev packet is written.

## Accepted Direction

The future UI should move toward an Investigation-first guided console using existing services:

```txt
Lead
-> Discovery / possible leads
-> Queue review
-> Enrich selected
-> Evidence
-> Observation
-> Assessment Memory
```

This is a presentation model only. It does not authorize backend, IPC, database, live/API, evidence, assessment, watch, or retention behavior changes.

## Decisions Needed Before Dev

1. Global live/API affordance:
   - choose exact label or leave provisional
   - candidates: `Live lookups`, `Power on live lookups`
   - must mean permission/status only, not collection
2. Top-level navigation:
   - accept or revise proposed surfaces:
   - `Investigation`
   - `Watch / Radar`
   - `Reports / Observations`
   - `Settings / Diagnostics`
3. First story surface wording:
   - accept or revise `View evidence story`
   - must preserve evidence/observation boundary
4. Stored context placement:
   - choose right drawer, lower panel, or inline expandable strip for known local context
5. Lead input scope:
   - keep zKill link / killmail ID paste deferred, or accept it as the next lead input after presentation work
6. Color/tactical language:
   - define how far red/yellow/green can go before it implies threat/safety semantics
7. Terminology authority:
   - define who/what can approve backend -> bridge -> frontend term mappings before broad terminology rewrites

## Guardrails

- Do not implement code yet.
- Do not treat `workspace/archive/terminology-bridge-audit-2026-05-24-unaccepted.md` as approved authority.
- Do not rename database tables, services, IPC commands, files, or durable docs.
- Do not authorize live/API behavior changes.
- Do not collapse Discovery, Evidence, Observation, and Assessment boundaries.
- Do not make Readiness or Scopes the primary operator journey.
- Do not introduce final `Record`, `Intelligence`, or `Finding` semantics.
- Do not introduce evidence deletion/pruning or destructive retention behavior.
- Do not adopt shared/Lab doctrine unless explicitly accepted for Atlas.

## Likely Next Dev Packet After Decisions

If the Human/Overseer accepts enough decisions, the next bounded Dev packet should be:

```txt
Renderer Intel Console Progressive Disclosure
```

Likely scope:

- renderer presentation/copy/navigation only
- no backend/service/database/IPC renames
- no new live/API behavior
- no new persistence behavior
- no evidence, assessment, watch, or retention semantic changes
- preserve access to existing diagnostics and details

Likely verification:

```powershell
npm.cmd run verify:renderer-shell
npm.cmd run smoke:electron
```

If the packet changes evidence/report/live-gate copy broadly, Overseer may also require:

```powershell
npm.cmd run verify:all
```

## Evidence

Overseer review:

```txt
workspace/OverseerHS37-intel-console-spec-review.md
```

Accepted advisory spec:

```txt
workspace/UIUXHS36-operator-intel-console-presentation-spec.md
```

## Handoff

No Dev handoff is expected.

Human/Overseer decisions above are required before a Dev runway is written.
