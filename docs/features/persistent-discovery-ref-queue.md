# Feature: Persistent Discovery Ref Queue

Status: Proposed
Date: 2026-05-22

## Purpose

Persist killmail references discovered from zKill so AURA Atlas can continue ESI expansion from known local work without re-querying zKill for the same refs every time.

This feature captures the fact that a scoped discovery run found:

```txt
killmail_id + zkb.hash
```

at a specific time, in a specific collection scope.

It does not store zKill summaries as intelligence.

## User Value

This supports:

- fewer repeated zKill discovery calls during progressive ingestion
- clearer pending-work diagnostics
- more explainable cap behavior
- resumable evidence collection after a capped run
- separation between discovery and ESI expansion
- better audit visibility into what Atlas knew existed but had not expanded yet

Example flow:

```txt
zKill discovery finds 20 refs
-> Atlas stores 20 discovery refs locally
-> ESI budget expands 2
-> 18 remain pending
-> next run can expand pending refs without rediscovering them first
```

Periodic zKill discovery is still needed to find new refs for a live scope, but known pending refs should not require rediscovery before expansion.

## Data Classification

Discovery refs are collection provenance and staging metadata.

They are not killmail evidence.

They are not derived intelligence.

They become evidence only after successful ESI expansion and persistence of the expanded killmail payload.

## Creation Path

Discovery refs are created by scoped zKill discovery runs:

- system watch
- radius watch
- actor watch
- future manual scan

The collector should extract only:

```txt
killmail_id
hash
```

plus local provenance about where and when the ref was discovered.

ESI expansion workers should then drain pending refs under conservative budgets.

## Suggested Data Shape

Possible table:

```txt
discovered_killmail_refs (
  killmail_id INTEGER NOT NULL,
  killmail_hash TEXT NOT NULL,
  discovered_by_type TEXT NOT NULL,
  discovered_by_id TEXT,
  source_scope TEXT,
  source_system_id INTEGER,
  source_actor_type TEXT,
  source_actor_id INTEGER,
  discovered_at TEXT NOT NULL,
  first_seen_run_id TEXT,
  last_seen_run_id TEXT,
  last_seen_at TEXT NOT NULL,
  status TEXT NOT NULL, -- pending | expanded | cached | failed | superseded
  selected_for_expansion_at TEXT,
  expanded_at TEXT,
  failed_at TEXT,
  failure_count INTEGER DEFAULT 0,
  last_error TEXT,
  priority INTEGER DEFAULT 0,
  PRIMARY KEY (killmail_id, killmail_hash, discovered_by_type, discovered_by_id)
)
```

Possible status meanings:

- `pending`: discovered but not expanded locally
- `expanded`: expanded ESI killmail is stored
- `cached`: local killmail already existed when discovered
- `failed`: last expansion attempt failed
- `superseded`: retained for audit but no longer active for expansion

The exact primary key may change if a single killmail ref should track multiple discovery scopes separately.

## Runtime Behavior

Collection should become:

```txt
plan scope
-> zKill discovery updates discovered_killmail_refs
-> select pending uncached refs for ESI expansion
-> apply global ESI expansion budget
-> expand selected refs one killmail at a time through ESI
-> store expanded ESI killmails once
-> mark refs expanded/cached/failed
```

If pending refs already exist for a scope, Atlas may drain them before or alongside fresh zKill discovery, depending on the run mode.

Normal report queries still read from:

- `killmails`
- `activity_events`
- lookup metadata tables

They should not treat pending discovery refs as activity evidence.

## Must Not Do

This feature must not:

- store zKill summary payloads as authoritative intelligence
- treat discovered-but-unexpanded refs as killmail evidence
- inflate activity/event counts before ESI expansion
- bypass ESI expansion caps
- hide partial coverage
- require live zKill calls to continue expanding already-known pending refs
- replace immutable expanded ESI killmail storage

## Open Questions

- Should pending refs be drained before fresh zKill discovery, after discovery, or by explicit mode?
- Should a ref discovered through multiple scopes have one row with many provenance links, or multiple scoped rows?
- How long should failed refs remain retryable before becoming inactive?
- Should pending-ref counts appear in evidence reports, run reports, or only diagnostics?

## Related Documents

- `docs/adr/ADR-0001-zkill-is-discovery-only.md`
- `docs/adr/ADR-0002-expanded-killmails-authoritative.md`
- `docs/adr/ADR-0004-staged-collection-and-expansion-budgets.md`
- `docs/tenets/tenets.md`
- `docs/tenets/Reporting.md`
