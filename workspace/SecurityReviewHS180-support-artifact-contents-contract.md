# SecurityReviewHS180 - Support Artifact Contents Contract

Status: advisory security / safety review
Date: 2026-06-02
Role: Security / Safety Reviewer
Milestone: Atlas Storage And Runtime Hardening
Topic: HS178 / HS179 support artifact contents contract security, privacy, redaction, and authority-boundary review

## Request Received

Review whether `support.artifact_contents_contract.preview` is safe and coherent as a content contract before any future support artifact creation hardening.

This review is advisory only. It does not create a Dev runway, change support artifact writers, create snapshots, trace packs, logs, files, exports, packages, directories, run live/provider/private/destructive actions, rename terms, or update protected-word JSON.

## Files Reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/features/data-layer-boundaries.md`
- `workspace/OverseerHS179-hs178-support-artifact-contents-contract-review.md`
- `workspace/DevHS178-support-artifact-contents-contract.md`
- `src/main/services/supportArtifactContentsContractService.js`
- `src/main/services/supportArtifactCreationPolicyService.js`
- `src/main/services/supportArtifactPathAuthorityService.js`
- `src/main/services/runtimeSnapshotService.js`
- `src/main/support/operatorDebugTracePack.js`
- `scripts/verify-support-artifact-contents-contract.js`
- `scripts/verify-support-artifact-creation-policy.js`
- `scripts/verify-support-artifact-path-authority.js`
- targeted `rg` search over snapshot / trace-pack / raw payload references

## 1. Overall Security Posture

The accepted contents contract is safe and coherent as a pre-writer-hardening contract.

It correctly separates support artifacts from Atlas truth layers: support artifacts are support/recovery/debug material, not Evidence/EVEidence, Discovery, Observation, Assessment Memory, product truth, or deletion/pruning authority.

The contract is strongest where it:

- treats runtime DB snapshots as high-sensitivity corpus-adjacent support that may contain existing DB contents without becoming new Evidence/EVEidence
- forbids raw ESI payload dumps, full provider response bodies, full participant payload strings, secrets, unbounded dumps, and Evidence/EVEidence export packaging in trace packs
- keeps readiness/preflight exports and light operational logs scoped to posture/support
- requires basis/provenance disclosure and sensitivity posture per artifact class
- keeps the preview read-only and non-authoritative

## 2. Blocking Issues

No blocking issues found in the contract preview itself.

Atlas can proceed to a read-only writer conformance gap map.

Do not proceed directly to writer behavior changes or artifact creation hardening from this review. The next safe seam is mapping existing writers against the accepted contract without changing them.

## 3. Non-Blocking Risks / Future Hardening Notes

Trace-pack long text fields need conformance attention. Existing `operatorDebugTracePack.js` includes bounded `error_summary`, `error_message`, `data_quality_warnings.message`, `latest_refs.last_error`, task error messages, and smoke artifact paths. These are bounded by row count, but not visibly length-truncated or classified by text sensitivity. This is not a contract blocker, but it is a prime writer-conformance check.

Local paths are intentionally allowed with sensitivity. Existing trace packs include `database_path`, `temp_root`, path-state summaries, and smoke artifact paths. This matches the contract only if future writer conformance keeps path disclosure explicit, sensitive, and support-scoped.

The trace-pack contract says limits must be disclosed. Existing trace packs use a `limit` internally but do not appear to include a top-level `limit` / `sample_limit` field in the emitted pack. Future conformance should add or map a clear disclosure.

Artifact class naming should be normalized in the gap map. The contents contract uses `readiness_preflight_export`; path authority uses `readiness_preflight_reports`; creation policy uses `readiness_preflight_export`. This is not unsafe, but a conformance map should avoid drift.

Snapshots are correctly classified as high-sensitivity DB copies, but future creation hardening should ensure the returned creation result or a sidecar/manifest carries the same sensitivity/non-authority disclosure. The SQLite file itself cannot explain its boundary to a future operator.

## 4. Artifact Class-Specific Concerns

### `runtime_snapshot_rolling`

Safe as contract. It honestly allows existing DB-copy contents, including raw ESI payloads, Discovery refs, Evidence/EVEidence rows, Hydration rows, Watch state, and Assessment Memory as copied DB content only.

Concern for writer conformance: creation metadata should disclose snapshot class, generated time, source DB path, storage/budget context, and recovery-only purpose.

### `runtime_snapshot_retained`

Safe as contract. It correctly marks retained snapshots as high-sensitivity corpus-adjacent support that may outlive active records and must not override deletion/pruning policy.

Concern for writer conformance: retained path disclosure and cleanup responsibility should be visible. Future deletion/pruning UX must not treat retained snapshots as hidden retained deletion footprint authority.

### `operator_debug_trace_pack`

Safe as contract, with the largest conformance risk.

The current writer appears aligned on major exclusions: it excludes `raw_esi_payload`, full participant payloads, full API response bodies, and SDE zip contents; it emits summaries for readiness, corpus health, fetch runs, API request logs, task history, warnings, queue status, and smoke artifacts.

Conformance concerns:

- latest Discovery refs must remain bounded summaries, not export packages or truth claims
- warning/error/free-text fields need truncation or explicit max-length treatment
- local paths need sensitivity disclosure
- emitted pack should disclose sample limit and exclusions as contract-level metadata

### `light_operational_logs`

Safe as contract. It forbids raw provider payloads, raw ESI payloads, secrets/tokens, full Evidence/EVEidence rows, full Discovery refs, and Assessment Memory narratives.

Concern for writer conformance: future log writers must avoid body dumps and must not let error strings smuggle provider response bodies or secrets.

### `readiness_preflight_export`

Safe as contract. It is scoped to posture, checks, counts, path/storage/External I/O gate status, and non-secret runtime configuration posture.

Concern for writer conformance: future exports should not present readiness/preflight as product truth, Observation, Evidence, or pruning authority. Path details should remain sensitive support posture.

## 5. Writer-Conformance Risks To Check Next

Recommended read-only conformance map should check:

- `operatorDebugTracePack.js` against every `operator_debug_trace_pack` allowed/forbidden/redaction field
- all emitted text fields for maximum length, truncation, or summary policy
- all emitted path fields for sensitivity labels and whether renderer-origin path claims can influence output
- whether trace packs disclose `limit`, generated time, DB basis, exclusions, and support/debug classification clearly enough
- whether `queue_status.latest_refs` remains bounded summary and does not become Discovery export as truth
- whether API request logs can ever contain secrets or full provider response bodies in `endpoint` or `error_message`
- whether runtime snapshots return or accompany enough boundary metadata for operator cleanup and deletion/pruning review
- whether readiness/preflight exports share a class id with the accepted contract or need an alias table
- whether future light logs have contract tests before any file writer exists

## 6. Recommended Changes To The Contract

No required contract changes before a conformance gap map.

Useful future refinements:

- add explicit max-length / truncation posture for free-text fields in trace packs and logs
- add explicit "path disclosure is sensitive" wording to snapshot classes, matching trace/log/readiness posture
- add `sample_limit_disclosure_required` to trace packs
- add a class-id alias or normalization note for `readiness_preflight_export` vs `readiness_preflight_reports`
- add explicit "provider endpoint must not contain secret query params" to logs and trace packs

These are hardening refinements, not blockers.

## 7. Can Atlas Proceed To A Read-Only Writer Conformance Gap Map?

Yes.

Recommended next seam:

```txt
Read-only writer conformance gap map between existing snapshot/trace-pack/readiness support code and support.artifact_contents_contract.preview.
```

Acceptance shape:

- no writer behavior changes
- no support artifact creation
- no snapshot creation
- no trace-pack creation
- no log/export file creation
- no provider calls
- no DB/file mutation
- no schema/UI/runtime enforcement work
- compare existing writer output shape statically and through existing fixture evidence only where already safe
- produce gaps as advisory rows by artifact class, field/path, contract rule, current behavior, risk, and recommended later hardening

## 8. Verification / Evidence Reviewed

Commands run:

```powershell
npm.cmd run verify:support-artifact-contents-contract
npm.cmd run verify:support-artifact-creation-policy
npm.cmd run verify:support-artifact-path-authority
```

Results:

- `verify:support-artifact-contents-contract` passed. It verified 5 contract classes, 3 high-sensitivity classes, raw ESI payloads forbidden for trace packs/logs/readiness exports, DB-copy allowance limited to snapshot classes, and all classes non-authoritative.
- `verify:support-artifact-creation-policy` passed. It verified renderer payload anti-forgery, External I/O non-authorization, local-only support posture, and budget/path/confirmation/trusted-context policy posture.
- `verify:support-artifact-path-authority` passed. It verified 10 path authority classes, renderer payload anti-forgery, snapshot postures, corpus-adjacent vs operational support families, and storage-budget inclusion.

Verification intentionally not run:

- snapshot creation verifier
- operator debug trace-pack writer verifier
- large synthetic / restart / partial failure trace-pack writer tests

Reason: those tests create fixture support artifacts. This review was scoped to contract and conformance-readiness only.

Source evidence reviewed:

- `supportArtifactContentsContractService.js` static contract
- `supportArtifactCreationPolicyService.js` creation posture preview
- `supportArtifactPathAuthorityService.js` path/sensitivity/path authority preview
- `runtimeSnapshotService.js` snapshot preflight/create metadata and path controls
- `operatorDebugTracePack.js` trace-pack emitted content shape and exclusions
- verifier assertions for raw payload exclusion, no side effects, renderer anti-forgery, and path authority

## 9. Human / Overseer Decisions Needed

- Should trace-pack free-text fields require explicit truncation/max-length before writer hardening?
- Should trace packs expose local paths in full, redact/user-collapse them, or keep full paths with stronger sensitivity warnings?
- Should snapshot creation produce a sidecar/manifest, or is returned creation metadata sufficient for sensitivity/deletion/pruning disclosure?
- Should `readiness_preflight_export` and `readiness_preflight_reports` be normalized now or simply mapped as aliases in the conformance gap map?
- Should future logs be allowed to include IDs/counts only, or may they include bounded IDs such as killmail IDs and provider endpoints when needed for support?

## Boundary Confirmation

No product code was changed.

No Dev runway was created.

No support artifact writer was changed.

No snapshots, trace packs, logs, files, exports, packages, or directories were created by this review.

No live/provider/private/destructive actions were run.

No terms were renamed and no protected-word JSON was updated.
