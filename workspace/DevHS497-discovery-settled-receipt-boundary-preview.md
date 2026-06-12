# DevHS497 Discovery Settled Receipt Boundary Preview

Status: ready for Overseer review after HS498 correction

## HS498 Correction

HS498 returned HS497 for one blocking semantic issue: duplicate candidate refs were represented both under caller found refs and duplicate suppression.

Corrected behavior:

- `candidate_refs_found_previewed` now contains accepted new candidate-ref facts only.
- `duplicate_refs_suppressed` carries suppressed duplicate occurrences with `counted_as_found_ref: false`.
- `already_known_refs` carries already-known refs separately with `counted_as_new_found_ref: false`.
- Caller projection summary now separates `accepted_new_candidate_ref_count`, `already_known_candidate_ref_count`, `duplicate_ref_suppression_count`, and malformed rejection count.
- Focused verifier now fails if any caller found ref is not `new_candidate_ref`, or if duplicate/already-known rows are marked as counted found refs.

## Scope

Implemented a read-only Discovery settled receipt boundary preview over accepted HS495 candidate-ref landing posture.

New read-only command:

```txt
discovery.settled_receipt_boundary.preview
```

The command projects bounded factual caller receipt rows only. It does not decide Watch cadence, Watch completion, or Watch next action, and it does not call providers or mutate runtime/project data.

## Files Changed

```txt
package.json
scripts/verify-command-authority.js
scripts/verify-discovery-settled-receipt-boundary-preview.js
scripts/verify-enforcement-dry-run.js
scripts/verify-passive-side-effects.js
scripts/verify-service-registry.js
src/main/services/discoverySettledReceiptBoundaryPreviewService.js
src/main/services/enforcementDryRunService.js
src/main/services/serviceRegistry.js
workspace/current.md
workspace/overview.md
workspace/DevHS497-discovery-settled-receipt-boundary-preview.md
```

No schema file was changed for HS497.

## Command / Surface

Registered renderer-eligible read-only service command:

```txt
discovery.settled_receipt_boundary.preview
```

Coverage metadata:

```txt
storage_action_class: local_db_inspection
external_io_dependency: none
runtime_context: discovery_settled_receipt_boundary_preview_readout
enforcement_status: read_only_non_enforcing_proof
```

The command uses `discovery.candidate_ref_landing_boundary.preview` by default. Trusted non-renderer supplied landing previews are accepted only for fixture proof variants; renderer-supplied rich landing previews are not authoritative.

## Receipt Posture Examples

Focused verifier summary:

```json
{
  "status": "Discovery settled receipt boundary preview verified",
  "command": "discovery.settled_receipt_boundary.preview",
  "summary": {
    "source_candidate_ref_landing_row_count": 8,
    "settled_receipt_boundary_row_count": 5,
    "caller_receipt_projection_count": 5,
    "refs_found_count": 2,
    "no_refs_found_count": 0,
    "capped_count": 1,
    "provider_deferred_count": 1,
    "failed_retryable_count": 1,
    "failed_terminal_count": 0,
    "partial_recoverable_count": 0,
    "candidate_refs_found_previewed_count": 2,
    "accepted_new_candidate_ref_count": 2,
    "already_known_candidate_ref_count": 1,
    "duplicate_refs_suppressed_count": 2,
    "already_known_refs_count": 1,
    "malformed_refs_rejected_count": 1,
    "receipts_settled_enough_for_caller_count": 5,
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

The default HS495 path projects:

- `refs_found`
- `capped`
- `provider_deferred`
- `failed_retryable`

Trusted fixture variant coverage also proves:

- `no_refs_found`
- `failed_terminal`

## Boundary Proof

- Caller receipt projections are bounded and factual.
- Internal Discovery basis may remain capture-rich.
- Candidate refs remain Discovery possible leads, not Evidence/EVEidence.
- Duplicate refs are suppressed without duplicate Evidence or duplicate receipt facts.
- Malformed refs are rejected without landing refs.
- `capped` is projected as limited-but-not-failure.
- Provider deferred and failed postures project without refs.
- Every projected default receipt states `settled_enough_for_caller_receipt: true`.
- Watch cadence, Watch completion, and Watch next action remain `not_decided_here`.

No provider calls, zKill calls, ESI calls, provider execution, dispatcher runtime, queues, leases, lease claims, candidate-ref writes, Discovery-ref writes, `discovered_killmail_refs` writes, Evidence/EVEidence writes, Hydration writes, Observation changes, Watch cadence mutation, bucket status mutation, receipt mutation, schema changes, enforcement, or UI work were added.

## Verification

```txt
node --check src\main\services\discoverySettledReceiptBoundaryPreviewService.js
node --check scripts\verify-discovery-settled-receipt-boundary-preview.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:discovery-settled-receipt-boundary-preview
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
node --check scripts\verify-service-registry.js
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

Results:

- Syntax checks passed.
- Focused Discovery settled receipt boundary preview verifier passed.
- Command authority verifier passed.
- Passive side-effect verifier passed.
- Enforcement dry-run verifier passed with 130/130 commands covered and no gaps.
- Service registry verifier passed after the broad empty-fixture assertion was corrected to verify safe shape rather than requiring populated receipt rows.
- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- `git diff -- src\main\db\schema.sql` returned no diff.
- `git status --short --branch` showed `main...origin/main` with HS497 implementation files plus active workspace current/overview/runway files.

HS498 correction verification rerun:

```txt
node --check src\main\services\discoverySettledReceiptBoundaryPreviewService.js
node --check scripts\verify-discovery-settled-receipt-boundary-preview.js
npm.cmd run verify:discovery-settled-receipt-boundary-preview
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
```

Results:

- focused verifier passed with `candidate_refs_found_previewed_count: 2`, `accepted_new_candidate_ref_count: 2`, `already_known_candidate_ref_count: 1`, and `duplicate_refs_suppressed_count: 2`
- command authority passed
- passive side-effect sweep passed
- enforcement dry-run passed with 130/130 commands covered and no gaps
- service registry passed

## Naming / Next Seam

No naming redirect is required from Dev. The only future seam surfaced is the one already implied by the chain: receipt persistence or Watch consumption policy must be explicit before any real receipt mutation or Watch cadence interpretation is opened.
