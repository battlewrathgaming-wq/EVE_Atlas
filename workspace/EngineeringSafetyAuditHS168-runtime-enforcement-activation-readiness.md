# EngineeringSafetyAuditHS168 - Runtime Enforcement Activation Readiness

Status: advisory audit artifact
Date: 2026-06-01
Role: Engineering Security advisory auditor
Milestone: Atlas Storage And Runtime Hardening
Topic: Runtime enforcement activation readiness after HS148 / HS162 / HS164 / HS166

## Request Received

Review whether Atlas is ready to move from inactive runtime-enforcement proof surfaces toward a first active service-boundary hook.

This artifact is advisory only. It does not implement code, create a Dev runway, activate enforcement, insert the dry adapter into `invokeServiceCommand`, change command dispatch, introduce blocking, call providers, write Evidence/EVEidence, mutate Discovery refs, write Hydration output, write storage config, create support artifacts, or change schema/UI.

## 1. Files Reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `workspace/OverseerHS149-hs148-composed-gate-policy-review.md`
- `workspace/OverseerHS163-hs162-runtime-enforcement-boundary-review.md`
- `workspace/OverseerHS165-hs164-runtime-enforcement-evaluator-review.md`
- `workspace/OverseerHS167-hs166-dry-runtime-enforcement-adapter-review.md`
- `workspace/DevHS148-composed-gate-policy.md`
- `workspace/DevHS162-runtime-enforcement-boundary-preview.md`
- `workspace/DevHS164-runtime-enforcement-evaluator.md`
- `workspace/DevHS166-dry-runtime-enforcement-adapter.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `src/main/services/serviceRegistry.js`
- `src/main/services/runtimeEnforcementBoundaryService.js`
- `src/main/services/runtimeEnforcementEvaluator.js`
- `src/main/services/runtimeEnforcementDryAdapter.js`
- `src/main/services/composedGatePolicyService.js`
- `src/main/services/enforcementDryRunService.js`

## 2. Current Runtime-Enforcement Proof Chain

HS148 proved `storage.composed_gate_policy.preview`: a read-only composition of service classification, storage, budget, External I/O, provider/live gate, cadence, Watch arming, active task posture, confirmation metadata, path authority, and trusted-context posture.

HS162 proved `runtime.enforcement_boundary.preview`: the accepted future insertion point in `invokeServiceCommand(command, payload, context)` after envelope validation, command resolution, DB context, renderer eligibility, and confirmation authority, and before task wrapping / handler dispatch.

HS164 proved `runtimeEnforcementEvaluator.evaluateRuntimeEnforcementDecision(facts)`: a pure inactive evaluator that consumes explicit facts and returns `pass`, `block`, `conditional`, or `stop_before_boundary` without side effects.

HS166 proved `runtime.enforcement_adapter.dry_preview` / `runtimeEnforcementDryAdapter.buildDryRuntimeEnforcementAdapterDecision`: service-boundary fact assembly from command metadata/definition, payload, context, and explicit supplied gate facts. It reports missing fact classes and refuses to treat dry-run `would_allow` as authority.

HS167 corrected confirmation semantics: trusted/internal confirmation bypass is not confirmation satisfaction.

The live path in `serviceRegistry.js` remains unchanged:

1. `validateServiceInvokeEnvelope`
2. resolve command definition
3. require `context.db`
4. `assertCommandEligible`
5. `assertCommandAuthority`
6. optional task wrapping
7. `definition.handler` dispatch

## 3. Activation Readiness Finding

Finding: ready only for a narrower seam.

Atlas is not ready for active runtime blocking.

Atlas is ready for a first inactive service-boundary integration hook only if that hook computes the evaluator decision from explicitly supplied/read-only facts, returns or records preview evidence, and never blocks, dispatches differently, calls providers, writes files, mutates DB state, or changes trusted/internal behavior.

The reason is practical: the insertion point is known, command coverage is complete, the evaluator is pure, and the dry adapter proves missing facts are visible. But the live service boundary does not yet assemble the required real facts from canonical readouts/config state in a side-effect-minimized way, and some fact classes would require deliberate plumbing choices.

## 4. Fact Availability Table

| Fact needed | Current source | Side-effect risk | Confidence | Gap |
| --- | --- | --- | --- | --- |
| Command known / definition | `COMMANDS` in `serviceRegistry.js` | none | high | live hook needs internal definition access, not just renderer metadata |
| Command classification/effects | `listServiceCommands()` metadata | none | high | metadata shape is available; active hook should avoid stale duplicate maps |
| Enforcement classification coverage | `COMMAND_ENFORCEMENT_COVERAGE` / `buildCommandCoverageReport()` | none | high | wrong classification still possible; verifier catches missing, not mistaken mappings |
| Renderer eligibility | `assertCommandEligible()` and command `renderer` flag | none | high | insertion after eligibility means renderer-ineligible commands stop before hook |
| Confirmation posture | `assertCommandAuthority()` plus dry adapter confirmation logic | none | medium-high | active hook after confirmation cannot inspect missing renderer confirmation unless ordering changes |
| Trusted/internal confirmation bypass posture | dry adapter `trusted_internal_bypasses_confirmation_front_door` | none | medium | must remain distinct from `confirmation_satisfied` |
| Storage authority | `storage.authority_config.readback`, `storage.setup_gate_readout` | config/readout only | medium | active hook needs canonical read path supplied without renderer-forged input |
| Storage budget | `storage.setup_gate_readout` / storage authority config | readout only | medium | active hook needs clear budget source and no dry-run fallback authority |
| External I/O state | `external_io.state_config_readback` / `external_io.state_readout` | config/readout only | medium-high | active hook must read canonical operator config; `on` is release, not authorization |
| Provider/live gate | `live.gate`, `actionGate`, `support.gate_stack_readout` | read-only; no provider call | medium | live gate can be computed, but payload/action mapping must be exact per command |
| Cadence/rate state | `actionGate` request control / task runner state | read-only/task memory | medium | service-boundary hook needs current task runner/context without dispatching |
| Watch arming/runtime state | Watch executor status / gate-stack readout | read-only/task memory | medium | active hook must cover `watch.executor.arm`, `watch.executor.tick`, direct Watch commands |
| Active task / duplicate state | `defaultTaskRunner.listTasks()` / gate-stack readout | read-only memory | medium | must be read before task wrapping without causing task execution |
| Destination/path authority | support artifact path/creation policy previews | readout only | medium | actual artifact commands still need concrete destination validation at boundary |
| Hydration execution posture | hydration execution policy preview | read-only | medium | provider-backed Hydration still needs future write/provider design before broad allow |
| Unknown/unclassified policy | composed policy + evaluator reason code | none | high conceptually | active fail-closed policy needs Human/Overseer decision for internal calls |
| Dry-run storage decision | enforcement dry-run map | none | high as input | must never authorize dispatch by itself |

## 5. Risk Analysis

### Renderer

Renderer eligibility is already enforced before the accepted boundary. Renderer-forged storage/path/External I/O facts are repeatedly guarded in the proof chain by backend-derived readouts. The first active-adjacent hook should preserve this by using backend/canonical facts only.

Risk: because the proposed boundary runs after confirmation, it cannot observe missing renderer confirmation cases unless the ordering changes. That is acceptable for a narrow first hook if the hook only evaluates commands that reached the boundary.

### Trusted / Internal

Trusted/internal commands can bypass front-door confirmation unless `context.enforceAuthority === true`. HS167 correctly prevents this from being called confirmation satisfaction.

Risk: active enforcement could accidentally reinterpret trusted/internal bypass as operator confirmation. The first hook should report `confirmation_not_enforced_at_front_door` and should not change trusted/internal behavior without a separate decision.

### Provider-Backed Discovery

`manual.discovery` has registry effects `external-live-api` and `local-data-mutation`, coverage `zkill_provider_required`, and confirmation metadata. The proof surfaces can identify storage, External I/O, provider/live gate, cadence, confirmation, and active task posture.

Risk: active allow would require all those gates, not dry-run `would_allow` or External I/O `on` alone.

### ESI Evidence/EVEidence Expansion

`manual.expansion` is evidence-creating and provider-backed. It is well represented in dry-run, composed policy, boundary preview, evaluator, and adapter tests.

Risk: treating a selected/acknowledged storage posture as sufficient authorization would bypass External I/O, provider gate, cadence, confirmation, and queue selection controls.

### Hydration

`metadata.hydration` is provider-backed readability metadata write, not Evidence/EVEidence creation. It has dedicated backlog, execution policy, and fixture writer proof context.

Risk: provider-backed/operator-real Hydration writes are still not broadly implemented as an active enforcement target. A first active hook should not select Hydration writes as the first blocking seam unless a dedicated Hydration runtime decision packet is opened.

### Watch

Watch execution is represented through `actor.watch`, `system.radius.watch`, `watch.executor.arm`, and `watch.executor.tick`. `watch.executor.arm` is renderer-eligible and may dispatch due Watch provider work; `watch.executor.tick` is trusted/internal.

Risk: enforcing only direct provider commands would miss scheduled/background dispatch. Any future active policy must cover the executor commands before handler dispatch.

### Support Artifacts

Snapshot and trace-pack creation are represented as support-artifact writes, with path authority and creation policy previews.

Risk: destination/path authority is conditional and command-specific. The first active hook should not broadly allow support artifact creation from composed `conditional`; it needs concrete destination facts and existing command-level validation.

### Unknown Or Unclassified Commands

Unknown/unclassified fail-closed is accepted as future policy intent and inactive now. The dry adapter can report missing `service_command_definition` and `classification_coverage`.

Risk: active fail-closed for unknown/internal commands could create false blocking if introduced broadly. This needs an explicit Human/Overseer decision before behavior changes.

## 6. Recommended Smallest Next Step

Recommended seam: first inactive service-boundary integration hook.

Shape:

- insert a non-blocking preview hook at the accepted boundary after `assertCommandAuthority` and before task wrapping
- call a small adapter/evaluator path using service definition, payload, context, and explicitly gathered canonical read-only facts
- return or log the decision as evidence, but always continue existing dispatch behavior
- prove no behavior change for renderer, trusted/internal, task, provider, support-artifact, Hydration, and unknown-command scenarios
- fail tests if the hook uses dry-run `would_allow` as authority or treats External I/O `on` as authorization

This is narrower than active blocking and more useful than another detached preview because it tests the live service-boundary plumbing without changing operator behavior.

## 7. Non-Goals And Rejected Broader Approaches

Rejected for the next seam:

- broad global command blocking
- making unknown/unclassified fail-closed active
- moving the boundary before confirmation checks
- changing trusted/internal confirmation behavior
- enforcing provider-backed Discovery, ESI expansion, Hydration, Watch, snapshots, or trace packs in one packet
- using `storage.enforcement_dry_run.command_effect_map` decisions as authorization
- using External I/O `on` as authorization
- creating support artifacts as proof
- provider/live/API verification

## 8. Future Dev Verification Commands And Expected Evidence

Future Dev packet should run at minimum:

```powershell
node --check src\main\services\serviceRegistry.js
node --check src\main\services\runtimeEnforcementDryAdapter.js
node --check src\main\services\runtimeEnforcementEvaluator.js
npm.cmd run verify:runtime-enforcement-adapter
npm.cmd run verify:runtime-enforcement-evaluator
npm.cmd run verify:runtime-enforcement-boundary
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Expected evidence:

- current command behavior remains unchanged for pass, block, conditional, missing-confirmation, trusted/internal, and unknown scenarios
- hook runs only after existing renderer eligibility and confirmation checks
- hook runs before task wrapping and handler dispatch
- no target handlers are called by the hook
- no task runners, providers, repositories, file writers, config writers, mutating services, or live provider calls are introduced by evaluator/adapter code
- missing fact classes remain visible
- dry-run `would_allow` remains non-authorizing
- External I/O `on` remains non-authorizing
- trusted/internal confirmation bypass remains distinct from confirmation satisfaction
- unknown/unclassified fail-closed remains inactive unless Human/Overseer explicitly authorizes active behavior

## 9. Human / Overseer Decisions Needed

- Is the next Dev seam allowed to touch `invokeServiceCommand` if the hook is strictly non-blocking and behavior-preserving?
- Should the first integrated hook compute decisions for all commands, or only for a representative allowlist while plumbing is proven?
- Should missing canonical fact classes produce telemetry/readout only, or should any be treated as future stop conditions before active blocking?
- Should trusted/internal calls continue bypassing front-door confirmation at the enforcement boundary, or should a later packet require explicit `enforceAuthority` for more internal paths?
- When active blocking is eventually considered, should unknown/unclassified fail-closed apply to trusted/internal calls as well as renderer calls?

## Local Verification Run For This Audit

Passed:

```powershell
npm.cmd run verify:runtime-enforcement-adapter
npm.cmd run verify:runtime-enforcement-evaluator
npm.cmd run verify:runtime-enforcement-boundary
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git status --short --branch
```

Verification notes:

- `verify:runtime-enforcement-adapter` reported 11 cases: 1 pass, 3 conditional, 2 stop-before-boundary, 5 block. The missing-fact proof kept dry-run `would_allow` non-authorizing.
- `verify:runtime-enforcement-evaluator` reported 13 cases: 2 pass, 4 conditional, 5 block, 2 stop-before-boundary.
- `verify:runtime-enforcement-boundary` confirmed the accepted insertion point and no target handler dispatch, task wrapping, command blocking, runtime interception, or provider movement.
- `verify:enforcement-dry-run` reported complete coverage for 64 commands and zero gaps.
- `verify:composed-gate-policy` reported 19 rows: 3 pass, 7 block, 9 conditional, with unknown/unclassified fail-closed still inactive.
- `verify:protected-terms` scanned no changed files before this artifact and exited 0 with no warnings.
- `git status --short --branch` before writing this artifact reported `main...origin/main [ahead 45]`.

## Boundary Confirmation

No product code was changed.

No runtime enforcement, active command blocking, command interception, provider call, zKill call, ESI call, SDE download, Evidence/EVEidence write, Discovery mutation, Hydration write, storage config write, support artifact creation, cleanup, deletion, pruning, restore, move, copy, migration, upload, schema change, or renderer/UI work was performed.
