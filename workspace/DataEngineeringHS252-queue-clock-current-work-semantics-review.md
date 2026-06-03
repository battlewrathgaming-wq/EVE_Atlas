# Data Engineering HS252 - Queue / Clock Current-Work Semantics Review

Status: advisory artifact
Date: 2026-06-03
Role: Data Engineering / Engineering Review
Milestone: Atlas Storage And Runtime Hardening

## 1. Executive Recommendation

`runtime.queue_clock_posture.preview` should distinguish current work from provider capability.

The current preview is useful and remains safe as read-only posture, but the zKill Discovery lane has a semantics risk: when no pending Discovery refs exist, it can report `provider_backed_work: 1` for `manual.discovery` even when no explicit manual discovery scope was supplied and no Watch acquisition scope is being represented as due/eligible work in that lane.

That is acceptable only if it is labeled as provider capability or possible next provider action after explicit scope/intent. It is misleading if read as "Atlas currently has one zKill Discovery work item to do."

Recommended next action, if Overseer wants to continue this seam:

```txt
Read-only queue/clock no-intent current-work semantics matrix.
```

This should be a small verifier-first packet with a narrow disclosure/count correction only if the verifier proves the ambiguity. It should not create packets, queues, dispatch, provider calls, schema, enforcement, support artifacts, or UI.

## 2. Current zKill Discovery Semantics

Current source behavior:

- `buildDiscoveryRefPosture(...)` counts pending/failed Discovery refs and ESI expansion candidates from `discovered_killmail_refs`.
- `buildClockLanes(...)` builds `zkill_discovery` with:
  - `localWorkCount: discovery.pending_or_failed_refs`
  - `providerWorkCount: discovery.pending_or_failed_refs > 0 ? 0 : 1`
  - `preferredLocalAction: drain_pending_discovery_refs_first` only when pending/failed refs exist
- `providerInput('manual.discovery', input)` defaults to `{ scope: 'actor', maxRefs: 1 }` when no discovery gate input is supplied.

This means the lane can count one provider-backed unit when local refs are empty, even if the preview has not received an explicit manual discovery target/scope and is not deriving a Watch acquisition work item.

The boundary flags still prevent execution:

- provider calls are `0`
- dispatches are `0`
- preview authorizes execution is `false`
- External I/O on is not authorization
- restart/unlock/re-enable do not create catch-up debt

So this is not a safety breach. It is a meaning/readout risk.

## 3. Clear Or Misleading?

The current semantics are partially misleading.

Clear:

- Pending Discovery refs are local work and are preferred before fresh zKill.
- ESI Evidence Expansion candidates are local Discovery refs that may become provider-backed Evidence Expansion later.
- Hydration candidate counts are derived local readability demand.
- Watch/background Hydration is distinct from Watch arming.
- The preview is not execution authority.

Misleading:

- `provider_backed_work: 1` on `zkill_discovery` can imply current work when the actual fact may be only provider capability.
- `manual.discovery` as the provider action can make the lane sound manually scoped even when the preview supplied no manual scope.
- The Acquisition Clock currently does not clearly separate manual discovery intent from Watch acquisition intent.
- Summary `provider_backed_work` can be inflated by capability-only posture, making total provider-backed work look more concrete than it is.

## 4. Recommended Meanings

Use these meanings if a future packet clarifies the queue/clock preview.

### Current Local Work

Current local work means existing local facts or candidates that can be inspected, reviewed, selected, skipped, or used without inventing scope:

- pending/failed Discovery refs as possible leads
- ESI expansion candidates from Discovery refs with hashes
- cached Evidence/EVEidence skip posture
- Hydration candidates/readability demand
- local SDE lookup gaps
- Watch/offline local context such as pending refs, missed slots, orphan signals, and provider deferral readout

It should not include provider capability with no explicit scope.

### Current Provider-Backed Work

Current provider-backed work means a local or explicit intent exists and the next movement would contact a provider if later authorized by all gates.

Examples:

- ESI Evidence Expansion candidate from a local Discovery ref with `killmail_id` + `killmail_hash`
- provider-needed Hydration candidate with a stable candidate key and source anchors
- Watch acquisition scope that is due or eligible-if-armed and has enough stored scope to describe the request
- explicit manual discovery scope supplied in the preview input or future caller context

It remains non-authorizing posture.

### Provider Capability Only

Provider capability only means Atlas has a known provider action that could be used if a scoped manual request or Watch acquisition intent exists, but no current work item is present.

Suggested meaning:

```txt
provider_capability_available: true
current_provider_backed_work: 0
requires_explicit_scope_or_watch_intent: true
```

Capability should not roll into `summary.provider_backed_work`.

### Manual Discovery Intent

Manual discovery intent should exist only when an explicit manual scope/target is supplied.

It should not be inferred from a default provider-gate input such as `{ scope: 'actor', maxRefs: 1 }`.

Suggested posture if no manual input exists:

```txt
manual_discovery_intent: absent
provider_capability_available: true
current_provider_backed_work: 0
next_safe_action: wait_for_explicit_manual_scope_or_watch_intent
```

### Watch Acquisition Intent

Watch acquisition intent comes from durable Watch rows, not manual discovery defaults.

It should be visible as Acquisition Clock posture, separate from Watch/background Hydration:

- active Watch configured
- scope quality: valid, not stored, malformed
- due / not due / backoff / inactive
- eligible if armed
- pending local refs for that Watch/scope
- next safe action such as `arm_required`, `wait`, `drain_pending_refs`, or `ready_for_discovery`

Watch acquisition should not be confused with Watch/background Hydration. One is Discovery/acquisition intent; the other is readability repair from local records.

## 5. Sparse / No-Intent Matrix Need

A sparse/no-intent queue-clock matrix is needed if Overseer wants confidence before any further provider-backed execution design.

The current queue-clock verifier proves the populated HS242 fixture. It does not appear to prove:

- empty DB with no Watch and no manual scope
- no pending Discovery refs but no manual/Watch acquisition intent
- no pending refs with a due Watch
- no pending refs with only not-due/backoff/inactive Watch
- no pending refs with malformed Watch scope
- explicit manual discovery input versus no manual input
- Watch acquisition intent versus Watch/background Hydration demand
- summary provider-backed work excluding capability-only posture

This is the same class of weakness HS248 identified for patient packet identity before HS250: not an architecture failure, but a fixture coverage and wording/count-semantics gap.

## 6. Smallest Next Dev Packet, If Any

Recommended only if Overseer chooses to continue this seam:

```txt
Queue/clock current-work semantics no-intent matrix.
```

Preferred scope:

- verifier-first
- read-only
- fixture-only
- no provider calls
- no schema or persistence
- no dispatcher
- no runtime enforcement
- no UI

If the verifier confirms the ambiguity, the smallest service correction should be narrow disclosure/count semantics:

- split `provider_backed_work` from `provider_capability_available`
- avoid counting zKill Discovery capability as current provider-backed work without explicit manual scope or Watch acquisition intent
- expose manual discovery intent as absent/present based on explicit input
- expose Watch acquisition intent separately from Watch/background Hydration
- keep `summary.provider_backed_work` as current work only

This is a narrow disclosure/behavior correction, not a provider queue design.

## 7. Parked Items

Keep parked:

- active dispatch
- provider calls
- packet persistence
- schema-backed queues
- broad provider work queue
- making `discovered_killmail_refs` a sequencer
- ESI Evidence Expansion scheduling
- zKill Discovery execution
- provider-backed Hydration execution
- runtime enforcement activation
- command blocking
- pruning/deletion execution
- support artifacts for packet state
- renderer/UI work

## 8. Verification Evidence

Local-only checks run:

```txt
npm.cmd run verify:queue-clock-posture
npm.cmd run verify:patient-packet-identity-sparse
git status --short --branch
```

Results:

- `verify:queue-clock-posture` passed. It reported the populated fixture with 4 lanes, local work, provider-backed work, pending Discovery refs, ESI expansion candidates, Hydration candidates, Watch configured, no provider calls, no dispatches, and unchanged mutation counts.
- `verify:patient-packet-identity-sparse` passed. It remains useful supporting evidence that sparse/no-candidate posture can be proven without persistence or false confidence.
- `git status --short --branch` showed `## main...origin/main` before this advisory artifact was created.

No live/API/provider calls were run.

## 9. Human / Overseer Decisions Needed

Overseer should decide whether to open the small no-intent queue-clock semantics matrix.

If opened, Overseer should decide the preferred wording for capability-only state. Suggested terms:

- `provider_capability_available`
- `current_provider_backed_work`
- `manual_discovery_intent`
- `watch_acquisition_intent`
- `requires_explicit_scope_or_watch_intent`

No Human product-direction decision is required unless these terms are meant to become durable user-facing language. For now, they can stay internal readout semantics.

## Files / Context Reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `workspace/OverseerHS252-queue-clock-current-work-semantics-review-request.md`
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

## Boundary Confirmation

This advisory did not implement code, write schema, create a Dev runway, authorize provider calls, dispatch work, activate runtime enforcement, block commands, create support artifacts, prune/delete records, mutate Discovery refs, write Evidence/EVEidence, write Hydration labels, mutate Watch/Marked/Assessment state, or define UI.
