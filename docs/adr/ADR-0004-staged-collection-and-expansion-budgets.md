# ADR-0004: Staged Collection And Expansion Budgets

Status: Accepted
Date: 2026-05-21

## Context

AURA Atlas needs collection runs that are predictable, explainable, and respectful of external APIs.

System radius watches already follow the intended direction:

```txt
plan scope
-> discover zKill refs across scoped systems
-> dedupe refs globally
-> skip cached killmails
-> apply global ESI expansion budget
-> expand selected killmails
-> normalize and persist evidence
```

This decision formalizes that staged model so future collection types, especially actor watches, do not invent separate ingestion philosophies.

Official ESI endpoint details should be taken from the live Swagger UI and ESI documentation. For this decision, the important API shape is:

- killmail expansion is one ESI request per selected killmail
- `/universe/names/` is the report-scoped bulk-style POST hydration endpoint
- static type labels come from local SDE metadata, not live ESI

## Decision

AURA Atlas collection is staged.

zKill discovery may be batched across all systems or actors in the selected scope before any ESI killmail expansion.

ESI killmail expansion uses a global per-run budget. The expansion budget is applied only after:

- discovery
- malformed ref filtering
- global dedupe
- cached-killmail removal

Expansion candidates should be represented as a run-local queue, even if no permanent table exists yet.

Queue rows should include:

- `killmail_id`
- `hash`
- `source_system_id` or future source actor
- `discovered_at`
- `priority`
- `already_cached`
- `selected_for_expansion`
- `skip_reason`

Metadata hydration remains a separate stage from evidence collection and is tracked through `metadata_runs`.

Report-scoped entity hydration remains top-N/relevance-driven.

Static inventory/type labels remain local-SDE-only.

Future actor watch collection must use the same staged model:

```txt
actor zKill refs
-> dedupe
-> skip cached
-> apply global expansion budget
-> ESI expand
-> normalize
-> persist evidence
```

## Consequences

This makes API usage easier to predict before a live run.

Diagnostics can explain why refs were expanded or skipped.

Dry-run planning becomes more useful because planned discovery, expansion budget, local cache state, and estimated API calls can be shown before mutation.

Repeated conservative runs can progressively ingest uncached evidence without broad aggressive collection.

Actor watch implementation can reuse the same collection philosophy as system radius watches.

## Alternatives Considered

- Expand during discovery: rejected because it couples zKill scan order to ESI spend and makes caps harder to explain.
- Use per-system ESI expansion caps by default: rejected because busy systems could dominate API use unpredictably across a radius.
- Persist zKill summaries as intelligence input: rejected because zKill is discovery only.
- Resolve static type labels through live ESI: rejected because local SDE metadata is the authoritative static lookup source.

## Verification

Existing verification supports the current staged behavior:

- `npm.cmd run verify:planner`
- `npm.cmd run verify:collector`
- `npm.cmd run verify:system-watch-live`
- `npm.cmd run verify:hydration`
- `npm.cmd run verify:metadata-lookup`

Future implementation of the run-local expansion queue should add fixture checks for these `skip_reason` values:

- `cached`
- `duplicate`
- `cap_skipped`
- `malformed`
- `failed`

## Related Documents

- `docs/tenets/tenets.md`
- `docs/adr/ADR-0001-zkill-is-discovery-only.md`
- `docs/adr/ADR-0002-expanded-killmails-authoritative.md`
- `docs/adr/ADR-0003-local-sde-first.md`
- `docs/schemas/metadata-run.md`
- `docs/audits/audit-2026-05-21-doc-alignment-and-pipeline-trace.md`
