# DevHS379 - Discovery ESI-backed Expansion Intake Posture

Status: complete
Date: 2026-06-07
Role: Dev

## Scope

Implemented the HS379 fixture-only, read-only Discovery ESI-backed expansion intake posture proof.

New command:

```txt
discovery.esi_expansion_intake_posture.preview
```

Focused verifier:

```txt
verify:discovery-esi-expansion-intake-posture
```

The proof classifies selected candidate refs for the future Discovery-owned ESI-backed killmail/detail expansion lane without calling ESI, writing Evidence/EVEidence, writing Hydration/metadata, mutating DB rows, or changing Watch runtime behavior.

## Files Changed

```txt
src/main/services/discoveryEsiExpansionIntakePostureService.js
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-discovery-esi-expansion-intake-posture.js
scripts/verify-command-authority.js
scripts/verify-service-registry.js
scripts/verify-passive-side-effects.js
package.json
workspace/current.md
workspace/DevHS379-discovery-esi-expansion-intake-posture.md
```

## Command Shape

`discovery.esi_expansion_intake_posture.preview` composes the existing fixture handoff:

```txt
discovery.acquisition_to_evidence_handoff_fixture.preview
```

It reports:

- source acquisition handoff summary
- acquisition request basis
- canonical Discovery receipt basis
- source candidate dedupe posture
- ESI expansion intake items
- posture summary
- Evidence/EVEidence writer boundary, not invoked
- missing / parked runtime work
- accepted Discovery-owned lane model
- non-invocation proof
- table mutation proof
- boundary flags

## Represented Postures

Covered by verifier:

- selected candidate ready for future ESI killmail/detail expansion
- candidate skipped because local Evidence/EVEidence already exists
- malformed candidate missing `killmail_id` or `killmail_hash`
- duplicate candidate posture
- not-selected/capped candidate posture
- provider/capacity deferred posture
- retryable ESI-backed expansion failure posture, fixture only
- terminal ESI-backed expansion failure posture, fixture only
- Evidence/EVEidence writer handoff/landing boundary, not invoked

Each intake item discloses:

- `killmail_id`
- `killmail_hash`
- source candidate basis / receipt or packet basis where available
- selection or skip reason
- future ESI provider target shape when the candidate is well-formed
- `esi_call_performed: false`
- `evidence_written: false`
- `hydration_written: false`
- whether local cache means no future ESI expansion is needed for that item

## Sample Output Summary

Selected-ready sample:

```txt
posture: selected_ready_for_future_esi_expansion
killmail_id: 400349001
killmail_hash: hs349_actor_stub_hash_001
future provider target: ESI killmail_detail
esi_call_performed: false
evidence_written: false
hydration_written: false
```

Local Evidence skip sample:

```txt
posture: local_evidence_exists_skip
local_cache_means_no_future_esi_needed: true
killmails count before/after: unchanged
```

Deferred and failure samples:

```txt
provider_capacity_deferred: represented
retryable_esi_backed_expansion_failure: represented
terminal_esi_backed_expansion_failure: represented
```

## Boundary Confirmation

Confirmed:

- Discovery owns the ESI-backed killmail/detail expansion intake posture.
- Actor Watch is only one possible caller; the preview remains source-agnostic.
- Candidate refs remain possible leads, not Evidence/EVEidence.
- ESI-backed killmail/detail expansion is not Hydration.
- Evidence/EVEidence begins only at final landed memory.
- Evidence/EVEidence writer boundary is represented but not invoked.
- The preview does not claim actor Watch runtime replacement is complete.
- The preview does not authorize compatibility wrapper implementation or collector retirement.

No providers, zKill calls, ESI calls, live/API movement, Discovery ref writes, Evidence/EVEidence writes, Hydration/metadata writes, API logs/warnings, `fetch_runs`, Watch mutation, DB mutation, schema, `actor.watch` redirect, `runActorWatchService` change, `watchExecutor.dispatchFor` change, collector invocation/retirement, tasks, queues, dispatchers, leases, workers, system/radius behavior change, UI, enforcement, command blocking, support artifacts, source-term rename, or protected-word JSON update were added.

## Parked Runtime Work

Still parked:

- live ESI provider call
- real ESI-backed expansion execution
- durable Discovery ref write
- Evidence/EVEidence landing
- Watch cadence mutation from receipt
- actor Watch compatibility wrapper
- `collectActorWatch` retirement

Current mixed collector behavior still lacking representation before actor runtime replacement:

- actual live ESI provider execution outcome and error handling
- actual Evidence/EVEidence writer package and landing result
- runtime compatibility wrapper from `actor.watch` into the boundary-owned route
- final retirement path for `collectActorWatch`

## Verification

Passed:

```txt
node --check src\main\services\discoveryEsiExpansionIntakePostureService.js
node --check scripts\verify-discovery-esi-expansion-intake-posture.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check src\main\services\enforcementDryRunService.js
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Final checks run after handoff/current updates:

```txt
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

## Recommended Next Action

Overseer review HS379, then consider a narrow actor Watch compatibility-wrapper design/proof that routes `actor.watch` toward the boundary-owned path without live provider movement, durable Discovery ref writes, Evidence/EVEidence writes, or collector retirement in the same packet.
