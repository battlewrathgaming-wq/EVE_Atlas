# DevHS194 Light Operational Log Conformance Refresh

Status: Complete

## Scope

Refreshed the read-only support artifact writer conformance map after HS192 so `light_operational_logs` distinguishes:

- persisted `api_request_logs` row posture after repository insert sanitization
- absent dedicated light operational log export writer posture

No writer/export behavior was added or changed.

## Files Changed

- `src/main/services/supportArtifactWriterConformanceGapMapService.js`
- `scripts/verify-support-artifact-writer-conformance-gap-map.js`
- `workspace/current.md`
- `workspace/DevHS194-light-operational-log-conformance-refresh.md`

Pre-existing workspace packet files already changed on disk before Dev source edits:

- `workspace/overview.md`
- `workspace/OverseerHS194-light-operational-log-conformance-refresh-runway.md`

## Conformance Map Changes

For `light_operational_logs`:

- `writer_surface_exists` remains `partial`
  - Atlas has persisted operational/API request log rows.
  - Atlas still has no dedicated light operational log support artifact writer or export surface.
- `raw_payload_forbidden` remains `conforms`
  - `api_request_logs` has no raw provider response body column and no raw ESI payload column.
- Added `persisted_endpoint_error_sanitization`: `conforms`
  - HS192 sanitizes `api_request_logs.endpoint` and `api_request_logs.error_message` at `EvidenceRepository.insertApiRequestLog` for tested patterns.
- Added `endpoint_query_value_redaction`: `conforms`
  - persisted endpoints preserve route shape and query key names while replacing query values with `[redacted]`.
- Changed `secret_redaction_policy` from `unknown` to `conforms`
  - token/auth/cookie/session/password/key-like endpoint/error patterns plus bearer/basic values are redacted before persistence for tested patterns.
- Changed `free_text_length_policy` from `unknown` to `conforms`
  - persisted endpoint is bounded to 160 characters and persisted error text to 240 characters.

## Sample Readout Summary

Focused verifier output summary:

```json
{
  "class_count": 5,
  "check_count": 25,
  "by_status": {
    "conforms": 21,
    "partial": 3,
    "gap": 1
  },
  "classes_with_gaps": [
    "readiness_preflight_export"
  ],
  "classes_with_unknowns": []
}
```

The remaining `gap` is readiness/preflight alias normalization. The remaining `partial` postures include the absent light operational log export writer and known partial readiness/local-path disclosure posture. No `unknown` remains for HS192-proven API log persistence posture.

## Verification

Passed:

```powershell
node --check src\main\services\supportArtifactWriterConformanceGapMapService.js
node --check scripts\verify-support-artifact-writer-conformance-gap-map.js
npm.cmd run verify:support-artifact-writer-conformance-gap-map
npm.cmd run verify:api-request-log-redaction-readiness
npm.cmd run verify:support-trace-log-redaction-policy
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:http-boundaries
npm.cmd run verify:hydration
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
```

`verify:protected-terms` passed with warning-only advisory output after this handoff file was added: 150 warnings across 6 changed files; no renames or protected-word JSON updates were performed.

## Boundary Confirmation

- No light operational log writer/export was created.
- No support artifacts, snapshots, trace packs, logs, files, exports, packages, or directories were created.
- No API request log persistence behavior was changed.
- No `EvidenceRepository.insertApiRequestLog` behavior was changed.
- No `HttpClient` or provider worker behavior was changed.
- No provider calls were added.
- No schema changes were made.
- No report changes were made.
- No trace-pack writer behavior was changed.
- No Evidence/EVEidence, Discovery, Hydration, Assessment Memory, Watch, storage config, External I/O config, or runtime enforcement state was mutated.
- No runtime enforcement activation or command blocking was added.
- No renderer UI work was performed.

## Risks / Follow-Up

- A dedicated light operational log export writer still does not exist.
- HS192 redaction remains pattern-based for tested persistence patterns; unusual provider-specific secret formats may still need later expansion.
- Readiness/preflight class-id alias normalization remains the only conformance-map gap.
