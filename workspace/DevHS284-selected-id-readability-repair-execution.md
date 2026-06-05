# DevHS284 - Selected-ID Readability Repair Execution

Status: complete
Date: 2026-06-05
Executor: Dev
Runway: `workspace/OverseerHS284-selected-id-readability-repair-execution-runway.md`

## Summary

Implemented the narrow trusted, non-renderer product Resolve execution command:

```txt
metadata.selected_id_readability_repair.execute
selected_id_readability_repair
```

Resolve repairs readability for one selected unresolved local ID. Internally this remains Hydration/readability repair. It does not create Evidence/EVEidence.

## Files Changed

- `package.json`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-selected-id-readability-repair-execution.js`
- `scripts/verify-service-registry.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/selectedIdReadabilityRepairExecutionService.js`
- `src/main/services/serviceRegistry.js`
- `workspace/current.md`
- `workspace/DevHS284-selected-id-readability-repair-execution.md`

## Command Shape

`metadata.selected_id_readability_repair.execute` is:

- trusted / non-renderer only
- authority-gated with `confirm:metadata.hydration`
- one selected ID only
- user-facing act: `Resolve`
- internal lane: Hydration/readability repair
- product run type: `selected_id_readability_repair`
- supported for `character`, `corporation`, and `alliance`
- strong-local-basis only
- local-first with quiet already-readable closure
- storage, External I/O, live/provider, cadence, and command-authority gated

Allowed writes after accepted provider contact:

- `metadata_runs`
- sanitized `api_request_logs`
- selected `entities` row
- matching `activity_events` readability label columns only

## Sample Output

Success:

```json
{
  "outcome": "success",
  "selected_id": {
    "id_type": "character",
    "id_value": 90000021
  },
  "provider_calls": 1,
  "metadata_run_status": "success",
  "write_summary": {
    "metadata_run_writes": 1,
    "api_request_log_writes": 1,
    "entities_upserted": 1,
    "activity_event_label_patches": 2
  }
}
```

Already readable:

```json
{
  "outcome": "already_readable",
  "provider_calls": 0,
  "metadata_run_status": null,
  "write_summary": {
    "metadata_run_writes": 0,
    "api_request_log_writes": 0,
    "entities_upserted": 0,
    "activity_event_label_patches": 0
  }
}
```

Provider outcomes:

```json
{
  "unresolved": {
    "outcome": "partial_unresolved",
    "metadata_run_status": "partial",
    "entities_upserted": 0,
    "activity_event_label_patches": 0
  },
  "category_mismatch": {
    "outcome": "provider_response_rejected",
    "metadata_run_status": "failed"
  },
  "unsafe_label": {
    "outcome": "provider_response_rejected",
    "metadata_run_status": "failed"
  },
  "provider_error": {
    "outcome": "provider_error",
    "metadata_run_status": "failed"
  }
}
```

## Proof Cases

Focused verifier covered:

- successful character Resolve with Evidence/EVEidence-derived activity basis
- successful corporation Resolve
- successful alliance Resolve
- existing local label short-circuits with no provider/no write/no audit row
- local label appears before write and prevents overwrite
- unsupported/malformed ID rejected before provider
- local SDE/static ID rejected from ESI names path
- missing local basis rejected
- Discovery-only basis rejected as non-authorizing
- Watch-only basis rejected as non-authorizing
- Assessment-only basis rejected as non-authorizing
- External I/O held produces held/no provider/no write
- live/provider gate blocked produces no accepted attempt/no write
- storage blocked stops before provider/no write
- provider unresolved response produces partial/no label write
- provider category mismatch fails/no label write
- provider unsafe/empty label fails/no label write
- provider/network error fails/no label write
- renderer invocation rejected
- missing confirmation rejected under authority enforcement
- HS276 proof flags rejected as non-authority
- fixed HS276 ID not special
- allowed table writes only in success/provider-contact cases
- forbidden tables unchanged

## Boundaries Confirmed

- No zKillboard calls.
- No killmail expansion or Evidence/EVEidence creation.
- No raw ESI killmail payload mutation.
- No numeric `activity_events` fact mutation.
- No `discovered_killmail_refs`, `fetch_runs`, `ingestion_audits`, Evidence-related `data_quality_warnings`, Watch, Marked, or Assessment Memory mutation.
- No storage config or External I/O config writes.
- No support artifacts.
- No schema changes.
- No runtime enforcement or command blocking activation.
- No renderer/UI trigger or confirmation behavior.
- No background/report-wide/multi-ID Hydration.
- No Watch/background Hydration pickup.
- No Bucket, Dispatcher, worker, lease, retry, or persisted queue behavior.
- No fourth lane / fast lane.
- HS276 proof/test flags are not product authority.

## Verification

Passed:

```txt
node --check src\main\services\serviceRegistry.js
node --check src\main\services\selectedIdReadabilityRepairExecutionService.js
node --check scripts\verify-selected-id-readability-repair-execution.js
npm.cmd run verify:selected-id-readability-repair-execution
npm.cmd run verify:selected-id-product-hydration-preflight
npm.cmd run verify:hydration-selected-id-real-execution-preflight
npm.cmd run verify:hydration-pickup-contract
npm.cmd run verify:hydration-request-posture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
```

`verify:protected-terms` passed with warning-only advisory output: 253 warnings across 7 changed working-set files. No renames or protected-word JSON updates were performed.

Final hygiene:

```txt
git diff --check
```

Result: passed; CRLF normalization warnings only.

```txt
git status --short --branch
```

Result:

```txt
## main...origin/main
 M package.json
 M scripts/verify-command-authority.js
 M scripts/verify-enforcement-dry-run.js
 M scripts/verify-service-registry.js
 M src/main/services/enforcementDryRunService.js
 M src/main/services/serviceRegistry.js
 M workspace/current.md
?? scripts/verify-selected-id-readability-repair-execution.js
?? src/main/services/selectedIdReadabilityRepairExecutionService.js
?? workspace/DevHS284-selected-id-readability-repair-execution.md
```

## Risks / Notes

- Verification used fixture/injected ESI responses only. No live/API verification was performed or needed for HS284.
- The command is non-renderer; renderer-triggered Resolve and UI confirmation behavior remain parked.
- This opens a direct product Resolve execution path, not background/report-wide/multi-ID Hydration.
- Future UI work must not bypass command authority, local-first checks, External I/O, storage, live/provider cadence, or the one-ID selected Resolve shape.
