# Engineering Safety Audit HS214 - Runtime Enforcement Semantics Design

Status: advisory design complete
Date: 2026-06-02
Role: Engineering / Security reviewer
Milestone: Atlas Storage And Runtime Hardening
Topic: active runtime enforcement semantics before command blocking

## Request Received

Define the active runtime enforcement semantics Atlas would need before any command blocking implementation is opened.

This is advisory design and assurance only. This artifact does not implement code, activate runtime enforcement, block commands, call providers, record provider attempts, write config, change schema, create support artifacts, move storage, change UI, or rename terminology.

Main question:

- What active runtime enforcement semantics would Atlas need before any command blocking implementation is opened?

## Executive Recommendation

Do not open active command blocking yet.

Atlas now has a coherent inactive fact spine, including Watch/task runtime posture, but active enforcement needs a semantics proof before implementation. The next safe packet should define and verify an active-decision semantics matrix without inserting enforcement into `invokeServiceCommand`.

Recommended staging:

1. Create an advisory or pure-function semantics proof that maps active states, mandatory facts, trusted fact sources, and command-family exclusions.
2. If accepted, implement only a non-blocking active-semantics preview using the current hook inputs.
3. If still accepted, stage first active enforcement on a narrow low-risk family, preferably local readout/preflight commands where no provider movement, writes, support artifacts, Watch dispatch, or destructive behavior can occur.

Global command blocking should remain parked.

## Proposed Active Decision Semantics

These meanings should be accepted before any implementation:

| State | Active meaning | Dispatch behavior | Notes |
| --- | --- | --- | --- |
| `stop_before_boundary` | Existing front-door checks stopped the call before runtime enforcement. | No dispatch. | Unknown command, renderer-ineligible command, or missing required confirmation remains owned by existing service front-door checks. Runtime hook should not duplicate or weaken them. |
| `pass` | All mandatory facts for the command family are present, fresh enough, trusted, and active-safe. | May continue to handler/task wrapping. | This is the only active state that may permit dispatch, and only when no required fact is missing or invalid. |
| `block` | A mandatory gate says the command must not proceed. | No dispatch. Return a structured runtime enforcement block posture. | Use for storage hard-lock, missing/unavailable storage for writes/provider movement, unknown/unclassified commands, non-production fixture commands in production, destructive execution without accepted runway, and explicit provider/live blockers that are not waiting states. |
| `hold` | Work is valid in principle but must wait. | No dispatch. Return a structured held posture, not an error/failure. | Use for `held_by_external_io`, provider cooldown, Watch not armed, active duplicate task, capacity wait, or safe waiting states. Waiting is not failure. |
| `conditional` | The current facts do not justify direct dispatch, but the command may still need existing handler-owned validation or an operator/setup step. | First active implementation should not dispatch on `conditional`. | Treat as "no active authorization" until a specific family defines a safe resolver. Do not silently pass. |
| `unknown` | Policy/fact state is not understood or not mapped. | No dispatch. | Unknown must be fail-closed in active mode, with a specific reason code. |
| missing mandatory fact | Required fact is absent. | No dispatch. | Missing mandatory facts must block authority claims. They may produce `hold` only when the missing fact is an accepted unavailable-readout/wait state, not when the fact class is absent. |
| malformed/stale/spoofed fact | Fact exists but cannot be trusted. | No dispatch. | Treat as `block` for authority-bearing inputs; optionally `hold` for volatile runtime facts where the accepted posture is "readout unavailable, retry later." |

Important distinction:

- `dry_run.would_allow`, provider/live `allowed`, External I/O `on`, Watch session armed, and destination/path authority are inputs only. None is authorization alone.

## Mandatory Fact Matrix By Command Family

The mandatory fact set should be command-family based, not global. A global matrix would either overblock harmless readouts or underprotect provider/write/support-artifact paths.

| Command family | Examples | Mandatory facts before active pass | First active stage? |
| --- | --- | --- | --- |
| Local readout / local report / preflight | `app.readiness`, `report.actor`, `watch.list`, `storage.setup_gate_readout`, `runtime.enforcement_hook_telemetry.readout` | command definition, classification coverage, renderer eligibility, composed policy or equivalent active row, storage authority only when the readout needs local DB access, storage budget only if the command reports budget-dependent posture | Yes, best first candidate if active proof proceeds |
| Local setup / config write | `app.prepare`, `external_io.state_config_write`, `storage.authority_config.write`, snapshot settings update | command definition, classification coverage, renderer eligibility, confirmation/trusted context where required, storage/path authority for target config path, composed active row | Not first; config writes are authority surfaces |
| Local metadata writes | `watch.create`, `assessment.create`, `watch.recordRun` | command definition, classification coverage, renderer eligibility, confirmation/trusted context, storage authority, storage budget, composed active row | Not first; write semantics need operator posture clarity |
| Provider-backed manual movement | `manual.discovery`, `manual.expansion`, `metadata.hydration` | command definition, classification coverage, renderer eligibility, confirmation, storage authority, storage budget, External I/O, provider/live gate, composed active row | Later; high value but high risk |
| Watch/background provider movement | `actor.watch`, `system.radius.watch`, `watch.executor.arm`, `watch.executor.tick` | provider-backed manual facts plus Watch/task runtime posture, Watch arming/schedule semantics where applicable, active duplicate task posture | Later; should not be first active enforcement |
| Support artifact writes | `runtime.db_snapshot.create`, `support.debug_trace_pack` | command definition, classification coverage, renderer eligibility, confirmation, storage authority, storage budget, destination/path authority, support artifact creation policy/writer validation, composed active row | Later; path and privacy sensitive |
| SDE/import/local lookup rewrites | `sde.import.*`, `sde.build-lookups` | command definition, classification coverage, trusted context, storage authority, storage budget, External I/O and provider/live gate only for download mode, local source path validation, composed active row | Later; split local-source and provider-download modes |
| Runtime task control | `task.cancel`, task list/get | for cancel: command definition, classification coverage, trusted/renderer eligibility, task identity validation, active task ownership/scope posture, composed active row | Not first; cancellation can alter running work |
| Fixture/proof commands | `*.write_proof`, fixture Hydration proof | command definition, fixture-only classification, trusted fixture context, explicit test root if any | Exclude from production active enforcement except explicit block/fixture-only allowlist |
| Destructive preview / destructive execution | `retention.preflight`, `retention.actions` | preview needs readout facts; execution remains future-runway-only | Exclude. Destructive execution should remain blocked until a separate deletion/pruning packet exists |

## Commands Excluded From First Active Enforcement

Exclude these from the first active command blocking implementation:

- all provider-backed commands: `manual.discovery`, `manual.expansion`, `metadata.hydration`, `actor.watch`, `system.radius.watch`, `watch.executor.arm`, `watch.executor.tick`, provider-backed `sde.build-lookups`
- all support artifact write commands: `runtime.db_snapshot.create`, `support.debug_trace_pack`
- all config write commands: `external_io.state_config_write`, `storage.authority_config.write`, snapshot settings update
- all fixture/proof write commands
- all destructive execution surfaces, especially `retention.actions`
- task cancellation until task ownership/scope semantics are accepted
- direct Watch/background execution until Watch/task active semantics are accepted as enforcement, not only preview

The first active implementation, if any, should either be:

- local readout/preflight only, or
- a semantics-only proof with no dispatch effect.

## Conditional, Hold, Missing, Malformed, And Stale Facts

Recommended active treatment:

- `conditional`: do not dispatch in the first active implementation. Return structured posture with the gate that requires setup/operator validation. Later command-family packets may choose a safe resolver.
- `hold`: do not dispatch. Return structured held posture. Do not mark Discovery refs failed, do not record provider attempts, do not mutate cooldown/lockout, do not start catch-up work.
- missing mandatory fact: do not dispatch. Return missing-fact posture. Missing facts must not silently fall back to dry-run `would_allow`.
- malformed authority fact: block, unless the family has an accepted "readout unavailable, retry later" hold state.
- stale volatile runtime fact: hold for Watch/task and provider cooldown contexts; block for storage authority, path authority, or config authority when stale means the boundary cannot be trusted.
- renderer-origin authority fact: ignore, do not echo sensitive claims, and do not let it override sourced facts.
- supplied trusted fact: allowed only from explicitly trusted internal/test contexts, never from renderer IPC. Supplied facts must carry source, family, and freshness posture if used for active decisions.

## Trusted Fact Supply Doctrine

Active authority facts should be sourced by the runtime hook from backend-owned read-only services wherever possible.

Allowed future sources:

- backend-owned service metadata and classification coverage
- backend readback of app-local storage and External I/O config
- backend-derived storage setup/budget readout
- backend provider/live gate readout that does not record attempts or mutate cooldown/lockout
- backend-derived destination/path authority preview
- backend-derived Watch/task runtime snapshot that does not call status helpers with side effects
- accepted pure active-policy semantics table

Disallowed as authority-bearing inputs:

- renderer payload facts
- arbitrary `runtimeEnforcementFacts` from IPC envelopes
- dry-run `would_allow`
- provider/live `allowed` alone
- External I/O `on` alone
- Watch session armed alone
- destination/path authority alone
- support artifact creation policy alone
- logs, trace packs, snapshots, readiness exports, or support artifacts

Supplied `runtimeEnforcementFacts` should remain for tests and internal diagnostics, but active mode needs an explicit trusted-context flag and should reject or ignore supplied facts from renderer-origin calls.

## Outside Runtime Hook Responsibility

The active runtime hook should not own everything.

Remain outside the hook:

- renderer command eligibility and service envelope validation
- confirmation token front-door checks
- provider calls and provider attempt recording
- live/provider cadence mutation and cooldown/lockout writes
- Watch arming, disarming, ticking, scheduling mutation, and durable recovery state
- task creation, task cancellation side effects, and task runner mutation
- support artifact writer validation and actual path/file creation
- storage migration, copy, restore, delete, prune, or cleanup behavior
- schema changes and DB writes beyond target command handlers
- Evidence/EVEidence creation semantics inside expansion handlers
- Discovery ref mutation inside discovery/expansion handlers
- Hydration label write semantics inside hydration handlers
- Assessment Memory write semantics inside assessment handlers
- UI wording, prompts, or display behavior

The hook should be a pre-dispatch gate, not a substitute for service-level validation.

## Verification Matrix Before Implementation

A semantics proof should cover at least:

- every decision state: `pass`, `block`, `hold`, `conditional`, `unknown`, `stop_before_boundary`
- every command family in the mandatory matrix
- missing mandatory fact for each family
- malformed fact for each authority class
- stale config/path/runtime facts
- renderer-forged storage, External I/O, path, Watch/task, provider, and composed-policy claims
- supplied facts from trusted context vs renderer context
- External I/O `off`, `on`, missing, malformed, and stale
- provider/live disabled, cooldown, lockout, unknown action, and allowed
- storage selected, fallback acknowledged, fallback stale, missing, invalid, budget warning, budget hard-lock
- Watch executor armed, disarmed, active task present, stale active task id, malformed executor state
- support artifact destination mapped, unmapped, and renderer-forged paths
- fixture/proof commands excluded from production active pass
- destructive execution blocked/future-runway-only
- no provider calls, no provider attempt recording, no config writes, no DB writes, no task dispatch, no support artifact creation, no storage movement, no UI work

## Smallest Possible Next Packet

Smallest safe next packet:

`runtime enforcement active semantics fixture matrix`

Scope:

- pure/advisory or pure-function only
- no insertion into `invokeServiceCommand`
- no behavior change
- no command blocking
- no provider calls
- no writes
- define active decision outputs and mandatory fact sets by command family
- prove renderer facts are ignored or rejected as authority
- prove missing facts cannot dispatch
- prove `hold` returns wait posture rather than failure

If implementation is desired after that, the next step should still be non-blocking: an active-semantics preview that reports what would happen, not an active gate.

## Acceptance Criteria For Next Packet

- Decisions have explicit active meanings and dispatch consequences.
- Mandatory facts are declared by command family.
- `conditional` and `hold` are not treated as pass.
- `hold` is non-failure and non-mutating.
- Missing/malformed/spoofed mandatory facts cannot silently pass.
- Renderer payload facts cannot supply authority.
- Trusted supplied facts are allowed only under explicit trusted/test context.
- External I/O on, dry-run `would_allow`, provider `allowed`, Watch arming, and destination/path authority are each proven non-authorizing alone.
- Fixture/proof and destructive execution commands cannot active-pass in production semantics.
- Verification names scripts that exist in `package.json`.

## Recommended Verification Commands

For the next semantics packet:

- `node --check` on any new pure semantics service and verifier
- `npm.cmd run verify:runtime-enforcement-adapter`
- `npm.cmd run verify:runtime-enforcement-hook`
- `npm.cmd run verify:runtime-hook-telemetry`
- `npm.cmd run verify:enforcement-dry-run`
- `npm.cmd run verify:gate-stack-readout`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:protected-terms` only as warning-only terminology evidence
- `git diff --check`
- `git status --short --branch`

For any later active implementation, add a dedicated verifier that proves active pass/block/hold behavior without provider calls or support artifact creation.

## Items To Park

- active runtime enforcement implementation
- command blocking
- global enforcement across all command families
- provider-backed command enforcement
- Watch/background enforcement
- support artifact write enforcement
- storage/config write enforcement
- destructive deletion/pruning enforcement
- schema-backed queues or durable movement checkpoints
- support artifact creation/writer behavior changes
- UI or renderer changes
- terminology renames

## Verification Evidence Reviewed

Read from disk:

- `AGENTS.md`
- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/current.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-assets.md`
- `workspace/critical/critical-terms.md`
- shared Engineering and Security role prompts
- `workspace/OverseerHS214-runtime-enforcement-semantics-design-request.md`
- `workspace/EngineeringSafetyAuditHS210-runtime-enforcement-readiness-review.md`
- `workspace/OverseerHS211-hs210-runtime-enforcement-readiness-review.md`
- `workspace/OverseerHS213-hs212-runtime-hook-watch-task-runtime-review.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/features/data-layer-boundaries.md`
- `src/main/services/runtimeEnforcementEvaluator.js`
- `src/main/services/runtimeEnforcementDryAdapter.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/composedGatePolicyService.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/gateStackReadoutService.js`
- `scripts/verify-runtime-enforcement-hook.js`
- `scripts/verify-runtime-enforcement-adapter.js`
- `scripts/verify-enforcement-dry-run.js`
- `package.json`

Verification commands run for this advisory:

- `npm.cmd run verify:runtime-enforcement-adapter` passed.
- `npm.cmd run verify:runtime-enforcement-hook` passed.
- `npm.cmd run verify:runtime-hook-telemetry` passed.
- `npm.cmd run verify:enforcement-dry-run` passed.
- `npm.cmd run verify:gate-stack-readout` passed.
- `npm.cmd run verify:service-registry` passed.
- `npm.cmd run verify:command-authority` passed.
- `npm.cmd run verify:passive-side-effects` passed.
- `npm.cmd run verify:protected-terms` passed with warning-only advisory output: 20 warnings in this artifact; no renames and no protected-word JSON updates performed.
- `git diff --check` passed.
- `git status --short --branch` showed only this new HS214 advisory artifact as untracked on `main...origin/main`.

## Human / Overseer Decisions Needed

1. Decide whether the next packet is pure semantics fixture matrix or non-blocking active-semantics preview.
2. Decide the first eligible active command family, if any. Recommended: local readout/preflight only.
3. Decide whether active mode ignores all supplied facts except explicit trusted/test context facts.
4. Decide whether `conditional` always blocks in first active mode, or whether any family may resolve it through existing handler validation.
5. Decide whether active enforcement should return structured `hold` posture as a normal service response or raise a non-error control result.

## Bottom Line

Atlas should stage by command family and prove active semantics before any command blocking. The safest next seam is a pure semantics fixture matrix, not an active hook implementation.
