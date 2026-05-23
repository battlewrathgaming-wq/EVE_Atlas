# Gap To-Do: Assessment Artifact Citation Status

Status: Complete
Roadmap: `docs/roadmap/evidence-safe-assessment-and-discovery-ux.md`

Completed: 2026-05-22

## Task Requirement

Represent the evidence basis of an assessment artifact explicitly.

## Why It Matters

Assessment artifacts are durable memory. They should say whether their cited evidence was verified at creation time, partially available, unavailable, or deliberately omitted.

## Actionables

- Add a small citation status model such as:
  - `verified`
  - `partial`
  - `unverified`
  - `not_applicable`
- Include citation status in assessment artifact outputs.
- Consider a small evidence-link table only if it stays lightweight and read-only for this milestone.
- Render citation status in the assessment detail UI.

## Guardrails

- Do not turn citation status into proof of interpretation.
- Do not require Atlas to keep all old raw evidence forever before assessment artifacts are useful.
- Do not enable evidence pruning here.
- Do not hide missing citation status.

## Completion Signal

- Assessment artifact detail shows citation status.
- Verification proves status serialization/deserialization.
- UI copy still says assessment memory is not evidence.

## Completion Notes

Assessment artifacts now store creation-time citation status:

- `verified`
- `partial`
- `unverified`
- `not_applicable`

Current creation behavior is intentionally strict:

- valid cited killmail samples are stored as `verified`
- missing cited killmail IDs are rejected instead of persisted as weak memory
- artifacts with no cited killmail IDs are stored as `not_applicable`

Stored citation details include:

- cited killmail IDs
- verified killmail IDs
- missing killmail IDs
- actor scope validation details where relevant
- a short note explaining the basis

The renderer assessment detail now shows citation status and a compact citation basis line. This is assessment metadata only; it does not make the assessment artifact evidence.

## Related Files

- `src/main/db/schema.sql`
- `src/main/assessment/assessmentArtifactRepository.js`
- `src/renderer/reports.js`
- `scripts/verify-assessment-artifacts.js`
