# Engineering Safety Audit HS138 - Enforcement Dry-Run Coverage Review

Status: advisory audit artifact
Date: 2026-05-31
Role: Atlas Engineering / Safety Auditor

## Request Received

Audit the accepted HS137 storage enforcement dry-run command/effect map before Atlas considers real enforcement.

Focus areas:

- command/effect coverage
- missing write/provider paths
- storage setup and budget bypass risks
- External I/O separation
- whether dry-run evidence is sufficient to discuss real enforcement
- whether any runtime enforcement design would need more proof first

This artifact is advisory only. It does not implement code, create a Dev runway, change files beyond this audit note, run provider/API calls, or formally accept runtime enforcement.

## Files Reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `workspace/OverseerHS138-hs137-enforcement-dry-run-review.md`
- `workspace/DevHS137-enforcement-dry-run-command-effect.md`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/storageSetupGateReadoutService.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-service-registry.js`

## Coverage Findings

The dry-run proof is good enough as a representative storage-enforcement map, but not enough as a complete real-enforcement basis yet.

The main coverage gap is that `enforcementDryRunService.js` maps a hand-picked representative list, while `serviceRegistry.js` contains additional commands with write, provider, or runtime-control effects.

Important omitted command families:

- Provider/Evidence paths: `actor.watch`, `system.radius.watch`, `watch.executor.arm`, `watch.executor.tick`
- External/provider metadata path: `sde.build-lookups`
- Local mutation paths: `app.prepare`, `watch.create`, `watch.update`, `watch.recordRun`, `runtime.db_snapshot.settings.update`
- SDE local rewrite paths: `sde.import.topology`, `sde.import.inventory`
- Runtime-control paths: `watch.executor.disarm`, `task.cancel`
- Fixture/proof mutation commands: `storage.authority_config.write_proof`, `storage.authority_config.acknowledgement_persistence_proof`

The action-class matrix itself is broader than the representative command list. `storageSetupGateReadoutService.js` includes classes such as `setup_config_changes` and `background_hydration`, but the dry-run command map does not yet prove every live registry command is classified into one of those classes.

## Bypass Or Drift Risks

Highest risk: future real enforcement could accidentally protect `manual.discovery` / `manual.expansion` while leaving scheduled or direct Watch execution paths uncovered. `actor.watch`, `system.radius.watch`, `watch.executor.arm`, and `watch.executor.tick` are provider/Evidence-capable commands, but they are not represented in the dry-run command list.

Second risk: command/effect drift. The current mapping is manual. If a new command is added to `serviceRegistry.js`, current dry-run verification does not require it to be mapped or explicitly exempted.

Third risk: storage enforcement and support-artifact enforcement are partly different problems. Snapshot creation is represented, but snapshot settings update, SDE imports/builds, app prepare, trace pack output path behavior, and storage config proof commands need explicit enforce / exempt / fixture-only classification before runtime interception.

## External I/O Separation Assessment

External I/O separation is mostly healthy.

The dry-run explicitly says External I/O is not enforced here, and `provider_gated` means storage would allow only if other provider gates pass. That matches the HS138 interpretation.

Risk: `would_allow` for provider-backed commands is easy to overread. Before real enforcement, the design should avoid a single boolean-like allow result for provider commands unless the response also carries separate gate posture such as:

```text
storage_allows: true/false
external_io_allows: true/false/not_implemented
live_gate_allows: true/false
cadence_allows: true/false
confirmation_present: true/false
```

Storage separation is sound. Cross-gate composition is not proven yet.

## Missing Representative Commands / Effects

Recommended additional representatives or explicit exemptions:

- `actor.watch`
- `system.radius.watch`
- `watch.executor.arm`
- `watch.executor.tick`
- `sde.build-lookups`
- `sde.import.topology`
- `sde.import.inventory`
- `watch.create`
- `watch.update`
- `watch.recordRun`
- `runtime.db_snapshot.settings.update`
- `task.cancel`
- `app.prepare`
- `runtime.db_snapshot.settings.get` as read-only contrast if useful
- `storage.authority_config.write_proof` and `storage.authority_config.acknowledgement_persistence_proof` as fixture-only / non-runtime-enforcement exemptions

Also add coverage for `background_hydration`, since the action class exists but no representative command currently exercises it.

## Real Enforcement Readiness

Atlas is ready for real enforcement design discussion.

Atlas is not ready for runtime enforcement implementation.

The dry-run evidence is sufficient to discuss enforcement shape, command classes, and expected storage posture. It is not sufficient to wire actual interception/blocking because it does not yet prove:

- full registry coverage
- automatic drift detection
- External I/O composition
- scheduled/background command coverage
- fixture/proof command exemption policy

## Recommended Smallest Next Seam

The smallest next seam is:

```text
Complete command/effect coverage inventory for enforcement dry-run.
```

Acceptance shape:

- every `serviceRegistry` command is mapped to an enforcement class or explicit exemption
- every non-read-only command has storage posture
- every provider-capable command also declares External I/O dependency separately
- every fixture/proof command is marked fixture-only or non-production
- verifier fails when a new command is added without classification
- no runtime blocking, provider calls, Evidence writes, hydration writes, file movement, schema migration, or UI redesign

## Boundary Confirmation

No code was changed.

No runtime enforcement, command interception, storage lockout, provider/API call, Evidence/EVEidence write, hydration write, DB movement, storage movement, pruning/deletion execution, schema change, renderer redesign, or Dev runway was created by this audit.

## Verification / Evidence

This was an advisory review only.

Evidence used:

- source and workspace files listed above were read from local disk
- command coverage was compared against `serviceRegistry.js`
- no tests were run because no runtime behavior was changed
