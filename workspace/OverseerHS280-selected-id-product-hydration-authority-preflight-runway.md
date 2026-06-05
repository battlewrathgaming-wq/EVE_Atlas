# Overseer HS280 - Selected-ID Product Hydration Authority Preflight Runway

Status: active Dev runway
Date: 2026-06-05
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS280-selected-id-product-hydration-authority-preflight.md`

## Purpose

Add a read-only selected-ID product Hydration authority/preflight contract.

This packet must prove what product selected-ID readability repair/Hydration would require before provider contact or writes, without implementing product execution.

## Accepted Basis

Read:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS278-selected-id-product-hydration-transition-advisory-request.md`
- `workspace/EngineeringSecurityHS278-selected-id-product-hydration-transition-advisory.md`
- `workspace/OverseerHS279-hs278-selected-id-product-hydration-transition-review.md`
- `docs/adr/ADR-0006-selected-id-hydration-proof-is-not-product-flow.md`
- `workspace/OverseerHS276-selected-id-real-hydration-execution-proof-runway.md`
- `workspace/DevHS276-selected-id-real-hydration-execution-proof.md`
- `workspace/OverseerHS277-hs276-selected-id-real-hydration-execution-proof-review.md`
- relevant Hydration request posture, pickup contract, real-execution preflight, storage, External I/O, live gate, command authority, service registry, and passive side-effect files.

## Task

Add a read-only product authority/preflight command. Preferred command name:

```txt
metadata.selected_id_readability_repair.product_preflight
```

The command should prove product-authority posture for selected-ID readability repair/Hydration without provider calls or writes.

## Required Behavior

The preview must:

- remain read-only
- be renderer eligible only as explanation/preflight, not execution
- perform no provider calls, writes, corpus mutation, metadata rows, product execution, schema, Bucket, Dispatcher, queue, runtime enforcement, or UI behavior
- not treat HS276 fixed ID `character:92418041` as special
- reject or mark as non-authority proof flags such as `allowHydrationSelectedIdRealExecutionProof` and `controlledTempAtlasStore`
- ignore renderer-supplied storage, External I/O, live gate, label, local-basis, confirmation, and command-authority claims
- normalize and classify selected ID type/value
- support product Hydration ID types `character`, `corporation`, and `alliance`
- reject malformed, missing, zero, negative, unsafe, or unsupported IDs before provider contact
- classify local Atlas basis from trusted local state
- distinguish strong basis:
  - Evidence/EVEidence-derived `activity_events` appearance
  - existing local `entities` row missing a label
- disclose parked or conditional basis:
  - Watch-only
  - Assessment-only
  - Discovery-only
- detect local label short-circuit
- distinguish local SDE/static lookup cases that should not use ESI `/universe/names`
- compose External I/O posture
- compose live/provider gate posture without recording provider attempts
- compose storage/write posture from trusted storage readback or accepted trusted fixture context
- name command-authority and confirmation requirements
- disclose future command/run-type candidates:
  - `metadata.selected_id_readability_repair.execute`
  - `selected_id_readability_repair`
- disclose expected allowed writes and forbidden mutations for later execution
- disclose that no Bucket/Dispatcher is required for selected-ID product Hydration now.

## Must Not

Do not:

- call zKillboard or ESI
- create Hydration writes
- write `metadata_runs`, `api_request_logs`, `entities`, or `activity_events`
- mutate Evidence/EVEidence, Discovery refs, Watch rows, Marked rows, Assessment Memory, storage config, External I/O config, schema, support artifacts, or renderer UI
- implement product selected-ID Hydration execution
- add persisted pickup/request state
- add Bucket, Dispatcher, worker, lease, retry, or provider queue behavior
- activate runtime enforcement or command blocking
- reopen the fourth lane / fast lane
- treat HS276 proof/test scaffolding as product authority.

## Expected Verification

Add a focused verifier, suggested:

```txt
npm.cmd run verify:selected-id-product-hydration-preflight
```

Expected proof cases:

- character with Evidence/EVEidence-derived activity basis and no label
- corporation and alliance supported shape, if practical in fixture data
- fixed HS276 ID is not special
- proof flags are non-authority
- renderer-forged authority facts are ignored
- missing local basis is rejected
- Discovery-only basis is conditional/parked, not first product authority
- Watch-only basis is conditional/parked, not first product authority
- Assessment-only basis is conditional/parked, not first product authority
- existing local label short-circuits
- local SDE/static ID is not ESI Hydration
- External I/O held produces held, not failure
- live gate blocked produces blocked/held posture without provider-attempt recording
- storage write blocked stops before provider contact
- unsupported/malformed ID rejected
- no providers and no table writes occur.

Recommended verification commands:

```txt
node --check src\main\services\serviceRegistry.js
node --check <new-or-updated-service-file>
node --check <new-verifier-file>
npm.cmd run verify:selected-id-product-hydration-preflight
npm.cmd run verify:hydration-selected-id-real-execution-preflight
npm.cmd run verify:hydration-pickup-contract
npm.cmd run verify:hydration-request-posture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Use confidence-directed verification. Add broader checks only if shared runtime/schema/registry behavior changes require it.

## Stop Conditions

Stop and return to Overseer if:

- product execution becomes necessary
- a provider call becomes necessary
- a write becomes necessary
- renderer-triggered execution becomes necessary
- Bucket/Dispatcher/queue design becomes necessary
- command authority cannot be represented without new policy
- local basis policy needs Human/Overseer choice
- Hydration blurs into Evidence Expansion
- HS276 proof scaffolding starts acting as product authority.
