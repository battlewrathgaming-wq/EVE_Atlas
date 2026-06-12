# OverseerHS356 - Discovery Outcome Derivation Proof Runway

Status: active Dev runway
Date: 2026-06-06

Executor: Dev

Expected handoff:

```text
workspace/DevHS356-discovery-outcome-derivation-proof.md
```

## Task

Add a read-only/local-only Discovery outcome derivation proof that derives coarse Discovery outcome posture from existing local rows and recent proof shapes, with explicit confidence and missing-basis flags.

Suggested command:

```text
discovery.outcome_derivation.preview
```

Suggested verifier:

```text
verify:discovery-outcome-derivation
```

## Purpose

Show what Atlas can derive today as a confidence-marked completion stub/readout from existing rows, and expose where current rows cannot prove Discovery task/packet outcomes.

Accepted basis:

- `workspace/EngineeringAuditHS351-discovery-boundary-task-handling-trace.md`
- `workspace/OverseerHS352-hs351-discovery-boundary-audit-review.md`
- `workspace/OverseerHS353-discovery-outcome-model-shaping-note.md`
- `workspace/EngineeringAuditHS354-discovery-outcome-derivation-feasibility.md`
- `workspace/OverseerHS355-hs354-discovery-outcome-derivation-review.md`

## Required Output Shape

The preview should return a structured readout with:

- source intent kind where derivable
- source ID / Watch ID / run ID where derivable
- approximate scope key where derivable
- task-level derived outcome candidate
- task-level confidence
- packet-level derivability summary
- discovered ref count
- candidate ref handles or sampled refs where safe
- zKill API call count where derivable
- ESI API call count only as non-Discovery context
- warning/error summary where available
- missing-basis flags
- explicit boundary text

Likely useful missing-basis flags:

- `packet_outcome_not_proven`
- `no_ref_not_represented`
- `provider_deferred_not_normalized`
- `held_by_external_io_posture_only`
- `cap_basis_summary_only`
- `candidate_refs_are_not_task_memory`
- `esi_expansion_not_discovery_completion`

## Outcome Vocabulary

Use this Discovery outcome vocabulary:

- `complete_refs_found`
- `complete_no_refs`
- `partial_deferred`
- `provider_deferred`
- `held_by_external_io`
- `acquisition_capped`
- `failed_retryable`
- `failed_terminal`

Do not use `invalid_scope` as a Discovery outcome. Invalid scope belongs before Discovery acceptance at Intent / Scope Authority.

## Required Cases

At minimum, cover fixture/local cases for:

1. actor-like run with refs found
2. actor-like run with no refs derivable at coarse level
3. system/radius with refs found for some systems but packet completion not proven
4. warning/deferred posture where provider deferral is not normalized as Discovery packet outcome
5. cap/limit posture where `acquisition_capped` is only summary-supported
6. ESI expansion success/failure present but explicitly outside Discovery completion
7. no accepted durable packet rows, proving per-packet completion is not product-grade derivable

## Boundary

This packet is read-only/local-only and derivation-only.

Do not:

- call zKillboard, ESI, or any provider
- run live/API calls
- execute Watch
- arm/disarm Watch
- invoke Watch dispatch runners or collectors
- mutate Watch rows or Watch schedule posture
- write `discovered_killmail_refs`
- write Evidence/EVEidence
- write Hydration/metadata labels
- write API logs or warnings
- create `discovery_task` or `discovery_task_packet` schema
- create a queue, dispatcher, lease, task, or packet persistence layer
- create support artifacts
- change renderer/UI
- activate runtime enforcement or command blocking
- rename source-owned terms
- update protected-word JSON
- treat Discovery completion as Evidence, Hydration, Observation, or Assessment completion

Stop if the proof requires provider movement, durable task/packet schema, live Watch execution, Watch schedule mutation, or per-packet completion claims that current rows cannot prove.

## Verification

Recommended minimum verification:

```text
node --check src\main\services\[new-service-file].js
node --check scripts\verify-discovery-outcome-derivation.js
npm.cmd run verify:discovery-outcome-derivation
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If a new service command is added, update command authority, service registry, passive side-effect coverage, and enforcement dry-run coverage as appropriate.

