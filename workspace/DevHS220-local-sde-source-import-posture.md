# DevHS220 - Local SDE Source Import Posture

Status: Complete, pending Overseer review
Date: 2026-06-03
Executor: Dev

## Scope

Implemented HS220 as a read-only local SDE source/import posture proof.

The added preview explains current local SDE lookup readiness, likely missing material, future local import/rewrite posture, provider-backed SDE download/build posture, External I/O relevance, storage/budget write posture, support/corpus adjacency, and source path authority limits.

Command added:

```txt
metadata.local_sde_source_posture.preview
```

Verification script added:

```txt
npm.cmd run verify:local-sde-source-posture
```

## Files Changed

- `package.json`
- `src/main/services/localSdeSourcePostureService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-local-sde-source-posture.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-service-registry.js`
- `workspace/current.md`
- `workspace/DevHS220-local-sde-source-import-posture.md`

## Implementation Summary

Added `src/main/services/localSdeSourcePostureService.js` as a pure/read-only posture builder.

The service composes existing local readout posture where practical:

- `metadata.local_sde_readiness.preview`
- `storage.setup_gate_readout`
- `support.gate_stack_readout`
- `enforcement dry-run` command coverage posture
- `support artifact path authority` posture

The renderer-eligible command is registered in `src/main/services/serviceRegistry.js`.

Enforcement dry-run coverage now classifies the command as:

```txt
storage/action class: local_db_inspection
External I/O dependency: none
runtime context: local_sde_source_import_posture_readout
enforcement status: covered_read_only
```

## Sample Output

Focused verifier sample:

```json
{
  "action": "metadata.local_sde_source_posture.preview",
  "read_only": true,
  "source_posture_summary": {
    "readiness_state": "partial",
    "missing_material": [
      "topology/geography lookup",
      "import provenance",
      "mixed"
    ],
    "local_import_rewrite_needed_later": true,
    "provider_backed_download_needed_later": false,
    "provider_backed_download_available_as_future_path": true,
    "readiness_is_authorization": false
  },
  "source_path_authority": {
    "status": "not_inspected_renderer_payload_ignored",
    "supplied": true,
    "observed": false,
    "path": null,
    "arbitrary_file_inspection": false,
    "renderer_payload_ignored": true
  },
  "external_io_posture": {
    "requested_readout_state": "off",
    "provider_backed_download_commands": [
      "sde.build-lookups"
    ],
    "local_only_import_commands": [
      "sde.import.topology",
      "sde.import.inventory"
    ],
    "held_is_failure": false,
    "external_io_on_is_authorization": false,
    "provider_calls": 0
  },
  "storage_posture": {
    "storage_state": "no_storage_selected",
    "budget_state": "budget_unconfigured",
    "future_lookup_rewrite": {
      "future_lookup_rewrite_posture": "block",
      "future_lookup_rewrite_blocked": true,
      "local_readout_available": true,
      "storage_posture_is_authorization": false
    }
  }
}
```

Representative command-family posture:

- `sde.import.topology`: `local_source_import_rewrite`, External I/O not required, not authorized by readout.
- `sde.import.inventory`: `local_source_import_rewrite`, External I/O not required, not authorized by readout.
- `sde.build-lookups`: `provider_backed_download_build` without a trusted local source, held by External I/O off, not authorized by readout.

Representative missing groups:

- `inventory_type_lookup_gap`
- `topology_lookup_gap`
- `import_provenance_gap`

## Boundaries Preserved

Confirmed by code shape and verification:

- no SDE download
- no SDE import
- no lookup-table rewrite
- no arbitrary user-file inspection
- no storage movement
- no config writes
- no support artifact creation
- no provider calls
- no Hydration writes
- no `metadata_runs` writes
- no Evidence/EVEidence creation
- no Discovery ref mutation
- no Watch mutation
- no Assessment Memory or Marked mutation
- no schema changes
- no runtime enforcement activation
- no command blocking
- no renderer UI work
- no pruning/deletion behavior

## Verification

Passed:

```txt
node --check src\main\services\localSdeSourcePostureService.js
npm.cmd run verify:local-sde-source-posture
npm.cmd run verify:local-sde-readiness
npm.cmd run verify:hydration-attention-runtime
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
```

Note: the HS220 runway named `npm.cmd run verify:local-sde-readiness-preview`; the current repository package script is `npm.cmd run verify:local-sde-readiness`, which runs `scripts/verify-local-sde-readiness-preview.js`.

Protected-term verification passed with warning-only advisory output:

```txt
warning count: 486
confirmation: warning-only; no renames performed; no protected-word JSON updates performed
```

Final hygiene passed:

```txt
git diff --check
git status --short --branch
```

## Outcome

HS220 is complete from Dev implementation perspective.

Atlas can now explain local SDE source/import posture before execution:

- current SDE readiness is summarized as complete, partial, or missing
- missing material is grouped into inventory/type, topology/geography, import provenance, or mixed
- future local import/rewrite is distinct from provider-backed SDE download/build
- External I/O posture is explicit and non-authorizing
- storage/budget posture can block future lookup-table rewrites without blocking the readout
- renderer-supplied source paths are not trusted and are not inspected
- local SDE readiness remains local readability/geometry support, not provider-backed Hydration

## Risks / Follow-Up

The preview intentionally does not choose final source path authority or import execution behavior. Future packets should decide the operator-selected source path/config authority and bounded import/write path before any real SDE import or lookup rewrite is enabled.
