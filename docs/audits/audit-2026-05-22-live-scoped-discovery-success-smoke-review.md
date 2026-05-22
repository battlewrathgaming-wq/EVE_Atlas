# Audit: Live Scoped Discovery Success Smoke Review

Date: 2026-05-22
Milestone: Operator Evidence Operations Readiness

## Status

Reviewed and accepted.

The live scoped discovery success smoke was run under explicit operator control with `AURA_ATLAS_LIVE_API=1`. The run used local SQLite topology lookup, planned one scoped zKill route, queued discovery refs only, and performed zero ESI expansion.

## Runtime Scope

- DB path: `F:\Projects\AURA-Atlas\.tmp\scoped-zkill-success-smoke.sqlite`
- Target: `ZTS-4D [solarSystemID: 30004660]`
- Radius: `0`
- Lookback: `86400` seconds / `24 hours`
- Max refs per system: `5`
- Planned zKill requests: `1`
- Route: `https://zkillboard.com/api/systemID/30004660/pastSeconds/86400/`

## Results

- zKill API calls: `1`
- ESI API calls: `0`
- Refs discovered: `0`
- Queued refs written: `0`
- ESI expansion attempted: `0`
- Stored killmails: `0`
- Stored activity events: `0`

The zero-ref outcome is a discovery result for the selected route/window, not evidence of no activity. No expanded ESI killmails were fetched, so no observation report should treat this as an activity finding.

## Artifact

- Latest artifact: `F:\Projects\AURA-Atlas\.tmp\live-scoped-zkill-smoke\latest.json`
- Success artifact: `F:\Projects\AURA-Atlas\.tmp\live-scoped-zkill-smoke\scoped-zkill-scoped_zkill_live_discovery_verified.json`

The artifact includes topology readiness, evidence counts, route, live gate estimate, API counts, queued ref sample, freshness context, and the non-evidence boundary wording.

## Boundary Confirmation

- zKill discovery refs remain discovery/provenance metadata.
- zKill preview fields are not killmail evidence.
- Expanded ESI killmails remain required before activity observations.
- SDE zip was not used at runtime; topology came from local SQLite tables.
- Live execution stayed under `.tmp` on `F:`.

## Implementation Note

The first success-smoke attempt failed before network IO because the smoke script passed `maxRadius: 0` into shared scope validation. The script now uses a positive guard limit while still requesting radius `0`, preserving the conservative runtime scope.
