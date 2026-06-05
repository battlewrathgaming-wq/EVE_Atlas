# Data Engineering HS266 - Selected-ID Hydration Execution Readiness Advisory

Status: advisory artifact
Role: Engineering / Data Engineering / Security advisory
Date: 2026-06-05
Request: `workspace/OverseerHS266-selected-id-hydration-execution-readiness-advisory-request.md`

## 1. Executive Recommendation

Atlas is not ready for a real provider-backed selected-ID Hydration execution packet yet.

Atlas is ready for a smaller fixture-only selected-ID Hydration execution proof. That proof should use the accepted HS260 request posture and HS264 pickup contract as preconditions, inject a fake provider response, and prove the selected-ID execution/write lifecycle without live provider calls.

Recommended next shape:

```text
selected-ID pickup contract
-> trusted execution revalidation
-> fixture provider response
-> provider-response validation
-> Hydration write transaction
-> metadata_runs / entities / activity_events / api_request_logs proof
```

Do not open real provider-backed execution until Atlas proves that a selected-ID execution path can:

- revalidate from trusted local state before provider contact;
- short-circuit if the label became local;
- handle provider response mismatch/unresolved/error cases;
- write only Hydration/readability structures;
- preserve Evidence/EVEidence, Discovery, Watch, Marked, Assessment Memory, schema, queues, dispatcher/worker state, and the parked fourth lane.

## 2. Readiness Classification

Selected-ID Hydration execution is ready only for a smaller proof.

The current state is strong enough to define the execution contract:

- `metadata.hydration_request_posture.preview` proves explicit selected-ID posture.
- `metadata.hydration_pickup_contract.preview` proves non-durable pickup candidate and execution-input hints.
- `metadata.hydration_write_fixture_proof` proves local label patching from existing `entities`.
- Existing `metadata.hydration` code proves that Hydration can create `metadata_runs`, call ESI names through `EsiClient`, upsert `entities`, patch `activity_events`, and count `api_request_logs`.

The current state is not strong enough for real provider-backed selected-ID execution because the write-capable path is report/scoped-run shaped, not selected-ID execution shaped. It creates a `metadata_runs` row before provider resolution, accepts broader `target` modes, and does not yet prove a selected-ID-only lifecycle from HS264 pickup hints through fake provider response validation and write outcome.

## 3. Required Revalidation Before Provider Call

A future selected-ID execution command must rebuild authority from trusted local state. It must not trust renderer posture, renderer labels, renderer gates, or HS264 hint material as authority.

Required pre-provider steps:

1. Normalize and validate the selected ID.
   - Supported provider-backed Hydration ID types only: `character`, `corporation`, `alliance`.
   - Numeric safe positive ID.
   - One selected ID for the first proof.
   - Static `inventory_type`, `solar_system`, region, constellation, ship/type, and SDE gaps remain local lookup/SDE readiness, not ESI name Hydration.

2. Rebuild request posture.
   - Require explicit operator act.
   - Require Atlas-local basis.
   - Reject `not_a_request`, `invalid`, `insufficient_basis`, `already_local`, `local_lookup_available`, `held`, and `blocked`.
   - Accept only `provider_needed` plus `released_to_normal_gates_only`.

3. Short-circuit local readability.
   - Check `activity_events`, `entities`, `watchlist_entities`, and accepted local readability tables again.
   - If a label now exists, do not call provider.
   - If local SDE/static lookup can resolve it, do not call provider.

4. Revalidate provider gates.
   - External I/O must be on/released to normal gates.
   - Live/provider gate must allow `metadata.hydration`.
   - Cadence/cooldown/lockout must allow the attempt.
   - Execution-time code should use the real attempt gate, not the read-only `actionGate` posture path, when it is actually about to call the provider.
   - Confirmation must be satisfied through the existing command authority model.

5. Revalidate write gates.
   - Storage authority and budget posture must allow Hydration writes.
   - Runtime enforcement/command blocking must remain inactive unless a later accepted packet activates it.
   - No schema, queue, dispatcher, worker, retry, lease, or fourth-lane state is needed for selected-ID execution proof.

## 4. Required Revalidation Before Local Write

After provider response and before local write, execution must validate the provider output and re-check local state.

Required post-provider steps:

1. Validate response shape.
   - The result must include the requested ID.
   - Provider category must match the requested `id_type`.
   - Name must be present, bounded, and safe for persistence.
   - Unknown, unsupported, empty, or mismatched categories must not write labels.

2. Re-check local state before writing.
   - If another operation resolved the same ID while the provider call was in flight, execution should avoid unnecessary overwrite unless policy explicitly allows refresh.
   - For the first proof, prefer no overwrite of a newly local label unless the proof defines a strict same-value update case.

3. Write transactionally.
   - Upsert exactly the selected entity row where valid.
   - Patch only allowed `activity_events` label columns for matching numeric IDs.
   - Keep numeric IDs unchanged.
   - Keep raw killmail payloads unchanged.
   - Finalize `metadata_runs` as success, partial/unresolved, or failed according to outcome.

4. Preserve failure meaning.
   - Provider unresolved response is not Evidence failure.
   - Missing label is still not report failure.
   - Provider error should finalize Hydration run failure/partial state without mutating Evidence/EVEidence or Discovery.

## 5. Existing Write Path Assessment

Existing write-capable Hydration code is useful but should not be used blindly as selected-ID execution.

Reusable pieces:

- `EvidenceRepository.createMetadataRun(...)`
- `EvidenceRepository.finalizeMetadataRun(...)`
- `EvidenceRepository.insertApiRequestLog(...)` through the existing HTTP/client stack
- `reportHydrator.applyResolvedNames(...)`
- `reportHydrator.patchKnownEntityNames(...)`
- `reportHydrator.hydrateExplicitEntityIds(...)` as a nearby shape for explicit IDs

Risks if reused directly:

- `runMetadataHydrationService(...)` is target-mode based (`actor`, `corporation`, `radius`, `report_ids`, `operators`, `system`), not selected-ID pickup based.
- `hydrateExplicitEntityIds(...)` accepts many IDs and creates a run before selected-ID revalidation is proven.
- Existing report hydrators collect broader report candidates and may hydrate more than the selected ID.
- Existing execution combines run creation, local known patching, provider lookup, entity upsert, label patching, and run finalization in one path.
- Current fixture write proof only patches from existing local `entities`; it does not prove provider-result application for one selected unresolved ID.

Recommendation: the next proof should adapt/reuse lower-level writer functions, but define a selected-ID execution wrapper in fixture-only form before real provider contact is allowed.

## 6. Required Output / Write Rows

Successful selected-ID Hydration execution should write or update only Hydration/readability structures.

Expected successful output:

- `metadata_runs`
  - one Hydration run row for selected-ID execution provenance;
  - `run_type` should be specific enough to distinguish selected-ID execution from report-wide Hydration;
  - `target_type` and `target_id` should identify the selected ID or selected-ID request target;
  - counters should reflect one considered ID, provider request count, resolved/unresolved outcome, entity upsert, label patch count, and ESI API calls.

- `api_request_logs`
  - metadata run-associated ESI name lookup log where the provider call occurs;
  - sanitized endpoint/error fields must preserve HS192 hardening.

- `entities`
  - upsert/update for `character`, `corporation`, or `alliance` only when provider response matches the requested ID/type and supplies a usable name.

- `activity_events`
  - label column patches only for existing rows where numeric IDs match;
  - no numeric ID changes;
  - no new activity rows.

Valid non-success output:

- `metadata_runs` finalized as failed or partial/unresolved;
- `api_request_logs` if a provider attempt occurred;
- no `entities` upsert or `activity_events` label patch when provider response is invalid/unresolved/mismatched.

## 7. Must Not Be Written

Selected-ID Hydration execution must not write or mutate:

- `killmails`
- raw ESI killmail payloads
- `activity_events` numeric IDs, roles, killmail IDs, ship IDs, system IDs, damage, final-blow facts, or timing facts
- `discovered_killmail_refs`
- `fetch_runs`
- `ingestion_audits`
- `data_quality_warnings` for Evidence expansion
- Watch rows
- Marked / `watchlist_entities` except as already-existing local label read source
- Assessment Memory / `assessment_artifacts`
- queues, pickup rows, leases, retry state, workers, or dispatcher state
- schema
- storage config or External I/O config
- support artifacts
- renderer UI state

Hydration writes readability. It must not create Evidence/EVEidence, Discovery, Observation, or Assessment Memory.

## 8. Recommended Smallest Next Packet

Recommended next packet:

```text
fixture-only selected-ID Hydration execution proof
```

Why this is the smallest useful next step:

- A read-only execution preflight would mostly restate HS260 and HS264.
- A real provider-backed execution packet would be premature because provider-response validation and selected-ID write boundaries are not yet proven.
- A fixture-only proof can exercise the important execution/write boundary with injected provider results, no live/API calls, and disposable test data.
- Another advisory/design pass is not necessary unless Overseer wants product wording or UI behavior decided first.

The proof should be non-renderer eligible or trusted-fixture-context only. It should not create a product command for real operator Hydration execution.

## 9. Acceptance Criteria For The Next Packet

A fixture-only selected-ID Hydration execution proof should prove:

- command is fixture/offline only and not renderer eligible;
- no live/API/provider calls;
- no real ESI client unless injected/fake fixture client;
- accepted input starts from selected-ID request facts or HS264-style hints but rebuilds trusted posture;
- rejects `not_a_request`, `invalid`, `insufficient_basis`, `already_local`, `local_lookup_available`, `held`, and `blocked`;
- short-circuits if a local label appears before fixture provider execution;
- uses only `character`, `corporation`, and `alliance` selected IDs;
- rejects provider response ID mismatch;
- rejects provider response category/type mismatch;
- rejects empty/unsupported provider labels;
- writes `metadata_runs` for selected-ID Hydration provenance;
- writes sanitized `api_request_logs` only if the fixture simulates a provider attempt through the logging path;
- upserts `entities` only for the selected valid provider result;
- patches only matching `activity_events` readability label columns;
- preserves numeric IDs as facts;
- preserves raw killmail payloads and Evidence/EVEidence rows;
- preserves Discovery refs, Watch, Marked, Assessment Memory, queues, schema, support artifacts, storage config, External I/O config, runtime enforcement, and UI;
- finalizes failure/partial cases without stray writes;
- reports exact before/after table count and invariant checks.

## 10. Verification Commands / Evidence Expected

Expected local checks for the next packet:

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

Verification performed for this advisory:

```text
npm.cmd run verify:hydration-pickup-contract
npm.cmd run verify:hydration-request-posture
npm.cmd run verify:hydration-write-fixture
git status --short --branch
```

Results:

- `verify:hydration-pickup-contract` passed and proved non-candidate rejection, a non-durable `provider_needed` / `released_to_normal_gates_only` pickup candidate, execution input as hints only, renderer anti-forgery, and no execution/writes.
- `verify:hydration-request-posture` passed and proved explicit request posture states, local-first short-circuit, held/blocked posture, and no provider calls or writes.
- `verify:hydration-write-fixture` passed and proved fixture/offline local label patching, one `metadata_runs` row, unchanged numeric IDs, unchanged raw killmail payloads, unchanged Discovery refs, unchanged `api_request_logs`, unchanged Watch rows, unchanged entity rows, and no provider calls.
- `git status --short --branch` showed `## main...origin/main` before this advisory artifact was added.

## 11. Human Or Overseer Decisions Needed

Overseer decision needed:

- decide whether to open the recommended fixture-only selected-ID Hydration execution proof;
- decide whether the proof should adapt `hydrateExplicitEntityIds(...)`, lower-level `applyResolvedNames(...)`, or a small new selected-ID fixture wrapper;
- decide the exact `metadata_runs.run_type` / target naming for selected-ID Hydration execution proof;
- decide whether fixture `api_request_logs` should be simulated through the existing HTTP/client logging path or represented as a no-live-call fixture log proof.

Human decision is not required unless selected-ID Hydration execution is intended to become real provider-backed product behavior immediately. If so, that should be an explicit Human/Overseer decision after fixture proof, not a side effect of this advisory.

## 12. Parked Items

- Real provider-backed selected-ID Hydration execution.
- Renderer UI trigger behavior.
- Durable pickup/request persistence.
- Queue, dispatcher, worker, lease, retry, or background Hydration machinery.
- Watch/background Hydration pickup.
- Freshness refresh policy.
- Broad report/corpus Hydration changes.
- Evidence Expansion changes.
- Discovery changes.
- Fourth-lane design.
- Runtime enforcement activation or command blocking.
- Schema changes.
- Support artifacts.
- Pruning/deletion.
