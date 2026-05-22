# Audit: Overseer Operator Readiness Review

Date: 2026-05-22

Scope: Review Dev progress after the first Operator Evidence Operations Readiness tasks.

Reviewed commits:

- `62c2596 Add evidence corpus health report`
- `ad28ddc Review live scoped discovery smoke`

Reviewed artifacts:

- `docs/audits/audit-2026-05-22-live-scoped-discovery-success-smoke-review.md`
- `docs/gap/complete/evidence-corpus-health-report.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-report-products.md`

## Verification

Offline verification:

```txt
npm.cmd run verify:all
```

Result: passed.

The suite now runs 49 scripts and includes `verify:corpus-health`.

Electron smoke:

```txt
npm.cmd run smoke:electron
```

Result: passed.

Read-only corpus health sample:

```txt
npm.cmd run report:corpus-health
```

Result: passed against the default dev DB.

The sample output clearly labels the report as local corpus health, not observation and not assessment.

## Review Findings

### Accepted: Live Scoped Discovery Success Smoke

The live scoped zKill success smoke was run under explicit `AURA_ATLAS_LIVE_API=1` control.

The reviewed run:

- used one scoped zKill route for `ZTS-4D [solarSystemID: 30004660]`
- made one zKill API call
- made zero ESI calls
- wrote zero `killmails`
- wrote zero `activity_events`
- wrote zero queued refs because the selected route/window returned no refs

The zero-ref outcome is acceptable for a boundary smoke. It proves the live discovery-only path can execute without crossing into evidence creation.

### Accepted: Evidence Corpus Health Report

The corpus health report is correctly shaped as an operational readiness report:

- read-only
- local SQLite only
- no zKill calls
- no ESI calls
- no SDE zip parsing at report time
- no assessment inference

It reports counts, integrity signals, warning groups, and freshness. It is exposed through both CLI and `report.corpus_health`.

### Boundary Check

No evidence-rule violation was found in this review pass.

The current layering remains:

```txt
discovery refs -> possible evidence/provenance
expanded ESI killmails -> evidence
activity_events -> normalized observations from evidence
reports -> scoped presentation
assessment_artifacts -> deliberate assessment memory
corpus health -> operational readiness
```

## Concerns For Next Handoff

These are not blockers, but they should be resolved or explicitly deferred in the next Dev handoff.

### Concern 1: Zero-Ref Live Smoke Proves Boundary, Not Positive Discovery

The successful live scoped discovery smoke returned zero refs. This is valid for proving live gating and no-evidence behavior, but it does not prove the artifact shape under a positive queued-ref result.

Next handoff should either:

- run a second conservative positive-ref live discovery-only smoke, or
- explicitly defer that to avoid unnecessary live API use.

Do not expand refs as part of this concern.

### Concern 2: Corpus Health Has No Renderer Surface Yet

The corpus health report exists as CLI and service response. It is not yet visible in the renderer.

Next handoff should decide whether corpus health belongs:

- on Readiness as an operator health panel
- on Reports as a local corpus report
- in a later Support/Diagnostics view

The preferred first step is a read-only renderer surface with no live work.

### Concern 3: Snapshot Must Precede Any Pruning

Retention and destructive work should remain blocked until snapshot/restore preflight exists and is verified.

Next handoff should not add evidence pruning.

### Concern 4: Assessment Review Surface Is Partly Implemented

The renderer already lists assessment artifacts and displays citation status/details, but the open task should be closed only after explicit verification confirms:

- citation status is visible
- cited killmail counts are visible
- evidence IDs remain visible
- assessment wording cannot be mistaken for evidence

### Concern 5: Trace Pack Scope Must Avoid Becoming Export-All

The future trace pack should help handoffs and debugging, but it should not quietly become a full evidence export or DB exfiltration path.

It should summarize and reference artifacts, not dump raw evidence by default.

## Recommended Next Order

1. Runtime DB snapshot and restore preflight.
2. Corpus health renderer surface.
3. Operator workflow scenario smoke.
4. Assessment artifact review closure.
5. Operator debug trace pack.
6. Optional positive-ref scoped discovery smoke, if a respectful target/window is chosen.

## Handoff Instruction

Continue the Operator Evidence Operations Readiness milestone.

Keep the work support-oriented:

- safety before deletion
- visibility before automation
- local reports before live calls
- explicit operator actions before background behavior

No passive broad ingestion should be added from this checkpoint.
