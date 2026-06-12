# DevHS395 - Actor Watch Compatibility Wrapper Command

Status: complete; pending Overseer review

## Scope

Implemented the explicit no-provider actor Watch compatibility-wrapper preview command:

```txt
watch.actor_compatibility_wrapper.preview
```

This is a read-only/local-only preview command. It consumes the old actor Watch payload shape, delegates to the accepted HS383 adapter fixture surface, returns the old caller-facing compatibility result shape, and proves the existing actor Watch runtime paths remain unchanged.

## Files Changed

- `package.json`
- `src/main/services/watchActorCompatibilityWrapperRuntimePreviewService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-watch-actor-compatibility-wrapper-runtime-preview.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `workspace/current.md`
- `workspace/DevHS395-actor-watch-compatibility-wrapper-command.md`

## Command Shape

New service:

```txt
src/main/services/watchActorCompatibilityWrapperRuntimePreviewService.js
```

Registered command:

```txt
watch.actor_compatibility_wrapper.preview
```

Input accepted:

- `entityType` / `entity_type`
- `entityId` / `entity_id`
- `entityName` / `entity_name`
- `lookbackSeconds` / `lookback_seconds`
- `maxRefs` / `max_refs`
- `maxExpansions` / `max_expansions`

Output includes:

- `old_caller_facing_compatibility_result`
- `represented_old_result_fields`
- `approximate_old_result_fields`
- `not_represented_old_result_fields`
- `parked_old_result_fields`
- `legacy_term_posture`
- `existing_runtime_preserved`
- `non_invocation_proof`
- `table_mutation_proof`
- full no-provider/no-write/no-dispatch/no-schema/no-UI boundary flags

## Sample Output

Focused verifier sample:

```txt
command: watch.actor_compatibility_wrapper.preview
wrapper_status: explicit_preview_no_provider_no_write_not_active
legacy_payload_shape_accepted.entityType: character
legacy_payload_shape_accepted.entityId: 90000001
old caller-facing fields:
  run_id
  actor
  zkill_refs_discovered
  duplicate_refs_removed
  malformed_refs_removed
  unique_refs_after_dedupe
  pending_refs_considered
  already_cached_killmails
  expansion_attempted
  expansion_cap_skipped
  new_esi_expansions
  failed_expansions
  persisted_killmails
  activity_events_written
  api_calls_zkill
  api_calls_esi
  warnings
  planned_zkill_requests
  zkill_discovery_skipped
  collection_plan
  expansion_queue
  expansion_queue_summary
represented_old_result_fields:
  run_id, actor, zkill_refs_discovered, duplicate_refs_removed,
  malformed_refs_removed, unique_refs_after_dedupe,
  already_cached_killmails, expansion_attempted,
  expansion_cap_skipped, failed_expansions,
  planned_zkill_requests, collection_plan, expansion_queue,
  expansion_queue_summary
approximate_old_result_fields:
  warnings, pending_refs_considered, zkill_discovery_skipped
not_represented_old_result_fields includes:
  real fetch_runs run_id and lifecycle
  real persisted_killmails count from EvidenceRepository.persistEvidencePackage
  real api_calls_zkill and api_calls_esi from api_request_logs
parked_old_result_fields includes:
  actor.watch redirect
  collectActorWatch retirement
  durable Discovery ref selection/expanded/cached/failed marking
  Evidence/EVEidence writer landing
existing_runtime_preserved:
  actor_watch_still_runtime_entry_point: runActorWatchService
  runActorWatchService_still_calls: collectActorWatch
  scheduled_actor_watch_still_dispatches_command: actor.watch
  scheduled_actor_watch_current_runner: collectActorWatch
table_mutation_proof.unchanged: true
```

## Runtime Preservation Proof

The focused verifier statically confirms:

- `actor.watch` remains registered with `handler: ({ db, payload, ...context }) => runActorWatchService(db, payload, context)`
- `runActorWatchService(...)` remains defined in `src/main/services/mutatingActionService.js`
- `runActorWatchService(...)` still calls `collectActorWatch(input, { ...dependencies, db })`
- `watchExecutor.dispatchFor(actor)` still returns command `actor.watch`
- `watchExecutor.dispatchFor(actor)` still uses `runner: collectActorWatch`
- the new wrapper preview service does not import `actorWatchCollector.js`
- the new wrapper preview service does not invoke `runActorWatchService(...)`

## Verification

Passed:

```txt
node --check src\main\services\watchActorCompatibilityWrapperRuntimePreviewService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-watch-actor-compatibility-wrapper-runtime-preview.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:watch-actor-compatibility-wrapper-adapter-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:evidence-rules
npm.cmd run verify:watch-executor
npm.cmd run verify:mutating-services
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Notes:

- `verify:service-registry` passed with a 300 second ceiling.
- `verify:enforcement-dry-run` reported coverage complete: 113 commands covered, 0 gaps.
- `verify:protected-terms` completed with warning-only advisory output; no protected-word JSON updates or source-term renames were performed.
- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS395-touched files.

## Boundary Confirmation

Not changed or added:

- no `actor.watch` handler change
- no `runActorWatchService(...)` change
- no `collectActorWatch(...)` change
- no `watchExecutor.dispatchFor(...)` change
- no scheduled Watch task result handling change
- no system/radius Watch behavior change
- no zKill calls
- no ESI calls
- no live/API/provider movement
- no Discovery ref writes
- no Evidence/EVEidence writes
- no Hydration/metadata writes
- no Observation/report writes
- no Assessment writes
- no Watch cadence/state mutation
- no schema changes
- no mixed collector invocation/rewrite/retirement
- no dispatchers, queues, leases, workers
- no runtime enforcement activation or command blocking
- no renderer UI work
- no support artifacts
- no source-term rename
- no protected-word JSON update

## Recommended Next Action

Overseer review HS395. If accepted, consider a narrow default `actor.watch` compatibility-wrapper redirect proof only after explicitly deciding which runtime path may be touched, while keeping live provider movement, durable Discovery refs, Evidence/EVEidence landing, Watch cadence mutation, scheduled redirect, and collector retirement parked.
