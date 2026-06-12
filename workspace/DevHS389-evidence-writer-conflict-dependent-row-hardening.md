# DevHS389 - Evidence Writer Conflict Dependent-Row Hardening

Status: complete; pending Overseer review
Date: 2026-06-07
Role: Dev

## Scope

Executed `workspace/OverseerHS389-evidence-writer-conflict-dependent-row-hardening-runway.md`.

Goal: harden the Evidence/EVEidence writer so duplicate/conflicting `killmail_id` input preserves the existing raw `killmails` row and conflict warning while suppressing incoming conflict-derived dependent rows.

## Files Changed

- `src/main/db/evidenceRepository.js`
- `src/main/services/evidenceWriterLandingPackageFixtureService.js`
- `scripts/verify-evidence-writer-landing-package-fixture.js`
- `scripts/verify-idempotent-ingestion.js`
- `scripts/verify-evidence-rule-regressions.js`
- `workspace/current.md`
- `workspace/DevHS389-evidence-writer-conflict-dependent-row-hardening.md`

## Conflict Behavior

Before HS389, HS387 proved this posture:

```txt
duplicate/conflicting killmail_id
-> existing killmails raw row preserved
-> conflict warning emitted
-> incoming conflicting activity_events could still be inserted
```

After HS389:

```txt
duplicate/conflicting killmail_id
-> existing killmails raw row preserved
-> existing raw payload/checksum/hash/time/system preserved
-> conflict warning emitted
-> incoming conflicting activity_events suppressed
-> incoming conflict-only entities suppressed
-> incoming conflicting ingestion_audits suppressed
-> repository result reports suppression posture
```

`EvidenceRepository.persistEvidencePackage(...)` now tracks conflicting killmail IDs after comparing incoming checksum/hash/time/system against the stored `killmails` row. It continues to call the killmail upsert, whose conflict behavior only updates `last_seen_at`, so raw ESI payload replacement does not occur.

## Dependent Rows Suppressed

The writer now returns:

```txt
conflictDependentRowsSuppressed.activity_events
conflictDependentRowsSuppressed.entities
conflictDependentRowsSuppressed.ingestion_audits
conflictDependentRowsSuppressed.warnings
```

Suppression decisions:

- `activity_events`: skipped when `event.killmail_id` belongs to a conflicting duplicate killmail.
- `entities`: skipped when derived only from suppressed conflicting events; if the same entity is also supported by a non-conflicting landed event in the same package, it can still land.
- `ingestion_audits`: skipped when `audit.killmail_id` belongs to a conflicting duplicate killmail.
- package warnings: skipped when `warning.killmail_id` belongs to a conflicting duplicate killmail; the repository-generated conflict warning remains visible.

This is conservative for entities because the package shape does not directly attribute entity updates to a single killmail. The implementation derives conflict-only entity keys from suppressed events and preserves entities backed by non-conflicting events.

## Sample Hardened Output

From `npm.cmd run verify:evidence-writer-landing-package-fixture`:

```txt
conflict_behavior_classification: existing_killmail_raw_row_preserved_and_conflicting_dependent_rows_suppressed
killmailsWritten: 0
eventsWritten: 0
conflictDependentRowsSuppressed.activity_events: 6
conflictDependentRowsSuppressed.entities: 6
conflictDependentRowsSuppressed.ingestion_audits: 1
conflictDependentRowsSuppressed.warnings: 0
deltas.killmails: 0
deltas.activity_events: 0
deltas.entities: 0
deltas.ingestion_audits: 0
deltas.data_quality_warnings: 1
existing_raw_payload_preserved: true
incoming_checksum_differs: true
incoming_conflict_event_keys_present: []
warning_classifications: KILLMAIL_PAYLOAD_CHECKSUM_MISMATCH
```

Clean payload output remains unchanged:

```txt
killmailsWritten: 1
eventsWritten: 7
deltas.killmails: 1
deltas.activity_events: 7
deltas.entities: 7
deltas.ingestion_audits: 1
deltas.data_quality_warnings: 0
```

Same-payload rerun remains idempotent:

```txt
killmailsWritten: 0
eventsWritten: 0
deltas.killmails: 0
deltas.activity_events: 0
raw_payload_checksum matches existing
```

## Verification

Commands run:

```txt
node --check src\main\db\evidenceRepository.js
node --check src\main\services\evidenceWriterLandingPackageFixtureService.js
node --check scripts\verify-evidence-writer-landing-package-fixture.js
node --check scripts\verify-idempotent-ingestion.js
node --check scripts\verify-adversarial-evidence-fixtures.js
node --check scripts\verify-evidence-rule-regressions.js
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:idempotent
npm.cmd run verify:adversarial-fixtures
npm.cmd run verify:evidence-rules
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
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
- `npm.cmd run verify:evidence-rules` initially failed because the new manifest phrase did not match the exact verifier assertion text; the phrase was corrected and the command passed on rerun
- `npm.cmd run verify:service-registry` passed with a 300 second ceiling
- `npm.cmd run verify:protected-terms` completed with warning-only advisory output; no protected-word JSON updates or source-term renames were performed
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git status --short --branch` showed `## main...origin/main [ahead 19]` and the existing broad HS356-HS389 working set, plus HS389 changes

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
- hidden conflict warning behavior

## Risks / Parked Work

- Entity suppression is derived from event entity keys because `entity_updates` do not carry killmail provenance. This is intentionally conservative and preserves entities that are also backed by non-conflicting landed events in the same package.
- This hardens the writer boundary but does not replace, redirect, or retire the existing mixed collectors.
- This does not prove live/provider runtime behavior.

## Recommended Next Action

Overseer review HS389. If accepted, the next runway can either proceed toward the runtime adapter/redirect seam or add one small mixed clean/conflict package proof before live/provider movement or collector retirement.
