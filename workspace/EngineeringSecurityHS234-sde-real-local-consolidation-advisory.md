# Engineering Security HS234 - SDE Real-Local Consolidation Advisory

Role: Engineering / Security reviewer
Milestone: HS234
Topic: SDE real-local consolidation after topology and inventory import conformance
Date: 2026-06-03

## Executive Recommendation

Atlas can let the local SDE import/rewrite mechanics rest for now. HS230/HS231 accepted the real-local topology path, and HS232/HS233 accepted the real-local inventory/type path. Together they provide enough fixture-backed assurance that local source import mechanics are now a stable subsystem for the current milestone, as long as Atlas does not treat that as approval for operator UI, combined orchestration, provider-backed download/build, or runtime command blocking.

No new Dev runway is required for SDE import mechanics unless Human/Overseer wants to continue this exact line. If continuing, the smallest useful next proof is a narrow source-disappears-after-authority failure proof, not a broad import/download feature.

## Whether Local SDE Import Mechanics Should Rest

Recommendation: rest.

The accepted topology and inventory paths now share the important safety posture:

- trusted local source authority is required from trusted context;
- renderer source path claims are ignored;
- remote source references are rejected for local imports;
- selected storage and explicit budget are required before rewrite;
- staged temp material is validated before visible promotion;
- visible replacement and provenance write happen transactionally;
- failed import preserves prior visible rows and provenance;
- retry/rerun remains explicit, not automatic;
- provider calls, SDE downloads, provider-backed builds, support artifacts, UI work, runtime enforcement, and command blocking remain absent.

That is enough to avoid further abstract proofing for local import mechanics. The remaining risks are integration and operator-experience risks, not proof-of-mechanics blockers.

## Whether Combined Local Import Should Open

Recommendation: defer.

A combined topology plus inventory local import is not needed next. The separate command families are safer because their authority, staging, provenance, recovery, and verifier stories are independently legible. A combined orchestrator would add new failure-order questions, progress semantics, partial success policy, cancellation behavior, and operator messaging.

If it is opened later, it should be a thin orchestration layer over the accepted service commands, not a new import path. It must preserve separate provenance, separate recovery, and explicit failure reporting for "topology succeeded / inventory failed" and the reverse.

## Operator Source Picker / UI Readiness

Recommendation: not ready yet.

Operator-facing source selection needs one more authority design step before UI work:

- the renderer may present a selected source, but may not become source authority;
- main/trusted context must convert operator intent into trusted local source authority;
- the picker must avoid arbitrary file inspection before authority is established;
- displayed paths should be redacted or minimized where possible;
- remote URLs must stay rejected for local import and routed only to future provider-backed download/build posture;
- selected storage and explicit budget must be shown as prerequisites, not inferred from app-local fallback;
- no automatic import should happen from selecting a source.

The source-disappears-after-authority edge should be proven before source picker/UI or broader operator import orchestration.

## Source-Disappears-After-Authority Disposition

Recommendation: mark as non-blocking for resting mechanics, blocking before operator-facing source selection or combined orchestration.

HS233 correctly marks this uncertainty. Current evidence covers authority blocking, successful fixture import, staged failure before promotion, failure after promotion before provenance, and concurrent import exclusion. It does not separately prove a source that exists when authority is accepted but disappears before source preparation or during zip extraction/read.

The required behavior should be:

- no visible lookup-table mutation;
- no success provenance write;
- staged temp cleanup where possible;
- explicit error code and recovery posture;
- no automatic retry;
- no path disclosure beyond safe display.

## Provider-Backed Download / Build Disposition

Recommendation: remain parked.

`sde.build-lookups` and `src/main/sde/sdeLookupBuilder.js` remain provider-capable and combined: they may download SDE material when no local source is supplied, then run both topology and inventory import and rewrite lookup tables. That is intentionally outside the accepted HS230/HS232 local-import posture.

Provider-backed download/build should not open until External I/O, provider/live gate, selected storage, budget, cache/source retention, interruption, and recovery semantics are explicitly designed for SDE download material. External I/O "on" must remain release to normal gates, not authorization.

## Support Artifact Disposition

Recommendation: not required before resting mechanics or the narrow source-disappears proof.

Support artifacts should stay parked unless Atlas opens broader operator-facing import. For that later stage, structured error/progress readouts may be enough at first. Full support artifacts should wait for support artifact path authority, contents contract conformance, redaction, retention, and storage-budget treatment.

SDE failure artifacts must not become Evidence/EVEidence, Discovery, Observation, Assessment Memory, product truth, deletion authority, or pruning authority.

## Runtime Enforcement Disposition

Recommendation: remain parked.

The accepted service checks are command-local authority checks, not runtime enforcement. Dry-run maps and inactive runtime hook previews should continue to be treated as read-only classification/fact surfaces. Do not use them to block SDE commands or authorize imports until active enforcement semantics are separately accepted.

## Old Script / `sde.build-lookups` Disposition

Recommendation: label or quarantine before broader operator use, but do not block resting the local mechanics.

The old developer scripts and lookup builder are useful for development but should not be treated as operator-safe product paths:

- `scripts/import-sde-topology.js` and `scripts/import-sde-inventory.js` are environment-variable driven and can import into a database when invoked.
- `scripts/sde-build-lookups.js` calls the combined lookup builder and may download if no source path is supplied.
- `sde.build-lookups` is still provider-capable and combined, with different authority semantics from the accepted local topology/inventory service paths.

Before any broader operator-facing surface, Atlas should either label these as developer-only/hazardous or add a small conformance/quarantine verifier that prevents accidental promotion of the old combined path as product authority.

## Current Verifier Sufficiency

Sufficient for resting local mechanics:

- HS230/HS231 topology real-local conformance and authority verifier evidence.
- HS232/HS233 inventory real-local conformance and authority verifier evidence.
- Existing local SDE source/readiness previews preserve read-only posture and do not inspect arbitrary user files.
- Existing command authority and service registry evidence keeps real local import commands non-renderer and `exclusive`.

Known limits:

- fixture/local verification only;
- no real operator source path inspection in this review;
- no real import/download/rewrite in this review;
- source-disappears-after-authority edge not separately proven;
- no source picker/UI authority design yet;
- no combined orchestration semantics yet;
- no provider-backed download/build readiness;
- strong-warning budget policy remains parked.

## Smallest Next Dev Packet, If Any

If SDE rests: no Dev packet.

If Overseer keeps SDE active: open only a narrow fixture-safe source-preparation failure proof for both accepted local commands. Suggested scope:

- prove source missing after authority acceptance for `sde.import.topology`;
- prove source missing after authority acceptance for `sde.import.inventory`;
- verify no visible rows or provenance are changed;
- verify cleanup/error/retry posture;
- no UI, no provider calls, no real source inspection, no download, no lookup rewrite against operator data.

Do not open combined orchestration, source picker/UI, support artifacts, runtime enforcement, or provider-backed download/build as the next packet unless Human/Overseer explicitly chooses a broader product direction.

## Verification Commands / Evidence Expected

Evidence reviewed for this advisory:

- `workspace/current.md`
- `workspace/OverseerHS234-sde-real-local-consolidation-advisory-request.md`
- `workspace/DevHS230-real-local-sde-topology-import-conformance.md`
- `workspace/OverseerHS231-hs230-real-local-sde-topology-conformance-review.md`
- `workspace/DevHS232-real-local-sde-inventory-import-conformance.md`
- `workspace/OverseerHS233-hs232-real-local-sde-inventory-conformance-review.md`
- `workspace/EngineeringSecurityHS222-sde-import-download-readiness-advisory.md`
- `workspace/EngineeringSecurityHS229-sde-post-proof-readiness-advisory.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `src/main/services/mutatingActionService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/localSdeSourcePostureService.js`
- `src/main/services/localSdeReadinessPreviewService.js`
- `src/main/services/externalIoStateService.js`
- `src/main/sde/sdeImporter.js`
- `src/main/sde/sdeInventoryImporter.js`
- `src/main/sde/sdeLookupBuilder.js`
- `scripts/import-sde-topology.js`
- `scripts/import-sde-inventory.js`
- `scripts/sde-build-lookups.js`
- `scripts/verify-sde-topology-real-local-conformance.js`
- `scripts/verify-sde-inventory-real-local-conformance.js`

Expected verification if a future Dev packet touches this area:

- `npm.cmd run verify:sde-topology-real-local-conformance`
- `npm.cmd run verify:sde-inventory-real-local-conformance`
- `npm.cmd run verify:sde-topology-import-rewrite-authority`
- `npm.cmd run verify:sde-inventory-import-rewrite-authority`
- `npm.cmd run verify:local-sde-source-posture`
- `npm.cmd run verify:local-sde-readiness`
- `npm.cmd run verify:sde-fixture`
- `npm.cmd run verify:sde-inventory`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:enforcement-dry-run`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:protected-terms`
- `git diff --check`

This advisory did not run real SDE import/download/source inspection or lookup-table rewrite commands.

## Parked Items

- Provider-backed SDE download/build.
- `sde.build-lookups` product use.
- Combined topology plus inventory orchestration.
- Operator source picker/UI.
- SDE support artifacts or trace packs.
- Runtime enforcement or command blocking.
- Strong-warning budget policy.
- App-local fallback as sufficient authority for real local import.
- Script promotion to operator-safe workflow.

## Human / Overseer Decisions Needed

- Should SDE local import mechanics rest now, or should Atlas prove the source-disappears edge first?
- If continuing, should the next packet be source-disappears proof or source-picker authority design?
- Should old scripts and `sde.build-lookups` be explicitly labeled/quarantined before any operator-facing SDE work?
- When, if ever, should app-local fallback be sufficient for SDE lookup rewrites?
- What budget warning policy should apply below hard-lock?
- Should support artifacts be required before operator-facing SDE import, or should structured error/progress readouts come first?
- When should provider-backed SDE download/build be revisited?
