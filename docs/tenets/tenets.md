# AURA Atlas Tenets

Status: Active
Date: 2026-05-21

AURA Atlas is an evidence-driven intelligence system, not a UI-driven dashboard.

The UI exists to present, slice, filter, inspect, correlate, and explain stored evidence. It must not become the place where intelligence facts are invented, mutated, or made authoritative.

## 1. Evidence First

The durable source of truth is the expanded ESI killmail.

```txt
zKill discovery
-> ESI expanded killmail
-> stored evidence
-> normalized events
-> derived reports
```

zKillboard is discovery only. zKill may provide `killmail_id` and `zkb.hash`, but tactical truth comes from expanded ESI killmails.

Store expanded ESI killmails once. Recompute everything else from them.

## 2. Immutable Evidence Layer

Expanded ESI killmails should be treated as immutable evidence records.

Corrections, enrichments, annotations, dispositions, and derived intelligence layer on top of evidence rather than mutating the original evidence object.

## 3. IDs Are Facts, Names Are Labels

Evidence records preserve original numeric IDs:

- `killmail_id`
- `character_id`
- `corporation_id`
- `alliance_id`
- `ship_type_id`
- `weapon_type_id`
- `solar_system_id`

Names are cached display metadata. They improve readability but do not replace IDs.

Reports may show:

```txt
Armageddon [typeID: 643]
ZTS-4D [solarSystemID: 30004660]
The Initiative. [allianceID: 1900696668]
```

The ID remains the fact. The name is presentation.

## 4. UI Is Presentation, Not Authority

The interface should behave like a set of slicers over stored evidence:

- system
- radius
- actor
- corporation/alliance
- time window
- attacker/victim role
- geography
- disposition
- ship/group/category

The UI may filter, summarize, correlate, visualize, and explain. It must not mutate evidence meaning.

## 5. Observation Is Not Interpretation

Observed behavior is not intent.

Repeated appearances are observations. Claims such as staging, ownership, coalition behavior, hunting pattern, or home region must remain clearly labeled as analysis or commentary unless supported by explicit evidence and wording.

## 6. Work Products Have Layers

AURA Atlas work products should be understood in three layers:

```txt
Evidence Layer
-> Observation Layer
-> Assessment Layer
```

The product may be an intelligence product overall, but not every artifact should be called intelligence.

### Evidence Layer

Question:

```txt
What stored evidence do we have?
```

Appropriate terms:

- evidence
- expanded killmail
- activity event
- evidence scope
- collection provenance
- evidence report
- partial sample
- stored evidence

Current examples:

- `killmails`
- `activity_events`
- run reports
- system evidence reports
- radius evidence reports

### Observation Layer

Question:

```txt
What patterns are visible in the evidence?
```

Appropriate terms:

- observation
- observed operator
- repeated appearance
- repeated presence
- multi-system presence
- candidate signal
- role mix
- timeline
- pattern
- observation report

Current examples:

- observed operator reports
- repeated attacker/corp/alliance appearances
- multi-system presence in a radius watch

### Assessment Layer

Question:

```txt
What do we think this means, and what should we remember or act on?
```

Appropriate terms:

- assessment
- interest
- priority
- impact
- confidence
- interpretation
- recommendation
- hot/warm/cold trail
- watchlist promotion
- assessment artifact

Current/future examples:

- entity interest artifacts
- watchlist promotion reasoning
- analyst notes
- confidence-bearing recommendations

### Terminology Rule

Use the most precise layer-specific term available.

Prefer:

- evidence report
- observation report
- assessment artifact

Avoid calling every artifact an intelligence report.

## 7. Collection Provenance Is Not Evidence Scope

Evidence scope drives intelligence reports. Collection provenance explains how evidence entered the corpus.

Evidence and observation reports should usually be scoped by what the evidence describes:

- system + time
- radius + time
- actor + time
- region + time

Collection metadata is provenance:

- `run_id`
- discovery route
- collection timestamp
- API counts
- warnings
- capped/partial status

Use run reports to answer: what happened during this collection run?

Use evidence reports to answer: what stored evidence exists for this scope?

Use observation reports to answer: what patterns are visible in this scoped evidence?

Evidence and observation reports should query matching stored evidence by IDs, geography, actor, role, and time window. They should not require the evidence to have been discovered by a particular collection method unless the report is explicitly about that collection method.

## 8. Scope And Sample Size Must Be Explicit

Every report must explain what it is based on:

- evidence window
- systems/actors included
- stored killmail count
- activity event count
- discovered refs when relevant
- expanded sample count
- partial/complete status
- source statement

Reports must not sound more certain than the evidence allows.

## 9. Collection Is Incomplete By Default

Collection coverage is probabilistic, not complete.

Absence of evidence is not evidence of absence. Reports should assume polling gaps, zKill visibility limits, ESI failures, rate limits, and collection caps unless explicitly proven otherwise.

## 10. Derived Work Products Must Be Rebuildable

Actor timelines, heatmaps, rankings, footprints, relationship views, and operator summaries must be derived from stored evidence.

Derived data may be cached, indexed, accelerated, or summarized, but it must remain rebuildable.

## 11. Disposition Filters Do Not Delete Evidence

Whitelist, friendly, hostile, neutral, and ignored statuses affect presentation, ranking, filtering, and alerting.

They must not prevent ingestion, erase evidence, or mutate stored records.

## 12. AI Is Commentary, Not Evidence

AI may summarize, narrate, explain, correlate, or assist interpretation.

AI may not become the evidence source, authoritative fact, or hidden transformation logic.

## 13. Respectful API Use

AURA Atlas is a slow-burn intelligence system, not a high-speed scraper.

External API behavior must remain conservative, scoped, observable, and rate-aware:

- zKill only for discovery refs
- ESI expansion only for uncached killmails
- dedupe before expansion
- cap refs and expansions
- use clear User-Agent
- retry/backoff respectfully
- log API counts and warnings
- prefer local SDE metadata over live calls where possible

Repeated small observations over time are preferable to aggressive broad collection.

## 14. Topology Is Lookup Metadata

SDE geography and type data are lookup/reference metadata, not intelligence evidence.

Use SDE for systems, constellations, regions, stargate adjacency, ship/type names, group metadata, and category metadata.

Activity facts still come from expanded killmails.

## 15. Product Identity

AURA-7 is the tactical viewport.

AURA Atlas is the persistent evidence map.

```txt
AURA-7 observes now.
AURA Atlas remembers, scopes, correlates, and explains.
```

The HUD answers: what is happening now?

Atlas answers: what patterns emerge over time?
