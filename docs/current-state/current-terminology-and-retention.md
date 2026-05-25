# Current State: Terminology Bridge And Retention

Date: 2026-05-24

## Purpose

Atlas now has enough backend, bridge, and renderer surface area that terms can drift between database names, service names, and user-facing copy.

This file records the current simplified state. A terminology bridge audit exists at `workspace/archive/terminology-bridge-audit-2026-05-24-unaccepted.md`, but it is parked advisory material, not accepted authority.

## Current Principle

Backend terms may remain technical when they are accurate implementation labels. User-facing terms should explain operator meaning.

Use bridge translation when the backend term is technically accurate but too abstract for the operator. Rewrite code terms only when the term encodes the wrong concept or causes boundary bugs.

Authority note:

```txt
Atlas controls backend and bridge terms.
Presentation/Lab layers may adapt human-facing wording where required, but intent must stay faithful to Atlas doctrine and evidence boundaries.
Labs or a dedicated presentation layer may later replace/finalize UI presentation after Atlas structure and boundaries are clean.
Accepted terminology policy: F:\Projects\Docs\Aura-Project-Orchestration\terminology\TerminologyAuthorityRuleset-2026-05-24.md
```

Critical reference:

```txt
workspace/critical/README.md
workspace/critical/critical-terms.md
workspace/critical/critical-assets.md
```

## Current Layer Model

```txt
Discovery -> Evidence -> Observation -> Assessment
```

Supporting attention model:

```txt
Marked = operator interest / tag / record attention
Watch = active routine check behavior
Watch implies Marked
Marked does not imply Watch
```

## Terms To Preserve

| Term | Current meaning | User-facing | Notes |
| --- | --- | --- | --- |
| Discovery | A possible lead before ESI expansion | Yes | zKill refs and previews are discovery/provenance, not evidence. |
| Evidence | Expanded ESI killmail data and derived activity events | Yes | Reserved term; do not use for queue refs or assessments. |
| Observation | Rendered pattern from stored evidence | Yes | Reports/timelines/role summaries should use observed language. |
| Assessment Memory | Deliberate saved operator judgment with citation context | Yes | Maps to backend assessment artifacts but is not evidence. |
| Marked | Operator interest or attention | Yes | Lightweight state; does not run collection. |
| Watch | Active routine check configuration/behavior | Yes | Watch implies Marked; blocked/unblocked are watch run-state labels. |
| Enrich selected | Explicit ESI expansion into stored killmail evidence | Yes | Must be paired with provider/call/write/evidence effect wording. |
| Refresh labels | Readability-only metadata hydration | Yes | Avoid presenting metadata hydration as evidence enrichment. |

## Terms To Keep Mostly Internal

| Term | Current meaning | User-facing stance | Notes |
| --- | --- | --- | --- |
| `assessment_artifact` | Backend persistence row for assessment memory | Internal/detail | User copy should prefer Assessment Memory unless inspecting raw details. |
| `discovered_killmail_refs` | Queue table for possible zKill leads | Internal/detail | User copy should prefer possible leads / discovery queue. |
| `activity_events` | Derived rows from expanded evidence | Detail/secondary | User copy can say appearances, roles, observed activity, or evidence-derived events. |
| `fetch_runs` | Provider/run provenance | Detail/secondary | Useful for audit/debug, not primary story copy. |
| `api_request_logs` | Provider call logs | Detail/secondary | Supports live smoke/debug, not evidence itself. |
| `scope.validate` | Backend scope validation service | Internal/detail | User copy should explain whether the chosen lead/action is valid. |
| `queue.selection` | Backend queue preview service | Internal/detail | User copy should frame selected possible leads and expected expansion effect. |

## Retention / Deletion State

Evidence deletion is blocked.

Currently implemented:

- retention preflight is read-only
- compaction preview is read-only
- assessment memory may be created deliberately from validated context
- runtime DB snapshots can be created explicitly as local support/safety artifacts

Not implemented:

- executable evidence pruning
- automatic retention policy
- destructive compaction
- deleting raw evidence because assessment memory exists

Accepted HS58 policy clarification:

- user-selected deletion must mean deletion of the selected deletable records
- footprint is a historical-interest clue only; it must not override deletion
- footprint must not retain raw Evidence, full activity events, or hidden copies after deletion
- assessment preservation may be offered or recommended, but it must not silently block or reverse explicit deletion unless future Human policy changes this

Accepted HS69A/HS69 policy refinement:

- retained deletion footprint is rejected
- if explicit deletion execution is implemented later, selected deletable active data should be deleted without a retained footprint
- deletion preflight reports no-footprint policy and rejected footprint fields rather than footprint candidates
- snapshots/backups are separate historical support artifacts and may retain records removed from active storage unless separately deleted
- Assessment Memory is mutable, disposable, and stale after Evidence deletion; it is not Evidence, not hidden retention, and not a deletion blocker

Policy note:

```txt
Assessment memory can preserve operator judgment.
It must not become a reason to delete evidence without a separate accepted deletion policy.
```

## Audit Need

Atlas still needs terminology authority before accepting a bridge table. A future authority packet should define who/what can approve mappings such as:

```txt
backend/db term -> service/bridge term -> frontend/user term -> meaning -> allowed use -> avoid/conflicts
```

Other Aura projects may produce equivalent tables and compare for shared abstract terms. Shared terms should be adopted only after authority is defined and only when they preserve each product's doctrine and do not hide meaningful performance or safety costs.
