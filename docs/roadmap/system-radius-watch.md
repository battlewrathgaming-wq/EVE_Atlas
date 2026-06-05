# Roadmap: System Radius Watch

Status: Active
Date: 2026-05-21

## Direction

System watches should support a center system plus a jump radius derived from local SDE stargate topology.

The radius scope includes the center system. A radius of 0 is the center only; a radius of 1 is the center plus direct neighbors.

User-facing lists should put the center first and mark it as the center. Counts should be labeled as included systems; direct-neighbor counts exclude the center and are only for diagnostic or detail wording.

The core question is:

> Who is operating in and around this watched system?

## Motivation

EVE activity is spatial. Pipes, neighboring systems, chokepoints, and pockets matter.

Radius watches let the user express intent without manually tracking many systems. User-facing output should show the selected system, radius, and included systems plainly.

## Staging

1. Import SDE topology.
2. Calculate included system scope with BFS.
3. Plan zKill system discovery routes.
4. Collect refs respectfully.
5. Expand only uncached killmails through ESI.
6. Normalize activity events.
7. Report stored evidence by system, constellation, region, and operator.

## Dependencies

- SDE geography import
- `system_adjacency`
- radius planner
- evidence pipeline
- scoped reports

## Risks

- Radius collection can multiply API calls.
- Reports can overstate evidence if partial samples are not labeled.
- Collection provenance can be confused with intelligence scope.

## Related Documents

- `docs/tenets/tenets.md`
- `docs/adr/ADR-0001-zkill-is-discovery-only.md`
- `docs/adr/ADR-0002-expanded-killmails-authoritative.md`
