# Current State: Manual Discovery Lane

Date: 2026-05-24

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
- direct Live manual discovery rejects radius before provider work; radius acquisition belongs to Watch / Sequencer
- direct Live manual discovery uses per-fingerprint cooldown and scoped abuse lockout as provider pacing, not Evidence or queue failure state

Manual expansion:

- selects queued refs by scope or killmail ID
- calls ESI for selected refs
- respects max expansion cap
- writes evidence through the existing ingestion pipeline
- direct Live manual expansion uses per-fingerprint ESI cooldown; retryable provider capacity deferral leaves refs pending rather than marking them failed

Manual discovery and manual expansion now use shared scope validation/default helpers. This keeps the CLI path aligned with the future IPC/UI path.

In the current UI, these controls exist but still need better progressive presentation. The backend lane is usable; the operator journey should make discovery feel like possible leads first, and expose scope/queue internals only when they help the operator choose a bounded action.

## Current Verification

- `verify:manual-discovery`
- `verify:queue-report`
- `verify:queue-preflight`
- `verify:db-integrity`
- `verify:controlled-workflow`
