# Current State: Report Products

Date: 2026-05-22

## What Exists

AURA Atlas currently has CLI/text report products for:

- run diagnostics
- system evidence
- observed operators
- radius evidence
- actor evidence
- corporation observation
- actor metadata readiness
- corporation metadata readiness
- queue status
- metadata status
- evidence corpus health

The renderer currently has native structured presentation for:

- actor evidence reports
- radius evidence reports
- Investigation first-screen stored-evidence detail summaries and observation previews backed by the same structured actor/radius report services
- local evidence corpus health in the Readiness view
- queue/watch preview state
- task/readiness/service status surfaces
- manual discovery and manual expansion task actions
- assessment artifact creation flow

The backend exposes native structured actor and radius report responses. The renderer consumes those responses without parsing CLI text or recomputing observations.

The Investigation first screen can now load a compact read-only stored-evidence detail for a validated actor/system/radius lead. It summarizes evidence counts and previews observations from structured report responses, while leaving raw IDs, normalized payloads, and fuller report/assessment work in the Reports surface.

The Reports / Assessment surface now presents actor-report assessment-memory eligibility before save: citation basis, cited killmail IDs, evidence window, local verification timing, and deliberate reason/summary plus confirmation requirements. Radius reports remain observation/context surfaces for this slice and do not become assessment-memory save contexts.

## Report Structure

Observation reports use:

- `Evidence Basis`
- `Collection Provenance`
- scoped observation sections
- warnings

Run reports focus on collection diagnostics and provenance.

## Evidence Rule

Observation sections are derived from:

- `killmails`
- `activity_events`
- local metadata joins

They do not derive observations from:

- zKill summary blobs
- pending queue refs
- at-a-glance preview metadata

Assessment artifacts are separate work products. They may cite report context and stored killmail IDs, but the assessment layer does not become an evidence source.

## Current Verification

- `verify:report-scope`
- `verify:operators`
- `verify:radius-report`
- `verify:actor-report`
- `verify:report-response`
- `verify:corporation-report`
- `verify:metadata-status`
- `verify:corpus-health`
- `verify:assessment-artifacts`
- `verify:evidence-rules`
- `verify:controlled-workflow`

The controlled workflow check runs reports after mixed collection lanes have written to the same disposable DB. This is the current pre-UI confidence check that reports can read stored evidence without depending on how evidence was discovered.

`report.actor`, `report.radius`, and queue report paths now return structured responses for renderer presentation while retaining text output for CLI/export where appropriate.

`report.corpus_health` is now a read-only structured service response and `report:corpus-health` is available for CLI/export. It checks local SQLite corpus counts, integrity signals, warning groups, and operational freshness without parsing SDE zip files, calling zKill/ESI, or making assessment claims.

The renderer exposes corpus health in the Readiness view as a local operational readiness surface. It uses the structured `report.corpus_health` response and does not parse report text or trigger live API work.

## Current Constraint

Report meaning must remain backend-owned.

The renderer may render structured sections and text export. It must not parse CLI text, recompute observations, infer assessment, or treat pending discovery refs as evidence.

## Current Presentation Status

The previous queue report text export issue has been completed and moved to `docs/gap/complete/queue-report-text-export-fix.md`.

Current presentation work should focus on operator workflow clarity rather than bug repair:

- make citation status readable when assessment artifacts are shown
- keep discovery queue language visibly separate from evidence language
- preserve backend-owned report meaning as more renderer surfaces are added
