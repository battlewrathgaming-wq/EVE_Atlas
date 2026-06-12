# DevHS370 - Discovery Acquisition To Evidence Handoff Fixture

Status: complete
Date: 2026-06-07
Role: Dev

## Summary

Implemented a read-only/local-only fixture proof command:

```txt
discovery.acquisition_to_evidence_handoff_fixture.preview
```

The command proves this bounded fixture flow:

```txt
Discovery acquisition request
-> provider-facing fixture packets
-> fixture zKill-style outcomes
-> normalized candidate refs
-> canonical Discovery receipt / watch_summary
-> ESI Evidence Expansion handoff candidates
```

The handoff candidates are handoff shapes only. They are not Discovery refs, not Evidence/EVEidence, not Hydration output, and not stored operator memory.

## Files Changed

- `src/main/services/discoveryAcquisitionToEvidenceHandoffFixtureService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-discovery-acquisition-to-evidence-handoff-fixture.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS370-discovery-acquisition-to-evidence-handoff-fixture.md`

Note: the working tree already contained unaccepted/uncommitted HS356, HS363, and HS368 work before this packet. I preserved that tree and did not revert or commit it.

## Command Shape

The service reuses the accepted HS368 acquisition split fixture bridge, then adds the Evidence-handoff boundary proof:

- accepts actor-style and system/radius-style fixture acquisition requests
- emits provider-facing zKill fixture packet targets without provider calls
- consumes fixture outcomes only
- normalizes candidate refs with `killmail_id`, `killmail_hash`, source lane/kind, scope key, packet ID, provider basis, and candidate system where available
- reports duplicate posture using `killmail_id` + `killmail_hash`
- carries canonical Discovery receipt basis and `watch_summary` projection through from Discovery-owned receipt logic
- emits selected `esi_evidence_expansion_handoff_candidate` objects
- emits not-selected candidates with explicit reasons

## Fixture Coverage

The focused verifier covers:

- actor acquisition request
- system/radius acquisition request with multiple packets
- refs found
- no refs
- duplicate refs across packets
- provider deferred
- acquisition capped
- retryable failure
- terminal failure
- request-level `held_by_external_io` before acquisition with no packet outcomes
- selected candidate refs for ESI Evidence Expansion handoff
- not-selected candidate refs with disclosed reasons
- service-registry command invocation

Sample emitted facts from the focused verifier:

```txt
command: discovery.acquisition_to_evidence_handoff_fixture.preview
actor normalized refs: 2
actor selected handoff candidates: 1
system/radius packet outcomes: complete_refs_found, complete_no_refs, provider_deferred, failed_retryable
duplicate posture: duplicate_count 1, unique_candidate_count 1
held_by_external_io: provider-facing packets 0, handoff candidates 0
```

## Mirror Check

The fixture proof now represents these useful mixed-collector shapes without invoking the mixed collectors:

- zKill request basis
- candidate ref extraction basis
- candidate provenance basis
- dedupe basis
- provider outcome basis
- ESI Evidence Expansion handoff basis
- canonical Discovery receipt basis
- `watch_summary` projection

Still parked/unproven:

- live zKill/provider calls
- durable Discovery ref persistence
- real ESI Evidence Expansion
- Evidence/EVEidence writes
- mixed collector redirect or retirement
- durable Discovery task/packet/receipt schema
- Watch schedule/state mutation
- queues, dispatcher, leases, support artifacts, UI, and runtime enforcement

## Boundary Confirmation

Confirmed by implementation and verifier assertions:

- no providers or live/API calls
- no `collectActorWatch(...)`
- no `collectSystemRadiusWatch(...)`
- no `WatchSessionExecutor.tick(...)`
- no `TaskRunner.runDetachedTask(...)`
- no live Watch dispatch
- no task creation
- no Watch mutation
- no Discovery ref writes
- no Evidence/EVEidence writes
- no real ESI Evidence Expansion
- no Hydration or metadata writes
- no API logs, warnings, or `fetch_runs` writes
- no schema, queues, dispatcher, leases, support artifacts, UI, enforcement, command blocking, source-term rename, or protected-word JSON update

## Verification

Passed:

```txt
node --check src\main\services\discoveryAcquisitionToEvidenceHandoffFixtureService.js
node --check scripts\verify-discovery-acquisition-to-evidence-handoff-fixture.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check src\main\services\enforcementDryRunService.js
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:discovery-receipt-projection-fixture
npm.cmd run verify:watch-discovery-acquisition-split-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- focused HS370 verifier passed and printed actor, system/radius, duplicate, capped, deferred, failure, and held samples
- service registry verified
- command authority verified
- passive side-effect sweep verified
- enforcement dry-run verified with complete command coverage
- protected-term scan exited 0; warnings were advisory only, with no renames and no protected-word JSON updates
- `git diff --check` exited 0 with line-ending warnings only
- `git status --short --branch` reported `main...origin/main [ahead 19]` with existing dirty work plus HS370 additions

## Recommended Next Action

Overseer review HS370, especially the handoff candidate naming and duplicate/not-selected reason shape, then decide whether the next safe seam is mixed collector redirect planning or another fixture proof around Evidence Expansion intake ownership.
