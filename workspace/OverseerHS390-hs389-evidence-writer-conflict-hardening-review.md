# OverseerHS390 - HS389 Evidence Writer Conflict Hardening Review

Status: accepted
Date: 2026-06-07
Role: Overseer

## Reviewed

- `workspace/OverseerHS389-evidence-writer-conflict-dependent-row-hardening-runway.md`
- `workspace/DevHS389-evidence-writer-conflict-dependent-row-hardening.md`
- `src/main/db/evidenceRepository.js`
- `src/main/services/evidenceWriterLandingPackageFixtureService.js`
- `scripts/verify-evidence-writer-landing-package-fixture.js`
- `scripts/verify-idempotent-ingestion.js`
- `scripts/verify-evidence-rule-regressions.js`

## Decision

HS389 is accepted.

The Evidence/EVEidence writer now preserves the existing raw `killmails` row and repository conflict warning on duplicate/conflicting `killmail_id` input while suppressing incoming conflict-derived dependent rows.

Accepted behavior:

- existing raw ESI killmail payload, checksum, hash, time, and system remain preserved
- `KILLMAIL_PAYLOAD_CHECKSUM_MISMATCH` remains visible
- conflicting incoming `activity_events` are suppressed
- conflict-only `entities` are suppressed
- conflicting incoming `ingestion_audits` are suppressed
- package-level warnings tied to conflicting incoming killmail IDs are suppressed while repository conflict warnings remain
- same-payload rerun remains idempotent
- clean, partial, malformed pre-writer rejection, and malformed rollback cases remain covered

## Boundary Check

No zKill calls, ESI calls, live/API/provider movement, Discovery ref behavior, Watch cadence/run behavior, Hydration/metadata behavior, Observation/report output, Assessment writes, schema, `actor.watch` redirect, `runActorWatchService(...)` change, mixed collector invocation/rewrite/retirement, dispatcher/queue/lease/worker behavior, runtime enforcement, renderer UI, support artifact behavior, source-term rename, protected-word JSON update, raw ESI payload replacement, or hidden conflict warning behavior was added.

## Verification

Dev reported and Overseer re-ran the relevant acceptance checks:

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

- all commands passed
- `verify:protected-terms` produced warning-only advisory output; no renames or protected-word JSON updates were performed
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- branch was `main...origin/main [ahead 19]`

## Remaining Assurance Gap

The source implementation is shaped to allow a mixed package where one killmail lands cleanly while a different duplicate/conflicting killmail has dependent rows suppressed. The current HS389 evidence strongly supports that posture, but the fixture evidence does not explicitly name a mixed clean-plus-conflict package case.

Because runtime replacement is the next larger seam, close this with one tiny fixture proof before moving toward adapter/redirect or collector retirement work.

## Next Recommended Packet

Open HS391: mixed clean/conflict package proof.

This should be fixture-only and disposable-DB only. It should prove one package can land clean killmail rows while suppressing dependent rows from a separate conflicting killmail ID in the same package.

