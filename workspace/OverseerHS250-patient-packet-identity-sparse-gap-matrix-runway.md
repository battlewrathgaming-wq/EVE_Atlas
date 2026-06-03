# Overseer HS250: Patient Packet Identity Sparse Gap Matrix Runway

Date: 2026-06-03
Role: Atlas Overseer
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS250-patient-packet-identity-sparse-gap-matrix.md`

## Purpose

Extend proof coverage for `runtime.patient_packet_identity.preview` across sparse and imperfect local states.

HS248 accepted that patient packet identity can remain derived/read-only for now. The missing piece is coverage, not architecture. This packet should add a fixture-only/read-only sparse gap matrix verifier and make the service disclose false confidence if the matrix exposes any gap.

## Source Basis

Read before implementation:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/data-layer-boundaries.md`
- `workspace/DevHS246-patient-packet-identity-conformance-preview.md`
- `workspace/OverseerHS247-hs246-patient-packet-identity-review.md`
- `workspace/DataEngineeringHS248-patient-packet-identity-real-data-gap-review.md`
- `workspace/OverseerHS249-hs248-real-data-gap-review-acceptance.md`
- `src/main/services/patientPacketIdentityService.js`
- `scripts/verify-patient-packet-identity-preview.js`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/services/hydrationCandidatePreviewService.js`
- `src/main/services/queueClockPostureService.js`
- `src/main/db/schema.sql`

## Task

Add fixture-only sparse/malformed/mixed-lane coverage for:

```txt
runtime.patient_packet_identity.preview
```

Preferred path:

- extend `scripts/verify-patient-packet-identity-preview.js`, or
- add a focused companion verifier if that keeps the test readable.

If adding a new verifier, add an `npm.cmd` script with a clear name, preferably:

```txt
verify:patient-packet-identity-sparse
```

Do not add a new product command unless the matrix proves the existing command cannot disclose a needed state.

## Required Matrix Cases

Cover these cases with fixture/local-only data:

1. Empty DB:
   - no Watch
   - no Discovery refs
   - no Hydration candidates
   - rows should report unavailable/uncomputable or no-candidate posture without failure.
2. System/radius Watch with valid scope:
   - zKill Discovery identity should derive from system/radius Watch shape.
3. System/radius Watch with missing stored included/excluded scope:
   - disclose limitation without guessing.
4. System/radius Watch with malformed included or excluded scope:
   - disclose unknown/uncomputable scope detail without deriving false exact scope.
5. Pending Discovery ref without `killmail_hash`:
   - ESI Evidence Expansion identity should not be derivable from that row.
6. Failed Discovery ref with valid hash:
   - identity may be derivable as a retry candidate, but must remain Discovery staging/provenance and not Evidence/EVEidence.
7. Already-cached Evidence/EVEidence matching a Discovery ref:
   - disclose skip/cache posture or at minimum avoid implying provider movement is required for already-cached Evidence.
8. No Hydration candidates:
   - Hydration rows should report no candidate/unknown posture without failure.
9. Hydration candidate missing source anchors:
   - disclose identity weakness or unknown source anchors.
10. Local SDE gap candidate versus provider-needed entity label:
   - keep local SDE/readability readiness distinct from provider-needed ESI Hydration.
11. Mixed view/local-record and Watch/background Hydration lanes:
   - prove view/local-record Hydration remains distinct and not starved behind Watch/background posture.

## Required Behavior

- Sparse/no-candidate state is not failure.
- Waiting or held state is not failure.
- Unknown/uncomputable facts are shown rather than guessed.
- Discovery refs remain possible leads/provenance, not Evidence/EVEidence.
- Failed Discovery refs remain pre-Evidence staging, not failed Evidence.
- Hydration candidate identity remains readability demand, not provider attempt state.
- Local SDE gaps remain local readiness/readability posture, not provider-backed Hydration.
- External I/O on, storage unlock, and Watch arming remain non-authorizing.
- Restart/storage unlock/External I/O re-enable do not create catch-up debt.

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
- no Discovery ref mutation outside fixture setup
- no Watch mutation or arming outside fixture setup
- no Assessment Memory or Marked mutation
- no storage config write or movement
- no support artifact creation
- no schema changes
- no runtime enforcement activation
- no command blocking
- no pruning/deletion behavior
- no renderer UI work

## Stop Conditions

Stop and return to Overseer if:

- the matrix requires packet persistence
- the matrix requires schema changes
- the matrix requires provider calls
- the matrix requires dispatch/execution behavior
- the matrix requires treating `discovered_killmail_refs` as a sequencer
- Hydration identity starts behaving like provider attempt state
- ESI Evidence Expansion and Hydration blur
- service behavior would need broad redesign instead of narrow disclosure/unknown handling

## Verification

Expected:

```txt
node --check src\main\services\patientPacketIdentityService.js
node --check scripts\verify-patient-packet-identity-preview.js
npm.cmd run verify:patient-packet-identity
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:hydration-candidate-preview
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:queue-clock-posture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If adding a new verifier/script, include `node --check` and the new `npm.cmd run verify:*` command in the handoff.

## Acceptance Criteria

- Matrix coverage exists for all required cases or a documented stop condition explains why not.
- Existing happy fixture still passes.
- Sparse/no-candidate/held/waiting states do not read as failure.
- Unknown/uncomputable facts are explicit.
- Malformed radius scope is not guessed.
- Missing hash does not produce ESI Evidence Expansion identity.
- Failed ref with valid hash remains pre-Evidence staging.
- Cached Evidence/EVEidence does not imply unnecessary provider movement.
- Hydration missing anchors disclose weak/unknown identity.
- Local SDE gaps stay separate from provider-needed Hydration.
- view/local-record and Watch/background Hydration lanes remain distinct.
- No provider calls, writes, schema changes, dispatcher, persistence, enforcement, support artifacts, pruning/deletion, or UI are added.

## Parked

- packet persistence
- broad provider work queue
- generic provider packet table
- active dispatcher
- provider calls
- ESI Evidence Expansion scheduling
- provider-backed Hydration execution
- durable leases/claims
- provider cooldown/Retry-After persistence
- Hydration freshness policy persistence
- runtime enforcement activation
- command blocking
- support artifacts for packet state
- pruning/deletion execution
- renderer/UI work
