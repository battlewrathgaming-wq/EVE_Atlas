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
- `verify:corporation-report`
- `verify:metadata-status`
- `verify:controlled-workflow`

The controlled workflow check runs reports after mixed collection lanes have written to the same disposable DB. This is the current pre-UI confidence check that reports can read stored evidence without depending on how evidence was discovered.
