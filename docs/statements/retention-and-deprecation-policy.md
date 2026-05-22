# Statement: Retention And Deprecation Policy

Status: Active
Date: 2026-05-21

## Perspective

AURA Atlas stores different kinds of data. They should not all have the same retention behavior.

The project needs to distinguish:

- evidence
- collection provenance
- diagnostics
- metadata
- static lookup data
- assessment artifacts
- ephemeral queues

The core rule is:

```txt
Evidence is retained by default.
Diagnostics are prunable.
Metadata is refreshable.
Static lookup data is replaceable.
Assessment artifacts are committed memory.
Queues are ephemeral until resumability is required.
```

Additional memory rule:

```txt
Evidence may age out of tactical value, but assessment memory may remain valuable.
Atlas should support compacting old evidence into committed assessment artifacts before pruning.
Assessment artifacts should survive evidence pruning.
```

## Policy By Data Class

### Evidence Records

Default: retain indefinitely.

Includes:

- expanded ESI killmails
- normalized activity events
- ingestion audits tied to evidence
- data quality warnings tied to evidence

Reason:

These records form the intelligence corpus. Deleting them changes what Atlas knows.

Policy:

- no automatic pruning
- manual prune only
- prune must be explicit, scoped, and auditable
- raw expanded killmail evidence must not be silently replaced
- before pruning old evidence, Atlas should offer or require assessment/summary preservation when the evidence has produced meaningful observations

### Collection Provenance

Default: retain medium-term or compact.

Includes:

- `fetch_runs`
- detailed `api_request_logs`

Reason:

These records explain how evidence entered the corpus, but detailed request logs can grow quickly.

Policy:

- preserve run summaries longer than per-request logs
- prune detailed API logs after a chosen diagnostic window
- keep enough aggregate counts to explain collection behavior

### Metadata And Enrichment Runs

Default: retain recent history, compact older records.

Includes:

- `metadata_runs`
- hydration diagnostics

Reason:

Metadata results are stored in entity/type lookup tables. Old hydration run logs are diagnostic, not evidence.

Policy:

- keep enough recent metadata run history for debugging
- compact or prune old metadata diagnostics when needed
- never confuse metadata hydration with evidence ingestion

### Entity Metadata

Default: refreshable cache.

Includes:

- entity names
- current corporation/alliance fields
- `last_enriched_at`

Reason:

Names and current affiliations can change. They improve readability but are not the evidence itself.

Policy:

- stale names are allowed
- refresh on inspection or when older than a chosen threshold
- historical event-time IDs must remain preserved
- names remain labels, IDs remain facts

### Static SDE Lookup Data

Default: replaceable lookup layer with import provenance.

Includes:

- systems
- constellations
- regions
- stargate adjacency
- type metadata
- group/category metadata
- SDE import records

Reason:

SDE data is static game reference material. It supports lookup, classification, and topology, but is not activity evidence.

Policy:

- lookup tables may be rebuilt from newer SDE builds
- preserve SDE import provenance
- runtime reports query local lookup tables, not the SDE zip
- evidence IDs remain stable across SDE rebuilds

### Assessment Artifacts

Default: retain long-term.

Includes:

- entity interest scores
- committed priority/impact assessments
- manually promoted interesting corps/pilots/alliances
- hot-trail/cold-trail memory

Reason:

Assessment artifacts preserve analyst or system assessment that an entity matters, even after current activity cools.

Policy:

- assessment artifacts are committed records, not automatic logs
- they should not be created for every observed entity as a side effect of ingestion
- they may be updated, cooled, archived, or promoted to watchlists
- they should not be silently pruned with diagnostics
- derivation or reason should be preserved when practical
- they may preserve a small supporting snapshot after raw evidence is pruned

Suggested minimum supporting snapshot:

```txt
entity
interest score
assessment reason
evidence window
appearance counts
systems/regions observed
role mix
created from report/scope
```

Example:

```txt
Repeated attacker-side presence in ZTS-4D radius.
8 appearances across 2 systems.
Observed during 2026-05-21 evidence window.
```

### Expansion Queues

Default: run-local and ephemeral.

Reason:

The current system uses scoped, capped collection runs. Persisting queues adds complexity and should wait until resumability or user-visible backlog is required.

Policy:

- do not persist expansion queues by default
- keep queue state inside run summaries/logs
- persist only outcomes: discovered, cached, attempted, skipped, failed, expanded
- revisit if Atlas needs resumable long-running collection or scheduled background backlog

## Suggested Early Defaults

These are not hard limits yet, but they describe the intended lifecycle direction:

| Data Class | Suggested Early Policy |
| --- | --- |
| Assessment artifacts | Keep indefinitely |
| Killmail evidence | Keep indefinitely during PoC |
| Activity events | Keep with killmail evidence |
| Observation snapshots | Future; preserve selectively |
| API request logs | Later prune after 30 days |
| Metadata runs | Later prune after 90 days |
| Pending queue refs | Later expire after 30 days |
| Expanded queue refs | Later archive/prune after 7 days |
| SDE import records | Keep recent import history |
| Runtime `.tmp` DBs | Disposable |

## Related Tenets

- Evidence First
- Immutable Evidence Layer
- IDs Are Facts, Names Are Labels
- Collection Provenance Is Not Intelligence Scope
- Respectful API Use
