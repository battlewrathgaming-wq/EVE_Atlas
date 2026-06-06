# DevHS342 Discovery Intake Consumer Stub Candidates

Status: complete
Date: 2026-06-06
Role: Dev

## Scope

Implemented HS342 as a read-only/local-only proof that consumes Watch Discovery bus input envelopes and produces stub candidate refs as plain data.

Core boundary preserved:

- Discovery intake consumer may produce stub candidate refs.
- Stub candidate refs are not durable Discovery refs.
- Stub candidate refs are not Evidence/EVEidence.
- The shape remains shared candidate intake, not Watch-only Discovery intake machinery.

## Files Changed

- `package.json`
- `src/main/services/discoveryIntakeConsumerStubCandidateService.js`
- `scripts/verify-discovery-intake-consumer-stub-candidates.js`
- `workspace/current.md`
- `workspace/DevHS342-discovery-intake-consumer-stub-candidates.md`

## Helper / Proof Shape Added

Added `buildDiscoveryIntakeConsumerStubCandidateProof(...)` in `src/main/services/discoveryIntakeConsumerStubCandidateService.js`.

Added verifier command:

```txt
npm.cmd run verify:discovery-intake-consumer-stub-candidates
```

The proof composes HS340 `buildWatchDiscoveryBusInputEnvelopeProof(...)` and emits deterministic local `zkill_stub` candidate refs only when a valid bus input envelope exists. It is not registered as a renderer/product service command.

The proof reports:

- `read_only: true`
- `mutates_state: false`
- `fixture_only_source: true`
- `renderer_eligible: false`
- `candidate_refs_emitted`
- `candidate_refs`
- `candidate_output_status`
- `candidate_output_reason`
- `invalid_stored_scope_blocks_before_candidates`
- no-provider/no-durable-ref/no-Evidence/no-write boundary counters
- before/after durable Atlas table counts

## Sample Actor Stub Candidate Output

```json
{
  "killmail_id": 400340001,
  "killmail_hash": "hs342_actor_stub_hash_001",
  "provider": "zkill_stub",
  "source_lane": "watch",
  "source_kind": "actor",
  "scope_key": "actor:character:90000001",
  "watch_id": 1,
  "lookback_seconds": 1209600,
  "caps": {
    "max_refs": 5,
    "max_expansions": 5
  },
  "candidate_only": true,
  "stub_only": true,
  "durable_ref_written": false,
  "evidence_created": false,
  "provider_movement": false,
  "entity_type": "character",
  "entity_id": 90000001,
  "entity_name": "Stub Candidate Pilot"
}
```

## Sample System/Radius Stub Candidate Output

```json
{
  "killmail_id": 500340001,
  "killmail_hash": "hs342_system_stub_hash_001",
  "provider": "zkill_stub",
  "source_lane": "watch",
  "source_kind": "system_radius",
  "scope_key": "system:30003597:radius:1",
  "watch_id": 1,
  "lookback_seconds": 86400,
  "caps": {
    "max_systems": 3,
    "max_refs_per_system": 2,
    "max_expansions": 6
  },
  "candidate_only": true,
  "stub_only": true,
  "durable_ref_written": false,
  "evidence_created": false,
  "provider_movement": false,
  "accepted_system_ids": [
    30003597,
    30003599,
    30003601
  ],
  "candidate_system_id": 30003597,
  "accepted_scope_source": "stored_watch_scope",
  "center_system_id": 30003597,
  "radius_jumps": 1,
  "center_radius_role": "provenance_and_management",
  "center_radius_used_as_authority": false
}
```

## Invalid Stored Scope Result

Malformed stored system/radius scope emits no stub candidates:

```json
{
  "candidate_output_status": "blocked_no_candidate_refs",
  "candidate_output_reason": "watch_scope_authority_invalid",
  "candidate_refs_emitted": 0,
  "candidate_refs": []
}
```

The proof reports `invalid_stored_scope_blocks_before_candidates: true`.

## Blocked / Idle State Treatment

The verifier proves no stub candidate refs are emitted for:

- disarmed session
- active task
- live/provider gate disabled
- no due watches
- inactive Watch rows
- not-due Watch rows
- backoff Watch rows

These states report `blocked_no_candidate_refs` and preserve the underlying no-candidate reason from the source bus input proof.

## No-Provider / No-Durable-Ref / No-Evidence Proof

The proof explicitly reports:

- `provider_movement: false`
- `watch_execution: false`
- `dispatch_runner_invoked: false`
- `collectors_called: false`
- `provider_calls: 0`
- `live_api_calls: 0`
- `zkill_calls: 0`
- `esi_calls: 0`
- `durable_discovery_refs_written: false`
- `discovery_refs_written: false`
- `discovered_killmail_refs_written: 0`
- `discovery_refs_mutated: 0`
- `evidence_created: false`
- `evidence_writes: 0`
- `hydration_writes: 0`
- `metadata_writes: 0`
- `api_request_log_writes: 0`
- `data_quality_warning_writes: 0`

## Mutation Boundary Proof

Focused verification captures before/after table counts for known Atlas durable tables and proves they are unchanged for emitted, invalid, blocked, and idle cases.

Observed sample system/radius table proof:

```json
{
  "before": {
    "killmails": 0,
    "activity_events": 0,
    "discovered_killmail_refs": 0,
    "fetch_runs": 0,
    "api_request_logs": 0,
    "metadata_runs": 0,
    "ingestion_audits": 0,
    "data_quality_warnings": 0,
    "entities": 0,
    "watchlist_entities": 0,
    "system_watches": 1,
    "assessment_artifacts": 0
  },
  "after": {
    "killmails": 0,
    "activity_events": 0,
    "discovered_killmail_refs": 0,
    "fetch_runs": 0,
    "api_request_logs": 0,
    "metadata_runs": 0,
    "ingestion_audits": 0,
    "data_quality_warnings": 0,
    "entities": 0,
    "watchlist_entities": 0,
    "system_watches": 1,
    "assessment_artifacts": 0
  },
  "unchanged": true
}
```

## Verification

Commands run:

```txt
node --check src\main\services\discoveryIntakeConsumerStubCandidateService.js
node --check scripts\verify-discovery-intake-consumer-stub-candidates.js
npm.cmd run verify:discovery-intake-consumer-stub-candidates
npm.cmd run verify:watch-discovery-bus-input-envelope
npm.cmd run verify:watch-task-creation-fixture-proof
npm.cmd run verify:watch-task-creation-boundary
npm.cmd run verify:watch-packet-dry-run-dispatch-parity
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- `node --check` commands passed.
- `npm.cmd run verify:discovery-intake-consumer-stub-candidates` passed.
- `npm.cmd run verify:watch-discovery-bus-input-envelope` passed.
- `npm.cmd run verify:watch-task-creation-fixture-proof` passed.
- `npm.cmd run verify:watch-task-creation-boundary` passed.
- `npm.cmd run verify:watch-packet-dry-run-dispatch-parity` passed.
- `npm.cmd run verify:command-authority` passed.
- `npm.cmd run verify:passive-side-effects` passed.
- `npm.cmd run verify:protected-terms` passed with zero warnings before workspace handoff files were added. Final working-set scan after workspace updates covered 4 changed files and reported 475 warning-only items, mostly from the long existing `workspace/current.md` record; no renames or protected-word JSON updates were performed.
- `git diff --check` passed; CRLF normalization warnings were emitted for existing modified text files.
- `git status --short --branch` showed branch `main...origin/main [ahead 13]` with HS342 working-tree changes:
  - `M package.json`
  - `M workspace/current.md`
  - `?? scripts/verify-discovery-intake-consumer-stub-candidates.js`
  - `?? src/main/services/discoveryIntakeConsumerStubCandidateService.js`
  - `?? workspace/DevHS342-discovery-intake-consumer-stub-candidates.md`

## Boundary Confirmation

Durable Discovery refs, Evidence/EVEidence, provider movement, Watch execution, schema, UI, enforcement, support artifacts, durable Watch results, relationship tags, and fourth-lane behavior remain unopened.

No Watch dispatch runners, collectors, zKillboard, ESI, provider/live/API calls, `discovered_killmail_refs` writes, Evidence/EVEidence writes, Hydration/metadata writes, API log/warning writes, real/operator Watch mutations, real runtime packet persistence, broad provider queue, protected-word JSON updates, renderer UI, support artifact creation, runtime enforcement, or command blocking were added.

## Recommended Next Action

Overseer review HS342 and decide whether the next seam should remain fixture-only with a disposable Discovery ref write proof, or rest Watch runtime and shape Manual Discovery into the same shared candidate-intake model.
