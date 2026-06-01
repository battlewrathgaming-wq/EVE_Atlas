# OverseerHS152 - External I/O Persisted State Runway

Status: accepted runway
Role: Overseer
Date: 2026-06-01

## Intent

Open the next bounded hardening seam: External I/O persisted state.

External contact should be a conscious operator act. Atlas already has read-only External I/O held-state posture, but the provider trust switch is not yet proven as durable local state.

This packet should prove fixture/offline persist-readback behavior only. It must not enforce External I/O, call providers, dispatch queued work, write Evidence/EVEidence, hydrate metadata, or change runtime command authorization.

## Source Of Intent

- Human decision: External contact should be conscious.
- `workspace/SystemsAuditHS109-external-io-policy-fit.md`
- `workspace/OverseerHS143-hs142-external-io-held-state-review.md`
- `workspace/OverseerHS149-hs148-composed-gate-policy-review.md`
- `workspace/OverseerHS151-hs150-hydration-execution-policy-review.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/current-state/current-storage-runtime-hardening.md`

Accepted prior proofs:

- `support.gate_stack_readout`
- `storage.composed_gate_policy.preview`
- `metadata.hydration_execution_policy.preview`
- `storage.authority_config.write_proof`
- `storage.authority_config.acknowledgement_persistence_proof`

## Recommended Dev Packet

Expected executor: Dev

Expected handoff:

```text
workspace/DevHS152-external-io-persisted-state.md
```

Add a fixture/trusted-context proof for durable External I/O state.

Suggested command/readout names:

```text
external_io.state_readout
external_io.state_persistence_proof
```

The readout should answer:

```text
What is Atlas' persisted External I/O posture, and would provider-backed work be held or released to normal gates?
```

The proof should answer:

```text
Can Atlas persist and read back the External I/O setting safely in a fixture/trusted context?
```

It must not answer:

```text
May Atlas call providers now?
```

## Ordered Runway

1. Inspect current External API/live gate, gate-stack readout, composed gate policy preview, storage config proof patterns, service registry command metadata, passive side-effect verifier, and current config/temp path helpers.
2. Add a read-only External I/O persisted-state readout if needed.
3. Add a trusted-context-only fixture persistence proof for External I/O state.
4. Store fixture proof state under an explicit allowed fixture root only; do not create the real project-root config unless a later packet explicitly opens real operator config.
5. Accept only narrow states such as `off` / `on` or `disabled` / `enabled`; normalize output to the accepted Atlas state labels.
6. Include state meaning:
   - off means provider-backed movement is held, not failed
   - on means provider-backed movement re-enters normal storage/live/cadence/Watch/confirmation gates
   - on does not mean catch-up flood or immediate dispatch
7. Prove renderer payloads cannot forge persisted state, path, acknowledgement, or arbitrary file probing.
8. Keep `watch.executor.arm`, `live.gate`, storage authority, and External I/O distinct.
9. Add focused verification proving no provider calls, no runtime enforcement, no command blocking, no Evidence/EVEidence writes, no Hydration writes, no queue dispatch, no schema changes, no real config write, and no UI work.
10. Add service registry, command authority, enforcement dry-run/composed policy, gate-stack, and passive side-effect coverage as needed.
11. Update Evidence / Dev Handoff and create the expected DevHS file.

## Guardrails

- No provider calls.
- No zKill calls.
- No ESI calls.
- No SDE download calls.
- No Evidence/EVEidence writes.
- No Hydration writes.
- No Discovery ref mutation.
- No queue dispatch.
- No Watch execution behavior changes.
- No runtime enforcement.
- No command interception or command blocking.
- No schema changes.
- No real operator config write unless explicitly approved in a future packet.
- No filesystem probing from renderer-provided arbitrary paths.
- No renderer UI work.
- Do not rename `External API`, `live.gate`, `watch.executor.arm`, or storage authority.
- Do not collapse Watch arming into External I/O.
- Do not treat External I/O on as authorization.
- Do not treat External I/O off as failure.
- Do not create catch-up debt while External I/O is off.
- Do not dispatch held work immediately when External I/O is re-enabled.

## Stop Conditions

Stop and return to Overseer/Human if:

- the proof requires real project-root config writes
- the proof requires UI or renderer copy decisions
- the proof requires live/provider/API calls
- the proof requires runtime enforcement or command blocking
- the proof requires schema changes
- the proof requires Watch executor behavior changes
- the proof requires treating `external_io` as a provider queue
- renderer input can choose paths, forge state, or probe the filesystem
- External I/O on would become runtime authorization
- External I/O re-enable implies catch-up flooding or immediate dispatch

## Verification Expectations

Run focused checks plus existing gate checks:

```powershell
node --check src\main\services\externalIoStateService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check src\main\services\gateStackReadoutService.js
node --check src\main\services\composedGatePolicyService.js
node --check scripts\verify-external-io-state.js
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

If filenames differ, Dev should run the actual changed JS files and explain the substitution.

## Acceptance Criteria

- External I/O state can be read as local posture.
- Fixture/trusted-context persistence proof can write and read back allowed states.
- Real operator/project-root config remains untouched.
- Renderer input cannot forge state or path authority.
- Off maps to `held_by_external_io`, not failure.
- On maps to release to normal gates, not authorization.
- Re-enable policy states no catch-up flood, no request debt, and no immediate dispatch.
- External I/O remains separate from Watch arming, live/provider gate, storage authority, and runtime command authorization.
- All side-effect proof is fixture-only or read-only as scoped.
