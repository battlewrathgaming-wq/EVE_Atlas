# OverseerHS367 - HS366 Discovery Utility / Watch Split Readiness Review

Status: accepted
Date: 2026-06-07
Role: Overseer
Reviewed artifact: workspace/EngineeringTraceHS366-discovery-utility-watch-split-readiness.md

## Decision

HS366 is accepted.

The advisory confirms the existing code can be trimmed into the accepted model, but not by treating the current live-capable Watch collectors as the future boundary.

Accepted target shape:

```txt
Watch intent / accepted scope
-> Discovery utility acquisition
-> Discovery candidate refs / receipt basis
-> ESI Evidence Expansion
-> Evidence/EVEidence writes
-> caller receipt/handoff
```

## Accepted Findings

- Current `collectActorWatch(...)` and `collectSystemRadiusWatch(...)` remain mixed collector paths.
- Those collectors currently combine Watch-triggered movement, zKill Discovery acquisition, Discovery ref persistence, expansion selection, ESI Evidence Expansion, Evidence/EVEidence persistence, warnings/logs, fetch-run lifecycle, and Watch run posture.
- `discovered_killmail_refs` should remain candidate-ref memory, not Discovery task/packet memory.
- `fetch_runs` remains useful historical posture but is not a clean Discovery receipt.
- Manual Discovery / Manual Expansion are useful cleaner-path patterns, but they are not immediate authority for Watch runtime behavior.
- Durable Discovery receipt/task-packet schema should remain parked.
- Live Watch provider movement should remain parked while Watch executor still points directly into mixed collectors.

## Accepted Ownership Split

Watch owns:

- authoring and accepted scope
- scheduler due/backoff/cadence
- stored `included_system_ids` authority for system/radius
- emitting Discovery pickup intent
- later reading a receipt projection and deciding rest/retry/defer/review

Discovery owns or faces:

- caller-agnostic acquisition intake
- pickup packet fanout
- zKill request shaping
- provider attempt basis
- candidate ref extraction/dedupe
- no-ref, cap, defer, retry, and failure acquisition language
- canonical receipt basis and safe projections

ESI Evidence Expansion owns:

- eligible `killmail_id` / hash selection for ESI expansion
- ESI killmail provider calls
- ESI capacity deferral
- expansion warnings and failed expansion status

Evidence/EVEidence storage owns:

- `killmails` writes
- `activity_events` writes
- raw ESI payload/checksum preservation
- ingestion audits and Evidence conflict warnings

## Accepted Next Packet

Open a narrow fixture bridge proof:

```txt
Watch-to-Discovery acquisition split fixture bridge
```

Acceptance target:

```txt
current Watch dispatch can feed Discovery-owned acquisition without entering the mixed collector path
```

This should be read-only/local-only or fixture-only. It should not call providers, write DB rows, execute Watch, create tasks, enter the mixed collectors, write Discovery refs, write Evidence/EVEidence, hydrate labels, mutate schema, open dispatcher/enforcement behavior, or touch UI.

## Parked

- durable Discovery task/packet/receipt schema
- live Watch provider movement
- Watch schedule advancement from receipt
- ESI expansion routing changes
- Manual/Live adoption of receipt vocabulary
- UI / Observation / Hydration / Assessment
- dispatcher, queues, leases, workers
- runtime enforcement

## Human / Overseer Decisions

No Human decision is needed unless the Human wants to change direction away from the audit-first, fixture-bridge posture.

The next Dev runway is coherent and may be opened.
