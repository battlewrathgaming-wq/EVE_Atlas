# DataAnalystHS151 - Data Intent And Supporting Schemas

Status: advisory capture
Role: Atlas Data Analyst / Data Engineer
Date: 2026-06-01

## Request Received

Human asked for a persisted advisory artifact, kept separate from active Overseer/Dev work, to capture data intent and supporting schema concepts for later implementation planning.

This note is preparatory. It does not update `workspace/current.md`, open Dev work, authorize schema changes, or override accepted Atlas terminology.

## End-Case Goal

Atlas is a local-first EVE intelligence workstation, not a zKill mirror.

The operator defines interest scopes, especially faction warfare systems, pilots, corporations, and alliances. Atlas then performs patient, provider-respectful acquisition and readability repair so the operator can return later to local evidence-backed observations:

- what Atlas has seen
- where it was seen
- when it was seen
- which IDs were involved
- which IDs have appeared before
- which Watch/R-scanner window or Evidence anchor supports the view

Atlas should present numbers, timestamps, IDs, labels, roles, counts, connections, evidence basis, and provenance. Tactical meaning such as "dangerous", "safe", "avoid", "engage", or "threat" belongs to Marked traces or Assessment Memory, not automatic Atlas Observation.

## Layer Model

### Discovery

zKill-style public provider results are Discovery leads only.

Facts already exist:

- `discovered_killmail_refs`
- `killmail_id`
- `killmail_hash`
- `discovered_by_type`
- `discovered_by_id`
- `source_scope`
- `source_system_id`
- `source_actor_type`
- `source_actor_id`
- `first_seen_run_id`
- `last_seen_run_id`
- `status`
- optional `preview_json`

Must never be treated as Evidence/EVEidence:

- zKill preview fields
- pending Discovery refs
- failed or unresolved refs
- public-provider summaries
- provider result counts that have not been ESI-expanded

### Evidence / EVEidence

ESI-expanded killmail payloads are the local Evidence anchor.

Facts already exist:

- `killmails.killmail_id`
- `killmails.killmail_hash`
- `killmails.killmail_time`
- `killmails.solar_system_id`
- `killmails.raw_esi_payload`
- `killmails.raw_payload_checksum`
- `killmails.source`
- `killmails.first_seen_at`
- `killmails.last_seen_at`
- `killmails.ingested_at`

Schema support already exists for:

- preserving the raw ESI payload
- checksum preservation
- rediscovery without overwriting existing payloads
- indexing by time and system/time

### Relationship / Appearance

Activity appearances are the current "block and string" layer.

Facts already exist:

- `activity_events`
- one event row per normalized role/entity appearance
- `killmail_id`
- `role`
- `entity_type`
- `entity_id`
- character/corporation/alliance context
- ship and weapon IDs
- final blow
- damage done
- solar system and time
- discovery route attribution

What can be computed from local records:

- system/time stories
- actor pivots
- corporation/alliance pivots
- repeated appearances
- seen-before highlights
- first/last observed
- attacker/victim role split
- observed final blows
- time-bucket activity
- common systems, ships, corporations, and alliances

This layer may duplicate readable labels for convenience, but numeric IDs remain the factual string.

### Hydration

Hydration repairs readability. It does not create Evidence/EVEidence and does not replace IDs as facts.

Facts already exist:

- `entities`
- `metadata_runs`
- local SDE lookup tables such as `solar_systems`, `regions`, `constellations`, `type_metadata`

Known intent:

- first look locally
- call ESI only when selected/report-visible interest or a future accepted policy asks for provider-backed label repair
- dedupe repeated label demand so many reports needing one ID produce one provider obligation

Supporting schema concept:

```text
hydration_candidates
- candidate_id
- entity_type
- entity_id
- dedupe_key
- requested_by_type
- requested_by_id
- source_anchor_type
- source_anchor_id
- priority
- status
- first_requested_at
- last_requested_at
- request_count
- not_before
- next_attempt_at
- attempt_count
- last_error
- resolved_at
```

This should remain a future schema concept until a dedicated Hydration queue runway is opened.

### Observation / Read Models

Observation is a reconstructed story from local anchors and relationship rows. It is not new truth.

Existing report support:

- `report.actor`
- `report.system`
- `report.radius`
- `report.run`
- `report.corpus_health`
- queue and metadata readiness reports

What can be computed from local records now:

- actor evidence reports
- system evidence reports
- radius / Watch-net style reports
- collection run diagnostics
- activity cadence
- observed final blows
- repeated pilots, corporations, and alliances
- local evidence counts and warning posture

Derived caches may later improve speed, but they are disposable product read models, not authority.

Possible future disposable read models:

```text
identity_profile_cache
system_activity_cache
watch_story_cache
seen_before_index
```

Cache rule:

Every cached summary must be rebuildable from Evidence/EVEidence anchors, Watch/R-scanner provenance, local relationship rows, or explicit Assessment Memory.

### Assessment Memory

Assessment Memory is human-authored judgment, not Evidence/EVEidence.

Facts already exist:

- `assessment_artifacts`
- entity anchor fields
- report source fields
- evidence window fields
- source run IDs
- sample killmail IDs
- citation status
- appearance counts and observed systems/regions/ships snapshots

Working intent:

- assessments are anchored to an ID
- assessments float into view when that ID appears
- assessments should not need to be recorded against every pair relationship
- pairwise meaning should only be introduced by a future explicit assessment type

## Patient Provider Work Packets

Human intent:

- provider movement should be patient
- packets may be staggered, paused, held, resumed, or allowed to hang
- Atlas must avoid catch-up flooding
- Atlas should be a good internet citizen, especially because ID hydration can fan out quickly

Potential bucket labels:

```text
zkill_discovery
esi_killmail_expansion
esi_id_hydration_selected
esi_id_hydration_background
esi_aggregate_gap_awareness
```

`esi_aggregate_gap_awareness` is parked/future. It would use ESI system/hour kill-count context as coverage awareness, not Evidence/EVEidence.

Supporting schema concept:

```text
provider_work_packets
- packet_id
- bucket
- dedupe_key
- scope_type
- scope_id
- payload_json
- priority
- status
- not_before
- next_attempt_at
- attempt_count
- last_attempt_at
- last_error
- created_at
- updated_at
```

Candidate statuses:

```text
pending
eligible
running
paused
held_by_external_io
waiting_provider
deferred_by_priority
completed
failed
cancelled
```

Example dedupe keys:

```text
zkill_discovery:system_radius:30000142:daily
esi_expansion:killmail:123456789
esi_hydration:character:90000001
esi_hydration:corporation:98000001
esi_hydration:alliance:99000001
```

## Volatile State

Volatile state should not be treated as durable story truth:

- active task IDs
- in-memory cancellation controllers
- session-armed Watch executor state
- current task locks
- last runtime tick/dispatch memory
- transient request state before durable logs or result rows exist

Recovery should explain state from durable traces when possible:

- Watch definitions
- `fetch_runs`
- `api_request_logs`
- `discovered_killmail_refs`
- `ingestion_audits`
- `killmails`
- `activity_events`
- metadata runs and warnings

## Required Data Boundaries

Must never be treated as Evidence/EVEidence:

- Discovery refs
- zKill previews
- hydration labels
- ID-to-name cache rows
- metadata runs
- provider work packets
- Watch recovery readouts
- runtime snapshots
- trace packs
- support logs
- corpus health/readiness reports
- derived caches
- automatic Observation summaries
- Assessment Memory
- future ESI aggregate system/hour kill counts

## Instruction Set Recommendation

For future agents working this area:

1. Preserve the trust ladder: Discovery -> ESI Evidence -> relationship rows -> Observation -> Assessment.
2. Treat IDs as facts and labels as readability.
3. Treat provider work packets as movement control, not truth.
4. Treat caches as disposable acceleration, not authority.
5. Do not introduce tactical assessment language outside Marked traces or Assessment Memory.
6. Do not create schema-backed queues or provider movement without a dedicated runway.
7. When in doubt, ask whether a story can be retold from EVEidence anchors or Watch/R-scanner provenance.
