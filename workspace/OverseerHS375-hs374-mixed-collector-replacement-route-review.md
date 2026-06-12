# OverseerHS375 - HS374 Mixed Collector Replacement Route Review

Status: accepted
Date: 2026-06-07
Role: Overseer

## Reviewed

- `workspace/OverseerHS374-mixed-collector-replacement-route-preview-runway.md`
- `workspace/DevHS374-mixed-collector-replacement-route-preview.md`
- `src/main/services/watchMixedCollectorReplacementRouteService.js`
- `scripts/verify-watch-mixed-collector-replacement-route.js`
- dependent HS368 / HS370 fixture route outputs

## Acceptance

HS374 is accepted.

The packet added the read-only/local-only route preview:

```txt
watch.mixed_collector_replacement_route.preview
```

Focused verifier:

```txt
verify:watch-mixed-collector-replacement-route
```

## Boundary Findings

The implementation matches the accepted replacement route:

```txt
Watch accepted intent / cadence
-> Discovery zKill candidate-lead acquisition lane
-> Discovery ESI-backed killmail/detail expansion lane
-> Evidence/EVEidence writer / landed memory
-> Watch receipt / cadence posture
```

Accepted boundary posture:

- Watch remains the accepted intent, cadence, and scope-authority source.
- Discovery receives accepted acquisition items; it does not form Watch scope.
- System/radius Watch route preserves stored accepted `included_system_ids`.
- Center system and radius remain provenance/explanation after Watch acceptance.
- Discovery emits one provider-facing packet per accepted system in the system/radius fixture path.
- Discovery ESI-backed killmail/detail expansion is represented as a future Discovery-serviced provider lane only.
- Evidence/EVEidence writer is represented as final landed memory only and is not invoked.
- Legacy mixed collectors are identified as retire candidates but are not redirected or retired.

## Specific Clarification

The term `system.radius.watch` is accepted here only as the current/legacy Watch entry-point shape being mapped into the replacement route.

It must not mean Discovery recomputes system/radius topology or decides which systems are related. Scope formation belongs to Watch setup / scope authority. Discovery receives the stored accepted system IDs and performs acquisition over those accepted items.

## Verification Run

Overseer reran:

```txt
npm.cmd run verify:watch-mixed-collector-replacement-route
npm.cmd run verify:watch-discovery-acquisition-split-fixture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
```

All three passed.

Dev also reported the broader HS374 verification set passed, including command authority, service registry, passive side-effects, enforcement dry-run, protected-term scan, and `git diff --check`.

## No-Action Confirmation

No provider calls, live/API calls, mixed collector invocation, Watch execution, task creation, Watch mutation, Discovery ref writes, Evidence/EVEidence writes, live/provider ESI-backed expansion, Hydration/metadata writes, API logs/warnings, `fetch_runs` writes, durable Discovery task/packet/receipt schema, queue/dispatcher/lease, support artifacts, UI, runtime enforcement, command blocking, source-term rename, protected-word JSON update, mixed collector redirect, or mixed collector retirement were accepted.

## Next Decision

Do not open a new Dev runway automatically.

Recommended next discussion surface:

```txt
Discovery ESI-backed expansion intake ownership proof
```

Keep it fixture-only and without Evidence/EVEidence writes if opened later.

Alternative valid next seams:

- Evidence/EVEidence writer landing boundary proof
- compatibility-wrapper planning after more Discovery/Evidence split proof
- mixed collector retirement sequencing after one narrow replacement path exists

