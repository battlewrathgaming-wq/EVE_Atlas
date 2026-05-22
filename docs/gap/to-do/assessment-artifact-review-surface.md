# Assessment Artifact Review Surface

Milestone: Operator Evidence Operations Readiness

## Mission

Make assessment artifacts reviewable without letting them masquerade as evidence.

Assessment is deliberate memory. The UI/reporting surface should expose that clearly.

Note: the renderer already has an assessment artifact list/detail surface. This task is now a closure and hardening pass, not necessarily a from-scratch build.

## Actionables

- Add or improve a read path for assessment artifacts.
- Review the existing renderer assessment list/detail behavior before adding new UI.
- Show:
  - artifact type
  - entity scope
  - interest score if present
  - status
  - citation status
  - cited killmail IDs
  - evidence window
  - created/updated timestamps
- Make citation status visible:
  - `verified`
  - `partial`
  - `unverified`
  - `not_applicable`
- Keep wording distinct from evidence and observation reports.
- Do not use assessment artifacts as a source for observation reports.
- Add fixture-backed verification for display/read response.
- Add renderer/static verification that citation status and citation basis are visible.

## Acceptance Checks

- Assessment read path is structured for renderer use.
- Evidence IDs remain visible in review output.
- Citation status is not hidden in a JSON blob only.
- No assessment artifact mutates raw killmail evidence.
- Existing renderer behavior is either accepted and documented, or corrected with a narrow patch.

## Dev Notes

```txt

```
