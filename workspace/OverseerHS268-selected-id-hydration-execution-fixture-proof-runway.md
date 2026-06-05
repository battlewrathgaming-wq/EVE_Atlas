# Overseer HS268 - Selected-ID Hydration Execution Fixture Proof Runway

Status: active Dev runway
Date: 2026-06-05
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS268-selected-id-hydration-execution-fixture-proof.md`

## Purpose

Add the smallest fixture-only selected-ID Hydration execution proof.

This proof should exercise the execution/write boundary after HS260 request posture and HS264 pickup contract, but with injected fixture provider results only. It must not call providers or create real operator Hydration execution.

## Accepted Basis

Read:

- `workspace/current.md`
- `workspace/OverseerHS266-selected-id-hydration-execution-readiness-advisory-request.md`
- `workspace/DataEngineeringHS266-selected-id-hydration-execution-readiness-advisory.md`
- `workspace/OverseerHS267-hs266-hydration-execution-readiness-review.md`
- `workspace/OverseerHS264-hydration-pickup-eligibility-contract-preview-runway.md`
- `workspace/DevHS264-hydration-pickup-eligibility-contract-preview.md`
- `workspace/OverseerHS265-hs264-hydration-pickup-contract-review.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/data-layer-boundaries.md`
- `src/main/services/hydrationRequestPostureService.js`
- `src/main/services/hydrationPickupContractService.js`
- `src/main/services/hydrationWriteFixtureProofService.js`
- `src/main/metadata/reportHydrator.js`
- `src/main/db/evidenceRepository.js`
- `src/main/db/schema.sql`

Preserve:

```text
Discovery outputs possible leads.
Evidence Expansion outputs Evidence/EVEidence.
Hydration outputs readability repair.
Fourth lane stays parked.

Request posture is pickup-readable, not pickup.
Pickup is not execution.
Execution is not write until the write path succeeds under policy.
```

## Task

Implement a trusted fixture/offline command, suggested name:

```text
metadata.hydration_selected_id_execution_fixture_proof
```

The command should prove:

```text
selected-ID pickup contract
-> trusted execution revalidation
-> fixture provider response
-> provider-response validation
-> Hydration write transaction
-> metadata_runs / entities / activity_events / api_request_logs proof
```

## Required Behavior

The fixture proof must:

- be non-renderer eligible
- require trusted fixture context
- use no live/API/provider calls
- use injected/fake provider response only
- accept only one selected ID for the first proof
- support provider-backed Hydration ID types only:
  - `character`
  - `corporation`
  - `alliance`
- rebuild request posture from trusted local state
- reject pickup/execution for:
  - `not_a_request`
  - `invalid`
  - `insufficient_basis`
  - `already_local`
  - `local_lookup_available`
  - `held`
  - `blocked`
- accept only rebuilt request posture:
  - `provider_needed`
  - `released_to_normal_gates_only`
- short-circuit if a local label appears before fixture provider execution
- validate fixture provider response before writing
- reject provider response ID mismatch
- reject provider response category/type mismatch
- reject empty, missing, unsafe, or unsupported provider labels
- write `metadata_runs` for selected-ID Hydration fixture provenance
- write sanitized `api_request_logs` only if the fixture simulates a provider attempt through the logging path
- upsert `entities` only for the selected valid provider result
- patch only matching `activity_events` readability label columns
- preserve numeric IDs as facts
- preserve raw killmail payloads and Evidence/EVEidence rows
- finalize failure/partial cases without stray writes
- report before/after table counts and invariant checks

## Must Not

Do not:

- call providers
- run live/API checks
- create real operator Hydration execution
- make the command renderer eligible
- create pickup/request persistence
- create queues, dispatcher, worker, leases, retries, or background machinery
- add schema
- mutate `killmails`
- mutate raw ESI killmail payloads
- mutate `activity_events` numeric IDs, roles, killmail IDs, ship IDs, system IDs, damage, final blow, timing, or other Evidence facts
- mutate `discovered_killmail_refs`
- mutate `fetch_runs`, Evidence `ingestion_audits`, or Evidence-related `data_quality_warnings`
- mutate Watch rows
- mutate Marked / `watchlist_entities`
- mutate Assessment Memory / `assessment_artifacts`
- mutate storage config or External I/O config
- create support artifacts
- activate runtime enforcement or command blocking
- change renderer UI
- reopen the fourth lane

## Expected Verification

Run:

```text
node --check src\main\services\serviceRegistry.js
node --check <new-or-touched-selected-id-fixture-service>
node --check <new-or-touched-verifier-script>
npm.cmd run verify:hydration-selected-id-execution-fixture
npm.cmd run verify:hydration-pickup-contract
npm.cmd run verify:hydration-request-posture
npm.cmd run verify:hydration-write-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
git diff --check
git status --short --branch
```

Do not run live/API/provider checks.

## Acceptance Notes

The handoff must include:

- files changed
- command/service shape
- fixture cases covered
- write rows touched
- table/invariant proof summary
- verification commands and results
- explicit parked items

