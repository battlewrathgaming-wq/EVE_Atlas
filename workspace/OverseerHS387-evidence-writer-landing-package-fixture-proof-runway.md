# OverseerHS387 - Evidence/EVEidence Writer Landing Package Fixture Proof Runway

Status: open
Date: 2026-06-07
Role: Overseer

## Purpose

Add a bounded fixture proof for the Evidence/EVEidence writer landing package before runtime adapter work, actor Watch redirect, mixed collector retirement, live provider movement, or schema work.

HS385 accepted the source trace and identified the current landing seam:

```txt
selected Discovery candidate basis
-> injected expanded ESI killmail fixture payload
-> evidencePackageFromExpandedKillmails(...)
-> EvidenceRepository.persistEvidencePackage(...)
-> disposable DB readback proof
```

This packet proves the final landed-memory boundary. It is not a production writer rewrite.

## Current Model To Preserve

- Watch is a scheduler and scope-authority source.
- Discovery is the provider-facing acquisition utility.
- Candidate refs are possible leads, not Evidence/EVEidence.
- ESI-backed killmail/detail expansion is Discovery-owned provider movement, not Hydration.
- Evidence/EVEidence is final landed memory.
- Hydration repairs readability only.
- Observation derives/frames local records later.
- Assessment Memory is human-authored judgment, not Evidence/EVEidence.

## Task

Implement a fixture-only Evidence/EVEidence writer landing package proof.

Suggested command:

```txt
evidence.writer_landing_package_fixture.preview
```

Suggested verifier:

```txt
verify:evidence-writer-landing-package-fixture
```

The proof should:

1. Use controlled fixture Discovery selected-ready candidate basis.
2. Inject expanded ESI killmail fixture payloads.
3. Build the package through `evidencePackageFromExpandedKillmails(...)` or the nearest current no-provider package builder.
4. Persist through `EvidenceRepository.persistEvidencePackage(...)` against a controlled disposable fixture DB only.
5. Read back affected tables and report table-count deltas.
6. Prove boundaries and disclose risks without changing live/runtime writer behavior.

## Required Fixture Cases

Cover at least:

- clean ESI-expanded killmail payload with victim and attackers
- idempotent rerun of the same payload
- local Evidence/EVEidence cache-existing case before any provider movement would occur
- duplicate `killmail_id` with conflicting hash/checksum/time/system
- partial-but-usable payload such as missing victim or missing attackers
- malformed payload missing `killmail_id` or another required durable field, proving rollback or no partial durable landing

The duplicate/conflict case is important. If the current writer preserves an existing `killmails` raw row while inserting incoming activity rows from the conflicting package, report that explicitly as current behavior and recommend a follow-up hardening packet. Do not silently smooth it over.

## Required Output Shape

The command/verifier output should disclose:

- `proof_status`
- fixture DB path or fixture DB posture, without implying operator corpus mutation
- fixture run context
- candidate basis used
- payload basis used
- rows written/read back by table:
  - `killmails`
  - `activity_events`
  - `entities`
  - `ingestion_audits`
  - `data_quality_warnings`
- tables proven unchanged:
  - `discovered_killmail_refs`
  - `api_request_logs`
  - Watch tables
  - Hydration/metadata tables
  - Assessment tables
- raw payload checksum comparison
- warning classifications
- conflict behavior classification
- rollback/no-partial-write evidence for malformed required input
- explicit provider invocation count or provider-not-invoked flag

## Do Not

- call zKill
- call ESI
- perform live/API/provider movement
- mutate the operator corpus DB
- mutate real Discovery refs
- mutate Watch cadence or Watch run state
- write Hydration/metadata
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
- patch production writer conflict behavior in the same packet unless a hard blocker makes the proof impossible and the handoff explains why

## Acceptance Criteria

- A focused proof command or verifier exists.
- The proof uses only fixture data and a disposable DB.
- The proof lands expected clean Evidence/EVEidence rows:
  - one `killmails` row with raw payload and checksum preserved
  - expected `activity_events`
  - expected `entities`
  - expected `ingestion_audits`
  - expected warnings only for partial/conflict cases
- Same-payload rerun does not duplicate killmail or activity rows.
- Local-cache-existing posture is shown before provider movement would happen.
- Duplicate/conflicting killmail behavior is explicitly proven and classified.
- Malformed required-field input proves rollback or no partial durable landing.
- No `discovered_killmail_refs` rows are created or mutated by writer landing.
- No `api_request_logs` rows are created in the no-provider fixture.
- No Hydration, Observation, Assessment, Watch cadence, schema, dispatcher, runtime, enforcement, support artifact, or UI changes occur.

## Verification

Run at minimum:

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
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If implementation chooses different filenames, adjust the `node --check` targets but keep the evidence equivalent.

## Expected Handoff

Create:

```txt
workspace/DevHS387-evidence-writer-landing-package-fixture-proof.md
```

Include:

- files changed
- fixture command/output summary
- fixture cases covered
- disposable DB posture
- table-count/readback proof
- conflict behavior result
- malformed/rollback result
- provider-not-invoked proof
- boundary confirmation
- verification evidence
- parked work
- recommended next action

