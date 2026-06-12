# OverseerHS389 - Evidence/EVEidence Writer Conflict Dependent-Row Hardening Runway

Status: open
Date: 2026-06-07
Role: Overseer

## Purpose

Harden the Evidence/EVEidence writer conflict boundary proven by HS387.

Current proven behavior:

```txt
duplicate/conflicting killmail_id
-> existing killmails raw row preserved
-> conflict warning emitted
-> incoming conflicting activity_events can still be inserted
```

That creates a split-brain Evidence/EVEidence risk: raw ESI payload is preserved, but dependent participant/activity rows may describe the conflicting incoming payload instead of the preserved payload.

This packet should make the writer boring and safe before any runtime adapter, redirect, live provider movement, or mixed collector retirement work proceeds.

## Current Model To Preserve

- Evidence/EVEidence is final landed memory.
- Raw expanded ESI killmail payload is the durable Evidence/EVEidence basis.
- `activity_events`, `entities`, `ingestion_audits`, and warnings are dependent/support rows derived from that basis.
- Candidate refs are possible leads, not Evidence/EVEidence.
- ESI-backed killmail/detail expansion is Discovery-owned provider movement, not Hydration.
- Hydration, Observation, and Assessment are outside writer landing.

## Task

Update the production writer boundary so that when an incoming package contains an existing `killmail_id` whose incoming hash/checksum/time/system conflicts with the stored `killmails` row:

1. Preserve the existing `killmails` raw row and existing raw payload/checksum/hash/time/system.
2. Emit or preserve the existing conflict warning behavior.
3. Do not insert incoming `activity_events` derived from the conflicting payload.
4. Do not insert incoming `entities` derived only from the conflicting payload.
5. Do not insert an incoming `ingestion_audits` row that implies the conflicting normalized rows became the landed Evidence basis.
6. Return or expose enough result posture for tests/handoff to report that conflicting dependent rows were suppressed.

If an input package contains both clean killmails and conflicting killmails, clean killmails should still land normally while conflicting dependent rows are suppressed.

Implementation may choose the smallest safe approach. If entity updates cannot be cleanly attributed by killmail with the current package shape, prefer conservative suppression over allowing conflict-derived labels to land.

## Suggested Verification Updates

Update the HS387 fixture proof so the conflict case now classifies as:

```txt
existing_killmail_raw_row_preserved_and_conflicting_dependent_rows_suppressed
```

or an equivalently explicit phrase.

Update existing guardrails where appropriate:

- `scripts/verify-evidence-writer-landing-package-fixture.js`
- `scripts/verify-idempotent-ingestion.js`
- `scripts/verify-adversarial-evidence-fixtures.js`
- `scripts/verify-evidence-rule-regressions.js`, only if its manifest needs a stronger phrase check

## Do Not

- call zKill
- call ESI
- perform live/API/provider movement
- change Discovery ref behavior
- change Watch cadence/run behavior
- change Hydration/metadata behavior
- create Observation/report output
- write Assessment Memory
- add or change schema
- redirect `actor.watch`
- change `runActorWatchService(...)`
- invoke, rewrite, or retire mixed collectors
- add dispatchers, queues, leases, workers, or runtime enforcement
- change renderer UI
- create support artifacts
- rename source-owned terms
- update protected-word JSON
- replace existing raw ESI payload on conflict
- hide the conflict warning

## Acceptance Criteria

- Existing raw `killmails` row is preserved on conflicting rediscovery.
- Existing raw payload/checksum/hash/time/system are not replaced.
- Conflict warning is still emitted.
- Incoming conflicting `activity_events` do not land.
- Incoming conflict-derived `entities` do not land unless they are also supported by a non-conflicting landed event in the same package.
- Incoming conflict-derived `ingestion_audits` do not imply conflicting normalized rows became landed Evidence/EVEidence.
- Same-payload rerun remains idempotent and non-duplicating.
- Clean payload landing remains unchanged.
- Partial-but-usable payload behavior remains unchanged.
- Malformed required-field rollback remains unchanged.
- HS387 fixture proof now reports the hardened behavior.
- No provider, Discovery, Watch, Hydration, Observation, Assessment, schema, runtime adapter, collector retirement, enforcement, support artifact, or UI behavior is changed.

## Verification

Run at minimum:

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

## Expected Handoff

Create:

```txt
workspace/DevHS389-evidence-writer-conflict-dependent-row-hardening.md
```

Include:

- files changed
- conflict behavior before/after summary
- exact dependent rows suppressed
- any conservative entity/audit handling decision
- verification evidence
- boundary confirmation
- parked work
- recommended next action

