# OverseerHS38A: Presentation Authority Note

Date: 2026-05-24
Role: Overseer
Trigger: Human authority clarification

## Decision

Atlas still controls backend and bridge terms, evidence boundaries, live/API gates, and persistence semantics.

Longer term, Labs can replace UI presentation as a focus-group/product-presentation layer. It makes sense for Labs or a dedicated presentation project to do final UI wiring after Atlas has clean structure and stable boundaries.

## Effect On Current Dev Runway

HS39 remains valid as an Atlas renderer presentation pass, but it is not final presentation doctrine.

Dev should:

- keep changes renderer-only
- avoid hard-coding product doctrine into brittle presentation labels where a future Labs layer may adapt wording
- preserve backend/bridge/evidence/live/API boundaries
- keep diagnostics and details reachable
- avoid treating this pass as the final UI system

## Deferred

- Cross-project UI presentation ownership model.
- Shared component/presentation extraction.
- Labs final wiring.
- Formal terminology authority table.
