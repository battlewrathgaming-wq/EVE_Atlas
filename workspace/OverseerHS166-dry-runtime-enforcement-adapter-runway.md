# OverseerHS166 - Dry Runtime Enforcement Adapter Runway

Status: opened
Date: 2026-06-01

## Purpose

Open the next narrow Storage And Runtime Hardening packet after HS165.

Atlas now has:

- command/effect classification
- composed gate policy preview
- service-boundary preview
- pure runtime enforcement evaluator

The next step is not broad active command blocking. The next step is a dry adapter proof: show how `invokeServiceCommand(command, payload, context)` would assemble explicit facts for the evaluator at the accepted boundary, without changing runtime command behavior.

## Accepted Direction

This packet prepares active enforcement, but remains dry/non-enforcing.

It should answer:

- What facts can the service boundary assemble before handler dispatch?
- Which facts are missing without calling readout builders?
- What dry adapter decision would be produced for representative commands?
- Can the adapter prove "would block" without actually blocking?
- Can the adapter prove "would pass" without turning dry-run `would_allow` into authorization?

## Executor

Dev

## Expected Handoff

```txt
workspace/DevHS166-dry-runtime-enforcement-adapter.md
```

## Boundary

The dry adapter may live near `serviceRegistry.invokeServiceCommand`, but it must not be inserted as active command behavior.

If Dev adds a helper, it should be explicitly named as dry, preview, or inactive.

## Ordered Runway

1. Read HS165, `serviceRegistry.invokeServiceCommand`, `runtimeEnforcementEvaluator`, `runtimeEnforcementBoundaryService`, command metadata, composed gate policy, and dry-run coverage.
2. Add a dry adapter helper that assembles evaluator facts from service command definition, payload, and context without calling target handlers.
3. The dry adapter may use already-available command metadata and explicit context facts only. It must not call providers, repositories, file writers, config writers, task runners, or mutating services.
4. The dry adapter result should include:
   - command
   - source
   - renderer eligibility posture
   - confirmation posture
   - trusted/internal context posture
   - evaluator decision
   - `would_block_if_active`
   - `would_dispatch_if_active`
   - `active: false`
   - `preview_only: true`
   - missing fact classes that would be needed before active enforcement
5. Prove the adapter can represent:
   - safe local read/report
   - renderer-ineligible trusted command
   - missing confirmation
   - satisfied confirmation
   - trusted/internal config write
   - provider-backed Discovery
   - ESI Evidence/EVEidence expansion
   - Hydration write
   - Watch execution
   - support artifact creation
   - unknown command before boundary
6. Prove dry adapter output does not change `invokeServiceCommand` behavior.
7. Keep unknown/unclassified fail-closed as inactive policy intent only.
8. Keep dry-run `would_allow` non-authorizing. If the dry adapter lacks composed gate facts, it should say so rather than treating fallback pass as execution authority.
9. Add focused verification and update Evidence / Dev Handoff.

## Guardrails

- No active runtime enforcement.
- No command interception.
- No actual command blocking.
- No behavior change to `invokeServiceCommand`.
- No handler dispatch from dry adapter tests.
- No task wrapping or task execution from dry adapter tests.
- No provider calls.
- No zKill calls.
- No ESI calls.
- No SDE download calls.
- No Evidence/EVEidence writes.
- No Discovery ref mutation.
- No Hydration writes.
- No storage config writes.
- No support artifact creation.
- No runtime snapshot creation.
- No trace-pack creation.
- No cleanup, delete, prune, restore, move, copy, migration, upload, or packaging.
- No schema migration.
- No renderer redesign or UI wording work.
- Do not promote `would_allow` into authorization.
- Do not treat External I/O on as authorization.
- Do not make unknown/unclassified fail-closed active runtime behavior.
- Do not import readout builders into the active command path unless the helper remains explicitly dry and tests prove no runtime behavior change.

## Stop Conditions

Stop and return to Overseer/Human if:

- Dev needs to change active `invokeServiceCommand` behavior
- Dev needs to block or intercept real commands
- Dev needs to call readout builders from the live command path
- Dev needs provider/API calls
- Dev needs file/DB/config writes
- Dev cannot distinguish missing facts from pass/block decisions
- Dev cannot keep `would_allow` non-authorizing
- the adapter becomes a broad enforcement framework instead of a dry proof of fact assembly

## Required Verification

Run syntax checks on every new or changed JavaScript file.

Run:

```powershell
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

If Dev adds `verify:runtime-enforcement-adapter`, run it and list it in the handoff.

## Non-Goals

- active command blocking
- full runtime enforcement
- provider-backed Hydration
- support artifact creation execution
- storage setup UI
- broad provider queues
- pruning/deletion execution
- renderer redesign
