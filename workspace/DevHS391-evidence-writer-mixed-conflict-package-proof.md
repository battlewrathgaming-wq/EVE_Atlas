# DevHS391 - Evidence Writer Mixed Conflict Package Proof

Status: complete; pending Overseer review
Date: 2026-06-07
Role: Dev

## Scope

Executed `workspace/OverseerHS391-evidence-writer-mixed-conflict-package-proof-runway.md`.

Goal: extend the fixture-only Evidence/EVEidence writer landing package proof so a single package containing one clean new ESI-expanded killmail and one separate duplicate/conflicting killmail proves clean rows land while conflict-derived dependent rows are suppressed.

## Files Changed

- `src/main/services/evidenceWriterLandingPackageFixtureService.js`
- `scripts/verify-evidence-writer-landing-package-fixture.js`
- `scripts/verify-evidence-rule-regressions.js`
- `workspace/current.md`
- `workspace/DevHS391-evidence-writer-mixed-conflict-package-proof.md`

Production writer code did not change for HS391. The HS389 writer hardening already passed the mixed package proof.

## Mixed Fixture Summary

Added fixture case:

```txt
mixed_clean_plus_conflict_package
```

Fixture setup:

- controlled disposable `:memory:` DB
- original raw killmail `100138707` seeded before the mixed package
- mixed package built through `evidencePackageFromExpandedKillmails(...)`
- mixed package persisted through `EvidenceRepository.persistEvidencePackage(...)`
- mixed package contains:
  - clean new killmail `100138708`
  - duplicate/conflicting incoming killmail `100138707`

Proof expectations now enforced:

- clean killmail lands in `killmails`
- clean killmail activity rows land
- clean-backed entity rows land
- clean killmail audit lands
- conflicting duplicate does not replace existing raw ESI payload/checksum/hash/time/system
- conflicting incoming activity rows do not land
- conflict-only entities do not land
- conflicting incoming audit does not land
- repository conflict warning remains visible
- `conflictDependentRowsSuppressed` reports suppressed rows

## Proof Output

From `npm.cmd run verify:evidence-writer-landing-package-fixture`:

```txt
proof_status: mixed_clean_plus_conflict_package_proven
classification: clean_rows_landed_conflict_dependent_rows_suppressed
killmailsWritten: 1
eventsWritten: 7
deltas.killmails: 1
deltas.activity_events: 7
deltas.entities: 7
deltas.ingestion_audits: 1
deltas.data_quality_warnings: 1
clean_killmail.killmail_id: 100138708
clean_killmail.raw_payload_checksum_matches: true
clean_killmail.activity_event_count: 7
clean_killmail.ingestion_audits.length: 1
conflicting_killmail.killmail_id: 100138707
conflicting_killmail.existing_raw_payload_preserved: true
conflicting_killmail.incoming_checksum_differs: true
conflicting_killmail.warning_classifications: KILLMAIL_PAYLOAD_CHECKSUM_MISMATCH
conflicting_killmail.incoming_conflict_event_keys_present: []
conflicting_killmail.ingestion_audits.length: 1
conflictDependentRowsSuppressed.activity_events: 6
conflictDependentRowsSuppressed.entities: 6
conflictDependentRowsSuppressed.ingestion_audits: 1
conflictDependentRowsSuppressed.warnings: 0
```

Interpretation:

- The clean half of the mixed package became landed Evidence/EVEidence normally.
- The conflict half preserved the existing raw killmail basis and emitted the conflict warning.
- The conflict half did not insert incoming conflict-derived activity rows, conflict-only entity rows, or the conflicting incoming audit.
- The only warning delta was the repository conflict warning.

## Verification

Commands run:

```txt
node --check src\main\db\evidenceRepository.js
node --check src\main\services\evidenceWriterLandingPackageFixtureService.js
node --check scripts\verify-evidence-writer-landing-package-fixture.js
node --check scripts\verify-evidence-rule-regressions.js
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:evidence-rules
npm.cmd run verify:idempotent
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- all listed commands passed
- `npm.cmd run verify:service-registry` passed with a 300 second ceiling
- `npm.cmd run verify:protected-terms` completed with warning-only advisory output; no protected-word JSON updates or source-term renames were performed
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git status --short --branch` showed `## main...origin/main [ahead 19]` and the existing broad HS356-HS391 working set, plus HS391 changes

## Boundary Confirmation

Did not add or change:

- zKill calls
- ESI calls
- live/API/provider movement
- Discovery ref behavior
- Watch cadence/run behavior
- Hydration/metadata behavior
- Observation/report output
- Assessment writes
- schema
- `actor.watch` redirect
- `runActorWatchService(...)`
- mixed collector invocation/rewrite/retirement
- dispatchers, queues, leases, workers, or runtime enforcement
- renderer UI
- support artifacts
- source-term rename
- protected-word JSON
- raw ESI payload replacement

## Risks / Parked Work

- This is still a fixture-only proof using injected expanded ESI payloads and a disposable DB.
- It does not prove live/provider runtime behavior.
- It does not redirect or retire mixed collectors.
- It does not add runtime adapter behavior.

## Recommended Next Action

Overseer review HS391. If accepted, the writer conflict assurance gap is closed enough to consider the next bounded runtime adapter / redirect / collector-retirement proof, with live/provider movement still parked until explicitly opened.
