# OverseerHS372 - Mixed Watch Collector Replacement Planning Request

Status: open
Date: 2026-06-07
Role: Overseer
Executor: Engineering / Data Engineering advisory

## Purpose

Plan the staged replacement of legacy mixed Watch collector runtime paths without starting implementation.

The goal is correctness and cohesive boundary terminology over preserving legacy collector shape for convenience.

## Context

Atlas still has mixed Watch collector paths that bundle multiple responsibilities:

- Watch intent/cadence
- zKill acquisition
- Discovery ref persistence
- ESI-backed killmail/detail expansion
- Evidence/EVEidence writes
- run posture
- support logging

Accepted model:

```txt
Watch = intent source, scheduler, accepted scope/cadence authority.
Discovery = provider-facing acquisition utility with two service lanes: zKill candidate lead acquisition and ESI-backed killmail/detail expansion.
Evidence/EVEidence = final landed memory.
```

Accepted direction:

- Watch should not collect.
- Watch should emit intent into Discovery.
- Discovery should acquire candidate leads and service selected candidate expansion through its ESI-backed expansion lane.
- Evidence/EVEidence is only final landed memory.
- Legacy mixed collectors are scaffolding, not the future runtime model.

Terminology:

- `redirect` means a temporary compatibility or migration step where old command entry points route into new boundary-owned flows.
- `retire` means the intended end-state where old mixed collectors no longer shape the runtime model or terminology.
- `replacement` is the preferred planning word for this phase because old mixed collector semantics are being displaced, not preserved.

## Accepted Proof Chain To Read

- `workspace/OverseerHS369-hs368-watch-discovery-split-fixture-review.md`
- `workspace/OverseerHS371-hs370-discovery-acquisition-to-evidence-handoff-review.md`
- `workspace/DevHS368-watch-to-discovery-acquisition-split-fixture-bridge.md`
- `workspace/DevHS370-discovery-acquisition-to-evidence-handoff-fixture.md`

Relevant source/code areas:

- current Watch collectors and runner paths
- `actor.watch`
- `system.radius.watch`
- Discovery pickup/receipt fixture services
- Evidence repository / ESI expansion entry points
- service registry / command authority metadata

## Task

Perform a source-trace and planning pass.

Answer:

1. Which current mixed collector functions/commands still bundle Watch, Discovery zKill acquisition, Discovery ESI-backed expansion, Evidence writes, and run posture?
2. What exact responsibilities must move to Discovery's zKill candidate-lead acquisition lane?
3. What exact responsibilities must move to Discovery's ESI-backed killmail/detail expansion lane?
4. What responsibilities should remain with Watch?
5. What responsibilities should remain with Evidence/EVEidence repository/writer logic?
6. What can be temporarily redirected for compatibility, and what should be fully retired?
7. What is the smallest staged replacement slice that can be implemented first without provider movement?
8. What proof already exists from HS368/HS370, and what proof is still missing?
9. What terms, command names, or function names risk preserving the old mixed-collector model?
10. What should remain parked?

## Required Posture

This is advisory only.

Do not:

- edit files
- implement replacement
- retire or redirect collectors
- call providers
- run live Watch
- create tasks
- mutate Watch rows
- write Discovery refs
- write Evidence/EVEidence
- perform live/provider ESI-backed expansion
- write Hydration/metadata
- change schema
- change service registry
- change command authority
- change UI
- update protected-word JSON

## Expected Output

Create:

```txt
workspace/EngineeringTraceHS372-mixed-watch-collector-replacement-plan.md
```

The artifact should include:

1. Executive recommendation.
2. Current mixed collector source trace.
3. Responsibility split by boundary: Watch, Discovery zKill lead-acquisition lane, Discovery ESI-backed expansion lane, Evidence/EVEidence writer/memory, support logging/provenance.
4. Replacement stages.
5. Smallest first no-provider implementation candidate.
6. Redirect vs retire recommendation.
7. Missing proofs / assurance needs.
8. Risks and tradeoffs.
9. Parked items.
10. Human/Overseer decisions needed.
