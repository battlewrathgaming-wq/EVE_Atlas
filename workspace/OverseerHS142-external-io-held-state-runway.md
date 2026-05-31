# OverseerHS142 - External I/O Held-State Runway

Status: active Dev runway
Date: 2026-05-31
Role: Overseer

## Source Of Intent

- Human direction: continue the External I/O held-state line.
- `workspace/SystemsAuditHS109-external-io-policy-fit.md`
- `workspace/SecuritySafetyAuditHS140-enforcement-classification-posture.md`
- `workspace/OverseerHS141-security-audit-hs140-review.md`
- accepted HS139 enforcement classification coverage

## Decision

Open a bounded Dev packet for a read-only External I/O held-state proof.

The packet should prove provider-capable commands can be reported as held when External I/O is off, while local-only work remains available and no catch-up flooding is implied when External I/O is re-enabled.

## Scope

Dev should add or refine a read-only service/readout and verifier around External I/O held-state composition.

The proof should consume existing command/effect/classification/gate information where practical:

- service command metadata
- HS139 enforcement classification coverage
- `live.gate`
- `support.gate_stack_readout`
- Watch executor/session posture
- storage setup/gate posture, as separate storage safety input
- cadence simulation/no-catch-up principles where useful

## Required Behavior

- Provider-capable commands should report `held_by_external_io` when External I/O is off.
- Local-only read/report/preflight commands should remain available.
- Watch arming/session state should remain separate from provider movement permission.
- External I/O off should not mark waiting as failure.
- External I/O re-enable should not imply catch-up flood; released work must re-enter normal cadence/provider/storage/confirmation rules.
- `would_allow` from storage dry-run must not be treated as full runtime authorization.
- The readout should expose separate gate posture instead of one broad allow boolean.
- The proof must remain read-only.

## Non-Goals

- No runtime enforcement.
- No command interception.
- No provider/API calls.
- No zKill calls.
- No ESI calls.
- No SDE download.
- No Evidence/EVEidence writes.
- No hydration writes.
- No DB/storage movement, copy, migration, restore, deletion, or pruning execution.
- No schema changes.
- No renderer/UI redesign.
- No persisted External I/O setting unless Overseer explicitly opens that later.
- Do not rename `External API`, `live.gate`, `watch.executor.arm`, or storage authority terms.

## Expected Handoff

```text
workspace/DevHS142-external-io-held-state-proof.md
```

The handoff must include:

- files changed
- command/readout added or refined
- sample held-state output
- local-only available examples
- provider-capable held examples
- no-catch-up / re-enable wording or proof
- verification commands and results
- confirmation that no provider calls or runtime enforcement occurred

## Required Verification

Run focused checks relevant to changed files:

```powershell
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:cadence-simulation
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:app-readiness
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-scheduler
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Run `node --check` on any new or changed JavaScript files.

## Stop Conditions

Stop and return to Overseer/Human if:

- runtime blocking/interception is required
- a persisted External I/O setting is required
- provider/API calls are required for proof
- storage enforcement has to become active
- Watch arming is being renamed or collapsed into External I/O
- local-only work becomes unavailable solely because External I/O is off
- re-enable behavior implies catch-up flooding
- UI wording/product presentation is needed
