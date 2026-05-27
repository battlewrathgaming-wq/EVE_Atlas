# Overseer HS113: Cadence Simulation Proof Runway

Date: 2026-05-27
Role: Atlas Overseer
Status: Dev runway opened

## Purpose

Open a bounded Dev packet to prove Atlas can model respectful Acquisition/Hydration cadence before implementing provider release, queue/sequencer machinery, storage unlock behavior, or `external_io` enforcement.

This is a read-only simulation proof. It is not runtime dispatch.

## Source Of Intent

- HS111 proved Atlas can explain provider-backed gate posture without enforcement.
- Human raised a fleet-level cadence concern: 20 clients waking on the same fixed interval would defeat the design intent.
- Human accepted that future release should avoid hard-coded shared cadence across clients.
- Accepted policy: use stable per-install/lane phase plus small bounded jitter, respect provider `Retry-After`, and never catch-up flood after restart, storage unlock, or `external_io` re-enable.

Primary inputs:

- `workspace/OverseerHS112-hs111-gate-stack-readout-review.md`
- `workspace/SystemsAuditHS110-external-io-storage-edge-policy-table.md`
- `workspace/SystemsAuditHS109-external-io-policy-fit.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `workspace/critical/critical-terms.md`

## Current Executor

Dev

Expected Dev handoff:

```txt
workspace/DevHS113-cadence-simulation-proof.md
```

## Ordered Runway

1. Read the source inputs and inspect existing cadence/gate/readout code:
   - `src/main/watchlist/watchScheduler.js`
   - `src/main/watchlist/watchOfflineReadout.js`
   - `src/main/services/gateStackReadoutService.js`
   - `src/main/services/liveApiGateService.js`
   - `src/main/services/storageAuthorityPreflightService.js`
   - existing verifier patterns under `scripts/`

2. Add a fixture-only, read-only cadence simulation helper or verifier surface.
   - It may be a script-only proof if that is sufficient.
   - It may be a read-only support module if it fits local patterns.
   - It must not dispatch provider work or mutate runtime state.

3. Simulate at least these lanes separately:
   - Acquisition / zKill Discovery lane
   - Acquisition / ESI Evidence expansion lane
   - Hydration Recovery / Watch hydration lane
   - Hydration Recovery / view/local-record hydration lane

4. Demonstrate cadence inputs and outputs:
   - stable per-install phase
   - stable per-lane phase
   - small bounded jitter
   - provider `Retry-After` override
   - due versus held versus next eligible
   - `external_io` off/on
   - storage locked/unlocked
   - missed slots
   - pending refs
   - restart/re-enable/unlock behavior with no catch-up flood

5. Prove by fixture output that:
   - multiple simulated install IDs do not all release at the same instant
   - missed time does not create accumulated request debt
   - `external_io` re-enable does not release all held work at once
   - storage unlock does not release all held work at once
   - provider `Retry-After` delays the affected lane/action beyond local cadence
   - Hydration and Acquisition lanes stay separate

6. Add focused verification.
   - Prefer a new `npm.cmd run verify:cadence-simulation` command if a script is added.
   - Include sample JSON output in the Dev handoff.

7. Update `workspace/current.md` Evidence / Dev Handoff with files changed, sample simulation output, verification results, and boundary confirmation.

## Guardrails And Non-Goals

- No live/API/provider calls.
- No runtime dispatch.
- No runtime mutation.
- No storage config writing.
- No DB movement, creation, copy, migration, relocation, pruning, or deletion.
- No storage lockout enforcement.
- No `external_io` enforcement.
- No persisted cadence setting.
- No queue/sequencer implementation.
- No schema migration.
- No broad provider work queue.
- No high-volume request-attempt ledger.
- No stale/expired Discovery ref mutation.
- No Watch scheduler behavior change.
- No provider dispatch behavior change.
- No hydration behavior change.
- No Evidence/EVEidence write behavior change.
- No renderer work.
- Do not imply simulation output is active runtime policy.
- Do not implement release/catch-up behavior.

## Stop Conditions

Stop and return to Overseer/Human before implementation if:

- implementation would change Watch scheduler/runtime behavior
- implementation would introduce persisted cadence state
- implementation would implement `external_io`
- implementation would enforce storage lockout
- implementation would create queue/sequencer machinery
- implementation would call live providers
- implementation would require schema changes
- implementation would mutate real runtime data
- implementation would choose final UX wording or renderer presentation

## Required Verification

Run focused verification for the simulation plus:

```powershell
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:task-concurrency
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If a new verifier is added, name the command in `package.json`.

## Expected Evidence

Dev handoff must include:

- files changed
- command/script/helper added or extended
- sample simulation output
- proof simulated installs do not synchronize
- proof no catch-up flood after restart, storage unlock, or `external_io` re-enable
- proof provider `Retry-After` overrides local cadence
- proof Acquisition and Hydration lanes stay separate
- proof no provider calls, schema changes, runtime mutation, storage writes, scheduler behavior changes, or dispatch changes occurred
- verification commands and results

