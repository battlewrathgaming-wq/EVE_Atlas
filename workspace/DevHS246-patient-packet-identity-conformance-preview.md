# DevHS246 Patient Packet Identity Conformance Preview

Executor: Dev

Date: 2026-06-03

Status: Complete; pending Overseer review.

## Scope

Implemented the HS246 read-only patient packet identity conformance preview:

```txt
runtime.patient_packet_identity.preview
```

The preview answers:

```txt
If Atlas needed a future durable unit, what identity would each current candidate have, and can it be derived now?
```

It derives lane-specific identity posture from existing local state and existing read-only previews. It does not persist packets or make the identity rows execution authority.

## Files Changed

- `package.json`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-patient-packet-identity-preview.js`
- `scripts/verify-service-registry.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/patientPacketIdentityService.js`
- `src/main/services/serviceRegistry.js`
- `workspace/current.md`
- `workspace/DevHS246-patient-packet-identity-conformance-preview.md`

## Service Shape

Added `src/main/services/patientPacketIdentityService.js` with `buildPatientPacketIdentityPreview(db, input, context)`.

Registered `runtime.patient_packet_identity.preview` in `serviceRegistry` as:

- classification: `read-only`
- effect: `read_only`
- renderer eligible: yes
- provider calls: none
- dispatch: none
- writes: none
- execution authority: false

The command composes existing local/read-only posture from:

- `runtime.queue_clock_posture.preview`
- `metadata.hydration_candidates.preview`
- Watch schedule/offline readout helpers
- local `discovered_killmail_refs`
- local Watch tables

## Identity Rows

The preview emits four required lane rows:

- zKill Discovery movement intent
- ESI Evidence Expansion candidate identity
- view/local-record Hydration candidate identity
- Watch/background Hydration candidate identity

Each row includes:

- clock
- lane
- candidate kind
- derived identity key
- proposed future key
- source basis
- source anchors
- duplicate-prevention basis
- gate posture summary
- no-catch-up posture
- persistence recommendation
- unknown/uncomputable facts
- boundary statement

All rows are marked:

- `persistence_recommendation: derived_for_now`
- `not_persisted: true`
- `not_executable: true`
- `not_execution_authority: true`

## Sample Preview Output

Focused verifier sample:

```json
{
  "status": "patient packet identity preview verified",
  "action": "runtime.patient_packet_identity.preview",
  "summary": {
    "identity_rows": 4,
    "derivable_now": 4,
    "unknown_rows": 0,
    "clocks": ["acquisition", "hydration_recovery"],
    "lanes": [
      "zkill_discovery",
      "esi_evidence_expansion",
      "view_local_record",
      "watch_background"
    ],
    "acquisition_and_hydration_separate": true,
    "all_derived_for_now": true,
    "all_not_execution_authority": true,
    "packet_persistence_recommended": false
  }
}
```

Sample identity posture:

```json
{
  "zkill_discovery": {
    "candidate_kind": "zkill_discovery_movement_intent",
    "identity_derivable_now": true,
    "persistence_recommendation": "derived_for_now",
    "gate_posture": "local_only_available",
    "not_execution_authority": true
  },
  "esi_evidence_expansion": {
    "candidate_kind": "discovery_ref_esi_expansion_candidate",
    "identity_derivable_now": true,
    "persistence_recommendation": "derived_for_now",
    "gate_posture": "held_by_external_io",
    "not_execution_authority": true
  },
  "view_local_record": {
    "candidate_kind": "entity_label",
    "identity_derivable_now": true,
    "persistence_recommendation": "derived_for_now",
    "gate_posture": "held_by_external_io",
    "not_execution_authority": true
  },
  "watch_background": {
    "candidate_kind": "entity_label",
    "identity_derivable_now": true,
    "persistence_recommendation": "derived_for_now",
    "gate_posture": "watch_session_arm_required",
    "not_execution_authority": true
  }
}
```

## Boundary Confirmation

Confirmed by code shape and verifier mutation checks:

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
- no Assessment Memory mutation
- no Marked mutation
- no storage config write
- no storage movement
- no support artifact creation
- no schema changes
- no runtime enforcement activation
- no command blocking
- no pruning/deletion behavior
- no renderer UI work

The focused verifier confirms unchanged counts for killmails, activity events, Discovery refs, fetch runs, API request logs, data-quality warnings, metadata runs, Assessment artifacts, Watch rows, and system Watch rows.

## Verification

Commands run:

```txt
node --check src\main\services\patientPacketIdentityService.js
node --check scripts\verify-patient-packet-identity-preview.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\queueClockPostureService.js
npm.cmd run verify:patient-packet-identity
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
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- All `node --check` commands passed.
- `npm.cmd run verify:patient-packet-identity` passed.
- All required affected verification commands passed.
- `npm.cmd run verify:enforcement-dry-run` passed as additional new-command coverage verification.
- `npm.cmd run verify:protected-terms` passed with warning-only advisory output: 529 warnings across 10 changed working-set files; no renames or protected-word JSON updates performed.
- `git diff --check` passed with CRLF normalization warnings only.
- `git status --short --branch` showed branch `main...origin/main` with HS246 working-tree changes.

## Outcome

Atlas can now derive future patient packet identity shapes for the four accepted lanes without introducing a packet table, persisted queue, dispatcher, provider movement, writes, enforcement, or UI. The preview preserves the HS244/HS245 lane-specific identity model:

- Watch/scope/cadence identity for zKill Discovery.
- Discovery ref identity for ESI Evidence Expansion.
- Hydration candidate key plus lane and basis policy for Hydration.

## Risks / Follow-Up

- This is conformance proof only. It deliberately does not choose future packet persistence, dispatcher architecture, or durable sequencer tables.
- If a later runway needs persistence, it should preserve the lane-specific identities proven here instead of collapsing Acquisition and Hydration into a generic provider packet.
- A later packet can decide whether any uncomputable identity facts require durable state, but HS246 did not find gaps in the four required fixture rows.
