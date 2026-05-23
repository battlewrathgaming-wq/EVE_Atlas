# Release Tag Checkpoint Checklist

Milestone: Local Alpha Trial Readiness

## Mission

Define a lightweight checkpoint checklist for local alpha tags.

This is not public release packaging. It is a repeatable way to decide whether a commit is safe to tag as a local alpha checkpoint.

## Actionables

- Create a checklist document for pre-tag review.
- Include:
  - clean git status
  - `verify:all`
  - `smoke:electron`
  - current-state docs reviewed
  - gap/to-do reviewed
  - no unintended live artifacts committed
  - no `.tmp` DB/cache files committed
  - evidence boundary check
  - known limitations recorded
- Include tag naming guidance, for example `atlas-local-alpha-YYYYMMDD-N`.
- Include rollback note using GitHub/tag.

## Acceptance Checks

- Checklist is specific enough for another chat/dev worker to follow.
- Checklist does not require live API calls.
- Checklist keeps packaging/public release out of scope unless explicitly requested.

## Dev Notes

```txt
Completed 2026-05-22.

Added docs/runbooks/local-alpha-release-tag-checklist.md.

The checklist covers clean git status, verify:all, smoke:electron, optional demo
seed, current-state/gap/known-limits review, staged artifact checks, evidence
boundary checks, local alpha tag naming, rollback guidance, and handoff notes.

It does not require live API calls and keeps public packaging out of scope.
```
