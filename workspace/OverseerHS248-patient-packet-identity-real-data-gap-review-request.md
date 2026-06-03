# Overseer HS248: Patient Packet Identity Real-Data Gap Review Request

Date: 2026-06-03
Role: Atlas Overseer
Milestone: Atlas Storage And Runtime Hardening
Requested executor: Data Engineering / Engineering Review
Expected artifact: `workspace/DataEngineeringHS248-patient-packet-identity-real-data-gap-review.md`

## Purpose

Review the accepted HS246 patient packet identity preview for real-data gap risk.

This is advisory only. Do not implement code. Do not create a Dev runway. Do not run live/provider calls.

HS246 proved the fixture shape for:

```txt
runtime.patient_packet_identity.preview
```

The next question is whether the same preview shape is enough when Atlas is not in the ideal fixture case.

## Core Question

When current local data is sparse, malformed, mixed-lane, missing labels, missing Watch scope, or otherwise imperfect, does `runtime.patient_packet_identity.preview` disclose enough truth to guide the next hardening seam?

Answer in practical terms:

```txt
Can Atlas keep patient packet identity derived/read-only for now, or did HS246 expose a real need for durable checkpoint/policy state?
```

## Read

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
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `workspace/DataEngineeringHS244-patient-packet-identity-boundaries.md`
- `workspace/OverseerHS245-hs244-patient-packet-identity-review.md`
- `workspace/DevHS246-patient-packet-identity-conformance-preview.md`
- `workspace/OverseerHS247-hs246-patient-packet-identity-review.md`
- `src/main/services/patientPacketIdentityService.js`
- `src/main/services/queueClockPostureService.js`
- `src/main/services/hydrationCandidatePreviewService.js`
- `scripts/verify-patient-packet-identity-preview.js`
- `src/main/db/schema.sql`

## Review Tasks

1. Trace how HS246 derives each identity row:
   - zKill Discovery movement intent
   - ESI Evidence Expansion candidate
   - view/local-record Hydration candidate
   - Watch/background Hydration candidate
2. Identify what happens when the local source data is absent or imperfect:
   - no Watch rows
   - only system/radius Watches
   - malformed included/excluded system scope
   - no pending Discovery refs
   - failed Discovery refs
   - missing killmail hash
   - already-cached Evidence/EVEidence
   - no Hydration candidates
   - Hydration candidate with missing source anchors
   - local SDE gaps versus provider-needed labels
3. Decide whether unknown/uncomputable facts are disclosed clearly enough.
4. Decide whether duplicate-prevention basis is strong enough as derived posture.
5. Decide whether restart/storage unlock/External I/O re-enable no-catch-up posture remains coherent.
6. Decide whether view/local-record Hydration stays protected from Watch/background Hydration starvation.
7. Identify whether any issue truly requires durable state now, or whether it can remain derived/read-only.
8. Recommend the smallest next seam, if any.

## Constraints

- Do not propose a broad provider work queue unless a concrete defect proves it necessary.
- Do not propose a generic provider packet table as the default.
- Do not make `discovered_killmail_refs` the sequencer.
- Do not blur Discovery refs with Evidence/EVEidence.
- Do not blur ESI Evidence Expansion with Hydration.
- Do not treat Hydration candidate identity as provider attempt state.
- Do not treat External I/O on as authorization.
- Do not treat waiting, held, or no candidate as failure.
- Do not imply catch-up flooding after restart, storage unlock, or External I/O re-enable.
- Do not start implementation.
- Do not change files unless explicitly asked by Overseer/Human later.

## Useful Local Verification

You may run local-only checks if useful:

```txt
npm.cmd run verify:patient-packet-identity
npm.cmd run verify:queue-clock-posture
npm.cmd run verify:hydration-candidate-preview
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
git status --short --branch
```

No live/API/provider checks.

## Expected Output

Return a concise advisory artifact with:

1. Executive recommendation.
2. What HS246 proves well.
3. Real-data gap risks or missing cases.
4. Whether each gap can stay derived/read-only.
5. Whether any gap needs durable checkpoint/policy state.
6. Any boundary concern.
7. Smallest next seam, if any.
8. Parked items.
9. Verification evidence.
10. Human/Overseer decisions needed.

## Parked

- implementation
- provider calls
- real-data mutation
- schema changes
- packet persistence
- active dispatcher
- broad provider work queue
- generic provider packet table
- runtime enforcement activation
- command blocking
- pruning/deletion execution
- support artifact creation
- UI work
