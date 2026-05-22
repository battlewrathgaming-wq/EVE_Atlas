# Audit: Overseer Evidence-Safe Assessment Review

Date: 2026-05-22

Scope: Review Dev handover after the Evidence-Safe Assessment And Discovery UX milestone.

Latest reviewed handover:

- `docs/audits/audit-2026-05-22-evidence-safe-assessment-discovery-ux-handover.md`

Latest reviewed commits included:

- `c32cf25 Add evidence rule regression guard`
- `bc8ddcd Write scoped zkill smoke artifacts`
- `0719de6 Expose scoped discovery action`
- `762e5f9 Interlock compaction preview assessment`
- `c5e9fb5 Validate assessment citations`
- `7f9def7 Add scoped zkill discovery smoke`

## Summary

The handover is accepted.

Atlas remains aligned with the evidence rule:

```txt
zKill refs are discovery/provenance
expanded ESI killmails are evidence
activity_events are normalized observations from stored evidence
assessment_artifacts are deliberate assessment memory
```

The newest work improves the controlled operator path without silently changing evidence semantics.

## Verification Run

Offline verification:

```txt
npm.cmd run verify:all
```

Result: passed.

The grouped offline suite now runs 48 checks, including:

- evidence rule regression guard
- assessment artifact validation
- retention preflight
- manual discovery
- queue selection and scope isolation
- system resolution
- metadata hydration
- controlled workflow
- local scale smoke

Electron smoke:

```txt
npm.cmd run smoke:electron
```

Result: passed.

Artifact:

```txt
F:\Projects\AURA-Atlas\.tmp\electron-visual-smoke\visual-smoke-result.json
```

Live refusal check:

```txt
npm.cmd run verify:live-scoped-zkill
```

Result: refused as expected because `AURA_ATLAS_LIVE_API=1` was not set.

Artifact:

```txt
F:\Projects\AURA-Atlas\.tmp\live-scoped-zkill-smoke\scoped-zkill-refused.json
```

The refusal artifact explicitly states that queued refs and zKill preview fields are discovery/provenance metadata, not killmail evidence.

## Findings

### Accepted

- Manual discovery remains queue-only and makes no ESI expansion calls.
- Scoped zKill discovery is exposed through controlled UI/service paths.
- User-entered system names resolve through local SDE-backed lookup before zKill route planning.
- Assessment citations are validated or explicitly labelled.
- Retention compaction remains preflight/design work unless explicitly converted to an assessment artifact.
- Evidence-rule regression checks are registered in `verify:all`.
- Live scoped zKill smoke leaves structured artifacts for refusal, failure, and success paths.

### Documentation Updated

- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-report-products.md`
- `docs/gap/to-do/README.md`

The stale queue report presentation follow-up was removed from current state because the task has moved to `docs/gap/complete`.

## Residual Risk

The project has not yet completed a fresh successful live scoped zKill smoke under this review pass. The refusal behavior is verified, but success-path artifact review should be treated as a separate live operation.

The renderer is capable enough for controlled workflow presentation, but the next risk is operator clarity under real use:

- assessment status must remain visibly assessment, not evidence
- queue refs must remain visibly possible evidence, not observation
- live work must remain explicit and artifacted
- runtime DB maintenance must not move into destructive pruning before snapshot and assessment preservation rules exist

## Direction

Start the next milestone as operator evidence operations readiness.

The emphasis should be:

- artifact review
- corpus health
- snapshot/restore safety
- controlled workflow scenario testing
- assessment review clarity

Do not start automatic pruning or broad passive ingestion from this checkpoint.
