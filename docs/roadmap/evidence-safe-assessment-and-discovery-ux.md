# Roadmap: Evidence-Safe Assessment And Discovery UX

Status: Complete
Date: 2026-05-22

## Direction

The scoped zKill discovery handover is accepted. Atlas can now resolve user-entered systems locally, build scoped zKill `pastSeconds` routes, and run a live-gated discovery-only smoke.

The next milestone should tighten the assessment boundary and make the newest discovery contract usable without weakening the evidence rule.

Core principle:

```txt
zKill discovery refs are possible evidence.
Expanded ESI killmails are evidence.
Reports are observations over stored evidence.
Assessment artifacts are deliberate memory, not evidence.
```

## Mission

Make assessment artifacts safer to create and easier to trust by validating their cited evidence context, then decide how the renderer should expose discover-refs-only system/radius work through the existing controlled action model.

## Task Chain

1. Validate assessment artifact citations.
2. Add explicit citation/evidence-link status for assessment artifacts.
3. Connect compaction preview to validated assessment creation without enabling evidence deletion.
4. Decide and implement the scoped discover-refs-only UI path.
5. Improve the live scoped zKill smoke ergonomics and artifacts.
6. Add evidence-rule regression checks and record a handover.

## Why Now

The current assessment artifact model correctly separates assessment from evidence, but it can accept cited killmail IDs and evidence scopes without proving that those IDs exist in the local evidence corpus.

That is not a raw evidence mutation bug, but it is an integrity gap in the assessment layer.

The newest scoped zKill handover also raises a UI question: should the renderer expose a specific discover-refs-only system/radius action, or continue routing it through the existing Actions pane? This should be resolved while the contract is fresh.

## Guardrails

- Do not allow assessment artifacts to become raw evidence.
- Do not auto-create assessment artifacts for every observed entity.
- Do not enable raw evidence deletion in this milestone.
- Do not treat zKill previews as observations.
- Do not auto-expand after manual discovery.
- Do not add new hidden live collection paths.
- Do not make the renderer compute evidence meaning.

## Acceptance Gate

This milestone is complete when:

- assessment artifact creation validates or explicitly labels citation status
- score-bearing artifacts still require reason or summary
- compaction remains preview-only unless explicitly converted through validated artifact creation
- renderer discovery UX clearly distinguishes queued refs from evidence
- live scoped zKill smoke has useful artifacts and refusal behavior
- `npm.cmd run verify:all` passes
- any live smoke remains separate and gated by `AURA_ATLAS_LIVE_API=1`

Completion note:

These acceptance gates were met on 2026-05-22. The active gap folder is clear for this milestone, and the handover is recorded in `docs/audits/audit-2026-05-22-evidence-safe-assessment-discovery-ux-handover.md`.

## Related Task Files

- `docs/gap/complete/assessment-citation-validation.md`
- `docs/gap/complete/assessment-artifact-citation-status.md`
- `docs/gap/complete/compaction-preview-to-assessment-interlock.md`
- `docs/gap/complete/scoped-discovery-ui-path-decision.md`
- `docs/gap/complete/live-scoped-zkill-smoke-artifacts.md`
- `docs/gap/complete/evidence-rule-regression-checks.md`

## Related Documents

- `docs/tenets/tenets.md`
- `docs/contracts/assessment-compaction-contract.md`
- `docs/contracts/report-scope-contract.md`
- `docs/features/entity-interest-artifacts.md`
- `docs/features/evidence-compaction-to-assessment.md`
- `docs/features/ui-trigger-and-scope-map.md`
- `docs/audits/audit-2026-05-22-scoped-zkill-discovery-handover.md`
