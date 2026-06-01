# OverseerHS150 - Hydration Execution Policy Runway

Status: accepted runway
Role: Overseer
Date: 2026-06-01

## Intent

Open the next bounded hardening seam: Hydration execution policy.

This is not a request to run Hydration, call ESI, persist a hydration queue, or mutate labels. It is a request to make the future execution decision visible and testable before Atlas allows provider-backed readability repair to move.

## Source Of Intent

- Human decision: follow the Hydration line after HS148.
- `workspace/OverseerHS145-hs144-hydration-backlog-preview-review.md`
- `workspace/OverseerHS149-hs148-composed-gate-policy-review.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/current-state/current-storage-runtime-hardening.md`

Accepted prior proofs:

- `metadata.hydration_backlog.preview`
- `storage.composed_gate_policy.preview`
- `support.gate_stack_readout`
- `storage.setup_gate_readout`
- `storage.enforcement_dry_run.command_effect_map`

## Recommended Dev Packet

Expected executor: Dev

Expected handoff:

```text
workspace/DevHS150-hydration-execution-policy.md
```

Add a read-only Hydration execution policy preview command/readout.

Suggested command name:

```text
metadata.hydration_execution_policy.preview
```

The readout should answer:

```text
Given the current local Hydration backlog and accepted gates, what hydration work would be eligible, held, blocked, deferred, or local-only if execution were implemented later?
```

It must not answer:

```text
May Atlas call ESI now?
```

## Ordered Runway

1. Inspect current metadata hydration, Hydration backlog preview, metadata status/lookup reports, service registry command metadata, gate-stack readout, composed gate policy preview, storage setup gate, and passive side-effect verifier.
2. Add a read-only Hydration execution policy preview command/readout.
3. Use existing local backlog/candidate data as input; do not create a persisted Hydration queue.
4. Separate candidate lanes:
   - view/local-record hydration
   - Watch/background hydration
   - target/report-scoped hydration
   - corpus hygiene / low-priority hydration
   - local SDE/type/geography lookup gaps
5. For each lane or representative candidate group, report policy state such as `eligible_local`, `eligible_provider_if_gates_pass`, `held_by_external_io`, `blocked_by_storage`, `deferred_by_priority`, `local_lookup_gap`, or `not_applicable`.
6. Compose policy from existing read-only gates where available:
   - storage authority / budget
   - External I/O
   - live/provider gate and cadence posture
   - composed gate policy preview
   - local SDE availability when relevant
   - command authority / renderer eligibility
7. Preserve the critical boundary: Hydration repairs names/labels/readability and never creates Evidence/EVEidence or replaces IDs as facts.
8. Add focused verification proving the preview makes no provider calls, no metadata writes, no entity label patches, no activity-event label patches, no DB mutations, no queue persistence, no schema changes, and no UI work.
9. Add service registry, command authority, enforcement dry-run/composed policy, and passive side-effect coverage as needed.
10. Update Evidence / Dev Handoff and create the expected DevHS file.

## Guardrails

- No ESI calls.
- No zKill calls.
- No SDE download calls.
- No provider movement.
- No metadata writes.
- No entity label writes.
- No activity event label patching.
- No metadata run writes.
- No persisted Hydration queue or backlog.
- No schema changes.
- No runtime enforcement.
- No command interception or command blocking.
- No Evidence/EVEidence writes.
- No Discovery ref mutation.
- No storage config writes.
- No support artifact creation.
- No snapshot or trace-pack creation.
- No pruning/deletion.
- No renderer UI work.
- Do not treat missing labels as report failure.
- Do not treat provider-needed labels as Evidence/EVEidence work.
- Do not starve view/local-record hydration behind broad Watch/background backlog in the policy model.
- Do not let `would_allow` or an `eligible` state become authorization.

## Stop Conditions

Stop and return to Overseer/Human if:

- implementation requires a persisted queue
- implementation requires provider calls or live API behavior
- implementation requires schema changes
- implementation requires label writes or metadata run writes
- implementation requires runtime command blocking
- Hydration blurs with Evidence/EVEidence creation
- local SDE lookup gaps are treated as provider/Evidence failures
- view hydration and Watch/background hydration cannot be separated without new product decisions
- priority rules require Human product judgment beyond the accepted lanes

## Verification Expectations

Run focused checks plus existing boundary checks:

```powershell
node --check src\main\services\hydrationExecutionPolicyPreviewService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check src\main\services\composedGatePolicyService.js
node --check scripts\verify-hydration-execution-policy.js
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:hydration
npm.cmd run verify:metadata-status
npm.cmd run verify:metadata-lookup
npm.cmd run verify:actor-metadata
npm.cmd run verify:corporation-metadata
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If filenames differ, Dev should use the actual changed filenames and explain the substitution.

## Acceptance Criteria

- The new preview is read-only and renderer-safe only as a policy/status readout.
- The preview clearly distinguishes local lookup gaps, provider-needed labels, and already-known labels.
- The preview clearly distinguishes view/local-record hydration from Watch/background hydration.
- External I/O off reads as held for provider-backed hydration, not failure.
- Storage/budget gates are represented before future provider-backed Hydration writes.
- `eligible` / `would_allow` / similar terms are explicitly not runtime authorization.
- Missing labels remain degraded readability, not report failure.
- Evidence/EVEidence, Discovery, Hydration, Observation, and Assessment boundaries remain intact.
