# OverseerHS327 Watch Runtime Packet Plan Preview Runway

Status: open
Date: 2026-06-05
Role: Overseer
Executor: Dev

## Human Intent

Open the next Watch hardening seam after HS324.

Atlas has proven the setup chain:

```txt
topology preflight -> explicit operator confirmation -> stored included_system_ids -> readout -> future execution readiness
```

The next step is to prove how accepted stored Watch scope can become a future runtime/acquisition packet plan without dispatching it.

This should make the machinery visible before Atlas moves anything live.

## Milestone

Atlas Storage And Runtime Hardening

## Current Packet

Add a read-only/local-only Watch runtime packet plan preview.

Preferred command:

```txt
watch.runtime_packet_plan.preview
```

Purpose:

Show what Atlas would plan from accepted Watch state if a later execution packet were authorized, while proving no Watch execution, dispatch, provider movement, task creation, Discovery/Evidence/Hydration mutation, schema, or UI work occurs.

## Product Requirement

The preview should show, for current Watch rows:

- Watch identity:
  - `watch_type`
  - `watch_id`
  - `scope_key`
- gate posture:
  - active/inactive
  - armed/disarmed input posture
  - live/provider gate input posture
  - due/not-due/backoff posture
  - blocked reasons
- scope authority:
  - actor Watch source fields for actor Watches
  - stored `included_system_ids` for System / Radius Watches
  - `acceptedScopeSource: stored_watch_scope` for valid System / Radius Watches
  - center/radius as provenance and management only
  - no center/radius fallback authority
- packet plan:
  - planned lane: Discovery, Evidence Expansion, or blocked/no-plan
  - zKill Discovery packet count, where computable
  - ESI Evidence Expansion cap, where computable
  - lookback window/cadence inputs
  - selected accepted system IDs for System / Radius Watches
  - max refs or max refs per system, where computable
  - waiting is not failure
- non-action posture:
  - `would_dispatch_watch: false`
  - `would_create_task: false`
  - `provider_calls: 0`
  - `writes: 0`
  - `readiness_is_authorization: false`

Invalid stored System / Radius scope must produce no accepted packet plan. If diagnostic parseable IDs are exposed, they must remain diagnostic-only and must not appear as selected runtime systems.

## Technical Requirement

Use existing local read-only facts where possible:

- `buildWatchScheduleStatus(...)`
- `watch.authored_execution_readiness.preview`
- current accepted-scope/readout helpers if useful
- existing command authority/service registry patterns

Do not call `dispatchFor(...)` as an execution act. If Dev uses dispatch-shape logic, it must be factored into a non-dispatching plan helper or otherwise proven to create no task and call no runner/provider.

The preview should be service-command accessible and renderer-eligible only if it is classified read-only and does not expose authority to execute.

Expected useful samples:

- valid active actor Watch
- valid active System / Radius Watch with accepted stored scope
- inactive Watch
- not-due Watch
- backoff Watch
- missing stored scope
- malformed stored scope
- empty stored scope
- invalid stored scope

For invalid stored scope:

```txt
accepted_system_ids: []
packet_plan_status: blocked
blocked_reasons includes invalid_stored_scope or watch_scope_authority_invalid
diagnostic IDs, if present, are diagnostic only
```

## Boundaries

Do not:

- execute a Watch
- arm/disarm Watch runtime
- create Watch executor tasks
- call zKillboard, ESI, or any provider
- perform live/API calls
- mutate Watch rows
- mutate Discovery refs
- write Evidence/EVEidence
- write Hydration/metadata labels
- change `watch.create`
- change topology traversal behavior
- infer execution authority from center/radius
- create or persist runtime packet rows
- create a broad provider queue
- change schema
- implement renderer UI
- add popup/modal behavior
- redesign R-Scanner
- activate runtime enforcement or command blocking
- create support artifacts
- add durable Watch result identity
- add relationship tags
- rename source-owned terms
- update protected-word JSON
- open fourth-lane behavior

## Verification

Run focused checks:

```txt
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-passive-side-effects.js
node --check src\main\watchlist\watchScheduler.js
node --check src\main\watchlist\watchExecutor.js
node --check scripts\verify-watch-scheduler.js
node --check scripts\verify-watch-executor.js
node --check scripts\verify-watch-authored-execution-readiness.js
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-authored-execution-readiness
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If Dev adds a new verifier, include it in `package.json` and run it before the shared checks.

Avoid running `verify:service-registry` in parallel with `verify:passive-side-effects`; HS325 noted `.tmp` verifier workspace interference when those ran at the same time.

## Expected Handoff

Create:

```txt
workspace/DevHS327-watch-runtime-packet-plan-preview.md
```

The handoff should include:

- files changed
- command/action added, if any
- sample valid actor plan
- sample valid System / Radius plan using stored accepted scope
- sample invalid stored scope blocked/no-plan behavior
- proof center/radius are provenance only after acceptance
- proof no dispatch/task/provider/write occurred
- verification commands and results

## Stop Conditions

Stop and report if:

- proof requires Watch execution
- proof requires provider/live/API calls
- proof requires task creation
- proof requires schema or persistent packet rows
- proof requires mutating stored Watch rows
- implementation would use center/radius as fallback execution authority
- implementation would make invalid stored scope partially actionable
- implementation would blur Discovery, Evidence Expansion, or Hydration lanes
