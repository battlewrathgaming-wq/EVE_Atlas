# Gap To-Do: Live Operational Smoke

Status: Open
Priority: P1
Milestone: Operational Workflow Hardening

## Mission Statement

Prove Atlas live operation cautiously, with real zKill/ESI paths exercised only through explicit gates, disposable runtime state, and visible task/report outcomes.

## Items For Completion

- Run a controlled manual discovery live smoke from the renderer or service boundary.
- Run a controlled session-armed watch executor live smoke if a safe due watch is available.
- Keep live API enabled only through explicit `AURA_ATLAS_LIVE_API=1`.
- Use a disposable DB under `F:\Projects\AURA-Atlas\.tmp`.
- Keep caps conservative and visible.
- Confirm task progress, warnings, API counts, queue refs, and evidence counts after each run.
- Record any API failure behavior, rate-limit behavior, or user-ergonomics issue.
- Confirm passive views still do not dispatch live collection.

## Guardrails

- No broad scraping.
- No hidden live work from page load, readiness refresh, report view, queue preview, or watch status refresh.
- Do not convert live smoke into routine polling.
- Do not test on the main user DB unless explicitly requested.
- If a live test fails, preserve the task/run diagnostics rather than retrying blindly.

## Completion Signal

A short smoke note or audit entry records:

- command/UI path used
- DB path
- scope/caps
- API call counts
- queued refs / expanded killmails / activity events
- warnings/errors
- whether passive views remained non-collecting

## Related Documents

- `docs/audits/Audit_handover_dev-runtime-process-isolation-review-2026-05-22.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/gap/complete/evidence-creating-ui-actions.md`
- `docs/gap/complete/session-armed-watch-executor-implementation.md`
