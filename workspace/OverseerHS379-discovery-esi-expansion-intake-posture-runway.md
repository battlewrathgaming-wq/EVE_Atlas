# OverseerHS379 - Discovery ESI-backed Expansion Intake Posture Runway

Status: open
Date: 2026-06-07
Role: Overseer
Executor: Dev

## Purpose

Add a fixture-only, read-only proof for the Discovery ESI-backed killmail/detail expansion intake posture.

HS377 proved actor Watch behavior can be represented through the future boundary-owned route, but retryable/terminal ESI-backed expansion posture remains parked. Before Atlas moves `actor.watch` toward a compatibility wrapper or runtime replacement, prove the Discovery-owned ESI expansion lane can classify selected candidate refs without calling ESI or writing Evidence/EVEidence.

## Current Model

- Watch owns scheduled intent, cadence, accepted scope, and later receipt/cadence interpretation.
- Discovery owns provider-facing acquisition:
  - zKill candidate-lead acquisition
  - ESI-backed killmail/detail expansion
- Candidate refs are possible leads, not Evidence/EVEidence.
- ESI-backed killmail/detail expansion is not Hydration.
- Evidence/EVEidence begins only at final landed memory.
- Hydration repairs readability labels only.

## Task

Add a read-only service preview and focused verifier that show how selected candidate refs become Discovery ESI-backed expansion intake posture.

Suggested command:

```txt
discovery.esi_expansion_intake_posture.preview
```

Suggested verifier:

```txt
verify:discovery-esi-expansion-intake-posture
```

The proof may compose existing fixture output from:

```txt
discovery.acquisition_to_evidence_handoff_fixture.preview
watch.actor_replacement_parity.preview
```

but it must remain Discovery-owned and source-agnostic enough that actor Watch is only one possible caller.

## Required Postures

Represent, at minimum:

- selected candidate ready for future ESI killmail/detail expansion
- candidate skipped because local Evidence/EVEidence already exists
- malformed candidate missing `killmail_id` or `killmail_hash`
- duplicate candidate posture
- not-selected/capped candidate posture
- provider/capacity deferred posture
- retryable ESI-backed expansion failure posture, fixture only
- terminal ESI-backed expansion failure posture, fixture only
- Evidence/EVEidence writer handoff/landing boundary, not invoked

Each intake item should disclose:

- `killmail_id`
- `killmail_hash`
- source candidate basis / receipt or packet basis where available
- selection or skip reason
- future provider target shape without provider call
- `esi_call_performed: false`
- `evidence_written: false`
- `hydration_written: false`
- whether local cache means no future ESI expansion is needed for that item

## Boundaries

Do not:

- call providers
- call zKill
- call ESI
- create live/API movement
- write Discovery refs
- write Evidence/EVEidence
- write Hydration/metadata labels
- write API logs, warnings, `fetch_runs`, or Watch rows
- mutate local DB rows
- change schema
- redirect `actor.watch`
- change `runActorWatchService`
- change `watchExecutor.dispatchFor`
- invoke or retire `collectActorWatch` / `collectSystemRadiusWatch`
- create tasks, queues, dispatchers, leases, workers, or runtime provider work
- change system/radius behavior
- add UI / renderer behavior
- activate runtime enforcement or command blocking
- create support artifacts
- rename source-owned terms
- update protected-word JSON

## Acceptance Criteria

- New command is registered as read-only and renderer-eligible only if consistent with existing preview commands.
- Focused verifier covers every required posture above.
- No table counts change in fixture verification.
- Candidate refs remain possible leads until Evidence/EVEidence writer landing.
- ESI-backed expansion is explicitly a Discovery provider lane, not Hydration.
- The preview does not claim actor Watch runtime replacement is complete.
- The preview does not authorize compatibility wrapper implementation or collector retirement.
- Missing live/runtime pieces are explicitly listed as parked.

## Verification

Run at minimum:

```txt
node --check src\main\services\<new-service-file>.js
node --check scripts\verify-discovery-esi-expansion-intake-posture.js
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Then run:

```txt
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

## Expected Handoff

```txt
workspace/DevHS379-discovery-esi-expansion-intake-posture.md
```

The handoff should summarize represented postures, parked runtime work, verification evidence, and whether any current mixed collector behavior still lacks representation before actor runtime replacement can be considered.
