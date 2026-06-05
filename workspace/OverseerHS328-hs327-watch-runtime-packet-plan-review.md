# OverseerHS328 HS327 Watch Runtime Packet Plan Review

Status: accepted
Date: 2026-06-06
Role: Overseer

## Reviewed

- `workspace/OverseerHS327-watch-runtime-packet-plan-preview-runway.md`
- `workspace/DevHS327-watch-runtime-packet-plan-preview.md`
- `src/main/services/watchRuntimePacketPlanService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-watch-runtime-packet-plan.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- `package.json`

## Decision

HS327 is accepted.

`watch.runtime_packet_plan.preview` proves that accepted Watch state can be shaped into future runtime/acquisition packet plans without dispatching, creating tasks, calling providers, writing rows, changing schema, or opening UI work.

## Accepted Result

- Added `watch.runtime_packet_plan.preview` as a renderer-eligible read-only command.
- Added `src/main/services/watchRuntimePacketPlanService.js`.
- Added `scripts/verify-watch-runtime-packet-plan.js` and `npm.cmd run verify:watch-runtime-packet-plan`.
- The preview composes existing local facts from:
  - `buildWatchScheduleStatus(...)`
  - `watch.authored_execution_readiness.preview`
- The preview does not call `dispatchFor(...)`, Watch runners, provider gates, task runners, collectors, zKillboard, ESI, or any provider.
- Actor Watch plans use actor Watch source fields from `watchlist_entities`.
- System / Radius Watch plans use stored accepted `included_system_ids` only.
- Center/radius remain provenance and management after acceptance.
- Valid, due System / Radius scope produces a preview plan with:
  - `acceptedScopeSource: stored_watch_scope`
  - selected accepted system IDs from stored scope
  - zKill Discovery packet count from selected accepted systems
  - ESI Evidence Expansion cap from Watch cap fields
- Inactive, not-due, and backoff Watches remain `blocked_no_plan`; waiting is not failure.
- Invalid stored scope creates no accepted packet plan:
  - accepted system IDs are `[]`
  - selected runtime systems are `[]`
  - `runtime_packet_plan` is `null`
  - diagnostic parseable IDs remain diagnostic only

## Boundary Check

No Watch execution, runtime arm/disarm, task creation, provider/live/API call, Watch row mutation, Discovery ref mutation, Evidence/EVEidence write, Hydration/metadata write, `watch.create` change, topology traversal change, center/radius fallback authority, runtime packet persistence, provider queue creation, schema change, renderer/UI work, support artifact, active enforcement, command blocking, Watch result identity, relationship tag, protected-word JSON update, or fourth-lane behavior was opened.

## Verification

Accepted proof:

- `npm.cmd run verify:watch-runtime-packet-plan` passed.
- `npm.cmd run verify:watch-scheduler` passed.
- `npm.cmd run verify:watch-executor` passed.
- `npm.cmd run verify:watch-authored-execution-readiness` passed.
- `npm.cmd run verify:command-authority` passed.
- `npm.cmd run verify:enforcement-dry-run` passed.
- `npm.cmd run verify:protected-terms` passed with warning-only advisory output and no protected-word JSON updates.
- `npm.cmd run verify:service-registry` passed.
- `npm.cmd run verify:passive-side-effects` passed.
- `git diff --check` passed with CRLF normalization warnings only.

The service registry and passive side-effect checks were run sequentially to avoid the known temporary workspace collision noted in HS325.

## Residual Risk

This is still a preview. It proves plan shape and boundaries, not live Watch execution correctness.

Runtime dispatch, durable Watch results, provider pacing, Discovery ref creation, ESI Evidence Expansion, Hydration, active enforcement, UI presentation, and result/outcome semantics remain unopened.

## Resting State

HS327 can rest.

Recommended next motion should be a bounded choice between:

- Watch result/outcome shape advisory
- local scope health/repair readout
- another storage/runtime seam outside Watch
- a later execution-adjacent proof only after Human/Overseer explicitly accepts the next boundary
