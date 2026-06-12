# OverseerHS363 - Discovery Receipt Projection Fixture Proof Runway

Status: opened
Date: 2026-06-07
Role: Overseer
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev

## Purpose

Prove the accepted Discovery receipt model as a fixture-only, non-durable shape before any runtime provider movement, schema, dispatcher, Watch schedule advancement, or UI work.

This packet should make the next Discovery seam concrete:

```txt
fixture pickup packets
-> fixture provider-return outcomes
-> canonical Discovery receipt basis
-> requested safe projection
```

## Context

Accepted model:

- Discovery owns the canonical receipt basis.
- Callers may request safe projections from that basis.
- Projection is performance/presentation shaping only, not meaning ownership.
- Discovery reports facts and limits; it does not report caller satisfaction.
- Candidate refs are possible leads, not Evidence/EVEidence and not task memory.
- ESI Evidence Expansion is not Discovery completion.
- `held_by_external_io` is request-level pre-acquisition posture, not a packet outcome for this proof.
- Packet outcomes roll up into top-level receipt counts/posture fields.
- No separate task-outcome truth vocabulary is needed now.
- No schema for this proof.

Read:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/OverseerHS358-discovery-receipt-model-shaping-note.md`
- `workspace/EngineeringTraceHS359-discovery-receipt-task-packet-source-trace.md`
- `workspace/OverseerHS360-hs359-discovery-receipt-source-trace-review.md`
- `workspace/DataEngineeringHS361-discovery-receipt-basis-projection-model.md`
- `workspace/OverseerHS362-hs361-discovery-receipt-data-model-review.md`
- `workspace/DevHS356-discovery-outcome-derivation-proof.md`
- `src/main/services/watchDiscoveryPickupPacketProofService.js`
- `src/main/services/discoveryPickupConsumerFixtureService.js`
- `src/main/services/discoveryOutcomeDerivationService.js`
- service registry / command authority / passive side-effect / enforcement dry-run patterns

## Task

Add a read-only/local-only fixture proof command that consumes fixture Discovery pickup packets and fixture provider-return outcomes, then emits:

1. one canonical Discovery receipt basis
2. one requested projection

Suggested command:

```txt
discovery.receipt_projection_fixture.preview
```

Suggested verifier:

```txt
verify:discovery-receipt-projection-fixture
```

## Required Receipt Shape

The canonical receipt basis should include, where applicable:

- `receipt_id`
- `receipt_model_version`
- `generated_at`
- `source_intent_kind`
- `source_intent_id`
- `source_run_id`
- `source_watch_id`
- `projection_requested`
- `projection_emitted`
- `scope_key`
- `scope_basis`
- `requested_window`
- `provider_path`
- `request_posture`
- `hold_reason`
- `held_before_acquisition`
- `accepted_packet_count`
- `attempted_packet_count`
- `completed_packet_count`
- `packet_outcomes_emitted`
- `packet_outcome_counts`
- `ref_count`
- bounded `candidate_ref_handles`
- `deferred_count`
- `retryable_count`
- `failed_terminal_count`
- `cap_basis`
- `missing_basis_flags`
- `confidence`
- `boundary_flags`
- `packets`

Packet receipt entries should include, where applicable:

- `packet_id`
- `packet_index`
- `packet_count`
- `packet_scope_key`
- target anchor such as `candidate_system_id`
- `provider`
- `provider_target`
- `lookback_window`
- `cap_summary`
- `attempted_at`
- `completed_at`
- `outcome`
- `outcome_basis`
- `refs_found_count`
- bounded `candidate_ref_handles`
- `deferred_reason`
- `failure_class`
- `retry_after_or_next_eligible_at`
- `missing_basis_flags`

## Outcome Vocabulary

Attempted acquisition packet outcomes:

- `complete_refs_found`
- `complete_no_refs`
- `partial_deferred`
- `provider_deferred`
- `acquisition_capped`
- `failed_retryable`
- `failed_terminal`

Do not emit `held_by_external_io` as a packet outcome.

`held_by_external_io` should appear only as request-level pre-acquisition posture:

- `request_posture: held_by_external_io`
- `held_before_acquisition: true`
- `attempted_packet_count: 0`
- `completed_packet_count: 0`
- `packet_outcomes_emitted: false`
- `packet_outcome_counts: {}`

`invalid_scope` remains pre-Discovery and should not be emitted as a Discovery completion outcome.

## Projection Profiles

Support these temporary engineering projection names:

- `minimal`
- `watch_summary`
- `operator_detail`
- `debug_basis`

Projection rules:

- Projections are safe views over the same canonical receipt basis.
- Projection may omit volume, not safety.
- Projection must not transfer meaning ownership to Watch, Manual, Observation, UI, or future callers.
- Projection must not imply full coverage when capped, partial, deferred, failed, held, or missing basis.

Safety fields or equivalents must remain visible when relevant:

- request posture / hold reason
- accepted / attempted / completed packet denominators
- packet outcome counts when packet details are omitted
- missing basis flags and confidence
- cap basis
- provider defer/failure/retry uncertainty
- source/scope basis
- candidate-ref boundary
- ESI Evidence Expansion boundary
- omitted-field note for smaller projections

## Required Fixture Cases

Verifier should cover at least:

- actor pickup with refs found
- actor pickup with no refs
- system/radius pickup with one packet per accepted included system ID
- mixed system/radius rollup across multiple packet outcomes
- provider deferred
- acquisition capped
- retryable failure
- terminal failure
- External I/O held pre-acquisition case with no packet outcomes emitted
- projection safety for `minimal`
- projection safety for `watch_summary`
- fuller packet detail for `operator_detail`
- full bounded basis for `debug_basis`

## Boundaries

Do not:

- call providers
- run live/API calls
- execute Watch
- invoke Watch dispatch runners or collectors
- mutate Watch schedule/state
- write `discovered_killmail_refs`
- write Evidence/EVEidence
- write Hydration/metadata labels
- write API logs/warnings
- create or mutate durable Discovery task/packet schema
- create queues, dispatchers, leases, or runtime provider work
- create support artifacts
- change renderer UI
- activate runtime enforcement or command blocking
- rename Atlas terms
- update protected-word JSON
- treat Discovery completion as Evidence/Hydration/Observation/Assessment completion
- treat caller projection as caller ownership of Discovery meaning

## Verification

Run focused checks:

- `node --check` for any new service/script and changed registry/authority files
- `npm.cmd run verify:discovery-receipt-projection-fixture`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:enforcement-dry-run`
- `npm.cmd run verify:protected-terms`
- `git diff --check`
- `git status --short --branch`

## Expected Handoff

Create:

```txt
workspace/DevHS363-discovery-receipt-projection-fixture-proof.md
```

The handoff should include:

- command added
- verifier added
- fixture cases covered
- sample canonical receipt basis
- sample `minimal`, `watch_summary`, `operator_detail`, and `debug_basis` projections
- boundary evidence
- verification commands and results
- explicit statement that no provider call, DB write, schema, Watch mutation, Evidence/EVEidence, Hydration, Observation, UI, dispatcher, enforcement, or support artifact behavior was opened

## Stop Conditions

Stop and report if the proof requires:

- provider/live calls
- durable task/packet schema
- real Watch execution
- Watch schedule mutation
- DB writes
- schema changes
- dispatcher/queue/lease behavior
- treating candidate refs as task memory
- treating ESI Evidence Expansion as Discovery completion
