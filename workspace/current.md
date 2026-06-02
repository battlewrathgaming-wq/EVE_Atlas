# AURA Atlas Current Work

Status: Resting after HS183 accepted HS182
Last updated: 2026-06-02

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: support artifact writer conformance gap map accepted; next support-artifact seam should be deliberately selected.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- data-layer boundaries guide the seam before machinery

## Executor

Current executor: Overseer

Expected handoff filename:

```txt
none
```

No Dev runway is currently open.

## Accepted HS178 Context

Human / Overseer direction:

- return to support artifacts only after deciding what artifacts must preserve
- implement the first bounded proof, then let reviewer/specialist correction happen against something concrete
- avoid premature broad schema, bucket, snapshot, trace-pack, or runtime-enforcement work
- preserve data-layer boundaries while defining support artifact contents

Accepted source material:

- `docs/features/data-layer-boundaries.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `workspace/OverseerHS147-hs146-support-artifact-path-authority-review.md`
- `workspace/OverseerHS161-hs160-support-artifact-creation-policy-review.md`
- `src/main/services/supportArtifactPathAuthorityService.js`
- `src/main/services/supportArtifactCreationPolicyService.js`
- `src/main/support/operatorDebugTracePack.js`
- `src/main/support/runtimeBoundaryStatus.js`
- existing runtime snapshot / trace pack services and verifiers

Accepted context:

- `support.artifact_path_authority.preview` proves path authority and artifact classes.
- `support.artifact_creation_policy.preview` proves creation posture before creation.
- The missing piece is a contents contract: what each support artifact class may contain, must exclude, must redact, must classify, and must disclose.

## Completed HS178 Scope

1. Inspect existing support artifact path authority, creation policy, runtime snapshot, operator debug trace pack, readiness/preflight, runtime boundary, and related verifiers.
2. Add a read-only support artifact contents contract preview, preferably as:

```txt
support.artifact_contents_contract.preview
```

3. Cover at minimum:

- rolling runtime DB snapshot
- retained/manual runtime DB snapshot
- operator debug trace pack
- light operational logs
- readiness/preflight export

4. For each class, report:

- artifact id/class
- family: operational support or corpus-adjacent support
- allowed content categories
- forbidden content categories
- redaction / omission rules
- whether raw ESI payloads may be included
- whether Discovery refs may be included
- whether Evidence/EVEidence rows may be included
- whether Hydration labels/candidates may be included
- whether Assessment Memory may be included
- whether Watch state may be included
- whether local paths may be included
- whether runtime telemetry may be included
- whether the artifact can be used as Evidence/EVEidence, Observation, Assessment Memory, or deletion/pruning authority
- basis/provenance disclosure requirement
- privacy/sensitivity posture

5. Preserve these core rules:

- support artifacts are support/recovery/debug material, not Evidence/EVEidence
- snapshots may contain a DB copy, but that does not make the snapshot itself new Evidence/EVEidence
- trace packs must be bounded and must not become raw Evidence/EVEidence exports
- trace packs must not dump raw ESI payload objects or full provider payload strings
- readiness/preflight exports are local posture/support, not product truth
- logs must avoid secrets and raw payloads
- support artifacts may preserve basis/provenance/context, but must not override deletion/pruning policy

6. Add focused verification proving:

- the contents contract is read-only
- no support artifacts, snapshots, trace packs, logs, files, or directories are created
- no provider calls occur
- no Evidence/EVEidence, Discovery, Hydration, Assessment, Watch, storage config, or schema writes occur
- trace-pack contract forbids raw ESI payload dumps
- snapshot contract classifies DB copies as high-sensitivity corpus-adjacent support
- support artifacts are explicitly non-authoritative for Evidence/EVEidence, Observation, Assessment, and deletion/pruning decisions

## Accepted HS178 Boundaries And Non-Goals

- No actual support artifact creation.
- No snapshot creation.
- No trace-pack creation.
- No file or directory creation.
- No log file creation.
- No cleanup, delete, prune, restore, move, copy, migration, upload, export, or packaging.
- No provider calls.
- No zKill calls.
- No ESI calls.
- No SDE download calls.
- No Evidence/EVEidence writes.
- No Discovery ref mutation.
- No Hydration writes.
- No Assessment Memory writes.
- No Watch mutation.
- No storage config writes.
- No schema migration.
- No runtime enforcement activation.
- No command blocking.
- No renderer redesign or UI wording work.
- Do not treat support artifacts as Evidence/EVEidence, Discovery, Observation, Assessment Memory, or product reports.
- Do not treat trace packs as evidence exports.
- Do not let renderer payloads define path/content authority.

## Historical HS178 Stop Conditions

During HS178, Dev was required to stop and return to Overseer if:

- implementation needs to create, read, package, export, or inspect real artifact files
- implementation needs to change snapshot or trace-pack creation behavior
- content classification cannot be expressed without schema changes
- support artifact contents blur into Evidence/EVEidence, Discovery, Observation, Assessment Memory, or deletion/pruning authority
- raw ESI payload inclusion is required for trace packs
- renderer-origin payloads would need to define content/path authority
- provider calls or live/private/destructive actions become necessary
- the result becomes a full cleanup/export/pruning design instead of a contents contract preview

## HS178 Verification Expectations

Run syntax checks on every new or changed JavaScript file.

Run exact commands when known:

```powershell
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:support-artifact-creation-policy
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If Dev adds a new verifier, also run it, likely:

```powershell
npm.cmd run verify:support-artifact-contents-contract
```

Do not run snapshot/trace-pack write verifiers unless changed code requires it. If run, clearly state those existing verifiers create fixture support artifacts and are not the new contents contract preview creating operator artifacts.

## Evidence

Dev updated 2026-06-02:

- Added `support.artifact_contents_contract.preview` as a read-only service command and renderer-eligible readout.
- Added `src/main/services/supportArtifactContentsContractService.js` with a static contents contract preview. It does not read artifact files, create support artifacts, inspect live provider data, or mutate runtime/project state.
- Added `scripts/verify-support-artifact-contents-contract.js` and `npm.cmd run verify:support-artifact-contents-contract`.
- Updated service registry, enforcement dry-run coverage, command authority, service registry, and passive side-effect verification coverage for the new command.
- Artifact classes covered:
  - `runtime_snapshot_rolling`
  - `runtime_snapshot_retained`
  - `operator_debug_trace_pack`
  - `light_operational_logs`
  - `readiness_preflight_export`
- Sample preview summary:
  - class count: 5
  - families: `corpus_adjacent_support` = 3, `operational_support` = 2
  - high sensitivity classes: rolling runtime DB snapshot, retained/manual runtime DB snapshot, operator debug trace pack
  - raw ESI payloads forbidden for: operator debug trace pack, light operational logs, readiness/preflight export
  - DB-copy raw content allowance limited to runtime snapshot classes only
  - all classes explicitly non-authoritative for Evidence/EVEidence, Observation, Assessment Memory, and deletion/pruning authority
- Allowed/forbidden/redaction proof:
  - each class reports allowed content categories, forbidden categories, redaction/omission rules, raw ESI posture, Discovery ref posture, Evidence/EVEidence row posture, Hydration label/candidate posture, Assessment Memory posture, Watch state posture, local path posture, runtime telemetry posture, basis/provenance disclosure, and privacy/sensitivity.
  - trace packs forbid raw ESI dumps, full provider payload strings, full participant payload strings, secrets, unbounded dumps, and Evidence/EVEidence export packaging.
  - logs and readiness/preflight exports forbid raw ESI payloads and secrets.
  - snapshots are classified as high-sensitivity corpus-adjacent support that may contain an existing DB copy, but the snapshot itself is not new Evidence/EVEidence and is not pruning/deletion authority.
- Focused verifier proves no support artifacts, snapshots, trace packs, logs, files, or directories are created, no provider calls occur, and no Evidence/EVEidence, Discovery, Hydration, Assessment, Watch, storage config, or schema writes occur.
- Verification run:
  - `node --check src\main\services\supportArtifactContentsContractService.js` passed.
  - `node --check src\main\services\serviceRegistry.js` passed.
  - `node --check src\main\services\enforcementDryRunService.js` passed.
  - `node --check scripts\verify-support-artifact-contents-contract.js` passed.
  - `node --check scripts\verify-command-authority.js` passed.
  - `node --check scripts\verify-service-registry.js` passed.
  - `node --check scripts\verify-passive-side-effects.js` passed.
  - `npm.cmd run verify:support-artifact-contents-contract` passed.
  - `npm.cmd run verify:support-artifact-path-authority` passed.
  - `npm.cmd run verify:support-artifact-creation-policy` passed.
  - `npm.cmd run verify:service-registry` passed.
  - `npm.cmd run verify:command-authority` passed.
  - `npm.cmd run verify:passive-side-effects` passed.
  - `npm.cmd run verify:enforcement-dry-run` passed.
  - `npm.cmd run verify:protected-terms` passed with warning-only advisory output: 225 warnings across 9 changed working-set files; no renames or protected-word JSON updates performed.
  - `git diff --check` passed; only CRLF normalization warnings were emitted.
  - `git status --short --branch` showed branch `main...origin/main [ahead 1]` with HS178 working-tree changes.

## Dev Handoff

Completed:

```txt
workspace/DevHS178-support-artifact-contents-contract.md
```

Status: contents contract preview complete and accepted by Overseer.

Overseer reviewed 2026-06-02:

- Accepted HS178 in `workspace/OverseerHS179-hs178-support-artifact-contents-contract-review.md`.
- Verified the new command, registry/authority/passive-side-effect coverage, dry-run coverage, protected-term advisory output, and diff hygiene.
- Accepted `support.artifact_contents_contract.preview` as read-only content posture for support artifact classes.
- Runtime artifact creation, snapshot creation, trace-pack creation, support export writing, deletion/pruning behavior, and runtime enforcement activation remain unopened.

## Resting Next Options

Recommended next shaping candidates:

1. Read-only conformance gap map between existing snapshot/trace-pack/readiness support code and the accepted contents contract.
2. Continue a different storage/runtime seam if support artifacts should rest.

Do not open Dev implementation until one of these is selected and bounded.

## Advisory Input Accepted

Accepted 2026-06-02:

- `workspace/SecurityReviewHS180-support-artifact-contents-contract.md`
- `workspace/OverseerHS181-hs180-security-review-acceptance.md`

HS180 found no blocking issue in the contract preview and recommended a read-only writer conformance gap map before any support artifact writer changes.

## Active HS182 Runway

Opened 2026-06-02:

- `workspace/OverseerHS182-support-artifact-writer-conformance-gap-map-runway.md`

Expected Dev handoff:

```txt
workspace/DevHS182-support-artifact-writer-conformance-gap-map.md
```

Task:

Add a read-only support artifact writer conformance gap map, preferably:

```txt
support.artifact_writer_conformance_gap_map.preview
```

It should compare existing snapshot, trace-pack, readiness/preflight, and light-log writer/output posture against `support.artifact_contents_contract.preview` without changing writer behavior or creating artifacts.

Preserve:

- no writer behavior changes
- no support artifact creation
- no snapshot/trace-pack/log/export/file/directory creation
- no provider calls
- no Evidence/EVEidence, Discovery, Hydration, Assessment, Watch, storage config, schema, runtime enforcement, command blocking, or UI work

## HS182 Evidence

Dev updated 2026-06-02:

- Added `support.artifact_writer_conformance_gap_map.preview` as a read-only service command and renderer-eligible readout.
- Added `src/main/services/supportArtifactWriterConformanceGapMapService.js` with a static writer conformance map that compares current writer/output postures to `support.artifact_contents_contract.preview`.
- Added `scripts/verify-support-artifact-writer-conformance-gap-map.js` and `npm.cmd run verify:support-artifact-writer-conformance-gap-map`.
- Updated service registry, enforcement dry-run coverage, command authority, service registry, and passive side-effect coverage for the new command.
- Mapped artifact classes:
  - `runtime_snapshot_rolling`
  - `runtime_snapshot_retained`
  - `operator_debug_trace_pack`
  - `readiness_preflight_export`
  - `light_operational_logs`
- Focused verifier sample:
  - class count: 5
  - check count: 23
  - status counts: `conforms` = 4, `gap` = 3, `partial` = 13, `unknown` = 3
  - risk counts: `low` = 8, `medium` = 12, `high` = 3
  - classes with gaps: runtime snapshot rolling, runtime snapshot retained, readiness/preflight export
  - classes with unknowns: operator debug trace pack, light operational logs
- HS180 concerns are carried forward:
  - trace-pack free-text max length/truncation: `partial`
  - local path sensitivity disclosure: `partial`
  - sample limit/exclusions disclosure: `partial`
  - readiness class-id alias normalization: `gap`
  - snapshot manifest sensitivity/non-authority/cleanup disclosure: `gap` / `partial`
  - provider endpoint/error-message secret leakage: `unknown`
  - queue latest refs bounded summary: `partial`
- Focused verifier proves no support artifacts, snapshots, trace packs, logs, exports, files, or directories are created, no provider calls occur, no DB table counts change, and no writer behavior changes.
- Verification run:
  - `node --check src\main\services\supportArtifactWriterConformanceGapMapService.js` passed.
  - `node --check src\main\services\serviceRegistry.js` passed.
  - `node --check src\main\services\enforcementDryRunService.js` passed.
  - `node --check scripts\verify-support-artifact-writer-conformance-gap-map.js` passed.
  - `node --check scripts\verify-command-authority.js` passed.
  - `node --check scripts\verify-service-registry.js` passed.
  - `node --check scripts\verify-passive-side-effects.js` passed.
  - `npm.cmd run verify:support-artifact-writer-conformance-gap-map` passed.
  - `npm.cmd run verify:support-artifact-contents-contract` passed.
  - `npm.cmd run verify:support-artifact-path-authority` passed.
  - `npm.cmd run verify:support-artifact-creation-policy` passed.
  - `npm.cmd run verify:service-registry` passed.
  - `npm.cmd run verify:command-authority` passed.
  - `npm.cmd run verify:passive-side-effects` passed.
  - `npm.cmd run verify:enforcement-dry-run` passed.
  - `npm.cmd run verify:protected-terms` passed with warning-only advisory output: 241 warnings across 9 changed working-set files; no renames or protected-word JSON updates performed.
  - `git diff --check` passed; only CRLF normalization warnings were emitted.
  - `git status --short --branch` showed branch `main...origin/main` with HS182 working-tree changes.

## HS182 Dev Handoff

Completed:

```txt
workspace/DevHS182-support-artifact-writer-conformance-gap-map.md
```

Status: writer conformance gap map preview complete and accepted by Overseer.

Overseer reviewed 2026-06-02:

- Accepted HS182 in `workspace/OverseerHS183-hs182-support-artifact-writer-conformance-review.md`.
- Verified the new command, support artifact contract/path/creation dependencies, registry/authority/passive-side-effect coverage, dry-run coverage, protected-term advisory output, and diff hygiene.
- Accepted `support.artifact_writer_conformance_gap_map.preview` as read-only gap evidence for later support artifact hardening.
- Actual writer behavior changes, support artifact creation, snapshot creation, trace-pack creation, log/export creation, deletion/pruning behavior, and runtime enforcement activation remain unopened.

## Resting Next Options

Recommended next shaping candidates:

1. Snapshot manifest / metadata disclosure hardening.
2. Trace/log redaction and free-text truncation policy proof.
3. Rest support artifacts and continue a different storage/runtime seam.

Do not open Dev implementation until one of these is selected and bounded.
