# Feature: Presentation Layer Information Index

Status: Advisory foundation
Updated: 2026-05-24

## Purpose

AURA Atlas collects, stores, derives, and tags many kinds of information.

This document explains, in plain terms, what each information family is trying to represent and why it needs a presentation layer. It is meant to help future UI/UX, Planner, Overseer, and Dev work decide what belongs on the primary operator path, what belongs in secondary detail drawers, and what should remain internal.

This document is not a Dev runway. It does not add new data collection, persistence semantics, or product authority.

## Presentation Principle

Atlas should present information by human meaning before backend structure.

The main operator path is:

```txt
Discovery -> Evidence -> Observation -> Assessment
```

Supporting attention state:

```txt
Marked = operator interest / tag / record attention
Watch = active routine check behavior
```

Use the lowest precise layer that fits. If something is only a lead, call it a lead. If something is stored ESI evidence, call it evidence. If something is a rendered pattern, call it an observation. If a human assigns meaning, call it assessment memory.

## Presentation Layer Index

| Information | Plain meaning | What it represents | Why present it | Primary presentation | Detail / drawer presentation | Must not imply |
| --- | --- | --- | --- | --- | --- | --- |
| Lead input | The thing the operator wants to investigate. | A user-entered actor, corporation, alliance, system, radius, or future accepted lead type. | Starts the investigation in human terms: "Who is that?" or "What is happening there?" | Investigation Desk lead field, lead type, scope feedback. | Normalized scope, resolver limits, durable IDs. | That typing a lead starts collection, creates evidence, or proves identity. |
| Marked | The operator wants Atlas to keep attention on this thing. | Interest/tag/record attention. | Gives the operator a lightweight way to remember relevance without starting work. | Marked badge/card/state on relevant actor, org, system, or future record. | Source of mark, notes, timestamps, related assessment. | Active scanning, evidence, hostility, affiliation, staging, or intent. |
| Watch | Atlas has an active routine check configuration. | A bounded actor/system/radius check with cadence, lookback, caps, gates, and run state. | Shows whether Atlas can check a target or area again and why it may be blocked. | Watch card/status with blocked/unblocked, last checked, next eligible check, live/API gate. | Lookback, poll cadence, radius, caps, backoff, session armed state, task/run IDs. | That the target is online, present now, hostile, staged, or owned by anyone. |
| Live/API state | Whether live providers may be called. | Explicit session/environment permission plus gate/refusal rules. | Lets the operator know whether discovery, enrichment, and hydration can happen. | Compact global state pill/control and action preflight status. | Provider estimates, gate blockers, refusal reason, environment variables. | Background collection or unlimited provider access. |
| Discovery | A first sighting or possible lead. | zKill refs or other accepted lead context before evidence expansion. | Helps the operator decide what is worth enriching. | "Possible leads" list, discovery review, source/scope summary. | Discovery queue keys, discovered_by fields, source scope, run provenance. | Evidence, observation, activity counts, tactical conclusions, or intelligence. |
| At-a-glance preview | Lightweight discovery context beside a queued ref. | zKill preview fields and already-local labels that help choose whether to enrich. | Gives enough context to select refs without pretending they are evidence. | Compact preview: time, system, victim ship, attackers, value when available. | Raw preview JSON, missing-label placeholders, zKill source detail. | Proof, observation, stored killmail evidence, or live metadata lookup requirement. |
| Queue selection | Which discovered refs are available for enrichment. | Pending/cached/failed/superseded ref state under a scope and cap. | Lets the operator review before spending ESI calls. | Queue / Enrich panel with selected count, expected ESI calls, selectable refs. | Exact killmail IDs, hashes, status, skip reasons, priority, discovery filter. | That queued refs are already evidence or that enrichment will happen automatically. |
| Enrichment / ESI expansion | Turning selected refs into stored evidence. | Explicit ESI calls that fetch expanded killmails and create activity events. | Shows the operator the moment possible leads become authoritative evidence. | "Enrich selected" action with preflight: calls, writes, caps, selected refs, evidence effect. | Task ID, provider endpoints, run IDs, selected IDs, result/error payload. | Metadata hydration, automatic collection, or interpretation. |
| Expanded killmail | The stored factual killmail source. | Authoritative ESI killmail payload with hash/checksum/source/time/system. | Gives reports and assessments something traceable to point back to. | Evidence count, sample status, cited killmail IDs when relevant. | Raw ESI payload, checksum, killmail hash, ingestion timestamps. | A complete story by itself, intent, affiliation, ownership, staging, or current location. |
| Activity event | One observed appearance in a killmail. | Actor/org role, ship, system, time, and related IDs derived from expanded evidence. | Makes evidence searchable and renderable as timelines, role splits, systems, ships, and repeated presence. | Observation rows, battle timeline entries, actor role summaries, system presence. | Event keys, normalizer version, raw IDs, cached labels, discovery provenance. | Conclusion, motive, command relationship, or hostility. |
| Metadata labels | Readable names for IDs. | Ship, system, region, corporation, alliance, character, and type labels. | Makes evidence understandable without replacing IDs. | Human-readable labels beside durable IDs when useful. | Source, freshness, last enriched/imported, unresolved IDs. | That labels are the fact; IDs remain the stable facts. |
| SDE topology and inventory | Local static EVE lookup data. | Systems, regions, constellations, adjacency, ship/type metadata. | Enables system/radius planning and readable ship/system labels without live calls. | Readiness state, radius/blast context, system footprint labels. | Build number, import timestamp, counts, source provenance. | Live evidence, current activity, or ownership. |
| Metadata hydration | Refreshing labels for readability. | Metadata-only ESI name resolution or local label patching. | Improves readability of reports and candidate IDs. | "Refresh labels" or hydration preflight/status near reports. | Candidate IDs, expected ESI name calls, metadata run stats. | Evidence enrichment, killmail mutation, activity evidence, or assessment. |
| Evidence basis | What stored evidence supports the view. | Scope, sample status, evidence window, killmail count, activity event count, source. | Gives the operator confidence boundaries before reading observations. | Prominent report/story header. | Full scope object, raw IDs, provenance lines. | Complete coverage or certainty beyond the sample. |
| Collection provenance | How the evidence or refs arrived. | Trigger, run, provider counts, queue scope, discovery/expansion path. | Explains traceability and helps diagnose confusing results. | Short provenance summary and warning badges. | Run IDs, API logs, task IDs, exact provider counts. | Product conclusions or evidence by itself. |
| Observation | A rendered pattern from stored evidence. | Timeline, role split, repeated entities, ships, systems, regions, multi-system presence. | Creates the "what happened?" and "what pattern is visible?" layer. | Battle timeline, observation preview, relationship/footprint surfaces. | Section rows, filters, raw IDs, row counts, source report. | Proof of staging, residency, affiliation, ownership, command structure, or intent. |
| Battle timeline | Ordered combat story from evidence. | Who died, when, where, and who appeared as attacker/victim. | Provides the first operator "story" moment after enrichment. | Chronological timeline with killmail anchors and role labels. | Killmail IDs, exact timestamps, participant lists, raw event rows. | Fight clustering unless explicitly implemented, motive, or strategic meaning. |
| Relationship view | Evidence-backed connections among entities. | Co-appearance, repeated corporations/alliances, shared killmails, and local known labels. | Helps the operator see "this connects to that" without reading tables. | Relationship map/list with confidence and evidence count language. | Source killmail IDs, event rows, entity IDs, label freshness. | Formal affiliation, command relationship, blue/red status, or intent unless assessed. |
| System/radius footprint | Spatial pattern around a place. | Systems included by local topology plus observed evidence in that area. | Makes watch blast radius and area activity understandable. | Footprint panel/map-like list with center, radius, included systems, observed activity. | Topology source, included/excluded system IDs, route/radius details. | Staging, ownership, residency, sovereignty, or current presence. |
| Report | A scoped presentation over stored evidence. | Backend-owned evidence and observation sections for actor, corp, system, radius, queue, run, or corpus health. | Gives a reviewable product without renderer-side inference. | Report header, evidence basis, observations, warnings, text export. | Structured response, raw IDs, full text export. | That the renderer computed meaning or that report loading mutates evidence. |
| Warning / data quality signal | Something limits trust or completeness. | Missing labels, malformed evidence, partial samples, failed expansion, stale metadata, integrity issues. | Prevents the UI from sounding more certain than the data allows. | Warning badges/callouts near the affected view. | Warning group, run ID, killmail ID, technical message. | That the whole product is broken, unless the warning is actually blocking. |
| Assessment memory | Deliberate human/reviewed memory. | Reason, summary, optional scores, confidence, cited killmail IDs, citation status, evidence window. | Captures what the operator thinks should be remembered after reviewing evidence/observations. | Assessment card/form/detail with citation basis before save. | Artifact ID, full citation details, source report parameters, source run IDs. | Raw evidence, automatic intelligence, or proof beyond cited evidence. |
| Entity interest | A committed assessment that an entity matters. | Priority/interest/impact/confidence applied deliberately. | Helps separate entities merely seen from entities worth remembering. | Assessment/interest card or future record signal. | Scores, rationale, source evidence window, citation status. | Automatic marking for every observed entity, active watch, or evidence. |
| Runtime readiness | Whether local Atlas dependencies are prepared. | Paths, live gate state, SDE lookup readiness, user agent, backend messages. | Helps the operator know if local work can proceed. | Compact readiness/trust state and next local action. | Full path state, counts, backend messages, service inventory. | Evidence, observation, or assessment. |
| Corpus health | Operational health of the local database. | Counts, integrity checks, freshness, warning groups. | Shows whether the local corpus looks usable and reviewable. | Readiness/support panel with counts and warnings. | Table counts, freshness detail, grouped warnings, integrity rows. | Observation report, assessment, or tactical conclusion. |
| Task/run state | Backend work progress and result. | Queued/running/succeeded/failed/cancelled tasks, progress, warnings, result/error payload. | Gives feedback for long or gated work and supports recovery. | Compact toast/status and task list; selected detail on demand. | Full JSON payloads, progress events, cancellation reason. | Evidence or assessment unless task result explicitly wrote those through the proper service. |
| API request logs | Provider call evidence for operations. | zKill/ESI endpoint, status, duration, retry/rate-limit/error data. | Supports auditability, live-smoke review, and debugging. | Summary counts in preflight/run/provenance. | Full endpoint logs in trace/debug detail. | Raw evidence, operator conclusion, or proof of target behavior. |
| Runtime snapshot | Local file copy of the runtime DB. | Support/safety artifact for preserving current local state. | Gives the operator a way to preserve state before meaningful trials. | Snapshot preflight/create panel with file effect. | Paths, WAL/SHM state, size, table counts. | Restore, pruning, evidence compaction, or external backup policy. |
| Debug trace pack | Bounded support artifact. | Summaries of runs, tasks, warnings, queue/corpus/readiness, and smoke paths without broad raw evidence. | Helps review failures without dumping private evidence by default. | Support action with output path and included/excluded summary. | Artifact file list, generation timestamp, classification, exclusions. | Evidence export, assessment, or raw ESI dump. |

## Primary Vs Secondary Presentation

### Primary Operator Path

These should be designed for plain reading and fast scanning:

- lead input
- live/API state
- Marked state
- Watch status when relevant
- Discovery / possible leads
- Enrich selected preflight
- evidence basis
- observation/story surfaces
- assessment memory context
- warnings that affect trust

### Secondary Detail Areas

These should be available, but should not dominate the operator path:

- raw IDs
- hashes
- normalized JSON
- task payloads
- service count
- queue internals
- run IDs
- API request logs
- SDE import provenance
- schema/table names
- backend classifications

### Internal Or Backend-Led Terms

These may appear in detail drawers or developer/audit docs, but should be translated before appearing in the primary UI:

- watchlist row
- discovered_by_type / discovered_by_id
- assessment artifact
- metadata hydration
- raw ESI payload
- task classification
- scope normalized payload
- service registry

## Reasoning And Justification Rules

Each visible information family should answer:

1. What is this?
2. Where did it come from?
3. What can the operator do with it?
4. What does it not prove?
5. What action, if any, changes stored state?

For example:

```txt
Queued ref
-> discovered from zKill
-> useful for deciding whether to enrich
-> not evidence or observation
-> Enrich selected calls ESI and creates evidence
```

```txt
Activity event
-> derived from expanded ESI killmail evidence
-> useful for timeline, role, system, and relationship observations
-> not proof of intent or affiliation
-> does not change unless evidence is ingested or labels are refreshed
```

```txt
Assessment memory
-> saved deliberately by the operator from a loaded evidence context
-> useful as remembered judgment
-> not raw evidence
-> save requires reason/summary, confirmation, and citation context
```

## Copy Rules

- Say "possible lead" or "Discovery" before ESI expansion.
- Say "Evidence" only for expanded ESI killmails, derived activity events, and related audits.
- Say "Observation" for rendered patterns from stored evidence.
- Say "Assessment memory" for deliberate reviewed judgment.
- Say "Marked" for interest or attention.
- Say "Watch" only for active routine checking.
- Say "Refresh labels" when the operator intent is readability; keep "metadata hydration" in detail copy if needed.
- Pair "Enrich selected" with explicit detail that it calls ESI and creates stored expanded killmail evidence.
- Pair relationship and footprint views with evidence counts and "observed" language.
- Avoid proof words such as "owns", "stages", "belongs to", "is hostile", "is affiliated", or "intends" unless a deliberate assessment states that with cited basis.

## Open Presentation Questions

- Should the durable operator container be called Record?
- Should final reviewed output be called Intelligence, Finding, Assessment, or Assessment Memory?
- Should relationship and footprint surfaces be separate first, or visually adjacent under one story area?
- Should battle timeline stay strictly chronological first, or group into fights later?
- What threshold should promote a warning from detail to primary trust state?

## Related Docs

- `docs/roadmap/operator-investigation-desk.md`
- `docs/features/ui-trigger-and-scope-map.md`
- `docs/terms/work-products.md`
- `docs/terms/marked.md`
- `docs/terms/watchlist.md`
- `docs/terms/actor-watch.md`
- `docs/terms/system-radius-watch.md`
- `docs/terms/discovery-queue.md`
- `docs/terms/at-a-glance-preview.md`
- `docs/terms/evidence.md`
- `docs/terms/activity-event.md`
- `docs/terms/metadata.md`
- `docs/terms/entity-interest.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-report-products.md`
