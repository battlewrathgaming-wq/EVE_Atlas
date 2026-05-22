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

The renderer currently has native structured presentation for:

- actor evidence reports
- radius evidence reports
- queue/watch preview state
- task/readiness/service status surfaces

The backend exposes native structured actor and radius report responses. The renderer consumes those responses without parsing CLI text or recomputing observations.

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

## Current Verification

- `verify:report-scope`
- `verify:operators`
- `verify:radius-report`
- `verify:actor-report`
- `verify:report-response`
- `verify:corporation-report`
- `verify:metadata-status`
- `verify:controlled-workflow`

The controlled workflow check runs reports after mixed collection lanes have written to the same disposable DB. This is the current pre-UI confidence check that reports can read stored evidence without depending on how evidence was discovered.

`report.actor` and `report.radius` now return native structured responses for renderer presentation while retaining text output for CLI/export.

## Current Constraint

Report meaning must remain backend-owned.

The renderer may render structured sections and text export. It must not parse CLI text, recompute observations, infer assessment, or treat pending discovery refs as evidence.

## Known Presentation Follow-Up

The queue report text export path needs a small renderer fix so structured queue report responses do not display as `[object Object]`.

Tracked by:

- `docs/gap/to-do/queue-report-text-export-fix.md`
