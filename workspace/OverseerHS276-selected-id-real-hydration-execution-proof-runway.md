# Overseer HS276 - Selected-ID Real Hydration Execution Proof Runway

Status: active Dev runway
Date: 2026-06-05
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS276-selected-id-real-hydration-execution-proof.md`

## Purpose

Implement the smallest trusted, non-renderer, one-ID real provider-backed selected-ID Hydration execution proof.

This is the first deliberately accepted provider-contact proof for selected-ID Hydration. It must stay narrow, controlled, and test-store based.

Human/Overseer accepted crossing the provider-contact boundary for this proof only.

Known selected-ID target:

```txt
id_type: character
id_value: 92418041
basis: Human-provided own character ID for controlled proof
```

## Accepted Basis

Read:

- `workspace/current.md`
- `workspace/OverseerHS274-selected-id-real-hydration-execution-gate-advisory-request.md`
- `workspace/EngineeringSecurityHS274-selected-id-real-hydration-execution-gate-advisory.md`
- `workspace/OverseerHS275-hs274-selected-id-real-hydration-execution-gate-review.md`
- `workspace/OverseerHS272-selected-id-real-execution-preflight-runway.md`
- `workspace/DevHS272-selected-id-real-execution-preflight.md`
- `workspace/OverseerHS273-hs272-selected-id-real-execution-preflight-review.md`
- `workspace/OverseerHS268-selected-id-hydration-execution-fixture-proof-runway.md`
- `workspace/DevHS268-selected-id-hydration-execution-fixture-proof.md`
- `workspace/OverseerHS269-hs268-hydration-execution-fixture-proof-review.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/data-layer-boundaries.md`
- `docs/contracts/metadata-hydration-contract.md`
- `src/main/services/hydrationRequestPostureService.js`
- `src/main/services/hydrationPickupContractService.js`
- `src/main/services/hydrationSelectedIdExecutionFixtureProofService.js`
- `src/main/services/hydrationSelectedIdRealExecutionPreflightService.js`
- `src/main/services/liveGateService.js`
- `src/main/services/externalIoStateService.js`
- `src/main/services/storageSetupGateReadoutService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/api/esiClient.js`
- `src/main/api/httpClient.js`
- `src/main/db/evidenceRepository.js`
- `src/main/db/schema.sql`

Preserve:

```txt
Discovery outputs possible leads.
Evidence Expansion outputs Evidence/EVEidence.
Hydration outputs readability repair.
Fourth lane stays parked.

Request posture is pickup-readable, not pickup.
Pickup is not execution.
Execution is not write until the write path succeeds under policy.
```

## Task

Add a trusted, non-renderer selected-ID real Hydration execution proof command.

Suggested command:

```txt
metadata.hydration_selected_id_real_execution_proof
```

The command should prove:

```txt
controlled temp Atlas store with local unresolved ID basis
-> explicit trusted selected-ID execution context
-> rebuild local-first request posture
-> rebuild non-durable pickup contract
-> re-read External I/O and live/provider gate
-> enter live provider attempt path for one ESI names lookup
-> call ESI /universe/names for exactly one ID
-> validate provider response
-> write Hydration readability repair transaction in the controlled temp store
-> finalize metadata run
-> verify allowed rows only
```

## Required Behavior

The proof must:

- be non-renderer eligible
- require trusted proof context
- use a controlled temp/test Atlas store, not the operator corpus
- intentionally seed local Atlas basis for `character:92418041` in the controlled store
- preserve the rule that Hydration only acts on an Atlas-local selected unresolved ID
- accept exactly one selected ID
- support only `character` for this first proof unless expanding to `corporation` / `alliance` is trivial and still bounded
- rebuild request posture from trusted local state immediately before provider contact
- rebuild pickup contract as non-durable candidate only
- short-circuit without provider contact if the selected label is already local
- require External I/O on / released to normal gates
- require live/provider gate approval
- use real accepted-attempt recording/cadence path, not read-only gate posture only
- require storage/write posture to allow Hydration readability writes before provider contact
- call ESI `/universe/names` for exactly one ID
- validate returned ID, category/type, and label safety before writing
- write only Hydration/readability repair rows in the controlled temp store
- report before/after table counts and invariants
- clearly report whether a real provider call occurred

Allowed writes in the controlled temp store:

- one `metadata_runs` row for selected-ID real Hydration
- one sanitized `api_request_logs` row only if provider contact occurs
- selected `entities` row for the returned character label
- matching `activity_events` readability label columns only

## Must Not

Do not:

- make the command renderer eligible
- run broad live/API testing
- call any provider endpoint except the single ESI `/universe/names` lookup for the selected ID
- call zKillboard
- perform Discovery
- perform Evidence Expansion
- mutate the real operator corpus
- create real pickup/request persistence
- create Bucket persistence
- create Dispatcher, worker, lease, retry, queue, or background Hydration machinery
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

```txt
node --check src\main\services\serviceRegistry.js
node --check <new-or-touched-selected-id-real-execution-service>
node --check <new-or-touched-verifier-script>
npm.cmd run verify:hydration-selected-id-real-execution
npm.cmd run verify:hydration-selected-id-real-execution-preflight
npm.cmd run verify:hydration-selected-id-execution-fixture
npm.cmd run verify:hydration-pickup-contract
npm.cmd run verify:hydration-request-posture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If the live proof requires environment configuration such as live API enablement or User-Agent, state the exact requirement in the handoff. Do not bypass existing gate posture.

## Acceptance Notes

The handoff must include:

- files changed
- command/service shape
- controlled temp store setup
- local basis seeded for `character:92418041`
- provider endpoint called
- proof that only one provider lookup was attempted
- provider response validation result
- write rows touched
- table/invariant proof summary
- local short-circuit proof
- gate blocked / held cases covered
- verification commands and results
- explicit parked items

