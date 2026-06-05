# OverseerHS330 Watch Runtime Movement Readiness Advisory Request

Status: open advisory request
Date: 2026-06-06
Role: Overseer
Executor: Engineering / Data Engineering / Security advisory

## Purpose

Review whether the current Atlas Watch setup-to-runtime-planning chain is coherent enough to build on before any execution-adjacent Dev work is opened.

This is assurance and proof shaping only. It should not implement code.

## Context

Atlas has accepted the following Watch chain:

```txt
topology preflight
-> explicit operator confirmation
-> stored included_system_ids
-> post-create readout
-> authored execution readiness
-> readout/readiness bridge
-> runtime packet plan preview
```

Recent accepted artifacts:

- `workspace/OverseerHS312-watch-create-accepted-scope-mutation-contract-runway.md`
- `workspace/OverseerHS313-hs312-watch-create-accepted-scope-review.md`
- `workspace/OverseerHS314-authored-watch-execution-readiness-runway.md`
- `workspace/OverseerHS315-hs314-authored-watch-execution-readiness-review.md`
- `workspace/OverseerHS316-watch-operator-confirmation-listen-hook-contract-runway.md`
- `workspace/OverseerHS317-hs316-watch-operator-confirmation-contract-review.md`
- `workspace/OverseerHS318-renderer-system-watch-confirmation-path-runway.md`
- `workspace/OverseerHS319-hs318-renderer-system-watch-confirmation-path-review.md`
- `workspace/OverseerHS320-system-watch-post-create-readout-runway.md`
- `workspace/OverseerHS321-hs320-system-watch-post-create-readout-review.md`
- `workspace/OverseerHS322-system-watch-readout-readiness-bridge-runway.md`
- `workspace/OverseerHS323-hs322-system-watch-readout-readiness-bridge-review.md`
- `workspace/OverseerHS324-invalid-stored-scope-authority-normalization-runway.md`
- `workspace/OverseerHS325-hs324-invalid-stored-scope-normalization-review.md`
- `workspace/OverseerHS327-watch-runtime-packet-plan-preview-runway.md`
- `workspace/OverseerHS328-hs327-watch-runtime-packet-plan-review.md`
- `workspace/OverseerHS329-watch-runtime-next-seam-decision-surface.md`

Relevant read-only commands:

- `watch.system_radius_setup_readout.preview`
- `watch.authored_execution_readiness.preview`
- `watch.system_radius_readout_readiness_bridge.preview`
- `watch.runtime_packet_plan.preview`
- `runtime.watch_task_outcome_map.preview`
- `watch.scope_authority_conformance.preview`

## Accepted Boundaries

- Stored `included_system_ids` are accepted Watch scope authority.
- Center/radius are provenance and management after acceptance.
- Invalid stored scope creates no accepted/usable runtime systems.
- Waiting is not failure.
- Runtime packet plan preview is not dispatch.
- Watch/task outcome map is read-only posture, not durable result semantics.
- Discovery outputs possible leads.
- Evidence Expansion outputs Evidence/EVEidence.
- Hydration outputs readability repair.
- Fourth lane stays parked.
- External I/O off should hold provider-backed movement and must not trigger catch-up flooding when restored.

## Advisory Task

Review the current docs and source for the accepted Watch chain and answer whether Atlas has enough proof to build the next execution-adjacent seam.

Focus on source-backed assurance, not broad architecture invention.

Answer:

1. Does the current read-only chain prove enough to build on?
2. What does `watch.runtime_packet_plan.preview` prove that is trustworthy?
3. What does it not prove?
4. Is a no-dispatch executor/tick dry-run the right next proof?
5. If yes, what should that proof show beyond HS327?
6. If no, what should be proven first?
7. What current facts must be present before any task creation proof?
8. How should External I/O, storage setup, provider/live gate, Watch cadence, and no-catch-up-flood posture constrain the next movement proof?
9. Where could current readouts give false confidence?
10. Are there source-code gaps between the readouts and future executor behavior?
11. What should remain parked until live/provider testing?
12. What is the smallest safe next Dev packet, if any?

## Specific Assurance Questions

Check whether current proof covers:

- accepted stored scope authority;
- invalid stored scope blocking;
- inactive/not-due/backoff waiting as not failure;
- actor Watch plan shape;
- system/radius Watch plan shape;
- External I/O held posture relevance;
- storage/setup relevance;
- provider gate relevance;
- task creation still unopened;
- dispatch still unopened;
- durable Watch result semantics still unopened;
- center-only Discovery ref identity limitation;
- no provider calls;
- no writes.

Check whether current proof does not yet cover:

- actual executor/tick behavior;
- task creation safety;
- dispatcher/collector call boundary;
- provider pacing;
- retry/capacity response handling;
- live zKill or ESI results;
- durable Watch result identity;
- post-run outcome persistence;
- support artifact content for this runtime movement.

## Do Not

- implement code
- create Dev runway
- call providers
- perform live/API testing
- dispatch Watch execution
- arm runtime
- create tasks
- mutate Watch rows
- mutate Discovery refs
- write Evidence/EVEidence
- write Hydration/metadata labels
- change schema
- update renderer UI
- activate runtime enforcement
- create support artifacts
- update protected-word JSON
- reopen fourth-lane behavior

## Expected Artifact

Create:

```txt
workspace/EngineeringDataSecurityHS330-watch-runtime-movement-readiness-advisory.md
```

The artifact should include:

1. Executive recommendation.
2. Current chain assurance summary.
3. What HS327 proves.
4. What HS327 does not prove.
5. Source-code gaps or false-confidence risks.
6. Whether a no-dispatch executor/tick dry-run is the right next proof.
7. Smallest safe next Dev packet, if any.
8. Acceptance criteria for that packet.
9. Verification commands/evidence expected.
10. Parked items.
11. Human/Overseer decisions needed.

## Acceptance Criteria

The advisory is acceptable if it:

- grounds findings in current docs/source;
- preserves Atlas terms and boundaries;
- keeps Watch execution, provider movement, writes, schema, and UI unopened;
- distinguishes proof from execution;
- identifies whether current machinery is coherent enough to build on;
- recommends either a bounded next proof or a reason to stop.
