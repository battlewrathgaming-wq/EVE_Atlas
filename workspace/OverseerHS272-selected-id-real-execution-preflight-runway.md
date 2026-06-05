# Overseer HS272 - Selected-ID Real Execution Preflight Runway

Status: active Dev runway
Date: 2026-06-05
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS272-selected-id-real-execution-preflight.md`

## Purpose

Add a read-only selected-ID real execution preflight before any real provider-backed Hydration execution exists.

This should prove the live-capable facts that would be required for a future selected-ID Hydration execution command, without calling providers, writing Hydration output, or creating execution.

## Accepted Stack

```text
Lane = meaning and policy.
Bucket = eligible waiting work.
Dispatcher = paced release.
Execution = current attempt.
Write = durable outcome.
```

Accepted lane simplification:

```text
Discovery outputs possible leads.
Evidence Expansion outputs Evidence/EVEidence.
Hydration outputs readability repair.
Fourth lane stays parked.
```

## Read

- `workspace/current.md`
- `workspace/OverseerHS270-hydration-real-execution-decision-surface.md`
- `workspace/DataEngineering-provider-work-structure-readiness-advisory.md`
- `workspace/OverseerHS271-provider-work-structure-readiness-review.md`
- `workspace/DevHS268-selected-id-hydration-execution-fixture-proof.md`
- `workspace/OverseerHS269-hs268-hydration-execution-fixture-proof-review.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/data-layer-boundaries.md`
- `docs/contracts/metadata-hydration-contract.md`
- `src/main/services/hydrationRequestPostureService.js`
- `src/main/services/hydrationPickupContractService.js`
- `src/main/services/hydrationSelectedIdExecutionFixtureProofService.js`
- `src/main/services/serviceRegistry.js`
- relevant gate/readout services for External I/O, live/provider gate, storage write posture, and command authority

## Task

Implement a read-only command, suggested name:

```text
metadata.hydration_selected_id_real_execution_preflight.preview
```

It should compose current facts for a future real selected-ID Hydration execution attempt:

- local-first selected-ID request posture
- non-durable pickup contract
- External I/O posture
- live/provider gate posture
- storage write posture
- supported selected-ID type
- expected write path
- execution revalidation checklist
- post-provider write checklist

## Required Behavior

The preflight must:

- be read-only
- be renderer eligible as a preview/readout only if consistent with existing service registry policy
- call no providers
- write no Hydration output
- create no `metadata_runs`
- write no `api_request_logs`
- upsert no `entities`
- patch no `activity_events`
- create no pickup/request persistence
- create no Bucket persistence
- create no Dispatcher / worker / lease / retry state
- add no schema
- mutate no Evidence/EVEidence, Discovery, Watch, Marked, Assessment Memory, storage config, External I/O config, support artifacts, runtime enforcement, or UI

It should classify at least:

- `not_a_request`
- `invalid`
- `insufficient_basis`
- `already_local`
- `local_lookup_available`
- `held`
- `blocked`
- `provider_needed_but_not_live_ready`
- `provider_needed_live_preflight_ready`

It should explicitly report:

- whether a future execution would short-circuit to local readability
- whether local basis exists
- whether selected ID type is provider-backed Hydration-supported
- whether External I/O is held/released
- whether live/provider gate is allowed/blocked
- whether storage write posture is safe/blocked
- whether command authority / confirmation would still be required
- that future execution must revalidate again immediately before provider contact
- that fixture proof is not live execution authority

## Must Not

Do not:

- call providers
- run live/API checks
- implement real provider-backed execution
- add a Dispatcher
- add a durable Bucket
- add queues, leases, retries, workers, or background Hydration
- write metadata runs
- write API logs
- write entities
- patch activity labels
- mutate Evidence/EVEidence
- mutate Discovery refs
- mutate Watch, Marked, or Assessment Memory
- alter schema
- activate runtime enforcement
- change renderer UI
- reopen the fourth lane / fast lane

## Expected Verification

Run:

```text
node --check src\main\services\serviceRegistry.js
node --check <new-or-touched-preflight-service>
node --check <new-or-touched-verifier-script>
npm.cmd run verify:hydration-selected-id-real-execution-preflight
npm.cmd run verify:hydration-selected-id-execution-fixture
npm.cmd run verify:hydration-pickup-contract
npm.cmd run verify:hydration-request-posture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
git diff --check
git status --short --branch
```

Do not run live/API/provider checks.

## Expected Handoff

Create:

```text
workspace/DevHS272-selected-id-real-execution-preflight.md
```

Include:

- files changed
- command/service shape
- preflight states covered
- gate facts composed
- table mutation proof / passive side-effect proof
- verification commands and results
- parked items

