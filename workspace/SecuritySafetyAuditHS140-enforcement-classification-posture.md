# SecuritySafetyAuditHS140 - Enforcement Classification Posture

Status: advisory audit artifact
Date: 2026-05-31
Role: Atlas Security / Safety Auditor
Milestone: Atlas Storage And Runtime Hardening
Topic: HS140 / HS139 storage-runtime enforcement classification posture before runtime enforcement design

## Request Received

Review the storage/runtime enforcement classification posture for security and safety risks before any runtime blocking is designed.

This artifact is advisory only. It does not implement code, create a Dev runway, run provider/API calls, treat dry-run classification as runtime enforcement authority, or recommend broad enforcement.

## Files Reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS138-hs137-enforcement-dry-run-review.md`
- `workspace/EngineeringSafetyAuditHS138-enforcement-dry-run-coverage-review.md`
- `workspace/OverseerHS140-hs139-enforcement-classification-coverage-review.md`
- `workspace/DevHS139-enforcement-classification-coverage.md`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/serviceRegistry.js`
- `scripts/verify-enforcement-dry-run.js`
- `workspace/critical/README.md`
- `workspace/critical/critical-assets.md`

Additional local context read narrowly because it was directly relevant to renderer/path/support-artifact safety:

- `src/main/services/storageSetupGateReadoutService.js`
- `src/main/services/gateStackReadoutService.js`
- `src/main/services/runtimeSnapshotService.js`
- `src/main/support/operatorDebugTracePack.js`
- `src/main/services/storageAuthorityConfigWriteService.js`
- `src/main/preload.js`

## 1. Security Posture Summary

Atlas is in a healthy pre-enforcement posture.

HS139 gives complete current `serviceRegistry` coverage and keeps the map explicitly read-only/non-enforcing. The strongest safety property is that unclassified new registry commands should fail `verify:enforcement-dry-run`.

The map is suitable as an inventory and discussion aid. It is not yet safe to convert directly into runtime enforcement policy.

## 2. Blocking Risks Before Enforcement Implementation

Do not use `would_allow` as a runtime allow decision. It currently means storage posture would not block, not that all safety gates passed.

Runtime enforcement needs a separate composition model for storage, External I/O, provider/live gate, confirmation, cadence, Watch arming, active tasks, and destination/path authority.

Static confirmation tokens in `serviceRegistry.js` are useful operator-friction metadata, not security authority. They are visible through service metadata and must not be treated as authorization secrets.

`support.debug_trace_pack` is renderer-eligible and passes `outputDir` to the writer. Unlike snapshot creation, the reviewed code did not show an equivalent renderer path restriction there. Before enforcement, support-artifact path authority needs review.

Fixture/proof commands must remain non-renderer, trusted-context only, and excluded from production enforcement surfaces.

## 3. Non-Blocking Risks To Mark In Breadcrumbs

The dry-run table is manual. Verification catches missing commands, but not wrong classifications.

`setup_config_changes` is broad: it covers benign setup, local Watch metadata, snapshot settings, runtime-control-adjacent work, and fixture proof posture. Future policy should split this before blocking.

Support artifacts, snapshots, trace packs, and retention previews are not the same risk class as Evidence writes or provider calls.

Budget posture is storage-capacity safety, not provider/API rate safety.

## 4. Misclassification Or Bypass Concerns

`sde.import.topology` and `sde.import.inventory` are local imports with `external_io_dependency: none`, but they map to `background_hydration`; the action matrix treats `background_hydration` as provider movement required. That could overstate External I/O risk and understate local rewrite risk.

`watch.executor.arm` is renderer-eligible and can dispatch due Watch work. Its classification is correct, but runtime enforcement must guard the dispatch path itself, not only direct `actor.watch` / `system.radius.watch`.

`task.cancel` can abort running provider/write work. It is not a storage bypass by itself, but enforcement should define whether cancellation is always allowed as a safety control.

Unknown or unclassified commands should fail closed in future runtime enforcement. The current verifier supports this principle, but runtime enforcement code does not exist yet.

## 5. Renderer / IPC Exposure Concerns

Renderer service invocation is centralized and respects renderer eligibility.

Renderer payloads cannot invoke non-renderer fixture proof commands through IPC.

Renderer can list service commands and see confirmation tokens. This is acceptable only if tokens are confirmation affordances, not security secrets.

Renderer-exposed readouts can reveal local posture and some operational metadata. That appears intentional, but future enforcement should classify path/detail exposure separately from mutation risk.

## 6. Fixture/Proof Command Concerns

Fixture proof commands are correctly marked `fixture_only_non_production` and non-renderer.

The main future risk is accidental reuse as production config-writing implementation. Keep their trusted context flags, fixture root requirement, and non-renderer posture as hard boundaries.

## 7. External I/O Separation Assessment

Separation is conceptually sound but not enforceable yet.

Provider-capable commands are identified, and `support.gate_stack_readout` says External I/O is policy-only. The gap is composition: storage allow plus External I/O off must become held, not allowed.

## 8. Recommended Hardening Later

Add a runtime policy shape with distinct states such as:

```text
storage_allows
external_io_allows
live_gate_allows
destination_allows
confirmation_present
cadence_allows
```

Split local rewrite, setup config, runtime control, support artifact write, and fixture-only classes.

Add a verifier that compares service `effects` against enforcement classification for contradictions.

Add explicit renderer path-authority checks for trace pack output.

## 9. Recommended Next Safe Seam

External I/O held-state follow-up is the safest next seam.

It lets Atlas prove provider-capable commands enter a held/waiting state without catch-up flooding before any broad runtime blocking exists.

## 10. Human / Overseer Decisions Needed

- Should confirmation tokens remain UX-only, with real authorization coming from backend policy state?
- Should renderer-created support artifacts be allowed at all, and if so only under backend-selected project-local destinations?
- Should local SDE import/rewrite be its own enforcement class rather than `background_hydration`?
- Should future enforcement fail closed for every unknown command, including non-renderer/internal calls?

## Boundary Confirmation

No code was changed.

No runtime enforcement, command interception, storage lockout, provider/API call, Evidence/EVEidence write, hydration write, DB movement, storage movement, pruning/deletion execution, schema change, renderer redesign, or Dev runway was created by this audit.

## Verification / Evidence

This was an advisory review only.

Evidence used:

- source and workspace files listed above were read from local disk
- command classification, renderer eligibility, fixture/proof posture, support-artifact handling, storage gate posture, and External I/O separation were compared against the accepted HS139/HS140 state
- no tests were run because no runtime behavior was changed
