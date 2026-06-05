# Overseer HS284 - Selected-ID Readability Repair Execution Runway

Status: active Dev runway
Date: 2026-06-05
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS284-selected-id-readability-repair-execution.md`

## Purpose

Implement the smallest product selected-ID readability repair execution command.

This crosses from accepted preflight into product execution mechanics, but only inside a narrow trusted, non-renderer path. Verification should use fixture/injected provider responses and controlled stores unless Human/Overseer explicitly authorizes live/API verification.

## Accepted Basis

Read:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `docs/features/selected-id-readability-repair.md`
- `docs/adr/ADR-0006-selected-id-hydration-proof-is-not-product-flow.md`
- `workspace/OverseerHS282-selected-id-product-hydration-execution-decision-surface.md`
- `workspace/OverseerHS283-selected-id-resolve-readability-posture-acceptance.md`
- `workspace/OverseerHS280-selected-id-product-hydration-authority-preflight-runway.md`
- `workspace/DevHS280-selected-id-product-hydration-authority-preflight.md`
- `workspace/OverseerHS281-hs280-selected-id-product-hydration-preflight-review.md`
- relevant Hydration request posture, pickup contract, real-execution proof, storage, External I/O, live gate, command authority, service registry, and passive side-effect files.

## Task

Add product execution command:

```txt
metadata.selected_id_readability_repair.execute
```

Run type:

```txt
selected_id_readability_repair
```

The command should perform selected-ID Resolve / readability repair for one selected unresolved local ID if all trusted gates pass.

## User-Facing Act

Expose/disclose the operator act as:

```txt
Resolve
```

Resolve means repair readability for one selected unresolved local ID.

Resolve does not create Evidence/EVEidence, complete a report, hydrate a whole report, start background Hydration, or bypass provider gates.

## Required Shape

The command must be:

- trusted / non-renderer only
- one selected ID only
- explicit operator act only
- provider-backed only for `character`, `corporation`, `alliance`
- local-first
- storage-gated
- External I/O gated
- live/provider-gated through the real attempt path
- command-authority / confirmation gated using the existing metadata Hydration authority model unless a smaller compatible Resolve alias already exists
- limited to readability repair writes only

The command must reject renderer invocation.

## Execution Flow

Implement:

```txt
normalize selected ID
-> require explicit operator act / Resolve intent
-> reject unsupported/malformed ID
-> reject local SDE/static lookup IDs from ESI names path
-> rebuild trusted product preflight facts
-> require strong local basis
-> reject Watch-only / Discovery-only / Assessment-only basis as non-authorizing
-> local label short-circuit with no write if already readable
-> re-read storage/write posture
-> re-read External I/O posture
-> re-read live/provider gate and enter provider attempt path only if allowed
-> call ESI /universe/names for exactly one selected ID
-> validate response ID/category/name safety
-> recheck local label before write
-> if still missing, write readability repair rows only
-> finalize metadata run from actual outcome
```

## Allowed Writes

Allowed writes only:

- `metadata_runs`
- sanitized `api_request_logs` if provider contact occurs
- selected `entities` row for `character`, `corporation`, or `alliance`
- matching `activity_events` readability label columns only

If local label already exists before provider contact:

- no provider call
- no write
- no audit row
- return quiet `already_readable` / equivalent result

If local label appears after provider response but before write:

- do not overwrite
- close quietly or finalize as race-resolved without additional label write

## Required Outcome Meanings

Before provider contact:

- local label exists: quiet already-readable result
- External I/O off: held, not failure
- cooldown/lockout active: held, not failure
- storage write blocked: blocked before contact
- malformed/unsupported ID: rejected before contact
- insufficient local basis: rejected before contact

After provider contact:

- valid response: success, allowed readability writes only
- unresolved provider response: partial
- category mismatch: failed
- unsafe or empty label: failed
- provider/network/HTTP error: failed or retryable according to existing provider-gate policy

## Must Not

Do not:

- call zKillboard
- expand killmails / create Evidence/EVEidence
- mutate raw ESI killmail payloads
- mutate numeric `activity_events` facts
- mutate `discovered_killmail_refs`
- mutate `fetch_runs`
- mutate `ingestion_audits`
- mutate Evidence-related `data_quality_warnings`
- mutate Watch rows
- mutate Marked rows
- mutate Assessment Memory
- write storage config
- write External I/O config
- create support artifacts
- change schema
- activate runtime enforcement
- add command blocking behavior
- add renderer/UI trigger
- add UI confirmation behavior
- add background/report-wide/multi-ID Hydration
- add Watch/background Hydration pickup
- add Bucket, Dispatcher, worker, lease, retry, or persisted queue behavior
- reopen the fourth lane / fast lane
- reuse HS276 proof/test flags as product authority
- make Human-owned HS276 test ID special

## Verification

Add focused verifier, suggested:

```txt
npm.cmd run verify:selected-id-readability-repair-execution
```

Use fixture/injected provider responses by default. Do not perform live/API verification unless explicitly authorized by Human/Overseer.

Expected cases:

- successful character Resolve with Evidence/EVEidence-derived activity basis
- successful corporation Resolve
- successful alliance Resolve
- existing local label short-circuits with no provider/no write/no audit row
- local label appears before write and prevents overwrite
- unsupported/malformed ID rejected before provider
- local SDE/static ID rejected from ESI names path
- missing local basis rejected
- Discovery-only basis rejected as non-authorizing
- Watch-only basis rejected as non-authorizing
- Assessment-only basis rejected as non-authorizing
- External I/O held produces held/no provider/no write
- live/provider gate blocked produces held or blocked/no accepted attempt/no write
- storage blocked stops before provider/no write
- provider unresolved response produces partial/no label write
- provider category mismatch fails/no label write
- provider unsafe/empty label fails/no label write
- provider/network error handled without label write
- renderer invocation rejected
- HS276 proof flags ignored/rejected as non-authority
- fixed HS276 ID not special
- allowed table writes only in success cases
- forbidden tables unchanged

Recommended verification commands:

```txt
node --check src\main\services\serviceRegistry.js
node --check <new-or-updated-service-file>
node --check <new-verifier-file>
npm.cmd run verify:selected-id-readability-repair-execution
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

Use confidence-directed verification. Add broader checks if shared runtime/schema/registry behavior changes require it.

## Stop Conditions

Stop and return to Overseer if:

- live/API verification is needed
- renderer/UI behavior becomes necessary
- background/report-wide/multi-ID Hydration becomes necessary
- Bucket/Dispatcher/queue design becomes necessary
- schema changes become necessary
- runtime enforcement or command blocking becomes necessary
- support artifacts become necessary
- command authority cannot be satisfied without a new project decision
- Watch/Discovery/Assessment-only basis needs to authorize Resolve
- Hydration blurs into Evidence Expansion
- HS276 proof scaffolding starts acting as product authority
