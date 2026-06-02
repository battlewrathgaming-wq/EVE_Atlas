# DevHS184 - Runtime Snapshot Manifest Disclosure

Date: 2026-06-02
Executor: Dev
Status: Complete

## Summary

Added explicit runtime snapshot disclosure metadata to both preflight and create results using the stable field:

```txt
support_artifact_disclosure
```

This is returned metadata only. No sidecar manifest file, new artifact writer, trace-pack/log/export change, provider call, schema change, enforcement, command blocking, or UI work was added.

## Files Changed

- `src/main/services/runtimeSnapshotService.js`
- `src/main/services/supportArtifactWriterConformanceGapMapService.js`
- `scripts/verify-runtime-db-snapshot.js`
- `scripts/verify-support-artifact-writer-conformance-gap-map.js`
- `workspace/current.md`
- `workspace/DevHS184-runtime-snapshot-manifest-disclosure.md`

## Disclosure Fields Added

`support_artifact_disclosure` includes:

- `disclosure_version`
- `stage`
- `artifact_class`
- `artifact_class_posture`
- `artifact_family`
- `privacy_sensitivity`
- `material_posture`
- `contains_existing_db_copy`
- `db_copy_content_posture`
- `non_authority`
- `retained_snapshot_posture`
- `local_path_sensitivity`
- `basis_provenance`

Example shape:

```json
{
  "artifact_class": "runtime_snapshot_retained",
  "artifact_family": "corpus_adjacent_support",
  "privacy_sensitivity": "high",
  "material_posture": "support_recovery_debug_only",
  "contains_existing_db_copy": true,
  "db_copy_content_posture": {
    "raw_esi_payloads": "included_as_existing_db_copy_only",
    "discovery_refs": "included_as_existing_db_copy_only",
    "evidence_rows": "included_as_existing_db_copy_only",
    "hydration_labels_or_candidates": "included_as_existing_db_copy_only",
    "watch_state": "included_as_existing_db_copy_only",
    "assessment_memory": "included_as_existing_db_copy_only"
  },
  "non_authority": {
    "snapshot_artifact_itself_is_new_evidence": false,
    "evidence_or_eveidence": false,
    "discovery": false,
    "observation": false,
    "assessment_memory": false,
    "product_truth": false,
    "deletion_or_pruning_authority": false,
    "cleanup_authority": false
  }
}
```

## Preflight And Create Exposure

Both paths expose `support_artifact_disclosure`:

- `buildRuntimeDbSnapshotPreflight(...)`
- `createRuntimeDbSnapshot(...)`

Class inference:

- `configured` and `explicit_request` destinations disclose `runtime_snapshot_retained`
- fallback generated destinations disclose `runtime_snapshot_rolling`

## Verification

Syntax checks:

```powershell
node --check src\main\services\runtimeSnapshotService.js
node --check src\main\services\supportArtifactWriterConformanceGapMapService.js
node --check scripts\verify-runtime-db-snapshot.js
node --check scripts\verify-support-artifact-writer-conformance-gap-map.js
```

Result: all passed.

Required verification:

```powershell
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:support-artifact-writer-conformance-gap-map
npm.cmd run verify:support-artifact-contents-contract
npm.cmd run verify:support-artifact-creation-policy
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Result: all passed.

Note: `npm.cmd run verify:runtime-snapshot` creates fixture runtime snapshot files under test-controlled `.tmp` paths. That behavior already existed and is explicitly permitted for HS184 verification.

Protected terms:

- `npm.cmd run verify:protected-terms` completed with exit code 0.
- Warning-only advisory output reported 188 warnings across 6 changed working-set files.
- No renames were performed.
- No protected-word JSON updates were performed.

## Conformance Map Update

`support.artifact_writer_conformance_gap_map.preview` now reports snapshot manifest disclosure as conforming.

Remaining conformance gaps/unknowns:

- `readiness_preflight_export` class-id alias normalization remains `gap`.
- Trace-pack free-text, sample-limit, local-path, and queue latest-ref summary posture remain `partial`.
- Trace/log provider endpoint and error-message secret leakage posture remains `unknown`.

## Boundaries Confirmed

- No sidecar/manifest file creation.
- No new artifact files beyond existing runtime snapshot command behavior.
- No new support artifact classes.
- No trace-pack changes.
- No log/export writer changes.
- No deletion/pruning behavior.
- No storage migration/move/copy behavior beyond existing snapshot copy.
- No provider calls.
- No zKill calls.
- No ESI calls.
- No SDE download calls.
- No Evidence/EVEidence writes beyond existing fixture snapshot DB-copy behavior.
- No Discovery ref mutation.
- No Hydration writes.
- No Assessment Memory writes.
- No Watch mutation.
- No storage config writes.
- No schema migration.
- No runtime enforcement activation.
- No command blocking.
- No renderer UI work.

## Recommended Next Action

Overseer review should decide whether support artifacts continue into trace/log redaction and free-text truncation policy proof, or whether the support-artifact seam should rest after snapshot disclosure.
