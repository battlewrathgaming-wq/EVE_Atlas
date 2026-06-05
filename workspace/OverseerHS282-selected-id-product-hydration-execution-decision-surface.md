# Overseer HS282 - Selected-ID Product Hydration Execution Decision Surface

Status: decision surface
Date: 2026-06-05
Project: AURA Atlas
Milestone: Atlas Storage And Runtime Hardening

## Purpose

Record the next decision after HS280 without opening implementation.

HS280 accepted a read-only product authority/preflight command:

```txt
metadata.selected_id_readability_repair.product_preflight
```

Atlas now needs a deliberate Human/Overseer decision before product selected-ID Hydration can cross into provider contact and corpus writes.

## Current Accepted Basis

- HS276 proved a one-ID ESI `/universe/names` lookup and controlled-temp-store readability repair write.
- ADR-0006 says HS276 proof/test machinery is not product flow.
- HS278 accepted that selected-ID Hydration must not move directly from proof/test machinery into product behavior.
- HS280 accepted a read-only product authority/preflight contract.
- HS281 accepted HS280 after verification.

## Boundary

The next possible product execution command would be:

```txt
metadata.selected_id_readability_repair.execute
selected_id_readability_repair
```

That command is not open.

Opening it would authorize a new bounded Dev packet to implement a trusted, non-renderer product execution path that may call ESI `/universe/names` for one selected unresolved local ID and write only Hydration/readability repair rows if every gate passes.

## Decision Options

1. Rest here.

   Keep selected-ID product Hydration at accepted preflight. No new Dev task.

2. Ask for an additional Engineering/Security advisory.

   Use this if Human/Overseer wants another independent check before crossing product execution.

3. Open a narrow trusted non-renderer execution packet.

   Only if Human/Overseer explicitly accepts provider contact and corpus write movement for the selected-ID product path.

## If Execution Is Opened Later

The packet must preserve:

- trusted non-renderer command only
- explicit operator act
- one selected unresolved ID
- supported ID types only: `character`, `corporation`, `alliance`
- strong local basis only:
  - Evidence/EVEidence-derived `activity_events` appearance
  - existing local `entities` row missing label
- local label short-circuit immediately before provider contact
- External I/O re-read
- live/provider gate through the real attempt path
- storage/write posture re-read
- confirmation/command authority
- response validation
- allowed writes only:
  - `metadata_runs`
  - sanitized `api_request_logs`
  - selected `entities` row
  - matching `activity_events` readability label columns

The packet must not include:

- renderer-triggered execution
- UI confirmation behavior
- background/report-wide/multi-ID Hydration
- Watch/background Hydration pickup
- Bucket, Dispatcher, worker, lease, retry, persisted queue
- schema changes
- runtime enforcement activation
- support artifacts
- pruning/deletion
- Evidence/EVEidence mutation
- Discovery mutation
- Watch/Marked/Assessment mutation
- fourth lane / fast lane

## Human Decision Needed

Before Dev:

```txt
Do we accept opening trusted non-renderer product selected-ID readability repair execution?
```

If yes, the next runway should stay narrow and should not include renderer/UI, background Hydration, or queue/dispatcher machinery.
