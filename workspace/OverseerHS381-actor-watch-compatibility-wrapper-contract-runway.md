# OverseerHS381 - Actor Watch Compatibility Wrapper Contract Runway

Status: open
Date: 2026-06-07
Role: Overseer
Executor: Dev

## Purpose

Add the smallest proof surface for an actor Watch compatibility wrapper before any runtime redirect.

Atlas has now proven:

- Watch can emit Discovery pickup intent without doing Discovery.
- Discovery can model zKill acquisition to candidate refs.
- Discovery can model selected candidate refs entering the ESI-backed killmail/detail expansion lane.
- Candidate refs remain possible leads, not Evidence/EVEidence.
- ESI-backed killmail/detail expansion is Discovery-owned provider movement, not Hydration.
- Evidence/EVEidence begins at final landed memory.

The next seam is the old `actor.watch` entry point.

Do not redirect it yet. First prove what a wrapper would receive, what boundary-owned stages it would call, what it would report, and what remains parked.

## Source Context

Read:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS378-hs377-actor-watch-replacement-parity-review.md`
- `workspace/OverseerHS380-hs379-discovery-esi-expansion-intake-posture-review.md`
- `workspace/EngineeringTraceHS376-actor-watch-first-replacement-slice-readiness.md`
- `src/main/services/mutatingActionService.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/watchActorReplacementParityService.js`
- `src/main/services/discoveryAcquisitionToEvidenceHandoffFixtureService.js`
- `src/main/services/discoveryEsiExpansionIntakePostureService.js`

## Task

Create a fixture-only, read-only actor Watch compatibility-wrapper contract proof.

Suggested command:

```txt
watch.actor_compatibility_wrapper_contract.preview
```

Suggested verifier:

```txt
verify:watch-actor-compatibility-wrapper-contract
```

The proof should answer:

1. What does the current direct `actor.watch` command path receive after actor resolution and scope normalization?
2. What does the current scheduled Watch dispatch path send for actor Watch?
3. What boundary-owned stages would a future wrapper call?
4. What result shape would the wrapper return to old callers without claiming old collector semantics?
5. Which current mixed collector behaviors are represented by existing proof surfaces?
6. Which behaviors remain parked before actual redirect/runtime replacement?

## Required Shape

The preview should compose or mirror existing proof surfaces where possible rather than re-inventing the model:

- `watch.actor_replacement_parity.preview`
- `discovery.acquisition_to_evidence_handoff_fixture.preview`
- `discovery.esi_expansion_intake_posture.preview`

It should expose:

- wrapper status: `contract_only_not_active`
- old entry point: `actor.watch`
- direct command path basis from `runActorWatchService(...)`
- scheduled path basis from `watchExecutor.dispatchFor(...)`
- current retire candidate: `collectActorWatch`
- future route stages:
  - Watch accepted actor intent / cadence authority
  - Discovery zKill candidate-lead acquisition
  - Discovery ESI-backed killmail/detail expansion intake
  - Evidence/EVEidence writer boundary
  - Watch receipt/cadence decision placeholder
- source-agnostic Discovery posture
- actor-only scope, with system/radius untouched
- no runtime redirect performed
- no collector retirement performed
- no provider call performed
- no DB mutation performed

## Result Contract Expectations

The wrapper contract should not pretend the old collector result is already replaced.

Instead, report a candidate compatibility result with explicit mapping:

- actor target identity
- lookback seconds
- max refs
- max expansions
- zKill provider target shape
- candidate refs found / none / malformed / duplicate / capped / deferred posture
- selected ESI-backed expansion intake candidates
- local Evidence/EVEidence cache skip posture
- retryable / terminal ESI-backed expansion failure posture, fixture only
- Evidence/EVEidence writer boundary not invoked
- Watch cadence mutation not performed

Include a `legacy_summary_mapping` or equivalent that distinguishes:

- represented now
- represented by existing fixture proof
- not represented yet
- intentionally parked

## Guardrails

Do not:

- redirect `actor.watch`
- change `runActorWatchService(...)`
- change `watchExecutor.dispatchFor(...)` runtime behavior
- invoke or retire `collectActorWatch(...)`
- call zKill
- call ESI
- write `discovered_killmail_refs`
- write Evidence/EVEidence
- write Hydration/metadata
- write `fetch_runs`, API logs, warnings, ingestion audits, or Watch run records
- mutate Watch cadence
- add schema
- add tasks, queues, dispatchers, leases, workers, or runtime provider work
- change system/radius behavior
- change renderer UI
- activate enforcement or command blocking
- create support artifacts
- rename source-owned terms
- update protected-word JSON

## Acceptance Criteria

Dev handoff must show:

1. New command and verifier, if implemented.
2. The proof is fixture-only and read-only.
3. Direct `actor.watch` path and scheduled actor Watch dispatch path are both represented.
4. `actor.watch` is not redirected.
5. `collectActorWatch` is not invoked or retired.
6. System/radius Watch is untouched.
7. No providers, DB writes, schema, runtime enforcement, UI, tasks, queues, or support artifacts were added.
8. Candidate refs remain possible leads, not Evidence/EVEidence.
9. ESI-backed killmail/detail expansion remains Discovery-owned provider movement, not Hydration.
10. Evidence/EVEidence writer remains the final landed-memory boundary and is not invoked.
11. The preview explicitly lists parked runtime work before real replacement.

## Verification

Run focused checks:

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

Final checks:

```txt
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

## Expected Handoff

```txt
workspace/DevHS381-actor-watch-compatibility-wrapper-contract.md
```

## Stop Conditions

Stop and report if the implementation would require:

- runtime redirect of `actor.watch`
- behavior change in `runActorWatchService(...)` or `watchExecutor.dispatchFor(...)`
- collector invocation or retirement
- provider/API movement
- DB writes
- schema
- system/radius changes
- uncertainty about Discovery/Evidence/Hydration ownership
