# DevHS158 Storage Authority Real Config

Status: Completed
Date: 2026-06-01
Executor: Dev

## Scope

Implemented HS158 real operator storage authority config posture without activating enforcement, migration, provider movement, or UI setup.

Final command names:

```text
storage.authority_config.readback
storage.authority_config.write
storage.authority_config.write_proof
storage.authority_config.acknowledgement_persistence_proof
```

Renderer eligibility:

- `storage.authority_config.readback`: renderer eligible, read-only
- `storage.authority_config.write`: not renderer eligible, trusted context only
- `storage.authority_config.write_proof`: not renderer eligible, fixture-only proof retained
- `storage.authority_config.acknowledgement_persistence_proof`: not renderer eligible, fixture-only proof retained

## Canonical Target

Canonical storage authority config target:

```text
<Atlas app/root>/config/storage-authority.json
```

Resolved in this repo as:

```text
F:\Projects\AURA-Atlas\config\storage-authority.json
```

The readback surface reports this app-local posture without fixture-only parameters. If the file is missing, Atlas reports missing config rather than treating the 5GB suggestion or app-local fallback as hidden acceptance.

## Config Shape

The operator config payload keeps the existing storage dry-run schema and adds real-config posture fields:

```json
{
  "schema": "aura.atlas.storage_authority",
  "version": 1,
  "selected_storage_mode": "selected_storage",
  "selected_storage_root": "F:\\Projects\\AURA-Atlas\\.tmp\\...",
  "selected_database_path": "F:\\Projects\\AURA-Atlas\\.tmp\\...\\atlas.sqlite",
  "path_basis": "explicit_selected_storage",
  "validation_status": "valid",
  "fallback_acknowledgement": {
    "status": "not_required",
    "acknowledged": false,
    "provenance": "explicit_selected_storage_or_no_fallback",
    "invalidation_basis": null
  },
  "budget_bytes": 10737418240,
  "budget_source": "operator_selected",
  "real_operator_config": false,
  "fixture_offline_only": true,
  "suggested_default_budget_bytes": 5368709120,
  "suggested_default_budget_is_acceptance": false
}
```

The focused verifier writes to a trusted fixture target, so `real_operator_config` is false and `fixture_offline_only` is true in the sample. The command is capable of writing the canonical app-local config only from trusted direct/main-process context with `allowStorageAuthorityConfigWrite`.

## Preserved Distinctions

The setup/readout path preserves:

- no storage selected
- selected storage configured and valid
- selected storage missing/unavailable
- selected storage invalid/degraded
- app-local fallback storage available but unacknowledged
- app-local fallback storage acknowledged
- `fallback_acknowledgement_needs_reconfirm`
- budget unconfigured
- budget within budget
- budget warning
- budget strong warning
- budget hard lock

App-local fallback storage remains distinct from selected storage. It is accepted only with explicit acknowledgement posture.

The 5GB value is exposed as:

```text
suggested_default_budget_bytes = 5368709120
suggested_default_budget_is_acceptance = false
```

Operators can choose another budget; the verifier demonstrates 10GB.

## Sample Output

```json
{
  "sample_real_operator_config": {
    "missing_readback_status": "missing",
    "default_config_path": "F:\\Projects\\AURA-Atlas\\config\\storage-authority.json",
    "write_target_basis": "trusted_fixture_context_target",
    "would_write": true,
    "validation_status": "storage_authority_config_write_valid",
    "write_status": "written_atomically",
    "readback_matches_payload": true,
    "selected_storage_mode": "selected_storage",
    "budget_bytes": 10737418240,
    "suggested_default_budget_bytes": 5368709120,
    "suggested_default_budget_is_acceptance": false,
    "readback_posture": {
      "storage_authority_mode": "selected_storage",
      "selected": true,
      "fallback_available": false,
      "fallback_acknowledged": false,
      "acknowledgement_status": "not_required",
      "storage_state": "configured_ready",
      "setup_gate": "ready",
      "budget_state": "within_budget",
      "budget_bytes": 10737418240,
      "suggested_default_budget_is_acceptance": false,
      "write_allowed_if_enforced_later": true,
      "provider_movement_allowed_if_enforced_later": true
    },
    "provider_calls": 0,
    "queue_dispatches": 0,
    "evidence_writes": 0,
    "hydration_writes": 0,
    "real_config_write": false
  },
  "real_project_config_exists": false
}
```

## Boundary Confirmation

Confirmed:

- no runtime enforcement
- no command interception or blocking
- no provider movement
- no zKill, ESI, or SDE calls
- no Evidence/EVEidence writes
- no Discovery ref mutation
- no Hydration writes
- no queue dispatch
- no Watch execution behavior changes
- no DB creation
- no DB/storage move, copy, migration, relocation, restore, deletion, cleanup, or pruning
- no support artifact, snapshot, or trace-pack creation
- no schema changes
- no renderer UI or setup flow
- no renderer path authority, budget forging, acknowledgement forging, app-root forging, or filesystem probing

The focused verifier confirmed:

```powershell
Test-Path config\storage-authority.json
```

returned `False`.

## Verification

Passed:

```powershell
node --check src\main\services\externalIoStateService.js
node --check src\main\services\storageAuthorityConfigWriteService.js
node --check src\main\services\storageSetupGateReadoutService.js
node --check src\main\services\storageAuthorityPreflightService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check src\main\services\gateStackReadoutService.js
node --check src\main\services\composedGatePolicyService.js
node --check scripts\verify-external-io-state.js
node --check scripts\verify-storage-authority-config-write.js
node --check scripts\verify-storage-acknowledgement-persistence.js
node --check scripts\verify-storage-setup-gate.js
node --check scripts\verify-storage-authority-preflight.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
npm.cmd run verify:storage-authority-config-write
npm.cmd run verify:storage-acknowledgement-persistence
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:external-io-state
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:hydration
npm.cmd run verify:hydration-write-fixture
npm.cmd run verify:metadata-status
npm.cmd run verify:metadata-lookup
npm.cmd run verify:actor-metadata
npm.cmd run verify:corporation-metadata
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

`verify:protected-terms` completed with warning-only discovery output and exit code 0.

`git diff --check` passed with line-ending warnings only.

Final `git status --short --branch`:

```text
## main...origin/main [ahead 35]
 M scripts/verify-command-authority.js
 M scripts/verify-composed-gate-policy.js
 M scripts/verify-enforcement-dry-run.js
 M scripts/verify-passive-side-effects.js
 M scripts/verify-service-registry.js
 M scripts/verify-storage-authority-config-write.js
 M scripts/verify-storage-setup-gate.js
 M src/main/services/composedGatePolicyService.js
 M src/main/services/enforcementDryRunService.js
 M src/main/services/serviceRegistry.js
 M src/main/services/storageAuthorityConfigWriteService.js
 M src/main/services/storageSetupGateReadoutService.js
 M workspace/current.md
?? workspace/DevHS158-storage-authority-real-config.md
```

## Risks / Follow-Up

- `storage.authority_config.write` can write the canonical config from trusted direct/main-process context when explicitly allowed.
- Runtime enforcement remains inactive. Future work still needs a separate enforcement runway before storage authority blocks provider-backed work at execution time.
- No renderer UI/setup flow exists in this packet.

