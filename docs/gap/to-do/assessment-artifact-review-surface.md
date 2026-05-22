# Assessment Artifact Review Surface

Milestone: Operator Evidence Operations Readiness

## Mission

Make assessment artifacts reviewable without letting them masquerade as evidence.

Assessment is deliberate memory. The UI/reporting surface should expose that clearly.

## Actionables

- Add or improve a read path for assessment artifacts.
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

## Acceptance Checks

- Assessment read path is structured for renderer use.
- Evidence IDs remain visible in review output.
- Citation status is not hidden in a JSON blob only.
- No assessment artifact mutates raw killmail evidence.

## Dev Notes

```txt

```
