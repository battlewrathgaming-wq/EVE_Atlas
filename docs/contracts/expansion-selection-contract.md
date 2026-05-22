# Contract: Expansion Selection

Status: Active
Date: 2026-05-22

## Purpose

Expansion selection chooses which discovered refs are worth spending ESI killmail expansion calls on.

ESI expansion is the evidence-creating step.

## Boundary

Owned by:

- system radius collector
- actor watch collector
- manual expansion worker
- killmail ingestion worker

## Inputs

- pending/candidate refs from zKill discovery or the Discovery Queue
- local killmail cache state
- global expansion cap
- explicit manual selection when provided

## Outputs

- selected refs for ESI expansion
- skipped refs with reason
- fetch run counts
- queue status updates

## Invariants

- Deduplicate before expansion.
- Skip already-cached killmails before expansion.
- Apply global expansion cap after dedupe and cache skip.
- Routine watches may select automatically under cap.
- Manual discovery must not expand automatically.
- Manual expansion must be explicit.
- Failed expansion records warnings and does not abort the whole run.

## Must Not Do

- Do not apply per-system expansion explosions by default.
- Do not use zKill summaries as evidence.
- Do not overwrite existing raw ESI killmail evidence.

## Verification

- `verify:collector`
- `verify:actor-watch`
- `verify:manual-discovery`
- `verify:bulk-synthetic`
- `verify:actor-bulk`

