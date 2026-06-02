# DevHS188 Trace-Pack Writer Redaction Hardening

Status: Complete

## Scope

Applied the accepted HS186 trace/log redaction policy to the existing operator debug trace-pack writer only:

```txt
support.debug_trace_pack
```

This is writer hardening for `src/main/support/operatorDebugTracePack.js`, not a new support artifact framework and not light-log hardening.

## Files Changed

- `src/main/support/operatorDebugTracePack.js`
- `scripts/verify-operator-debug-trace-pack.js`
- `src/main/services/supportArtifactWriterConformanceGapMapService.js`
- `scripts/verify-support-artifact-writer-conformance-gap-map.js`
- `workspace/current.md`
- `workspace/DevHS188-trace-pack-writer-redaction-hardening.md`

## Writer Fields Hardened

- `fetch_runs.error_summary`
- `api_request_logs.endpoint`
- `api_request_logs.error_message`
- task `scope_key`
- task `error.message`
- data-quality warning `message`
- queue latest refs `last_error`
- runtime `database_path`
- runtime `temp_root`
- smoke artifact `root`
- smoke artifact file `path`

## Rules Added

- Endpoint query values are stripped and replaced with a redacted query marker plus query-key count.
- Secret/token/authorization/cookie-like strings are redacted from trace-pack diagnostic text.
- Diagnostic free text is bounded:
  - general diagnostic text: 240 characters
  - endpoint strings: 160 characters
  - queue `last_error`: 160 characters
  - data-quality warning message: 220 characters
  - task `scope_key`: 128 characters
  - local path strings: 260 characters
- Runtime and smoke artifact paths are emitted as local path summary objects with role, basename, value, `sensitive_support_metadata`, and `local_path_not_authority`.
- Queue latest refs include `sample_posture: bounded_support_provenance_only_not_evidence`.
- Smoke artifact summaries include `sample_limit` and `omitted_count`.

## Disclosure Output

The trace pack now includes `trace_pack_disclosure`:

```json
{
  "policy_source": "support.trace_log_redaction_policy.preview",
  "redaction_truncation_posture": {
    "endpoint_query_values": "stripped",
    "secrets_tokens_authorization_cookie_like_strings": "redacted",
    "diagnostic_free_text": "truncated_to_240_chars",
    "queue_last_error": "truncated_to_160_chars",
    "endpoint_strings": "truncated_to_160_chars"
  },
  "local_path_sensitivity": "local paths are emitted as sensitive support metadata with role, basename, and truncated value only",
  "sample_limit": 12,
  "omitted_excluded_material": {
    "raw_esi_payloads": "excluded",
    "full_provider_response_bodies": "excluded",
    "full_participant_payload_strings": "excluded",
    "endpoint_query_values": "excluded",
    "smoke_artifact_file_contents": "excluded",
    "unbounded_table_dumps": "excluded",
    "omitted_counts": "reported where available"
  },
  "non_authority": {
    "evidence": false,
    "discovery": false,
    "observation": false,
    "assessment_memory": false,
    "product_truth": false,
    "deletion_or_pruning_authority": false
  }
}
```

## Conformance Map Result

`support.artifact_writer_conformance_gap_map.preview` changed only for the operator debug trace pack checks affected by HS188:

- `free_text_length_policy`: `conforms`
- `sample_limit_disclosure`: `conforms`
- `local_path_sensitivity`: `conforms`
- `provider_endpoint_secret_leakage`: `conforms` for trace-pack assembly
- `queue_latest_refs_bounded_summary`: `conforms`

Light operational log secret redaction remains `unknown`; readiness/preflight alias normalization remains `gap`.

Focused conformance output:

```json
{
  "by_status": {
    "conforms": 17,
    "partial": 3,
    "gap": 1,
    "unknown": 2
  },
  "classes_with_gaps": [
    "readiness_preflight_export"
  ],
  "classes_with_unknowns": [
    "light_operational_logs"
  ]
}
```

## Verification

Passed:

```powershell
node --check src\main\support\operatorDebugTracePack.js
node --check scripts\verify-operator-debug-trace-pack.js
node --check src\main\services\supportArtifactWriterConformanceGapMapService.js
node --check scripts\verify-support-artifact-writer-conformance-gap-map.js
npm.cmd run verify:operator-debug-trace
npm.cmd run verify:support-artifact-writer-conformance-gap-map
npm.cmd run verify:support-trace-log-redaction-policy
npm.cmd run verify:support-artifact-contents-contract
npm.cmd run verify:support-artifact-creation-policy
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

`npm.cmd run verify:operator-debug-trace` creates fixture/test-controlled trace-pack artifacts under `.tmp`, as allowed by HS188 because this packet changes the trace-pack writer. These are not real operator artifacts.

Notes:

- The first `verify:operator-debug-trace` run failed while developing the fixture because the only queue ref had been moved to `failed`, removing the existing pending queue indicator. I added a second pending ref and reran the verifier successfully.
- Pre-documentation `verify:protected-terms` passed with warning-only advisory output: 23 warnings across 4 changed files; no renames or protected-word JSON updates were performed.
- Final post-documentation `verify:protected-terms` passed with warning-only advisory output: 99 warnings across 6 changed files; no renames or protected-word JSON updates were performed.
- Final `git diff --check` passed with only CRLF normalization warnings.
- Final `git status --short --branch` showed branch `main...origin/main` with HS188 working-tree changes.

## Boundary Confirmation

- No light-log hardening was performed.
- No new support artifact classes were added.
- No new support artifact commands were added.
- No snapshot writer behavior changed.
- No readiness/preflight export behavior changed.
- No provider calls were added.
- No Evidence/EVEidence, Discovery, Hydration, Assessment Memory, Watch, storage config, External I/O config, or schema mutation was added.
- No runtime enforcement activation or command blocking was added.
- No renderer UI work was performed.

## Risks / Follow-Up

- Persisted API logs and any future light-log export remain a separate hardening seam.
- Readiness/preflight class-id alias normalization remains a conformance-map gap.
- If future trace-pack fields add new free-text or path-bearing material, verifier coverage should be extended with unsafe fixture strings before accepting the field.
