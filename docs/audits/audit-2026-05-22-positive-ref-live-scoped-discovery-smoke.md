# Positive-Ref Live Scoped Discovery Smoke

Date: 2026-05-22

## Summary

Ran a controlled positive-ref scoped discovery-only live smoke.

This smoke proved a non-empty live zKill result can be queued as possible evidence without ESI expansion or evidence table writes.

## Scope

- Target: ZTS-4D `[solarSystemID: 30004660]`
- Radius: 0
- Lookback: 604800 seconds / 7 days
- Max refs per system: 1
- Planned zKill requests: 1
- ESI expansion cap: 0 by behavior of discovery-only smoke
- Runtime DB: `F:\Projects\AURA-Atlas\.tmp\scoped-zkill-positive-smoke.sqlite`

## Result

- zKill refs discovered: 1
- queued refs written: 1
- queued ref sample: `135651009`
- ESI calls: 0
- expansion attempted: 0
- killmails written: 0
- activity events written: 0
- fetch runs in smoke DB after run: 3

Artifact:

`F:\Projects\AURA-Atlas\.tmp\live-scoped-zkill-smoke\scoped-zkill-scoped_zkill_live_discovery_verified.json`

## Boundary

The queued ref is discovery/provenance metadata only.

It is not killmail evidence.
It is not an observation.
It should not appear in activity reports until explicitly expanded through ESI and stored as an expanded killmail.

## Verification Notes

The run used the existing live-gated smoke harness:

`npm.cmd run verify:live-scoped-zkill`

The live gate was explicit through `AURA_ATLAS_LIVE_API=1`.

The run made no ESI calls and wrote no `killmails` or `activity_events`.
