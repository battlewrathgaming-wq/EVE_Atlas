# OverseerHS388 - HS387 Evidence/EVEidence Writer Landing Package Fixture Review

Status: accepted
Date: 2026-06-07
Role: Overseer

## Reviewed

- `workspace/OverseerHS387-evidence-writer-landing-package-fixture-proof-runway.md`
- `workspace/DevHS387-evidence-writer-landing-package-fixture-proof.md`
- `src/main/services/evidenceWriterLandingPackageFixtureService.js`
- `scripts/verify-evidence-writer-landing-package-fixture.js`
- registry, command authority, passive side-effect, and enforcement dry-run updates for the new command

## Result

HS387 is accepted.

The new proof command is:

```txt
evidence.writer_landing_package_fixture.preview
```

Accepted shape:

- fixture-only Evidence/EVEidence writer landing package proof
- internal disposable `:memory:` DB only
- caller DB and caller payload ignored for proof safety
- injected expanded ESI fixture payloads only
- package built through `evidencePackageFromExpandedKillmails(...)`
- persistence through `EvidenceRepository.persistEvidencePackage(...)`
- readback proof for `killmails`, `activity_events`, `entities`, `ingestion_audits`, and `data_quality_warnings`
- unchanged proof for `discovered_killmail_refs`, `api_request_logs`, Watch tables, Hydration/metadata tables, and Assessment tables

## Key Finding

HS387 proves the exact writer risk HS385 identified.

For duplicate/conflicting `killmail_id`, current writer behavior is:

```txt
existing_killmail_raw_row_preserved_but_conflicting_incoming_activity_events_inserted
```

Observed proof:

```txt
killmailsWritten: 0
eventsWritten: 4
warning_classifications: KILLMAIL_PAYLOAD_CHECKSUM_MISMATCH
existing_raw_payload_preserved: true
incoming_checksum_differs: true
incoming_conflict_event_keys_present: 4
```

This is not acceptable as a future runtime landing behavior. The raw ESI payload remains the Evidence/EVEidence basis; dependent participant/activity rows must not drift away from the preserved raw payload.

## Boundary Check

Accepted preserved boundaries:

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
- no dispatcher, queue, lease, worker, runtime enforcement, renderer UI, support artifact, source-term rename, or protected-word JSON update

## Verification

Overseer reran:

```txt
node --check src\main\services\evidenceWriterLandingPackageFixtureService.js
node --check scripts\verify-evidence-writer-landing-package-fixture.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:command-authority
npm.cmd run verify:service-registry
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- all focused and cross-cutting verification commands exited 0
- `verify:protected-terms` exited 0 with warning-only advisory output; no renames or protected-word JSON updates were performed
- `git diff --check` exited 0 with CRLF normalization warnings only
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the expected uncommitted Discovery/Watch/Evidence proof-chain working tree

## Resting State

HS387 is accepted.

Recommended next action:

Open a narrow writer hardening packet before runtime adapter, redirect, mixed collector retirement, live provider movement, or Discovery-owned runtime execution. The packet should suppress or reject conflicting incoming dependent rows when an existing `killmail_id` preserves an earlier raw Evidence/EVEidence payload.

