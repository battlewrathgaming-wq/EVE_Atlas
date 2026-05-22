# Audit: Scoped zKill Discovery Handover

Date: 2026-05-22
Status: Accepted

## Purpose

Record the narrow backend hardening pass for user-entered system names, scoped zKill route planning, live IO gate behavior, trace output, and freshness wording.

## Completed Work

- Added a shared local system resolver.
- Replaced duplicated system-name lookup in manual discovery and the live system watch runner.
- Added a zKill discovery endpoint builder for scoped route construction.
- Added offline verification for local system resolution and `/systemID/{id}/pastSeconds/{seconds}/` route construction.
- Added a live-gated scoped zKill smoke harness.
- Added the scoped zKill smoke to live verification grouping.

## Behavior Now Proven Offline

System input follows this shape:

```txt
user-entered system name or ID
-> local SDE topology lookup
-> durable solar_system_id
-> scoped zKill discovery route
```

The resolver is local-only. It does not call ESI. If the local topology tables are missing or the system is not found, the workflow fails clearly and records a local lookup failure where the live runner can do so.

The route builder verifies:

```txt
https://zkillboard.com/api/systemID/<solar_system_id>/pastSeconds/<seconds>/
```

## Live Smoke Contract

The new `verify:live-scoped-zkill` script is explicitly live-gated by:

```txt
AURA_ATLAS_LIVE_API=1
```

It also refuses runtime SDE zip import. The SDE zip remains import material only; live collection must use SQLite lookup tables.

Expected behavior:

- resolve system from local SQLite topology
- plan radius 0 system discovery
- pass the live IO gate for `manual.discovery`
- make zKill discovery calls only
- queue discovered refs as possible evidence
- make zero ESI expansion calls
- write no killmail evidence and no activity events

## Trace And Freshness Output

The live smoke prints:

- DB path
- planned/completed timestamps
- resolved system label and ID
- lookback window
- scoped zKill endpoint
- live gate provider/API estimate
- run ID
- queued refs
- zKill/ESI API call counts
- zKill preview time range when preview times are available

Freshness wording is intentionally cautious:

```txt
Queued refs and zKill preview fields are discovery/provenance metadata,
not killmail evidence. Expand with ESI before using activity reports.
```

## Verification

Passed:

```powershell
npm.cmd run verify:system-resolution
npm.cmd run verify:all
```

`verify:all` now includes 46 offline scripts.

No live zKill call was run during this handover.

## Considerations

- The live scoped zKill smoke requires a DB that already has SDE topology imported.
- If operators want a one-command disposable live smoke against a named real system, a future script can explicitly import local SDE first, but it should still treat the SDE zip as import material only.
- The next UI question is whether the renderer should expose a "discover refs only" system/radius action using this same contract, or continue routing discovery through the existing Actions pane.

