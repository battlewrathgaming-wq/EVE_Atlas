# DevHS294 Watch Scope Authority Conformance

Status: complete pending Overseer review
Date: 2026-06-05
Executor: Dev

## Scope

Implemented the HS294 read-only/local-only Watch scope authority conformance preview.

Command:

```txt
watch.scope_authority_conformance.preview
```

The command proves whether current Atlas conforms to the accepted stored-scope Watch model and names the exact correction seam. It does not correct execution behavior.

## Files Changed

- `src/main/services/watchScopeAuthorityConformanceService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-watch-scope-authority-conformance.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS294-watch-scope-authority-conformance.md`

## Command / Classification Shape

`watch.scope_authority_conformance.preview` is registered as:

- classification: `read-only`
- effects: `read-only`
- renderer eligible: `true`
- enforcement coverage:
  - storage/action class: `local_db_inspection`
  - External I/O dependency: `none`
  - runtime context: `watch_scope_authority_conformance_readout`
  - enforcement status: `read_only_non_enforcing_proof`

## Result

The preview reports current conformance as:

```txt
gap
```

The proof confirms:

- SDE source material is import/source provenance only.
- Local topology lookup tables are the runtime geometry substrate.
- Stored `included_system_ids` are the accepted Watch scope authority.
- Center/radius are provenance/explanation after Watch acceptance.
- Recomputed topology is diagnostic comparison only under the accepted model.
- Discovery refs remain possible leads, not Evidence/EVEidence.
- Evidence/EVEidence remains ESI-expanded killmail records only.

Current source posture:

- `watchlistRepository.addSystemRadiusWatch`: conforms for local topology lookup authoring/preflight geometry.
- `watchScheduler.buildWatchScheduleStatus`: conforms for readout parsing of stored included/excluded scope.
- `watchOfflineReadout.buildWatchOfflineReadout`: partial, using stored scope for local context when valid and center fallback only as readout/diagnostic posture.
- `watchExecutor.dispatchFor`: gap, because system-radius execution payload is built from center/radius/caps rather than stored included IDs.
- `systemRadiusCollector.collectSystemRadiusWatch`: gap, because it calls planner from input/topology unless fixture planner output is injected.
- `systemRadiusPlanner.planSystemRadiusWatch`: partial, because recompute is acceptable for authoring/preflight or diagnostic comparison but not accepted execution authority.

## Sample Output

Focused verifier sample:

```json
{
  "status": "Watch scope authority conformance preview verified",
  "action": "watch.scope_authority_conformance.preview",
  "summary": {
    "status": "gap",
    "system_radius_watch_count": 3,
    "valid_stored_scope_count": 1,
    "missing_stored_scope_count": 1,
    "malformed_stored_scope_count": 1,
    "stored_vs_recomputed_mismatch_count": 1,
    "execution_uses_stored_included_ids_now": false,
    "execution_recomputes_from_center_radius_now": true,
    "accepted_model_conformance": "gap",
    "exact_correction_seam": "watchExecutor.dispatchFor / systemRadiusCollector.collectSystemRadiusWatch / systemRadiusPlanner.planSystemRadiusWatch"
  },
  "watch_scope_samples": [
    {
      "watch_id": 1,
      "included_status": "valid",
      "stored_included": [30000101, 30000103],
      "recomputed": [30000101, 30000102],
      "scope_match": false,
      "execution_status": "gap"
    },
    {
      "watch_id": 2,
      "included_status": "not_stored",
      "stored_included": [],
      "scope_match": null,
      "execution_status": "gap"
    },
    {
      "watch_id": 3,
      "included_status": "malformed",
      "stored_included": [],
      "scope_match": null,
      "execution_status": "gap"
    }
  ],
  "mutation_check": {
    "unchanged": true
  }
}
```

## Boundary Confirmation

Confirmed:

- no zKill, ESI, SDE download, or provider calls
- no Watch dispatch
- no Watch arm/tick
- no task creation
- no queue dispatch
- no writes to Watch rows, Discovery refs, Evidence/EVEidence, Hydration, metadata, API logs, Assessment Memory, or support artifacts
- no schema changes
- no execution correction
- no `watch_result`, `watch_result_items`, relationship tags, or relationship truth
- no renderer/UI work beyond read-only command registration
- no runtime enforcement or command blocking
- no fourth lane / fast lane work

## Verification

Passed:

```txt
node --check src\main\services\watchScopeAuthorityConformanceService.js
node --check scripts\verify-watch-scope-authority-conformance.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-passive-side-effects.js
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
```

`verify:protected-terms` completed with warning-only advisory output: 294 warnings across 8 changed working-set files; no renames or protected-word JSON updates were performed.

```txt
git diff --check
```

Passed with CRLF normalization warnings only.

```txt
git status --short --branch
```

Showed branch `main...origin/main` with HS294 working-tree changes.

## Risks / Open Decisions

- Current execution does not conform to the accepted stored-scope authority model.
- A later correction packet should decide exact execution payload shape for accepted stored included IDs.
- System/radius Discovery ref identity remains center-only and separate from Watch scope authority; do not use it as durable Watch result identity without another decision.

## Recommended Next Action

Overseer should review the gap proof. If accepted, the next Dev packet should be a bounded execution correction proof that routes system/radius Watch execution through stored included system IDs while preserving read-only diagnostics for recomputed topology.
