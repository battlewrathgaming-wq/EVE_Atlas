# DevHS41: Renderer Intel Console Progressive Disclosure

Date: 2026-05-24
Role: Dev
Milestone: Renderer Intel Console Progressive Disclosure
Packet: HS41

## Scope

Executed the HS41 renderer presentation runway. The work reshaped the first operator screen into a Discovery-led console with Watch as the second primary mode, while preserving existing resolver, report, queue, and command-authority paths.

## Completed Renderer Changes

- Added top-bar primary modes: `Discovery` routes to the investigation console and `Watch` routes to the existing queue/watch surface.
- Demoted existing Readiness, Scopes, Tasks, Actions, and Reports surfaces into secondary/detail routes without removing access.
- Reworked first-screen lead copy toward current pipeline concepts: Pilot, System, Corp, and Alliance.
- Added a staged Discovery rail: `Lead -> Discovery -> Queue Review -> Enrich Selected -> Evidence -> Observation -> Assessment Memory`.
- Kept Queue Review and Enrich selected visible as staged Discovery steps, not top-level product navigation.
- Added a dedicated Stored Context pane populated from loaded `report.actor` or `report.radius` responses.
- Added an Observation Timeline pane that reads the existing structured `Recent Timeline` report section.
- Added a bottom `Top 5 relevant records` tray populated from recent stored report timeline rows.
- Stabilized busy-button label churn by replacing `Working...` text swaps with stable labels plus `aria-busy` and `.is-busy` styling.
- Applied a restrained teal/green shadow-glass presentation pass with transparent panels and readable contrast.

## zKill Paste Decision

zKill link and killmail ID paste support is visibly deferred in this slice. The UI states that paste is native operator behavior, but safe support would require backend/service parsing behavior outside HS41. Existing lead entry stays on Pilot, System, Corp, and Alliance routes.

## External API State

The top bar now presents `External API` state from readiness live/API data. The investigation context pane also uses `External API` wording and keeps zKill Discovery and ESI Enrichment described as explicit-action availability, not background collection.

## Discovery / Watch Behavior

`Discovery` activates the investigation console. `Watch` activates the existing queue/watch surface. Secondary navigation still reaches diagnostics, scope detail, task history, discovery actions, and observation/assessment surfaces.

## Stored Context And Top 5 Records

Stored Context is populated from loaded stored evidence reports only. The Top 5 tray uses the same report `Recent Timeline` rows ordered by available time. Because true relevance scoring is not available in this renderer slice, the tray copy says these are recent stored records and does not fabricate relevance.

## Observation Timeline Grounding

The Observation Timeline and story preview are grounded in existing structured report rows, especially `Recent Timeline` from actor and radius reports. The renderer formats time, killmail, system/region, victim/ship, attacker, and aggressor detail where present. It does not infer threat, motive, ownership, staging, affiliation, or current presence.

## Authority And Safety

HS39 command authority was preserved. No service registry, preload bridge, IPC command, provider behavior, DB schema, migration, persistence, evidence semantics, assessment semantics, watch semantics, retention semantics, or live behavior was changed.

The only `src/main/main.js` change updates Electron visual smoke expectations for the new HS41 route titles. It does not alter runtime service behavior.

## Verification

```powershell
npm.cmd run verify:renderer-shell
npm.cmd run verify:command-authority
npm.cmd run verify:all
npm.cmd run smoke:electron
git status --short --branch
```

Result:

```txt
PASS - verify:renderer-shell
PASS - verify:command-authority
PASS - verify:all, 62 scripts
PASS - smoke:electron
STATUS - ## main...origin/main with HS41 modified files
```

Electron smoke artifact path:

```txt
F:\Projects\AURA-Atlas\.tmp\electron-visual-smoke
```

## Remaining Risks / Questions

- The Top 5 tray is honest recent-record presentation, not relevance ranking.
- zKill paste remains deferred until a backend/service parsing packet accepts it.
- The visual style is a first Atlas renderer pass, not final Labs presentation doctrine.
- The smoke harness now follows HS41 titles; future presentation renames should update smoke expectations together.

## Recommended Next Action

Overseer should review HS41 against `workspace/current.md`, especially the scope of the `src/main/main.js` smoke-expectation update, and either accept the renderer presentation pass or write a narrowly scoped correction packet.
