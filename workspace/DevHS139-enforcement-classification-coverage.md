# DevHS139 - Enforcement Classification Coverage

Status: complete
Date: 2026-05-31
Role: Dev

## Summary

Added a read-only enforcement dry-run coverage layer so every current Atlas service command is mapped to a storage/action class or explicit enforcement posture before runtime enforcement is considered.

This remains a proof/readout only. It does not intercept commands, block commands, call providers, write Evidence/EVEidence, write hydration output, move storage, execute pruning/deletion, change schema, or add renderer/UI work.

## Files Changed

- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-enforcement-dry-run.js`
- `workspace/current.md`
- `workspace/DevHS139-enforcement-classification-coverage.md`

Existing untracked advisory file preserved untouched:

- `workspace/EngineeringSafetyAuditHS138-enforcement-dry-run-coverage-review.md`

## Classification Shape Added

Each service command coverage row now includes:

```json
{
  "command": "manual.expansion",
  "storage_action_class": "esi_evidence_expansion",
  "external_io_dependency": "esi_provider_required",
  "runtime_context": "operator_esi_evidence_expansion",
  "enforcement_status": "covered_provider_and_storage_gated",
  "notes": "Calls ESI and writes selected expanded killmail Evidence/EVEidence."
}
```

Coverage summary fields:

- `status`
- `total_commands`
- `covered_commands`
- `gap_commands`
- `provider_or_external_io_commands`
- `fixture_only_commands`
- `scheduled_background_watch_commands`
- `commands`

## Sample Coverage Output

From `npm.cmd run verify:enforcement-dry-run`:

```json
{
  "status": "complete",
  "total_commands": 51,
  "covered_commands": 51,
  "gap_commands": [],
  "provider_or_external_io_commands": [
    "manual.discovery",
    "manual.expansion",
    "actor.watch",
    "system.radius.watch",
    "metadata.hydration",
    "sde.build-lookups",
    "watch.executor.arm",
    "watch.executor.tick"
  ],
  "fixture_only_commands": [
    "storage.authority_config.write_proof",
    "storage.authority_config.acknowledgement_persistence_proof"
  ],
  "scheduled_background_watch_commands": [
    "actor.watch",
    "system.radius.watch",
    "watch.create",
    "watch.update",
    "watch.list",
    "watch.schedule",
    "watch.offline_readout",
    "watch.recordRun",
    "watch.executor.status",
    "watch.executor.arm",
    "watch.executor.disarm",
    "watch.executor.tick"
  ]
}
```

## Missing Classification Behavior

`scripts/verify-enforcement-dry-run.js` now imports `buildCommandCoverageReport()` and appends a fixture-only fake command:

```text
fixture.unclassified.command
```

The verifier asserts that this synthetic command produces:

```json
{
  "status": "gaps",
  "gap_commands": ["fixture.unclassified.command"]
}
```

The real registry must report `coverage.status: complete`; adding a new service command without classification will fail `verify:enforcement-dry-run`.

## Boundary Confirmation

Confirmed:

- enforcement remains inactive
- no runtime command interception
- no actual command blocking
- no provider/API calls
- no Evidence/EVEidence writes
- no hydration writes
- no storage move/copy/delete
- no pruning/deletion execution
- no schema change
- no renderer/UI work

## Verification

Passed:

```powershell
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:command-authority
npm.cmd run verify:service-registry
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
```

`verify:protected-terms` completed with warning-only discovery output and exit code 0.

Final checks still to run after this handoff write:

```powershell
git diff --check
git status --short --branch
```
