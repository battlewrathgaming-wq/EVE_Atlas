# DevHS363 - Discovery Receipt Projection Fixture Proof

Status: Complete
Executor: Dev
Date: 2026-06-07

## Scope

Implemented the read-only/local-only fixture proof command:

```txt
discovery.receipt_projection_fixture.preview
```

Added focused verification:

```txt
verify:discovery-receipt-projection-fixture
```

The command consumes existing fixture Discovery pickup packet proof output and fixture provider-return/candidate output, then emits:

- one Discovery-owned canonical receipt basis
- one requested safe projection
- table mutation proof showing runtime rows unchanged
- boundary flags preserving that candidate refs are possible leads, not durable Discovery refs, Evidence/EVEidence, Hydration, Observation, Assessment, or task memory

## Files Changed

HS363 implementation:

- `src/main/services/discoveryReceiptProjectionFixtureService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-discovery-receipt-projection-fixture.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS363-discovery-receipt-projection-fixture-proof.md`

Pre-existing dirty/untracked workspace state from earlier accepted/review packets was preserved and not reverted.

## Command Shape

`discovery.receipt_projection_fixture.preview` is registered as a renderer-eligible read-only service command.

Inputs support:

- `projection`: `minimal`, `watch_summary`, `operator_detail`, or `debug_basis`
- fixture watch/source rows used by the existing pickup packet proof
- fixture provider-return outcomes per packet
- request-level External I/O hold posture

The canonical basis includes:

- receipt identity/model version
- source intent kind/id and Watch provenance
- scope key and scope basis
- requested window
- provider path as fixture-only
- request posture and hold reason
- accepted/attempted/completed packet counts
- packet outcome counts
- candidate ref handles
- defer/retry/failure/cap rollups
- confidence and missing-basis flags
- packet-level basis for attempted acquisition packets

## Fixture Cases

Verifier coverage includes:

- actor Watch with `complete_refs_found`
- actor Watch with `complete_no_refs`
- system/radius Watch with stored accepted system IDs
- mixed packet rollup across `complete_refs_found`, `complete_no_refs`, `provider_deferred`, and `failed_retryable`
- `partial_deferred`
- request-level `provider_deferred`
- `acquisition_capped`
- `failed_retryable`
- `failed_terminal`
- External I/O held request posture with attempted/completed packet counts at `0`
- `debug_basis` projection including the full bounded canonical basis
- service-registry invocation of the command

Attempted packet outcomes are limited to:

```txt
complete_refs_found
complete_no_refs
partial_deferred
provider_deferred
acquisition_capped
failed_retryable
failed_terminal
```

`held_by_external_io` is not emitted as a packet outcome. It appears only as request-level pre-acquisition posture.

## Projection Samples

Focused verifier printed samples for:

- `sample_minimal`
- `sample_watch_summary`
- `sample_operator_detail`
- `sample_debug_basis`

Sample canonical fields demonstrated by the verifier:

```json
{
  "receipt_model_version": "discovery_receipt_fixture_v1",
  "source_intent_kind": "watch_system_radius",
  "scope_basis": {
    "basis_kind": "stored_accepted_included_system_ids",
    "accepted_scope_source": "stored_watch_scope",
    "center_radius_used_as_execution_authority": false
  },
  "request_posture": "attempted_fixture_acquisition",
  "packet_outcome_counts": {
    "complete_refs_found": 1,
    "complete_no_refs": 1,
    "provider_deferred": 1,
    "failed_retryable": 1
  },
  "boundary_flags": {
    "discovery_owns_receipt_basis": true,
    "projection_is_view_only": true,
    "candidate_refs_are_possible_leads": true,
    "candidate_refs_are_not_evidence": true,
    "evidence_landing_not_performed": true
  }
}
```

## Boundaries Confirmed

No provider calls, live/API calls, Watch execution, Watch dispatch runner/collector invocation, Watch schedule/state mutation, Discovery ref writes, Evidence/EVEidence writes, Hydration/metadata writes, API log/warning writes, durable task/packet schema, queue, dispatcher, lease, support artifact, renderer/UI change, runtime enforcement, command blocking, source-term rename, protected-word JSON update, or Evidence/Hydration/Observation/Assessment completion claim was added.

The proof does not make callers owners of Discovery meaning. The projection is a view of the Discovery-owned canonical receipt basis.

## Verification

Passed:

```txt
node --check src\main\services\discoveryReceiptProjectionFixtureService.js
node --check scripts\verify-discovery-receipt-projection-fixture.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check src\main\services\enforcementDryRunService.js
npm.cmd run verify:discovery-receipt-projection-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- `verify:discovery-receipt-projection-fixture`: passed; printed canonical receipt and all four projection samples.
- `verify:service-registry`: `service registry verified`.
- `verify:command-authority`: `command authority verified`.
- `verify:passive-side-effects`: `passive side-effect sweep verified`.
- `verify:enforcement-dry-run`: passed with complete command coverage.
- `verify:protected-terms`: exit code `0`, warning-only advisory scan; no renames and no protected-word JSON updates.
- `git diff --check`: passed; only line-ending warnings.
- `git status --short --branch`: `## main...origin/main [ahead 19]` with HS363 edits plus pre-existing untracked/modified packet files.

## Risks / Notes

- This is fixture proof only. It intentionally does not create a durable Discovery receipt/task/packet schema.
- Packet-level production confidence remains parked until a later durable task/packet model or equivalent read model is authorized.
- Current write-capable Watch collector paths still mix provider movement, Discovery refs, ESI Evidence Expansion, Evidence writes, warning/log rows, and Watch run posture; HS363 does not alter those paths.

## Recommended Next Action

Overseer review HS363 for acceptance, then decide whether the next packet should sharpen the durable receipt/task packet shape or continue with another non-durable bridge proof before any schema or provider movement is opened.
