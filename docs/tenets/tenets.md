# AURA Atlas Tenets

Status: Active
Updated: 2026-05-23

These are the rules Atlas should not violate while implementation changes.

## 1. Atlas Is Evidence Memory

Atlas answers:

```text
What stored evidence do we have?
What observations can be derived from it?
What assessment should the operator deliberately remember?
```

It does not answer immediate HUD questions. That belongs to AURA-Sense.

## 2. zKill Is Discovery Only

zKillboard may provide scoped references:

```text
killmail_id
zkb.hash
```

zKill summaries are not tactical truth and are not stored as evidence.

## 3. Expanded ESI Killmails Are Evidence

The durable evidence record is the expanded ESI killmail.

```text
zKill ref
-> selected ESI expansion
-> killmails.raw_esi_payload
-> normalized activity_events
-> reports
```

Store expanded ESI killmails once. Do not replace raw evidence with display labels, zKill summaries, assessment text, or UI state.

## 4. IDs Are Facts; Names Are Labels

The fact is the numeric ID:

- `killmail_id`
- `character_id`
- `corporation_id`
- `alliance_id`
- `ship_type_id`
- `weapon_type_id`
- `solar_system_id`

Names improve readability. They are cached labels and may be stale or unresolved.

Reports should prefer labels that keep IDs visible, such as:

```text
ZTS-4D [solarSystemID: 30004660]
Armageddon [typeID: 643]
The Initiative. [allianceID: 1900696668]
```

## 5. SDE Source Is Not Runtime Data

The SDE zip is source material only.

Runtime reports use imported SQLite lookup tables:

- `regions`
- `constellations`
- `solar_systems`
- `system_adjacency`
- `type_metadata`
- `ship_types`

Reports must not download, parse, or depend on SDE zip files.

## 6. Work Products Have Layers

Atlas uses three product layers.

### Evidence

Question:

```text
What stored facts exist?
```

Examples:

- expanded killmail
- activity event
- evidence scope
- run provenance

### Observation

Question:

```text
What visible pattern exists in the evidence?
```

Examples:

- repeated appearance
- role mix
- multi-system presence
- timeline
- candidate operator signal

### Assessment

Question:

```text
What does the operator deliberately judge or remember?
```

Examples:

- interest score
- assessment artifact
- watchlist promotion reason
- hot/warm/cold trail

Use the precise layer term. Do not call every artifact an intelligence report.

## 7. UI Is Presentation, Not Authority

The UI is a set of controls over backend-owned evidence and reports.

The renderer may:

- request validated scopes
- start explicit service actions
- present reports
- show queue/watch/readiness state
- create deliberate assessment artifacts through service calls

The renderer must not:

- parse logs
- call zKill or ESI directly
- compute evidence truth
- mutate raw evidence
- invent observations from UI-only state

## 8. Collection Provenance Is Not Evidence Scope

Collection provenance explains how data entered Atlas:

- run ID
- route
- API counts
- timestamps
- warnings
- caps

Evidence scope explains what the report is about:

- actor
- system
- radius
- corporation/alliance
- time window

Observation reports should filter by evidence scope, not by the collection method, unless the report is explicitly a run report.

## 9. Scope And Sample Size Must Be Visible

Reports must expose:

- scope
- time window
- stored killmail count
- activity event count
- sample/cap status
- unresolved metadata
- warnings where relevant

Absence of evidence is not evidence of absence.

## 10. Derived Products Must Be Rebuildable

Reports, timelines, operator lists, footprints, rankings, and summaries are derived from stored evidence and metadata.

They may be cached or indexed for performance, but the source of truth remains the evidence layer.

## 11. Assessments Are Deliberate

Assessment artifacts are operator memory.

They may cite evidence, carry score/reason fields, and survive future retention decisions. They do not replace evidence and should not be created automatically for every observed entity.

## 12. Dispositions Filter Presentation

Friendly, hostile, ignored, watched, or whitelisted labels may affect display, priority, and alerting.

They must not erase evidence or block ingestion by themselves.

## 13. Live API Use Is Respectful And Explicit

External calls must remain:

- scoped
- gated
- capped
- logged
- retry/backoff aware
- conservative

Discovery-only work should stay discovery-only. Expansion through ESI is a separate explicit evidence-creating step.

## 14. Passive Surfaces Stay Passive

Readiness, corpus health, queue preview, watch schedule, reports, snapshot preflight, and debug trace packs must not start hidden collection or mutate evidence.

If a surface writes a support artifact, that write must be explicit and documented.

## 15. Atlas And Sense Stay Separate

```text
AURA-Sense observes now.
AURA Atlas remembers evidence and assessments later.
```

Do not move tactical HUD behavior into Atlas. Do not move Atlas evidence persistence into Sense without an explicit future ADR.
