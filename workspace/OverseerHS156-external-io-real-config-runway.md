# OverseerHS156 - External I/O Real Config Runway

Status: active runway
Role: Overseer
Date: 2026-06-01

## Intent

Open the next bounded hardening seam: real operator External I/O config.

Atlas has fixture/offline proof that External I/O state can be persisted safely. The next step is to make the provider trust switch real as local operator configuration while preserving the important boundary: External I/O state is posture, not runtime authorization.

This packet should add canonical operator config read/write behavior only. It must not call providers, dispatch held work, enforce runtime blocking, create Evidence/EVEidence, hydrate metadata, mutate queues, or change Watch execution.

## Source Of Intent

- Human selected seam `1`: Real operator External I/O config.
- Human direction: contact should be a conscious act, and External I/O off should hold provider-backed movement without creating catch-up flood.
- `workspace/OverseerHS152-external-io-persisted-state-runway.md`
- `workspace/OverseerHS153-hs152-external-io-persisted-state-review.md`
- `workspace/OverseerHS155-hs154-hydration-writer-fixture-review.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `workspace/critical/critical-terms.md`

Accepted prior proofs:

- `support.gate_stack_readout`
- `storage.composed_gate_policy.preview`
- `metadata.hydration_execution_policy.preview`
- `external_io.state_readout`
- `external_io.state_persistence_proof`
- `metadata.hydration_write_fixture_proof`

## Recommended Dev Packet

Expected executor: Dev

Expected handoff:

```text
workspace/DevHS156-external-io-real-config.md
```

Add a real operator External I/O config path and trusted-context write/readback path.

Suggested config target:

```text
<Atlas app/root>/config/external-io-state.json
```

Suggested command/readout names:

```text
external_io.state_readout
external_io.state_config_write
external_io.state_config_readback
```

Dev may choose a tighter naming shape if it fits existing service patterns, but the handoff must state the final command names and renderer eligibility.

The packet should answer:

```text
What External I/O state has the operator configured for this Atlas install, and can trusted operator-context code persist/read that state from the canonical app-local config file?
```

It must not answer:

```text
May Atlas call providers now?
```

## Ordered Runway

1. Inspect the existing `external_io.state_readout`, fixture persistence proof, service registry metadata, command authority checks, passive side-effect checks, gate-stack readout, composed gate policy preview, storage config proof patterns, and config path helpers.
2. Define the canonical real External I/O config target under the Atlas app/root config folder.
3. Add a trusted-context-only operator config write/readback path for External I/O state.
4. Keep renderer payloads from choosing arbitrary paths, forging trusted context, forging state, probing the filesystem, or writing config directly.
5. Preserve accepted state meaning:
   - `off` holds provider-backed movement as `held_by_external_io`
   - `on` releases provider-backed work only to normal storage, live/provider, cadence, Watch, and confirmation gates
   - `on` is not authorization
   - re-enable creates no catch-up debt, request flood, or immediate dispatch
6. Integrate readout so the canonical config can be reported as operator posture without requiring fixture-only parameters.
7. Keep `watch.executor.arm`, `live.gate`, storage authority, runtime authorization, and External I/O separate.
8. Add focused verification for canonical config write/readback, state normalization, forged renderer payload resistance, no provider calls, no runtime enforcement, no command blocking, no queue dispatch, and no Evidence/Hydration writes.
9. Update service registry, command authority, enforcement dry-run, composed gate policy, gate-stack, and passive side-effect coverage as needed.
10. Update Evidence / Dev Handoff and create the expected DevHS file.

## Guardrails

- Real config writes are allowed only for the canonical External I/O config opened by this packet.
- No provider calls.
- No zKill calls.
- No ESI calls.
- No SDE download calls.
- No Evidence/EVEidence writes.
- No Hydration writes.
- No entity label writes.
- No activity event label patching.
- No metadata run writes.
- No Discovery ref mutation.
- No queue dispatch.
- No Watch execution behavior changes.
- No runtime enforcement.
- No command interception or command blocking.
- No runtime authorization activation.
- No storage config writes other than the External I/O config explicitly scoped here.
- No storage movement, copy, migration, restore, prune, delete, or cleanup.
- No schema changes unless Dev stops for Overseer if runtime schema becomes necessary.
- No filesystem probing from renderer-provided arbitrary paths.
- No renderer UI work.
- Do not rename `External API`, `live.gate`, `watch.executor.arm`, storage authority, Evidence/EVEidence, Discovery, Watch, Marked, or Hydration terms.
- Do not collapse Watch arming into External I/O.
- Do not treat External I/O on as authorization.
- Do not treat External I/O off as failure.
- Do not create catch-up debt while External I/O is off.
- Do not dispatch held work immediately when External I/O is re-enabled.
- Do not treat the External I/O config as a provider queue, scheduler, or backlog.

## Stop Conditions

Stop and return to Overseer/Human if:

- implementation requires live/provider/API calls
- implementation requires runtime enforcement, command interception, or command blocking
- implementation requires queue dispatch or Watch executor behavior changes
- implementation requires Evidence/EVEidence writes, Discovery ref mutation, or Hydration writes
- implementation requires schema changes or persisted provider-work backlog state
- implementation requires storage migration/move/copy/delete/prune/cleanup behavior
- renderer input can choose paths, forge state, forge trusted context, or probe the filesystem
- External I/O on would become runtime authorization
- External I/O re-enable implies catch-up flooding, immediate dispatch, or request debt
- local-only work becomes unavailable solely because External I/O is off
- the packet needs UI wording or renderer design decisions
- `external_io` starts acting like a provider queue or scheduler

## Verification Expectations

Run focused checks plus existing gate checks:

```powershell
node --check src\main\services\externalIoStateService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check src\main\services\gateStackReadoutService.js
node --check src\main\services\composedGatePolicyService.js
node --check scripts\verify-external-io-state.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
npm.cmd run verify:external-io-state
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If Dev adds a new focused verifier such as `verify:external-io-config`, run it and list it in the handoff.

If filenames differ, Dev should run `node --check` on the actual changed JavaScript files and explain the substitution.

## Acceptance Criteria

- Canonical External I/O config path is explicit and app/root local.
- Trusted operator-context code can persist and read back External I/O state from the canonical config path.
- Renderer-origin payloads cannot write config, choose paths, forge trusted context, or probe the filesystem.
- Accepted states are normalized and invalid states are rejected safely.
- `off` maps to `held_by_external_io`, not failure.
- `on` maps to release to normal gates, not authorization.
- Re-enable policy states no catch-up flood, no request debt, and no immediate dispatch.
- External I/O remains separate from Watch arming, live/provider gate, storage authority, and runtime command authorization.
- Existing fixture proof remains valid or is cleanly preserved as fixture-only.
- Verification proves no provider calls, no runtime enforcement, no command blocking, no queue dispatch, no Evidence/EVEidence writes, no Discovery ref mutation, no Hydration writes, no schema changes, and no UI work.
