# OverseerHS184 - Runtime Snapshot Manifest Disclosure Runway

Date: 2026-06-02
Role: Overseer
Status: Dev runway opened

## Purpose

Open the smallest writer-hardening seam from HS182/HS183.

The writer conformance gap map showed the cleanest support-artifact gap is runtime snapshot manifest / metadata disclosure. Atlas should make snapshot sensitivity, family/class, raw ESI DB-copy posture, non-authority posture, and cleanup/deletion review meaning explicit in snapshot preflight and create results.

This is not a broad support-artifact writer redesign.

## Executor

Current executor: Dev

Expected handoff:

```txt
workspace/DevHS184-runtime-snapshot-manifest-disclosure.md
```

## Required Reading

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/features/data-layer-boundaries.md`
- `workspace/OverseerHS183-hs182-support-artifact-writer-conformance-review.md`
- `workspace/DevHS182-support-artifact-writer-conformance-gap-map.md`
- `src/main/services/runtimeSnapshotService.js`
- `src/main/services/supportArtifactContentsContractService.js`
- `src/main/services/supportArtifactWriterConformanceGapMapService.js`
- `scripts/verify-runtime-db-snapshot.js`
- `scripts/verify-support-artifact-writer-conformance-gap-map.js`

## Ordered Runway

1. Inspect `runtimeSnapshotService.js` and existing runtime snapshot verifier.
2. Add explicit snapshot disclosure metadata to runtime snapshot preflight and create results.
3. Keep the implementation focused on returned metadata/manifest shape only.
4. Do not add sidecar files or new artifact files.
5. Preserve existing snapshot creation mechanics.

Recommended shape:

- add an internal helper such as `snapshotArtifactDisclosure(...)`
- include disclosure in both `buildRuntimeDbSnapshotPreflight` and `createRuntimeDbSnapshot`
- if possible, include a stable field name such as `artifact_disclosure` or `support_artifact_disclosure`

The disclosure should cover:

- artifact class or class posture:
  - rolling/fallback/generated snapshot
  - retained/manual/configured or explicit snapshot, where inferable
- artifact family: `corpus_adjacent_support`
- privacy sensitivity: `high`
- support/recovery/debug material only
- snapshot may contain existing DB-copy contents
- raw ESI payloads may be included only as existing DB-copy content
- Discovery refs may be included only as existing DB-copy content
- Evidence/EVEidence rows may be included only as existing DB-copy content
- Hydration labels/candidates may be included only as existing DB-copy content
- Watch state may be included only as existing DB-copy content
- Assessment Memory may be included only as existing DB-copy content
- snapshot artifact itself is not new Evidence/EVEidence
- snapshot artifact is not Discovery, Observation, Assessment Memory, product truth, deletion/pruning authority, or cleanup authority
- retained/manual snapshots may outlive active records
- cleanup/deletion review responsibility
- local path fields are sensitive support metadata
- basis/provenance disclosure: source DB path, snapshot path/destination, generated time, storage/budget context

## Guardrails And Non-Goals

- No new snapshot creation behavior beyond the existing runtime snapshot command.
- No sidecar/manifest file creation.
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

## Stop Conditions

Stop and return to Overseer if:

- implementation requires adding sidecar files or new artifact files
- implementation requires broad support-artifact writer redesign
- implementation needs trace-pack/log/export changes
- implementation needs schema changes
- implementation needs provider/live/private/destructive actions
- snapshot metadata starts claiming Evidence/EVEidence, Discovery, Observation, Assessment Memory, product truth, deletion/pruning authority, or cleanup authority
- renderer-origin payloads would need to define snapshot disclosure authority

## Required Verification

Run syntax checks on every changed JavaScript file.

Run:

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

Important verification note:

`npm.cmd run verify:runtime-snapshot` creates fixture runtime snapshot files under test-controlled `.tmp` paths. That is acceptable for HS184 because the runtime snapshot writer already exists and this packet is hardening its returned disclosure metadata. Do not add new artifact writers or sidecar files.

## Expected Handoff

Dev handoff should report:

- files changed
- disclosure fields added
- example disclosure shape
- whether preflight and create both expose it
- confirmation no sidecar/new artifact file was added
- verification commands/results
- protected-term warning count
- any remaining conformance gaps

