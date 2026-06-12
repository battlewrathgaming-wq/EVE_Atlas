# DevHS387 - Evidence Writer Landing Package Fixture Proof

Status: complete
Executor: Dev
Date: 2026-06-07

## Scope

Implemented the HS387 fixture-only Evidence/EVEidence writer landing package proof.

Added command:

```txt
evidence.writer_landing_package_fixture.preview
```

The command uses an internal disposable `:memory:` fixture DB, injects expanded ESI killmail fixture payloads, builds packages through `evidencePackageFromExpandedKillmails(...)`, persists through `EvidenceRepository.persistEvidencePackage(...)`, and reads back table deltas/results. It ignores caller DB and caller payload for proof safety.

## Files Changed

- `package.json`
- `scripts/verify-command-authority.js`
- `scripts/verify-evidence-writer-landing-package-fixture.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-service-registry.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/evidenceWriterLandingPackageFixtureService.js`
- `src/main/services/serviceRegistry.js`
- `workspace/current.md`
- `workspace/DevHS387-evidence-writer-landing-package-fixture-proof.md`

Existing untracked HS356-HS385 proof-chain files were preserved and not reverted.

## Fixture Command / Output Summary

The proof reports:

- `proof_status`
- disposable DB posture
- fixture run context
- selected-ready Discovery candidate basis
- injected expanded ESI payload basis
- rows written/read back for `killmails`, `activity_events`, `entities`, `ingestion_audits`, and `data_quality_warnings`
- unchanged posture for `discovered_killmail_refs`, `api_request_logs`, Watch tables, Hydration/metadata tables, and Assessment tables
- raw payload checksum comparison
- warning classifications
- conflict behavior classification
- malformed/rollback evidence
- provider-not-invoked proof

Sample clean output:

```txt
proof_status: clean_payload_landed
killmailsWritten: 1
eventsWritten: 7
deltas.killmails: 1
deltas.activity_events: 7
deltas.entities: 7
deltas.ingestion_audits: 1
deltas.data_quality_warnings: 0
raw_payload_checksum_matches: true
provider_not_invoked: true
```

## Fixture Cases Covered

- clean ESI-expanded killmail payload with victim and attackers
- idempotent rerun of the same payload
- local Evidence/EVEidence cache-existing case before provider movement
- duplicate `killmail_id` with conflicting hash/checksum/time/system
- partial-but-usable payload with missing attackers
- malformed payload missing `killmail_id`, rejected before writer landing
- malformed payload missing `solar_system_id`, proving writer transaction rollback/no partial landing rows

## Disposable DB Posture

The service opens and migrates an internal `:memory:` fixture DB. It does not use the caller DB passed through service context.

Confirmed:

```txt
posture: internal_memory_db_only
operator_corpus_mutated: false
context_db_used: false
requested_context_db_ignored: true
```

## Table Count / Readback Proof

Clean payload:

```txt
killmails +1
activity_events +7
entities +7
ingestion_audits +1
data_quality_warnings +0
discovered_killmail_refs +0
api_request_logs +0
metadata_runs +0
watchlist_entities +0
system_watches +0
assessment_artifacts +0
```

Same-payload rerun:

```txt
killmails +0
activity_events +0
raw_payload_checksum matches existing
```

Partial missing attackers:

```txt
killmailsWritten: 1
warning_classifications: missing_attackers
```

Malformed missing durable field:

```txt
killmails +0
activity_events +0
entities +0
ingestion_audits +0
data_quality_warnings +0
rollback_or_no_partial_write_evidence: true
```

`PRAGMA foreign_key_check` returned no rows.

## Conflict Behavior Result

The duplicate/conflicting `killmail_id` case is explicitly classified as:

```txt
existing_killmail_raw_row_preserved_but_conflicting_incoming_activity_events_inserted
```

Observed:

```txt
killmailsWritten: 0
eventsWritten: 4
warning_classifications: KILLMAIL_PAYLOAD_CHECKSUM_MISMATCH
existing_raw_payload_preserved: true
incoming_checksum_differs: true
incoming_conflict_event_keys_present: 4
```

This confirms the current writer preserves the existing raw `killmails` row while allowing conflicting incoming participant rows to land when their event keys differ. I did not patch this production behavior in HS387.

## Provider / Boundary Confirmation

Confirmed:

- no zKill calls
- no ESI calls
- no live/API/provider movement
- no operator corpus DB mutation
- no real Discovery ref mutation
- no Watch cadence/run mutation
- no Hydration/metadata writes
- no Observation/report output
- no Assessment writes
- no schema change
- no `actor.watch` redirect
- no `runActorWatchService(...)` change
- no mixed collector invocation/rewrite/retirement
- no dispatchers, queues, leases, workers, runtime enforcement, renderer UI, support artifacts, source-term rename, or protected-word JSON update

## Verification

Passed:

```txt
node --check src\main\services\evidenceWriterLandingPackageFixtureService.js
node --check scripts\verify-evidence-writer-landing-package-fixture.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check src\main\services\enforcementDryRunService.js
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Enforcement dry-run coverage reported:

```txt
total_commands: 112
covered_commands: 112
gap_commands: []
fixture_only_commands includes evidence.writer_landing_package_fixture.preview
```

Final protected-term and diff/status hygiene are recorded in `workspace/current.md`.

## Parked Work

- production writer conflict hardening
- runtime Discovery ESI-backed provider execution
- actor.watch runtime adapter / redirect
- mixed collector retirement
- durable Discovery receipt/task/packet schema
- Watch cadence mutation from Discovery/Evidence outcomes
- queues, dispatchers, leases, workers, runtime enforcement
- Observation/report behavior, Hydration readability repair, Assessment Memory links, and UI

## Recommended Next Action

Overseer review HS387 and decide whether the next packet should harden duplicate/conflicting writer behavior before any runtime adapter, redirect, live provider movement, or collector retirement work proceeds.
