# Reporting And Documentation Rule

Status: Active
Updated: 2026-05-23

## Reporting Rule

Atlas reports are presentations of stored evidence, observations derived from that evidence, or deliberate assessments created by the operator.

Reports must not become hidden collection actions.

## Required Report Wording

Every evidence or observation report should make these points clear where relevant:

- scope
- evidence window
- stored killmail count
- activity event count
- partial/capped state
- unresolved metadata
- collection provenance as secondary context
- warnings and data-quality limits

Reports should avoid words that imply more certainty than the evidence supports.

Prefer:

- observed
- repeated appearance
- candidate operator
- multi-system presence
- partial sample
- unresolved
- stale
- capped

Avoid unless explicitly proven:

- confirmed resident
- owner
- staging
- fleet identity
- complete activity
- proof of affiliation

## Documentation Update Rule

Do not update doctrine documents for ordinary implementation details.

Update durable docs when a change alters:

- project meaning
- evidence rules
- report semantics
- contract boundaries
- data shapes
- live/API behavior
- failure lessons
- roadmap direction

For normal code slices, report changes in the final handoff and rely on verification.

Audits should be written for review activity, major handovers, and drift checks, not as a reflex after every fix.
