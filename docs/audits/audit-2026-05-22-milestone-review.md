# Audit: Milestone Review

Date: 2026-05-22
Scope: Review of the perceived AURA Atlas milestone after manual discovery, actor/corporation observation, queueing, and read-side reports.

Reviewed:

- `docs/audits/audit-2026-05-22-milestone-checklist.md`
- `docs/audits/audit-2026-05-22-manual-discovery-pipeline-trace.md`
- existing audit trail for evidence pipeline alignment

## Milestone Read

AURA Atlas has crossed a real milestone.

It is no longer just the evidence pipeline proof. It now has multiple controlled collection lanes and read-side observation products:

- system/radius collection
- actor watch collection
- corporation observation
- manual discovery queue
- explicit manual expansion
- scoped reports
- metadata readiness/hydration
- provenance separation

The strongest alignment remains:

- zKill discovery only
- ESI expansion before evidence
- queue refs are not evidence
- reports derive from `killmails` / `activity_events`
- manual discovery makes zero ESI calls
- manual expansion is the evidence-creating step

## Audit Quality

The milestone checklist is credible and appropriately identifies the next proof as broad controlled testing before UI.

The manual discovery audit is especially important because it protects a subtle boundary:

```txt
discovering a ref != ingesting evidence
```

That distinction is central to the AURA Atlas evidence model.

One documentation note:

`audit-2026-05-21-evidence-pipeline.md` is now stale in places. The newer May 22 audits supersede parts of it. Add a short note at the top of that older audit stating it is an earlier snapshot and that newer alignment is captured in the May 22 audits.

## Area 1: Task Orchestration / Bulk Staging

Recommended next design focus:

```txt
make collection explicitly staged
```

The current lanes already imply this:

```txt
plan
-> discover
-> queue/dedupe
-> select
-> expand
-> normalize
-> report
```

The next step is to formalize contracts around:

- planner output
- discovery queue entries
- expansion selection
- global expansion budgets
- metadata readiness
- hydration batches

### Bulk Opportunities

#### zKill Discovery

zKill discovery is naturally batchable per scope:

- system radius
- actor
- corporation
- manual discovery

Keep this as staged discovery, not immediate evidence expansion.

#### ESI Expansion

Do not bulk expand blindly.

Use a selected expansion set after:

- dedupe
- cache skip
- caps
- user/manual selection where applicable

Keep global caps, not per-system expansion explosions.

#### Metadata Hydration

Batch unresolved report-relevant entity IDs.

Continue avoiding live type hydration when local SDE should supply static type labels.

Hydrate by readiness reports and report-scoped relevance, not one record at a time.

#### Queue Draining

Add explicit drain policies:

- oldest first
- highest priority first
- within evidence window
- max expansions per run
- skip already cached

### Recommended Contract Docs

Add contracts for:

- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/contracts/report-scope-contract.md`

## Area 2: Batch Testing

AURA Atlas now needs test orchestration, not only individual verification scripts.

Add:

```txt
npm.cmd run verify:all
```

This should be offline only and should run the safe suite.

Suggested grouped verification scripts:

```txt
verify:core
verify:sde
verify:collection
verify:reports
verify:manual
verify:actor
verify:corporation
verify:bulk
```

The project already has many of the individual pieces in `package.json`, including:

- `verify:bulk-synthetic`
- `verify:actor-bulk`
- `verify:manual-discovery`
- `verify:queue-preflight`
- `verify:actor-resolution`
- `verify:corporation-report`

The missing piece is a higher-level script that executes the safe set in order and fails fast.

## Recommended DB Integrity Verification

Add or formalize:

```txt
verify:db-integrity
```

Recommended checks:

- duplicate event keys = 0
- every activity event references an existing killmail
- raw killmail payload JSON parses
- no missing `killmail_time`, `role`, `entity_type`, or `entity_id`
- no evidence reports use SDE zip/import modules at runtime
- manual discovery produces no killmails/activity events
- manual expansion produces evidence

## Live Batch Testing

External/live batch testing should remain separate and explicitly gated.

Suggested gated scripts:

```txt
verify:live-smoke
verify:live-actor-smoke
verify:live-radius-smoke
```

All live scripts must require:

```txt
AURA_ATLAS_LIVE_API=1
```

Live test DBs should remain disposable and under the project `.tmp` path unless explicitly overridden.

## Recommended Next Step

Before UI work, proceed in this order:

1. Add `verify:all` and grouped verification scripts.
2. Add `verify:db-integrity`.
3. Add contracts for discovery queue and expansion selection.
4. Run a controlled batch test against a disposable DB.
5. Generate current-state docs for:
   - current evidence pipeline
   - current manual discovery lane
   - current report products

## Conclusion

The milestone is real.

The next job is not more feature breadth yet. It is turning the working lanes into repeatable, contract-backed, batch-tested production habits.

