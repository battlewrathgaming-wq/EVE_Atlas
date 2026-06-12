# OverseerHS380 - HS379 Discovery ESI-backed Expansion Intake Posture Review

Status: accepted
Date: 2026-06-07
Role: Overseer

## Reviewed

- `workspace/OverseerHS379-discovery-esi-expansion-intake-posture-runway.md`
- `workspace/DevHS379-discovery-esi-expansion-intake-posture.md`
- `src/main/services/discoveryEsiExpansionIntakePostureService.js`
- `scripts/verify-discovery-esi-expansion-intake-posture.js`
- service registry, command authority, passive side-effect, and enforcement dry-run updates

## Result

HS379 is accepted.

The new preview command is:

```txt
discovery.esi_expansion_intake_posture.preview
```

The proof stays fixture-only, read-only, and source-agnostic. It composes the accepted Discovery acquisition-to-Evidence handoff fixture and classifies selected candidate refs for the future Discovery-owned ESI-backed killmail/detail expansion lane.

## Boundary Review

Accepted:

- Discovery owns the ESI-backed killmail/detail expansion intake posture.
- Actor Watch is only one possible caller.
- Candidate refs remain possible leads, not Evidence/EVEidence.
- ESI-backed killmail/detail expansion is not Hydration.
- Evidence/EVEidence begins at final landed memory.
- Evidence/EVEidence writer boundary is represented but not invoked.
- Local Evidence/EVEidence cache skip is represented without creating a new Evidence write.
- Retryable and terminal ESI-backed failure postures are fixture-only classification, not runtime provider execution.

No provider calls, zKill calls, ESI calls, live/API movement, Discovery ref writes, Evidence/EVEidence writes, Hydration/metadata writes, API logs/warnings, `fetch_runs`, Watch mutation, DB mutation, schema, `actor.watch` redirect, runtime path change, collector invocation/retirement, tasks, queues, dispatchers, leases, workers, UI, enforcement, command blocking, support artifacts, source-term rename, or protected-word JSON update were accepted.

## Notes

The local-cache proof seeds an existing `killmails` row before the preview and then proves table counts remain unchanged during the preview. That is the right shape: local Evidence/EVEidence can satisfy a future expansion need without treating the preview as a writer.

The failure postures intentionally remain classification only. HS379 does not prove real ESI execution, retry timing, provider error handling, or Evidence landing.

## Verification

Overseer reran:

```txt
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:command-authority
npm.cmd run verify:service-registry
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- all npm verifiers passed
- protected-term scan exited 0 with warning-only advisory output
- `git diff --check` exited 0 with CRLF normalization warnings only
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the expected discovery replacement proof-chain working tree

## Resting State

HS379 is accepted and no active Dev runway is open.

Recommended next candidate seams:

1. Narrow actor Watch compatibility-wrapper design/proof, still without providers, durable Discovery ref writes, Evidence/EVEidence writes, or collector retirement in the same packet.
2. Evidence/EVEidence writer landing package proof, if the final memory boundary should be proven before runtime wrapper work.
3. Pause Dev and run a boundary cleanup/audit pass if the Discovery replacement chain feels too noisy before the next implementation slice.
