# DevHS383 - Actor Watch Compatibility Wrapper Adapter Fixture

Status: complete
Executor: Dev
Date: 2026-06-07

## Scope

Implemented the HS383 fixture-only/read-only adapter proof for the future actor Watch compatibility wrapper.

Added command:

```txt
watch.actor_compatibility_wrapper_adapter_fixture.preview
```

The command constructs an old caller-facing actor Watch result shape from injected boundary-owned fixture outputs while keeping current runtime behavior unchanged.

## Files Changed

- `package.json`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-watch-actor-compatibility-wrapper-adapter-fixture.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/watchActorCompatibilityWrapperAdapterFixtureService.js`
- `workspace/current.md`
- `workspace/DevHS383-actor-watch-compatibility-wrapper-adapter-fixture.md`

Existing untracked HS356-HS381 proof-chain files were preserved and not reverted.

## Implementation Notes

The new service composes the accepted HS381 contract preview into an adapter-fixture result with:

- old caller-facing fields such as `run_id`, `actor`, `zkill_refs_discovered`, `unique_refs_after_dedupe`, `expansion_attempted`, `expansion_cap_skipped`, `already_cached_killmails`, `failed_expansions`, `persisted_killmails`, `activity_events_written`, `api_calls_zkill`, `api_calls_esi`, `warnings`, `collection_plan`, `expansion_queue`, and `expansion_queue_summary`
- explicit compatibility mapping for represented, approximate, not represented, and parked old collector semantics
- fixture cases for refs found, no refs, malformed candidate, duplicate candidate, capped/not selected, provider deferred, local Evidence/EVEidence cache skip, retryable ESI-backed failure, and terminal ESI-backed failure
- table mutation snapshots proving no DB row changes
- boundary flags confirming candidate refs are possible leads, ESI-backed expansion remains Discovery-owned and not Hydration, and Evidence/EVEidence writer is represented but not invoked

The command was registered as a read-only/passive service command, added to command authority checks, added to passive side-effect invocation coverage, and included in enforcement dry-run classification coverage.

## Sample Output

Focused verifier sample for the refs-found case produced:

```txt
wrapper_status: adapter_fixture_only_not_active
old_entry_point: actor.watch
actor.entity_id: 90000001
zkill_refs_discovered: 2
unique_refs_after_dedupe: 2
expansion_attempted: 1
expansion_cap_skipped: 1
persisted_killmails: 0
activity_events_written: 0
api_calls_zkill: 0
api_calls_esi: 0
expansion_queue_summary.selected_ready_count: 1
candidate_refs_are_possible_leads: true
candidate_refs_are_evidence: false
evidence_eveidence_writer_boundary_not_invoked: true
watch_cadence_mutation_not_performed: true
```

Local Evidence/EVEidence cache skip sample produced:

```txt
already_cached_killmails: 1
expansion_attempted: 0
persisted_killmails: 0
activity_events_written: 0
api_calls_zkill: 0
api_calls_esi: 0
```

Retryable failure sample produced:

```txt
failed_expansions: 1
expansion_attempted: 0
persisted_killmails: 0
activity_events_written: 0
```

Enforcement dry-run coverage reported:

```txt
total_commands: 111
covered_commands: 111
gap_commands: []
```

## Boundary Confirmation

Confirmed:

- `actor.watch` was not redirected.
- `runActorWatchService(...)` runtime behavior was not changed.
- `watchExecutor.dispatchFor(...)` runtime behavior was not changed.
- `collectActorWatch(...)` was not invoked, changed, or retired.
- No zKill call, ESI call, live/API/provider movement, Discovery ref write, Evidence/EVEidence write, Hydration/metadata write, API log/warning write, `fetch_runs` write, Watch run record write, Watch cadence mutation, DB mutation, schema change, task/queue/dispatcher/lease/worker behavior, system/radius behavior, renderer UI, enforcement/command blocking, support artifact, source-term rename, or protected-word JSON update was added.

## Verification

Passed:

```txt
node --check src\main\services\watchActorCompatibilityWrapperAdapterFixtureService.js
node --check scripts\verify-watch-actor-compatibility-wrapper-adapter-fixture.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check src\main\services\enforcementDryRunService.js
npm.cmd run verify:watch-actor-compatibility-wrapper-adapter-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
```

Notes:

- First `npm.cmd run verify:service-registry` attempt timed out at the tool's 120 second ceiling before result.
- Rerun with a 300 second ceiling passed: `service registry verified`.
- `npm.cmd run verify:protected-terms` completed with exit code 0 and warning-only advisory output; no renames and no protected-word JSON updates were performed.

Final hygiene checks are recorded in `workspace/current.md`.

## Risks / Parked Work

- This is an adapter fixture only, not a runtime adapter.
- Old collector return semantics are mapped but not claimed fully replaced.
- Runtime redirect of `actor.watch`, `runActorWatchService(...)`, `watchExecutor.dispatchFor(...)`, and `collectActorWatch(...)` retirement remain parked.
- Live zKill/ESI execution, durable Discovery refs, Evidence/EVEidence landing, Watch cadence mutation from Discovery receipt, and task/queue machinery remain parked.

## Recommended Next Action

Overseer review HS383 for acceptance, especially the old-result compatibility map and whether the represented/approximate/not-represented/parked categories are sufficient before any runtime redirect runway is opened.
