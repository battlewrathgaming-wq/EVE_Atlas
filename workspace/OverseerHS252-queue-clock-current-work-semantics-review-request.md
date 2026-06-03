# Overseer HS252: Queue / Clock Current-Work Semantics Review Request

Date: 2026-06-03
Role: Atlas Overseer
Milestone: Atlas Storage And Runtime Hardening
Requested executor: Data Engineering / Engineering Review
Expected artifact: `workspace/DataEngineeringHS252-queue-clock-current-work-semantics-review.md`

## Purpose

Review `runtime.queue_clock_posture.preview` for current-work semantics after HS250/HS251.

This is advisory only. Do not implement code. Do not create a Dev runway. Do not run live/API/provider calls.

## Why This Review Exists

HS250/HS251 proved patient packet identity can disclose sparse, missing, malformed, cached, local-SDE, provider-needed, and mixed-lane identity gaps without false confidence.

While reviewing the next mechanical seam, Overseer noticed a possible queue/clock semantics issue:

```txt
buildQueueClockPosturePreview -> zkill_discovery lane
```

Currently, if there are no pending Discovery refs, the lane can count provider-backed work as `1` by default.

That might be acceptable if it means:

```txt
provider capability exists and an explicit operator/Watch scope could request work
```

But it may be misleading if it reads as:

```txt
Atlas currently has one zKill Discovery work item to do
```

The distinction matters before any future dispatcher, provider-backed execution, runtime enforcement, or UI readout.

## Core Question

Should `runtime.queue_clock_posture.preview` distinguish:

- current local work
- current provider-backed work with explicit scope/intent
- provider capability available but no current work
- Watch acquisition intent waiting on arming/cadence
- operator/manual discovery intent waiting on explicit input

Or is the current posture already clear enough?

## Read

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/data-layer-boundaries.md`
- `workspace/DevHS242-queue-clock-runtime-posture-preview.md`
- `workspace/OverseerHS243-hs242-queue-clock-posture-review.md`
- `workspace/DataEngineeringHS244-patient-packet-identity-boundaries.md`
- `workspace/OverseerHS245-hs244-patient-packet-identity-review.md`
- `workspace/DevHS246-patient-packet-identity-conformance-preview.md`
- `workspace/OverseerHS247-hs246-patient-packet-identity-review.md`
- `workspace/DataEngineeringHS248-patient-packet-identity-real-data-gap-review.md`
- `workspace/OverseerHS249-hs248-real-data-gap-review-acceptance.md`
- `workspace/DevHS250-patient-packet-identity-sparse-gap-matrix.md`
- `workspace/OverseerHS251-hs250-sparse-gap-matrix-review.md`
- `src/main/services/queueClockPostureService.js`
- `scripts/verify-queue-clock-posture-preview.js`
- `src/main/services/patientPacketIdentityService.js`
- `scripts/verify-patient-packet-identity-sparse.js`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/db/schema.sql`

## Review Tasks

1. Trace how `runtime.queue_clock_posture.preview` computes:
   - `provider_backed_work`
   - `local_only_available_work`
   - lane `posture`
   - lane `next_safe_action`
   - `summary.provider_backed_work`
2. Decide whether zKill Discovery should report provider-backed work when:
   - no pending Discovery refs exist
   - no explicit manual discovery scope is supplied
   - no Watch acquisition scope is due/eligible
3. Decide how Watch acquisition intent should appear in the Acquisition Clock:
   - distinct from manual discovery
   - blocked by Watch arming/cadence when appropriate
   - not confused with Hydration/background Watch posture
4. Decide whether queue/clock needs a sparse/no-intent matrix similar to HS250.
5. Decide whether a future Dev packet should be:
   - verifier-only
   - narrow disclosure/renaming
   - small service behavior correction
   - no work needed
6. Identify any wording that could falsely imply current work, provider authorization, or dispatch readiness.

## Constraints

- Do not propose active dispatch.
- Do not propose a broad provider work queue.
- Do not propose packet persistence or schema-backed queue tables.
- Do not make `discovered_killmail_refs` the sequencer.
- Do not blur provider capability with current work.
- Do not blur manual discovery intent with Watch acquisition intent.
- Do not blur Acquisition with Hydration.
- Do not treat External I/O on, storage unlock, or Watch arming as authorization.
- Do not treat no work, waiting, held, or missing scope as failure.
- Do not implement code.
- Do not run live/API/provider calls.

## Useful Local Verification

You may run local-only checks:

```txt
npm.cmd run verify:queue-clock-posture
npm.cmd run verify:patient-packet-identity
npm.cmd run verify:patient-packet-identity-sparse
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:hydration-candidate-preview
git status --short --branch
```

No live/API/provider checks.

## Expected Output

Return a concise advisory artifact with:

1. Executive recommendation.
2. Whether the current zKill Discovery provider-backed work semantics are clear or misleading.
3. Recommended meanings for:
   - current local work
   - current provider-backed work
   - provider capability only
   - manual discovery intent
   - Watch acquisition intent
4. Whether a sparse/no-intent queue-clock matrix is needed.
5. Smallest next Dev packet, if any.
6. Parked items.
7. Verification evidence.
8. Human/Overseer decisions needed.

## Parked

- implementation
- provider calls
- dispatch
- packet persistence
- schema-backed queues
- broad provider work queue
- runtime enforcement activation
- command blocking
- pruning/deletion execution
- support artifacts for packet state
- UI work
