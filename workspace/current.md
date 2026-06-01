# AURA Atlas Current Work

Status: HS168 Runtime enforcement activation readiness advisory open
Last updated: 2026-06-01

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: determine whether Atlas is ready to move from inactive runtime-enforcement proof surfaces toward a first active hook, without authorizing implementation yet.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Engineering / Security advisory

Expected handoff filename:

```txt
workspace/EngineeringSafetyAuditHS168-runtime-enforcement-activation-readiness.md
```

This is not a Dev runway.

## Source Of Intent

Recent accepted runtime-enforcement spine:

- HS148 proved composed gate policy preview.
- HS162 proved the runtime enforcement boundary preview.
- HS164 extracted the inactive pure runtime enforcement evaluator.
- HS166 proved dry service-boundary fact assembly for that evaluator.
- HS167 accepted HS166 after correcting trusted/internal confirmation-bypass semantics.

Human direction:

- continue system hardening before UI/body work
- do cheap proof and assurance before expensive implementation
- one seam at a time
- do not drift into broad architecture or hidden active behavior

Accepted interpretation:

- Atlas has enough runtime-enforcement proof material to ask whether activation is ready.
- Atlas does not yet have authority to activate runtime command blocking.
- The next useful action is an advisory readiness audit, not a Dev implementation packet.

Accepted source material:

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

Accepted proof surfaces:

- `storage.enforcement_dry_run.command_effect_map`
- `storage.composed_gate_policy.preview`
- `support.gate_stack_readout`
- `metadata.hydration_execution_policy.preview`
- `support.artifact_path_authority.preview`
- `support.artifact_creation_policy.preview`
- `external_io.state_config_readback`
- `storage.authority_config.readback`
- `storage.setup_gate_readout`
- `runtime.enforcement_boundary.preview`
- `runtimeEnforcementEvaluator.evaluateRuntimeEnforcementDecision`
- `runtime.enforcement_adapter.dry_preview`
- `runtimeEnforcementDryAdapter.buildDryRuntimeEnforcementAdapterDecision`

## Current State

HS142, HS144, HS146, HS148, HS150, HS152, HS154, HS156, HS158, HS160, HS162, HS164, and HS166 are accepted.

No active runtime enforcement exists yet.

Known insertion point:

- `src/main/services/serviceRegistry.js`
- `invokeServiceCommand(command, payload, context)`
- current order: validate envelope, resolve command, require DB, renderer eligibility, confirmation authority, optional task wrapping, then handler dispatch
- accepted preview order: validate envelope, resolve command, require DB, renderer eligibility, confirmation authority, runtime enforcement boundary, optional task wrapping, then handler dispatch

HS166 accepted facts:

- The dry adapter is preview-only and inactive.
- The dry adapter is not inserted into `invokeServiceCommand`.
- The dry adapter assembles evaluator facts from command metadata/definition, payload, context, and explicit supplied gate facts only.
- Missing composed/storage/External I/O/provider/path facts remain explicit missing fact classes.
- Dry-run `would_allow` remains non-authorizing.
- External I/O on remains non-authorizing.
- Unknown/unclassified fail-closed remains inactive policy intent only.
- Trusted/internal confirmation bypass is distinct from satisfied operator confirmation.

## Advisory Runway

Run a runtime enforcement activation readiness audit.

Ordered steps:

1. Read the accepted source material listed above.
2. Trace the current service command path from `invokeServiceCommand` through renderer eligibility, confirmation authority, optional task wrapping, and handler dispatch.
3. Trace how composed gate policy, dry-run command/effect coverage, runtime boundary preview, runtime evaluator, and dry adapter currently relate.
4. Identify what facts would be required at the live service boundary before active enforcement could make a decision.
5. Identify which facts are currently available without side effects and which would require readout builders, config reads, DB reads, provider checks, task state, or new plumbing.
6. Test the risky cases conceptually and against existing verifiers where possible:
   - renderer-forged payloads
   - trusted/internal config writes
   - confirmation-required commands
   - provider-backed Discovery
   - ESI Evidence/EVEidence expansion
   - Hydration write
   - Watch execution
   - support artifact creation
   - unknown or unclassified commands
7. Decide whether Atlas is ready for a first active hook.
8. If ready, recommend the smallest safe implementation shape.
9. If not ready, name the smallest missing proof or data seam.
10. List exact verification commands a future Dev packet would need.

## Guardrails

- Advisory only.
- Do not edit files.
- Do not create a Dev runway inside the advisory artifact.
- Do not activate runtime enforcement.
- Do not insert the dry adapter into `invokeServiceCommand`.
- Do not change command dispatch.
- Do not introduce command blocking.
- Do not call providers.
- Do not call zKill, ESI, or SDE download.
- Do not write Evidence/EVEidence.
- Do not mutate Discovery refs.
- Do not write Hydration output.
- Do not write storage config.
- Do not create support artifacts.
- Do not run cleanup, deletion, pruning, restore, move, copy, migration, upload, or packaging.
- Do not change schema.
- Do not do renderer/UI work.
- Do not treat dry-run `would_allow` as authorization.
- Do not treat External I/O on as authorization.
- Do not treat trusted/internal confirmation bypass as confirmation satisfaction.
- Do not recommend broad global blocking unless the audit proves no smaller safe seam exists.

## Stop Conditions

Stop and return to Overseer/Human if:

- the auditor cannot determine what facts active enforcement would need
- the auditor finds current proof surfaces disagree
- the auditor finds active enforcement would require broad architecture before a first hook
- the auditor finds provider/live/destructive/private actions are needed to assess readiness
- the auditor finds unknown/unclassified command policy would create unacceptable false blocking
- the auditor finds service-boundary insertion would risk changing trusted/internal behavior without a separate Human decision

## Required Verification

This advisory should run only local/offline checks if useful:

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

No live/API/provider verification is authorized.

## Expected Advisory Output

The handoff should include:

1. Files reviewed.
2. Current runtime-enforcement proof chain.
3. Activation readiness finding: ready / not ready / ready only for a narrower seam.
4. Fact availability table:
   - fact needed
   - current source
   - side-effect risk
   - confidence
   - gap
5. Risk analysis for renderer, trusted/internal, provider-backed, support artifact, Hydration, Watch, and unknown commands.
6. Recommended smallest next step.
7. Non-goals and rejected broader approaches.
8. Verification commands and expected evidence for a future Dev packet.
9. Human / Overseer decisions needed.

## Evidence

HS168 opened as advisory readiness audit.

No implementation evidence yet.

## Dev Handoff

No Dev handoff expected.

Expected advisory artifact:

- `workspace/EngineeringSafetyAuditHS168-runtime-enforcement-activation-readiness.md`

Latest accepted Overseer review:

- `workspace/OverseerHS167-hs166-dry-runtime-enforcement-adapter-review.md`
