# DevHS280 - Selected-ID Product Hydration Authority Preflight

Status: complete
Date: 2026-06-05
Executor: Dev
Runway: `workspace/OverseerHS280-selected-id-product-hydration-authority-preflight-runway.md`

## Summary

Implemented the read-only selected-ID product readability repair/Hydration authority preflight.

New command:

```txt
metadata.selected_id_readability_repair.product_preflight
```

The command is renderer-eligible as explanation only. It performs no provider calls, no Hydration writes, no corpus mutation, no product execution, no queue/Dispatcher work, no schema changes, no enforcement, and no UI work.

## Files Changed

- `package.json`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-selected-id-product-hydration-preflight.js`
- `scripts/verify-service-registry.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/selectedIdReadabilityRepairProductPreflightService.js`
- `src/main/services/serviceRegistry.js`
- `workspace/current.md`
- `workspace/DevHS280-selected-id-product-hydration-authority-preflight.md`

## Command Shape

`metadata.selected_id_readability_repair.product_preflight` reports:

- normalized selected ID type/value
- supported provider-backed product ID types: `character`, `corporation`, `alliance`
- static/local lookup posture for `inventory_type` and `solar_system`
- strong local basis from Evidence/EVEidence-derived `activity_events` appearances
- strong local basis from existing unlabeled `entities` rows
- parked/conditional basis for Watch-only, Assessment-only, and Discovery-only state
- local label short-circuit
- External I/O posture
- live/provider gate posture without provider-attempt recording
- trusted storage/write posture
- future command/run-type candidates: `metadata.selected_id_readability_repair.execute` / `selected_id_readability_repair`
- command authority and confirmation requirement: `confirm:metadata.hydration`
- expected later allowed writes and forbidden mutations
- explicit no-Bucket/no-Dispatcher requirement for this selected-ID product path

## Sample Output

Ready product preflight sample:

```json
{
  "state": "provider_needed_product_preflight_ready",
  "selected_id": {
    "id_type": "character",
    "id_value": 90000011,
    "provider_hydration_supported": true
  },
  "local_authority_state": "strong_product_basis",
  "strong_basis": ["activity_events"],
  "provider_calls": 0,
  "writes_authorized_now": false,
  "next_safe_action": "future_execution_command_must_revalidate_before_provider_contact"
}
```

Parked-only basis sample:

```json
{
  "state": "conditional_basis_only",
  "parked_basis": ["discovered_killmail_refs"],
  "provider_calls": 0,
  "writes_authorized_now": false,
  "next_safe_action": "require_evidence_activity_or_unlabeled_entity_basis_before_provider_hydration"
}
```

Renderer forgery sample:

```json
{
  "renderer_payload_authoritative": false,
  "forged_authority_keys_ignored": [
    "localLabel",
    "localBasis",
    "storageAuthority",
    "externalIo",
    "liveGate",
    "confirmationToken",
    "commandAuthority"
  ]
}
```

HS276 proof scaffolding sample:

```json
{
  "supplied_proof_flags": [
    "allowHydrationSelectedIdRealExecutionProof",
    "controlledTempAtlasStore"
  ],
  "proof_flags_authoritative": false,
  "controlled_temp_store_is_product_storage_authority": false,
  "hs276_fixed_id_is_product_default": false,
  "hs276_proof_command_is_product_authority": false
}
```

## Proof Cases

Focused verifier covered:

- character with Evidence/EVEidence-derived activity basis and no label
- corporation and alliance supported shape
- fixed HS276 ID is not special
- proof flags are non-authority
- renderer-forged authority facts are ignored
- missing local basis is rejected
- Discovery-only basis is conditional/parked
- Watch-only basis is conditional/parked
- Assessment-only basis is conditional/parked
- existing local label short-circuits
- local SDE/static ID is not ESI Hydration
- External I/O held produces held, not failure
- live gate blocked produces blocked posture without provider-attempt recording
- storage write blocked stops before provider contact
- unsupported/malformed ID is rejected
- no providers and no table writes occur

## Boundaries Confirmed

- No zKillboard or ESI calls.
- No Hydration writes.
- No `metadata_runs`, `api_request_logs`, `entities`, or `activity_events` writes.
- No Evidence/EVEidence writes.
- No Discovery ref, Watch, Marked, or Assessment Memory mutation.
- No storage config or External I/O config writes.
- No product execution.
- No Bucket, Dispatcher, worker, lease, retry, persisted queue, schema, runtime enforcement, command blocking, support artifact, or UI behavior.
- No fourth lane / fast lane.
- HS276 proof/test scaffolding remains non-authority.

## Verification

Passed:

```txt
node --check src\main\services\serviceRegistry.js
node --check src\main\services\selectedIdReadabilityRepairProductPreflightService.js
node --check scripts\verify-selected-id-product-hydration-preflight.js
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

`verify:protected-terms` passed with warning-only advisory output: 271 warnings across 8 changed working-set files. No renames or protected-word JSON updates were performed.

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
 M scripts/verify-passive-side-effects.js
 M scripts/verify-service-registry.js
 M src/main/services/enforcementDryRunService.js
 M src/main/services/serviceRegistry.js
 M workspace/current.md
?? scripts/verify-selected-id-product-hydration-preflight.js
?? src/main/services/selectedIdReadabilityRepairProductPreflightService.js
?? workspace/DevHS280-selected-id-product-hydration-authority-preflight.md
```

## Risks / Notes

- This is product authority/preflight only. Product execution remains unopened.
- The future product execution command still needs a separate accepted runway.
- The future execution path must revalidate all facts from trusted state immediately before provider contact and write.
- Parked basis classes remain visible but non-authorizing until Overseer deliberately changes policy.
