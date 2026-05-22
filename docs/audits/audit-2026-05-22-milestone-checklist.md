# Audit: Milestone Checklist And Feature Alignment

Date: 2026-05-22
Scope: Current AURA Atlas PoC milestone state after evidence pipeline, topology, reports, actor/corporation observation, discovery queue, and manual discovery workflow.

## Current Milestone Position

AURA Atlas is past the initial evidence pipeline and topology foundation. It is now in the read-side observation and controlled collection phase.

The next major proof is broad internal testing of controlled collection and observation work products before UI work begins.

## Milestone Checklist

### Milestone 1: Evidence Pipeline

Status: Passed

Goal:

```txt
zKill discovery
-> ESI expanded killmail
-> immutable killmail evidence
-> normalized activity_events
-> idempotent persistence
```

Features meeting the goal:

- SQLite schema stores `killmails`, `activity_events`, audits, warnings, API logs, and fetch runs.
- zKill is used for `killmail_id + hash` discovery only.
- ESI expanded killmails are persisted as the evidence source.
- Killmail upsert preserves existing raw evidence and warns on checksum/hash mismatches.
- Activity events are rebuildable from expanded ESI killmail evidence.
- Re-ingestion is idempotent and does not duplicate events.

Verification:

- `verify:fixture`
- `verify:idempotent`
- `verify:migrations`

### Milestone 2: SDE Topology And System Radius Collection

Status: Passed foundation; live radius smoke previously proven.

Goal:

```txt
local SDE topology
-> BFS radius scope
-> scoped zKill discovery
-> capped ESI expansion
-> persisted evidence
```

Features meeting the goal:

- SDE JSONL topology import populates systems, constellations, regions, and stargate adjacency.
- BFS radius calculation is local, guarded, and cycle-safe.
- System radius planner produces scoped zKill requests and guardrail warnings.
- System radius collector dedupes refs, skips cached killmails, applies global expansion cap, and persists evidence.
- Radius reports query stored evidence by system scope and show collection provenance separately.

Verification:

- `verify:sde-fixture`
- `verify:radius`
- `verify:planner`
- `verify:collector`
- `verify:radius-report`

### Milestone 3: Observed Operators And Radius Evidence Readout

Status: Passed CLI/read-side proof.

Goal:

```txt
stored evidence in a system/radius
-> repeated pilots/corps/alliances
-> role mix
-> multi-system presence
-> scoped observation report
```

Features meeting the goal:

- System reports show stored killmail timeline, role split, ships, repeated entities, final blows, and warnings.
- Radius reports show included systems, geography counts, multi-system presence, observed operators, activity cadence, and timeline.
- Operator reports stay in the observation layer and avoid unsupported intent claims.
- Reports separate `Evidence Basis` from `Collection Provenance`.
- Manual discovery provenance tags can appear in observation reports without changing the evidence scope.

Verification:

- `verify:reports`
- `verify:operators`
- `verify:radius-report`
- `verify:manual-discovery`

### Milestone 4: Actor Watch And Actor Observation

Status: Passed CLI/read-side proof.

Goal:

```txt
typed actor identity
-> actor zKill route
-> staged discovery queue
-> capped ESI expansion
-> actor observation report
```

Features meeting the goal:

- Typed actor name resolution supports character, corporation, and alliance workflows.
- Actor watch planner and collector use actor-specific zKill routes.
- Actor watch collection stages refs, skips cached killmails, applies expansion caps, and records queue status.
- Actor reports show evidence window, actor role split, observed systems, ships, event-time corp/alliance context, activity cadence, final blows, timeline, and provenance.
- Actor metadata readiness and scoped hydration exist for report readability.

Verification:

- `verify:actor-resolution`
- `verify:actor-watch`
- `verify:actor-report`
- `verify:actor-metadata`

### Corporation Observation Slice

Status: Passed controlled CLI proof.

Goal:

```txt
corporation evidence scope
-> event-time member rows
-> counterpart corps/alliances
-> ships, systems, cadence, timeline
```

Features meeting the goal:

- Corporation observation report derives from stored `activity_events`.
- Report shows event-time member pilots, role split, systems, regions, final blows, ships, cadence, counterpart corporations, counterpart alliances, and recent timeline.
- Corporation metadata readiness identifies missing member, counterpart, geography, and type labels.
- Hydration is report-scoped and uses metadata runs rather than fetch runs.

Verification:

- `verify:corporation-report`
- `verify:corporation-metadata`

### Discovery Queue And Manual Discovery Lane

Status: Passed CLI proof.

Goal:

```txt
user-led zKill discovery
-> queue possible evidence
-> no ESI expansion
-> explicit expansion later
```

Features meeting the goal:

- Discovery queue persists refs, scope, status, priority, provenance, and optional at-a-glance preview.
- Queue report labels refs as staging/provenance metadata, not evidence.
- Queue preflight distinguishes pending queue draining from new discovery.
- Manual discovery scopes use `manual_actor`, `manual_system`, and `manual_radius`.
- Manual discovery makes zero ESI calls and writes no killmails or activity events.
- Manual expansion explicitly expands selected queued refs through ESI and then writes evidence.

Verification:

- `verify:manual-discovery`
- `verify:queue-report`
- `verify:queue-preflight`

## Cross-Cutting Alignment

Aligned:

- IDs remain durable facts; names remain labels.
- Local SDE is the source for static topology and inventory/type labels.
- Reports derive observations from expanded killmails and normalized events.
- zKill preview data is non-evidence and used only for user-led inspection.
- Collection provenance is visible but does not define observation scope.
- Live calls remain explicit-gated in live scripts.

Still intentionally deferred:

- UI and presentation surface.
- AI commentary.
- Retention/deprecation rules for queue preview metadata.
- Region/constellation observation reports beyond lookup support.
- Full corporation live bulk strategy for larger corps.
- Rich manual discovery selection UI.

## Next Major Proof

Recommended next proof before UI:

```txt
controlled internal bulk testing
-> routine actor watch
-> manual discovery and manual expansion
-> corporation observation
-> radius observation
-> metadata readiness
-> provenance/evidence audit review
```

The goal is not more breadth yet. The goal is confidence that each lane produces clean records, clear provenance, and trustworthy observation work products under repeated use.

## Verification Run For This Audit

Executed offline:

- `npm.cmd run verify:fixture`
- `npm.cmd run verify:idempotent`
- `npm.cmd run verify:sde-fixture`
- `npm.cmd run verify:radius`
- `npm.cmd run verify:planner`
- `npm.cmd run verify:collector`
- `npm.cmd run verify:actor-watch`
- `npm.cmd run verify:manual-discovery`
- `npm.cmd run verify:reports`
- `npm.cmd run verify:operators`
- `npm.cmd run verify:radius-report`
- `npm.cmd run verify:corporation-report`
- `npm.cmd run verify:actor-report`
- `npm.cmd run verify:queue-report`
- `npm.cmd run verify:queue-preflight`
- `npm.cmd run verify:migrations`

All listed checks passed on 2026-05-22.
