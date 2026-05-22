# Audit Handover: Dev Operator Readiness

Date: 2026-05-22

## Status

Clean checkpoint.

Latest reviewed commits:

- `2629034 Add runtime DB snapshot preflight`
- `62c2596 Add evidence corpus health report`
- `ad28ddc Review live scoped discovery smoke`

The Operator Evidence Operations Readiness milestone is in progress. The live discovery boundary, local corpus inspection, and snapshot safety work are complete enough to support the next UI/operator workflow passes.

## Completed In This Checkpoint

- Live scoped zKill discovery success-smoke was reviewed and audited.
- Evidence corpus health report was added as CLI and structured service response.
- Runtime DB snapshot preflight and explicit snapshot creation were added.
- Snapshot verification opens the snapshot and confirms core counts plus raw ESI payload/checksum preservation.
- `verify:all` passed after the snapshot slice with 50 scripts.

## Current Remaining To-Do

- `corpus-health-renderer-surface.md`
- `operator-workflow-scenario-smoke.md`
- `assessment-artifact-review-surface.md`
- `operator-debug-trace-pack.md`
- `positive-ref-scoped-discovery-smoke-decision.md`

## Issues And Concerns To Raise

### Zero-Ref Live Discovery Smoke

The accepted live scoped discovery smoke proves the boundary and live gate, but it did not discover refs in the selected ZTS-4D window. That is acceptable for no-evidence behavior, but it does not prove the success artifact shape when queued refs are present.

Recommendation: either choose a conservative known-active target/window for a positive discovery-only smoke, or explicitly defer to avoid more live calls. Do not expand refs as part of that task.

### Corpus Health Is Backend-Ready But Not Renderer-Visible

`report.corpus_health` and `report:corpus-health` exist and are verified. The operator still cannot inspect corpus health from the Electron shell.

Recommendation: add the smallest renderer surface, probably under Readiness or Reports, using the structured response. Do not parse text and do not run live work.

### Snapshot Exists, But Restore Is Still Verification-Only

Snapshot creation is explicit and verified. There is no operator-facing restore action, which is appropriate for now.

Recommendation: keep restore as open/verification behavior until retention/destructive actions are closer. Do not add pruning yet.

### Assessment Review Needs Closure, Not A New Concept

The renderer already has assessment list/detail behavior. The remaining task should verify that citation status, citation basis, cited IDs/counts, and assessment/evidence wording are visible enough.

Recommendation: treat this as a closure/hardening pass, not a new assessment system.

### Trace Pack Must Stay Bounded

The future debug trace pack could accidentally become an export-all feature.

Recommendation: make it summarize run/report/task state and reference artifact paths. Do not dump raw ESI payloads or broad evidence rows by default.

## Recommended Next Order

1. Add the corpus health renderer surface.
2. Add the operator workflow scenario smoke.
3. Close/harden the assessment artifact review surface.
4. Add a bounded operator debug trace pack.
5. Decide whether to run or defer the positive-ref discovery-only smoke.

## Boundary Confirmation

- No evidence pruning is implemented.
- No passive broad ingestion is implemented.
- zKill refs remain possible evidence/provenance only.
- Expanded ESI killmails remain the evidence source.
- Assessment artifacts remain deliberate memory, not evidence.
- Snapshot creation does not mutate, prune, or compact evidence.
