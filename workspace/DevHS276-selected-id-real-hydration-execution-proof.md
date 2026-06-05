# DevHS276 Selected-ID Real Hydration Execution Proof

Status: complete for Overseer review

## Summary

Implemented the smallest trusted, non-renderer, one-ID real provider-backed selected-ID Hydration execution proof:

```txt
metadata.hydration_selected_id_real_execution_proof
```

The proof is controlled temp-store only. It rebuilds local-first request posture and non-durable pickup, rechecks External I/O, live/provider gate, and storage write posture, enters the real live provider attempt path, calls ESI `/universe/names` for exactly `character:92418041`, validates the response, then writes only Hydration/readability repair rows in the controlled temp store.

No real operator corpus mutation, zKillboard call, Discovery, Evidence Expansion, Bucket/Dispatcher/schema/enforcement/UI work, support artifacts, or fourth-lane work was added.

## Files Changed

- `package.json`
- `src/main/services/hydrationSelectedIdRealExecutionProofService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-hydration-selected-id-real-execution.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-service-registry.js`
- `workspace/current.md`
- `workspace/DevHS276-selected-id-real-hydration-execution-proof.md`

## Command / Service Shape

`metadata.hydration_selected_id_real_execution_proof`:

- classification: `metadata-only`
- effects: `external-live-api`, `local-data-mutation`, `metadata-readability`
- renderer eligible: false
- authority: `confirm:metadata.hydration`
- requires trusted context: `allowHydrationSelectedIdRealExecutionProof=true`
- requires controlled temp store context: `controlledTempAtlasStore=true`
- first proof target only: `character:92418041`
- dry-run coverage: `hydration_readability_repair` / `trusted_selected_id_real_hydration_execution_proof` / `trusted_controlled_proof_only`

## Controlled Store Setup

The verifier creates disposable controlled DBs under:

```txt
.tmp/hydration-selected-id-real-execution/<case>/atlas.sqlite
```

It seeds Atlas-local unresolved basis for:

```txt
character:92418041
event_key: 276:attacker:92418041
```

The real operator corpus is not opened or mutated.

## Provider Contact

Provider endpoint:

```txt
POST https://esi.evetech.net/latest/universe/names/?datasource=tranquility
```

Request body:

```json
[92418041]
```

The command uses `enterLiveProviderAttempt('metadata.hydration', ...)` before provider contact, so the proof goes through the accepted live attempt/cadence path rather than only read-only gate posture.

## Live Proof Evidence

Opt-in live command run:

```txt
$env:AURA_ATLAS_HS276_LIVE='1'; npm.cmd run verify:hydration-selected-id-real-execution
```

Live result:

```json
{
  "category": "character",
  "id": 92418041,
  "name": "Reuben Orlenard"
}
```

Persisted controlled temp-store rows:

```json
{
  "entity": {
    "entity_type": "character",
    "entity_id": 92418041,
    "entity_name": "Reuben Orlenard"
  },
  "activity_event_labels": {
    "event_key": "276:attacker:92418041",
    "entity_name": "Reuben Orlenard",
    "character_name": "Reuben Orlenard"
  },
  "metadata_run": {
    "run_type": "selected_id_real_hydration_execution_proof",
    "target_type": "character",
    "target_id": "92418041",
    "status": "success",
    "requested_from_esi": 1,
    "resolved": 1,
    "entities_upserted": 1,
    "activity_events_patched": 2,
    "api_calls_esi": 1
  },
  "api_request_log": {
    "provider": "esi",
    "method": "POST",
    "status_code": 200,
    "endpoint": "https://esi.evetech.net/latest/universe/names/?datasource=[redacted]"
  }
}
```

## Cases Covered

Focused verifier covers:

- successful selected-ID provider response
- local label short-circuit before provider contact
- External I/O held
- storage write blocked
- live/provider gate blocked
- provider selected ID missing
- provider category mismatch
- unsafe/empty provider label
- provider error
- untrusted context rejected before provider/write
- renderer invocation rejected by service registry

Default verifier uses counted fetch doubles. The opt-in live mode runs the same proof once against real ESI for the accepted target.

## Rows Touched

Successful controlled temp-store proof writes only:

- one `metadata_runs` row
- one sanitized `api_request_logs` row
- one selected `entities` row
- matching `activity_events` readability label columns only

Rejected provider-response/provider-error cases write only the metadata/API provenance rows needed for the attempted provider contact and do not upsert entities or patch labels.

Local short-circuit, held, blocked, untrusted, and renderer-rejected cases make no provider call and write no metadata/API/entity/activity rows.

## Invariants

Verified unchanged:

- raw killmail payloads
- numeric `activity_events` IDs/facts
- Discovery refs
- `fetch_runs`
- `ingestion_audits`
- `data_quality_warnings`
- Watch rows
- Assessment Memory rows

Forbidden behavior remains absent:

- no zKillboard
- no Discovery
- no Evidence Expansion
- no real operator corpus mutation
- no pickup/request persistence
- no Bucket persistence
- no Dispatcher, worker, lease, retry, queue, or background Hydration
- no schema changes
- no storage config or External I/O config writes
- no support artifacts
- no runtime enforcement or command blocking
- no renderer UI
- fourth lane stays parked

## Verification

Commands run and results:

```txt
node --check src\main\services\serviceRegistry.js
passed

node --check src\main\services\hydrationSelectedIdRealExecutionProofService.js
passed

node --check scripts\verify-hydration-selected-id-real-execution.js
passed

npm.cmd run verify:hydration-selected-id-real-execution
passed

$env:AURA_ATLAS_HS276_LIVE='1'; npm.cmd run verify:hydration-selected-id-real-execution
passed

npm.cmd run verify:hydration-selected-id-real-execution-preflight
passed

npm.cmd run verify:hydration-selected-id-execution-fixture
passed

npm.cmd run verify:hydration-pickup-contract
passed

npm.cmd run verify:hydration-request-posture
passed

npm.cmd run verify:service-registry
passed

npm.cmd run verify:command-authority
passed

npm.cmd run verify:enforcement-dry-run
passed

npm.cmd run verify:passive-side-effects
passed

npm.cmd run verify:protected-terms
passed with warning-only advisory output: 250 warnings across 7 changed working-set files before workspace handoff updates; no renames or protected-word JSON updates performed
```

## Parked Items

Still parked:

- renderer-triggered real selected-ID Hydration
- broad/live product Hydration acceptance
- report-wide or multi-ID Hydration
- background Hydration
- Watch/background Hydration pickup
- Bucket / Dispatcher / worker / lease / retry / queue dispatch
- schema changes
- runtime enforcement activation
- command blocking
- support artifacts
- UI behavior
- fourth lane / fast lane

## Recommended Next Action

Overseer review HS276. If accepted, the next decision should be whether to keep real execution proof-only, shape renderer/operator trigger semantics separately, or pause and harden another gate before product live Hydration.
