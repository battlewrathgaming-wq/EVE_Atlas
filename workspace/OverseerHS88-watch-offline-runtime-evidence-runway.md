# Overseer HS88 - Watch_offline Runtime Evidence Runway

Date: 2026-05-26
Role: Atlas Overseer
Status: Dev runway opened
Milestone: Atlas Storage And Runtime Hardening

## Decision

Open a bounded Dev packet for runtime evidence around `Watch_offline` recovery diagnostics before renderer presentation work.

The Human accepted the direction: pretty presentation can wait until Atlas has stronger evidence that the system state is not broken.

## Source Of Intent

- Human preference on 2026-05-26: focus on runtime evidence before UI presentation.
- `workspace/OverseerHS87-hs86-lab-response-review.md`
- `workspace/DisplayResponseHS86-atlas-r-scanner-powered-down-console.md`
- `workspace/DevHS82-watch-recovery-diagnostic-readout.md`
- `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
- `docs/current-state/current-evidence-pipeline.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

## Dev Packet

Executor:

```txt
Dev
```

Expected handoff:

```txt
workspace/DevHS88-watch-offline-runtime-evidence.md
```

## Ordered Runway

1. Re-read the accepted `Watch_offline` authority and HS82/HS87 context.
2. Inspect the existing `Watch_offline` readout implementation and verification fixture.
3. Run the focused offline proof set from disk without live/API calls.
4. Capture evidence for the important runtime states: unarmed restart, due-if-armed, pending local Discovery refs, provider deferred, missed slot recoverable, orphan/review, valid/missing/malformed radius scope, and no mutation from readout.
5. If the existing verifier does not expose enough evidence, add or refine a small offline fixture/verifier or diagnostic output only. Do not change product behavior unless the gap is a direct testability bug.
6. Update durable current-state documentation only if the evidence changes or clarifies the accepted runtime model.
7. Create the expected Dev handoff with commands run, evidence observed, gaps found, and recommended next packet.

## Guardrails

- No renderer work.
- No UI redesign.
- No live/API calls.
- No backend behavior changes unless needed to fix a direct evidence-capture defect.
- No schema migration.
- No persisted sequencer packets.
- No broad provider work queue.
- No stale/expired Discovery ref mutation.
- Do not make `discovered_killmail_refs` the sequencer.
- Do not rename Watch, `Watch_offline`, Discovery, Evidence/EVEidence, hydration, scheduler, IPC, service, schema, payload, command, or test IDs.
- Do not couple metadata hydration to Watch recovery.
- Do not treat waiting/provider deferral as failure.
- Do not treat pending Discovery refs as Evidence/EVEidence.
- Do not adopt R-Scanner presentation into implementation in this packet.

## Stop Conditions

Stop and return to Overseer/Human if:

- evidence capture requires live provider access
- evidence capture requires schema migration
- evidence capture requires renderer/UI work
- behavior changes expand beyond a direct testability defect
- Discovery, Evidence/EVEidence, Watch, or hydration meanings blur
- the packet turns into sequencer architecture implementation
- the packet needs destructive or private data actions

## Required Verification

Run the focused checks:

```powershell
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:restart-recovery
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:hydration
npm.cmd run verify:db-integrity
npm.cmd run verify:service-registry
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If a verifier or fixture is changed, also run:

```powershell
npm.cmd run verify:all
```

## Evidence Expectations

The DevHS file should include:

- files reviewed
- files changed, if any
- exact commands run and pass/fail status
- sample evidence from `Watch_offline` proving the core runtime states
- confirmation that no provider calls, collection, Evidence writes, Discovery ref mutation, hydration, schema changes, or renderer work were performed
- gaps or noisy states that still need Human/Overseer decision
- recommendation for next packet: runtime hardening, minimal checkpoint, or renderer presentation
