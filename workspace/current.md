# AURA Atlas Current Work

Status: HS495 Discovery candidate-ref landing boundary preview accepted
Last updated: 2026-06-12

This file is the active working desk. Older milestone detail was preserved before flattening at:

```txt
workspace/archive/current-legacy-2026-06-07-pre-flatten.md
```

Use `workspace/overview.md` for the active breadcrumb map and individual HS artifacts for transaction evidence.

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current heading:

- How does Evidence get generated from user intent?
- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- data-layer boundaries guide machinery

Current focus:

HS440 is accepted by HS441. Direct production `actor.watch` now routes through the boundary-owned direct body while scheduled actor Watch remains parked on the legacy collector.

HS442 is accepted by HS443. The older controlled-adapter return-path proof now distinguishes direct production redirect, scheduled legacy runtime, and fixture-only preview posture.

HS444 is accepted by HS445. Scheduled actor Watch is structurally ready for a narrow redirect if Watch executor/task/cadence/result ownership is preserved.

HS446 is accepted through HS449. Scheduled actor Watch now routes through the boundary-owned actor Watch route while preserving Watch executor/task/cadence/result ownership.

HS448 is accepted by HS449. The stale production-like fake-client proof/verifier now reflects the post-HS446 scheduled actor Watch state without adding runtime movement.

HS450 is accepted by HS451. The trace found that actor Watch and Discovery communicate through the current redirected path, but the request/receipt contract remains implicit and compatibility-shaped.

HS452 is accepted by HS453. Current direct and scheduled actor Watch outputs can be projected into explicit `actor_watch_discovery_request` and `actor_watch_discovery_receipt` shapes without runtime movement, while preserving the 22-field compatibility summary under `compatibility_summary` only.

HS454 packet-shape acceptance pressure is accepted with changes by HS455. Discovery should remain capture-rich internally, while callers consume bounded projections shaped for their needs.

HS456 is accepted by HS458. `collectActorWatch(...)` is no longer the active direct/scheduled actor Watch runtime path, but is not retirement-ready because live scripts, verifier seed paths, availability assertions, and stale compatibility readouts still depend on it.

HS457 captures the settled-posture reporting rule: Discovery should be capture-rich internally, but report to callers only when emitted work reaches a settled posture. Provider timing facts may cross the boundary; Watch scheduling decisions do not.

HS459 is accepted by HS460. Stale actor Watch compatibility-wrapper readouts/assertions now reflect that direct and scheduled actor Watch use the boundary-owned direct body, while `collectActorWatch(...)` remains parked legacy compatibility code and retirement candidate.

HS461 Dev handoff has landed. The transport-failure parity proof/readout no longer says scheduled actor Watch is legacy parked and now reports the current `runScheduledActorWatch -> runActorWatchDirectBody` posture.
HS461 is accepted by HS462. The old scheduled actor Watch stale readout has been removed from the active transport-failure parity proof surface.

HS463 is accepted by HS464. System/radius Watch can express one due run as a bounded read-only Watch-run stub from accepted stored scope without buckets, Discovery pickup, providers, writes, or cadence mutation.

HS465 is accepted by HS466. The durable blind Watch bucket and provenance-preserving dedupe model is accepted as architecture direction and promoted to `docs/adr/ADR-0007-watch-bucket-and-provenance-preserving-dedupe.md`.
HS467 captures the pause/forecast posture after ADR-0007. No implementation is open. Next decision is whether to start with read-only Watch bucket identity projection or disposable write fixture.
HS468 is accepted by HS469. The practical risk check confirms that the next seam should be a read-only Watch bucket identity projection, with existing-open bucket state represented only as fixture input and no schema/runtime implication.

HS470 is accepted by HS471. Watch bucket identity rules are represented as a read-only fixture/projection proof using fixture existing-open state, without schema, runtime bucket writes, Discovery pickup, providers, or Evidence movement.

HS472 is accepted by HS473. Projected Watch bucket candidates can now be classified into future Discovery pickup eligibility, External I/O hold, or rejected-before-pickup posture in a read-only fixture/projection proof without durable bucket rows, Discovery pickup, providers, or writes.

HS474 is accepted by HS475. The next seam should be a disposable Watch bucket persistence fixture before a Discovery pickup consumer hold contract.

HS476 is accepted by HS477. Watch bucket identity rules are now proven as isolated disposable persistence semantics without product schema, operator corpus mutation, Discovery pickup, providers, candidate refs, Evidence movement, or Watch cadence mutation.

HS478 is accepted by HS479. Discovery pickup consumer hold contract can classify disposable open bucket fixture rows as future pickup eligible or held by External I/O without starting pickup, leasing work, writing refs, or calling providers.

The Watch bucket / Discovery pickup seam has completed its non-production proof chain.

HS480 is accepted by HS481. Atlas should introduce a small product Watch bucket persistence surface for emitted Watch work identity, separate from `fetch_runs`, `discovered_killmail_refs`, Watch source rows, and Evidence/EVEidence. First implementation should be system/radius only and must not start Discovery pickup/provider movement.

HS482 is accepted by HS484. Atlas now has a minimal product `watch_bucket_items` persistence surface for system/radius emitted work identity, with one open item per Watch and no Discovery/provider/Evidence movement.

HS485 opens the next narrow seam: a read-only product Watch bucket pickup readout over real `watch_bucket_items` rows. It should classify future pickup posture without starting Discovery pickup, provider movement, leases, candidate refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, receipt mutation, or UI.

HS485 is accepted by HS486. Atlas can now inspect product `watch_bucket_items` rows and classify future pickup posture without mutating rows or starting Discovery/provider movement.

HS487 opens the next narrow seam: a read-only Discovery pickup selection contract over eligible product bucket readout rows. It should select future Discovery pickup input shape only, without starting pickup, provider movement, leases, queues, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, or UI.

HS487 is accepted by HS488. Atlas can now shape eligible product bucket readout rows into future Discovery pickup selection candidates without creating pickup units, provider packets, leases, queues, durable Discovery task rows, refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema changes, enforcement, or UI.

HS489 opens the next narrow seam: a read-only provider-route packet preview from selected Discovery pickup candidates. It should fan accepted system/radius scope into inert zKill route packet previews only, without pickup execution, leases, queues, dispatcher runtime, provider calls, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema changes, enforcement, or UI.

HS489 is accepted by HS490. Atlas can now fan selected system/radius Discovery pickup candidates into inert zKill provider-route packet previews while preserving Watch/run/bucket/scope/window/cap/provenance/source selection basis. The route preview is structured and non-executing only; no pickup execution, leases, queues, dispatcher runtime, provider calls, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema changes, enforcement, or UI is open.

HS491 opens the next narrow seam: a read-only Discovery pickup execution boundary preview from accepted HS489 route packet previews. It should classify what would be needed before provider execution without creating pickup units, leases, queues, dispatcher runtime, provider calls, executable provider packets, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema changes, enforcement, or UI.

HS491 is accepted by HS492. Atlas can now classify accepted HS489 zKill route packet previews at the pre-provider pickup execution boundary while preserving route/Watch/run/bucket/scope/window/cap/provenance/source-selection basis. The preview names future prerequisites only: External I/O open, dispatcher ownership, lease/claim semantics, provider pacing, and zKill candidate-ref write handling. No pickup execution, leases, queues, dispatcher runtime, provider calls, executable provider packets, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema changes, enforcement, or UI is open.

HS493 opens the next narrow seam: a read-only Discovery dispatcher/lease boundary preview from accepted HS491 boundary packets. It should classify future lease candidacy and lease prerequisites without creating dispatcher runtime, queues, leases, lease claims, provider calls, executable provider packets, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema changes, enforcement, or UI.

HS493 is accepted by HS494. Atlas can now classify accepted HS491 pickup execution boundary packets as future dispatcher/lease candidates while preserving Watch/run/bucket/scope/window/cap/provenance/source-selection basis. The preview names future lease identity, owner, expiry, retry/provider eligibility, provider pacing, and abandoned-lease recovery basis only. No dispatcher runtime, durable queue, durable lease, lease claim, provider call, executable provider packet, candidate ref, Discovery ref, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema change, enforcement, or UI is open.

HS495 opens the next narrow seam: a read-only Discovery candidate-ref landing boundary preview from accepted HS493 lease candidates and fixture provider-result examples. It should classify `killmail_id + hash` candidate refs, dedupe posture, malformed/missing-hash posture, capped/deferred/failure posture, and provenance relationship preview without provider calls, candidate-ref writes, Discovery ref writes, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema changes, enforcement, or UI.

HS495 is accepted by HS496. Atlas can now classify fixture zKill provider-result refs at the Discovery candidate-ref landing boundary while keeping candidate refs as Discovery possible leads only, not Evidence/EVEidence. It proves `killmail_id + hash` identity, dedupe posture, malformed/missing-hash rejection, capped/deferred/failure posture, and provenance relationship preview without provider calls, candidate-ref writes, Discovery ref writes, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema changes, enforcement, or UI.

## Current Executor

Current executor: none - stable landing

Active Dev runway:

```txt
none
```

Accepted Dev handoff:

```txt
workspace/DevHS495-discovery-candidate-ref-landing-boundary-preview.md
```

Latest accepted advisory review:

```txt
workspace/OverseerHS481-hs480-watch-bucket-schema-runtime-design-review.md
```

Latest accepted advisory artifact:

```txt
workspace/ArchitectureDataHS480-watch-bucket-schema-runtime-design.md
```

Warm-start note:

```txt
workspace/OverseerHS483-warm-start-hs482-review.md
```

Latest accepted review:

```txt
workspace/OverseerHS496-hs495-discovery-candidate-ref-landing-boundary-preview-review.md
```

Latest completed Dev handoff:

```txt
workspace/DevHS495-discovery-candidate-ref-landing-boundary-preview.md
```

Expected Dev handoff:

```txt
none
```

## Resting State

HS495: Discovery candidate-ref landing boundary preview accepted.

Active Dev runway:

```txt
none
```

Latest accepted handoff:

```txt
workspace/DevHS495-discovery-candidate-ref-landing-boundary-preview.md
```

Purpose:

```txt
accepted read-only Discovery candidate-ref landing boundary preview from accepted HS493 lease candidates and fixture provider results; next decision is whether to prove receipt/status handling, audit candidate-ref persistence readiness, or pause for cleanup/commit readiness before any live/provider movement
```

Boundary:

HS495 is accepted as a read-only candidate-ref landing boundary preview only. No production actor Watch runtime change, `collectActorWatch(...)` retirement, system/radius Watch redirect, live/provider call, provider execution, Discovery pickup execution, durable lease, durable queue, dispatcher runtime, lease claim, candidate ref write, Discovery ref write, Evidence/EVEidence write, Hydration write, Observation/report change, Watch cadence mutation, bucket status mutation, receipt mutation, runtime enforcement, command blocking, UI, source-term rename, or protected-word JSON update is open.

Latest accepted review:

```txt
workspace/OverseerHS496-hs495-discovery-candidate-ref-landing-boundary-preview-review.md
```

Latest forecast note:

```txt
workspace/OverseerHS467-watch-bucket-forecast-and-open-questions.md
```

Latest accepted shaping note:

```txt
workspace/OverseerHS457-discovery-settled-posture-reporting-note.md
```

Previous accepted advisory artifact:

```txt
workspace/ArchitectureDataHS474-watch-bucket-next-seam-assurance.md
```

Latest accepted Dev handoff:

```txt
workspace/DevHS495-discovery-candidate-ref-landing-boundary-preview.md
```

Latest landed Dev handoff reviewed and accepted:

```txt
workspace/DevHS495-discovery-candidate-ref-landing-boundary-preview.md
```

## Stable Landing

Source runway:

```txt
workspace/OverseerHS482-product-watch-bucket-persistence-runway.md
```

Landed handoff:

```txt
workspace/DevHS482-product-watch-bucket-persistence.md
```

Accepted review:

```txt
workspace/OverseerHS484-hs482-product-watch-bucket-persistence-review.md
```

Accepted design basis:

```txt
workspace/OverseerHS481-hs480-watch-bucket-schema-runtime-design-review.md
workspace/ArchitectureDataHS480-watch-bucket-schema-runtime-design.md
workspace/ExternalIntegrationHS480-provider-policy-watch-bucket-discovery-pickup-design-pressure.md
```

Accepted proof chain:

```txt
HS470 Watch bucket identity projection
HS472 Watch bucket pickup posture bridge
HS476 Watch bucket disposable persistence fixture
HS478 Discovery pickup consumer hold contract
```

Question:

```txt
What is the next safe seam after accepted product Watch bucket persistence?
```

Boundary:

```txt
Only minimal Watch bucket schema/repository/service/readout work is open. Discovery pickup start, lease/queue/dispatcher runtime, provider calls, Watch cadence mutation, candidate ref writes, Evidence/EVEidence writes, Hydration, Observation, UI, source-term rename, and protected-word JSON update remain closed.
```

Provider-sourced guidance remains design pressure for later Discovery/provider movement, but HS482 must not start that movement.

Likely next seam:

```txt
read-only product bucket pickup readout / Discovery pickup selection over open bucket rows
```

HS495 Dev handoff has landed and is ready for Overseer review.

## HS495 Evidence

Dev updated 2026-06-12:

- Added read-only Discovery candidate-ref landing boundary preview service:

```txt
src/main/services/discoveryCandidateRefLandingBoundaryPreviewService.js
```

- Added renderer-eligible read-only command:

```txt
discovery.candidate_ref_landing_boundary.preview
```

- Added focused verifier and package script:

```txt
scripts/verify-discovery-candidate-ref-landing-boundary-preview.js
npm.cmd run verify:discovery-candidate-ref-landing-boundary-preview
```

- Registered command metadata / coverage in:

```txt
package.json
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
scripts/verify-enforcement-dry-run.js
```

Focused verifier sample:

```json
{
  "status": "Discovery candidate ref landing boundary preview verified",
  "command": "discovery.candidate_ref_landing_boundary.preview",
  "summary": {
    "source_lease_candidate_count": 5,
    "fixture_provider_result_count": 5,
    "candidate_ref_landing_preview_count": 8,
    "unique_candidate_ref_identity_count": 3,
    "landing_action_preview_count": 2,
    "new_candidate_ref_count": 2,
    "duplicate_within_provider_result_count": 1,
    "duplicate_against_preview_count": 1,
    "existing_memory_duplicate_count": 1,
    "malformed_ref_count": 1,
    "capped_result_count": 4,
    "provider_deferred_count": 1,
    "provider_failed_count": 1,
    "provider_calls": 0,
    "live_api_calls": 0,
    "zkill_calls": 0,
    "esi_calls": 0,
    "candidate_refs_written": 0,
    "discovered_killmail_refs_written": 0,
    "discovery_refs_written": false,
    "evidence_eveidence_writes": 0,
    "hydration_writes": 0,
    "watch_cadence_mutations": 0,
    "receipt_mutations": 0,
    "watch_bucket_status_mutations": 0,
    "schema_changes": 0
  }
}
```

Behavior proven:

- accepted HS493 lease candidates can be paired with fixture provider-result examples and classified without provider calls
- candidate-ref identity is `killmail_id + hash`
- new candidate refs are previewed as future Discovery possible leads only
- duplicate refs within one provider result are suppressed
- duplicate refs against fixture existing Discovery memory are disclosed as already known
- duplicate refs across overlapping Watch/route candidates attach provenance only and do not duplicate Evidence
- malformed/missing-hash refs are rejected before landing
- capped result posture is disclosed as more refs may exist, not as failure
- deferred and failed provider-result examples produce no landing action
- Watch completion semantics stay out of the preview
- no `discovered_killmail_refs`, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence, bucket status, receipt, schema, enforcement, or UI side effect occurs

Verification completed:

```txt
node --check src\main\services\discoveryCandidateRefLandingBoundaryPreviewService.js
node --check scripts\verify-discovery-candidate-ref-landing-boundary-preview.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:discovery-candidate-ref-landing-boundary-preview
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

Results:

- listed syntax checks passed
- focused Discovery candidate-ref landing boundary preview verifier passed
- service registry verifier passed
- command authority verifier passed
- passive side-effect verifier passed
- enforcement dry-run verifier passed with 129/129 commands covered and no gaps
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git diff -- src/main/db/schema.sql` returned no diff
- `git status --short --branch` showed `main...origin/main` with HS485/HS487/HS489/HS491/HS493/HS495 touched files and active workspace runway/review files
- no schema changes were made

Boundary confirmation:

- read-only candidate-ref landing boundary preview only
- no schema changes
- no live provider calls, zKill calls, or ESI calls
- no real Discovery pickup execution
- no executable provider packets
- no dispatcher runtime, queue runtime, durable queues, durable leases, or lease claims
- no candidate-ref writes, Discovery ref writes, or `discovered_killmail_refs` writes
- no Evidence/EVEidence writes
- no Hydration
- no Observation/reporting behavior
- no Watch cadence mutation
- no Watch bucket status mutation
- no receipt mutation
- no Watch completion semantics
- no UI
- no actor Watch migration
- no `collectActorWatch(...)` retirement
- no system/radius collector redirect
- no source-term rename or protected-word JSON update

## HS495 Dev Handoff

Completed:

```txt
workspace/DevHS495-discovery-candidate-ref-landing-boundary-preview.md
```

Status: ready for Overseer review.

## HS493 Evidence

## HS493 Evidence

Dev updated 2026-06-12:

- Added read-only Discovery dispatcher/lease boundary preview service:

```txt
src/main/services/discoveryDispatcherLeaseBoundaryPreviewService.js
```

- Added renderer-eligible read-only command:

```txt
discovery.dispatcher_lease_boundary.preview
```

- Added focused verifier and package script:

```txt
scripts/verify-discovery-dispatcher-lease-boundary-preview.js
npm.cmd run verify:discovery-dispatcher-lease-boundary-preview
```

- Registered command metadata / coverage in:

```txt
package.json
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
scripts/verify-enforcement-dry-run.js
```

Focused verifier sample:

```json
{
  "status": "Discovery dispatcher lease boundary preview verified",
  "command": "discovery.dispatcher_lease_boundary.preview",
  "external_io_on_summary": {
    "source_pickup_execution_boundary_packet_count": 5,
    "lease_candidate_count": 5,
    "not_leased_candidate_count": 5,
    "one_accepted_system_id_maps_to_one_lease_candidate": true,
    "future_lease_owner_required_count": 5,
    "future_lease_expires_at_required_count": 5,
    "future_retry_after_basis_count": 5,
    "future_provider_pacing_basis_count": 5,
    "future_expired_lease_recovery_basis_count": 5,
    "provider_calls": 0,
    "live_api_calls": 0,
    "zkill_calls": 0,
    "esi_calls": 0,
    "executable_provider_packets_created": 0,
    "dispatcher_runtime_started": false,
    "queue_items_created": 0,
    "leases_created": 0,
    "lease_claims_created": 0,
    "candidate_refs_written": 0,
    "discovery_refs_written": false,
    "evidence_eveidence_writes": 0,
    "hydration_writes": 0,
    "watch_cadence_mutations": 0,
    "receipt_mutations": 0,
    "watch_bucket_status_mutations": 0,
    "schema_changes": 0
  },
  "external_io_off_summary": {
    "source_pickup_execution_boundary_packet_count": 0,
    "lease_candidate_count": 0,
    "external_io_hold_before_lease_candidacy": true,
    "excluded_row_count": 7,
    "held_excluded_count": 3,
    "provider_calls": 0,
    "zkill_calls": 0,
    "esi_calls": 0
  }
}
```

Behavior proven:

- accepted HS491 pickup execution boundary packets can be classified as future dispatcher/lease candidates
- one accepted included system ID remains one not-leased lease candidate when External I/O is on
- route packet identity, Watch/run/bucket/scope/window/cap/provenance/source-selection basis is preserved
- lease candidates are not leased, not dispatchable now, not executable now, and do not have lease rows or claims
- candidates report future lease facts: identity basis, owner requirement, expiry requirement, retry/provider eligibility basis, provider pacing basis, and expired/abandoned lease recovery basis
- External I/O closed remains a hold before lease candidacy
- held/rejected/not-input rows do not enter lease candidacy
- renderer-supplied boundary previews are not authoritative
- no dispatcher runtime, queue item, durable queue row, lease row, lease claim, provider call, zKill call, ESI call, executable provider packet, candidate ref, Discovery ref, Evidence/EVEidence, Hydration, Observation, Watch cadence, bucket status, receipt, schema, enforcement, or UI side effect occurs

Verification completed:

```txt
node --check src\main\services\discoveryDispatcherLeaseBoundaryPreviewService.js
node --check scripts\verify-discovery-dispatcher-lease-boundary-preview.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:discovery-dispatcher-lease-boundary-preview
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

Results:

- listed syntax checks passed
- focused Discovery dispatcher/lease boundary preview verifier passed
- service registry verifier passed
- command authority verifier passed
- passive side-effect verifier passed
- enforcement dry-run verifier passed with 128/128 commands covered and no gaps
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git diff -- src/main/db/schema.sql` returned no diff
- `git status --short --branch` showed `main...origin/main` with HS485/HS487/HS489/HS491/HS493 touched files and active workspace runway/review files
- no schema changes were made

Boundary confirmation:

- read-only dispatcher/lease boundary preview only
- no schema changes
- no Discovery pickup execution
- no executable provider packets
- no dispatcher runtime, dispatcher loop, queue runtime, durable queue rows, durable leases, or lease claims
- no provider calls, zKill calls, or ESI calls
- no candidate refs or Discovery ref writes
- no Evidence/EVEidence writes
- no Hydration
- no Observation/reporting behavior
- no Watch cadence mutation
- no Watch bucket status mutation
- no receipt mutation
- no UI
- no actor Watch migration
- no `collectActorWatch(...)` retirement
- no system/radius collector redirect
- no source-term rename or protected-word JSON update

## HS493 Dev Handoff

Completed:

```txt
workspace/DevHS493-discovery-dispatcher-lease-boundary-preview.md
```

Status: ready for Overseer review.

## HS491 Evidence

## HS491 Evidence

Dev updated 2026-06-12:

- Added read-only Discovery pickup execution boundary preview service:

```txt
src/main/services/discoveryPickupExecutionBoundaryPreviewService.js
```

- Added renderer-eligible read-only command:

```txt
discovery.pickup_execution_boundary.preview
```

- Added focused verifier and package script:

```txt
scripts/verify-discovery-pickup-execution-boundary-preview.js
npm.cmd run verify:discovery-pickup-execution-boundary-preview
```

- Registered command metadata / coverage in:

```txt
package.json
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
scripts/verify-enforcement-dry-run.js
```

Focused verifier sample:

```json
{
  "status": "Discovery pickup execution boundary preview verified",
  "command": "discovery.pickup_execution_boundary.preview",
  "external_io_on_summary": {
    "source_route_packet_preview_count": 5,
    "pickup_execution_boundary_packet_count": 5,
    "not_executed_packet_count": 5,
    "one_accepted_system_id_maps_to_one_boundary_packet": true,
    "requires_external_io_open_count": 5,
    "requires_future_dispatcher_ownership_count": 5,
    "requires_future_lease_claim_semantics_count": 5,
    "requires_future_provider_pacing_count": 5,
    "requires_future_zkill_candidate_ref_write_handling_count": 5,
    "excluded_row_count": 4,
    "provider_calls": 0,
    "live_api_calls": 0,
    "zkill_calls": 0,
    "esi_calls": 0,
    "executable_provider_packets_created": 0,
    "pickup_units_created": 0,
    "leases_created": 0,
    "queue_items_created": 0,
    "candidate_refs_written": 0,
    "discovery_refs_written": false,
    "evidence_eveidence_writes": 0,
    "hydration_writes": 0,
    "watch_cadence_mutations": 0,
    "receipt_mutations": 0,
    "watch_bucket_status_mutations": 0,
    "schema_changes": 0
  },
  "external_io_off_summary": {
    "source_route_packet_preview_count": 0,
    "pickup_execution_boundary_packet_count": 0,
    "excluded_row_count": 7,
    "held_excluded_count": 3,
    "provider_calls": 0,
    "zkill_calls": 0,
    "esi_calls": 0
  }
}
```

Behavior proven:

- accepted HS489 provider-route packet previews can be classified at the pre-provider execution boundary
- one accepted included system ID remains one not-executed boundary packet
- route packet identity, Watch/run/bucket/scope/window/cap/provenance/source-selection basis is preserved
- boundary packets are not executed, not executable now, not dispatchable now, and not leased
- boundary packets report future prerequisites: External I/O open, dispatcher ownership, lease/claim semantics, provider pacing, and zKill candidate-ref write handling
- held-by-External-I/O rows do not enter executable packet posture
- malformed/rejected/not-input rows do not enter executable packet posture
- renderer-supplied route previews are not authoritative
- no pickup unit, lease, queue item, dispatcher runtime, provider call, zKill call, ESI call, executable provider packet, candidate ref, Discovery ref, Evidence/EVEidence, Hydration, Observation, Watch cadence, bucket status, receipt, schema, or UI side effect occurs

Verification completed:

```txt
node --check src\main\services\discoveryPickupExecutionBoundaryPreviewService.js
node --check scripts\verify-discovery-pickup-execution-boundary-preview.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:discovery-pickup-execution-boundary-preview
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- listed syntax checks passed
- focused Discovery pickup execution boundary preview verifier passed
- service registry verifier passed
- command authority verifier passed
- passive side-effect verifier passed
- enforcement dry-run verifier passed with 127/127 commands covered and no gaps
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git diff -- src/main/db/schema.sql` returned no diff
- `git status --short --branch` showed `main...origin/main` with HS485/HS487/HS489/HS491 touched files and active workspace runway/review files
- no schema changes were made

Boundary confirmation:

- read-only pickup execution boundary preview only
- no schema changes
- no Discovery pickup execution
- no executable provider packets
- no pickup units, leases, dispatcher runtime, queue runtime, or durable Discovery task rows
- no provider calls, zKill calls, or ESI calls
- no candidate refs or Discovery ref writes
- no Evidence/EVEidence writes
- no Hydration
- no Observation/reporting behavior
- no Watch cadence mutation
- no Watch bucket status mutation
- no receipt mutation
- no UI
- no actor Watch migration
- no `collectActorWatch(...)` retirement
- no system/radius collector redirect
- no source-term rename or protected-word JSON update

## HS491 Dev Handoff

Completed:

```txt
workspace/DevHS491-discovery-pickup-execution-boundary-preview.md
```

Status: ready for Overseer review.

## HS489 Evidence

Dev updated 2026-06-12:

- Added read-only Discovery provider-route packet preview service:

```txt
src/main/services/discoveryProviderRoutePacketPreviewService.js
```

- Added renderer-eligible read-only command:

```txt
discovery.provider_route_packet.preview
```

- Added focused verifier and package script:

```txt
scripts/verify-discovery-provider-route-packet-preview.js
npm.cmd run verify:discovery-provider-route-packet-preview
```

- Registered command metadata / coverage in:

```txt
package.json
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
scripts/verify-enforcement-dry-run.js
```

Focused verifier sample:

```json
{
  "status": "Discovery provider route packet preview verified",
  "command": "discovery.provider_route_packet.preview",
  "external_io_on_summary": {
    "selected_candidate_count": 3,
    "provider_route_packet_preview_count": 5,
    "packet_preview_count": 5,
    "packet_count_by_candidate": [
      {
        "watch_id": 1,
        "accepted_included_system_count": 2,
        "route_packet_preview_count": 2,
        "creates_provider_packets": false,
        "provider_calls": 0,
        "candidate_refs_written": 0
      },
      {
        "watch_id": 2,
        "accepted_included_system_count": 2,
        "route_packet_preview_count": 2,
        "creates_provider_packets": false,
        "provider_calls": 0,
        "candidate_refs_written": 0
      },
      {
        "watch_id": 3,
        "accepted_included_system_count": 1,
        "route_packet_preview_count": 1,
        "creates_provider_packets": false,
        "provider_calls": 0,
        "candidate_refs_written": 0
      }
    ],
    "excluded_row_count": 4,
    "overlapping_watch_scopes_remain_independent": 1,
    "provider_calls": 0,
    "live_api_calls": 0,
    "zkill_calls": 0,
    "esi_calls": 0,
    "pickup_units_created": 0,
    "leases_created": 0,
    "queue_items_created": 0,
    "candidate_refs_written": 0,
    "discovery_refs_written": false,
    "evidence_eveidence_writes": 0,
    "hydration_writes": 0,
    "watch_cadence_mutations": 0,
    "receipt_mutations": 0,
    "watch_bucket_status_mutations": 0,
    "schema_changes": 0
  },
  "external_io_off_summary": {
    "selected_candidate_count": 0,
    "provider_route_packet_preview_count": 0,
    "excluded_row_count": 7,
    "held_excluded_count": 3,
    "provider_calls": 0,
    "zkill_calls": 0,
    "esi_calls": 0
  }
}
```

Behavior proven:

- HS487 selected candidates can become inert zKill provider-route packet previews
- one accepted included system ID yields one preview route packet
- Watch ID, `watch_run_id`, bucket item ID, accepted scope, system ID, window, caps, provenance, and source selection basis are preserved
- center/radius remains provenance/explanation only and not execution authority
- held, rejected, not-input, actor, non-open, and malformed/missing-scope rows do not create route packets
- overlapping Watch scopes remain independent route packet previews
- route packet previews are for later zKill candidate acquisition only, not Evidence expansion and not Hydration
- renderer-supplied selected candidates are not authoritative
- no pickup unit, lease, queue item, dispatcher runtime, provider call, zKill call, ESI call, executable provider packet, candidate ref, Discovery ref, Evidence/EVEidence, Hydration, Observation, Watch cadence, bucket status, receipt, schema, or UI side effect occurs

Verification completed:

```txt
node --check src\main\services\discoveryProviderRoutePacketPreviewService.js
node --check scripts\verify-discovery-provider-route-packet-preview.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:discovery-provider-route-packet-preview
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- listed syntax checks passed
- focused Discovery provider route packet preview verifier passed
- service registry verifier passed
- command authority verifier passed
- passive side-effect verifier passed
- enforcement dry-run verifier passed with 126/126 commands covered and no gaps
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git diff -- src/main/db/schema.sql` returned no diff
- `git status --short --branch` showed `main...origin/main` with HS485/HS487/HS489 touched files and active workspace runway/review files
- no schema changes were made

Boundary confirmation:

- read-only provider-route packet preview only
- no schema changes
- no Discovery pickup execution
- no pickup units, leases, dispatcher runtime, queue runtime, or durable Discovery task rows
- no provider calls, zKill calls, ESI calls, or executable provider packets
- no candidate refs or Discovery ref writes
- no Evidence/EVEidence writes
- no Hydration
- no Observation/reporting behavior
- no Watch cadence mutation
- no Watch bucket status mutation
- no receipt mutation
- no UI
- no actor Watch migration
- no `collectActorWatch(...)` retirement
- no system/radius collector redirect
- no source-term rename or protected-word JSON update

## HS489 Dev Handoff

Completed:

```txt
workspace/DevHS489-discovery-provider-route-packet-preview.md
```

Status: ready for Overseer review.

## HS487 Evidence

Dev updated 2026-06-12:

- Added read-only Discovery pickup selection contract service:

```txt
src/main/services/discoveryPickupSelectionContractService.js
```

- Added renderer-eligible read-only command:

```txt
discovery.pickup_selection_contract.preview
```

- Added focused verifier and package script:

```txt
scripts/verify-discovery-pickup-selection-contract.js
npm.cmd run verify:discovery-pickup-selection-contract
```

- Registered command metadata / coverage in:

```txt
package.json
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
scripts/verify-enforcement-dry-run.js
```

Focused verifier sample:

```json
{
  "status": "Discovery pickup selection contract verified",
  "command": "discovery.pickup_selection_contract.preview",
  "external_io_on_summary": {
    "product_readout_row_count": 7,
    "selected_candidate_count": 3,
    "excluded_row_count": 4,
    "held_excluded_count": 0,
    "rejected_excluded_count": 2,
    "not_input_excluded_count": 2,
    "actor_excluded_count": 1,
    "non_open_excluded_count": 1,
    "malformed_or_missing_scope_excluded_count": 2,
    "independent_overlap_count": 1,
    "pickup_units_created": 0,
    "provider_packets": 0,
    "discovery_pickup_started": false,
    "candidate_refs_written": 0,
    "discovery_refs_written": false,
    "evidence_eveidence_writes": 0,
    "hydration_writes": 0,
    "watch_cadence_mutations": 0,
    "receipt_mutations": 0,
    "watch_bucket_status_mutations": 0
  },
  "external_io_off_summary": {
    "product_readout_row_count": 7,
    "selected_candidate_count": 0,
    "excluded_row_count": 7,
    "held_excluded_count": 3,
    "rejected_excluded_count": 2,
    "not_input_excluded_count": 2,
    "pickup_units_created": 0,
    "provider_packets": 0,
    "discovery_pickup_started": false,
    "candidate_refs_written": 0,
    "discovery_refs_written": false,
    "evidence_eveidence_writes": 0,
    "hydration_writes": 0,
    "watch_cadence_mutations": 0,
    "receipt_mutations": 0,
    "watch_bucket_status_mutations": 0
  }
}
```

Behavior proven:

- eligible product bucket readout rows can become Discovery pickup selection candidates
- selected candidates preserve `bucket_item_id`, Watch identity, `watch_run_id`, accepted scope, scope posture, window, caps, provenance, and provider posture basis
- selected candidates are future Discovery pickup input only
- External I/O off held rows are excluded and not selected
- invalid/rejected rows are excluded and not selected
- actor rows are excluded and not selected
- non-open rows are excluded and not selected
- malformed/missing accepted scope rows are excluded and not selected
- overlapping Watch scopes remain independent selected candidates when both are eligible
- renderer-supplied readout rows are not authoritative
- no pickup unit, lease, queue item, durable Discovery task row, provider packet, candidate ref, Discovery ref, Evidence/EVEidence, Hydration, Observation, Watch cadence, bucket status, receipt, or UI side effect occurs

Verification completed:

```txt
node --check src\main\services\discoveryPickupSelectionContractService.js
node --check scripts\verify-discovery-pickup-selection-contract.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:discovery-pickup-selection-contract
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- listed syntax checks passed
- focused Discovery pickup selection contract verifier passed
- service registry verifier passed
- command authority verifier passed
- passive side-effect verifier passed
- enforcement dry-run verifier passed with 125/125 commands covered and no gaps
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git diff -- src/main/db/schema.sql` returned no diff
- `git status --short --branch` showed `main...origin/main` with HS485/HS487 touched files and the active workspace runway/review files

Boundary confirmation:

- read-only selection contract only
- no schema changes
- no Discovery pickup execution
- no pickup units, leases, dispatcher runtime, queue runtime, or durable Discovery task rows
- no provider packets, zKill calls, or ESI calls
- no candidate refs or Discovery ref writes
- no Evidence/EVEidence writes
- no Hydration
- no Observation/reporting behavior
- no Watch cadence mutation
- no Watch bucket status mutation
- no receipt mutation
- no UI
- no actor Watch migration
- no `collectActorWatch(...)` retirement
- no system/radius collector redirect
- no source-term rename or protected-word JSON update

## HS487 Dev Handoff

Completed:

```txt
workspace/DevHS487-discovery-pickup-selection-contract.md
```

Status: ready for Overseer review.

## HS485 Evidence

Dev updated 2026-06-12:

- Added read-only product Watch bucket pickup readout service:

```txt
src/main/services/watchBucketProductPickupReadoutService.js
```

- Extended product bucket repository read support:

```txt
src/main/db/watchBucketRepository.js
```

- Added renderer-eligible read-only command:

```txt
watch.bucket_product_pickup_readout.preview
```

- Added focused verifier and package script:

```txt
scripts/verify-watch-bucket-product-pickup-readout.js
npm.cmd run verify:watch-bucket-product-pickup-readout
```

- Registered command metadata / coverage in:

```txt
package.json
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
scripts/verify-enforcement-dry-run.js
```

Focused verifier sample:

```json
{
  "status": "Watch bucket product pickup readout verified",
  "command": "watch.bucket_product_pickup_readout.preview",
  "external_io_on_summary": {
    "product_bucket_row_count": 7,
    "open_system_radius_row_count": 5,
    "future_pickup_eligible_count": 3,
    "held_by_external_io_count": 0,
    "rejected_before_pickup_consumption_count": 2,
    "not_pickup_input_count": 2,
    "unsupported_actor_row_count": 1,
    "non_open_row_count": 1,
    "malformed_or_missing_scope_count": 2,
    "provider_packets": 0,
    "discovery_pickup_started": false,
    "candidate_refs_written": 0,
    "evidence_eveidence_writes": 0,
    "hydration_writes": 0,
    "watch_cadence_mutations": 0,
    "receipt_mutations": 0,
    "watch_bucket_status_mutations": 0
  },
  "external_io_off_summary": {
    "future_pickup_eligible_count": 0,
    "held_by_external_io_count": 3,
    "rejected_before_pickup_consumption_count": 2,
    "not_pickup_input_count": 2,
    "provider_packets": 0,
    "discovery_pickup_started": false,
    "candidate_refs_written": 0,
    "evidence_eveidence_writes": 0,
    "hydration_writes": 0,
    "watch_cadence_mutations": 0,
    "receipt_mutations": 0,
    "watch_bucket_status_mutations": 0
  }
}
```

Behavior proven:

- product `watch_bucket_items` rows can be inspected without mutation
- open system/radius rows with valid accepted stored scope classify as `future_pickup_eligible` when External I/O is on
- open system/radius rows with valid accepted stored scope classify as `held_by_external_io` when External I/O is off
- `held_by_external_io` is reported as provider movement posture and is not persisted as bucket lifecycle status or `pickup_posture`
- actor rows classify as `not_pickup_input`
- non-open rows classify as `not_pickup_input`
- malformed/unparseable accepted scope and missing included-system scope classify as `rejected_before_pickup_consumption`
- overlapping valid open rows remain independently visible
- no Discovery pickup starts and no provider packets, leases, queues, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence, receipt, or UI side effects occur

Verification completed:

```txt
node --check src\main\db\watchBucketRepository.js
node --check src\main\services\watchBucketProductPickupReadoutService.js
node --check scripts\verify-watch-bucket-product-pickup-readout.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:watch-bucket-product-pickup-readout
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- listed syntax checks passed
- focused product Watch bucket pickup readout verifier passed
- service registry verifier passed
- command authority verifier passed
- passive side-effect verifier passed
- enforcement dry-run verifier passed with 124/124 commands covered and no gaps
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git diff -- src/main/db/schema.sql` returned no diff
- `git status --short --branch` showed `main...origin/main` with HS485-touched files plus pre-existing workspace/current, workspace/overview, and HS485 runway workspace changes

Boundary confirmation:

- read-only product row inspection only
- no schema changes
- no Watch bucket status mutation
- no receipt mutation
- no Discovery pickup execution
- no leases, dispatcher runtime, or queue runtime
- no provider packets, zKill calls, or ESI calls
- no candidate refs or Discovery ref writes
- no Evidence/EVEidence writes
- no Hydration
- no Observation/reporting behavior
- no Watch cadence mutation
- no UI
- no actor Watch migration
- no `collectActorWatch(...)` retirement
- no system/radius collector redirect
- no source-term rename or protected-word JSON update

## HS485 Dev Handoff

Completed:

```txt
workspace/DevHS485-product-watch-bucket-pickup-readout.md
```

Status: ready for Overseer review.

## HS482 Evidence

Dev updated 2026-06-12:

- Added product Watch bucket schema:

```txt
watch_bucket_items
```

- Added repository / service:

```txt
src/main/db/watchBucketRepository.js
src/main/services/watchBucketProductPersistenceService.js
```

- Added trusted local service command:

```txt
watch.bucket_product_persistence.emit
```

- Added focused verifier and package script:

```txt
scripts/verify-watch-bucket-product-persistence.js
npm.cmd run verify:watch-bucket-product-persistence
```

- Registered command metadata / coverage in:

```txt
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-enforcement-dry-run.js
package.json
```

- Updated migration/schema and compatibility verifier coverage:

```txt
src/main/db/schema.sql
scripts/verify-migrations.js
scripts/verify-watch-bucket-disposable-persistence-fixture.js
scripts/verify-discovery-pickup-consumer-hold-contract.js
```

Schema diff summary:

```txt
CREATE TABLE IF NOT EXISTS watch_bucket_items (
  bucket_item_id TEXT PRIMARY KEY,
  watch_run_id TEXT NOT NULL UNIQUE,
  watch_type TEXT NOT NULL CHECK (watch_type IN ('system_radius', 'actor')),
  watch_id INTEGER NOT NULL,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('watch_system_radius', 'watch_actor')),
  status TEXT NOT NULL CHECK (status IN ('open', 'settled', 'cancelled', 'blocked_integrity')),
  emitted_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  accepted_scope_json TEXT NOT NULL,
  window_json TEXT NOT NULL,
  caps_json TEXT NOT NULL,
  provenance_json TEXT NOT NULL,
  identity_fingerprint TEXT NOT NULL,
  pickup_posture TEXT,
  settled_at TEXT,
  receipt_status TEXT,
  receipt_summary_json TEXT,
  provider_timing_json TEXT,
  last_error_json TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_watch_bucket_items_one_open_per_watch
ON watch_bucket_items(watch_type, watch_id)
WHERE status = 'open';
```

Focused verifier sample:

```json
{
  "status": "Watch bucket product persistence verified",
  "command": "watch.bucket_product_persistence.emit",
  "first_summary": {
    "emission_basis_count": 5,
    "inserted_open_bucket_item_count": 5,
    "idempotent_existing_open_count": 0,
    "integrity_conflict_count": 0,
    "integrity_error_count": 0,
    "open_bucket_item_count": 5,
    "stale_current_open_item_count": 1,
    "catch_up_rows_created": 0,
    "overlapping_open_item_pairs": 10,
    "watch_bucket_items_delta": 5,
    "provider_packets": 0,
    "discovery_pickup_packets_created": 0,
    "candidate_refs_written": 0,
    "evidence_eveidence_writes": 0,
    "watch_cadence_mutations": 0
  },
  "idempotent_summary": {
    "inserted_open_bucket_item_count": 0,
    "idempotent_existing_open_count": 5,
    "watch_bucket_items_delta": 0
  },
  "conflict_summary": {
    "integrity_conflict_count": 1,
    "watch_bucket_items_delta": 0
  },
  "watch_run_id_mismatch_summary": {
    "inserted_open_bucket_item_count": 1,
    "integrity_error_count": 1,
    "watch_bucket_items_delta": 1
  }
}
```

Behavior proven:

- valid due system/radius Watch emission basis creates one open `watch_bucket_items` row
- re-emitting the same Watch while open is idempotent and writes no new row
- same Watch with mismatched open identity produces `integrity_conflict_existing_open_bucket_item`
- same `watch_run_id` with mismatched identity produces `integrity_error_watch_run_id_mismatch`
- overlapping system scopes for different Watches coexist as independent open bucket rows
- stale missed intervals collapse to one current open item and create zero catch-up rows
- External I/O off does not block bucket row creation
- External I/O off creates zero provider packets and zero Discovery refs
- renderer IPC cannot call `watch.bucket_product_persistence.emit`
- service output reports `fetch_runs_as_bucket_state: false`
- service output reports `discovered_killmail_refs_as_bucket_state: false`
- table mutation proof shows only `watch_bucket_items` changes during bucket emission

Verification completed before handoff write:

```txt
node --check src\main\db\watchBucketRepository.js
node --check src\main\services\watchBucketProductPersistenceService.js
node --check scripts\verify-watch-bucket-product-persistence.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-enforcement-dry-run.js
node --check scripts\verify-migrations.js
node --check scripts\verify-watch-bucket-disposable-persistence-fixture.js
node --check scripts\verify-discovery-pickup-consumer-hold-contract.js
npm.cmd run verify:watch-bucket-product-persistence
npm.cmd run verify:migrations
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:watch-bucket-disposable-persistence-fixture
npm.cmd run verify:discovery-pickup-consumer-hold-contract
npm.cmd run verify:db-integrity
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

Results:

- listed syntax checks passed
- focused product Watch bucket persistence verifier passed
- migration verifier passed
- service registry verifier passed
- command authority verifier passed
- passive side-effect verifier passed
- enforcement dry-run verifier passed with 123/123 commands covered and no gaps
- previous disposable fixture and Discovery pickup hold contract verifiers passed after updating their schema-era assertions to reject disposable fixture schema leakage, not the new product table
- database integrity verifier passed
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git diff -- src/main/db/schema.sql` showed only `watch_bucket_items` table/index additions
- `git status --short --branch` showed branch `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS482-touched files

Boundary confirmation:

- system/radius only
- actor Watch migration remains parked
- no `collectActorWatch(...)` retirement
- no system/radius collector redirect
- no Discovery pickup execution
- no provider packets, zKill calls, or ESI calls
- no candidate refs or Discovery ref writes
- no Evidence/EVEidence writes
- no Hydration, Observation/reporting behavior, Watch cadence mutation, lease, dispatcher runtime, broad queue behavior, runtime enforcement, command blocking, UI, source-term rename, or protected-word JSON update
- `held_by_external_io` is not persisted as a bucket lifecycle status
- bucket rows are authored only by trusted local service logic, not renderer IPC

## HS482 Dev Handoff

Completed:

```txt
workspace/DevHS482-product-watch-bucket-persistence.md
```

Status: ready for Overseer review.

## HS478 Evidence

Dev updated 2026-06-12:

- Added fixture-only Discovery pickup consumer hold contract proof command:

```txt
discovery.pickup_consumer_hold_contract.preview
```

- Added implementation:

```txt
src/main/services/discoveryPickupConsumerHoldContractService.js
```

- Added focused verifier and package script:

```txt
scripts/verify-discovery-pickup-consumer-hold-contract.js
npm.cmd run verify:discovery-pickup-consumer-hold-contract
```

- Registered command metadata / coverage in:

```txt
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
scripts/verify-enforcement-dry-run.js
package.json
```

Contract proof shape:

```txt
pickup_contract_rows
future_pickup_eligible_rows
held_by_external_io_rows
rejected_before_pickup_consumption_rows
independent_overlap_rows
boundary_table_check
```

Focused verifier sample:

```json
{
  "status": "Discovery pickup consumer hold contract verified",
  "command": "discovery.pickup_consumer_hold_contract.preview",
  "external_io_on_summary": {
    "disposable_open_row_count": 5,
    "contract_row_count": 12,
    "future_pickup_eligible_count": 5,
    "held_by_external_io_count": 0,
    "duplicate_idempotent_result_count": 1,
    "integrity_conflict_or_error_count": 2,
    "rejected_source_row_count": 4,
    "rejected_before_pickup_consumption_count": 7,
    "independent_overlap_count": 10,
    "provider_packets": 0,
    "discovery_pickup_started": false,
    "discovery_pickup_packets_created": 0,
    "leases_created": 0,
    "queue_items_created": 0,
    "candidate_refs_written": 0,
    "evidence_eveidence_writes": 0,
    "watch_cadence_mutations": 0
  },
  "external_io_off_summary": {
    "disposable_open_row_count": 5,
    "contract_row_count": 12,
    "future_pickup_eligible_count": 0,
    "held_by_external_io_count": 5,
    "duplicate_idempotent_result_count": 1,
    "integrity_conflict_or_error_count": 2,
    "rejected_source_row_count": 4,
    "rejected_before_pickup_consumption_count": 7,
    "independent_overlap_count": 10,
    "provider_packets": 0,
    "discovery_pickup_started": false,
    "discovery_pickup_packets_created": 0,
    "leases_created": 0,
    "queue_items_created": 0,
    "candidate_refs_written": 0,
    "evidence_eveidence_writes": 0,
    "watch_cadence_mutations": 0
  }
}
```

Behavior proven:

- open disposable fixture row with External I/O on reports `future_pickup_eligible` while pickup remains unstarted
- open disposable fixture row with External I/O off reports `held_by_external_io` as provider movement hold only
- duplicate/idempotent persistence result reports `not_pickup_input_duplicate_idempotent_result` and creates no pickup unit
- integrity conflict, integrity error, and rejected source rows report `rejected_before_pickup_consumption`
- overlapping open rows from different Watches remain independent pickup candidates or holds
- provider packet count remains zero
- Discovery pickup started remains false
- lease/queue/dispatcher behavior remains false
- candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence, and product tables remain untouched

Verification completed before handoff write:

```txt
node --check src\main\services\discoveryPickupConsumerHoldContractService.js
node --check scripts\verify-discovery-pickup-consumer-hold-contract.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:discovery-pickup-consumer-hold-contract
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

Results:

- listed syntax checks passed
- focused Discovery pickup consumer hold contract verifier passed
- service registry verifier passed
- command authority verifier passed
- passive side-effect verifier passed
- enforcement dry-run verifier passed with 122/122 commands covered and no gaps
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git diff -- src/main/db/schema.sql` returned no diff
- `git status --short --branch` showed branch `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS478-touched files

Boundary confirmation:

- fixture/contract only
- no update to `src/main/db/schema.sql`
- no operator corpus mutation
- no production bucket consumption
- no Discovery pickup start
- no provider packets
- no lease / queue / dispatcher runtime
- no candidate refs / Discovery refs
- no Evidence/EVEidence writes
- no Hydration, Observation, Watch cadence mutation, runtime enforcement, command blocking, UI, source-term rename, or protected-word JSON update
- `held_by_external_io` remains provider movement hold, not Watch failure or persisted bucket status

## HS478 Dev Handoff

Completed:

```txt
workspace/DevHS478-discovery-pickup-consumer-hold-contract.md
```

Status: ready for Overseer review.

## HS476 Evidence

Dev updated 2026-06-12:

- Added fixture-only disposable persistence proof command:

```txt
watch.bucket_disposable_persistence_fixture.preview
```

- Added implementation:

```txt
src/main/services/watchBucketDisposablePersistenceFixtureService.js
```

- Added focused verifier and package script:

```txt
scripts/verify-watch-bucket-disposable-persistence-fixture.js
npm.cmd run verify:watch-bucket-disposable-persistence-fixture
```

- Registered command metadata / coverage in:

```txt
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
scripts/verify-enforcement-dry-run.js
package.json
```

Disposable proof shape:

```txt
disposable_fixture_rows
persistence_results
overlapping_fixture_rows
boundary_table_check
```

Focused verifier sample:

```json
{
  "status": "Watch bucket disposable persistence fixture verified",
  "command": "watch.bucket_disposable_persistence_fixture.preview",
  "summary": {
    "attempted_candidate_count": 8,
    "rejected_source_row_count": 4,
    "disposable_open_row_count": 5,
    "inserted_count": 5,
    "idempotent_noop_count": 1,
    "integrity_conflict_count": 1,
    "integrity_error_count": 1,
    "rejected_before_persistence_count": 4,
    "stale_current_open_row_count": 1,
    "catch_up_rows_created": 0,
    "overlapping_open_row_pairs": 10,
    "provider_packets": 0,
    "discovery_pickup_packets_created": 0,
    "candidate_refs_written": 0,
    "evidence_eveidence_writes": 0,
    "watch_cadence_mutations": 0
  }
}
```

Behavior proven:

- inserting one valid projected candidate creates one open disposable fixture row
- inserting same Watch / same open identity again is idempotent and leaves one open row
- inserting same Watch / different open identity reports integrity conflict and no second open row
- inserting same `watch_run_id` with mismatched scope/provenance reports integrity error and rolls back inside disposable fixture
- stale missed intervals create one current open row and zero catch-up rows
- overlapping system scopes for different Watch IDs coexist and shared systems do not merge identity
- External I/O off does not block disposable row persistence and creates zero provider packets / no Discovery pickup
- invalid, not-due, inactive, and backoff source rows persist no disposable rows
- boundary table check shows no `fetch_runs`, `discovered_killmail_refs`, `killmails`, `activity_events`, `api_request_logs`, warnings, or Watch cadence rows mutated

Verification completed before handoff write:

```txt
node --check src\main\services\watchBucketDisposablePersistenceFixtureService.js
node --check scripts\verify-watch-bucket-disposable-persistence-fixture.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:watch-bucket-disposable-persistence-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- listed syntax checks passed
- focused disposable persistence fixture verifier passed
- service registry verifier passed
- command authority verifier passed
- passive side-effect verifier passed
- enforcement dry-run verifier passed with 121/121 commands covered and no gaps

Boundary confirmation:

- fixture/disposable only
- no update to `src/main/db/schema.sql`
- no product schema or durable bucket rows
- no operator corpus mutation
- no provider calls
- no Discovery pickup
- no candidate refs / Discovery refs
- no Evidence/EVEidence writes
- no Hydration, Observation, dispatcher, queue, lease, enforcement, UI, source-term rename, or protected-word JSON update
- reports `fetch_runs_as_bucket_state: false`
- reports `discovered_killmail_refs_as_bucket_state: false`

## HS476 Dev Handoff

Completed:

```txt
workspace/DevHS476-watch-bucket-disposable-persistence-fixture.md
```

Status: ready for Overseer review.

## HS472 Evidence

Dev updated 2026-06-12:

- Added read-only fixture/projection command:

```txt
watch.bucket_pickup_posture_bridge.preview
```

- Added implementation:

```txt
src/main/services/watchBucketPickupPostureBridgeService.js
```

- Added focused verifier and package script:

```txt
scripts/verify-watch-bucket-pickup-posture-bridge.js
npm.cmd run verify:watch-bucket-pickup-posture-bridge
```

- Registered command metadata / coverage in:

```txt
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
scripts/verify-enforcement-dry-run.js
package.json
```

Projection shape proven:

```txt
pickup_posture_rows
future_pickup_eligible_candidates
held_by_external_io_candidates
rejected_before_pickup_rows
independent_overlap_posture
```

Focused verifier sample:

```json
{
  "status": "Watch bucket pickup posture bridge verified",
  "command": "watch.bucket_pickup_posture_bridge.preview",
  "external_io_on_summary": {
    "projected_candidate_fixture_count": 5,
    "pickup_posture_row_count": 13,
    "future_pickup_eligible_count": 5,
    "held_by_external_io_count": 0,
    "rejected_before_pickup_count": 8,
    "provider_packets": 0,
    "discovery_pickup_packets_created": 0,
    "bucket_rows_persisted": 0,
    "writes": 0
  },
  "external_io_off_summary": {
    "projected_candidate_fixture_count": 5,
    "pickup_posture_row_count": 13,
    "future_pickup_eligible_count": 0,
    "held_by_external_io_count": 5,
    "rejected_before_pickup_count": 8,
    "provider_packets": 0,
    "discovery_pickup_packets_created": 0,
    "bucket_rows_persisted": 0,
    "writes": 0
  }
}
```

Behavior proven:

- fixture projected candidate with External I/O on reports `future_pickup_eligible` but does not start pickup
- fixture projected candidate with External I/O off reports `held_by_external_io` as provider movement hold, not Watch emission failure
- duplicate-open suppression and no-candidate rows from HS470 do not become pickup eligible
- integrity conflict and integrity error rows do not become pickup eligible
- overlapping candidates from different Watches remain independently eligible/held
- provider packet count remains zero
- Discovery pickup started remains false
- bucket rows persisted remains zero
- candidate refs, Evidence/EVEidence, Hydration, Observation, dispatcher, queue, lease, enforcement, and UI remain untouched

Verification completed before handoff write:

```txt
node --check src\main\services\watchBucketPickupPostureBridgeService.js
node --check scripts\verify-watch-bucket-pickup-posture-bridge.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:watch-bucket-pickup-posture-bridge
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- listed syntax checks passed
- focused Watch bucket pickup posture bridge verifier passed
- service registry verifier passed
- command authority verifier passed
- passive side-effect verifier passed
- enforcement dry-run verifier passed with 120/120 commands covered and no gaps

Boundary confirmation:

- read-only fixture/projection bridge only
- projected candidates are fixture input only
- no schema
- no durable bucket rows
- no Watch row or cadence mutation
- no `fetch_runs` as bucket state
- no `discovered_killmail_refs` as pre-acquisition Watch bucket state
- no Watch executor tick, TaskRunner, collectors, Discovery pickup, zKill, ESI, Evidence writer, Hydration, Observation, dispatcher, queue, lease, enforcement, UI, provider calls, candidate refs, Discovery refs, Evidence/EVEidence writes, source-term rename, or protected-word JSON update

## HS472 Dev Handoff

Completed:

```txt
workspace/DevHS472-watch-bucket-pickup-posture-bridge.md
```

Status: ready for Overseer review.

## HS470 Evidence

Dev updated 2026-06-12:

- Added read-only fixture/projection command:

```txt
watch.bucket_identity_projection.preview
```

- Added implementation:

```txt
src/main/services/watchBucketIdentityProjectionService.js
```

- Added focused verifier and package script:

```txt
scripts/verify-watch-bucket-identity-projection.js
npm.cmd run verify:watch-bucket-identity-projection
```

- Registered command metadata / coverage in:

```txt
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
scripts/verify-enforcement-dry-run.js
package.json
```

Projection shape proven:

```txt
projected_bucket_candidates
duplicate_open_suppressions
allowed_overlaps
integrity_conflicts
integrity_errors
rejected_stubs
candidate_ref_killmail_overlap_principle
```

Focused verifier sample:

```json
{
  "status": "Watch bucket identity projection verified",
  "command": "watch.bucket_identity_projection.preview",
  "summary": {
    "input_stub_count": 12,
    "existing_open_stub_fixture_count": 3,
    "projected_bucket_candidate_count": 5,
    "duplicate_open_suppression_count": 1,
    "allowed_overlap_count": 10,
    "integrity_conflict_count": 1,
    "integrity_error_count": 2,
    "rejected_stub_count": 4,
    "provider_packets": 0,
    "discovery_pickup_packets_created": 0,
    "bucket_rows_persisted": 0,
    "writes": 0
  },
  "external_io_posture": {
    "state": "off",
    "watch_bucket_candidate_projection_blocked": false,
    "external_io_is_provider_movement_gate": true,
    "provider_packets": 0,
    "discovery_pickup_started": false
  }
}
```

Behavior proven:

- due valid system/radius Watch with no existing open stub emits one projected candidate
- due valid system/radius Watch with existing open stub for same Watch emits no candidate and reports duplicate-open suppression
- stale Watch with multiple missed intervals emits one current candidate only and zero catch-up candidates
- overlapping included systems across different Watches are allowed
- same Watch with mismatched existing open scope/provenance flags integrity conflict
- same `watch_run_id` with mismatched Watch/scope/window/provenance flags integrity error
- External I/O closed still allows Watch bucket candidate projection while provider packets remain zero and Discovery pickup is not started
- invalid stored scope emits no candidate
- not-due, inactive, and backoff stubs emit no candidate
- candidate-ref / killmail overlap remains principle-only with no writes and no provenance-table claim

Verification completed before handoff write:

```txt
node --check src\main\services\watchBucketIdentityProjectionService.js
node --check scripts\verify-watch-bucket-identity-projection.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:watch-bucket-identity-projection
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- listed syntax checks passed
- focused Watch bucket identity projection verifier passed
- service registry verifier passed
- command authority verifier passed
- passive side-effect verifier passed
- enforcement dry-run verifier passed with 119/119 commands covered and no gaps

Boundary confirmation:

- read-only fixture/projection only
- existing-open state is fixture input only
- no schema
- no durable bucket rows
- no Watch row or cadence mutation
- no `fetch_runs` as bucket state
- no `discovered_killmail_refs` as pre-acquisition Watch bucket state
- no Watch executor tick, TaskRunner, collectors, Discovery pickup, zKill, ESI, Evidence writer, Hydration, Observation, dispatcher, queue, lease, enforcement, UI, provider calls, Discovery refs, Evidence/EVEidence writes, source-term rename, or protected-word JSON update

## HS470 Dev Handoff

Completed:

```txt
workspace/DevHS470-watch-bucket-identity-projection.md
```

Status: ready for Overseer review.

## HS463 Evidence

Dev updated 2026-06-12:

- Added read-only/no-provider service command:

```txt
watch.system_radius_run_stub.preview
```

- Added implementation:

```txt
src/main/services/watchSystemRadiusRunStubService.js
```

- Added focused verifier and package script:

```txt
scripts/verify-watch-system-radius-run-stub.js
npm.cmd run verify:watch-system-radius-run-stub
```

- Registered command metadata / coverage in:

```txt
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
scripts/verify-enforcement-dry-run.js
package.json
```

Stub shape proven:

```txt
watch_run_stub.watch_id
watch_run_stub.watch_run_id
watch_run_stub.source_kind: watch_system_radius
watch_run_stub.accepted_scope.execution_authority: stored_included_system_ids
watch_run_stub.accepted_scope.included_system_ids
watch_run_stub.accepted_scope.center_radius_is_provenance_only: true
watch_run_stub.window.lookback_seconds / due_at / emitted_at
watch_run_stub.caps.max_systems / max_refs_per_system / max_expansions
watch_run_stub.provenance.source_intent: Watch/system-radius
watch_run_stub.boundary_flags.bucket_row_created: false
watch_run_stub.boundary_flags.discovery_pickup_started: false
watch_run_stub.boundary_flags.evidence_or_eveidence: false
watch_run_stub.boundary_flags.observation: false
```

Focused verifier sample:

```json
{
  "status": "System/radius Watch-run stub preview verified",
  "command": "watch.system_radius_run_stub.preview",
  "summary": {
    "system_radius_watch_count": 5,
    "due_system_radius_watch_count": 2,
    "valid_stub_count": 1,
    "emitted_stub_count": 1,
    "invalid_stored_scope_count": 1,
    "provider_calls": 0,
    "live_api_calls": 0,
    "writes": 0,
    "bucket_rows_created": 0,
    "discovery_pickup_packets_created": 0,
    "watch_mutations": 0,
    "parked_tension_resolved": false
  }
}
```

Behavior proven:

- accepted stored `included_system_ids` are execution authority
- center/radius remain provenance and explanation only
- one eligible due system/radius Watch emits one deterministic fixture stub
- invalid stored scope emits no stub and reports `watch_scope_authority_invalid`
- invalid parseable IDs remain diagnostic-only
- disarmed, inactive, not-due, backoff, and live-gate-waiting rows emit no valid stub
- the stub is candidate input for later bucket or Discovery pickup behavior
- the stub is not a bucket, Discovery pickup, Discovery ref, Evidence/EVEidence, Hydration, provider execution, or Observation
- parked External I/O bucket eligibility tension is reported but not resolved

Verification completed before handoff write:

```txt
node --check src\main\services\watchSystemRadiusRunStubService.js
node --check scripts\verify-watch-system-radius-run-stub.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:watch-system-radius-run-stub
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- listed syntax checks passed
- focused Watch-run stub verifier passed
- service registry verifier passed
- command authority verifier passed
- passive side-effect verifier passed
- enforcement dry-run verifier passed with 118/118 commands covered and no gaps

Boundary confirmation:

- read-only/no-provider Watch-run stub projection only
- no durable bucket rows
- no product Watch run rows
- no `WatchSessionExecutor.tick(...)`
- no Watch dispatch
- no `TaskRunner`
- no old collector invocation
- no zKillboard, ESI, or provider call
- no `discovered_killmail_refs` write
- no Evidence/EVEidence write
- no Hydration or metadata write
- no API log or warning write
- no Watch row or cadence mutation
- no Discovery outcome decision or receipt handling
- no dispatcher, queue, lease, retry, or External I/O policy implementation
- no schema, runtime behavior, collector retirement, actor Watch behavior, UI, storage enforcement, source-term, or protected-word change

## HS463 Dev Handoff

Completed:

```txt
workspace/DevHS463-system-radius-watch-run-stub-projection.md
```

Status: ready for Overseer review.

## HS461 Evidence

Dev updated 2026-06-12:

- Corrected stale scheduled actor Watch readout in:

```txt
src/main/discovery/actorWatchTransportFailureParityProof.js
scripts/verify-watch-actor-transport-failure-parity.js
```

- Removed active proof/verifier use of:

```txt
scheduled_actor_watch_legacy_parked
```

- Replaced it with current runtime posture:

```txt
scheduled_actor_watch_current_runner: runScheduledActorWatch
scheduled_actor_watch_runner_call_target: runActorWatchDirectBody
collectActorWatch_status: legacy_compatibility_available_retirement_candidate
```

- Updated source-boundary assertions to require:

```txt
runActorWatchService -> runActorWatchDirectBody
watchExecutor.dispatchFor(actor) -> runScheduledActorWatch
runScheduledActorWatch -> runActorWatchDirectBody
```

Verification completed before handoff write:

```txt
node --check src\main\discovery\actorWatchTransportFailureParityProof.js
node --check scripts\verify-watch-actor-transport-failure-parity.js
npm.cmd run verify:watch-actor-transport-failure-parity
rg -n "scheduled_actor_watch_legacy_parked|scheduled actor Watch should remain parked|runner: collectActorWatch|pre-HS446 legacy" src\main\discovery\actorWatchTransportFailureParityProof.js scripts\verify-watch-actor-transport-failure-parity.js
```

Results:

- listed syntax checks passed
- transport/failure parity verifier passed
- focused stale scan returned no matches in the active target files
- verifier sample reports `scheduled_actor_watch_current_runner: runScheduledActorWatch`
- verifier sample reports `scheduled_actor_watch_runner_call_target: runActorWatchDirectBody`
- verifier sample reports `collectActorWatch_status: legacy_compatibility_available_retirement_candidate`

Boundary confirmation:

- readout/assertion correction only
- no production actor Watch runtime change
- no `collectActorWatch(...)` retirement, deletion, import, or invocation
- no live actor Watch runner change
- no broad verifier seed-path migration
- no provider behavior change
- no live/provider calls
- no Watch cadence, scheduling, backoff, bucket, or completion behavior change
- no Discovery handling/recovery behavior change
- no Evidence/EVEidence behavior change
- no Hydration, Observation, Assessment, storage, schema, dispatcher, queue, lease, enforcement, UI, source-term, or protected-word change

## HS461 Dev Handoff

Completed:

```txt
workspace/DevHS461-transport-failure-parity-stale-scheduled-readout-correction.md
```

Status: ready for Overseer review.

## HS459 Evidence

Dev updated 2026-06-12:

- Corrected stale runtime compatibility preview readout in:

```txt
src/main/services/watchActorCompatibilityWrapperRuntimePreviewService.js
scripts/verify-watch-actor-compatibility-wrapper-runtime-preview.js
```

- Corrected the same stale current-path claim in the touched contract surface:

```txt
src/main/services/watchActorCompatibilityWrapperContractService.js
scripts/verify-watch-actor-compatibility-wrapper-contract.js
```

- Updated service registry assertions in:

```txt
scripts/verify-service-registry.js
```

Runtime preview now reports:

```txt
existing_runtime_preserved.actor_watch_runtime_entry_point: runActorWatchService
existing_runtime_preserved.runActorWatchService_current_call_target: runActorWatchDirectBody
existing_runtime_preserved.scheduled_actor_watch_dispatch_command: actor.watch
existing_runtime_preserved.scheduled_actor_watch_current_runner: runScheduledActorWatch
existing_runtime_preserved.scheduled_actor_watch_runner_call_target: runActorWatchDirectBody
existing_runtime_preserved.collectActorWatch_status: legacy_compatibility_available_retirement_candidate
```

Contract proof now reports:

```txt
direct_command_path_basis.current_path includes:
  runActorWatchDirectBody(input, { ...dependencies, db })

scheduled_dispatch_path_basis.current_runner: runScheduledActorWatch
scheduled_dispatch_path_basis.runner_call_target: runActorWatchDirectBody
scheduled_dispatch_path_basis.collectActorWatch_status: legacy_compatibility_available_retirement_candidate
```

Verification completed before handoff write:

```txt
node --check src\main\services\watchActorCompatibilityWrapperRuntimePreviewService.js
node --check src\main\services\watchActorCompatibilityWrapperContractService.js
node --check scripts\verify-watch-actor-compatibility-wrapper-runtime-preview.js
node --check scripts\verify-watch-actor-compatibility-wrapper-contract.js
node --check scripts\verify-service-registry.js
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
npm.cmd run verify:service-registry
git diff --check
git status --short --branch
```

Results:

- all listed syntax checks passed
- runtime compatibility wrapper preview verifier passed
- compatibility wrapper contract verifier passed
- service registry verifier passed
- `git diff --check` passed with CRLF normalization warnings only
- `git status --short --branch` showed branch `main...origin/main [ahead 19]` with the existing broad uncommitted/untracked milestone stack plus HS459 changes

Deferred stale references:

```txt
src/main/discovery/actorWatchTransportFailureParityProof.js
scripts/verify-watch-actor-transport-failure-parity.js
```

These still expose/assert `scheduled_actor_watch_legacy_parked`. They were not changed because HS459 targeted compatibility-wrapper readout/assertion cleanup and explicitly avoided broad verifier migration.

Boundary confirmation:

- stale compatibility readout/assertion correction only
- no `collectActorWatch(...)` retirement or deletion
- no provider behavior change
- no live/provider calls
- no Watch cadence, scheduling, backoff, or bucket behavior change
- no Discovery handling/recovery behavior change
- no Evidence/EVEidence behavior change
- no Hydration, Observation, Assessment, storage, schema, dispatcher, queue, lease, enforcement, UI, source-term, or protected-word change
- no broad verifier seed-path migration
- no live actor Watch runner replacement

## HS459 Dev Handoff

Completed:

```txt
workspace/DevHS459-stale-actor-watch-compatibility-readout-correction.md
```

Status: ready for Overseer review.

## HS452 Evidence

Dev updated 2026-06-12:

- Added read-only / fixture-only service:

```txt
src/main/services/watchActorDiscoveryHandoffContractService.js
```

- Registered command:

```txt
watch.actor_discovery_handoff_contract.preview
```

- Added focused verifier:

```txt
scripts/verify-watch-actor-discovery-handoff-contract.js
npm.cmd run verify:watch-actor-discovery-handoff-contract
```

- Registered command metadata / coverage in:

```txt
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
package.json
```

Projection shape proven:

```txt
actor_watch_discovery_request
actor_watch_discovery_receipt
```

Direct projection:

```txt
caller: runActorWatchService -> runActorWatchDirectBody
request.source: direct_actor_watch
request.model: actor_watch_discovery_request
receipt.model: actor_watch_discovery_receipt
receipt.outcome.code: complete_refs_found
```

Scheduled projection:

```txt
caller: WatchSessionExecutor.tick -> dispatchFor(actor) -> runScheduledActorWatch -> runActorWatchDirectBody
request.source: scheduled_actor_watch
request.model: actor_watch_discovery_request
receipt.model: actor_watch_discovery_receipt
receipt.outcome.code: complete_refs_found
```

Compatibility posture:

```txt
compatibility_posture.field_count: 22
compatibility_posture.field_parity.matches: true
contract_projection_shape.compatibility_summary_nested: true
contract_projection_shape.compatibility_summary_is_future_contract: false
```

Focused verifier sample:

```json
{
  "status": "Actor Watch / Discovery handoff contract projection verified",
  "action": "watch.actor_discovery_handoff_contract.preview",
  "request_models": [
    "actor_watch_discovery_request",
    "actor_watch_discovery_request"
  ],
  "receipt_models": [
    "actor_watch_discovery_receipt",
    "actor_watch_discovery_receipt"
  ],
  "direct_source": "direct_actor_watch",
  "scheduled_source": "scheduled_actor_watch",
  "compatibility_field_count": 22,
  "direct_outcome": "complete_refs_found",
  "scheduled_outcome": "complete_refs_found",
  "operator_corpus_unchanged": true
}
```

Verification completed before handoff write:

```txt
node --check src\main\services\watchActorDiscoveryHandoffContractService.js
node --check scripts\verify-watch-actor-discovery-handoff-contract.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
npm.cmd run verify:watch-actor-discovery-handoff-contract
npm.cmd run verify:watch-actor-scheduled-redirect
npm.cmd run verify:watch-actor-direct-redirect
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
npm.cmd run verify:watch-executor
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- all listed syntax checks passed
- focused HS452 handoff contract verifier passed
- scheduled actor Watch redirect verifier passed
- direct actor.watch redirect verifier passed
- production-like fake-client direct proof verifier passed
- watch executor verifier passed
- service registry, command authority, passive side-effects, and enforcement dry-run verifiers passed
- `npm.cmd run verify:enforcement-dry-run` remained complete: 117 commands covered, 0 gaps

Boundary confirmation:

- read-only command surface only
- fixture/fake-client proof basis only
- no live/provider calls
- no operator corpus writes
- no Discovery ref writes
- no Evidence/EVEidence writes
- no Hydration writes
- no Watch execution, dispatch, task creation, or Watch mutation
- no runtime behavior change
- no direct actor.watch redirect by this proof
- no scheduled actor Watch redirect by this proof
- no `collectActorWatch(...)` retirement
- no system/radius Watch redirect
- no schema, durable receipt/task/packet persistence, dispatcher/queue/lease behavior, runtime enforcement, command blocking, renderer UI, source-term rename, or protected-word JSON update

## HS452 Dev Handoff

Completed:

```txt
workspace/DevHS452-actor-watch-discovery-handoff-contract-projection.md
```

Status: accepted by HS453.

## HS448 Evidence

Dev updated 2026-06-12:

- Corrected stale HS433 production-like fake-client direct proof/verifier readout in:

```txt
src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js
scripts/verify-watch-actor-production-like-fake-client-direct-proof.js
```

- Removed the stale scheduled runtime claim:

```txt
scheduled_actor_watch_legacy_parked: true
scheduled actor Watch should remain parked on legacy collector during HS433
```

- Replaced it with explicit post-HS440 / post-HS446 runtime posture:

```txt
production_direct_redirect_status.actor_watch_redirected_after_hs440: true
production_direct_redirect_status.runActorWatchService_call_target: runActorWatchDirectBody
scheduled_runtime_status.scheduled_actor_watch_redirected_after_hs446: true
scheduled_runtime_status.current_runner: runScheduledActorWatch
scheduled_runtime_status.legacy_collectActorWatch_still_available: true
scheduled_runtime_status.system_radius_current_runner: collectSystemRadiusWatch
```

- Preserved the proof's own no-runtime-movement posture:

```txt
production_actor_watch_redirected: false
runActorWatchService_production_call_target_changed: false
watchExecutor_dispatchFor_changed: false
non_invocation_proof.scheduled_actor_watch_redirected_by_this_proof: false
```

- Preserved fake-client proof purpose:
  - fixture-owned DBs only
  - injected fake clients only
  - no live/provider calls
  - no operator corpus mutation
  - fake zKill/ESI invocation posture
  - synthetic fixture API-count posture disclosed
  - no claim of HttpClient logging parity
  - 22-field compatibility summary parity enforced

Verification completed before handoff write:

```txt
node --check scripts\verify-watch-actor-production-like-fake-client-direct-proof.js
node --check src\main\discovery\actorWatchProductionLikeFakeClientDirectProof.js
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
npm.cmd run verify:watch-actor-scheduled-redirect
npm.cmd run verify:watch-actor-direct-redirect
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-transport-failure-parity
npm.cmd run verify:watch-executor
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- listed syntax checks passed
- corrected production-like fake-client proof verifier passed
- scheduled actor Watch redirect verifier passed
- direct actor Watch redirect verifier passed
- controlled-adapter return-path verifier passed
- transport/failure parity verifier passed
- watch executor verifier passed
- service registry, command authority, passive side-effects, and enforcement dry-run verifiers passed
- `npm.cmd run verify:service-registry` passed with a 300 second ceiling
- `npm.cmd run verify:enforcement-dry-run` remained complete: 116 commands covered, 0 gaps

Boundary confirmation:

- proof/verifier correction only
- no runtime behavior change
- no scheduled actor Watch redirect change
- no direct actor Watch change
- no `WatchSessionExecutor.tick(...)`, `TaskRunner`, or `recordWatchRunResult(...)` redesign
- no `collectActorWatch(...)` retirement
- no system/radius Watch redirect
- no live/provider calls
- no schema, dispatcher/queue/lease, Hydration, Observation/report, Assessment, runtime enforcement, command blocking, renderer UI, source-term rename, or protected-word JSON update

## HS448 Dev Handoff

Completed:

```txt
workspace/DevHS448-production-like-fake-client-verifier-post-hs446-correction.md
```

Status: accepted by HS449.

## HS446 Evidence

Dev updated 2026-06-12:

- Redirected only scheduled actor Watch from the legacy mixed collector runner to the boundary-owned actor Watch route.
- Direct actor Watch remains the HS440 route:

```txt
serviceRegistry -> runActorWatchService(...) -> runActorWatchDirectBody(...)
```

- Scheduled actor Watch now routes:

```txt
watchExecutor.dispatchFor(actor)
-> command: actor.watch
-> runner: runScheduledActorWatch
-> runActorWatchDirectBody(...)
```

- Added thin scheduled wrapper:

```txt
runScheduledActorWatch(payload, dependencies) -> runActorWatchDirectBody(payload, dependencies)
```

- Preserved `WatchSessionExecutor.tick(...)`, `TaskRunner`, `recordWatchRunResult(...)`, `actionGate(dispatch.command, dispatch.payload)`, task classification, `taskContext.signal` propagation, and scheduled result wrapping.
- Scheduled success result remains:

```txt
{ status: 'succeeded', data: { watch, collection } }
```

- `data.collection` remains the accepted 22-field actor Watch compatibility summary.
- System/radius Watch remains legacy:

```txt
runner: collectSystemRadiusWatch
```

- `collectActorWatch(...)` remains available in `actorWatchCollector.js` but is no longer used by direct or scheduled actor Watch runtime.
- Added focused verifier:

```txt
scripts/verify-watch-actor-scheduled-redirect.js
npm.cmd run verify:watch-actor-scheduled-redirect
```

Focused verifier proves:

- due actor Watch dispatches through `runScheduledActorWatch`
- `watchExecutor.dispatchFor(actor)` no longer uses `runner: collectActorWatch`
- system/radius still uses `collectSystemRadiusWatch`
- direct `actor.watch` remains the HS440 direct body path
- `collectActorWatch(...)` remains available but unused by direct/scheduled actor Watch runtime
- task classification remains `evidence-creating`
- success task result includes selected `watch`
- success task result places the 22-field summary under `data.collection`
- success updates `last_success_at`, clears `last_error_at`, and sets `next_poll_at`
- timeout-style failure updates `last_error_at`, `backoff_until`, and `next_poll_at`
- fake `fetchImpl` drives zKill and ESI through real `HttpClient`
- API logs flow through `HttpClient -> EvidenceRepository.insertApiRequestLog(...)`
- no live provider calls occur

Verification completed before handoff write:

```txt
node --check src\main\watchlist\watchExecutor.js
node --check src\main\discovery\actorWatchDirectBody.js
node --check scripts\verify-watch-actor-scheduled-redirect.js
node --check scripts\verify-watch-actor-direct-redirect.js
node --check scripts\verify-watch-actor-transport-failure-parity.js
node --check scripts\verify-watch-actor-controlled-adapter-return-path.js
npm.cmd run verify:watch-actor-scheduled-redirect
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-actor-direct-redirect
npm.cmd run verify:watch-actor-transport-failure-parity
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- listed syntax checks passed
- focused HS446 scheduled redirect verifier passed
- watch executor verifier passed
- direct actor.watch redirect verifier passed after post-HS446 source-boundary assertion refresh
- transport/failure parity verifier passed after post-HS446 source-boundary assertion refresh
- controlled-adapter return-path verifier passed after post-HS446 scheduled runtime readout refresh
- service registry, command authority, passive side-effects, and enforcement dry-run verifiers passed
- `npm.cmd run verify:service-registry` passed with a 300 second ceiling
- `npm.cmd run verify:enforcement-dry-run` remained complete: 116 commands covered, 0 gaps

Source-boundary sweep:

```txt
rg -n "collectActorWatch|runScheduledActorWatch|runActorWatchDirectBody|collectSystemRadiusWatch|runner:" src\main\watchlist\watchExecutor.js src\main\services\mutatingActionService.js src\main\discovery\actorWatchDirectBody.js src\main\workers\actorWatchCollector.js scripts\verify-watch-actor-scheduled-redirect.js
```

Result:

- direct service path calls `runActorWatchDirectBody(...)`
- scheduled actor Watch dispatch uses `runner: runScheduledActorWatch`
- scheduled wrapper calls `runActorWatchDirectBody(...)`
- system/radius Watch dispatch still uses `runner: collectSystemRadiusWatch`
- `collectActorWatch(...)` remains defined/exported in `actorWatchCollector.js`
- direct body does not import or call `collectActorWatch(...)`

Boundary confirmation:

- scheduled actor Watch runner target changed
- no direct actor Watch behavior change beyond accepted HS440 path
- no `WatchSessionExecutor.tick(...)` redesign
- no `TaskRunner` redesign
- no `recordWatchRunResult(...)` redesign
- no system/radius Watch redirect
- no `collectActorWatch(...)` retirement
- no live/provider verification
- no schema, dispatcher/queue/lease, Hydration, Observation/report, Evidence/EVEidence behavior, Assessment, runtime enforcement, command blocking, renderer UI, source-term rename, or protected-word JSON update

## HS446 Dev Handoff

Completed:

```txt
workspace/DevHS446-scheduled-actor-watch-redirect.md
```

Status: ready for Overseer review.

## HS442 Evidence

Dev updated 2026-06-12:

- Corrected stale controlled-adapter return-path verifier readout language in:

```txt
scripts/verify-watch-actor-controlled-adapter-return-path.js
```

- Replaced the misleading output block:

```txt
production_runtime_unchanged
```

with:

```txt
production_direct_redirect_status
scheduled_runtime_status
controlled_adapter_preview_status
```

- The verifier now reports the accepted post-HS440 direct state:

```txt
production_direct_redirect_status.actor_watch_redirected_after_hs440: true
production_direct_redirect_status.runActorWatchService_call_target: runActorWatchDirectBody
production_direct_redirect_status.direct_body_imports_collectActorWatch: false
production_direct_redirect_status.direct_body_invokes_collectActorWatch: false
```

- The verifier separately reports scheduled actor Watch remains parked:

```txt
scheduled_runtime_status.scheduled_actor_watch_legacy_parked: true
scheduled_runtime_status.watchExecutor_dispatchFor_uses_collectActorWatch: true
scheduled_runtime_status.current_runner: collectActorWatch
```

- The verifier separately reports the controlled-adapter proof remains fixture-only / non-production:

```txt
controlled_adapter_preview_status.fixture_only: true
controlled_adapter_preview_status.non_production: true
controlled_adapter_preview_status.preview_performed_redirect: false
controlled_adapter_preview_status.preview_changed_runActorWatchService: false
controlled_adapter_preview_status.preview_changed_watchExecutor_dispatchFor: false
```

- Updated assertion wording so future readers distinguish accepted HS440 direct redirect from the controlled-adapter proof's no-runtime-movement posture.
- Renamed the field-set source check to legacy compatibility wording:

```txt
verifyLegacyCollectorCompatibilityFieldSet(...)
```

Verification completed before handoff write:

```txt
node --check scripts\verify-watch-actor-controlled-adapter-return-path.js
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-direct-redirect
npm.cmd run verify:watch-actor-transport-failure-parity
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- listed syntax check passed
- corrected return-path verifier passed
- direct actor.watch redirect verifier passed
- transport/failure parity verifier passed
- production-like fake-client direct proof verifier passed
- controlled runtime adapter fixture verifier passed
- service registry, command authority, passive side-effects, and enforcement dry-run verifiers passed
- `npm.cmd run verify:service-registry` passed with a 300 second ceiling
- `npm.cmd run verify:enforcement-dry-run` remained complete: 116 commands covered, 0 gaps

Boundary confirmation:

- readout/verifier correction only
- no runtime behavior change
- direct production redirect remains HS440
- scheduled actor Watch remains legacy/parked
- no `watchExecutor.dispatchFor(...)` replacement
- no `collectActorWatch(...)` retirement
- no system/radius Watch change
- no live/provider calls
- no schema, dispatcher/queue/lease, Hydration, Observation/report, Evidence/EVEidence behavior, runtime enforcement, command blocking, renderer UI, source-term rename, or protected-word JSON update

## HS442 Dev Handoff

Completed:

```txt
workspace/DevHS442-post-redirect-return-path-verifier-correction.md
```

Status: accepted by HS443.

## HS443 Review

Accepted:

```txt
workspace/OverseerHS443-hs442-post-redirect-return-path-verifier-correction-review.md
```

Outcome:

- HS442 verifier/readout correction accepted.
- `verify:watch-actor-controlled-adapter-return-path` now reports direct production redirect as accepted post-HS440 state.
- Scheduled actor Watch remains explicitly legacy/parked.
- Controlled adapter proof remains fixture-only / non-production.

## HS444 Advisory Request

Opened:

```txt
workspace/OverseerHS444-scheduled-actor-watch-redirect-readiness-trace-request.md
```

Expected artifact:

```txt
workspace/EngineeringTraceHS444-scheduled-actor-watch-redirect-readiness.md
```

Purpose:

```txt
trace scheduled actor Watch redirect readiness before any scheduled runtime movement or collector retirement
```

Status: accepted by HS445.

## HS445 Review

Accepted:

```txt
workspace/OverseerHS445-hs444-scheduled-actor-watch-redirect-readiness-review.md
```

Outcome:

- HS444 source trace accepted.
- Scheduled actor Watch is ready for a narrow redirect only if Watch executor/task/cadence/result ownership remains intact.
- Scheduled redirect should not route through `runActorWatchService(...)`.
- Scheduled redirect may use `runActorWatchDirectBody(...)` directly or through a thin scheduled runner wrapper.

## HS446 Dev Runway

Opened:

```txt
workspace/OverseerHS446-scheduled-actor-watch-redirect-runway.md
```

Expected handoff:

```txt
workspace/DevHS446-scheduled-actor-watch-redirect.md
```

Purpose:

```txt
redirect scheduled actor Watch only, preserving WatchSessionExecutor, TaskRunner, recordWatchRunResult, task wrapping, and system/radius isolation
```

## HS446 Dev Handoff

Completed:

```txt
workspace/DevHS446-scheduled-actor-watch-redirect.md
```

Status: accepted by HS449 after HS448 corrected the stale verifier/proof readout.

## HS447 Review

Redirected:

```txt
workspace/OverseerHS447-hs446-scheduled-actor-watch-redirect-review.md
```

Outcome:

- HS446 scheduled redirect proof passed.
- `verify:watch-executor`, direct redirect, transport parity, controlled-adapter return path, registry, authority, passive side-effects, and enforcement dry-run passed.
- `verify:watch-actor-production-like-fake-client-direct-proof` failed because it still asserts scheduled actor Watch should remain parked on the legacy collector.
- HS446 was not accepted until that stale verifier/proof readout was corrected by HS448 and reviewed by HS449.

## HS448 Dev Runway

Opened:

```txt
workspace/OverseerHS448-production-like-fake-client-verifier-post-hs446-correction-runway.md
```

Expected handoff:

```txt
workspace/DevHS448-production-like-fake-client-verifier-post-hs446-correction.md
```

Purpose:

```txt
correct stale HS433 fake-client proof/verifier posture after HS446 without runtime movement
```

## HS440 Evidence

Dev updated 2026-06-12:

- Redirected only the direct production `actor.watch` final call target.
- `runActorWatchService(...)` still performs actor input resolution, actor Watch scope normalization, and `assertLiveAllowed('actor.watch', input, dependencies)`.
- Direct path now calls:

```txt
runActorWatchDirectBody(input, { ...dependencies, db })
```

- Added boundary-owned direct body:

```txt
src/main/discovery/actorWatchDirectBody.js
```

- The direct body uses real `EvidenceRepository`, `HttpClient`, `ZKillDiscoveryClient`, and `EsiClient`.
- API request logging remains through:

```txt
HttpClient -> EvidenceRepository.insertApiRequestLog(...)
```

- Direct caller return shape remains the accepted 22-field actor Watch compatibility summary.
- Production `actor.watch` service registry metadata/effects remain unchanged: `evidence-creating`, `external-live-api`, `evidence-creation`, non-renderer.
- Scheduled actor Watch remains parked on the legacy collector:

```txt
watchExecutor.dispatchFor(actor) -> runner: collectActorWatch
```

- Added focused verifier:

```txt
scripts/verify-watch-actor-direct-redirect.js
npm.cmd run verify:watch-actor-direct-redirect
```

- Updated older HS433/HS438 proof verifier source-boundary assumptions so they accept the HS440 post-redirect direct-body call while continuing to prove scheduled actor Watch remains legacy/parked.

Strict source-boundary check:

```txt
rg -n "runActorWatchDirectBody|collectActorWatch|actorWatchCollector" src\main\services\mutatingActionService.js src\main\discovery\actorWatchDirectBody.js src\main\watchlist\watchExecutor.js scripts\verify-watch-actor-direct-redirect.js
```

Result:

- `mutatingActionService.js` calls `runActorWatchDirectBody(...)`.
- `mutatingActionService.js` no longer imports or calls `collectActorWatch(...)`.
- `actorWatchDirectBody.js` does not import or call `collectActorWatch(...)`.
- `watchExecutor.js` still imports `collectActorWatch(...)`.
- `watchExecutor.js` still has `runner: collectActorWatch`.

Verification completed before handoff write:

```txt
node --check src\main\discovery\actorWatchDirectBody.js
node --check src\main\services\mutatingActionService.js
node --check scripts\verify-watch-actor-direct-redirect.js
node --check scripts\verify-watch-actor-transport-failure-parity.js
node --check scripts\verify-watch-actor-production-like-fake-client-direct-proof.js
npm.cmd run verify:watch-actor-direct-redirect
npm.cmd run verify:watch-actor-transport-failure-parity
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
npm.cmd run verify:watch-actor-controlled-adapter-disabled-seam
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- listed JavaScript syntax checks passed
- focused HS440 direct redirect verifier passed
- HS438 transport/failure parity verifier passed after post-HS440 source-boundary assertion refresh
- HS433 production-like fake-client direct proof verifier passed after post-HS440 source-boundary assertion refresh
- HS428 disabled seam verifier passed
- HS423 return-path verifier passed
- HS419 controlled runtime adapter fixture verifier passed
- service registry, command authority, passive side-effects, and enforcement dry-run verifiers passed
- `npm.cmd run verify:service-registry` passed with a 300 second ceiling
- `npm.cmd run verify:enforcement-dry-run` remained complete: 116 commands covered, 0 gaps

Boundary confirmation:

- direct `actor.watch` may move and did move
- scheduled actor Watch remains legacy/parked
- system/radius Watch remains unchanged
- mixed collector retirement remains parked
- no live/provider verification
- no Hydration write
- no Observation/report behavior change
- no Assessment change
- no schema, dispatcher/queue/lease, runtime enforcement, command blocking, renderer UI, source-term rename, or protected-word JSON update

## HS440 Dev Handoff

Completed:

```txt
workspace/DevHS440-direct-actor-watch-redirect.md
```

Status: accepted by HS441.

Remaining parked items:

- scheduled actor Watch redirect
- system/radius Watch redirect
- mixed collector retirement
- live provider verification
- dispatcher / queue / lease work
- schema work
- renderer UI work
- runtime enforcement

## HS441 Review

Accepted:

```txt
workspace/OverseerHS441-hs440-direct-actor-watch-redirect-review.md
```

Outcome:

- HS440 direct `actor.watch` redirect accepted.
- `runActorWatchService(...)` keeps actor input resolution, actor Watch scope normalization, and `assertLiveAllowed(...)`.
- Direct execution now routes to `runActorWatchDirectBody(...)`.
- Scheduled actor Watch remains parked on `watchExecutor.dispatchFor(actor) -> runner: collectActorWatch`.

Follow-up:

- `verify:watch-actor-controlled-adapter-return-path` used pre-HS440 `production_runtime_unchanged` wording.
- HS442 corrected that verifier/readout wording and was accepted by HS443.

## HS442 Dev Runway

Opened:

```txt
workspace/OverseerHS442-post-redirect-return-path-verifier-correction-runway.md
```

Expected handoff:

```txt
workspace/DevHS442-post-redirect-return-path-verifier-correction.md
```

Purpose:

```txt
make the old return-path verifier truthful after HS440 by distinguishing direct production redirect, scheduled legacy runtime, and fixture-only controlled adapter preview
```

Status: accepted by HS443.

## HS438 Evidence

Dev updated 2026-06-12:

- Added no-live transport/failure parity proof module `src/main/discovery/actorWatchTransportFailureParityProof.js`.
- Added focused verifier `scripts/verify-watch-actor-transport-failure-parity.js`.
- Added npm script `verify:watch-actor-transport-failure-parity`.
- The proof uses real `HttpClient`, real `ZKillDiscoveryClient`, and real `EsiClient` with fake `fetchImpl`.
- The proof logs API request rows through:

```txt
HttpClient -> EvidenceRepository.insertApiRequestLog(...)
```

- The proof does not manually insert synthetic API logs for the main parity cases.
- The proof uses fixture-owned `:memory:` DBs only.
- The proof includes a near-final direct-body candidate that finalizes fatal fetch runs as `failed` before rethrowing.
- Production `actor.watch`, `runActorWatchService(...)`, `watchExecutor.dispatchFor(...)`, scheduled actor Watch, and `collectActorWatch(...)` remain unchanged.

Cases covered:

```txt
success_transport_logging:
  zKill 200 logged through HttpClient
  ESI 200 logged through HttpClient
  fetch run finalized success
  persisted killmails: 1

retry_after_capacity_deferred:
  final ESI 429 logged through HttpClient
  retry_count: 1
  rate_limited: true
  provider_capacity_deferred: 1
  failed_refs_count: 0
  fetch run finalized success

terminal_esi_failed_expansion:
  ESI 500 logged through HttpClient
  failed_refs_count: 1
  fetch run finalized success with failed-expansion posture

invalid_json_failure:
  invalid ESI JSON logged through HttpClient
  status_code: null
  error_message present
  failed_refs_count: 1

cancelled_fatal_finalization:
  HTTP_CANCELLED logged through HttpClient
  fatal error rethrown
  fetch run finalized failed
  Evidence/EVEidence writes: 0

timeout_fatal_finalization:
  HTTP_TIMEOUT logged through HttpClient
  fatal error rethrown
  fetch run finalized failed
  Evidence/EVEidence writes: 0

zkill_discovery_failure_warning:
  zKill 500 logged through HttpClient
  collection warning present
  Discovery refs written: 0
  Evidence/EVEidence writes: 0
  fetch run finalized success with warning posture
```

API log fields proven:

```txt
provider
endpoint
status_code
retry_count
rate_limited
error_message
```

Strict import/call check:

```txt
rg -n "require\(.*actorWatchCollector|collectActorWatch\(" src\main\discovery\actorWatchTransportFailureParityProof.js scripts\verify-watch-actor-transport-failure-parity.js
```

Result:

- no matches
- no `actorWatchCollector.js` import in the new proof path
- no `collectActorWatch(...)` call in the new proof path

Verification completed before handoff write:

```txt
node --check src\main\discovery\actorWatchTransportFailureParityProof.js
node --check scripts\verify-watch-actor-transport-failure-parity.js
npm.cmd run verify:watch-actor-transport-failure-parity
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
npm.cmd run verify:watch-actor-controlled-adapter-disabled-seam
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
git status --short --branch
```

Results:

- listed JavaScript syntax checks passed
- focused HS438 verifier passed
- HS433 production-like fake-client direct proof verifier passed
- HS428 disabled seam verifier passed
- HS423 return-path verifier passed
- HS419 controlled runtime adapter fixture verifier passed
- service registry, command authority, passive side-effects, and enforcement dry-run verifiers passed
- `npm.cmd run verify:service-registry` passed with a 300 second ceiling
- `npm.cmd run verify:enforcement-dry-run` remained complete: 116 commands covered, 0 gaps
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git status --short --branch` showed branch `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS438-touched files

Boundary confirmation:

- no production `actor.watch` redirect
- no `runActorWatchService(...)` production call-target change
- no `watchExecutor.dispatchFor(...)` change
- no scheduled actor Watch redirect
- no `WatchSessionExecutor.tick(...)` invocation
- no `TaskRunner` change or invocation
- no `collectActorWatch(...)` invocation/import/retirement
- no live/provider/API call
- no operator DB write
- no operator Discovery ref write
- no operator Evidence/EVEidence write
- no Hydration write
- no Observation/report path change
- no system/radius Watch behavior change
- no schema, dispatcher, queue, lease, enforcement, command blocking, UI, source-term rename, or protected-word JSON update

## HS438 Dev Handoff

Completed:

```txt
workspace/DevHS438-actor-watch-transport-failure-parity-proof.md
```

Status: ready for Overseer review.

Remaining parked items:

- production `actor.watch` redirect remains parked
- scheduled Watch redirect remains parked
- `runActorWatchService(...)` replacement remains parked
- `watchExecutor.dispatchFor(...)` replacement remains parked
- `collectActorWatch(...)` retirement remains parked
- live zKill/ESI provider movement remains parked
- operator-corpus direct redirect writes remain parked
- durable Discovery receipt/task/packet persistence, Watch cadence mutation, dispatcher/queue/lease/runtime enforcement/UI work remain parked

## HS433 Evidence

Dev updated 2026-06-11:

- Added Discovery-owned production-like fake-client direct proof body `src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js`.
- Added focused verifier `scripts/verify-watch-actor-production-like-fake-client-direct-proof.js`.
- Added npm script `verify:watch-actor-production-like-fake-client-direct-proof`.
- The proof exercises a function shaped like a future direct `runActorWatchService(...)` replacement body without changing `runActorWatchService(...)`.
- The proof runs actor input resolution and current actor Watch scope normalization against fixture-owned `:memory:` DBs.
- The proof represents `actor.watch` live-gate expectations without entering production provider attempt control.
- The proof uses injected fake zKill and ESI clients only.
- The proof writes production-like rows only to fixture-owned DBs:
  - fetch-run lifecycle rows
  - Discovery candidate refs and status movement
  - selected / expanded / cached / failed candidate-ref posture
  - Evidence/EVEidence writer landing for fake expanded killmail payloads
  - data quality warning posture
  - synthetic fixture `api_request_logs` for API count posture
- The proof returns the boundary-owned caller compatibility summary shape with 22-field parity.
- The proof covers fresh, pending, cached, and failed selected-ref expansion cases.
- Production `actor.watch` remains unchanged and still routes through the legacy collector.
- Scheduled actor Watch remains parked on the legacy collector.

Focused proof sample:

```txt
action: watch.actor_production_like_fake_client_direct_proof
production_like_direct_body: true
fixture_owned_db_only: true
provider_calls: 0
live_api_calls: 0
production_actor_watch_redirected: false
scheduled_actor_watch_legacy_parked: true
fresh: zkill=1, esi=2, refs=3, selected=2, expanded=2, persisted=2, api_counts zkill=1 esi=2
pending: zkill=0, esi=2, pending_refs=2, expanded=2, persisted=2
cached: zkill=1, esi=1, cached=1, expanded=1, persisted=1
failed: zkill=1, esi=1, failed=1, persisted=0
```

API request count posture:

```txt
represented: true
fixture_synthetic_logs: true
http_client_logging_parity_proven: false
limitation: injected fake clients insert fixture api_request_logs for count posture; they do not exercise HttpClient/ZKillDiscoveryClient/EsiClient transport logging
```

Strict import/call check:

```txt
rg -n "require\(.*actorWatchCollector|collectActorWatch\(" src\main\discovery\actorWatchProductionLikeFakeClientDirectProof.js scripts\verify-watch-actor-production-like-fake-client-direct-proof.js
```

Result:

- no matches
- no `actorWatchCollector.js` import in the new proof body
- no `collectActorWatch(...)` call in the new proof body

Verification completed before handoff write:

```txt
node --check src\main\discovery\actorWatchProductionLikeFakeClientDirectProof.js
node --check scripts\verify-watch-actor-production-like-fake-client-direct-proof.js
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
npm.cmd run verify:watch-actor-controlled-adapter-disabled-seam
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
git status --short --branch
```

Results:

- listed JavaScript syntax checks passed
- focused HS433 verifier passed
- HS428 disabled seam verifier passed
- HS423 return-path verifier passed
- HS419 controlled runtime adapter fixture verifier passed
- service registry, command authority, passive side-effects, and enforcement dry-run verifiers passed
- `npm.cmd run verify:service-registry` passed with a 300 second ceiling
- `npm.cmd run verify:enforcement-dry-run` remained complete: 116 commands covered, 0 gaps
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git status --short --branch` showed branch `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS433-touched files

Boundary confirmation:

- no production `actor.watch` redirect
- no `runActorWatchService(...)` production call-target change
- no `watchExecutor.dispatchFor(...)` change
- no scheduled actor Watch redirect
- no `WatchSessionExecutor.tick(...)` invocation
- no `TaskRunner` change or invocation
- no `collectActorWatch(...)` invocation/import/retirement
- no live/provider/API call
- no operator DB write
- no operator Discovery ref write
- no operator Evidence/EVEidence write
- no Hydration write
- no Observation/report path change
- no system/radius Watch behavior change
- no schema, dispatcher, queue, lease, enforcement, command blocking, UI, source-term rename, or protected-word JSON update

## HS433 Dev Handoff

Completed:

```txt
workspace/DevHS433-actor-watch-production-like-fake-client-direct-proof.md
```

Status: ready for Overseer review.

Remaining parked items:

- production `actor.watch` redirect remains parked
- scheduled Watch redirect remains parked
- `runActorWatchService(...)` replacement remains parked
- `watchExecutor.dispatchFor(...)` replacement remains parked
- `collectActorWatch(...)` retirement remains parked
- live zKill/ESI provider movement remains parked
- true HttpClient/ZKillDiscoveryClient/EsiClient API-log parity remains unproven by this fake-client proof
- durable Discovery receipt/task/packet persistence, Watch cadence mutation, dispatcher/queue/lease/runtime enforcement/UI work remain parked

## HS428 Evidence

Dev updated 2026-06-11:

- Added disabled/proof-only service seam `src/main/services/watchActorControlledAdapterDisabledService.js`.
- Added non-renderer service command `watch.actor_controlled_adapter_disabled.preview`.
- Added focused verifier `scripts/verify-watch-actor-controlled-adapter-disabled-seam.js`.
- Added npm script `verify:watch-actor-controlled-adapter-disabled-seam`.
- Updated service registry, command authority, passive side-effect, and enforcement dry-run coverage for the new fixture-only/non-production command.
- The disabled seam calls the boundary-owned controlled runtime adapter fixture preview path, not `collectActorWatch(...)`.
- The seam returns the accepted HS423 direct compatibility summary shape:
  - direct caller return is the summary object itself
  - field-set parity matches the 22-field production compatibility summary contract
- The seam includes scheduled-style wrapper posture through `data.collection` without invoking `WatchSessionExecutor.tick(...)`.
- The seam proves operator/caller DB non-mutation while the wrapped proof uses internal disposable `:memory:` DBs and fake clients only.
- Production `actor.watch`, `runActorWatchService(...)`, `watchExecutor.dispatchFor(...)`, and `collectActorWatch(...)` remain unchanged.

Focused proof sample:

```txt
command: watch.actor_controlled_adapter_disabled.preview
classification: metadata-only
effects: local-data-mutation
renderer_allowed: false
direct_summary_field_count: 22
scheduled_wrapper_status: succeeded
operator_corpus_non_mutation: true
production_actor_watch_redirected: false
collect_actor_watch_invoked: false
provider_calls: 0
live_api_calls: 0
```

Strict import/call check:

```txt
rg -n "require\(.*actorWatchCollector|collectActorWatch\(" src\main\services\watchActorControlledAdapterDisabledService.js scripts\verify-watch-actor-controlled-adapter-disabled-seam.js
```

Result:

- no matches
- no `actorWatchCollector.js` import in the new seam path
- no `collectActorWatch(...)` call in the new seam path

Verification completed before handoff write:

```txt
node --check src\main\services\watchActorControlledAdapterDisabledService.js
node --check scripts\verify-watch-actor-controlled-adapter-disabled-seam.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:watch-actor-controlled-adapter-disabled-seam
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
```

Results:

- all listed syntax checks passed
- focused HS428 disabled seam verifier passed
- HS423 return-path verifier passed
- HS419 controlled runtime adapter fixture verifier passed
- service registry, command authority, passive side-effects, and enforcement dry-run verifiers passed
- `npm.cmd run verify:enforcement-dry-run` remained complete: 116 commands covered, 0 gaps
- `watch.actor_controlled_adapter_disabled.preview` appears as fixture-only/non-production in enforcement dry-run coverage
- final `npm.cmd run verify:protected-terms` completed with warning-only advisory output: 936 warnings across the broad current working set; no source-term rename or protected-word JSON update was performed
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git status --short --branch` showed branch `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS428-touched files and the HS428 handoff artifact

Boundary confirmation:

- no production `actor.watch` redirect
- no `runActorWatchService(...)` change
- no `watchExecutor.dispatchFor(...)` change
- no `WatchSessionExecutor.tick(...)` invocation
- no `TaskRunner` change or invocation
- no `collectActorWatch(...)` invocation/import/retirement
- no provider/live/API call
- no operator DB write
- no operator Discovery ref write
- no operator Evidence/EVEidence write
- no Hydration, Observation, or Assessment change
- no Watch cadence mutation
- no system/radius Watch behavior change
- no schema, dispatcher, queue, lease, enforcement, command blocking, UI, source-term rename, or protected-word JSON update

## HS428 Dev Handoff

Completed:

```txt
workspace/DevHS428-actor-watch-controlled-adapter-disabled-seam.md
```

Status: ready for Overseer review.

Remaining parked items:

- production `actor.watch` redirect remains parked
- scheduled Watch redirect remains parked
- `runActorWatchService(...)` replacement remains parked
- `watchExecutor.dispatchFor(...)` replacement remains parked
- `collectActorWatch(...)` retirement remains parked
- live zKill/ESI provider movement remains parked
- durable Discovery receipt/task/packet persistence, Watch cadence mutation, dispatcher/queue/lease/runtime enforcement/UI work remain parked

## HS423 Evidence

Dev updated 2026-06-11:

- Added Discovery-owned compatibility projection helper `src/main/discovery/actorWatchCompatibilitySummary.js`.
- Updated `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js` to use the shared compatibility summary builder instead of a local duplicate builder.
- Added focused verifier `scripts/verify-watch-actor-controlled-adapter-return-path.js`.
- Added npm script `verify:watch-actor-controlled-adapter-return-path`.
- Direct caller return shape is proven as the summary object itself.
- Scheduled-style wrapping is proven as `data.collection` preserving the same summary object.
- Compatibility field-set parity is asserted against the production `collectActorWatch(...)` summary contract.
- Compatibility/debug terms remain explicitly old-return-shape language only:
  - `collection`
  - `collection_plan`
  - `expansion_queue`
  - `expansion_queue_summary`
  - `zkill_refs_discovered`
  - `zkill_discovery_skipped`
- Production `actor.watch`, `runActorWatchService(...)`, `watchExecutor.dispatchFor(...)`, and `collectActorWatch(...)` remain unchanged.

Compatibility field-set parity result:

```txt
field_count: 22
missing: []
extra: []
matches: true
```

Direct caller proof:

```txt
buildDirectActorWatchCompatibilityReturn(summary) === summary
top_level_is_summary_object: true
```

Scheduled-style wrapper proof:

```txt
status: succeeded
data.collection === summary
collection_field_count: 22
```

Source/import proof:

```txt
rg -n "collectActorWatch|actor\.watch|runActorWatchService|dispatchFor|data\.collection|compatibility" src\main\discovery\actorWatchCompatibilitySummary.js src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js scripts\verify-watch-actor-controlled-adapter-return-path.js scripts\verify-watch-actor-controlled-runtime-adapter-fixture.js package.json
```

Result:

- references are proof labels, assertions, compatibility field names, and npm script names
- no production runtime redirect was introduced

Strict import/call check:

```txt
rg -n "require\(.*actorWatchCollector|collectActorWatch\(" src\main\discovery\actorWatchCompatibilitySummary.js src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js scripts\verify-watch-actor-controlled-adapter-return-path.js
```

Result:

- no matches
- no `collectActorWatch(...)` import/call in the new path
- no `actorWatchCollector.js` import in the new path

Verification completed before handoff write:

```txt
node --check src\main\discovery\actorWatchCompatibilitySummary.js
node --check src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js
node --check scripts\verify-watch-actor-controlled-adapter-return-path.js
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
```

Results:

- all listed syntax checks passed
- focused return-path verifier passed
- affected HS419 controlled runtime adapter fixture verifier passed
- `npm.cmd run verify:protected-terms` completed with warning-only advisory output: 838 warnings across the broad current working set; no source-term rename or protected-word JSON update was performed
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git status --short --branch` showed branch `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS423 files

Boundary confirmation:

- no production `actor.watch` redirect
- no `runActorWatchService(...)` change
- no `watchExecutor.dispatchFor(...)` change
- no `collectActorWatch(...)` invocation/import/retirement
- no provider/live/API call
- no operator DB write
- no operator Discovery ref write
- no operator Evidence/EVEidence write
- no Hydration, Observation, or Assessment change
- no Watch cadence mutation
- no schema, dispatcher, queue, lease, enforcement, command blocking, UI, source-term rename, or protected-word JSON update

## HS423 Dev Handoff

Completed:

```txt
workspace/DevHS423-actor-watch-controlled-adapter-return-path-proof.md
```

Status: ready for Overseer review.

Remaining parked items:

- production `actor.watch` redirect remains parked
- scheduled Watch redirect remains parked
- `runActorWatchService(...)` replacement remains parked
- `watchExecutor.dispatchFor(...)` replacement remains parked
- `collectActorWatch(...)` retirement remains parked
- live zKill/ESI provider movement remains parked
- durable Discovery receipt/task/packet persistence, Watch cadence mutation, dispatcher/queue/lease/runtime enforcement/UI work remain parked

## HS419 Evidence

Dev updated 2026-06-08:

- Added disposable-DB actor Watch controlled runtime adapter fixture module `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js`.
- Added service wrapper `src/main/services/watchActorControlledRuntimeAdapterFixtureService.js`.
- Added non-renderer service command `watch.actor_controlled_runtime_adapter_fixture.preview`.
- Added focused verifier `scripts/verify-watch-actor-controlled-runtime-adapter-fixture.js` and npm script `verify:watch-actor-controlled-runtime-adapter-fixture`.
- Updated service registry, command authority, passive side-effect, and enforcement dry-run coverage for the new fixture-only command.
- The fixture uses injected fake zKill/ESI clients only and internal disposable `:memory:` DBs.
- The service wrapper snapshots any caller/operator DB before/after and proves unchanged operator corpus state.
- The proof uses real repository/service paths in disposable DBs:
  - `createFetchRun(...)`
  - `upsertDiscoveredKillmailRefs(...)`
  - `pendingDiscoveryRefs(...)`
  - `markDiscoveryRefsSelected(...)`
  - `persistEvidencePackage(...)`
  - `markDiscoveryRefsExpanded(...)`
  - `markDiscoveryRefsCached(...)`
  - `markDiscoveryRefsFailed(...)`
  - `insertWarning(...)`
  - `finalizeFetchRun(...)`
- The proof composes current Discovery helper surfaces:
  - `discoverActorRefs(...)`
  - `pendingActorDiscovery(...)`
  - `selectExpansionCandidates(...)`
  - `markFailedExpansionCandidates(...)`
  - `summarizeExpansionQueue(...)`
  - `buildEvidencePackageFromRefs(...)`
- Fixture cases cover fresh actor candidate acquisition, pending candidate drain, local Evidence/EVEidence cache skip, and ESI-backed expansion failure posture.
- Disposable mutation proof demonstrates `fetch_runs`, Discovery ref status movement, Evidence/EVEidence writer landing, warnings, failures, and compatibility summary posture without touching the operator corpus.
- Production `actor.watch`, `runActorWatchService(...)`, `watchExecutor.dispatchFor(...)`, and `collectActorWatch(...)` remain unchanged.

Source/import proof:

```txt
rg -n "watch.actor_controlled_runtime_adapter_fixture|actorWatchControlledRuntimeAdapterFixture|collectActorWatch" src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js src\main\services\watchActorControlledRuntimeAdapterFixtureService.js scripts\verify-watch-actor-controlled-runtime-adapter-fixture.js src\main\services\serviceRegistry.js
```

Result:

- new fixture module, service wrapper, verifier, and service command references are visible
- `collectActorWatch` appears only in explicit not-imported / not-invoked / unchanged proof labels and assertions
- no `collectActorWatch(...)` call was added
- no import from `actorWatchCollector.js` was added

Sample focused proof output:

```txt
Actor Watch controlled runtime adapter fixture proof validated
fresh_actor_candidate_acquisition:
  fake_zkill_client_invocations: 1
  fake_esi_client_invocations: 2
  refs_written: 3
  selected_count: 2
  expanded_count: 2
  persisted_killmails: 2
  activity_events_written: 12
  finalized: true
  status_counts.expanded: 2
  status_counts.pending: 1
pending_candidate_drain:
  fake_zkill_client_invocations: 0
  selected_count: 2
  expanded_count: 2
local_evidence_cache_skip:
  cached_count: 1
  fake_esi_client_invocations: 1
expansion_failure:
  failed_count: 1
  persisted_killmails: 0
operator_corpus_non_mutation_proof:
  operator_db_written: false
  disposable_db_only: true
  unchanged: true
```

Verification completed before handoff write:

```txt
node --check src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js
node --check src\main\services\watchActorControlledRuntimeAdapterFixtureService.js
node --check scripts\verify-watch-actor-controlled-runtime-adapter-fixture.js
node --check src\main\discovery\actorWatchDiscoveryRouteBodyFixture.js
node --check src\main\services\watchActorDiscoveryRouteBodyFixtureService.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\services\mutatingActionService.js
node --check src\main\watchlist\watchExecutor.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
npm.cmd run verify:watch-actor-discovery-route-body-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:watch-actor-compatibility-wrapper-adapter-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:evidence-rules
npm.cmd run verify:watch-executor
npm.cmd run verify:mutating-services
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- all listed syntax checks passed
- all listed npm verification commands passed
- `npm.cmd run verify:service-registry` passed with a 300 second ceiling
- `npm.cmd run verify:enforcement-dry-run` remained complete: 115 commands covered, 0 gaps
- the new command appears as fixture-only/non-production in enforcement dry-run coverage
- `npm.cmd run verify:protected-terms` completed with warning-only advisory output: 825 warnings across the broad current working set; no source-term rename or protected-word JSON update was performed
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git status --short --branch` showed branch `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS419-touched files and the HS419 handoff artifact

Boundary confirmation:

- no production `actor.watch` redirect
- no `runActorWatchService(...)` change
- no `watchExecutor.dispatchFor(...)` change
- no `collectActorWatch(...)` invocation or retirement
- no provider/live/API call
- no operator DB write
- no operator Discovery ref write
- no operator Evidence/EVEidence write
- no Hydration write
- no Watch cadence mutation
- no schema, dispatcher, queue, lease, enforcement, command blocking, UI, support artifact, source-term rename, or protected-word JSON update

## HS419 Dev Handoff

Completed:

```txt
workspace/DevHS419-actor-watch-controlled-runtime-adapter-fixture-proof.md
```

Status: accepted by HS420.

Remaining parked items:

- production `actor.watch` redirect remains parked
- scheduled Watch redirect remains parked
- `runActorWatchService(...)` replacement remains parked
- `watchExecutor.dispatchFor(...)` replacement remains parked
- `collectActorWatch(...)` retirement remains parked
- live zKill/ESI provider movement remains parked
- durable Discovery receipt/task/packet persistence, Watch cadence mutation, dispatcher/queue/lease/runtime enforcement/UI work remain parked

## Latest Accepted Advisory

HS417: Actor Watch controlled runtime adapter readiness.

Accepted by:

```txt
workspace/OverseerHS418-hs417-actor-watch-controlled-runtime-adapter-readiness-review.md
```

Advisory artifact:

```txt
workspace/EngineeringTraceHS417-actor-watch-controlled-runtime-adapter-readiness.md
```

Accepted finding:

- Atlas is not ready for default `actor.watch` redirect, scheduled Watch redirect, or `collectActorWatch(...)` retirement.
- Atlas is ready for a narrower no-provider, disposable-DB controlled runtime adapter fixture proof.
- HS415 proved route-body composition, not runtime replacement.
- The missing proof is mutation choreography: `fetch_runs`, candidate-ref persistence/status mutation, Evidence/EVEidence writer landing, warning/failure posture, and old compatibility summary from a mutation-capable proof.

## Latest Accepted State

HS415: Actor Watch Discovery-owned route body fixture proof accepted by HS416.

Accepted by:

```txt
workspace/OverseerHS416-hs415-actor-watch-discovery-route-body-fixture-proof-review.md
```

Runway:

```txt
workspace/OverseerHS415-actor-watch-discovery-route-body-fixture-proof-runway.md
```

Dev handoff:

```txt
workspace/DevHS415-actor-watch-discovery-route-body-fixture-proof.md
```

Accepted result:

```txt
actor Watch-shaped input can flow through a Discovery-owned route body using injected clients and current Discovery helper surfaces, without invoking collectActorWatch or changing production actor.watch
```

Boundary still closed:

No production `actor.watch` redirect, `runActorWatchService(...)` change, `watchExecutor.dispatchFor(...)` change, `collectActorWatch(...)` invocation, collector retirement, provider/live/API call, real/operator Discovery ref write, real/operator Evidence/EVEidence write, Hydration write, Watch cadence mutation, schema, dispatcher, system/radius change, UI, support artifact, source-term rename, or protected-word JSON update.

## HS415 Evidence

Dev updated 2026-06-08:

- Added Discovery-owned route-body proof module `src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js`.
- Added read-only service wrapper `src/main/services/watchActorDiscoveryRouteBodyFixtureService.js`.
- Added renderer-eligible read-only command `watch.actor_discovery_route_body_fixture.preview`.
- Added focused verifier `scripts/verify-watch-actor-discovery-route-body-fixture.js` and npm script `verify:watch-actor-discovery-route-body-fixture`.
- Updated service registry, command authority, passive side-effect, and enforcement dry-run coverage for the new command.
- The route body composes current Discovery-owned helpers:
  - `discoverActorRefs(...)`
  - `pendingActorDiscovery(...)`
  - `selectExpansionCandidates(...)`
  - `markFailedExpansionCandidates(...)`
  - `summarizeExpansionQueue(...)`
  - `buildEvidencePackageFromRefs(...)`
- The proof uses injected fixture zKill/ESI clients only.
- The proof accepts actor Watch-shaped intent and returns an old caller-facing compatibility summary without redirecting production `actor.watch`.
- Watch remains an intent/cadence/provenance source only in this proof; Discovery owns acquisition and ESI-backed expansion route-body work.
- Candidate refs remain possible leads/provenance, not Evidence/EVEidence.
- ESI-backed selected-ref expansion remains Discovery-owned and is not Hydration.
- Evidence/EVEidence writer boundary is represented but not invoked.
- Pending Discovery refs are preferred before fresh fixture zKill candidate acquisition.
- Fixture cases cover fresh candidate acquisition, pending candidate drain, local cache skip, and retryable/terminal expansion failure posture.
- Service wrapper snapshots durable table counts before/after and proves no operator corpus mutation for the route proof.

Source/import proof:

```txt
rg -n "actorWatchDiscoveryRouteBodyFixture|watch.actor_discovery_route_body_fixture|collectActorWatch\(" src\main\discovery\actorWatchDiscoveryRouteBodyFixture.js src\main\services\watchActorDiscoveryRouteBodyFixtureService.js scripts\verify-watch-actor-discovery-route-body-fixture.js src\main\services\serviceRegistry.js
```

Result:

- new route body and service references are visible
- `collectActorWatch(` did not appear in the new route body, service wrapper, registry handler, or focused verifier
- no import from `actorWatchCollector.js` was added by HS415

Sample focused proof output:

```txt
Actor Watch Discovery-owned route body fixture proof validated
sample_fresh_route:
  action: watch.actor_discovery_route_body_fixture.preview
  route_body_fixture_only: true
  fake_zkill_client_invocations: 1
  fake_esi_client_invocations: 2
  provider_calls: 0
  live_api_calls: 0
  discovery_refs_written: false
  evidence_writes: 0
  hydration_writes: 0
  watch_mutations: 0
  table_mutation_proof.unchanged: true
sample_pending_route:
  helpers include pendingActorDiscovery
  fake_zkill_client_invocations: 0
  pending_refs_considered: 1
  zkill_discovery_skipped: true
```

Verification:

```txt
node --check src\main\discovery\actorWatchDiscoveryRouteBodyFixture.js
node --check src\main\services\watchActorDiscoveryRouteBodyFixtureService.js
node --check scripts\verify-watch-actor-discovery-route-body-fixture.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\services\mutatingActionService.js
node --check src\main\watchlist\watchExecutor.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
npm.cmd run verify:watch-actor-discovery-route-body-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:watch-actor-compatibility-wrapper-adapter-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:evidence-rules
npm.cmd run verify:watch-executor
npm.cmd run verify:mutating-services
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- all listed syntax checks passed
- all listed npm verification commands passed
- `npm.cmd run verify:service-registry` passed with a 300 second ceiling
- `npm.cmd run verify:enforcement-dry-run` remained complete: 114 commands covered, 0 gaps
- `npm.cmd run verify:protected-terms` completed with warning-only advisory output: 801 warnings across the broad current working set; no source-term rename or protected-word JSON update was performed
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git status --short --branch` showed branch `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS415-touched files and the HS415 handoff artifact

Boundary confirmation:

- no production `actor.watch` redirect
- no `runActorWatchService(...)` change
- no `watchExecutor.dispatchFor(...)` change
- no `collectActorWatch(...)` invocation or retirement
- no provider/live/API call
- no real/operator Discovery ref write
- no real/operator Evidence/EVEidence write from the route proof
- no Hydration write
- no Watch cadence mutation
- no schema, dispatcher, system/radius, UI, support artifact, source-term rename, or protected-word JSON update

## HS415 Dev Handoff

Completed:

```txt
workspace/DevHS415-actor-watch-discovery-route-body-fixture-proof.md
```

Status: actor Watch Discovery-owned route body fixture proof accepted by HS416.

Remaining parked items:

- production `actor.watch` redirect remains parked
- `runActorWatchService(...)` replacement remains parked
- `watchExecutor.dispatchFor(...)` replacement remains parked
- `collectActorWatch(...)` retirement remains parked
- live zKill/ESI provider movement remains parked
- durable Discovery ref writes, Evidence/EVEidence writes, Watch receipt/cadence mutation, dispatcher/queue/schema/UI/enforcement work remain parked

## Latest Accepted Advisory

HS413: Actor Watch redirect readiness re-check.

Accepted by:

```txt
workspace/OverseerHS414-hs413-actor-watch-redirect-readiness-recheck-review.md
```

Advisory artifact:

```txt
workspace/EngineeringTraceHS413-actor-watch-redirect-readiness-recheck.md
```

Accepted finding:

- actor Watch is not ready for default `actor.watch` runtime redirect
- actor Watch is ready only for a narrower no-provider / injected-client route-body proof
- `collectActorWatch(...)` remains the only live-capable actor Watch orchestrator today
- existing compatibility wrapper previews are not live-capable replacements
- redirecting directly to a preview would silently lose behavior
- cloning `collectActorWatch(...)` would preserve the mixed collector model

## Latest Accepted Seam

HS419: Actor Watch controlled runtime adapter fixture proof.

Accepted by:

```txt
workspace/OverseerHS420-hs419-actor-watch-controlled-runtime-adapter-fixture-review.md
```

Dev handoff:

```txt
workspace/DevHS419-actor-watch-controlled-runtime-adapter-fixture-proof.md
```

Accepted result:

- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js` proves actor Watch controlled runtime adapter mutation choreography in fixture form.
- the proof uses disposable `:memory:` DBs and injected fake zKill/ESI clients only.
- real repository choreography is exercised in disposable DBs: fetch run lifecycle, Discovery ref persistence/status movement, Evidence/EVEidence writer landing, warnings, failures, and compatibility summary posture.
- production `actor.watch`, `runActorWatchService(...)`, `watchExecutor.dispatchFor(...)`, and `collectActorWatch(...)` remain unchanged.
- no provider/live/API calls, operator Discovery ref writes, operator Evidence/EVEidence writes, Hydration writes, Watch cadence mutation, schema, dispatcher, system/radius, UI, or support artifact work was opened.
- Candidate refs remain possible leads/provenance, not Evidence.
- ESI-backed expansion remains Discovery-owned and is not Hydration.
- Evidence/EVEidence writer landing is invoked only inside disposable fixture DBs.

Previous accepted seam:

HS415: Actor Watch Discovery-owned route body fixture proof.

Previous accepted seam:

HS411: Discovery ESI-backed selected-ref expansion package helper extraction.

Previous accepted seam:

HS407: Discovery candidate-ref pending rehydration helper extraction.

Accepted by:

```txt
workspace/OverseerHS408-hs407-discovery-candidate-ref-pending-rehydration-helper-extraction-review.md
```

Dev handoff:

```txt
workspace/DevHS407-discovery-candidate-ref-pending-rehydration-helper-extraction.md
```

Accepted result:

- `src/main/discovery/candidateRefMemory.js` now owns pending candidate-ref rehydration helpers.
- `pendingActorDiscovery(...)` and `pendingSystemRadiusDiscovery(...)` live under Discovery ownership.
- actor and system/radius collectors import those helpers from Discovery.
- old collector-local pending helper bodies were removed.
- mixed collector runtime behavior, manual discovery, queue/status mutation behavior, provider movement, schema, receipts, dispatcher, enforcement, UI, and support artifacts remain unchanged.

Previous accepted seam:

HS405: Candidate ref memory / status helper ownership trace.

Accepted by:

```txt
workspace/OverseerHS406-hs405-candidate-ref-memory-status-helper-ownership-review.md
```

Advisory artifact:

```txt
workspace/EngineeringTraceHS405-candidate-ref-memory-status-helper-ownership.md
```

Accepted clarification:

- Watch owns the cadence decision. When currently due, missed, or otherwise ready, Watch emits/populates a Discovery acquisition task for the accepted scope/window.
- Discovery does not monitor Watch cadence; it consumes work after an accepted intent source populates the basket.
- Watch can rest/schedule from a bounded Discovery zKill acquisition receipt/outcome for the accepted scope/window.
- Watch does not wait for all candidate refs to become Evidence/EVEidence.
- `discovered_killmail_refs` is Discovery working memory, not the completion surface Watch consumes.
- Candidate refs may be evidence behind the receipt; the receipt is the Watch completion handoff.
- Discovery ESI-backed expansion continues downstream recovery/work from landed candidate refs.

Accepted follow-up candidate:

- ESI-backed expansion/package helper boundary trace.

## Recent Accepted Dev Packet

HS419 is the most recent accepted Dev packet.

Most recent completed runway:

```txt
workspace/OverseerHS419-actor-watch-controlled-runtime-adapter-fixture-proof-runway.md
```

Most recent Dev handoff:

```txt
workspace/DevHS419-actor-watch-controlled-runtime-adapter-fixture-proof.md
```

Accepted review:

```txt
workspace/OverseerHS420-hs419-actor-watch-controlled-runtime-adapter-fixture-review.md
```

HS419 purpose:

Prove actor Watch controlled runtime adapter mutation choreography in disposable DBs using injected fake clients and real repository methods, without invoking `collectActorWatch(...)` or changing production `actor.watch`.

Scope:

- add `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js`
- add `src/main/services/watchActorControlledRuntimeAdapterFixtureService.js`
- add `watch.actor_controlled_runtime_adapter_fixture.preview`
- add focused fixture verifier coverage
- keep production actor Watch runtime and scheduled dispatch unchanged

Boundary:

No production Evidence writer behavior change, candidate-ref status policy rewrite, provider/live behavior, runtime enforcement, Watch cadence, collector invocation, actor Watch redirect, scheduled Watch redirect, collector retirement, schema, dispatcher, Hydration, Observation, Assessment, support artifact, UI, source-term rename, or protected-word JSON update.

## HS411 Evidence

Implemented the Discovery-owned ESI-backed selected-ref expansion/package helper extraction.

Added:

- `src/main/discovery/esiBackedExpansionPackage.js`

Moved/re-homed helper surface:

- `buildEvidencePackageFromRefs({ refs, repository, esiClient, run, discoveredBy })`

Ownership result:

```txt
src/main/discovery/esiBackedExpansionPackage.js now defines and exports:
  buildEvidencePackageFromRefs

src/main/workers/killmailIngestionWorker.js imports buildEvidencePackageFromRefs from:
  ../discovery/esiBackedExpansionPackage

src/main/workers/killmailIngestionWorker.js continues to export:
  buildEvidencePackageFromRefs
  evidencePackageFromExpandedKillmails
```

Preserved behavior:

- local cache skip remains through `repository.hasKillmail(...)`
- ESI expansion remains through injected `esiClient.expandKillmail(...)`
- `HTTP_CANCELLED`, `TASK_CANCELLED`, and `AbortError` are rethrown
- provider capacity errors still create `provider_capacity_deferred` warnings
- other expansion failures still increment `failed_count` and create `failed_expansion` warnings
- raw expanded killmails still normalize through `normalizeKillmail(...)`
- returned package shape remains compatible with `EvidenceRepository.persistEvidencePackage(...)`
- the helper does not persist Evidence/EVEidence itself
- the helper does not mutate candidate-ref status itself

Updated callers/imports:

- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/manualExpansionWorker.js`

Compatibility export decision:

- `killmailIngestionWorker.js` remains a compatibility export for `buildEvidencePackageFromRefs(...)`.
- `evidencePackageFromExpandedKillmails(...)` remains in `killmailIngestionWorker.js` for no-provider fixture/package builder use.

Focused source ownership check:

```txt
rg -n "buildEvidencePackageFromRefs|esiBackedExpansionPackage|evidencePackageFromExpandedKillmails" src\main\workers src\main\discovery scripts
```

Result:

- `buildEvidencePackageFromRefs(...)` implementation lives in `src/main/discovery/esiBackedExpansionPackage.js`
- actor/system/manual expansion callers import it from Discovery
- `killmailIngestionWorker.js` imports/re-exports it as compatibility
- `evidencePackageFromExpandedKillmails(...)` remains in `killmailIngestionWorker.js`
- existing scripts still consume `evidencePackageFromExpandedKillmails(...)` through `killmailIngestionWorker.js`

Verification:

```txt
node --check src\main\discovery\esiBackedExpansionPackage.js
node --check src\main\workers\killmailIngestionWorker.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\workers\systemRadiusCollector.js
node --check src\main\workers\manualExpansionWorker.js
rg -n "buildEvidencePackageFromRefs|esiBackedExpansionPackage|evidencePackageFromExpandedKillmails" src\main\workers src\main\discovery scripts
npm.cmd run verify:actor-watch
npm.cmd run verify:collector
npm.cmd run verify:manual-discovery
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-report
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:evidence-rules
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- all listed syntax checks passed
- all listed npm verification commands passed
- `npm.cmd run verify:service-registry` passed with a 300 second ceiling
- `npm.cmd run verify:enforcement-dry-run` remained complete: 113 commands covered, 0 gaps
- `npm.cmd run verify:protected-terms` completed with warning-only advisory output: 775 warnings across the current broad working set; no source-term rename or protected-word JSON update was performed
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git status --short --branch` showed branch `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS411-touched files and the HS411 handoff artifact

Boundary confirmation:

- no Evidence writer change
- no `normalizeKillmail(...)` behavior change
- no `EvidenceRepository.persistEvidencePackage(...)` behavior change
- no `evidencePackageFromExpandedKillmails(...)` behavior change
- no candidate-ref status policy rewrite
- no `selectExpansionCandidates(...)`, `markFailedExpansionCandidates(...)`, `pendingDiscoveryRefs(...)`, `upsertDiscoveredKillmailRefs(...)`, selected/expanded/cached/failed mutation behavior, timestamp, failure count, or last-error behavior change
- no actor/system/manual expansion result shape change intended
- no `fetch_runs` or `api_request_logs` behavior change
- no provider/live access behavior change
- no command metadata/authority change
- no runtime enforcement or command blocking
- no Watch cadence or Watch receipt behavior change
- no collector invocation, actor Watch redirect, scheduled Watch redirect, or collector retirement
- no durable Discovery task/packet schema, dispatcher, queue, lease, or sequencer behavior change
- no Hydration, Observation, Assessment, support artifact, renderer UI, source-term rename, or protected-word JSON update

## HS411 Dev Handoff

Completed:

```txt
workspace/DevHS411-discovery-esi-backed-expansion-package-helper-extraction.md
```

Status: accepted by Overseer.

Remaining parked items:

- actor Watch runtime redirect remains parked
- scheduled Watch redirect remains parked
- collector retirement remains parked
- live/provider movement expansion remains parked
- durable Discovery task/packet schema and dispatcher work remain parked

## HS407 Evidence

Implemented the Discovery-owned pending-ref rehydration helper extraction.

Added:

- `src/main/discovery/candidateRefMemory.js`

Moved/re-homed helper surfaces:

- `pendingActorDiscovery(pendingRefs, plannerOutput)`
- `pendingSystemRadiusDiscovery(pendingRefs)`

Updated callers/imports:

- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`

Ownership proof:

```txt
src/main/discovery/candidateRefMemory.js now defines and exports:
  pendingActorDiscovery
  pendingSystemRadiusDiscovery

src/main/workers/actorWatchCollector.js imports pendingActorDiscovery from:
  ../discovery/candidateRefMemory

src/main/workers/systemRadiusCollector.js imports pendingSystemRadiusDiscovery from:
  ../discovery/candidateRefMemory
```

Focused source ownership check:

```txt
rg -n "pendingActorDiscovery|pendingSystemRadiusDiscovery|candidateRefMemory" src\main\workers src\main\discovery
```

Result:

- pending-ref rehydration helper definitions live in `src/main/discovery/candidateRefMemory.js`
- actor/system collectors import and call the helpers from the Discovery module
- old collector-local helper bodies were removed
- no repository method or candidate-ref status mutation logic was moved

Verification:

```txt
node --check src\main\discovery\candidateRefMemory.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\workers\systemRadiusCollector.js
rg -n "pendingActorDiscovery|pendingSystemRadiusDiscovery|candidateRefMemory" src\main\workers src\main\discovery
npm.cmd run verify:actor-watch
npm.cmd run verify:collector
npm.cmd run verify:manual-discovery
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-report
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:evidence-rules
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- all listed verification commands passed
- `npm.cmd run verify:service-registry` passed with a 300 second ceiling
- `npm.cmd run verify:enforcement-dry-run` remained complete: 113 commands covered, 0 gaps
- `npm.cmd run verify:protected-terms` completed with warning-only advisory output: 717 warnings across the current broad working set; no source-term rename or protected-word JSON update was performed
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git status --short --branch` showed branch `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS407-touched files

Boundary confirmation:

- no repository method move
- no candidate-ref status service
- no status-policy rewrite
- no `pendingDiscoveryRefs(...)`, `upsertDiscoveredKillmailRefs(...)`, selected/expanded/cached/failed mutation behavior, timestamp, failure count, or last-error behavior change
- no manual discovery or manual expansion change
- no `actor.watch` or `system.radius.watch` redirect
- no `runActorWatchService(...)` or `watchExecutor.dispatchFor(...)` change
- no collector invocation/rewrite/retirement
- no provider movement
- no Discovery ref write behavior change
- no Evidence/EVEidence write behavior change
- no Hydration/metadata write
- no `fetch_runs`, API logs, warnings, Watch cadence, Watch run records, or old summary result behavior change
- no schema, receipt machinery, Discovery task/packet persistence, dispatcher/queue/lease/worker behavior, command metadata/authority change, runtime enforcement, command blocking, UI, support artifact, source-term rename, or protected-word JSON update

## HS407 Review

Completed:

```txt
workspace/DevHS407-discovery-candidate-ref-pending-rehydration-helper-extraction.md
```

Accepted:

```txt
workspace/OverseerHS408-hs407-discovery-candidate-ref-pending-rehydration-helper-extraction-review.md
```

Status: Discovery candidate-ref pending rehydration helper extraction accepted.

HS407 result:

- pending-ref rehydration helper definitions now live under Discovery ownership in `src/main/discovery/candidateRefMemory.js`
- actor and system/radius collectors import pending-ref rehydration helpers from Discovery
- current actor/system collector behavior and result shapes are preserved
- manual discovery/manual expansion compatibility and candidate-ref status mutation behavior remain unchanged
- this remains helper ownership extraction only, not status service extraction, runtime redirect, collector retirement, provider movement, schema, receipt machinery, or task/packet persistence

Previous accepted seam:

HS403: Discovery zKill candidate acquisition helper extraction.

Accepted by:

```txt
workspace/OverseerHS404-hs403-discovery-zkill-candidate-acquisition-helper-extraction-review.md
```

Dev handoff:

```txt
workspace/DevHS403-discovery-zkill-candidate-acquisition-helper-extraction.md
```

Runway:

```txt
workspace/OverseerHS403-discovery-zkill-candidate-acquisition-helper-extraction-runway.md
```

Accepted result:

- `src/main/discovery/zkillCandidateAcquisition.js` now owns zKill candidate acquisition helpers.
- `discoverActorRefs(...)` and `discoverSystemRefs(...)` live under Discovery ownership.
- `actorWatchCollector.js`, `systemRadiusCollector.js`, and `manualDiscoveryWorker.js` import zKill acquisition helpers from Discovery.
- Manual discovery no longer imports zKill acquisition helpers from Watch collector modules.
- Old collector helper export surfaces remain only as compatibility aliases/imported surfaces.
- Existing mixed collector runtime behavior remains intact.

## Active Boundaries

Do not open or imply:

- default `actor.watch` redirect
- scheduled Watch redirect
- collector retirement
- collector invocation rewrite
- live/provider movement
- dispatcher / queue / lease / worker behavior
- Discovery task/packet persistence
- schema changes
- Evidence/EVEidence write behavior changes
- Hydration / metadata write behavior changes
- Watch cadence mutation
- runtime enforcement or command blocking
- renderer UI work
- support artifact work
- source-term rename
- protected-word JSON update

Current accepted model:

- Watch is a scheduler and scope-authority source.
- A due Watch emits Discovery pickup intent; it does not acquire candidates itself.
- Discovery is the provider-facing acquisition utility.
- Discovery services zKill candidate-lead acquisition and ESI-backed killmail/detail expansion lanes.
- Discovery refs are possible leads / provenance, not Evidence.
- Evidence/EVEidence is final landed memory from expanded ESI killmails and normalized rows.
- Hydration repairs readability and labels; it does not create Evidence.
- Observation derives local records into stories/readouts and should disclose basis.
- Assessment Memory is human-authored judgment, not Evidence.
- Raw IDs remain truthful facts; readable labels are applied attention.

Accepted Discovery outcome vocabulary for shaping:

- `complete_refs_found`
- `complete_no_refs`
- `partial_deferred`
- `provider_deferred`
- `held_by_external_io`
- `acquisition_capped`
- `failed_retryable`
- `failed_terminal`

`invalid_scope` belongs before Discovery acceptance at Intent / Scope Authority.

## Verification Posture

HS403 acceptance verification passed:

```txt
node --check src\main\discovery\zkillCandidateAcquisition.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\workers\systemRadiusCollector.js
node --check src\main\workers\manualDiscoveryWorker.js
npm.cmd run verify:actor-watch
npm.cmd run verify:collector
npm.cmd run verify:manual-discovery
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:watch-actor-compatibility-wrapper-adapter-fixture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:evidence-rules
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Notes:

- `verify:protected-terms` completed with warning-only advisory output across the broad current working set.
- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- Repo status remains noisy: `main...origin/main [ahead 19]` with a large uncommitted/untracked milestone stack.

## Next Candidate Seams

Recommended next options:

1. Compatibility summary / caller return path source trace.
   - Decide whether production actor Watch replacement can return the expected caller shape without reviving mixed collector ownership.
   - This is the calmest warm-start seam after HS419.

2. Narrow runtime-adapter implementation runway.
   - Only open if the return-path trace or orientation confirms the remaining gap is mechanical and bounded.
   - Expected boundary would still avoid scheduled Watch redirect, live/provider movement, and collector retirement unless explicitly authorized.

3. Discovery body map cleanup / source trace.
   - Optional rest-state cleanup if the next runtime-adapter decision feels too hot for immediate motion.

Do not open default runtime redirect, scheduled Watch redirect, collector retirement, live/provider movement expansion, dispatcher work, schema work, or enforcement until the next seam explicitly accepts that movement.

## Recovery Pointers

Primary active files:

- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS420-hs419-actor-watch-controlled-runtime-adapter-fixture-review.md`
- `workspace/DevHS419-actor-watch-controlled-runtime-adapter-fixture-proof.md`
- `workspace/OverseerHS419-actor-watch-controlled-runtime-adapter-fixture-proof-runway.md`
- `workspace/OverseerHS418-hs417-actor-watch-controlled-runtime-adapter-readiness-review.md`
- `workspace/EngineeringTraceHS417-actor-watch-controlled-runtime-adapter-readiness.md`
- `workspace/OverseerHS417-actor-watch-controlled-runtime-adapter-readiness-request.md`
- `workspace/OverseerHS416-hs415-actor-watch-discovery-route-body-fixture-proof-review.md`
- `workspace/DevHS415-actor-watch-discovery-route-body-fixture-proof.md`
- `workspace/OverseerHS415-actor-watch-discovery-route-body-fixture-proof-runway.md`
- `workspace/OverseerHS412-hs411-discovery-esi-backed-expansion-package-helper-extraction-review.md`
- `workspace/DevHS411-discovery-esi-backed-expansion-package-helper-extraction.md`
- `workspace/OverseerHS411-discovery-esi-backed-expansion-package-helper-extraction-runway.md`
- `workspace/OverseerHS410-hs409-esi-backed-expansion-package-helper-boundary-review.md`
- `workspace/EngineeringTraceHS409-esi-backed-expansion-package-helper-boundary.md`
- `workspace/OverseerHS409-esi-backed-expansion-package-helper-boundary-trace-request.md`
- `workspace/OverseerHS408-hs407-discovery-candidate-ref-pending-rehydration-helper-extraction-review.md`
- `workspace/DevHS407-discovery-candidate-ref-pending-rehydration-helper-extraction.md`
- `workspace/OverseerHS407-discovery-candidate-ref-pending-rehydration-helper-extraction-runway.md`
- `workspace/OverseerHS406-hs405-candidate-ref-memory-status-helper-ownership-review.md`
- `workspace/EngineeringTraceHS405-candidate-ref-memory-status-helper-ownership.md`
- `workspace/OverseerHS405-candidate-ref-memory-status-helper-ownership-trace-request.md`
- `workspace/OverseerHS404-hs403-discovery-zkill-candidate-acquisition-helper-extraction-review.md`
- `workspace/DevHS403-discovery-zkill-candidate-acquisition-helper-extraction.md`
- `workspace/OverseerHS403-discovery-zkill-candidate-acquisition-helper-extraction-runway.md`

Recent Discovery replacement chain:

- HS351 / HS352: Discovery boundary task-handling audit accepted.
- HS353: Discovery outcome shaping note.
- HS354 / HS355: Discovery outcome derivation feasibility accepted.
- HS356 / HS357: Discovery outcome derivation proof accepted.
- HS358: Discovery receipt shaping note.
- HS359 / HS360: Discovery receipt source trace accepted.
- HS361 / HS362: Discovery receipt data model accepted.
- HS363 / HS364: Discovery receipt projection fixture proof accepted.
- HS365: Discovery next-seam decision surface.
- HS366 / HS367: Discovery utility / Watch split readiness accepted.
- HS368 / HS369: Watch-to-Discovery acquisition split fixture accepted.
- HS370 / HS371: Discovery acquisition-to-Evidence handoff fixture accepted.
- HS372 / HS373: mixed Watch collector replacement plan accepted.
- HS374 / HS375: mixed collector replacement route preview accepted.
- HS376 / HS378: actor Watch first replacement/parity accepted.
- HS379 / HS380: Discovery ESI-backed expansion intake posture accepted.
- HS381 / HS384: actor Watch compatibility-wrapper contract/adapter fixture accepted.
- HS385 / HS392: Evidence/EVEidence writer landing and conflict behavior accepted.
- HS393 / HS396: actor Watch runtime redirect readiness and compatibility-wrapper command accepted.
- HS397 / HS398: Discovery helper ownership source trace accepted.
- HS399 / HS400: Discovery expansion queue helper extraction accepted.
- HS401 / HS402: zKill acquisition helper ownership trace accepted.
- HS403 / HS404: Discovery zKill candidate acquisition helper extraction accepted.
- HS405 / HS406: candidate-ref memory/status helper ownership trace accepted.

Older detailed `current.md` material lives in:

```txt
workspace/archive/current-legacy-2026-06-07-pre-flatten.md
```

## Dot Command

On `.` as Overseer:

1. Refresh `workspace/current.md` and `workspace/overview.md`.
2. If a Dev handoff has landed, review it.
3. If no handoff is pending, present or shape the next bounded seam.
4. Do not create a Dev runway unless the next seam is coherent.
