# OverseerHS38: Intel Console Human Decisions

Date: 2026-05-24
Role: Overseer
Trigger: Human presentation decisions after HS37

## Accepted Decisions

- Use `External API` as the honest top-bar label for zKill/ESI/live provider availability and kill-switch state.
- Top bar primary modes should be `Discovery` and `Watch`.
- When `Discovery` is pressed, the center view should focus on discovery content only.
- The left side should populate with `Observation` and `Assessment` as the investigation develops.
- `Queue Review -> Enrich` should be treated as inherent staged process inside Discovery, not as top-level product navigation.
- If External API is connected and the kill switch is off, the Discovery flow may proceed through its visible staged process using existing gates and actions. This must not become passive startup/background collection.
- `Radar` is not an active product term. It was qualitative inspiration only.
- Desired operator moments:
  - "Cool!"
  - "Oh, my system watch has new hits."
  - "What happened in that fight?"
- The observation timeline should become a strong presentation layer for fight/story understanding.
- Avoid sysadmin/network-configuration framing.
- Stored context should have its own pane.
- The bottom of the console should have a `Top 5 relevant records` tray, ordered by time.
- zKill input is native to user behavior and should be supported as an accepted lead mode when it can be done safely.
- Lead/input types should match the pipeline concepts already built: Pilot, System, Corp, Alliance.
- Visual direction: sci-fi teal/green, shadow-glass buttons, slightly transparent back pane. This is a first pass and can change as textures develop.
- Terminology authority: Atlas controls everything behind the bridge. Lab/presentation layers can change human-facing wording where required, but intent must remain relevant and faithful.

## Boundaries

- These decisions authorize a renderer presentation/copy/navigation packet.
- They do not authorize backend, database, IPC, evidence, assessment, watch, or retention semantic changes.
- They do not authorize passive live collection.
- They do not accept the parked terminology bridge audit as authority.

## Next Packet

`workspace/current.md` now gives Dev a bounded renderer-only packet:

```txt
DevHS39-renderer-intel-console-progressive-disclosure.md
```
