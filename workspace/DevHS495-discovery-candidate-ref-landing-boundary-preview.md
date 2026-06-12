# DevHS495 Discovery Candidate Ref Landing Boundary Preview

Status: ready for Overseer review

## Scope

Implemented a read-only Discovery candidate-ref landing boundary preview over accepted HS493 dispatcher/lease candidates and fixture provider-result examples.

New read-only command:

```txt
discovery.candidate_ref_landing_boundary.preview
```

The command classifies future candidate-ref landing posture only. It does not call providers, write `discovered_killmail_refs`, write candidate refs, write Discovery refs, write Evidence/EVEidence, write Hydration, create Observation, mutate Watch cadence, mutate bucket status, mutate receipts, change schema, enforce runtime decisions, or change UI.

## Files Changed

```txt
package.json
scripts/verify-command-authority.js
scripts/verify-discovery-candidate-ref-landing-boundary-preview.js
scripts/verify-enforcement-dry-run.js
scripts/verify-passive-side-effects.js
scripts/verify-service-registry.js
src/main/services/discoveryCandidateRefLandingBoundaryPreviewService.js
src/main/services/enforcementDryRunService.js
src/main/services/serviceRegistry.js
workspace/current.md
workspace/overview.md
workspace/DevHS495-discovery-candidate-ref-landing-boundary-preview.md
```

No schema file was changed for HS495.

## Service / Report Surface

Registered renderer-eligible read-only service command:

```txt
discovery.candidate_ref_landing_boundary.preview
```

Coverage metadata:

```txt
storage_action_class: local_db_inspection
external_io_dependency: none
runtime_context: discovery_candidate_ref_landing_boundary_preview_readout
enforcement_status: read_only_non_enforcing_proof
```

The command calls the HS493 dispatcher/lease boundary preview path by default. Trusted non-renderer supplied lease previews can be used for internal proof shape, but renderer-supplied lease previews are not authoritative. Fixture provider results are examples only and never execute provider calls.

## Preview Output

Candidate-ref identity:

```txt
killmail_id + hash
```

The preview classifies:

```txt
new_candidate_ref
duplicate_within_provider_result
duplicate_across_preview_candidates
already_known_in_fixture_discovery_memory
malformed_missing_hash_or_id
provider_deferred_no_refs
provider_failed_no_refs
```

Every landing row states:

```txt
candidate_ref_is_discovery_possible_lead: true
not_evidence: true
not_eveidence: true
not_hydration: true
not_observation: true
watch_completion_semantics: not_decided_here
writes_discovered_killmail_refs: false
```

## Sample Output

Focused verifier summary:

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

Sample new candidate-ref preview:

```json
{
  "candidate_ref_landing_status": "new_candidate_ref_preview",
  "candidate_ref_kind": "new_candidate_ref",
  "landing_action_preview": "would_stage_new_discovery_candidate_ref",
  "killmail_id": 93000001,
  "killmail_hash": "hash-new-alpha",
  "candidate_ref_identity": "93000001:hash-new-alpha",
  "identity_basis": "killmail_id+hash",
  "route_packet_identity": "preview-zkill-system:watch-run-system_radius-1:30003597",
  "watch_run_id": "watch-run-system_radius-1",
  "watch_id": 1,
  "system_id": 30003597,
  "candidate_ref_is_discovery_possible_lead": true,
  "not_evidence": true,
  "not_eveidence": true,
  "not_hydration": true,
  "not_observation": true,
  "writes_discovered_killmail_refs": false
}
```

## Dedupe / Malformed / Capped Examples

- New refs preview as `would_stage_new_discovery_candidate_ref`.
- Duplicate refs inside one fixture provider result preview as `suppress_duplicate_within_provider_result`.
- Existing-memory fixture duplicates preview as `would_attach_provenance_to_existing_discovery_ref`.
- Overlapping Watch/route duplicates preview as `would_attach_additional_provenance_without_duplicate_ref_or_evidence`.
- Missing hash previews as `rejected_before_landing` with `reason: missing_or_invalid_hash`.
- Capped fixture results preview as `cap_hit_more_refs_may_exist_not_failure`.
- Deferred and failed fixture provider results preview as `no_candidate_ref_landing_action`.

## Acceptance Proof

- HS493 lease candidates can be paired with fixture provider-result examples without provider calls.
- Candidate-ref identity is `killmail_id + hash`.
- Candidate refs are Discovery possible leads only, not Evidence/EVEidence.
- Duplicate refs do not become duplicate landing actions.
- Existing-memory duplicates are disclosed as already known.
- Malformed/missing-hash refs are rejected before landing.
- Capped fixture posture is disclosed without treating it as failure.
- Deferred/failed provider-result posture produces no ref landing action.
- Overlapping Watch/run provenance is preserved without duplicating Evidence.
- Watch completion semantics stay out of this preview.
- No `discovered_killmail_refs`, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence, bucket status, receipt, schema, enforcement, or UI side effect occurs.

## Verification

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
```

Results:

- Syntax checks passed.
- Focused Discovery candidate-ref landing boundary preview verifier passed.
- Service registry verifier passed.
- Command authority verifier passed.
- Passive side-effect verifier passed.
- Enforcement dry-run verifier passed with 129/129 commands covered and no gaps.

Final hygiene:

```txt
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

Results:

- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- `git diff -- src\main\db\schema.sql` returned no diff.
- `git status --short --branch` showed `main...origin/main` with HS485/HS487/HS489/HS491/HS493/HS495 touched files and active workspace runway/review files.

## Boundary Confirmation

- Read-only candidate-ref landing boundary preview only.
- No schema changes.
- No live provider calls.
- No zKill calls.
- No ESI calls.
- No real Discovery pickup execution.
- No executable provider packets.
- No dispatcher runtime.
- No queue runtime.
- No durable queues.
- No durable leases.
- No lease claims.
- No candidate-ref writes.
- No Discovery ref writes.
- No `discovered_killmail_refs` writes.
- No Evidence/EVEidence writes.
- No Hydration.
- No Observation/reporting behavior.
- No Watch cadence mutation.
- No Watch bucket status mutation.
- No receipt mutation.
- No Watch completion semantics.
- No UI.
- No actor Watch migration.
- No `collectActorWatch(...)` retirement.
- No system/radius collector redirect.
- No source-term rename.
- No protected-word JSON update.

## Unexpected Coupling / Notes

- No unexpected runtime coupling was required. The preview composes over HS493 output and uses fixture provider-result examples only.
- Watch completion remains deliberately absent. Candidate-ref landing posture is Discovery memory posture, not Watch result authority.
- The next complexity remains intentionally unopened: real provider execution, durable candidate-ref write semantics, receipt/status handling, and provider pacing/backoff behavior.

## Recommended Next Action

Overseer review HS495 for acceptance or redirect. A later seam can decide whether to prove durable candidate-ref landing fixture semantics, receipt/status boundary, or provider execution policy before any live zKill/ESI movement.
