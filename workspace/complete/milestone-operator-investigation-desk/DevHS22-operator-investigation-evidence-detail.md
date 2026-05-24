# DevHS22: Operator Investigation Evidence Detail

Status: Complete
Date: 2026-05-23
Role: Dev
Milestone: Operator Investigation Desk

## Scope

Executed the HS22 runway in `workspace/current.md`: stored-evidence investigation detail for validated actor/system/radius leads, using existing structured report services.

This packet stayed read-only. It did not add live/API behavior, backend resolver services, passive collection, automatic discovery, automatic enrichment, metadata hydration, assessment creation, watch execution, or evidence pruning.

## Changes

- Added a `Stored Evidence Detail` action and section to the Investigation screen.
- Loaded compact detail from existing `report.actor` and `report.radius` service paths.
- Added evidence summary rows for lead, report type, evidence basis, sample status, evidence window, killmail count, and activity-event count.
- Added a small observation preview derived from backend-owned report observation sections.
- Added honest empty/no-evidence states for leads without stored expanded ESI evidence.
- Kept raw IDs, normalized payloads, fuller report details, metadata hydration, and assessment save in existing secondary/report surfaces.
- Updated renderer static verification and Electron smoke to cover the new detail route.
- Updated current-state report/UI docs and `workspace/current.md` evidence/handoff.

## Evidence Covered

- Actor lead detail uses `report.actor`.
- System/radius lead detail uses `report.radius` after existing HS20 lead validation.
- Stored expanded ESI killmail data is labelled evidence.
- Counts and preview rows are labelled observations from stored evidence.
- Discovery refs remain possible leads until explicit ESI expansion through Enrich selected.
- Empty states do not imply collection or hidden recovery; they state no stored expanded ESI evidence exists for the lead.
- The Investigation detail panel is read-only and never starts discovery, enrichment, hydration, assessment, or watches.
- Marked/Watch language and existing first-screen routes remain preserved.

## Verification

```txt
npm.cmd run verify:renderer-shell
Result: passed
```

```txt
npm.cmd run smoke:electron
Result: passed
Artifact: .tmp/electron-visual-smoke/visual-smoke-result.json
Notable checks: investigation_radius_detail_loaded=true; investigation_actor_detail_loaded=true.
```

```txt
npm.cmd run verify:all
Result: passed
All verification group passed with 61 scripts.
```

No live API smoke, real SDE network download, destructive retention/pruning operation, or private runtime DB export was run.

## Files Changed

```txt
src/renderer/index.html
src/renderer/investigation.js
src/renderer/app.js
src/main/main.js
scripts/verify-renderer-shell.js
docs/current-state/current-ipc-ui-preparation.md
docs/current-state/current-report-products.md
workspace/current.md
workspace/DevHS22-operator-investigation-evidence-detail.md
```

## Deferred

- Record drawer semantics.
- Intelligence/Finding naming.
- Pasted zKill links / killmail IDs.
- First-class region investigation.
- Battle timeline grouping or fight clustering beyond the compact stored-evidence summary.
- Relationship graph or footprint story implementation.
- Live success smoke.
- Evidence pruning/deletion.
- New backend resolver services.

## Recommended Next Packet

Proceed with Overseer review. A useful next bounded slice would be a Queue / Enrich preflight refinement from the validated lead, or a narrow assessment-memory review improvement from the loaded stored-evidence context.
