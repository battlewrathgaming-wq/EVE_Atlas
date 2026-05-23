# DevHS10: Atlas SDE Builder Failure Modes

Status: Complete
Date: 2026-05-23
Role: Dev
Milestone: Aggressive Testing And Operator Bug Hunting

## Scope

Executed the HS10 runway in `workspace/current.md`: SDE lookup builder failure-mode pressure for failed source acquisition, invalid source, interrupted import, cleanup, keep-source behavior, lookup preservation, diagnostics, and evidence-doctrine safety.

I did not read or interact with the planner scoping document. The only planner-derived requirement honored was the accepted `Mark`/`Watch` distinction already copied into `workspace/current.md`.

## Changes

- Extended `scripts/verify-sde-build-lookups.js` with evidence/assessment table immutability assertions across SDE failure paths.
- Added service/task coverage for `sde.build-lookups` invalid-source failure, task history diagnostics, bounded debug trace artifact, cleanup, exclusive-lock release, and explicit successful rerun.
- Updated `docs/current-state/current-ipc-ui-preparation.md` to record the expanded SDE builder failure-mode coverage.

## Evidence Covered

The focused verifier now asserts:

- failed download surfaces the error, cleans temporary build directories, leaves readiness missing, and does not mutate evidence/assessment tables
- invalid source failure cleans temporary build directories, does not mark lookups ready, and does not mutate evidence/assessment tables
- failed refresh preserves existing ready lookup counts and evidence/assessment table counts
- interrupted inventory refresh preserves existing ready topology/type metadata state and evidence/assessment table counts
- keep-source mode preserves source/work artifacts for debugging
- default successful build removes disposable source/build artifacts
- service-wrapped invalid-source SDE build fails visibly as a task
- task history and debug trace pack include the failed SDE task while excluding SDE source contents
- explicit same-command rerun succeeds after failure, proving the exclusive task lock is released
- rerun builds ready lookup tables and still does not mutate evidence/assessment tables

Existing coverage still verifies SDE lookup provenance, readiness warnings, service command success, report/runtime non-dependence on SDE zip/import modules, and preservation of ready lookup tables after direct builder failures.

## Verification

```txt
npm.cmd run verify:sde-build-lookups
Result: passed
```

```txt
npm.cmd run verify:all
Result: passed
All verification group passed with 59 scripts.
```

Electron smoke was not run because this packet changed offline verification and current-state docs only.

No real SDE network download was run.

## Files Changed

```txt
scripts/verify-sde-build-lookups.js
docs/current-state/current-ipc-ui-preparation.md
workspace/current.md
workspace/DevHS10-atlas-sde-builder-failure-modes.md
```

## Findings

No product bug was found during this packet. The SDE builder’s existing cleanup, lookup preservation, task failure, and rerun behavior matched the packet expectations once exercised together.

## Deferred

- Larger synthetic scale pressure.
- App restart recovery after running or failed tasks.
- Live API success smoke.
- Real SDE network download success/failure beyond deterministic injected download failure.
- Operator Investigation Desk UX.

## Recommended Next Packet

Use larger synthetic scale pressure as the next bounded packet. It is the default remaining aggressive-testing slice and should set explicit thresholds for larger fixture corpora so process-isolation decisions stay evidence-driven.
