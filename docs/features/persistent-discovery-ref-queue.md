# Feature: Persistent Discovery Ref Queue

Status: Implemented foundation; active hardening continues
Updated: 2026-05-23

## Purpose

The discovery queue stores scoped zKill references before they are expanded through ESI.

It lets Atlas remember possible evidence without treating zKill summaries as evidence.

## Data Classification

Discovery refs are collection provenance and expansion staging metadata.

They are not evidence.

They become evidence only after the matching expanded ESI killmail is fetched and stored in `killmails`.

## Current Behavior

Atlas can:

- run manual discovery that calls zKill only
- store refs in `discovered_killmail_refs`
- keep queue scopes separate for actor, system, and radius work
- select refs for manual expansion
- skip cached killmails
- mark expanded, cached, failed, or pending states
- report queue state without creating evidence

## Runtime Flow

```text
validated scope
-> zKill discovery
-> discovered_killmail_refs
-> queue report / preflight
-> selected ESI expansion
-> killmails + activity_events
-> queue status update
```

## User Value

- progressive ingestion under conservative caps
- fewer repeated zKill calls for known refs
- explainable pending work
- safer manual expansion
- visible partial/capped state

## Must Not Do

- Store zKill summaries as authoritative evidence.
- Inflate activity counts before ESI expansion.
- Hide sample/cap limits.
- Expand automatically from passive report viewing.
- Merge queue state across unrelated scopes.
- Treat a pending ref as an observed activity event.

## Verification Areas

- queue selection
- queue scope isolation
- queue report
- manual discovery
- manual expansion
- passive side-effect sweep

Related docs:

- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/terms/discovery-queue.md`
- `docs/terms/at-a-glance-preview.md`
