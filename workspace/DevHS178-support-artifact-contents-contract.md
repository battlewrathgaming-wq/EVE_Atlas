# DevHS178 - Support Artifact Contents Contract

Date: 2026-06-02
Executor: Dev
Status: Complete

## Summary

Implemented a read-only support artifact contents contract preview:

```txt
support.artifact_contents_contract.preview
```

The preview defines what support artifact classes may contain, must exclude, must redact/omit, and must disclose. It is static/read-only and does not create support artifacts, snapshots, trace packs, logs, files, directories, provider calls, schema changes, Evidence/EVEidence, Discovery refs, Hydration output, Assessment Memory, Watch changes, or storage config writes.

## Files Changed

- `package.json`
- `src/main/services/supportArtifactContentsContractService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-support-artifact-contents-contract.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `workspace/current.md`
- `workspace/DevHS178-support-artifact-contents-contract.md`

## Command / Readout Added

Added service command:

```txt
support.artifact_contents_contract.preview
```

Command posture:

- classification: read-only
- renderer eligible: yes
- external/provider calls: none
- artifact/file creation: none
- runtime enforcement: inactive
- command blocking: inactive

The command is also covered in enforcement dry-run command classification metadata as a read-only support artifact contents contract readout.

## Artifact Classes Covered

- `runtime_snapshot_rolling`
- `runtime_snapshot_retained`
- `operator_debug_trace_pack`
- `light_operational_logs`
- `readiness_preflight_export`

Sample output summary from the focused verifier:

```json
{
  "status": "support artifact contents contract verified",
  "command": "support.artifact_contents_contract.preview",
  "class_count": 5,
  "families": {
    "corpus_adjacent_support": 3,
    "operational_support": 2
  },
  "high_sensitivity": [
    "runtime_snapshot_rolling",
    "runtime_snapshot_retained",
    "operator_debug_trace_pack"
  ],
  "raw_esi_payloads_forbidden": [
    "operator_debug_trace_pack",
    "light_operational_logs",
    "readiness_preflight_export"
  ],
  "db_copy_classes": [
    "runtime_snapshot_rolling",
    "runtime_snapshot_retained"
  ],
  "non_authoritative_classes": [
    "runtime_snapshot_rolling",
    "runtime_snapshot_retained",
    "operator_debug_trace_pack",
    "light_operational_logs",
    "readiness_preflight_export"
  ]
}
```

## Content Rules Proved

Each artifact class reports:

- allowed content categories
- forbidden content categories
- redaction/omission rules
- raw ESI payload posture
- Discovery ref posture
- Evidence/EVEidence row posture
- Hydration label/candidate posture
- Assessment Memory posture
- Watch state posture
- local path posture
- runtime telemetry posture
- Evidence/EVEidence, Observation, Assessment Memory, and deletion/pruning authority posture
- basis/provenance disclosure requirement
- privacy/sensitivity posture

Trace pack contract:

- forbids raw ESI payload dumps
- forbids full provider payload strings
- forbids full participant payload strings
- forbids secrets
- forbids unbounded data dumps
- forbids Evidence/EVEidence export packaging
- allows only bounded local diagnostic summaries and references

Snapshot contract:

- classifies rolling and retained runtime DB snapshots as high-sensitivity corpus-adjacent support
- allows existing DB-copy contents only as support/recovery material
- does not classify the snapshot artifact itself as new Evidence/EVEidence
- does not make snapshots Observation, Assessment Memory, or deletion/pruning authority

Operational logs and readiness/preflight exports:

- forbid raw ESI payloads and secrets
- remain local posture/support material
- cannot become product truth or authority

## Read-Only / No-Mutation Proof

The focused verifier invokes the new service command through the service registry with forged renderer-origin payload claims and confirms:

- renderer payload does not choose content/path authority
- no support artifact root directory is created
- no support artifacts are created
- no snapshots are created
- no trace packs are created
- no logs are created
- no files/directories are created
- no provider calls occur
- no zKill, ESI, or SDE download calls occur
- no Evidence/EVEidence writes occur
- no Discovery ref mutations occur
- no Hydration writes occur
- no Assessment Memory writes occur
- no Watch mutations occur
- no storage config writes occur
- no schema changes occur
- no runtime enforcement or command blocking is activated

## Verification

Syntax checks:

```powershell
node --check src\main\services\supportArtifactContentsContractService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-support-artifact-contents-contract.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-passive-side-effects.js
```

Result: all passed.

Focused and required verification:

```powershell
npm.cmd run verify:support-artifact-contents-contract
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:support-artifact-creation-policy
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
```

Result: all passed.

Protected terms:

- `npm.cmd run verify:protected-terms` completed with exit code 0.
- Warning-only advisory output reported 225 warnings across 9 changed working-set files.
- No renames were performed.
- No protected-word JSON updates were performed.

Final hygiene:

```powershell
git diff --check
git status --short --branch
```

Result:

- `git diff --check` passed; only CRLF normalization warnings were emitted.
- `git status --short --branch` showed `## main...origin/main [ahead 1]` with HS178 working-tree changes.

## Boundaries Confirmed

- No actual support artifact creation.
- No snapshot creation.
- No trace-pack creation.
- No file or directory creation by the preview.
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

## Risks / Notes

- This is a contents contract preview only. It does not change existing runtime snapshot or trace-pack creation behavior.
- The contract is intentionally static; future artifact creation hardening should consume or mirror these rules rather than treating generated support artifacts as authority.
- Protected-term verification remains advisory and warning-only for this working set.

## Recommended Next Action

Overseer review should decide whether this contents contract is sufficient to feed the next support artifact hardening packet, likely by checking whether existing snapshot/trace-pack creation behavior should be made to declare or conform to these class-level rules without turning the preview into enforcement.
