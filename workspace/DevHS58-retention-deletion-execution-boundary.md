# DevHS58 - Retention / Deletion Execution Boundary

Date: 2026-05-25
Executor: Dev
Milestone: HS58 Retention / Deletion Execution Boundary

## Current Retention / Deletion Trace

1. Retention action registry:
   - `src/main/services/retentionActionService.js` defines local action metadata in `RETENTION_ACTIONS`.
   - Actions include `diagnostics.prune_api_logs`, `metadata.prune_runs`, `queue.expire_refs`, `runtime.delete_disposable_db`, `evidence.prune_scope`, and `assessment.compact_from_evidence`.
   - `evidence.prune_scope` is classified destructive, confirmation-required, and `assessment_recommended`.
   - `assessment.compact_from_evidence` is classified assessment-creating and creates Assessment Memory input from scoped Evidence preview.
2. Service exposure:
   - `src/main/services/serviceRegistry.js` exposes `retention.actions` and `retention.preflight` only.
   - Both are non-renderer commands in this packet.
   - `retention.preflight` is classified read-only with `DESTRUCTIVE_PREVIEW` effect.
   - There is no executable `evidence.prune_scope` service command and no executable `assessment.compact_from_evidence` command.
3. Retention preflight:
   - `buildRetentionPreflight()` validates known action names, calculates impact, records confirmation blockers, and emits assessment-preservation warnings for evidence pruning.
   - Matching confirmation makes the preflight `allowed`, but still does not execute deletion.
4. Impact accounting:
   - `evidenceScopeImpact()` counts affected `killmails`, `activity_events`, `ingestion_audits`, and `data_quality_warnings` for actor/system/time-scoped Evidence.
   - `queueRefCount()` counts `discovered_killmail_refs`.
   - Diagnostics and metadata preflights count `api_request_logs` and `metadata_runs`.
5. Assessment compaction:
   - `buildAssessmentCompactionPreview()` reads scoped `activity_events`, joins local system/type labels, and returns a read-only preview with appearance counts, systems, regions, ships, source run IDs, and sample killmail IDs.
   - `assessmentArtifactInputFromCompactionPreview()` converts a ready preview into explicit `assessment.create` input only when an assessment reason or summary exists.
   - `createAssessmentArtifact()` writes deliberate Assessment Memory, validates cited sample killmail IDs at creation time, and does not delete Evidence.
6. Runtime snapshot:
   - `runtime.db_snapshot.preflight` is read-only and reports path/state/counts.
   - `runtime.db_snapshot.create` is explicit support artifact creation, not pruning or retention execution.

## Policy Interpretation Preserved

- User-selected deletion must mean deletion of the selected deletable records if execution is implemented later.
- Footprint is a historical-interest clue only.
- Footprint is optional edge metadata and must not override explicit deletion.
- Footprint must not retain raw Evidence, full activity events, or hidden copies after deletion.
- Assessment preservation may be offered or recommended, but must not silently block or reverse explicit deletion unless future Human policy changes this.

## Files Changed

- `scripts/verify-retention-deletion-boundary.js`
  - Added fixture-only verifier for the retention/deletion boundary and footprint policy.
- `package.json`
  - Added `verify:retention-deletion-boundary`.
- `scripts/verify-group.js`
  - Added the new verifier to core/all verification.
- `docs/current-state/current-evidence-pipeline.md`
  - Recorded accepted footprint/deletion clarification.
- `docs/current-state/current-terminology-and-retention.md`
  - Recorded accepted HS58 policy clarification.
- `workspace/current.md`
  - Updated Evidence and Dev Handoff sections.

No production deletion execution, service command, schema, migration, IPC, renderer exposure, payload, or contract was added or renamed.

## Verification Cases Added

`verify:retention-deletion-boundary` covers:

- `evidence.prune_scope` remains action metadata/preflight only.
- Confirmation requirements are explicit and named.
- Matching confirmation allows only preflight calculation, not deletion.
- Evidence prune impact lists affected `killmails`, `activity_events`, `ingestion_audits`, and `data_quality_warnings`.
- `retention.preflight` and `retention.actions` are read-only service commands.
- No executable `evidence.prune_scope` or `assessment.compact_from_evidence` command exists.
- Compaction preview is read-only and does not delete Evidence.
- Explicit Assessment Memory creation from preview does not delete Evidence.
- Fixture deletion simulation removes selected killmail, full activity events, ingestion audit, and related warning.
- Surviving Assessment Memory row does not hide `raw_esi_payload`, raw payload checksums, raw attacker arrays, or full activity event rows.

## Deletion Execution Status

Production deletion execution was deferred.

Reason: the current accepted product state is preflight-only, and implementing executable deletion safely would require additional policy decisions around exact deletion scope, provenance/warning retention, backup/restore behavior, and whether any durable footprint storage should exist. The packet stop conditions explicitly require stopping for schema/storage/policy expansion, and no production defect required crossing that line.

## Footprint Behavior

No new footprint table, file, command, or storage format was added.

Fixture verification treats footprint as Assessment Memory-style minimal historical-interest context only:

- appearance count
- observed systems/regions/ships summaries
- source run IDs
- sample killmail IDs for creation-time citation validation

It does not preserve raw Evidence, full activity events, raw payload checksums, or hidden deleted-record copies.

## Assessment Memory / Preservation Behavior

- Compaction preview remains read-only.
- Assessment Memory creation remains explicit through existing `createAssessmentArtifact()` / `assessment.create`.
- Assessment Memory can survive later Evidence deletion as a historical-interest clue.
- Assessment Memory does not delete Evidence and does not block explicit deletion.

## Verification Run

Commands run:

```powershell
npm.cmd run verify:retention-deletion-boundary
npm.cmd run verify:retention-preflight
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:assessment-artifacts
npm.cmd run verify:evidence-rules
npm.cmd run verify:protected-terms
npm.cmd run verify:all
git status --short --branch
```

Results:

- `verify:retention-deletion-boundary`: passed.
- `verify:retention-preflight`: passed.
- `verify:runtime-snapshot`: passed.
- `verify:assessment-artifacts`: passed.
- `verify:evidence-rules`: passed.
- `verify:protected-terms`: exit 0, warning-only.
- `verify:all`: passed, 65 scripts.

Protected-term output after handoff/current updates:

- Files scanned: 6.
- Warning count: 291.
- Classes: `atlas-candidate=153`, `lab-quarantine-borrowing=132`, `cross-project-borrowing=6`.
- Confirmation: warning-only; no renames performed; no protected-word JSON updates performed.

## Boundary Confirmations

- No live/API calls were run.
- No user real database was mutated; tests used in-memory/disposable fixture databases.
- No production deletion execution was implemented.
- Footprint does not override deletion.
- No hidden raw Evidence is preserved by footprint/preservation behavior.
- Discovery, Evidence, Observation, Assessment Memory, provenance, storage, and `Enrich selected` meanings remain intact.
- No schema, migration, contract, command, IPC, renderer exposure, service, or payload rename was performed.

## Risks / Deferred Decisions

- Exact production deletion scope remains a policy decision, especially whether deleting Evidence should also prune related `data_quality_warnings`, `api_request_logs`, `fetch_runs`, queue refs, metadata labels, and Assessment Memory citations.
- Backup/restore expectations are not defined.
- No durable footprint storage model is accepted. Adding one would require policy and likely schema/storage approval.
- Existing Assessment Memory stores citation-time sample killmail IDs and aggregate appearance context. That is acceptable as a minimal historical-interest clue under HS58, but it is not a deletion execution model.

## Recommended Next Packet

Overseer should choose either:

- a policy/design packet defining exact production deletion scope and backup/restore expectations, or
- a narrow fixture-only implementation packet for one explicit destructive action, starting with diagnostics/API log pruning rather than raw Evidence deletion.
