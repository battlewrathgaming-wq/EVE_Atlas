# Engineering Security Data HS238 - Pruning / Deletion Execution Prerequisites

Role: Engineering / Security / Data specialist
Milestone: HS238
Topic: Pruning and deletion execution prerequisites
Date: 2026-06-03

## Executive Recommendation

Atlas is not ready for real destructive Evidence/EVEidence pruning execution.

Atlas is ready to define a narrow fixture-only deletion execution contract, because HS236/HS237 now provide enough read-only relationship context to specify what future execution must preserve, delete, warn about, and leave alone. The next safe packet, if pruning continues, should be a fixture-only active-row deletion proof against an in-memory or disposable fixture database. It should not touch operator data, create a renderer command, add support-artifact cleanup, write schema, activate runtime enforcement, or introduce broad no-interest pruning.

The first real deletion packet should remain blocked until the fixture-only contract proves dependency ordering, transaction rollback, preview-to-execution consistency, and post-delete integrity.

## Minimum Prerequisites

Before any future destructive Evidence/EVEidence deletion execution can be considered:

- `retention.preflight` must remain the source of reviewed scope and relationship context.
- Execution must require explicit operator confirmation for the exact action, scope digest, and candidate killmail IDs.
- The executor must re-run or revalidate the preflight immediately before deletion.
- The selected killmail set must be stable between preview and execution, or execution must stop and require a fresh preview.
- The delete must run inside one immediate transaction.
- Foreign-key integrity must be enabled and checked after commit.
- There must be no retained deletion footprint: no hidden copy of raw ESI payloads, full activity rows, participant arrays, checksums, custom score fields, or replacement summary rows.
- Support artifacts must be disclosed as separate historical/recovery material that may still contain deleted active rows.
- Assessment Memory, Discovery refs, Watch/Marked rows, entities, local SDE lookups, metadata runs, and support artifacts must not be silently mutated by Evidence deletion.
- Runtime enforcement, command blocking, provider calls, Hydration writes, and UI work must remain outside the first deletion executor.

## Required Data Classes And Dependency Handling

Delete in the first Evidence-scoped executor:

- `activity_events` for selected `killmail_id` values.
- `ingestion_audits` for selected `killmail_id` values.
- `data_quality_warnings` only where `killmail_id` is one of the selected killmail IDs.
- `killmails` for selected `killmail_id` values.

Retain by default:

- `discovered_killmail_refs`: Discovery refs are possible leads/provenance, not Evidence/EVEidence. Evidence deletion should not expire, mark, or rewrite them.
- `assessment_artifacts`: Assessment Memory may become stale, but it is not a deletion blocker and should not be mutated by the first deletion executor.
- `fetch_runs`: run provenance may describe mixed outcomes and should not be recomputed or deleted with scoped Evidence.
- `api_request_logs`: provider diagnostics/provenance should remain unless a separate diagnostics-log pruning action is explicitly chosen.
- run-level `data_quality_warnings` where `killmail_id` is null: retain and disclose as provenance context unless a separate provenance policy decides otherwise.
- `watchlist_entities`, `system_watches`, `entity_dispositions`, `entities`, `metadata_runs`, local SDE lookup tables, runtime DB support copies, trace packs, light logs, and readiness/preflight outputs.

Cautions/disclosure:

- Assessment Memory references to selected killmails.
- same-killmail Discovery refs and their statuses.
- Watch/Marked-adjacent context.
- fetch-run and API-log provenance that will outlive the deleted active Evidence.
- support artifacts that may retain historical copies.

## Delete Ordering / Transaction Model

Required model:

1. Compute candidate killmail IDs from a read-only preflight.
2. Persist no new footprint; keep only volatile execution-local candidate state.
3. Begin `BEGIN IMMEDIATE` transaction.
4. Re-read selected candidate rows and dependency counts inside the transaction.
5. Stop and roll back if candidate IDs or required dependency counts no longer match the confirmed preview digest.
6. Delete dependent rows first: `activity_events`, `ingestion_audits`, killmail-linked `data_quality_warnings`.
7. Delete `killmails` last.
8. Verify no orphan `activity_events` or `ingestion_audits` remain for selected IDs before commit.
9. Commit only after all deletes and integrity checks pass.
10. On any error, roll back and return the previous visible state.

Do not rely on SQLite cascades here. The current schema has foreign keys from `activity_events` and `ingestion_audits` to `killmails`, but no accepted cascade policy.

## Preview-To-Execution Consistency

The future executor needs a strict consistency model:

- preview returns selected killmail IDs, dependency counts, relationship cautions, and a deterministic digest over action/scope/candidate IDs/counts;
- confirmation must reference that digest;
- execution revalidates the digest inside the deletion transaction;
- mismatch stops before any delete;
- empty scope stops cleanly;
- stale preview stops cleanly;
- changed dependency counts stop unless the future packet explicitly accepts count drift;
- successful execution returns only counts and disclosure, not a retained footprint.

No renderer payload should be able to choose candidate IDs without server-side recomputation.

## Assessment Memory Policy

Recommendation: warn only for the first deletion executor.

Assessment Memory should not block Evidence deletion, and it should not be automatically deleted or marked stale in the first execution slice. Automatic stale marking is a separate policy because it mutates Assessment Memory and may require schema or emitted-state decisions.

The first executor should only disclose affected Assessment Memory references and return a warning that citation status may now be creation-time/historical rather than currently verifiable.

## Discovery Ref Policy

Recommendation: leave Discovery refs untouched.

Discovery ref pruning should stay separate from Evidence pruning. Even same-killmail refs can have pending, failed, cached, expanded, or superseded status meanings, and deleting them changes discovery/provenance behavior rather than active Evidence. A later Discovery-specific policy can decide whether expanded/cached refs age out, whether failed refs require review, and how Watch-derived refs behave.

## Provenance / Log Policy

Recommendation: retain provenance and logs by default.

`fetch_runs` and `api_request_logs` can describe mixed work across multiple killmails, providers, scopes, and failures. Recomputing or deleting them during scoped Evidence deletion risks dishonest history. The first executor should leave them alone and disclose that provenance/log summaries may outlive active Evidence.

For `data_quality_warnings`, delete only rows directly linked to selected killmails. Run-level caution rows should be retained unless a future provenance policy says to prune, redact, or mark them stale.

## Support Artifact Prerequisite

Active Evidence deletion does not require support artifact cleanup first, but it does require explicit disclosure.

The first executor must state that runtime DB support copies, trace packs, support logs, readiness/preflight outputs, and other support/recovery material may still contain historical content. It must not inspect, create, delete, rewrite, or clean support artifacts.

Support artifact cleanup and runtime DB support-copy deletion should remain a separate policy/design line because those artifacts have their own path authority, budget, redaction, retention, and recovery meanings.

## Fixture-Only Proof Recommendation

Smallest next Dev packet if pruning continues:

`retention.evidence_prune_execution.fixture_proof`

Required shape:

- fixture-only or in-memory database;
- no renderer command;
- no operator data;
- no schema changes;
- no provider calls;
- no support artifact creation or cleanup;
- no runtime enforcement or command blocking;
- no retained deletion footprint;
- proves transaction rollback on injected failure;
- proves preview digest mismatch stops before deletion;
- proves dependency delete order;
- proves run-level provenance/log rows remain;
- proves Assessment Memory and Discovery refs remain unchanged;
- proves post-delete DB integrity.

This can be a test/helper proof rather than product execution.

## Risks And Tradeoffs

- Caution-only Assessment Memory preserves boundaries but leaves stale citation status for a later policy.
- Retaining Discovery refs preserves provenance but may leave possible leads that point to deleted active Evidence.
- Retaining fetch runs and API logs preserves audit history but means counts may no longer match active Evidence after deletion.
- Not cleaning support artifacts preserves safety boundaries but requires honest operator disclosure.
- Deleting run-level caution rows by `run_id` would be unsafe in mixed runs; the first executor should avoid it.
- Creating a retained deletion footprint would violate accepted policy and must remain rejected.

## Acceptance Criteria For The Next Packet

A fixture-only deletion proof would be acceptable only if:

- it has no product execution command;
- it cannot be invoked from the renderer;
- it deletes only fixture/disposable rows;
- it reuses the existing preflight relationship context as its review basis;
- it requires exact preview digest confirmation;
- it deletes dependent Evidence rows before `killmails`;
- it does not mutate Discovery refs, Assessment Memory, Watch/Marked rows, provenance/log rows, support artifacts, storage config, or schema;
- it proves rollback leaves all fixture counts unchanged;
- it proves success leaves no orphan dependent rows;
- it emits support artifact disclosure and no-footprint policy.

## Verification Evidence Expected

Future proof should include:

- `node --check src\main\services\retentionActionService.js`
- `node --check scripts\verify-retention-preflight.js`
- a new fixture-only verifier for the deletion contract
- `npm.cmd run verify:retention-preflight`
- `npm.cmd run verify:retention-deletion-boundary`
- `npm.cmd run verify:assessment-artifacts`
- a queue/Discovery verifier relevant to same-killmail Discovery ref preservation
- `npm.cmd run verify:db-integrity`
- `npm.cmd run verify:evidence-rules`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:protected-terms`
- `git diff --check`

This advisory reviewed:

- `workspace/current.md`
- `workspace/OverseerHS238-pruning-deletion-execution-prerequisites-advisory-request.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/features/data-layer-boundaries.md`
- `workspace/SystemsAuditHS102-pruning-readiness.md`
- `workspace/DevHS236-pruning-intelligence-preview.md`
- `workspace/OverseerHS237-hs236-pruning-intelligence-preview-review.md`
- `src/main/services/retentionActionService.js`
- `src/main/db/schema.sql`
- `scripts/verify-retention-preflight.js`
- `scripts/verify-retention-deletion-boundary.js`
- `scripts/verify-assessment-artifacts.js`

## Human / Overseer Decisions Needed

- Should the next pruning packet be the fixture-only deletion contract proof, or should pruning rest?
- Should Assessment Memory ever be automatically marked stale after Evidence deletion?
- Which Discovery ref statuses are safe for a later Discovery-specific prune policy?
- Should run-level provenance/log rows ever be redacted, recomputed, marked stale, or pruned after Evidence deletion?
- Should support artifact cleanup/runtime DB support-copy deletion be designed before any real operator-facing deletion, or is disclosure sufficient for first active-row deletion?
- Should no-interest/Marked policy block broad pruning, or remain separate from explicit Evidence-scoped deletion?

## Parked Items

- Real operator active-row deletion execution.
- Renderer/UI deletion flow.
- Discovery ref pruning execution.
- no-interest/Marked pruning policy.
- Assessment Memory stale marking or deletion.
- provenance/log redaction, recompute, stale marking, or pruning.
- support artifact cleanup, runtime DB support-copy deletion, log cleanup, and trace-pack cleanup.
- schema changes or cascade policy.
- runtime enforcement activation or command blocking.
- provider calls, Hydration writes, storage movement, and retained deletion footprint creation.
