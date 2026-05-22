# Contract: Report Scope

Status: Active
Date: 2026-05-22

## Purpose

Report scope defines what stored evidence a report observes.

Collection provenance explains how evidence entered Atlas. It does not define the observation scope.

## Boundary

Owned by:

- system reports
- radius reports
- operator reports
- actor reports
- corporation reports
- run reports

## Inputs

- stored `killmails`
- stored `activity_events`
- evidence window
- actor/system/radius/corporation scope
- local metadata lookup tables
- provenance records for footer/context only

## Outputs

- Evidence Basis section
- Collection Provenance section
- observation tables derived from stored evidence
- warnings and sample status

## Invariants

- Observation reports filter by what evidence describes: actor, system, radius, corporation, and time.
- Run reports explain a collection run.
- Observation reports must show evidence window and sample size.
- Partial samples must be labeled.
- Reports may show provenance tags such as `manual_actor`, but must not use them as the main evidence filter.

## Must Not Do

- Do not make observations from zKill summary or queue-only refs.
- Do not imply ownership, staging, affiliation, or intent from repeated presence.
- Do not hide evidence because of disposition or watchlist state.

## Verification

- `verify:report-scope`
- `verify:operators`
- `verify:radius-report`
- `verify:actor-report`
- `verify:corporation-report`
- `verify:manual-discovery`

