# OverseerHS391 - Evidence Writer Mixed Conflict Package Proof Runway

Status: open
Date: 2026-06-07
Role: Overseer
Executor: Dev

## Purpose

Close the remaining HS389 assurance gap before runtime adapter, redirect, provider movement, or collector retirement work.

Prove that `EvidenceRepository.persistEvidencePackage(...)` handles a mixed package correctly when the same package contains:

- one clean new ESI-expanded killmail that should land normally
- one duplicate/conflicting `killmail_id` whose incoming dependent rows must be suppressed while the existing raw killmail row and conflict warning remain preserved

## Task

Extend the fixture-only Evidence/EVEidence writer landing package proof to include a mixed clean-plus-conflict package case.

The proof should show:

- the clean killmail lands in `killmails`
- the clean killmail's valid `activity_events` land
- entities backed by the clean landed event can land
- clean killmail `ingestion_audits` can land
- the conflicting duplicate killmail does not replace the existing raw ESI payload
- conflicting incoming `activity_events` are suppressed
- conflict-only `entities` are suppressed
- conflicting incoming `ingestion_audits` are suppressed
- the repository conflict warning remains visible
- result output reports `conflictDependentRowsSuppressed`

If the current writer already passes this case, this packet may be mostly fixture/verifier work.

## Boundaries

Do not add or change:

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

Use only controlled fixture payloads and controlled disposable fixture DB state.

## Suggested Files

Likely touched:

- `src/main/services/evidenceWriterLandingPackageFixtureService.js`
- `scripts/verify-evidence-writer-landing-package-fixture.js`
- `scripts/verify-evidence-rule-regressions.js`, only if this is the best place to pin the regression
- `workspace/DevHS391-evidence-writer-mixed-conflict-package-proof.md`

Production writer code should change only if the new mixed fixture exposes a real bug.

## Verification

Run focused checks:

```txt
node --check src\main\db\evidenceRepository.js
node --check src\main\services\evidenceWriterLandingPackageFixtureService.js
node --check scripts\verify-evidence-writer-landing-package-fixture.js
node --check scripts\verify-evidence-rule-regressions.js
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:evidence-rules
npm.cmd run verify:idempotent
```

Then run guardrails:

```txt
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

## Expected Handoff

Create:

```txt
workspace/DevHS391-evidence-writer-mixed-conflict-package-proof.md
```

The handoff should include:

- changed files
- mixed-package fixture summary
- proof output showing clean rows landed and conflict-derived rows suppressed
- verification commands and results
- boundary confirmation

