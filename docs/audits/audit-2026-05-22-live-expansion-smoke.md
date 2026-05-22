# Audit: Live Expansion Smoke

Date: 2026-05-22
Status: Passed
Scope: Controlled live manual discovery and manual ESI expansion against a disposable DB.

## Purpose

Prove the controlled path from possible evidence to stored evidence:

```txt
typed actor name
-> ESI name resolution
-> zKill discovery refs
-> discovery queue
-> explicit manual ESI expansion
-> stored expanded killmail evidence
-> normalized activity events
-> queue/report state update
```

## Target And Scope

Target:

```txt
Mr Jesterman [characterID: 1329523328]
```

Discovery scope:

```txt
manual_actor:character:1329523328
lookback: 604800 seconds / 7 days
max refs: 5
max expansions: 1
```

Runtime DB:

```txt
F:\Projects\AURA-Atlas\.tmp\live-expansion-smoke.sqlite
```

Live gate:

```txt
AURA_ATLAS_LIVE_API=1
```

## Commands

Manual discovery:

```powershell
npm.cmd run manual:discover -- --scope actor --actor-type character --name "Mr Jesterman" --lookback-seconds 604800 --max-refs 5
```

Manual expansion:

```powershell
npm.cmd run manual:expand -- --type manual_actor --id character:1329523328 --max-expansions 1
```

Inspection:

```powershell
npm.cmd run report:queue -- --type manual_actor --id character:1329523328
npm.cmd run report:actor -- --type character --id 1329523328 --name "Mr Jesterman" --lookback 604800
```

## Results

Name resolution:

```txt
metadata_runs: 1
ESI /universe/ids calls: 1
resolved: 1
unresolved: 0
```

Manual discovery:

```txt
run_id: run_1779468088592_91f49bce
zKill refs discovered: 5
queued refs written: 5
ESI expansions attempted: 0
new ESI expansions: 0
activity events written: 0
zKill API calls: 1
ESI API calls: 0
```

Manual expansion:

```txt
run_id: run_1779468117869_868a720d
candidates considered: 1
expansion attempted: 1
new ESI expansions: 1
persisted killmails: 1
activity events written: 8
failed expansions: 0
zKill API calls: 0
ESI killmail expansion calls: 1
```

Stored evidence:

```txt
killmails: 1
activity_events: 8
ingestion_audits: 1
discovered_killmail_refs: 5
queue status: 1 expanded / 4 pending
stored killmail_id: 135658042
```

API logs:

```txt
ESI metadata calls: 1
zKill discovery calls: 1
ESI killmail expansion calls: 1
retry_count: 0
rate_limited: false
errors: none
```

## Report State

Queue report confirmed:

- 5 queued refs
- 1 expanded
- 4 pending
- discovery refs remain classified as staging/provenance metadata
- at-a-glance zKill values remain preview metadata only

Actor report confirmed:

- `PARTIAL SAMPLE`
- 1 expanded killmail
- 1 actor activity event matching actor/time scope
- actor role: attacker
- evidence window and provenance displayed
- no unsupported staging, ownership, location, intent, or affiliation claim

## Warnings

One data quality warning was recorded:

```txt
manual_discovery: Manual discovery queued refs only; no ESI expansion was attempted
```

This is expected for the manual discovery stage and is not an expansion failure.

## Boundary Assessment

Passed.

- zKill discovery created queued refs only.
- ESI expansion happened only after explicit manual expansion.
- Expanded ESI killmail became stored evidence.
- Activity events were created only after ESI expansion.
- Pending refs remained possible evidence, not observations.
- Reports derived observations from stored evidence only.
- Disposable DB stayed under `F:\Projects\AURA-Atlas\.tmp`.

## Follow-Up Notes

The actor report contains unresolved system/type/corp/alliance labels because this disposable DB was not prepared with full SDE inventory/topology or report-scoped hydration.

That is acceptable for this smoke. Metadata readability should be handled by the separate metadata hydration UI task.
