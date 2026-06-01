# Dev HS152 External I/O Persisted State Proof

Status: Complete

## Scope

Implemented a bounded fixture/offline External I/O persisted state proof.

Commands added:

```text
external_io.state_readout
external_io.state_persistence_proof
```

The proof answers whether Atlas can persist and read back External I/O state safely in a fixture/trusted context. It does not answer whether Atlas may call providers now.

## Files Changed

- `src/main/services/externalIoStateService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-external-io-state.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS152-external-io-persisted-state.md`

## Implementation Notes

- `external_io.state_readout` is renderer-eligible and read-only.
- `external_io.state_persistence_proof` is trusted-context-only and not renderer eligible.
- Fixture proof writes only when trusted context provides:
  - `allowExternalIoStatePersistenceProof`
  - `allowExternalIoStateFixtureTarget`
  - `externalIoStateTargetPath`
  - `externalIoStateAllowedRoot`
- Fixture state is written atomically and read back from the explicit allowed fixture root.
- Accepted input states normalize to Atlas labels:
  - `off` / `disabled` -> `off`
  - `on` / `enabled` -> `on`
- Renderer readout ignores payload attempts to forge state, path, acknowledgement, or budget.

## Sample Proof Output

Focused verifier sample:

```json
{
  "status": "external io state persistence proof verified",
  "sample_off": {
    "normalized_state": "off",
    "provider_backed_posture": "held_by_external_io",
    "provider_calls": 0,
    "real_config_write": false
  },
  "sample_on": {
    "normalized_state": "on",
    "provider_backed_posture": "released_to_normal_gates",
    "on_is_authorization": false,
    "queue_dispatches": 0,
    "provider_calls": 0,
    "real_config_write": false
  },
  "sample_renderer_readout": {
    "state": "off",
    "provider_backed_posture": "held_by_external_io",
    "renderer_payload_ignored": true,
    "read_allowed": false,
    "on_is_authorization": false
  },
  "real_project_config_exists_before": false,
  "real_project_config_exists_after": false
}
```

## Boundary Confirmed

- No provider calls.
- No zKill, ESI, or SDE download calls.
- No provider-backed movement.
- No runtime enforcement.
- No command interception or blocking.
- No queue dispatch.
- No Watch execution behavior change.
- No Evidence/EVEidence writes.
- No Discovery ref mutation.
- No Hydration writes.
- No metadata/entity/activity-event label writes.
- No schema changes.
- No real project-root External I/O config write.
- No storage movement/copy/migration/delete.
- No UI or renderer redesign.

## Gate Meaning

- External I/O `off` means provider-backed movement is held by operator trust posture; held is not failure.
- External I/O `on` means provider-backed work re-enters normal storage, live/provider, cadence, Watch, and confirmation gates.
- External I/O `on` is not authorization.
- Re-enable does not create catch-up flood, immediate dispatch, or missed-slot request debt.
- `watch.executor.arm`, `live.gate`, storage authority, and runtime authorization remain distinct from External I/O state.

## Verification

Passed:

```powershell
node --check src\main\services\externalIoStateService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-external-io-state.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:external-io-state
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:hydration
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
```

`verify:protected-terms` completed with warning-only discovery output and exit code 0.

Passed after handoff/current updates:

```powershell
git diff --check
git status --short --branch
```

`git diff --check` passed with line-ending warnings only. `git status --short --branch` showed `main...origin/main [ahead 29]` plus the HS152 working-tree changes.

## Risks / Notes

- The new persistence proof writes fixture state only; it is not the real operator External I/O setting.
- The readout defaults to safe `off` when no trusted persisted state is supplied.
- Gate-stack and composed-policy behavior remain readout-only; External I/O state does not enforce runtime command blocking.

## Recommended Next Action

Overseer review HS152, then decide whether the next seam should be real operator config for External I/O, a Hydration writer fixture proof, or a first narrow runtime enforcement boundary.
