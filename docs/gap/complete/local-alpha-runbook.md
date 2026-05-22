# Local Alpha Runbook

Milestone: Local Alpha Trial Readiness

## Mission

Create a step-by-step runbook for a local alpha trial.

The runbook should tell the operator how to use Atlas safely in an offline-first way, then optionally how to run one live-gated trial if a respectful target/window is chosen.

## Actionables

- Add a runbook under `docs/runbooks` or another suitable docs folder.
- Include preflight:
  - project path
  - `npm install` if needed
  - `npm run verify:all`
  - `npm run smoke:electron`
  - SDE/topology readiness
  - runtime DB path
- Include offline trial path:
  - open app
  - inspect readiness
  - inspect corpus health
  - run existing fixture/offline checks
  - inspect reports/support surfaces where possible
  - create snapshot
  - create debug trace pack
- Include optional live-gated path:
  - live env variable
  - target/window/cap discipline
  - expected zKill-only versus ESI expansion behavior
  - stop conditions
- Include after-action review:
  - what artifact paths to preserve
  - what counts to record
  - how to report confusion or defects

## Acceptance Checks

- Runbook can be followed without live APIs.
- Live section is clearly optional and gated.
- Runbook does not ask the operator to prune evidence.
- Runbook reinforces that queued refs are not evidence.

## Dev Notes

```txt
Completed 2026-05-22.

Added docs/runbooks/local-alpha-trial.md.

The runbook is offline-first and covers preflight, verification, Electron smoke,
Readiness, corpus health, scope validation, queue/watch inspection, reports,
assessment review, runtime snapshots, debug trace packs, optional live-gated
trial discipline, stop conditions, and after-action artifact capture.
```
