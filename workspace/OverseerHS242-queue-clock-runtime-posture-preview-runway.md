# Overseer HS242: Queue / Clock Runtime Posture Preview Runway

Date: 2026-06-03
Role: Atlas Overseer
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS242-queue-clock-runtime-posture-preview.md`

## Purpose

Add a read-only internal posture preview for Atlas queue and clock state.

This packet should help Atlas see what work exists, what is eligible now, what is held, what is waiting normally, and what would be safe after restart without implementing a dispatcher, provider queue, persisted sequencer, schema migration, runtime enforcement, or provider movement.

## Source Basis

Read before implementation:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/data-layer-boundaries.md`
- `docs/features/persistent-discovery-ref-queue.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/services/serviceRegistry.js`
- existing queue, Watch, Hydration, External I/O, and runtime preview services/verifiers as relevant

## Task

Add a read-only queue / clock runtime posture preview.

Preferred command name:

```txt
runtime.queue_clock_posture.preview
```

The preview should aggregate or derive from existing local state/readouts where possible. It should not invent a new active queue or make provider work executable.

## Required Outcome

The preview must report a compact posture for:

- Acquisition Clock
  - zKill Discovery lane
  - ESI Evidence Expansion lane
- Hydration Recovery Clock
  - Watch/background hydration lane
  - view/local-record hydration lane
- existing Discovery ref queue posture
- Watch/offline/restart posture where available
- External I/O hold posture where provider-backed work would be held
- storage/setup gate posture where it affects provider-backed or write-capable movement
- waiting/held/deferred posture as non-failure
- no-catch-up-flood posture after restart, storage unlock, or External I/O re-enable

The preview should distinguish at least:

- local-only available work
- provider-backed work held by `external_io`
- provider-backed work waiting on cadence/capacity
- Watch/session arming required
- storage/setup blocked or budget hard-stop posture
- pending Discovery refs that are possible leads, not Evidence/EVEidence
- ESI Evidence expansion candidates, if computable from existing local refs without mutation
- Hydration candidates/readability demand, if computable from existing Hydration candidate/backlog previews
- unknown or not-yet-computable state, disclosed plainly rather than guessed

## Preserve

- no dispatcher
- no broad provider work queue
- no persisted sequencer state
- no schema changes
- no provider calls
- no zKill Discovery execution
- no ESI Evidence expansion execution
- no Hydration writes
- no Evidence/EVEidence writes
- no Discovery ref mutation
- no Watch mutation or arming
- no Assessment Memory or Marked mutation
- no storage config write or movement
- no support artifact creation
- no pruning/deletion behavior
- no runtime enforcement activation
- no command blocking
- no renderer UI work

## Stop Conditions

Stop and return to Overseer if this requires:

- implementing an active dispatcher
- adding a schema-backed queue/sequencer
- mutating Watch, Discovery refs, Evidence/EVEidence, Hydration, or storage state
- making provider calls
- making missed slots catch up automatically
- treating `external_io` on as authorization to dispatch
- treating waiting, held, deferred, or provider-capacity posture as failure
- exposing Discovery refs as Evidence/EVEidence
- blurring ESI Evidence Expansion with Hydration/readability repair
- activating runtime enforcement or command blocking
- changing renderer UI

## Verification

Expected local-only proof:

```powershell
node --check src\main\services\serviceRegistry.js
npm.cmd run verify:queue-report
npm.cmd run verify:queue-preflight
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:hydration-candidate-preview
npm.cmd run verify:hydration-attention-runtime
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:external-io-state
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If a new service file, verifier, or package script is added, include `node --check` and the new verifier in the handoff.

## Acceptance Criteria

- A read-only posture command/report exists and is clearly non-authorizing.
- Acquisition Clock and Hydration Recovery Clock lanes are named and kept separate.
- Discovery refs remain possible leads/provenance, not Evidence/EVEidence.
- ESI Evidence Expansion is distinct from Hydration/readability repair.
- External I/O off produces held posture for provider-backed work, not failure.
- External I/O on is release to normal gates, not authorization or catch-up flood.
- Waiting/cadence/provider-capacity states are represented as normal hold/wait states where appropriate.
- Unknown or uncomputable areas are disclosed without guessing.
- Existing Watch_offline, queue, Hydration, storage, and gate previews remain compatible.
- No provider calls, writes, schema changes, runtime enforcement, command blocking, support artifacts, pruning/deletion, or UI work are added.

## Parked

- active queue dispatcher
- persisted Acquisition/Hydration sequencer
- schema-backed provider work items
- provider-backed Hydration execution
- ESI Evidence expansion scheduling
- Watch runtime behavior changes
- External I/O enforcement behavior
- active runtime command blocking
- UI/R-Scanner presentation
- support artifact creation for this posture
- real pruning/deletion execution
