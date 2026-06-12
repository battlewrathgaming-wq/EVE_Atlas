# OverseerHS392 - HS391 Evidence Writer Mixed Conflict Proof Review

Status: accepted
Date: 2026-06-07
Role: Overseer

## Reviewed

- `workspace/OverseerHS391-evidence-writer-mixed-conflict-package-proof-runway.md`
- `workspace/DevHS391-evidence-writer-mixed-conflict-package-proof.md`
- `src/main/services/evidenceWriterLandingPackageFixtureService.js`
- `scripts/verify-evidence-writer-landing-package-fixture.js`
- `scripts/verify-evidence-rule-regressions.js`

## Decision

HS391 is accepted.

The remaining HS389 assurance gap is closed. Atlas now has fixture proof that a single Evidence/EVEidence writer package can land clean killmail rows while suppressing dependent rows from a separate duplicate/conflicting killmail ID in the same package.

## Accepted Behavior

The mixed fixture proves:

- clean new killmail `100138708` lands in `killmails`
- clean activity rows land
- clean-backed entity rows land
- clean ingestion audit lands
- conflicting duplicate killmail `100138707` preserves the existing raw killmail basis
- conflicting incoming raw ESI payload does not replace the existing raw payload
- repository conflict warning remains visible through `KILLMAIL_PAYLOAD_CHECKSUM_MISMATCH`
- conflicting incoming activity rows do not land
- conflict-only entities do not land
- conflicting incoming audit does not land
- `conflictDependentRowsSuppressed` reports the suppressed dependent rows

Production writer code did not need another change for HS391. The HS389 hardening already handled the mixed package case.

## Boundary Check

No zKill calls, ESI calls, live/API/provider movement, Discovery ref behavior, Watch cadence/run behavior, Hydration/metadata behavior, Observation/report output, Assessment writes, schema, `actor.watch` redirect, `runActorWatchService(...)` change, mixed collector invocation/rewrite/retirement, dispatchers, queues, leases, workers, runtime enforcement, renderer UI, support artifacts, source-term rename, protected-word JSON update, or raw ESI payload replacement was added.

## Verification

Overseer re-ran:

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

- all commands passed
- `verify:evidence-writer-landing-package-fixture` reported `proof_status: mixed_clean_plus_conflict_package_proven`
- `verify:protected-terms` produced warning-only advisory output; no renames or protected-word JSON updates were performed
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- branch was `main...origin/main [ahead 19]`

## Next Seam

The Evidence/EVEidence writer proof surface is now strong enough to move back toward the actor Watch replacement path.

Do not jump straight to runtime redirect. The next useful step is an Engineering/source-trace readiness pass for the first `actor.watch` runtime redirect or compatibility-wrapper activation.

That pass should identify the exact entry point, old caller expectations, boundary-owned route pieces already proven, remaining gaps, safe first redirect shape, and rollback/retirement boundary before Dev changes runtime behavior.

