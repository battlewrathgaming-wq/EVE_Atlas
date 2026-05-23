# DevHS12: Atlas Large Synthetic Scale Pressure

Status: Complete
Date: 2026-05-23
Role: Dev
Milestone: Aggressive Testing And Operator Bug Hunting

## Scope

Executed the HS12 runway in `workspace/current.md`: larger local synthetic scale pressure with explicit thresholds, bounded diagnostics, and evidence-doctrine assertions that inform future process-isolation decisions.

I did not read or interact with the planner scoping document. The only planner-derived requirement honored was the accepted `Mark`/`Watch` distinction already copied into `workspace/current.md`.

## Changes

- Added `scripts/verify-large-synthetic-scale.js`.
- Added `verify:large-scale` to `package.json`.
- Wired `verify:large-scale` into the `bulk` and `all` verification groups.
- Updated current-state docs to list the new verification and record the larger scale threshold.

## Evidence Covered

The new verifier creates a disposable project-local DB under `.tmp/large-synthetic-scale` and asserts:

- 1000 stored killmails and 7000 normalized activity events are seeded as fixture evidence
- 1000 pending queue refs and 200 failed queue refs remain reviewable
- warning rows, API provenance, watch metadata, and one deliberate assessment artifact remain reviewable
- task-wrapped actor, radius, queue, and corpus-health reports succeed through the service/task path
- snapshot preflight remains read-only
- debug trace generation remains bounded under 1 MiB and excludes raw ESI payloads
- raw evidence checksums are preserved after reports, snapshot preflight, and debug trace work
- queue and report wording preserves evidence/provenance/assessment boundaries
- duplicate activity event keys are not introduced
- all measured report/support paths stay under conservative 3-5 second thresholds

Focused run measurements:

```txt
actor report task: 57.17 ms / 3000 ms
radius report task: 82.45 ms / 3000 ms
queue report task: 18.33 ms / 3000 ms
corpus health task: 20.17 ms / 3000 ms
snapshot preflight: 3.27 ms / 3000 ms
debug trace task: 29.97 ms / 5000 ms
debug trace artifact: 21652 bytes / 1048576 bytes
```

Full-suite run measurements were similar and stayed well under threshold.

## Verification

```txt
npm.cmd run verify:large-scale
Result: passed
```

```txt
npm.cmd run verify:all
Result: passed
All verification group passed with 60 scripts.
```

Electron smoke was not run because this packet changed offline verification and current-state docs only.

No live API work, real SDE network download, private runtime DB export, or destructive operation was run.

## Files Changed

```txt
scripts/verify-large-synthetic-scale.js
scripts/verify-group.js
package.json
docs/current-state/current-evidence-pipeline.md
docs/current-state/current-ipc-ui-preparation.md
workspace/current.md
workspace/DevHS12-atlas-large-synthetic-scale-pressure.md
```

## Findings

No product bug was found during this packet.

The larger synthetic pressure run did not justify worker-thread/process isolation. Synchronous report/service paths stayed far below conservative thresholds on a 1000-killmail / 7000-event fixture corpus.

## Deferred

- App restart recovery after running or failed tasks.
- Live API success smoke without explicit operator authorization.
- Real SDE network download.
- Operator Investigation Desk UX.
- Roadmap conversion.

## Recommended Next Packet

This milestone is ready for Overseer review/closure consideration from the Dev side. If Overseer wants one more bounded packet before closure, app restart recovery after running/failed tasks is the remaining non-live testing slice. Live success smoke should only be scheduled with explicit operator authorization and a narrow target/window.
