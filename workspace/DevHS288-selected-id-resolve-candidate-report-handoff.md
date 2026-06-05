# Dev HS288 - Selected-ID Resolve Candidate / Report Handoff

Status: complete pending Overseer review
Date: 2026-06-05
Executor: Dev

## Scope

Implemented the read-only/local-only selected-ID Resolve candidate/report handoff preview.

Command added:

```txt
metadata.selected_id_resolve_candidate.preview
```

This proves the handoff:

```txt
selected unresolved local ID -> Resolve candidate -> future report readability reuse
```

No provider calls, writes, Resolve execution, UI, queues, schema, support artifacts, Watch/task result work, runtime enforcement, or fourth-lane work were added.

## Files Changed

- `package.json`
- `src/main/services/selectedIdResolveCandidatePreviewService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-selected-id-resolve-candidate-preview.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-passive-side-effects.js`
- `workspace/current.md`
- `workspace/DevHS288-selected-id-resolve-candidate-report-handoff.md`

## Readout Shape

The preview returns:

- report/local context identity
- unresolved visible IDs
- selected ID type/value
- provider-backed Resolve support
- current local label state
- strong local basis
- parked/conditional basis
- selected-ID Resolve preflight relevance
- report/corpus context that would benefit after future readability repair
- non-authoritative future preflight/execution payload hints
- explicit boundary statements that visibility/focus/candidacy is not request or provider execution

Renderer eligibility is read-only/explanatory only. The command does not expose or invoke trusted execution.

## Candidate Derivation

When report input is supplied, the service builds the existing local report response and reads local raw IDs from that report context.

When report input is absent or not buildable, the service falls back to equivalent local candidate queries over current local tables.

Local basis classification is derived from:

- strong: Evidence/EVEidence-derived `activity_events` appearance
- strong: existing local `entities` row missing a label
- parked/conditional: Watch/Marked rows
- parked/conditional: Assessment Memory
- parked/conditional: Discovery refs as possible leads/provenance
- local/static: SDE/type and solar-system lookup gaps

## Basis Classification

Verifier-covered classifications:

- `provider_backed_resolve_candidate_with_strong_local_basis`
- `already_local_readable`
- `unsupported_static_local_lookup`
- `parked_conditional_basis_only`
- `invalid_or_missing_selected_id`

## Sample Output

Focused verifier sample:

```json
{
  "status": "selected-ID Resolve candidate preview verified",
  "sample_strong": {
    "candidate_key": "character:91000001",
    "classification": "provider_backed_resolve_candidate_with_strong_local_basis",
    "selected_id_resolve_preflight_relevant": true,
    "provider_call_authorized": false,
    "strong_basis_count": 1,
    "parked_basis_count": 0,
    "local_label": null
  },
  "sample_static": {
    "candidate_key": "inventory_type:999999",
    "classification": "unsupported_static_local_lookup",
    "selected_id_resolve_preflight_relevant": false,
    "provider_call_authorized": false
  },
  "sample_parked": {
    "candidate_key": "alliance:99000999",
    "classification": "parked_conditional_basis_only",
    "selected_id_resolve_preflight_relevant": false,
    "provider_call_authorized": false,
    "parked_basis_count": 2
  },
  "visible_unresolved_count": 4,
  "provider_calls": 0,
  "resolve_execution_invoked": false,
  "old_report_scoped_metadata_hydration_used": false,
  "table_unchanged": true
}
```

## Boundaries Preserved

Confirmed:

- no provider calls
- no live/API verification
- no selected-ID Resolve execution
- no old report-scoped `metadata.hydration` selected-ID product path
- no Hydration writes
- no metadata run writes
- no API request log writes
- no entity writes/upserts
- no `activity_events` label patches
- no Evidence/EVEidence creation
- no Discovery ref mutation
- no queues, Bucket, Dispatcher, worker, lease, retry, or persisted work
- no schema changes
- no renderer/UI behavior
- no runtime enforcement or command blocking
- no support artifacts
- no Watch/task result work
- no fourth lane / fast lane

## Verification

Passed:

```txt
node --check src\main\services\selectedIdResolveCandidatePreviewService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-selected-id-resolve-candidate-preview.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-enforcement-dry-run.js
node --check scripts\verify-passive-side-effects.js
npm.cmd run verify:selected-id-resolve-candidate-preview
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
```

Protected terms completed in warning-only mode: 282 warnings across 8 changed working-set files; no renames or protected-word JSON updates performed.

Pending final hygiene after this file:

```txt
git diff --check
git status --short --branch
```

## Parked Items

- renderer-triggered Resolve execution
- UI confirmation behavior
- report-wide or background Hydration as product Resolve path
- Bucket/Dispatcher/worker/lease/retry/persisted queue
- active runtime enforcement / command blocking
- schema changes
- provider/API live tests
- support artifacts
- Watch/task result persistence
- fourth lane / fast lane
