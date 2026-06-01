# DataAnalystHS152 - Current Gaps And Milestone Slices

Status: advisory capture
Role: Atlas Data Analyst / Data Engineer
Date: 2026-06-01

## Request Received

Human asked for a second artifact around current gaps, with milestone-sized splits and optional instruction sets. The requested classification frame was:

- what facts already exist
- what is only inferred
- what is missing
- what is volatile
- what needs schema support
- what can be computed from local records
- what must never be treated as Evidence/EVEidence

This note is advisory preparation only. It does not modify the active Dev runway or open work.

## High-Level Finding

Atlas already has the core evidence model for operator story reconstruction:

```text
Discovery refs
-> ESI-expanded killmail Evidence
-> normalized activity_events
-> reports/readouts
```

The largest gaps are not basic Evidence storage. They are:

- patient provider packet schema and lane ownership
- durable hydration candidate/backlog semantics
- named Watch-result / Watch-net story read model
- seen-before highlight basis
- clear support material for public-lead incompleteness and observed-not-complete language
- future pruning/retention intelligence model

## Existing Facts

### Storage And Evidence

Already present:

- `killmails`
- `activity_events`
- `discovered_killmail_refs`
- `fetch_runs`
- `api_request_logs`
- `ingestion_audits`
- `data_quality_warnings`
- `entities`
- local SDE lookup tables
- `metadata_runs`
- `assessment_artifacts`

Existing indexes already support important pivots:

- `killmails(solar_system_id, killmail_time)`
- `activity_events(entity_type, entity_id, killmail_time)`
- `activity_events(solar_system_id, killmail_time)`
- `activity_events(corporation_id, killmail_time)`
- `activity_events(alliance_id, killmail_time)`
- `activity_events(killmail_id, role)`

### Report/Observation Surfaces

Already present:

- system report with timeline, repeated entities, cadence, final blows, ships, provenance, and warnings
- actor report with systems, ships, event-time corporations/alliances, cadence, final blows, timeline, provenance, and warnings
- radius report with multi-system presence, system grouping, cadence, final blows, timeline, provenance, and interpretation warnings
- run report with per-run provider calls, queue state, expanded sample, systems scanned, timeline, and warnings
- `Watch_offline` readout for restart/recovery posture

### Accepted Read-Only Proofs

Relevant accepted proof direction:

- Hydration backlog preview is read-only, not a persisted queue.
- Hydration execution policy preview is read-only, not provider movement or writes.
- External I/O off should hold provider-backed movement, not fail it.
- Release from held state must not catch-up flood.
- Future provider queues/sequencing need proof before broad persistence.

## Only Inferred

These are product/data-shape inferences from discussion and current repo structure, not accepted implementation doctrine:

- `watch_results` is currently an operator/read-model concept, not a durable table.
- Watch-net story can be reconstructed from Watch definitions, fetch runs, API logs, Discovery refs, ingestion audits, Evidence, and activity events.
- Patient packets should become the shared movement layer if pause/hang/stagger behavior is required across lanes.
- Hydration needs the strongest durable candidate queue because ID fanout can grow faster than acquisition.
- Derived caches should be disposable acceleration, not source truth.
- Pruning is an intelligence function, not just cleanup.

## Missing Or Not Yet Durable

### Patient Provider Packet Layer

Missing:

- one durable schema concept for pauseable provider work packets
- shared status language for held, paused, waiting, deferred, and completed provider work
- dedupe keys across provider lanes
- explicit packet bucket labels
- packet readout that recovery can consume

Needs schema support later:

```text
provider_work_packets
```

Potential milestone:

```text
Patient Packet Schema Preview
```

### Hydration Candidate Queue

Missing:

- durable deduped unresolved-ID demand
- selected-interest versus background priority
- one-ID-many-report coalescing
- provider wait/backoff state per ID
- queue visibility without forcing provider calls

Needs schema support later:

```text
hydration_candidates
```

Potential milestone:

```text
Hydration Candidate Queue Design / Read-Only Preview
```

### Watch-Net Story Read Model

Missing:

- named Watch result/story concept
- explicit grouping by system inside multi-system Watch scope
- per-Watch-run story reconstruction contract
- clear split between local system story and Watch-net story

Can be computed from local records:

- Watch scope from `system_watches`
- run lineage from `fetch_runs`
- provider routes from `api_request_logs`
- refs from `discovered_killmail_refs`
- expanded Evidence from `ingestion_audits` and `killmails`
- participants from `activity_events`

Potential milestone:

```text
Watch-Net Story Read Model
```

### Seen-Before Highlight Basis

Missing:

- stable rule for when an ID is "seen before"
- distinction between first appearance in current view and prior local-corpus appearance
- whether Marked state should alter display order but not meaning
- compact basis fields for UI/readout consumption

Can be computed from local records:

- count of appearances before current anchor/window
- first/last observed
- systems observed
- role split
- matching Assessment Memory anchors

Potential milestone:

```text
Seen-Before Highlight Basis Preview
```

### Support Material For Operator Trust

Missing:

- compact explanation that Atlas observes public-lead-derived Evidence, not all activity
- support language for FIFO/limited public provider sampling
- support distinction between Discovery, Evidence, Hydration, Observation, Marked, and Assessment
- warning vocabulary that avoids tactical assessment

Potential milestone:

```text
Operator Evidence Basis Support Material
```

### Pruning As Intelligence

Missing:

- read-only pruning relationship preview shaped around intelligence usefulness
- stale evidence windows as operator context
- Marked/Assessment impact display
- Discovery ref pruning separate from Evidence pruning
- support artifact/snapshot disclosure connection

Needs future bounded design before destructive behavior.

Potential milestone:

```text
Pruning Intelligence Preview
```

## Volatile Areas

Do not build durable story claims from:

- in-memory Watch executor arming
- active task ID
- cancellation controllers
- current scheduler tick memory
- request state before durable API logs/result rows
- temporary verifier fixtures
- renderer-local display state

Recovery/readout may mention volatile state if explicitly labelled as volatile.

## What Can Be Computed From Local Records

Without new truth tables, Atlas can compute:

- system/time activity windows from `killmails` and `activity_events`
- actor/corp/alliance appearances from `activity_events`
- Watch-net observations from Watch rows plus run/provenance/evidence tables
- seen-before counts from indexed appearance rows
- first/last observed per ID
- observed time buckets
- role mix
- observed final blows
- common systems and ships
- source run IDs for a story
- unresolved label candidates from local Evidence-derived rows
- local SDE lookup gaps
- provider-needed label groups

## What Needs Schema Support

Recommended future schema-backed concepts:

1. `provider_work_packets`
   Pauseable, deduped, patient movement units across provider lanes.

2. `hydration_candidates`
   Deduped unresolved ID demand with selected/background priority.

3. Optional disposable caches
   Only after read-time cost is measured:
   - `identity_profile_cache`
   - `system_activity_cache`
   - `watch_story_cache`
   - `seen_before_index`

4. Future pruning preview support
   Prefer read-only preview first; do not implement destructive pruning from this advisory note.

## Must Never Be Treated As Evidence/EVEidence

- zKill Discovery refs
- zKill preview JSON
- public-provider summaries
- pending queue rows
- failed unresolved refs
- API request logs
- fetch run summaries
- Watch schedules
- Watch recovery/readout state
- provider work packets
- hydration candidates
- hydrated names/labels
- metadata runs
- local SDE labels
- Observation read models
- derived caches
- seen-before highlights
- corpus health/support reports
- runtime snapshots
- trace packs
- pruning previews
- Assessment Memory
- future ESI aggregate system/hour kill-count snapshots

## Milestone Slice Recommendations

### Slice 1 - Data Intent Support Note

Goal:

Create durable non-code support material that explains Atlas data layers and operator language boundaries.

Instruction set:

```text
Write a support note explaining Discovery, Evidence/EVEidence, Hydration, Observation, Marked, and Assessment Memory for Atlas operator-story reconstruction. Include public-lead incompleteness, observed-not-complete language, and the rule that labels/read models are not Evidence. Do not change schema or code.
```

Acceptance checks:

- avoids tactical assessment language
- preserves Atlas-owned terms
- states zKill is Discovery only
- states ESI-expanded killmail is Evidence/EVEidence
- states Hydration repairs readability only

### Slice 2 - Patient Packet Read-Only Schema Preview

Goal:

Design a read-only schema/contract preview for patient provider work packets without implementing dispatch.

Instruction set:

```text
Inspect existing fetch_runs, api_request_logs, discovered_killmail_refs, metadata_runs, Watch readouts, External I/O state, and composed gate previews. Propose a provider_work_packets schema and readout contract for zkill_discovery, esi_killmail_expansion, esi_id_hydration_selected, and esi_id_hydration_background. Do not create schema migrations, provider calls, dispatch changes, or runtime enforcement.
```

Acceptance checks:

- supports pause/hang/stagger semantics
- includes dedupe keys
- distinguishes packet movement from Evidence/EVEidence
- represents held_by_external_io without failure
- avoids catch-up flood assumptions

### Slice 3 - Hydration Candidate Queue Preview

Goal:

Prove the shape of deduped ID hydration demand before writes/provider calls.

Instruction set:

```text
Using local activity_events, entities, metadata_runs, and SDE lookup tables, build a read-only preview of hydration_candidates grouped by selected/report-visible, Watch/background, target/report-scoped, and corpus hygiene lanes. Include dedupe keys, source anchors, representative IDs, known-local status, provider-needed status, and priority rationale. Do not persist a queue, call ESI, patch labels, write metadata_runs, or change schema.
```

Acceptance checks:

- one ID appears once per dedupe key even if many reports need it
- selected/report-visible candidates are not starved behind background candidates
- labels remain readability, not facts
- provider-needed labels are not Evidence/EVEidence work

### Slice 4 - Watch-Net Story Read Model

Goal:

Define the operator read model for Watch results without creating a `watch_results` truth table.

Instruction set:

```text
Trace a Watch/R-scanner run from system_watches/watchlist_entities through fetch_runs, api_request_logs, discovered_killmail_refs, ingestion_audits, killmails, and activity_events. Define a read-only Watch-net story response grouped by system, with unresolved leads, verified Evidence, repeated IDs, time buckets, and provenance. Keep system stories separate inside the Watch-net story.
```

Acceptance checks:

- does not flatten multiple systems into one false local story
- distinguishes unresolved Discovery refs from verified Evidence
- states observed/local-corpus basis
- can degrade gracefully when only one Evidence anchor exists

### Slice 5 - Seen-Before Highlight Basis

Goal:

Define neutral highlight rules.

Instruction set:

```text
Define a read-only seen-before basis for IDs appearing in a killmail, system story, actor report, or Watch-net story. Use local activity_events and assessment_artifacts only. Return counts, first/last observed, systems seen, role mix, Marked/Assessment presence where available, and evidence basis. Avoid tactical labels such as dangerous, safe, threat, or engage.
```

Acceptance checks:

- "seen" means local evidence appearance, not tactical judgment
- Marked and Assessment are distinct from Observation
- no provider calls
- no Assessment creation
- no Evidence mutation

### Slice 6 - Pruning Intelligence Preview

Goal:

Frame pruning as intelligence selection, not mere cleanup, before any destructive work.

Instruction set:

```text
Build a read-only pruning intelligence preview that groups stale/no-interest local records by time window, entity ID, Watch scope, and story impact. Show affected Evidence/EVEidence, Discovery refs, Assessment Memory references, snapshots/support-artifact disclosure needs, and storage budget posture. Do not delete, prune, move, compact, or mutate records.
```

Acceptance checks:

- deletion/pruning remains preview only
- Assessment Memory is not a deletion blocker
- snapshots/support artifacts are disclosed separately
- stale truth is distinguished from falsehood

## Recommended Order

1. Data intent support note.
2. Patient packet read-only schema preview.
3. Hydration candidate queue preview.
4. Watch-net story read model.
5. Seen-before highlight basis.
6. Pruning intelligence preview.

Reasoning:

The support note stabilizes language first. Patient packets then create the movement vocabulary. Hydration queue preview handles the largest provider-pressure risk. Watch-net and seen-before views then shape operator usefulness. Pruning should follow once story and interest basis are clearer.
