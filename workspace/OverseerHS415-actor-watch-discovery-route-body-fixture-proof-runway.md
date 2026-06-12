# OverseerHS415 - Actor Watch Discovery-Owned Route Body Fixture Proof Runway

Status: open
Date: 2026-06-07
Executor: Dev
Expected handoff: `workspace/DevHS415-actor-watch-discovery-route-body-fixture-proof.md`

## Task

Add a no-provider actor Watch Discovery-owned route body proof.

This proof should show that actor Watch-shaped input can flow through a new boundary-owned actor route body that composes Discovery-owned helper surfaces and returns the old caller-facing compatibility result shape without invoking `collectActorWatch(...)`.

This is not a default `actor.watch` redirect.

## Purpose

HS413 accepted that actor Watch is not ready for default runtime redirect, but is ready for a narrower route-body proof.

The goal is to prove the next bend:

```txt
actor Watch payload / normalized actor scope
-> new boundary-owned actor route body
-> Discovery zKill candidate acquisition helper
-> Discovery candidate-ref memory/write-policy posture
-> Discovery ESI-backed selected-ref expansion package helper
-> Evidence writer boundary represented or fixture/disposable only
-> old caller-facing compatibility result shape
```

## Required Shape

Add a new explicit route body/helper or preview/proof service. Name it clearly so it cannot be mistaken for production redirect.

Suggested naming direction:

```txt
actorWatchDiscoveryRouteBodyFixture
```

or similar.

The proof may expose a command if useful, but the command must be explicit preview/proof only.

Suggested command:

```txt
watch.actor_discovery_route_body_fixture.preview
```

Suggested verifier:

```txt
verify:watch-actor-discovery-route-body-fixture
```

## Requirements

The proof must:

- consume the same actor Watch-like input shape used by current actor Watch behavior
- use fake/injected zKill and ESI clients only
- compose existing Discovery-owned helpers where possible:
  - `discoverActorRefs(...)`
  - `pendingActorDiscovery(...)`, if pending-ref drain is included
  - `selectExpansionCandidates(...)`
  - `buildEvidencePackageFromRefs(...)`
- prove `collectActorWatch(...)` is not imported or invoked by the new route body
- preserve the old caller-facing compatibility result shape or explicitly map how it would be preserved
- label old result fields as compatibility fields, not future Discovery receipt doctrine
- keep candidate refs as Discovery leads/provenance, not Evidence/EVEidence
- keep ESI-backed expansion as Discovery-owned behavior, not Hydration
- keep Evidence/EVEidence beginning only at writer landing
- preserve local cache skip behavior or explicitly represent it
- either fixture-prove candidate-ref selected/expanded/cached/failed mutation posture or explicitly park it
- either represent writer landing without invoking it, or invoke `EvidenceRepository.persistEvidencePackage(...)` only against disposable fixture DB if the proof explicitly scopes that

Preferred first version:

- no provider calls
- no production redirect
- no scheduled Watch change
- no collector retirement
- fixture/injected clients
- no durable operator corpus mutation
- explicit preview/proof command or direct verifier-only helper

## Boundaries

Do not:

- change the production `actor.watch` route
- change `runActorWatchService(...)`
- change `watchExecutor.dispatchFor(...)`
- invoke `collectActorWatch(...)` from the new route body
- retire `collectActorWatch(...)`
- call zKillboard
- call ESI
- perform live/API/provider movement
- mutate real/operator Discovery refs
- mutate real/operator Evidence/EVEidence
- mutate real/operator Hydration metadata
- mutate real/operator Watch cadence
- change command metadata except for an explicit preview/proof command if used
- change schema
- add dispatcher / queue / lease / sequencer behavior
- change system/radius Watch behavior
- change renderer UI
- create support artifacts
- rename source-owned terms
- update protected-word JSON

Stop if this proof requires real provider calls, production `actor.watch` redirect, scheduled Watch redirect, collector retirement, schema changes, or operator corpus writes.

## Acceptance Criteria

Dev handoff must prove:

- new route body exists and is explicitly proof/preview-scoped
- `collectActorWatch(...)` is not imported or invoked by the new route body
- fake/injected clients are used for zKill and ESI
- no live provider calls occur
- production `actor.watch` remains unchanged
- `runActorWatchService(...)` remains unchanged unless the change is explicitly limited to non-default preview/proof wiring
- `watchExecutor.dispatchFor(actor)` remains unchanged
- old caller-facing compatibility fields can be produced
- compatibility fields are identified as compatibility-only
- candidate refs are not treated as Evidence/EVEidence
- ESI-backed expansion is not treated as Hydration
- Evidence/EVEidence writer landing is represented or fixture/disposable only
- selected/expanded/cached/failed mutation posture is either proven or parked
- system/radius Watch remains untouched

## Verification

Run focused checks:

```txt
node --check <new route body/proof file>
node --check <new verifier or preview service file>
node --check src\main\workers\actorWatchCollector.js
node --check src\main\services\mutatingActionService.js
node --check src\main\watchlist\watchExecutor.js
npm.cmd run verify:watch-actor-discovery-route-body-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:watch-actor-compatibility-wrapper-adapter-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:evidence-rules
npm.cmd run verify:watch-executor
npm.cmd run verify:mutating-services
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If the proof uses disposable DB writes, include before/after counts for:

- `discovered_killmail_refs`
- `killmails`
- `activity_events`
- `fetch_runs`
- `api_request_logs`
- `data_quality_warnings`
- `watchlist_entities`

If the proof is read-only/injected only, prove those counts remain unchanged.

## Expected Handoff

Create:

```txt
workspace/DevHS415-actor-watch-discovery-route-body-fixture-proof.md
```

Include:

- files changed
- route body description
- import/source proof that `collectActorWatch(...)` is not used
- compatibility shape proof
- provider/no-provider proof
- mutation proof
- verification commands and results
- parked items
