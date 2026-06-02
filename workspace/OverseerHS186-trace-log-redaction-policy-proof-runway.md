# Overseer HS186 - Trace/Log Redaction Policy Proof Runway

Status: active Dev runway
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS186-trace-log-redaction-policy-proof.md`

## Purpose

Define the smallest read-only policy proof for trace/log redaction and free-text truncation before Atlas changes any support-artifact writers.

HS182/HS183 and HS184/HS185 left trace-pack and light-log uncertainty around provider endpoints, free-text errors, local paths, queue ref samples, sample-limit disclosure, and secret leakage. This packet should make the policy inspectable first. It should not harden the writer yet.

## Read First

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/features/data-layer-boundaries.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `workspace/OverseerHS179-hs178-support-artifact-contents-contract-review.md`
- `workspace/OverseerHS183-hs182-support-artifact-writer-conformance-review.md`
- `workspace/OverseerHS185-hs184-runtime-snapshot-disclosure-review.md`
- `src/main/services/supportArtifactContentsContractService.js`
- `src/main/services/supportArtifactWriterConformanceGapMapService.js`
- `src/main/support/operatorDebugTracePack.js`
- `src/main/api/httpClient.js`
- relevant trace/log/readiness/support-artifact verifiers in `scripts/`

## Task

Add a read-only trace/log redaction and free-text truncation policy proof, preferably as:

```txt
support.trace_log_redaction_policy.preview
```

The preview should define policy posture only. It may be renderer-eligible if it follows existing safe readout patterns, but renderer payloads must not define the policy.

## Required Coverage

Cover at minimum:

- operator debug trace pack
- light operational logs
- provider endpoint and query/parameter strings
- provider error messages and local exception strings
- data-quality warning messages
- queue latest-ref samples and `last_error` fields
- local filesystem paths
- task/run identifiers and provider provenance
- sample limits, omitted-count disclosure, and excluded-material disclosure

For each covered class or field family, report:

- policy id / family
- sensitivity level
- allowed summary content
- forbidden content
- redaction rule
- truncation or max-length rule where applicable
- replacement marker or disclosure phrase
- basis/provenance requirement
- whether raw ESI payloads are allowed
- whether Discovery refs / killmail hashes are allowed and in what bounded form
- whether Evidence/EVEidence rows are allowed
- whether Assessment Memory is allowed
- whether local paths are allowed, redacted, or classified as sensitive
- whether the policy is writer-enforced, policy-only, or unknown

## Policy Rules To Preserve

- Trace/log support artifacts are support/recovery/debug material only.
- Trace/log support artifacts are not Evidence/EVEidence, Discovery, Observation, Assessment Memory, product truth, deletion authority, or pruning authority.
- Trace packs must not become raw Evidence/EVEidence exports.
- Trace/log surfaces must not dump raw ESI payload objects, full provider response bodies, full participant payload strings, tokens, secrets, or unbounded table dumps.
- Local paths are sensitive support context and should be disclosed cautiously.
- Free-text provider/runtime strings should be bounded before any future artifact writer emits them.
- Discovery refs and killmail hashes may appear only as bounded support/provenance samples, not as Evidence.
- Readiness/preflight alias normalization is out of scope unless needed to label the trace/log policy itself.

## Boundaries And Non-Goals

- Do not change trace-pack writer behavior.
- Do not change log writer/export behavior.
- Do not create support artifacts.
- Do not create snapshots.
- Do not create trace packs.
- Do not create logs, exports, files, or directories except normal source/verifier edits.
- Do not inspect real operator artifact files.
- Do not call providers.
- Do not run live zKill, ESI, SDE, or other external/network actions.
- Do not mutate Evidence/EVEidence, Discovery refs, Hydration labels/candidates, Assessment Memory, Watch state, storage config, External I/O config, or schema.
- Do not activate runtime enforcement.
- Do not add command blocking.
- Do not change renderer UI.
- Do not claim writer conformance unless the writer actually enforces the policy in this packet.

## Stop Conditions

Stop and return to Overseer if:

- proving the policy requires changing trace-pack or log writer behavior
- proving the policy requires inspecting real operator support artifacts
- redaction/truncation cannot be expressed without schema or writer redesign
- raw ESI payload inclusion appears necessary for trace/log support artifacts
- local path handling would require storage migration or path authority changes
- provider calls, live/private/destructive actions, or runtime enforcement become necessary
- the result turns into a full support-artifact export/redaction implementation instead of a policy proof

## Verification Expectations

Run syntax checks for every changed JavaScript file.

Expected commands if applicable:

```powershell
npm.cmd run verify:support-trace-log-redaction-policy
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

If an existing trace-pack verifier is run, clearly state whether it creates fixture artifacts. Do not run artifact-creating verifiers unless the changed code needs that proof.

## Expected Handoff

Create:

```txt
workspace/DevHS186-trace-log-redaction-policy-proof.md
```

Include:

- files changed
- command/readout added, if any
- policy classes / field families covered
- sample policy output
- whether writer conformance statuses changed or remain policy-only / partial / unknown
- verification commands and results
- protected-term warning count
- confirmation that no writer behavior, support artifact creation, provider calls, schema changes, runtime enforcement, command blocking, or UI work were performed
