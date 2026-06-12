# DevHS381 - Actor Watch Compatibility Wrapper Contract

Status: complete
Date: 2026-06-07
Role: Dev

## Scope

Implemented HS381 only: a fixture-only, read-only actor Watch compatibility-wrapper contract proof.

New command:

```txt
watch.actor_compatibility_wrapper_contract.preview
```

New verifier:

```txt
verify:watch-actor-compatibility-wrapper-contract
```

## Files Changed

- `src/main/services/watchActorCompatibilityWrapperContractService.js`
- `scripts/verify-watch-actor-compatibility-wrapper-contract.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS381-actor-watch-compatibility-wrapper-contract.md`

## Implementation Summary

The new preview composes the existing proof surfaces instead of inventing a new runtime model:

- `watch.actor_replacement_parity.preview`
- `discovery.acquisition_to_evidence_handoff_fixture.preview`
- `discovery.esi_expansion_intake_posture.preview`

It reports:

- wrapper status: `contract_only_not_active`
- old entry point: `actor.watch`
- direct command path basis from `runActorWatchService(...)`
- scheduled actor Watch dispatch path basis from `watchExecutor.dispatchFor(...)`
- current retire candidate: `collectActorWatch`
- future boundary-owned stages:
  - Watch accepted actor intent / cadence authority
  - Discovery zKill candidate-lead acquisition
  - Discovery ESI-backed killmail/detail expansion intake
  - Evidence/EVEidence writer boundary
  - Watch receipt/cadence decision placeholder
- candidate compatibility result shape for old callers without claiming old collector semantics are replaced
- legacy summary mapping for represented now, represented by existing fixture proof, not represented yet, and intentionally parked

## Sample Output Shape

Focused verifier sample includes:

```txt
wrapper_status: contract_only_not_active
old_entry_point: actor.watch
direct_command_path_basis.source_function: runActorWatchService
scheduled_dispatch_path_basis.source_function: watchExecutor.dispatchFor
scheduled_dispatch_path_basis.sends_for_actor_watch.command: actor.watch
scheduled_dispatch_path_basis.current_runner: collectActorWatch
candidate_compatibility_result.old_collector_semantics_claimed_replaced: false
candidate_compatibility_result.zkill_provider_target_shape.provider: zkill
candidate_compatibility_result.candidate_ref_posture.candidate_refs_are_possible_leads: true
candidate_compatibility_result.candidate_ref_posture.candidate_refs_are_evidence: false
candidate_compatibility_result.evidence_eveidence_writer_boundary_not_invoked: true
candidate_compatibility_result.watch_cadence_mutation_not_performed: true
```

The verifier covers:

- refs found and selected
- no refs
- malformed candidate
- duplicate candidate
- capped/not-selected candidate
- provider deferred
- local Evidence/EVEidence cache skip
- retryable ESI-backed expansion failure classification
- terminal ESI-backed expansion failure classification

## Boundary Confirmation

Confirmed preserved:

- no `actor.watch` redirect
- no `runActorWatchService(...)` runtime behavior change
- no `watchExecutor.dispatchFor(...)` runtime behavior change
- no `collectActorWatch(...)` invocation or retirement
- no system/radius behavior change
- no zKill, ESI, provider, or live/API calls
- no Discovery refs, Evidence/EVEidence, Hydration, metadata, API log, warning, `fetch_runs`, Watch run, or Watch cadence writes
- no DB mutation during preview
- no schema, tasks, queues, dispatchers, leases, workers, UI, enforcement, command blocking, support artifacts, source-term rename, or protected-word JSON update

Semantic boundaries:

- Candidate refs remain possible leads, not Evidence/EVEidence.
- ESI-backed killmail/detail expansion remains Discovery-owned provider movement, not Hydration.
- Evidence/EVEidence writer remains the final landed-memory boundary and is not invoked.
- The preview does not claim the old collector return semantics are replaced.

## Verification

Passed:

```txt
node --check src\main\services\watchActorCompatibilityWrapperContractService.js
node --check scripts\verify-watch-actor-compatibility-wrapper-contract.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check src\main\services\enforcementDryRunService.js
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Final checks passed after this artifact/current update:

```txt
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- `verify:protected-terms` exited 0 with warning-only advisory output; no renames or protected-word JSON updates were performed.
- `git diff --check` exited 0 with line-ending warnings only.
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the existing uncommitted Discovery/Watch proof-chain working tree plus HS381 changes.

## Outcome

HS381 is implemented as a contract/readout proof only. Atlas can now show what a future `actor.watch` compatibility wrapper would receive, which boundary-owned proof surfaces it would compose, what candidate result shape it would return to old callers, and which runtime replacement steps remain parked.

## Risks / Parked Work

- Actual `actor.watch` redirect is still not implemented.
- `runActorWatchService(...)` and `watchExecutor.dispatchFor(...)` still use the current runtime path.
- `collectActorWatch(...)` remains live-capable runtime code and is not retired.
- Live zKill acquisition, live ESI-backed expansion, durable Discovery ref persistence, Evidence/EVEidence writer landing, and Watch cadence mutation from receipt remain unproven for replacement.
- Old collector returned-summary object equivalence is deliberately not claimed.

## Recommended Next Action

Overseer review HS381. If accepted, the next narrow seam could be a non-live compatibility-wrapper adapter fixture that constructs the same result shape from injected boundary-owned fixtures while still not redirecting `actor.watch`.
