# OverseerHS164 - Runtime Enforcement Evaluator Runway

Status: opened
Date: 2026-06-01

## Purpose

Open the smallest next Storage And Runtime Hardening packet after HS163.

Atlas now has:

- command/effect classification
- composed gate policy preview
- support gate readouts
- storage and External I/O real config readbacks
- support artifact creation policy preview
- runtime enforcement boundary preview

The next step should not activate runtime command blocking yet. First, Dev should extract a small, testable runtime enforcement evaluator so future active enforcement has one stable decision shape instead of borrowing ad hoc readout language.

## Accepted Direction

This packet prepares active enforcement, but remains non-enforcing.

It should answer:

- What exact decision object would a future runtime boundary consume?
- Which gates are inputs?
- Which reason codes are produced?
- Which commands would be pass, block, conditional, or stop-before-boundary?
- Which commands are explicitly out of scope for active enforcement right now?

## Executor

Dev

## Expected Handoff

```txt
workspace/DevHS164-runtime-enforcement-evaluator.md
```

## Boundaries

- No active runtime enforcement.
- No command interception.
- No actual command blocking.
- No handler dispatch from evaluator tests.
- No task wrapping or task execution from evaluator tests.
- No provider calls.
- No zKill, ESI, or SDE download calls.
- No Evidence/EVEidence writes.
- No Discovery mutation.
- No Hydration writes.
- No storage config writes.
- No support artifact creation.
- No schema or renderer changes.
- Do not promote `would_allow` into authorization.
- Do not treat External I/O on as authorization.
- Do not make unknown/unclassified fail-closed active runtime behavior.

## Ordered Runway

1. Read HS163, `runtimeEnforcementBoundaryService`, `composedGatePolicyService`, `enforcementDryRunService`, `gateStackReadoutService`, storage setup/readback, External I/O readback, support artifact creation policy, and `serviceRegistry.invokeServiceCommand`.
2. Add a pure evaluator module or helper for future runtime enforcement decisions.
3. The evaluator must accept explicit input facts; it must not call target command handlers, task runners, providers, repositories, file writers, or config writers.
4. The evaluator decision object should include at least:
   - command
   - known/classified status
   - boundary reachability
   - decision: `pass`, `block`, `conditional`, or `stop_before_boundary`
   - active: false
   - preview_only: true
   - reason codes
   - gate inputs used
   - non-authorizing notes for `would_allow` and External I/O on
5. Update `runtime.enforcement_boundary.preview` to use or expose the evaluator output where useful, without changing invocation behavior.
6. Add focused verifier coverage for representative commands:
   - safe local report/read
   - storage authority readback
   - storage authority trusted write
   - provider-backed Discovery
   - ESI Evidence/EVEidence expansion
   - Hydration write
   - Watch execution
   - support artifact creation
   - task cancellation
   - fixture-only proof command
   - unknown/unclassified future command
7. Prove the evaluator produces stable reason codes for storage missing, budget hard-lock, External I/O held, confirmation missing/satisfied, trusted-context required, path authority conditional, fixture-only, and unknown/unclassified.
8. Prove no runtime behavior changes by rerunning the boundary, registry, passive side-effect, composed policy, enforcement dry-run, gate stack, storage, support artifact, and protected-term checks.
9. Update Evidence / Dev Handoff and create the expected DevHS file.

## Stop Conditions

Stop and return to Overseer/Human if:

- evaluator extraction requires changing command execution behavior
- evaluator extraction requires active command blocking
- evaluator extraction requires live/provider/API calls
- evaluator extraction requires writing storage config, Evidence/EVEidence, Discovery refs, Hydration labels, support artifacts, snapshots, trace packs, files, or directories
- evaluator extraction requires schema or renderer work
- the evaluator cannot keep `would_allow` as non-authorizing input
- External I/O on becomes authorization
- unknown/unclassified command handling would become active runtime behavior
- the evaluator becomes a broad policy framework instead of a small command-boundary decision helper

## Required Verification

Run syntax checks on every new or changed JavaScript file.

Run:

```powershell
npm.cmd run verify:runtime-enforcement-boundary
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:storage-authority-config-write
npm.cmd run verify:support-artifact-creation-policy
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If Dev adds `verify:runtime-enforcement-evaluator`, run it and list it in the handoff.

## Non-Goals

- active runtime command blocking
- provider-backed Hydration
- support artifact creation execution
- storage setup UI
- broad provider queues
- pruning/deletion execution
- renderer redesign
