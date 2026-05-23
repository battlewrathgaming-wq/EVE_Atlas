# Complete: Report Response Contract

Status: Complete For IPC Shell Preparation

## Actionables

- Define standard response sections for reports.
- Include evidence scope, evidence basis, observations, provenance, warnings, and display metadata.
- Preserve raw IDs in report responses.
- Include partial/complete sample status.
- Keep report output independent from collection method unless report is a run report.

## Task Requirements

Reports should have stable backend response shapes before UI components are built.

Suggested common structure:

```txt
scope
evidence_basis
observations
collection_provenance
warnings
labels
raw_ids
generated_at
```

Report types:

- run report
- system evidence report
- radius evidence/observation report
- operator observation report
- actor report
- corporation observation report
- queue report

## Guardrails

- Evidence reports answer what stored evidence exists.
- Observation reports answer what patterns are visible.
- Run reports answer what happened during collection.
- Reports must not imply staging, ownership, residency, or affiliation without explicit assessment.

## Completion Signal

Renderer report components can consume stable report objects without re-deriving evidence meaning in UI code.

## Current Implementation

- `report.build` service command builds structured report responses by type.
- Report-specific read-only service commands exist for actor, corporation, queue, radius, run, and system reports.
- Response envelopes include scope, evidence basis, observations, collection provenance, warnings, labels, raw IDs, generated timestamp, and retained text output.
- Existing CLI text reports remain intact.
- Verified by `verify:report-response` and `verify:service-registry`.

## Remaining Follow-On Work

- Renderer components still need to consume the structured response.
- Future deeper report refactors can replace text-derived sections with native structured query rows.
- Reports should continue avoiding assessment claims unless an explicit assessment artifact is produced.
