# DevHS08: Atlas Partial Failure Transaction Integrity

Status: Complete
Date: 2026-05-23
Role: Dev
Milestone: Aggressive Testing And Operator Bug Hunting

## Scope

Executed the HS08 runway in `workspace/current.md`: partial failure and transaction-integrity pressure for interrupted expansion/import/hydration paths, visible diagnostics, evidence preservation, lock release, and explicit retry behavior.

I did not read or interact with the planner scoping document. The only planner-derived requirement honored was the accepted `Mark`/`Watch` distinction already copied into `workspace/current.md`.

## Changes

- Extended `scripts/verify-partial-failures.js` with a service-wrapped manual expansion failure case.
- Added a fixture that seeds accepted raw ESI evidence, queues a separate ref, injects a mid-transaction activity-event persistence failure, and then reruns explicitly after the failed task.
- Updated `docs/current-state/current-ipc-ui-preparation.md` to record that partial-failure verification now covers service/task diagnostics, trace output, and explicit retry.

## Evidence Covered

The new focused check asserts:

- accepted raw ESI evidence remains byte/checksum-preserved after a failed service task
- failed persistence does not leave partial raw killmail rows or activity events
- failed/partial work does not create hidden assessment artifacts or proof-like memory
- failed queue refs remain pending with selection timing for review and explicit retry
- fetch runs, scoped ESI API logs, task history, and support trace packs remain reviewable
- trace packs exclude raw expanded ESI payloads
- same-scope rerun succeeds after failure, proving task lock release
- rerun persists the pending evidence without silently overwriting accepted evidence
- duplicate activity event keys are not introduced

Existing partial-failure coverage still includes:

- partial zKill discovery with warning and queued refs
- failed ESI expansion followed by retry
- direct mid-transaction evidence rollback
- failed metadata hydration without partial entity labels
- interrupted SDE import state with reviewable topology and corpus warnings

## Verification

```txt
npm.cmd run verify:partial-failures
Result: passed
```

```txt
npm.cmd run verify:all
Result: passed
All verification group passed with 59 scripts.
```

Electron smoke was not run because this packet changed offline verification and current-state docs only.

## Files Changed

```txt
scripts/verify-partial-failures.js
docs/current-state/current-ipc-ui-preparation.md
workspace/current.md
workspace/DevHS08-atlas-partial-failure-transaction-integrity.md
```

## Findings

No product bug was found during this packet. The existing rollback, task, run, API log, queue, and support trace behavior supported the expected failure shape once exercised together.

## Deferred

- SDE lookup builder failure modes.
- Larger synthetic scale pressure.
- App restart recovery after running or failed tasks.
- Live API success smoke.
- Operator Investigation Desk UX.

## Recommended Next Packet

Use SDE lookup builder failure modes as the next bounded packet. It is the cleanest follow-on because the audit already names failed download, bad zip/source, interrupted import, cleanup behavior, `AURA_ATLAS_KEEP_SDE_SOURCE=1`, and preserving existing lookup tables after failure as the next unproven failure class.
