# Overseer Heading: AURA Atlas

Status: Advisory heading report, not accepted project authority.
Date: 2026-05-24
Project: AURA Atlas
Role: Overseer
Artifact: `workspace\OverseerHeading-atlas-2026-05-24.md`

## 1. Project Heading

AURA Atlas is becoming a local-first EVE Online evidence workstation and operator investigation desk: it uses zKillboard as discovery only, expands selected killmails through ESI into stored evidence, renders observations from that evidence, and supports deliberate assessment memory without hidden live collection or renderer-owned meaning.

## 2. Current Project State

Atlas has closed the Aggressive Testing And Operator Bug Hunting milestone and is now active in the Operator Investigation Desk milestone.

The current active packet is HS26:

```txt
Current focus: assessment-memory ergonomics from loaded stored-evidence context
Expected output: DevHS26-operator-investigation-assessment-memory.md
```

Recent accepted work added:

- Investigation as the first renderer view
- actor/system/radius lead input
- Marked versus Watch boundary wording
- passive live/API context
- read-only stored-evidence detail from existing actor/radius report services
- Queue / Enrich context from read-only `queue.selection`
- `Enrich selected` wording for explicit ESI expansion into stored killmail evidence

The current packet asks Dev to improve Assessment Memory clarity from loaded stored-evidence actor context without accepting `Record`, `Intelligence`, or `Finding` terminology.

## 3. Owned Tool Function

Atlas owns the local evidence workstation function.

Its tool function is:

- discover possible killmail refs
- explicitly enrich selected refs through ESI
- store expanded ESI killmails as evidence
- derive activity events and structured reports
- present observations from stored evidence
- preserve deliberate assessment memory
- keep operator support artifacts bounded and reviewable

Atlas is not a passive collection engine, generic dashboard, shared presentation lab, or neutral bridge framework.

## 4. Owned User-Facing Semantics

Atlas owns these project-local meanings:

- Discovery: a lead or first sighting, not proof
- Evidence: authoritative expanded ESI killmail data and derived activity events/audits
- Observation: rendered pattern from stored evidence
- Assessment Memory: deliberate operator judgment over reviewed evidence context
- Marked: operator interest / tag / record attention
- Watch: active routine check behavior
- Enrich selected: user-facing action for explicit ESI expansion into stored killmail evidence
- Metadata hydration / Refresh labels: readability-only label work, not evidence creation
- Collection provenance: how evidence or refs arrived, not tactical meaning

These meanings are product doctrine for Atlas and should not be generalized without stripping the EVE/evidence semantics.

## 5. Shareable Structure Candidates

Atlas may contribute structure, not meaning, to shared Aura thinking:

- source / freshness / certainty slots
- primary summary plus secondary detail drawers
- action-effect copy that names calls, writes, gates, and non-effects
- explicit live-gate refusal language
- passive-view no-mutation rules
- loading, empty, stale, failed, partial, blocked, gated, and degraded states
- visual smoke evidence pattern: screenshots, result JSON, overflow checks, process cleanup
- fixture-backed operator-path verification
- must-not-imply copy rules

These are candidates only. Target projects must adopt them through their own authority.

## 6. Project-Local Terms That Must Not Be Generalized

Do not generalize these Atlas terms as shared Aura doctrine:

- zKillboard discovery
- ESI expansion
- expanded killmail evidence
- Discovery Queue
- Enrich selected
- activity event
- actor watch
- system/radius watch
- Marked as Atlas operator attention
- Assessment Memory as Atlas assessment artifact behavior
- evidence compaction
- live scoped zKill smoke
- corpus health as Atlas SQLite evidence-corpus readiness

Other projects may have analogous structure, but not the same meaning.

## 7. Expected Bridge / State / Error Classes That Might Become Neutral Constants Later

Potentially neutral state classes:

- loading
- empty
- populated
- stale
- failed
- partial
- unavailable
- degraded
- blocked
- unblocked
- gated
- ready
- warning
- running
- cancelled

Potentially neutral bridge slots:

- source labels
- freshness timestamp
- certainty statement
- action effect
- warning group
- missing field list
- expected calls
- expected writes
- non-effects
- primary summary
- detail drawer payload

Atlas-specific mappings should remain local even if the state names become neutral.

## 8. What Lab Can Safely Model

Lab can safely model fixture-backed presentation families based on Atlas-like shapes if the fixtures remain fake and non-authoritative.

Safe fixture candidates:

- Discovery lead card
- possible queued ref list
- Enrich selected preflight card
- evidence basis header
- observation preview
- assessment memory citation card
- Marked / Watch distinction example
- blocked/unblocked watch status example
- metadata/readability-only example
- relationship or footprint visual using evidence-count language

Lab should not create an Atlas adapter, claim adoption, use real Atlas DB data, or redefine Atlas semantics.

## 9. What Core Might Eventually Own

Core might eventually own neutral middleware or rigging such as:

- service registry shape
- task runner basics
- message taxonomy pattern
- bridge state envelope
- renderer-safe preload pattern
- visual smoke harness conventions
- source/freshness/certainty structural slots
- action-effect copy scaffolding
- long-text / constrained viewport test approach

Core should not absorb Atlas persistence, watch, report, evidence, or assessment semantics.

## 10. Current Cadence And Active Handoff Status

Repo state at heading read:

```txt
Repo root: F:\Projects\AURA-Atlas
Branch: main
Tree: clean
```

Active milestone:

```txt
Operator Investigation Desk
```

Current sequence:

```txt
HS26
```

Latest accepted handoff:

```txt
workspace\DevHS24-operator-investigation-queue-enrich-preflight.md
```

Latest Overseer review:

```txt
workspace\OverseerHS25-queue-enrich-review.md
```

Current active packet remains `workspace\current.md`. This heading report does not accept, redirect, or replace that packet.

## 11. Risks Of Double Work Or Terminology Drift

Double-work risks:

- Lab and Atlas independently designing the same presentation surfaces.
- Core absorbing project-specific concepts before they are neutralized.
- Atlas delaying bounded UX work while waiting for Lab models.
- Lab building adapter-shaped work before Atlas has stable adoption intent.

Terminology drift risks:

- `presentation family` becoming product authority.
- `Enrich selected` being mistaken for metadata hydration.
- `Watch` being used for passive interest rather than active routine checking.
- `Marked` being treated as a control that starts collection.
- `Intelligence`, `Record`, or `Finding` entering UI before human acceptance.
- relationship or footprint visuals implying affiliation, staging, ownership, residency, or intent.

## 12. Human Decisions Needed

Open Atlas decisions:

- Should the persistent container be called `Record`?
- Should final reviewed output be called Intelligence, Finding, Assessment, or Assessment Memory?
- Should pasted zKill links / killmail IDs enter the first UX pass?
- Should region become first-class soon, or remain deferred behind system/radius?
- Should battle timelines stay chronological or group into fight clusters?
- Should relationship and footprint views become one combined view or remain adjacent?
- When should the workflow pivot from local-alpha onboarding clarity to expert speed?
- How close may Lab fixture families get to Atlas terms before Atlas should provide an explicit source map?

## 13. Recommended Next Role / Action

Next Atlas action should remain target-owned:

1. Let Dev complete HS26.
2. Have Atlas Overseer review the expected DevHS26 handoff against `workspace\current.md`, `docs\roadmap\operator-investigation-desk.md`, evidence doctrine, and verification.
3. Only after that review, decide whether to continue the Investigation Desk path, request a UI/UX specialist screen pass, or prepare safe Atlas fixture-family source material for Lab.

Do not open Lab adapter work from Atlas. Do not promote orchestration synthesis terms into Atlas doctrine without human or Overseer acceptance.

## 14. Suggested Heading Artifact Name

```txt
workspace\OverseerHeading-atlas-2026-05-24.md
```
