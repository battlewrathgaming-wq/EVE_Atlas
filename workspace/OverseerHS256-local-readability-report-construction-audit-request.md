# Overseer HS256: Local Readability During Report Construction Audit Request

Date: 2026-06-05
Role: Atlas Overseer
Milestone: Atlas Storage And Runtime Hardening
Requested executor: Data Engineering / Engineering Review
Expected artifact: `workspace/DataEngineeringHS256-local-readability-report-construction-audit.md`

## Purpose

Audit how Atlas currently performs local readability lookup during report / Observation construction.

This is advisory only. Do not implement code. Do not create a Dev runway. Do not run live/API/provider calls.

## North Star

```txt
Local readability is part of report construction.
Provider readability is an explicit operator act.
Focus is not request.
Request is not provider execution.
```

The immediate question is:

```txt
What local DB/entity/SDE label lookup already happens when Atlas builds reports, and what should future readouts disclose before provider-backed Hydration exists?
```

## Accepted Context

Accepted pipeline:

```txt
Evidence/EVEidence -> raw-ID Observation -> selective Hydration for readability -> Assessment
```

Meaning:

- raw local IDs are facts
- labels are readability
- Observation can form before labels are complete
- local readability may happen automatically during report construction
- provider-backed readability must require an explicit operator trigger and normal gates
- UI focus, hover, highlight, or navigation is not a Hydration request
- a Hydration request is still not provider execution

## Read

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/features/data-layer-boundaries.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `src/main/db/schema.sql`
- `src/main/reports/reportUtils.js`
- `src/main/reports/actorReport.js`
- `src/main/reports/corporationObservationReport.js`
- `src/main/reports/operatorReport.js`
- `src/main/reports/radiusReport.js`
- `src/main/reports/systemReport.js`
- `src/main/reports/actorMetadataReadinessReport.js`
- `src/main/reports/corporationMetadataReadinessReport.js`
- `src/main/reports/metadataStatusReport.js`
- `src/main/metadata/reportHydrator.js`
- relevant verification scripts for report/readability behavior, if needed

## Audit Tasks

1. Trace where report construction already uses local readability sources:
   - `activity_events` cached labels
   - `entities`
   - `watchlist_entities`
   - `type_metadata`
   - SDE topology/inventory tables
   - other local tables
2. Identify which report surfaces already do local label lookup during construction.
3. Identify which report surfaces leave unresolved IDs as raw IDs/gaps.
4. Confirm whether report construction mutates labels or calls Hydration/provider code.
5. Confirm whether metadata readiness reports already disclose missing labels cleanly.
6. Check whether local readability is consistently separate from provider-backed Hydration.
7. Identify any places where wording makes Hydration sound required before raw-ID Observation can exist.
8. Recommend the smallest next proof, if any:
   - no work needed
   - documentation wording only
   - read-only verifier/audit output
   - narrow report-readout disclosure
   - Dev runway only if a real gap is proven

## Constraints

- no implementation
- no Dev runway
- no provider calls
- no zKill calls
- no ESI calls
- no Hydration writes
- no Evidence/EVEidence writes
- no Discovery ref mutation
- no Watch mutation
- no Assessment Memory or Marked mutation
- no storage config writes
- no support artifact creation
- no schema changes
- no runtime enforcement activation
- no renderer/UI work

Do not treat UI focus or hover as a request.

Do not treat local label lookup as provider-backed Hydration.

Do not treat missing labels as missing Evidence/EVEidence.

## Verification Guidance

Use existing evidence where current and relevant.

If running checks helps confidence, keep them local and targeted. Suggested candidates:

```txt
npm.cmd run verify:actor-report
npm.cmd run verify:corporation-report
npm.cmd run verify:radius-report
npm.cmd run verify:metadata-lookup
npm.cmd run verify:metadata-status
npm.cmd run verify:hydration-candidate-preview
git status --short --branch
```

Do not run live/API/provider checks.

Do not run broad verification unless the audit finds shared/runtime/schema risk that genuinely needs it.

## Expected Output

Create:

```txt
workspace/DataEngineeringHS256-local-readability-report-construction-audit.md
```

Include:

1. Executive recommendation.
2. Current local readability sources by report/surface.
3. Whether report construction mutates labels or stays read-only.
4. Where unresolved IDs/gaps are disclosed.
5. Whether local readability and provider-backed Hydration are currently clear.
6. Ambiguities or drift risks.
7. Smallest next proof or Dev packet, if any.
8. Parked items.
9. Verification evidence.
10. Human/Overseer decisions needed.

## Parked

- provider-backed Hydration trigger implementation
- UI focus/hover behavior
- input strip behavior
- context hotkeys
- mouse context menu
- Hydration writes
- provider calls
- schema-backed Hydration queue
- runtime enforcement
- support artifacts
- full Observation UI

