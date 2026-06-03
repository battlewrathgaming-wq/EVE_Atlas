# Data Engineering HS248 - Patient Packet Identity Real-Data Gap Review

Status: advisory artifact
Date: 2026-06-03
Role: Data Engineering / Engineering Review
Milestone: Atlas Storage And Runtime Hardening

## 1. Executive Recommendation

Atlas can keep patient packet identity derived/read-only for now.

HS246 does not expose a current need for durable packet tables, durable provider queues, checkpoint rows, policy rows, leases, claims, or attempt logs. The current `runtime.patient_packet_identity.preview` shape is directionally sound because it derives identities from existing local facts, marks unknowns without guessing, and keeps all rows non-authoritative.

The main gap is verification coverage, not architecture. HS246 proves the happy fixture strongly. It does not yet prove a full sparse/malformed/mixed-lane matrix through the patient identity verifier itself. Existing related readouts already cover some of those cases, especially Watch scope recovery, but the smallest useful next seam would be a fixture-only/read-only gap-matrix extension for `runtime.patient_packet_identity.preview`, not persistence.

## 2. What HS246 Proves Well

HS246 proves four lane-specific identity shapes without creating runtime movement:

- zKill Discovery movement intent: Watch/scope/lookback/cadence/cap/provider-action shaped.
- ESI Evidence Expansion candidate: local Discovery ref shaped, using `killmail_id` + `killmail_hash` + discovery provenance.
- view/local-record Hydration candidate: Hydration candidate key + lane + source anchors + freshness/basis policy.
- Watch/background Hydration candidate: same Hydration candidate basis, kept separate as patient/background readability posture.

The implementation preserves the HS244/HS245 split:

- Acquisition and Hydration are separate clocks.
- Discovery refs remain possible leads/provenance, not Evidence/EVEidence.
- ESI Evidence Expansion remains the evidence-creating lane if executed later.
- Hydration remains readability repair, not Evidence/EVEidence creation.
- Restart, storage unlock, and External I/O re-enable are recompute-and-enter-normal-gates events, not catch-up debt.
- Every identity row is `derived_for_now`, not persisted, not executable, and not execution authority.

## 3. Real-Data Gap Risks Or Missing Cases

The current service handles absent data by returning a row with `derived_identity_key: null`, `identity_derivable_now: false`, and an explicit `unknown_or_uncomputable` entry. That is the right posture for sparse local data.

Observed risk by case:

- No Watch rows: zKill Discovery identity becomes uncomputable, which is acceptable. This does not require persistence; it means no current Watch/scope intent exists.
- Only system/radius Watches: identity can be derived from center system, radius, lookback, cadence, and caps. Risk is scope quality. Existing Watch readout distinguishes valid, not stored, and malformed scope, but patient identity only flags malformed included-system IDs in a narrow way.
- Malformed included/excluded system scope: should remain a visible limitation, not a durable checkpoint. Patient identity should expose enough unknown detail before any future movement uses that row.
- No pending Discovery refs: ESI Evidence Expansion identity becomes uncomputable. This is normal no-work posture, not failure.
- Failed Discovery refs: selectable failed refs with hashes are currently included as candidates. That is acceptable for retry posture, as long as failed remains staging/provenance and retry/cap policy is not inferred from the identity row.
- Missing killmail hash: ESI identity is correctly not derivable. Missing hash is a Discovery ref quality gap, not a reason to create packet state.
- Already-cached Evidence/EVEidence: queue clock posture and expansion contract require cache skip before future ESI calls. The patient identity row should continue to disclose skip/cache basis if a future verifier adds that sparse case.
- No Hydration candidates: Hydration identity becomes uncomputable. This is normal no-work posture, not failure.
- Hydration candidate with missing source anchors: service already reports missing anchors as unknown. That should block confidence in a future durable movement identity, but it does not require durable state now.
- Local SDE gaps versus provider-needed labels: Hydration candidate preview distinguishes local SDE lookup gaps from provider-needed entity labels. This is essential and should remain separate; local SDE gaps are local readiness/readability posture, not ESI Hydration or Evidence Expansion.

## 4. Whether Each Gap Can Stay Derived / Read-Only

All reviewed gaps can stay derived/read-only at the current stage.

Recommended treatment:

- Missing Watch/scope: derived unknown.
- Malformed Watch scope: derived unknown plus limitation.
- Missing Discovery refs: derived no candidate.
- Missing hash: derived not selectable.
- Failed refs: derived retry candidate only if hash exists; not a sequencer.
- Cached killmail: derived skip/cache posture, not a new packet.
- Missing Hydration candidates: derived no candidate.
- Missing Hydration source anchors: derived identity weakness.
- Local SDE gaps: derived local readiness gap.
- External I/O off or re-enabled: derived held/released-to-normal-gates posture only.
- Storage unlock/restart: derived recompute posture only.

None of those cases needs durable checkpoint or durable policy state before Atlas has an active dispatcher or provider-backed worker that must resume exact accepted movement.

## 5. Whether Any Gap Needs Durable Checkpoint / Policy State

No current HS246/HS248 gap requires durable checkpoint or policy state now.

Durable state may become justified later only if Atlas opens behavior that cannot be reconstructed from current local facts:

- an active long-running provider batch must resume exact accepted work after restart
- multiple workers, utility processes, Link, or peer coordination need leases/claims
- provider `Retry-After` or cooldown must survive restart to protect providers
- operator/audit review needs a durable "accepted packet became these runs/warnings/rows" correlation
- Hydration freshness/basis policy becomes configurable enough that policy version must be persisted for audit
- provider-backed Hydration exists and derived candidates prove insufficient for duplicate prevention

Those are future movement-state reasons. They are not proven by HS246.

## 6. Boundary Concerns

No blocking boundary concern found.

Important cautions:

- Do not let `discovered_killmail_refs` become the sequencer. It is staging/provenance and local dedupe basis.
- Do not treat a `failed` Discovery ref as failed Evidence. It is still pre-evidence unless ESI expansion writes Evidence/EVEidence.
- Do not treat Hydration candidate identity as provider attempt state.
- Do not use local SDE lookup gaps as ESI Hydration work.
- Do not treat External I/O on, storage unlock, or Watch arming as authorization.
- Do not treat `runtime.queue_clock_posture.preview` or `runtime.patient_packet_identity.preview` as architecture authority or dispatch authority.

## 7. Smallest Next Seam, If Any

No Dev packet is required before Overseer can keep patient packet persistence parked.

If Overseer wants stronger proof, the smallest useful next seam is:

```txt
Read-only patient packet identity sparse/real-data gap matrix.
```

Purpose:

Extend the fixture-only verifier for `runtime.patient_packet_identity.preview` to cover sparse and imperfect local states without changing service behavior unless the verifier exposes a false claim.

Suggested matrix:

- empty DB / no Watch / no Discovery refs / no Hydration candidates
- system radius Watch with valid scope
- system radius Watch with missing scope
- system radius Watch with malformed included or excluded scope
- pending Discovery ref without hash
- failed Discovery ref with hash
- already-cached killmail matching a Discovery ref
- Hydration candidate with no source anchors
- local SDE gap candidate
- provider-needed entity label candidate
- mixed view/local-record and Watch/background Hydration lanes

This should remain read-only and fixture-only: no provider calls, no writes, no schema, no dispatcher, no enforcement, no support artifacts, no UI.

## 8. Parked Items

Keep parked:

- packet persistence
- broad provider work queue
- generic provider packet table
- active dispatcher
- provider calls
- zKill Discovery execution
- ESI Evidence Expansion scheduling
- provider-backed Hydration execution
- durable attempt logs
- durable leases/claims
- provider cooldown/Retry-After persistence
- Hydration freshness policy persistence
- runtime enforcement activation
- command blocking
- support artifacts for packet state
- pruning/deletion execution
- renderer/UI work

## 9. Verification Evidence

Local-only checks run:

```txt
npm.cmd run verify:patient-packet-identity
npm.cmd run verify:watch-offline-readout
git status --short --branch
```

Results:

- `verify:patient-packet-identity` passed. It reported 4 identity rows, all derivable in the fixture, Acquisition/Hydration separate, all `derived_for_now`, no packet persistence recommended, all non-authoritative, and unchanged mutation counts.
- `verify:watch-offline-readout` passed. It specifically demonstrated valid, missing, and malformed system/radius scope readout, including no guessing on malformed scope and unchanged mutation counts.
- `git status --short --branch` showed `## main...origin/main` before this advisory artifact was created.

No live/API/provider calls were run.

## 10. Human / Overseer Decisions Needed

Overseer can safely accept the current derived/read-only model and keep durable patient packet/checkpoint state parked.

Optional Overseer decision:

- open the small read-only sparse/real-data gap matrix verifier, if more proof is desired before moving to a nearby runtime/storage seam.

Human/Overseer decisions still needed before any future persistence:

- whether exact provider cooldown/Retry-After state must survive restart
- whether Hydration freshness/basis policy needs durable versioning
- whether Watch/background Hydration ever deserves durable checkpointing
- whether multi-worker, utility process, Link, or peer coordination is in scope
- whether operator/audit review requires durable accepted-packet correlation

## Files / Context Reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `workspace/OverseerHS248-patient-packet-identity-real-data-gap-review-request.md`
- `workspace/DataEngineeringHS244-patient-packet-identity-boundaries.md`
- `workspace/OverseerHS245-hs244-patient-packet-identity-review.md`
- `workspace/OverseerHS246-patient-packet-identity-conformance-preview-runway.md`
- `workspace/DevHS246-patient-packet-identity-conformance-preview.md`
- `workspace/OverseerHS247-hs246-patient-packet-identity-review.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/data-layer-boundaries.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `src/main/services/patientPacketIdentityService.js`
- `src/main/services/queueClockPostureService.js`
- `src/main/services/hydrationCandidatePreviewService.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchOfflineReadout.js`
- `scripts/verify-patient-packet-identity-preview.js`
- `src/main/db/schema.sql`

## Boundary Confirmation

This advisory did not implement code, write schema, create a Dev runway, authorize provider calls, dispatch work, activate runtime enforcement, block commands, create support artifacts, prune/delete records, mutate Discovery refs, write Evidence/EVEidence, write Hydration labels, mutate Watch/Marked/Assessment state, or define UI.
