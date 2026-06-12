# OverseerHS383 - Actor Watch Compatibility Wrapper Adapter Fixture Runway

Status: open
Date: 2026-06-07
Role: Overseer

## Purpose

Add a non-live, fixture-only actor Watch compatibility-wrapper adapter proof.

HS381 proved the inactive wrapper contract and the boundary-owned surfaces a future wrapper would compose. HS383 should take the next narrow step: prove that an adapter can construct the old caller-facing actor Watch result shape from injected boundary-owned fixture outputs, without redirecting `actor.watch` or moving runtime behavior.

This is still proof scaffolding. It is not runtime replacement.

## Current Model To Preserve

- Watch is a scheduler and scope-authority source.
- Discovery is the provider-facing acquisition utility.
- Candidate refs are possible leads, not Evidence/EVEidence.
- ESI-backed killmail/detail expansion is Discovery-owned provider movement, not Hydration.
- Evidence/EVEidence is final landed memory.
- A compatibility wrapper may later preserve old command entry shape while routing to boundary-owned internals.
- Temporary redirect can be a migration step; retirement/replacement is the intended end state for mixed collector semantics.

## Task

Implement a fixture-only/read-only adapter proof that:

1. Uses injected fixture data or accepted preview outputs to represent boundary-owned stages:
   - actor Watch intent/cadence basis
   - Discovery zKill candidate-lead acquisition result
   - Discovery ESI-backed expansion intake posture
   - Evidence/EVEidence writer boundary posture, not invoked
   - Watch receipt/cadence decision posture, not mutated
2. Constructs a compatibility result shape that an old `actor.watch` caller could consume.
3. Clearly marks the result as adapter-fixture-only and non-authoritative for runtime behavior.
4. Compares or maps the adapter fixture shape against the HS381 contract expectations.
5. Discloses any fields from the old collector result shape that are:
   - represented by the adapter fixture
   - represented only approximately
   - not represented yet
   - deliberately parked

Suggested command:

```txt
watch.actor_compatibility_wrapper_adapter_fixture.preview
```

Suggested verifier:

```txt
verify:watch-actor-compatibility-wrapper-adapter-fixture
```

## Required Fixture Cases

Cover at least:

- refs found and selected
- no refs
- malformed candidate
- duplicate candidate
- acquisition capped / not selected
- provider deferred
- local Evidence/EVEidence cache skip
- retryable ESI-backed expansion failure posture
- terminal ESI-backed expansion failure posture

The proof may reuse or compose:

```txt
watch.actor_compatibility_wrapper_contract.preview
watch.actor_replacement_parity.preview
discovery.acquisition_to_evidence_handoff_fixture.preview
discovery.esi_expansion_intake_posture.preview
```

If composition is not the cleanest shape, Dev may implement a small adapter-local fixture mapper, but it must stay source-compatible with the accepted HS381 contract.

## Do Not

- redirect `actor.watch`
- change `runActorWatchService(...)` runtime behavior
- change `watchExecutor.dispatchFor(...)` runtime behavior
- invoke or retire `collectActorWatch(...)`
- claim old collector return semantics are fully replaced unless every field is explicitly mapped
- call zKill
- call ESI
- perform live/API/provider movement
- write Discovery refs
- write Evidence/EVEidence
- write Hydration/metadata
- write API logs, warnings, `fetch_runs`, Watch run records, or Watch cadence
- mutate DB state
- add schema
- add tasks, queues, dispatchers, leases, or workers
- change system/radius behavior
- change renderer UI
- activate enforcement or command blocking
- create support artifacts
- rename source-owned terms
- update protected-word JSON

## Acceptance Criteria

- New proof command exists and is registered with read-only/passive coverage.
- Focused verifier proves the adapter fixture cases and non-mutation boundaries.
- The command output states:
  - `actor.watch` is not redirected
  - runtime paths are unchanged
  - `collectActorWatch(...)` is not invoked or retired
  - providers are not called
  - candidate refs are possible leads, not Evidence/EVEidence
  - ESI-backed expansion posture is Discovery-owned, not Hydration
  - Evidence/EVEidence writer is represented but not invoked
  - Watch cadence/receipt handling is represented but not mutated
- The adapter fixture result is distinguishable from:
  - HS381 contract-only readout
  - real runtime adapter
  - live provider execution
  - Evidence/EVEidence landing
- Old result compatibility gaps are disclosed rather than smoothed over.

## Verification

Run:

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
git diff --check
git status --short --branch
```

## Expected Handoff

Create:

```txt
workspace/DevHS383-actor-watch-compatibility-wrapper-adapter-fixture.md
```

Include:

- files changed
- command output shape summary
- fixture cases covered
- old result compatibility map
- boundary confirmation
- verification evidence
- parked work
- recommended next action
