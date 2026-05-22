# Gap To-Do: Assessment Report Workflow UI

Status: Open
Priority: P1
Milestone: Operational Workflow Hardening

## Mission Statement

Turn backend assessment artifacts into a deliberate operator workflow: save assessment memory from report context without confusing assessment with evidence.

## Items For Completion

- Add renderer access to `assessment.create`, `assessment.list`, and `assessment.get`.
- Start from actor or corporation report context.
- Pre-fill entity ID, entity type, cached name, evidence window, source report type, source report parameters, and sample counts where available.
- Require assessment reason or summary.
- Require reasons for any score field.
- Show the evidence/observation/assessment boundary in UI text.
- Add list/detail view for saved assessment artifacts.
- Do not auto-create artifacts for every observed entity.

## Guardrails

- Assessment artifacts are memory, not proof.
- IDs remain durable facts; names are cached labels.
- AI/system suggestions must not become assessment without acceptance.
- Do not expose evidence pruning from this workflow.
- Do not silently overwrite old assessment meaning; future edits should preserve history or supersession.

## Completion Signal

A user can save an assessment artifact from a report context, inspect it later, and see clear language that it is assessment memory separate from raw evidence.

Verification should include:

- `verify:assessment-artifacts`
- `verify:service-registry`
- `verify:renderer-shell`

## Related Documents

- `docs/contracts/assessment-compaction-contract.md`
- `docs/gap/complete/assessment-artifact-persistence.md`
- `docs/terms/entity-interest.md`
- `docs/terms/work-products.md`
- `docs/features/entity-interest-artifacts.md`
