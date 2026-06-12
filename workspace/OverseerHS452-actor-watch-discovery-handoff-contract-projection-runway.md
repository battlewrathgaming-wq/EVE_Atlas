# OverseerHS452 - Actor Watch / Discovery Handoff Contract Projection Runway

Status: open
Date: 2026-06-12
Executor: Dev
Expected handoff: `workspace/DevHS452-actor-watch-discovery-handoff-contract-projection.md`

## Purpose

Prove the actor Watch / Discovery boundary can expose a clear request/receipt contract without changing runtime behavior.

HS450 found that the current redirected actor Watch path works, but still returns old compatibility-shaped language. This packet should project the current behavior into explicit boundary language:

```txt
actor_watch_discovery_request
actor_watch_discovery_receipt
```

## Required Work

Add a read-only / fixture-only proof that projects existing actor Watch direct and scheduled outputs into a stable handoff shape.

The proof should show:

- Watch-owned request fields
- Discovery-owned acquisition/expansion result fields
- direct caller projection
- scheduled caller projection
- current 22-field compatibility summary preserved under `compatibility_summary`
- compatibility fields remain temporary/debug, not doctrine

Suggested command/action naming:

```txt
watch.actor_discovery_handoff_contract.preview
```

Suggested verifier:

```txt
npm.cmd run verify:watch-actor-discovery-handoff-contract
```

Implementation may use existing fixture/fake-client proof patterns. It must not call live providers or mutate the operator corpus.

## Contract Shape To Prove

Request projection candidate:

```js
{
  model: 'actor_watch_discovery_request',
  source: 'direct_actor_watch' | 'scheduled_actor_watch',
  command: 'actor.watch',
  actor: {
    entity_type,
    entity_id,
    entity_name
  },
  window: {
    lookback_seconds
  },
  caps: {
    max_refs,
    max_expansions
  },
  basis: {
    watch_id,
    scope_key,
    direct_request_basis
  }
}
```

Receipt projection candidate:

```js
{
  model: 'actor_watch_discovery_receipt',
  run_id,
  actor,
  request_window,
  caps,
  candidate_ref_counts,
  pending_ref_counts,
  selection_counts,
  evidence_landing_counts,
  api_counts,
  warnings,
  outcome,
  compatibility_summary
}
```

The exact field names may be adjusted if the codebase has a clearer local convention, but the proof must preserve the ownership split.

## Boundaries

Do not add:

- runtime behavior changes
- provider/live calls
- operator corpus writes
- schema changes
- durable receipt/task/packet persistence
- dispatcher/queue/lease behavior
- `collectActorWatch(...)` retirement
- system/radius Watch redirect
- Watch executor redesign
- Evidence writer redesign
- Hydration writes
- Observation/report changes
- Assessment behavior
- renderer UI
- runtime enforcement / command blocking
- source-term rename
- protected-word JSON changes

Do not make the 22-field compatibility summary the future contract. It should be nested or clearly labeled as compatibility-only.

## Verification

Run focused checks:

```powershell
node --check <new verifier>
node --check <new/changed source files>
npm.cmd run verify:watch-actor-discovery-handoff-contract
npm.cmd run verify:watch-actor-scheduled-redirect
npm.cmd run verify:watch-actor-direct-redirect
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
npm.cmd run verify:watch-executor
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
git status --short --branch
```

## Stop Conditions

Stop and report if:

- the projection cannot be built without runtime changes
- the proof requires live/provider calls
- direct and scheduled outputs cannot share a coherent projection shape
- compatibility fields cannot be cleanly separated from request/receipt fields
- the work starts to imply collector retirement, durable task persistence, schema, dispatcher, or UI changes

## Expected Handoff

Create:

```txt
workspace/DevHS452-actor-watch-discovery-handoff-contract-projection.md
```

Include:

- files changed
- contract projection shape produced
- direct/scheduled projection evidence
- compatibility fields preserved and labeled temporary
- verification commands and results
- boundary confirmation
