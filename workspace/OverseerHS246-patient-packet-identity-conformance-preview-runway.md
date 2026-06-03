# Overseer HS246: Patient Packet Identity Conformance Preview Runway

Date: 2026-06-03
Role: Atlas Overseer
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS246-patient-packet-identity-conformance-preview.md`

## Purpose

Add a read-only patient packet identity conformance preview.

This packet should map current derived posture into the lane-specific future identity shapes accepted in HS244/HS245. It must not create packet tables, persisted queues, dispatcher behavior, provider calls, writes, runtime enforcement, support artifacts, or UI.

The proof question is:

```txt
If Atlas needed a future durable unit, what identity would each current candidate have, and can it be derived now?
```

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
- `workspace/DevHS242-queue-clock-runtime-posture-preview.md`
- `workspace/OverseerHS243-hs242-queue-clock-posture-review.md`
- `workspace/DataEngineeringHS244-patient-packet-identity-boundaries.md`
- `workspace/OverseerHS245-hs244-patient-packet-identity-review.md`
- `src/main/services/queueClockPostureService.js`
- `src/main/services/hydrationCandidatePreviewService.js`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/db/schema.sql`

## Task

Add a read-only preview, preferably:

```txt
runtime.patient_packet_identity.preview
```

The preview should derive identity rows from existing local posture and clearly mark them as not persisted, not executable, and not authorization.

## Required Outcome

The preview should emit derived identity examples/rows for:

- zKill Discovery movement intent
- ESI Evidence Expansion candidate identity
- view/local-record Hydration candidate identity
- Watch/background Hydration candidate identity

Each identity row should include:

- clock
- lane
- candidate kind
- derived identity key or proposed future key
- source basis
- source anchors
- duplicate-prevention basis
- gate posture summary
- no-catch-up posture
- persistence recommendation: `derived_for_now` unless a gap proves otherwise
- unknown/uncomputable facts, if any
- boundary statement that the row is not execution authority

Identity expectations:

- zKill Discovery identity should be Watch/scope/lookback/cadence/cap/provider-action shaped where Watch data is available.
- ESI Evidence Expansion identity should be Discovery-ref shaped: `killmail_id` + `killmail_hash` + discovery scope/provenance.
- Hydration identity should be readability-candidate shaped: dedupe key + lane + source anchors + freshness/basis policy.

The preview should keep Acquisition and Hydration as separate identity shapes.

## Preserve

- no packet table
- no persisted queue
- no active dispatcher
- no provider calls
- no zKill Discovery execution
- no ESI Evidence Expansion execution
- no Hydration execution
- no Hydration writes
- no Evidence/EVEidence writes
- no Discovery ref mutation
- no Watch mutation or arming
- no Assessment Memory or Marked mutation
- no storage config write or movement
- no support artifact creation
- no schema changes
- no runtime enforcement activation
- no command blocking
- no pruning/deletion behavior
- no renderer UI work

## Stop Conditions

Stop and return to Overseer if this requires:

- schema-backed patient packet persistence
- a generic provider packet table
- making `discovered_killmail_refs` the sequencer
- changing Discovery ref status semantics
- changing Watch schedule behavior
- making Hydration candidates executable
- persisting cooldown, lease, claim, or retry state
- making provider calls
- dispatching work
- runtime enforcement or command blocking
- UI work

## Verification

Expected local-only proof:

```powershell
node --check src\main\services\serviceRegistry.js
node --check src\main\services\queueClockPostureService.js
npm.cmd run verify:queue-clock-posture
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:hydration-candidate-preview
npm.cmd run verify:hydration-backlog-preview
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

- The preview emits lane-specific identity shapes for zKill Discovery, ESI Evidence Expansion, view/local-record Hydration, and Watch/background Hydration.
- Acquisition and Hydration identities remain separate.
- Every identity is marked derived/read-only/not persisted/not executable.
- Discovery refs remain possible leads/provenance, not Evidence/EVEidence.
- ESI Evidence Expansion identity uses local Discovery ref basis without mutating refs.
- Hydration identity uses readability candidate key + lane + source anchors + policy basis.
- Duplicate-prevention basis is disclosed for each identity type.
- Restart/storage unlock/External I/O re-enable no-catch-up posture is disclosed.
- Unknown/uncomputable facts are shown rather than guessed.
- No provider calls, writes, schema changes, dispatcher, runtime enforcement, command blocking, support artifacts, pruning/deletion, or UI work are added.

## Parked

- packet persistence
- active dispatcher
- provider-backed Hydration execution
- ESI Evidence Expansion scheduling
- broad provider work queue
- provider cooldown/Retry-After persistence
- durable leases/claims
- schema-backed queues
- runtime enforcement activation
- support artifact creation
- UI/R-Scanner presentation
