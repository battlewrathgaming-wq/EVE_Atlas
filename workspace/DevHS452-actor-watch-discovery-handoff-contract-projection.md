# DevHS452 - Actor Watch / Discovery Handoff Contract Projection

Status: ready for Overseer review
Date: 2026-06-12
Executor: Dev

## Summary

Added a read-only / fixture-only projection proof for the actor Watch / Discovery handoff contract.

New command:

```txt
watch.actor_discovery_handoff_contract.preview
```

The command projects current actor Watch direct and scheduled outputs into explicit boundary shapes:

```txt
actor_watch_discovery_request
actor_watch_discovery_receipt
```

It preserves the existing 22-field actor Watch compatibility summary only under:

```txt
receipt.compatibility_summary
```

and labels that compatibility surface as temporary/debug, not doctrine or future contract authority.

## Files Changed

HS452 files:

```txt
src/main/services/watchActorDiscoveryHandoffContractService.js
scripts/verify-watch-actor-discovery-handoff-contract.js
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-service-registry.js
scripts/verify-command-authority.js
scripts/verify-passive-side-effects.js
package.json
workspace/current.md
workspace/DevHS452-actor-watch-discovery-handoff-contract-projection.md
```

Existing broad working tree remains noisy from earlier milestone work.

## Contract Projection Shape

Request projection:

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

Receipt projection:

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

Ownership split:

- Watch-owned request fields: source, command, actor scope, lookback window, caps, watch id/scope key or direct request basis.
- Discovery-owned receipt fields: candidate counts, pending counts, selected-ref expansion counts, Evidence/EVEidence landing counts, API count posture, warnings, outcome, and compatibility summary.

## Direct Projection Evidence

Direct projection reports:

```txt
caller: runActorWatchService -> runActorWatchDirectBody
request.model: actor_watch_discovery_request
request.source: direct_actor_watch
receipt.model: actor_watch_discovery_receipt
receipt.outcome.code: complete_refs_found
```

Direct request basis stays direct-only:

```txt
basis.watch_id: null
basis.scope_key: null
basis.direct_request_basis: fixture actor.watch payload projected from production-like direct body proof
```

## Scheduled Projection Evidence

Scheduled projection reports:

```txt
caller: WatchSessionExecutor.tick -> dispatchFor(actor) -> runScheduledActorWatch -> runActorWatchDirectBody
request.model: actor_watch_discovery_request
request.source: scheduled_actor_watch
receipt.model: actor_watch_discovery_receipt
receipt.outcome.code: complete_refs_found
```

Scheduled request basis carries Watch provenance:

```txt
basis.watch_id: fixture-watch-452
basis.scope_key: character:<fixture actor id>
```

Current scheduled caller shape is disclosed as compatibility posture only:

```txt
{ status, data: { watch, collection } }
```

## Compatibility Posture

The proof preserves compatibility field parity:

```txt
compatibility_posture.field_count: 22
compatibility_posture.field_parity.matches: true
contract_projection_shape.compatibility_summary_nested: true
contract_projection_shape.compatibility_summary_is_future_contract: false
```

Temporary/debug compatibility fields are named under:

```txt
compatibility_posture.temporary_debug_fields
```

This includes old caller/collector-shaped language such as:

```txt
collection
collection_plan
expansion_queue
expansion_queue_summary
zkill_refs_discovered
zkill_discovery_skipped
production compatibility summary
direct body
runScheduledActorWatch
```

## Sample Output

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

Enforcement dry-run coverage now reports:

```txt
total_commands: 117
covered_commands: 117
gap_commands: []
```

## Verification

Passed:

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

Final workspace checks after handoff write:

```txt
git diff --check
git status --short --branch
```

Results:

- `git diff --check` passed with CRLF normalization warnings only.
- `git status --short --branch` reported `main...origin/main [ahead 19]` with the existing broad uncommitted/untracked milestone stack plus HS452 files.

## Boundary Confirmation

Confirmed:

- read-only command surface only
- fixture/fake-client proof basis only
- no live/provider calls
- no operator corpus writes
- no Discovery ref writes
- no Evidence/EVEidence writes
- no Hydration writes
- no Watch execution
- no Watch dispatch
- no task creation
- no TaskRunner method calls
- no Watch mutation
- no runtime behavior change
- no direct actor.watch redirect by this proof
- no scheduled actor Watch redirect by this proof
- no `collectActorWatch(...)` retirement
- no system/radius Watch redirect
- no schema change
- no durable receipt/task/packet persistence
- no dispatcher/queue/lease behavior
- no runtime enforcement or command blocking
- no renderer UI
- no source-term rename
- no protected-word JSON update

## Risks / Follow-Up

The projection is intentionally non-authoritative. It proves a coherent contract shape over current compatibility output, but runtime callers still return compatibility-shaped data today.

Recommended next action:

Overseer review should decide whether to accept this projected request/receipt language as the next shaping aid before any Watch trimming, caller return-path change, or collector retirement packet.
