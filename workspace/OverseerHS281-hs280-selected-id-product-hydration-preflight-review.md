# Overseer HS281 - HS280 Selected-ID Product Hydration Preflight Review

Status: accepted
Date: 2026-06-05
Project: AURA Atlas
Reviewed by: Atlas Overseer

## Reviewed

- Runway: `workspace/OverseerHS280-selected-id-product-hydration-authority-preflight-runway.md`
- Dev handoff: `workspace/DevHS280-selected-id-product-hydration-authority-preflight.md`
- New command: `metadata.selected_id_readability_repair.product_preflight`

## Result

HS280 is accepted. No blocking issue found.

Accepted result:

```txt
metadata.selected_id_readability_repair.product_preflight
```

is a renderer-eligible, read-only selected-ID product readability repair/Hydration authority preflight. It proves product authority posture before provider contact or writes. It does not execute product Hydration.

## Accepted Boundaries

Confirmed:

- no zKillboard calls
- no ESI calls
- no Hydration writes
- no `metadata_runs`, `api_request_logs`, `entities`, or `activity_events` writes
- no Evidence/EVEidence writes
- no Discovery ref mutation
- no Watch, Marked, or Assessment Memory mutation
- no storage config or External I/O config writes
- no product execution
- no Bucket, Dispatcher, worker, lease, retry, persisted queue, schema, runtime enforcement, command blocking, support artifact, or UI behavior
- no fourth lane / fast lane
- HS276 proof/test scaffolding remains non-authority

## Accepted Behavior

The accepted preflight composes:

- normalized selected ID type/value
- supported product provider-backed ID types: `character`, `corporation`, `alliance`
- local/static lookup posture for `inventory_type` and `solar_system`
- strong local basis from Evidence/EVEidence-derived `activity_events` appearance
- strong local basis from existing local `entities` rows missing labels
- parked/conditional basis for Watch-only, Assessment-only, and Discovery-only appearances
- local label short-circuit
- External I/O readback
- live/provider gate posture without provider-attempt recording
- storage/write posture from trusted storage setup gate state
- command authority and confirmation requirements for future execution
- future command/run-type candidates:
  - `metadata.selected_id_readability_repair.execute`
  - `selected_id_readability_repair`
- expected allowed writes and forbidden mutations for later execution
- explicit no-Bucket/no-Dispatcher requirement for this selected-ID product path

## Verification Performed By Overseer

Passed:

```txt
node --check src\main\services\selectedIdReadabilityRepairProductPreflightService.js
node --check scripts\verify-selected-id-product-hydration-preflight.js
node --check src\main\services\serviceRegistry.js
npm.cmd run verify:selected-id-product-hydration-preflight
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

`verify:protected-terms` passed with warning-only advisory output. No renames or protected-word JSON updates were performed.

`git diff --check` passed with CRLF normalization warnings only.

## Next Decision

Atlas is now at a product execution boundary.

Do not open the execution command automatically. Product selected-ID readability repair execution would involve provider contact and corpus writes, so it needs explicit Human/Overseer acceptance as a new runway.

Safe next options:

1. Rest selected-ID Hydration productization at accepted preflight.
2. Create a decision surface for product execution readiness.
3. If explicitly accepted, open a narrow trusted non-renderer product execution packet for `metadata.selected_id_readability_repair.execute`.

Park renderer-triggered execution, UI confirmation behavior, background/report-wide Hydration, Bucket/Dispatcher, schema, runtime enforcement, support artifacts, and fourth-lane work.
