# DevHS03: Atlas Task Concurrency Cancellation

Date: 2026-05-23
Role: Dev
Milestone: Aggressive Testing And Operator Bug Hunting
Packet: `workspace/current.md`

## Scope Executed

- Reviewed task runner locks, cancellation paths, HTTP timeout/cancellation checks, background execution, service task wrapping, and debug trace output.
- Added a deterministic offline task pressure verification for overlap, cancellation, failure, rerun, lock release, evidence preservation, and reviewable diagnostics.
- Reconciled command inventory/current-state docs for the new verification script.

## Verification

```txt
npm.cmd run verify:task-concurrency
Result: passed.

npm.cmd run verify:task-runner
Result: passed.

npm.cmd run verify:http-timeouts
Result: passed.

npm.cmd run verify:background-execution
Result: passed.

npm.cmd run verify:operator-debug-trace
Result: passed.

npm.cmd run verify:all
Result: passed; 58 offline scripts.
```

## Files Changed

```txt
package.json
scripts/verify-group.js
scripts/verify-task-concurrency-cancellation.js
docs/current-state/current-evidence-pipeline.md
docs/current-state/current-ipc-ui-preparation.md
workspace/current.md
workspace/DevHS03-atlas-task-concurrency-cancellation.md
```

## Findings

- `verify:task-concurrency` covers same-scope evidence lock blocking, read-only task allowance during evidence work, exclusive/destructive global lock conflicts, metadata same-scope serialization, different-scope metadata allowance, HTTP-bound cancellation, lock release after cancellation, task failure followed by immediate rerun, and task history diagnostics.
- Evidence/storage count assertions cover `killmails`, `activity_events`, `discovered_killmail_refs`, `fetch_runs`, `api_request_logs`, `metadata_runs`, and `assessment_artifacts`.
- Service diagnostics remain reviewable: a gate-blocked `manual.discovery` task records `LIVE_API_DISABLED`, task history exposes the failure, and `support.debug_trace_pack` includes the failure code while declaring `raw_esi_payload` excluded and avoiding broad raw payload field dumps.
- No runtime task-runner changes were needed.
- During development, one draft assertion was corrected because the trace pack should mention `raw_esi_payload` in its exclusions list; final verification distinguishes exclusion wording from raw payload content.

## Deferrals And Risk

- This packet does not test app restart recovery after a running/failed task.
- This packet does not expand adversarial evidence fixtures, SDE builder failure modes, or larger synthetic scale pressure.
- No live success smoke was run; live API authorization was not provided and was not needed.

## Recommended Next Action

Write the next bounded Dev packet for adversarial evidence fixtures: malformed or incomplete killmails, NPC-only participants, duplicate corp/alliance appearances, changed hashes, inconsistent queued refs, partially hydrated labels, and stale/mismatched SDE metadata.
