# Overseer HS264 - Hydration Pickup Eligibility Contract Preview Runway

Status: open
Date: 2026-06-05
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS264-hydration-pickup-eligibility-contract-preview.md`

## Purpose

Add the smallest read-only proof for the selected-ID Hydration pickup eligibility / execution-input contract.

HS260 proved request posture. HS262/HS263 accepted that pickup is non-durable candidate acceptance for a future execution command, not execution, queue persistence, dispatcher behavior, provider movement, or write behavior.

This packet should prove what a future execution command would be allowed to consume as input hints, while still refusing to execute.

## Accepted Boundary

Preserve:

```text
Request posture is pickup-readable, not pickup.
Pickup is not execution.
Execution is not write until the write path succeeds under policy.
```

Also preserve:

```text
renderer posture is explanation, not authority
future execution must rebuild local-first posture from trusted local state
```

## Scope

Add a read-only preview command concept:

```text
metadata.hydration_pickup_contract.preview
```

The command should consume selected-ID request posture inputs or selected-ID request facts, then produce a contract/readout describing whether a future execution command would have enough material to revalidate and consider pickup.

If implementation finds a better command name that fits existing service patterns, keep it read-only and explain the choice in the handoff.

## Required Behavior

Prove:

- `pickup_eligible` never means execution or authorization.
- `not_a_request`, `invalid`, `insufficient_basis`, `already_local`, `local_lookup_available`, `held`, and `blocked` are not pickup candidates.
- only current `provider_needed` plus released-to-normal-gates posture can be represented as a pickup candidate.
- future execution input is made of hints, not trusted authority.
- execution input includes at least:
  - `id_type`
  - `id_value`
  - `source_surface`
  - `source_context`
  - `basis_anchor`
  - `basis_layer`
  - `request_reason`
  - `request_posture_id` or digest
  - posture/gate summary for explanation
- request digest comparison is explanatory/freshness material only.
- revalidation is required before any execution.
- local-first short-circuit must happen again at future execution time.
- renderer-provided local labels, storage posture, External I/O posture, live/cadence posture, or gate summary are not authority.

## Implementation Notes

Prefer reusing:

- `hydrationRequestPostureService.js`
- `hydrationExecutionPolicyPreviewService.js`
- `hydrationAttentionRuntimePostureService.js`
- `serviceRegistry.js` read-only command metadata pattern
- `enforcementDryRunService.js` coverage pattern

The preview may be a new small service file if cleaner.

Keep renderer eligibility read-only if registered for renderer access.

## Do Not

- do not call providers
- do not run live/API/provider checks
- do not execute Hydration
- do not create `metadata_runs`
- do not write `entities`
- do not patch `activity_events`
- do not create Evidence/EVEidence
- do not mutate Discovery refs
- do not persist pickup, request, queue, lease, or retry state
- do not add a dispatcher or worker
- do not change schema
- do not activate runtime enforcement or command blocking
- do not write storage config or External I/O config
- do not mutate Watch, Marked, Assessment Memory, or pruning/deletion state
- do not create support artifacts
- do not add renderer UI

## Verification

Add a focused verifier if implementation adds the preview command:

```text
npm.cmd run verify:hydration-pickup-contract
```

Expected proof should cover at least:

- command is read-only and renderer-eligible if registered
- all non-candidate states are rejected as pickup candidates
- provider-needed / released-to-normal-gates posture can produce a non-durable pickup candidate contract
- held and blocked provider-needed posture cannot produce pickup candidate acceptance
- execution input is marked as hints/explanation only
- future revalidation requirement is explicit
- zero provider calls
- zero Hydration writes
- zero metadata run writes
- zero entity writes
- zero activity event patches
- no persisted queue/pickup/lease/retry
- no dispatcher
- no schema changes
- no runtime enforcement

Also run:

```text
node --check src\main\services\serviceRegistry.js
node --check <new-or-touched-service-file>
node --check <new-or-touched-verifier-script>
npm.cmd run verify:hydration-request-posture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
git diff --check
git status --short --branch
```

Run broader checks only if touched files require it.

## Handoff Requirements

Create:

```text
workspace/DevHS264-hydration-pickup-eligibility-contract-preview.md
```

Include:

1. What changed.
2. Exact command/service shape added.
3. Pickup candidate states proven.
4. Execution-input contract fields.
5. Boundary confirmation.
6. Verification commands and results.
7. Any gaps or follow-up seams.
