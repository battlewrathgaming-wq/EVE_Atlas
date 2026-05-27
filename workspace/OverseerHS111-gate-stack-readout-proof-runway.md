# Overseer HS111: Gate-Stack Readout Proof Runway

Date: 2026-05-27
Role: Atlas Overseer
Status: Dev runway opened

## Purpose

Open a bounded Dev packet to prove Atlas can explain why provider-backed work is or is not allowed before implementing `external_io`, storage lockout, provider enforcement, or any catch-up behavior.

This is a read-only runtime/status proof. It is not enforcement.

## Source Of Intent

- Human accepted `external_io` as the future provider trust-boundary family.
- Human accepted that clocks/readouts may keep moving while external I/O is off, but provider work must be held and release must not catch-up flood.
- HS109 confirmed `external_io` is not implemented and fits best as a higher-level hold/release boundary above existing gates.
- HS110 identified the smallest safe next packet: a read-only gate-stack/readout proof before enforcement.

Primary inputs:

- `workspace/SystemsAuditHS109-external-io-policy-fit.md`
- `workspace/SystemsAuditHS110-external-io-storage-edge-policy-table.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `workspace/critical/critical-terms.md`

## Current Executor

Dev

Expected Dev handoff:

```txt
workspace/DevHS111-gate-stack-readout-proof.md
```

## Ordered Runway

1. Read the source inputs and inspect existing gate/readout code:
   - `src/main/services/liveApiGateService.js`
   - `src/main/services/appReadinessService.js`
   - `src/main/services/storageAuthorityPreflightService.js`
   - `src/main/services/serviceRegistry.js`
   - `src/main/watchlist/watchExecutor.js`
   - `src/main/watchlist/watchScheduler.js`
   - `src/main/watchlist/watchOfflineReadout.js`

2. Add or extend one read-only support/readout surface that reports a gate stack for provider-backed work.
   - It may be a new read-only service/report command if that matches existing patterns.
   - It must not create a real `external_io` enforcement switch.
   - It must state clearly that `external_io` is currently policy-only / not implemented.

3. The readout must show the relevant gate stack separately, not collapse gates:
   - due/scheduled posture where available
   - Watch armed/disarmed/session state where relevant
   - future `external_io` policy state as not implemented / policy-only
   - existing `External API` / live API env and User-Agent readiness
   - `live.gate` / cadence / cooldown / lockout result for known provider actions
   - storage authority preflight summary as storage safety input
   - active task / duplicate movement posture where available
   - confirmation requirement where command authority already declares it

4. Include readout states for held/blocked/waiting posture without changing behavior:
   - `held_by_external_io` may appear only as future/readout policy posture, not an enforced state.
   - waiting is not failure.
   - due means "consider work," not "run now."
   - release of any future external I/O must not imply catch-up flood.

5. Add focused offline fixture/verifier coverage proving:
   - no provider calls occur
   - local-only surfaces remain distinct from provider-backed actions
   - `external_io` is reported as policy-only/not implemented
   - Watch arming is reported separately from provider movement allowance
   - storage safety is reported separately from provider permission
   - live-gate/cadence status remains separate from storage and Watch arming

6. Update `workspace/current.md` Evidence / Dev Handoff with files changed, sample output, verification results, and boundary confirmation.

## Guardrails And Non-Goals

- No live/API/provider calls.
- No new provider movement.
- No `external_io` enforcement implementation.
- No persisted `external_io` setting.
- No storage lockout enforcement.
- No storage config writing.
- No DB movement, creation, copy, migration, relocation, pruning, or deletion.
- No schema migration.
- No broad provider work queue.
- No high-volume request-attempt ledger.
- No persisted sequencer packet table.
- No stale/expired Discovery ref mutation.
- No change to Watch execution, scheduler behavior, Discovery refs, Evidence/EVEidence writes, hydration, or Assessment Memory.
- No renderer redesign.
- No terminology rename of `External API`, `live.gate`, `watch.executor.arm`, `Watch`, `Watch_offline`, Discovery, Evidence/EVEidence, or hydration.
- Do not imply that `held_by_external_io` is already enforced.
- Do not make release/catch-up behavior.

## Stop Conditions

Stop and return to Overseer/Human if implementation would require:

- choosing final `external_io` UI wording or persistence model
- enforcing provider blocks
- cancelling active provider work
- changing provider dispatch behavior
- changing storage behavior or lockout behavior
- changing Watch arming semantics
- schema/persistence changes
- live/API calls
- renderer redesign
- turning this into sequencer or queue architecture

## Required Verification

Run focused verification for the new/changed readout plus:

```powershell
npm.cmd run verify:app-readiness
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:task-concurrency
npm.cmd run verify:db-integrity
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If a new verifier is added, name the command in `package.json` and include its sample output in the Dev handoff.

## Expected Evidence

Dev handoff must include:

- files changed
- command/service/report added or extended
- sample gate-stack output
- proof `external_io` is reported as policy-only/not implemented
- proof Watch arming, live gate/cadence, storage safety, confirmation, and active task state are not collapsed
- proof no provider calls, schema changes, storage writes, lockout enforcement, or behavior changes occurred
- verification commands and results

