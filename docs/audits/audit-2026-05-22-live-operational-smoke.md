# Audit: Live Operational Smoke

Date: 2026-05-22
Milestone: Operational Workflow Hardening
Scope: controlled manual discovery and session-armed watch executor smoke against a disposable runtime DB.

## Summary

Atlas live operation was exercised cautiously through explicit gates and a disposable DB.

DB:

```txt
F:\Projects\AURA-Atlas\.tmp\operational-live-smoke.sqlite
```

Local topology was imported into the disposable DB from the existing local SDE zip before live collection. The SDE zip was used as import material only; runtime collection used SQLite lookup tables.

## Manual Discovery Smoke

Command path:

```txt
npm.cmd run manual:discover -- --scope system --system ZTS-4D --lookback-seconds 3600 --max-systems 1 --max-refs-per-system 2
```

Environment:

```txt
AURA_ATLAS_LIVE_API=1
AURA_ATLAS_DB_PATH=F:\Projects\AURA-Atlas\.tmp\operational-live-smoke.sqlite
```

Scope:

```txt
system:30004660
ZTS-4D
lookback: 3600 seconds
max refs per system: 2
```

Result:

```txt
run_id: run_1779462699741_62944126
zKill calls: 1
ESI calls: 0
zKill refs discovered: 0
queued refs written: 0
killmails written: 0
activity events written: 0
status: success
```

Boundary confirmed:

Manual discovery queued refs only and attempted no ESI expansion.

## Environment Failure Observation

A first sandboxed attempt could not reach zKill and recorded:

```txt
run_id: run_1779462679859_966af0f1
warning: zKill discovery failed for system 30004660: fetch failed
zKill calls logged: 1
ESI calls: 0
killmails written: 0
activity events written: 0
```

This was useful failure behavior: the run preserved diagnostics without writing evidence or retrying blindly.

## Session-Armed Watch Executor Smoke

Path:

```txt
watch.executor.arm
```

Seeded watch:

```txt
watch_type: system_radius
center system: ZTS-4D [30004660]
radius: 0
lookback: 1 hour
max systems: 1
max killmails per run: 2
poll interval: 60 minutes
```

Result:

```txt
task_id: task_1779462745008_a21c1830
task type: watch.executor.system.radius.watch
task status: succeeded
collection run_id: run_1779462745015_8d30b82d
systems planned: 1
systems scanned: 1
zKill calls: 1
ESI calls: 0
zKill refs discovered: 0
expanded new: 0
killmails written: 0
activity events written: 0
warnings: none
```

Watch state after task:

```txt
last_success_at: 2026-05-22T15:12:25.379Z
last_error_at: null
next_poll_at: 2026-05-22T16:12:25.379Z
backoff_until: null
```

Boundary confirmed:

The executor dispatched one due watch through the task system, recorded success, and did not create evidence because no zKill refs were discovered in scope.

## Disposable DB Counts After Smoke

```txt
fetch_runs: 3
api_request_logs: 3
discovered_killmail_refs: 0
killmails: 0
activity_events: 0
```

## Passive View Boundary

No passive renderer view was used to trigger live collection. The tested paths were explicit command/service paths only:

- `manual:discover`
- `watch.executor.arm`

Passive readiness, report, queue preview, and watch status behavior remains covered by offline verification.

## Notes

This smoke did not prove ESI expansion behavior because the selected one-hour ZTS-4D window returned no zKill refs. That is acceptable for this slice because the goal was to prove explicit live gating, diagnostics, queue/evidence boundary behavior, and session-armed dispatch behavior.

Future live smoke can use a target/window with known recent refs when expansion behavior needs to be observed from the UI.

## Related Files

- `docs/gap/complete/live-operational-smoke.md`
- `docs/gap/complete/evidence-creating-ui-actions.md`
- `docs/gap/complete/session-armed-watch-executor-implementation.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
