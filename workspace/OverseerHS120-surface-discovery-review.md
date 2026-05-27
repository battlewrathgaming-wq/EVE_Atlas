# OverseerHS120 - Surface Discovery Review

Date: 2026-05-27
Role: Atlas Overseer
Status: Advisory accepted as discovery input

## Reviewed

- `workspace/surfaces/README.md`
- `workspace/surfaces/atlas-surface-index.md`
- `workspace/surfaces/surface-consolidation-note.md`
- Surface notes under `workspace/surfaces/`

## Decision

The `workspace/surfaces/` inventory is accepted as advisory discovery input.

It is not product authority, final UI specification, Lab adoption, request_display submission, Dev authorization, or source-term rename.

## Human Surface Consolidation Accepted As Advisory Input

Human follow-up consolidated Atlas into fewer operator places:

- Storage widget with setup pop-out.
- External I/O widget.
- R-Scanner central display and setup/manage pane.
- Live Search surface.
- Observation pane.

Embedded or stateful items:

- Discovery leads / Queue Review live inside Live Search and R-Scanner/manage flows.
- Hydration / Refresh labels should mostly behave as an auto resolver: local lookup first, then ESI when gated.
- Evidence/EVEidence stack lives inside Observation as a tier/basis stack.
- Assessment Memory lives inside Observation as a drawer anchored on the entity of interest.
- Pruning likely lives inside Observation as sample review and decision support.
- Deletion preflight, support artifacts, snapshots, trace packs, and storage budget live in the Storage widget/pop-out.
- `Watch_offline` maps behind R-Scanner state.
- `held_by_external_io` maps behind the External I/O widget.
- `scope_status` remains unresolved diagnostic language.

## Boundary Notes

- This discovery work should prevent Atlas from exploding every backend state into a standalone UI surface.
- Surface files are launch points for future UIUX/Lab/display-request discussion, not implementation instructions.
- Storage/runtime hardening remains the active milestone priority.
- No Dev runway is opened.

## Recommended Use

Use `workspace/surfaces/atlas-surface-index.md` as the surface map when shaping future display requests, UIUX reviews, or renderer packets.

If a future packet touches UI, first check whether the work belongs to one of the five primary operator places above.
