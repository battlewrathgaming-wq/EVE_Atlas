# DevHS154 Hydration Writer Fixture Proof

Status: Completed
Date: 2026-06-01
Executor: Dev

## Scope

Implemented the HS154 fixture/offline Hydration writer proof for the smallest safe readability metadata write path.

The proof adds a non-renderer service command:

```text
metadata.hydration_write_fixture_proof
```

It writes only in a trusted fixture/test context and uses existing local `entities` rows as label authority for existing `activity_events` rows. It does not call providers, create Evidence/EVEidence, mutate Discovery refs, mutate Watch/queue state, write provider-backed Hydration, change schema, or expose renderer UI.

## Files Changed

- `package.json`
- `src/main/services/hydrationWriteFixtureProofService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-hydration-write-fixture.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `workspace/current.md`
- `workspace/DevHS154-hydration-writer-fixture-proof.md`

## Implementation

- Added `buildHydrationWriteFixtureProof`.
- Registered `metadata.hydration_write_fixture_proof` as `metadata-only`, non-renderer, with `local-data-mutation` and `metadata-readability` effects.
- Added enforcement dry-run coverage as fixture-only/non-production with no External I/O dependency.
- Added focused offline verifier and npm script `verify:hydration-write-fixture`.
- Extended service registry, command authority, and enforcement dry-run verifiers for the new command.

The command requires:

```text
allowHydrationWriteFixtureProof === true
```

Without that trusted context it returns an invalid validation result and `mutates_state: false`.

## Fixture Write Shape

The fixture proof:

- derives candidates from existing local `entities` joined to existing `activity_events`
- patches only readability label columns on `activity_events`
- writes one `metadata_runs` row with `run_type = hydration_write_fixture_proof`
- records `requested_from_esi = 0` and `api_calls_esi = 0`
- keeps numeric IDs as the factual basis
- treats labels/names as Hydration metadata only

Patched columns are limited to:

- `activity_events.entity_name`
- `activity_events.character_name`
- `activity_events.corporation_name`
- `activity_events.alliance_name`

## Forgery And Boundary Proof

The verifier proves renderer-origin command authority cannot invoke the write proof:

```text
SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE
```

The fixture also supplies forged payload fields and verifies they are ignored:

- target IDs
- labels
- provider results
- database path

The service derives label authority from local fixture DB state instead of renderer/operator payload claims.

## Sample Output

```json
{
  "status": "hydration write fixture proof verified",
  "sample_write": {
    "command": "metadata.hydration_write_fixture_proof",
    "candidates_considered": 3,
    "activity_event_label_patches": 4,
    "metadata_run": {
      "run_type": "hydration_write_fixture_proof",
      "status": "success",
      "ids_discovered": 3,
      "already_known": 3,
      "requested_from_esi": 0,
      "resolved": 3,
      "activity_events_patched": 4,
      "api_calls_esi": 0
    },
    "forged_payload_authority_ignored": true,
    "invariants": {
      "numeric_activity_event_ids_unchanged": true,
      "raw_killmail_payloads_unchanged": true,
      "discovered_refs_unchanged": true,
      "fetch_runs_unchanged": true,
      "api_request_logs_unchanged": true,
      "watch_rows_unchanged": true,
      "queue_state_unchanged": true,
      "entity_rows_unchanged": true,
      "only_expected_tables_changed": true
    }
  },
  "sample_blocked_untrusted": {
    "validation_status": "trusted_hydration_write_fixture_context_required",
    "mutates_state": false
  }
}
```

Before labels:

```json
[
  {
    "event_key": "9101:attacker:90000001",
    "entity_name": null,
    "character_name": null,
    "corporation_name": null,
    "alliance_name": null
  }
]
```

After labels:

```json
[
  {
    "event_key": "9101:attacker:90000001",
    "entity_name": "Known Fixture Pilot",
    "character_name": "Known Fixture Pilot",
    "corporation_name": "Known Fixture Corp",
    "alliance_name": "Known Fixture Alliance"
  }
]
```

## Boundary Confirmation

Confirmed:

- no zKill calls
- no ESI calls
- no SDE download calls
- no provider-backed Hydration writes
- no Evidence/EVEidence writes
- no Discovery ref mutation
- no Watch state mutation
- no queue dispatch or persisted backlog
- no entity label writes or entity upserts
- no raw killmail payload mutation
- no numeric ID mutation
- no schema changes
- no storage config writes
- no storage movement, copy, migration, restore, deletion, snapshot, trace pack, cleanup, or pruning
- no runtime enforcement, authorization activation, command interception, or command blocking
- no renderer UI or renderer redesign

## Verification

Passed:

```powershell
node --check src\main\services\hydrationWriteFixtureProofService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-hydration-write-fixture.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:external-io-state
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:storage-setup-gate
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
## main...origin/main [ahead 31]
 M package.json
 M scripts/verify-command-authority.js
 M scripts/verify-enforcement-dry-run.js
 M scripts/verify-service-registry.js
 M src/main/services/enforcementDryRunService.js
 M src/main/services/serviceRegistry.js
 M workspace/current.md
?? scripts/verify-hydration-write-fixture.js
?? src/main/services/hydrationWriteFixtureProofService.js
?? workspace/DevHS154-hydration-writer-fixture-proof.md
```

## Risks / Follow-Up

- The fixture proof intentionally writes to `metadata_runs` plus `activity_events` label columns only under trusted fixture control. A future real Hydration writer packet must still decide runtime authority, storage/budget gates, External I/O release behavior, and operator-facing controls before any operator-real write path exists.
- The command is non-renderer and fixture-only/non-production. Keep it out of production enforcement/renderer surfaces unless a later runway explicitly changes that posture.
