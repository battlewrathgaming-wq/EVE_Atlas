# AURA Atlas Current Work

Status: HS178 Support artifact contents contract runway open
Last updated: 2026-06-02

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: prove a read-only support-artifact contents contract before any new support artifact creation hardening or broader snapshot/trace-pack behavior.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- data-layer boundaries guide the seam before machinery

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS178-support-artifact-contents-contract.md
```

## Source Of Intent

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

## Ordered Runway

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

## Guardrails And Non-Goals

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

## Stop Conditions

Stop and return to Overseer if:

- implementation needs to create, read, package, export, or inspect real artifact files
- implementation needs to change snapshot or trace-pack creation behavior
- content classification cannot be expressed without schema changes
- support artifact contents blur into Evidence/EVEidence, Discovery, Observation, Assessment Memory, or deletion/pruning authority
- raw ESI payload inclusion is required for trace packs
- renderer-origin payloads would need to define content/path authority
- provider calls or live/private/destructive actions become necessary
- the result becomes a full cleanup/export/pruning design instead of a contents contract preview

## Required Verification

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

Dev should update this section in the handoff with:

- files changed
- command/readout added
- artifact classes covered
- sample output summary
- proof of allowed/forbidden/redacted content categories
- proof that trace packs forbid raw ESI payload dumps
- proof that snapshots are high-sensitivity corpus-adjacent support but not new Evidence/EVEidence
- verification commands and results
- warning-only protected-term output, if any

## Dev Handoff

Expected:

```txt
workspace/DevHS178-support-artifact-contents-contract.md
```

The handoff must state whether the contents contract preview is complete, incomplete, or blocked.
