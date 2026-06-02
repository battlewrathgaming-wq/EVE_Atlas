# Engineering Safety Audit HS210 - Runtime Enforcement Readiness Review

Status: advisory review complete
Date: 2026-06-02
Role: Engineering / Security reviewer
Milestone: Atlas Storage And Runtime Hardening
Topic: runtime enforcement activation readiness

## Request Received

Review whether Atlas is ready to move from inactive runtime enforcement hook proofing toward any active runtime enforcement design.

This review is assurance only. It does not implement code, activate runtime enforcement, block commands, call providers, write config, change schema, create support artifacts, move storage, add UI work, or rename terminology.

Expected question:

- Is Atlas ready to move from inactive runtime enforcement hook proofing toward any active runtime enforcement design, or does it need narrower proof/fact closure first?

## Executive Finding

Atlas is ready for a later active-enforcement design discussion, but it is not ready for active command blocking implementation.

The current inactive hook fact sourcing is coherent as assurance evidence: it preserves renderer eligibility and confirmation before the hook, sources compact read-only posture after those checks, keeps task wrapping and handler dispatch after the hook, and repeatedly marks sourced facts as non-authorizing preview material.

The next safe step should be narrower proof/fact closure before any active blocking packet. The main missing fact is `watch_runtime` for Watch-driven/background execution. The dry adapter already treats Watch execution as requiring `watch_runtime`, but the inactive hook does not source that class yet. That is acceptable while the hook is preview-only; it becomes a blocker before active enforcement for `actor.watch`, `system.radius.watch`, `watch.executor.arm`, and `watch.executor.tick`.

## Blocking Issues Before Active Command Blocking

1. Watch/task runtime fact sourcing remains missing for active enforcement.

   Evidence: `runtimeEnforcementDryAdapter.missingFactClassesFor(...)` adds `watch_runtime` for Watch execution commands, and HS209 still records Watch/task runtime fact sourcing as unopened. Composed policy has representative Watch gates, but the current hook does not source current-command Watch/task runtime facts into the adapter preview.

   Risk: active blocking could either overblock patient scheduled work or underblock due/background provider movement if it tries to decide from storage, External I/O, provider/live, and composed-policy posture alone.

   Recommendation: before active blocking is scoped, add a read-only `watch_runtime` / task-runtime fact preview, or explicitly restrict the first active design to commands that cannot dispatch Watch/background/provider work.

2. Active decision semantics are not yet accepted.

   Evidence: evaluator states are `pass`, `block`, `conditional`, and `stop_before_boundary`, but all current surfaces mark `active: false`, `preview_only: true`, and non-authorization notes. Composed policy says `would_allow`, `pass`, `conditional`, `hold`, and `block` do not answer "may run now."

   Risk: a future implementation could accidentally treat preview `pass` or dry-run `would_allow` as runtime authorization.

   Recommendation: require a policy semantics packet before implementation: which facts are mandatory, which states stop before dispatch, which states hold instead of fail, and which commands are excluded.

3. Supplied trusted facts are intentionally preserved, but active authority doctrine is not yet defined.

   Evidence: hook tests prove supplied `runtimeEnforcementFacts` are not overwritten, including supplied `coverage: null`. This is correct for proofing and fixtures.

   Risk: if reused for active enforcement without a trusted-source rule, injected context facts could become a bypass or an overblock vector.

   Recommendation: later active enforcement must define who may supply facts, when supplied facts override sourced facts, and whether renderer-origin contexts are categorically ignored for authority-bearing facts.

## Non-Blocking Risks To Mark

- The current fact model is coherent but still partly representative. `storage.composed_gate_policy.preview` uses representative rows and compact row matching; that is good enough for preview, not enough as a full active policy table for every command effect.
- Storage authority, budget, External I/O, provider/live, and path facts are current readouts, not durable authorization snapshots. A future active hook must decide whether facts are sourced per invocation and how stale config/readback posture is handled.
- Provider/live gate readout includes request-control and cooldown/lockout posture. Current tests show the hook does not record attempts or mutate cooldown state; future active code must preserve that separation.
- Destination/path authority is compact and ignores renderer path claims. It should remain separate from support artifact creation policy and actual writer validation.
- External I/O `on` remains release to normal gates, not authorization. Future work must preserve no immediate dispatch and no catch-up flood.
- Unknown/unclassified fail-closed is policy intent only. It should not be claimed as active behavior until an explicit runtime implementation exists.

## Missing Facts Or Tests

Missing before active blocking:

- Current-command `watch_runtime` posture for Watch execution and Watch executor commands.
- Current-command task/runtime duplicate posture for task-dispatched or cancellable operations, including whether task facts come from `defaultTaskRunner` or another stable source.
- Active-policy fixture matrix proving mandatory-fact behavior: missing fact class, stale fact, malformed fact, renderer-origin forged fact, unmapped command, and representative provider/support-artifact/Watch commands.
- Active semantics for `conditional` and `hold`: whether they block, defer, return a structured hold, or pass to existing handler gates.
- Bypass doctrine for trusted/internal commands and confirmation bypass. Current behavior distinguishes trusted/internal bypass from confirmation satisfaction; active policy must preserve that distinction.

Useful existing tests already present:

- `verify:runtime-enforcement-hook`
- `verify:runtime-hook-telemetry`
- `verify:enforcement-dry-run`
- `verify:composed-gate-policy`
- `verify:support-artifact-path-authority`
- `verify:service-registry`
- `verify:command-authority`
- `verify:passive-side-effects`

## Hook Placement And Boundary Assessment

The placement is appropriate for inactive proofing and for later design discussion:

- Unknown commands stop before the hook.
- Renderer-ineligible commands stop before the hook.
- Missing renderer confirmation stops before the hook.
- The hook runs before task wrapping and handler dispatch.
- Observer failures are swallowed and do not alter command behavior.
- The hook itself reports no handler calls, task runner calls, provider calls, repository calls, file writes, or config writes.

Security posture: healthy as a preview boundary. Not yet sufficient as an active enforcement boundary until mandatory facts and active semantics are accepted.

## Spoofing / Misleading Fact Concerns

- Renderer payload path claims are ignored for destination/path authority and are not echoed in hook facts.
- Renderer eligibility and confirmation are enforced before the hook for renderer-origin service calls.
- Renderer payloads cannot directly supply active authority facts through the IPC service path, but internal/trusted context can supply `runtimeEnforcementFacts`; this remains acceptable for diagnostics and fixtures only.
- `allowed` fields from provider/live gate and `would_allow` fields from dry/composed previews are explicitly marked non-authorizing.
- Supplied `coverage: null` is preserved as missing coverage. This is good test hygiene, but active enforcement must never let untrusted null facts weaken required classification.

## Atlas Data-Layer Boundary Assessment

The current model preserves Atlas boundaries:

- Discovery remains possible leads/provenance, not Evidence/EVEidence.
- ESI expansion remains Evidence/EVEidence creation and is provider/storage gated.
- Hydration remains readability repair, not Evidence/EVEidence creation.
- Watch remains operational acquisition intent, with Watch/task runtime facts still unopened.
- Assessment Memory remains local operator judgment, not Evidence/EVEidence or provider truth.
- Support artifacts remain support/recovery/debug material, not Evidence/EVEidence, Observation, Assessment Memory, product truth, deletion authority, or pruning authority.
- Storage authority and budget remain trust-boundary posture, not provider/API pacing.
- External I/O remains provider-contact trust posture, separate from live/provider cadence and Watch arming.
- Runtime authorization remains inactive.

## Whether Watch / Task Facts Are Needed First

Yes, for any active enforcement design that includes Watch, background dispatch, provider-capable work, task wrapping, or command blocking near `invokeServiceCommand`.

Watch/task facts can stay parked only if the next packet is explicitly a design-only packet or a no-blocking proof that excludes Watch/background execution. They should not stay parked for a first active blocking implementation.

## Smallest Recommended Next Packet

Smallest safe next packet:

`runtime hook Watch/task runtime fact preview`

Scope:

- source compact read-only `watch_runtime` facts for Watch-driven commands
- source compact task/active-duplicate facts only if already available from existing runner/readout state
- keep facts non-authorizing
- preserve supplied trusted facts without overwriting
- avoid task dispatch, handler calls, provider calls, provider attempt recording, Watch mutation, DB writes, config writes, support artifacts, schema changes, and UI work

If Human/Overseer prefer to stop proofing and discuss design first, the safe design packet should be explicitly advisory-only and must exclude active command blocking.

## Acceptance Criteria For Next Packet

- `actor.watch`, `system.radius.watch`, `watch.executor.arm`, and `watch.executor.tick` receive explicit Watch runtime fact posture.
- Non-Watch commands report not-applicable Watch posture.
- Missing/malformed Watch state is reported as posture, not guessed.
- External I/O off remains held, not failure.
- External I/O on remains release to normal gates, not dispatch permission.
- Provider/live facts remain read-only and do not record attempts or mutate cooldown/lockout.
- Active task/duplicate posture does not start, cancel, or mutate tasks.
- Renderer payloads cannot forge Watch/task runtime posture.
- The hook remains inactive and behavior-preserving.
- The verifier proves no provider calls, no handler dispatch from the hook, no task runner calls from the hook, no writes, no support artifacts, and no blocking.

## Verification Evidence Reviewed

Read from disk:

- `AGENTS.md`
- `workspace/README.md`
- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/current.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- shared Engineering and Security role prompts
- `workspace/OverseerHS210-runtime-enforcement-readiness-review-request.md`
- `workspace/OverseerHS169-hs168-runtime-enforcement-readiness-review.md`
- `workspace/OverseerHS171-hs170-inactive-service-boundary-hook-review.md`
- `workspace/OverseerHS173-hs172-runtime-hook-coverage-fact-review.md`
- `workspace/OverseerHS175-hs174-runtime-hook-telemetry-readout-review.md`
- `workspace/OverseerHS203-hs202-runtime-hook-gate-fact-review.md`
- `workspace/OverseerHS205-hs204-runtime-hook-provider-live-gate-review.md`
- `workspace/OverseerHS207-hs206-runtime-hook-composed-policy-review.md`
- `workspace/OverseerHS209-hs208-runtime-hook-destination-path-authority-review.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/features/data-layer-boundaries.md`
- `src/main/services/serviceRegistry.js`
- `src/main/services/runtimeEnforcementEvaluator.js`
- `src/main/services/runtimeEnforcementDryAdapter.js`
- `src/main/services/runtimeHookTelemetryReadoutService.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/composedGatePolicyService.js`
- `src/main/services/storageSetupGateReadoutService.js`
- `src/main/services/supportArtifactPathAuthorityService.js`
- `scripts/verify-runtime-enforcement-hook.js`
- `scripts/verify-runtime-hook-telemetry.js`
- `scripts/verify-enforcement-dry-run.js`
- `package.json`

Filename note: the HS210 request names older expected filenames for HS169/171/173/175; the matching on-disk accepted files are the `*-review.md` / `*-readout-review.md` names listed above.

Verification commands run for this advisory:

- `npm.cmd run verify:runtime-enforcement-hook` passed.
- `npm.cmd run verify:runtime-hook-telemetry` passed.
- `npm.cmd run verify:enforcement-dry-run` passed.
- `npm.cmd run verify:composed-gate-policy` passed.
- `npm.cmd run verify:support-artifact-path-authority` passed.
- `npm.cmd run verify:service-registry` passed.
- `npm.cmd run verify:command-authority` passed.
- `npm.cmd run verify:passive-side-effects` passed.
- `npm.cmd run verify:protected-terms` passed with warning-only advisory output: 9 warnings in this artifact; no renames and no protected-word JSON updates performed.
- `git diff --check` passed.
- `git status --short --branch` showed only this new advisory artifact as untracked on `main...origin/main`.

## Items To Park

- Active runtime enforcement implementation.
- Any command blocking.
- Runtime support artifact creation or writer changes.
- Provider/API calls and provider attempt recording.
- Config writes, schema changes, storage movement, and UI work.
- Broad enforcement across all command classes before active semantics are accepted.
- Destructive pruning/deletion execution.
- Treating support artifacts, snapshots, trace packs, readiness/preflight, or logs as Evidence/EVEidence, Observation, Assessment Memory, product truth, or deletion/pruning authority.

## Human / Overseer Decisions Needed

1. Decide whether HS211 should be a narrow Watch/task runtime fact preview, or an advisory-only active enforcement semantics design.
2. Decide whether the first active blocking implementation, when eventually opened, must exclude Watch/background/provider-capable commands until `watch_runtime` and active-task facts are sourced.
3. Decide who may supply active authority facts in future runtime enforcement and whether supplied facts are allowed only from trusted/internal contexts.
4. Decide how active policy should handle `conditional`, `hold`, `unknown`, missing fact classes, malformed facts, and source readout errors.

## Bottom Line

Proceed to narrower proof/fact closure first. Atlas has a good inactive hook and a coherent fact spine, but active command blocking should wait until Watch/task runtime facts and active decision semantics are accepted.
