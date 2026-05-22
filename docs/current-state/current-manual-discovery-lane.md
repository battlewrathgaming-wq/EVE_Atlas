# Current State: Manual Discovery Lane

Date: 2026-05-22

## What Exists

Manual discovery is implemented as a CLI/script-verifiable user-led lane.

It supports:

- actor scope
- system scope
- radius scope

## Flow

```txt
manual:discover
-> zKill refs only
-> discovered_killmail_refs
-> queue report / provenance
-> manual:expand
-> ESI expanded killmails
-> activity_events
```

## Current Behavior

Manual discovery:

- calls zKill only
- may store at-a-glance preview metadata
- writes no killmails
- writes no activity events
- uses `manual_actor`, `manual_system`, or `manual_radius` queue scopes

Manual expansion:

- selects queued refs by scope or killmail ID
- calls ESI for selected refs
- respects max expansion cap
- writes evidence through the existing ingestion pipeline

## Current Verification

- `verify:manual-discovery`
- `verify:queue-report`
- `verify:queue-preflight`
- `verify:db-integrity`

