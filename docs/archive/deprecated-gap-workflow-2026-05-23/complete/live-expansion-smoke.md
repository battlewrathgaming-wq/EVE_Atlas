# Gap To-Do: Live Expansion Smoke

Status: Complete
Priority: P1
Milestone: Controlled Actor/Area Operation

## Mission Statement

Run one deliberately scoped live smoke where zKill returns refs and Atlas expands at least one ESI killmail, proving the UI/service path from possible evidence to stored evidence.

## Items For Completion

- Pick a target/window with known recent zKill refs.
- Use a disposable DB under `F:\Projects\AURA-Atlas\.tmp`.
- Keep `AURA_ATLAS_LIVE_API=1` explicit.
- Run manual discovery first.
- Confirm queued refs exist.
- Run manual expansion with a conservative cap.
- Confirm ESI expansion count, killmails written, activity events written, warnings, and API logs.
- Rerun report or queue view to confirm state updates.

## Guardrails

- Do not broaden the target just to force volume.
- Do not run against the main DB unless explicitly requested.
- Do not retry blindly on API failure.
- Keep zKill refs as possible evidence until ESI expansion succeeds.

## Completion Signal

A live smoke audit records at least one successful ESI expansion through the controlled path, with counts and warnings.

Completed:

- Live target: `Mr Jesterman [characterID: 1329523328]`.
- Disposable DB: `F:\Projects\AURA-Atlas\.tmp\live-expansion-smoke.sqlite`.
- Manual discovery queued 5 zKill refs and performed zero ESI expansion.
- Manual expansion expanded 1 queued ref through ESI.
- Stored evidence result: 1 killmail, 8 activity events, 1 ingestion audit.
- Queue state after expansion: 1 expanded / 4 pending.
- API calls: 1 ESI name resolution, 1 zKill discovery, 1 ESI killmail expansion.
- No rate limiting, retries, or expansion failures.
- Audit record: `docs/audits/audit-2026-05-22-live-expansion-smoke.md`.

## Related Documents

- `docs/audits/audit-2026-05-22-live-operational-smoke.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/terms/discovery-queue.md`
- `docs/gap/complete/manual-expansion-and-hydration-ui.md`
