# DevHS268 Selected-ID Hydration Execution Fixture Proof

Status: complete for Overseer review

## Summary

Implemented the fixture-only selected-ID Hydration execution proof:

```txt
selected-ID pickup contract
-> trusted execution revalidation
-> fixture provider response
-> provider-response validation
-> Hydration write transaction
-> metadata_runs / entities / activity_events / api_request_logs proof
```

New command:

```txt
metadata.hydration_selected_id_execution_fixture_proof
```

The command is trusted fixture-only and not renderer eligible. It uses injected fixture provider results only. It does not call live providers or create real operator Hydration execution.

## Files Changed

- `package.json`
- `src/main/services/hydrationSelectedIdExecutionFixtureProofService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-hydration-selected-id-execution-fixture.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `workspace/current.md`
- `workspace/DevHS268-selected-id-hydration-execution-fixture-proof.md`

## Command / Service Shape

`metadata.hydration_selected_id_execution_fixture_proof`:

- requires `allowHydrationSelectedIdExecutionFixtureProof=true`
- rejects renderer invocation
- accepts one selected ID
- supports only `character`, `corporation`, and `alliance`
- rebuilds HS264 pickup contract from trusted local state
- accepts only rebuilt `provider_needed` / `released_to_normal_gates_only`
- validates fixture provider response before writes
- writes Hydration/readability proof rows only

## Fixture Cases Covered

Success:

```txt
request_posture_state=provider_needed
provider_posture=released_to_normal_gates_only
metadata_run_status=success
metadata_run_writes=1
api_request_log_writes=1
entities_upserted=1
activity_event_label_patches=2
```

Rejected:

```txt
not_a_request
invalid
insufficient_basis
already_local / local label short-circuit
local_lookup_available
held
blocked
provider response ID mismatch
provider response category/type mismatch
empty or unsafe provider label
```

Rejected cases finalize fixture `metadata_runs` as partial/failed and do not upsert entities or patch activity labels.

## Write Rows Touched

Success case touches only:

- `metadata_runs`: one selected-ID fixture Hydration run
- `api_request_logs`: one sanitized fixture ESI log when simulated
- `entities`: one selected entity upsert
- `activity_events`: matching readability label columns only

No `killmails`, raw payloads, numeric activity facts, Discovery refs, `fetch_runs`, ingestion audits, data quality warnings, Watch, Marked, Assessment Memory, queues, schema, config, support artifacts, runtime enforcement, or renderer UI are changed.

## Invariant Proof Summary

Focused verifier proves:

- numeric activity-event IDs/facts unchanged
- raw killmail payloads unchanged
- Discovery refs unchanged
- `fetch_runs` unchanged
- Watch rows unchanged
- Assessment Memory rows unchanged
- only expected tables changed in success
- failure/partial cases have no stray entity or activity label writes

## Verification

Commands run and results:

```txt
node --check src\main\services\serviceRegistry.js
passed

node --check src\main\services\hydrationSelectedIdExecutionFixtureProofService.js
passed

node --check scripts\verify-hydration-selected-id-execution-fixture.js
passed

npm.cmd run verify:hydration-selected-id-execution-fixture
passed

npm.cmd run verify:hydration-pickup-contract
passed

npm.cmd run verify:hydration-request-posture
passed

npm.cmd run verify:hydration-write-fixture
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
passed with warning-only advisory output: 248 warnings across 7 changed working-set files; no renames or protected-word JSON updates performed

git diff --check
passed with CRLF normalization warnings only

git status --short --branch
branch main...origin/main with HS268 working-tree changes
```

## Explicit Parked Items

Still parked:

- real provider-backed selected-ID Hydration execution
- renderer UI trigger behavior
- durable pickup/request persistence
- queues, dispatcher, worker, lease, retry, or background Hydration machinery
- Watch/background Hydration pickup
- freshness refresh policy
- broad report/corpus Hydration changes
- Evidence Expansion changes
- Discovery changes
- fourth-lane design
- runtime enforcement activation or command blocking
- schema changes
- support artifacts
- pruning/deletion

## Recommended Next Action

Overseer review HS268. If accepted, the next decision should be whether to shape real selected-ID execution gates or pause before any provider-backed product behavior is opened.
