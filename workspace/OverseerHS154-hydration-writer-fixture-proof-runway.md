# Overseer HS154 Runway: Hydration Writer Fixture Proof

Status: active Dev runway
Date: 2026-06-01

## Source Of Intent

Human selected the next seam:

> Memory lane has been good to us.

Accepted source context:

- `workspace/current.md`
- `workspace/OverseerHS145-hs144-hydration-backlog-preview-review.md`
- `workspace/OverseerHS151-hs150-hydration-execution-policy-review.md`
- `workspace/OverseerHS153-hs152-external-io-persisted-state-review.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/current-state/current-storage-runtime-hardening.md`

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: prove the smallest safe Hydration write path in fixture/offline mode.

Current executor: Dev

Expected handoff:

```text
workspace/DevHS154-hydration-writer-fixture-proof.md
```

## Product Meaning

Hydration repairs readability for already-stored IDs.

IDs remain facts. Names and labels are metadata.

This packet should prove Atlas can write fixture Hydration output without blurring:

- Hydration and Evidence/EVEidence
- labels and facts
- local fixture proof and provider-backed execution
- eligibility and runtime authorization

## Ordered Runway

1. Inspect existing metadata hydration code, `metadata_runs`, `entities`, activity-event label patching, hydration backlog preview, hydration execution policy preview, service registry metadata, passive side-effect verifier, and fixture DB/test patterns.
2. Add the smallest fixture/offline Hydration writer proof command or focused helper that writes representative label/readability output only in trusted fixture/test context.
3. Use existing schema if possible. Stop if runtime schema changes or broad persistence redesign are needed.
4. Prove the write is scoped to already-known IDs from fixture/local rows and does not create Evidence/EVEidence, Discovery refs, Watch state, queue state, or provider work.
5. Prove labels/names remain metadata and numeric IDs remain factual basis.
6. Prove renderer-origin payloads cannot forge arbitrary DB paths, target IDs, label authority, or provider results.
7. Keep External I/O, live/API gate, storage authority, and runtime enforcement as separate posture. This proof must not bypass or activate them.
8. Add focused verification plus service registry, command authority, enforcement dry-run, composed/gate policy, hydration policy, and passive side-effect coverage as needed.
9. Update Evidence / Dev Handoff in `workspace/current.md` and create the expected DevHS file.

## Guardrails

- No provider calls.
- No zKill calls.
- No ESI calls.
- No SDE download calls.
- No provider-backed Hydration.
- No runtime enforcement.
- No command interception or blocking.
- No real operator storage writes outside fixture/test control.
- No real project-root config writes.
- No schema migration unless Dev can prove it is purely fixture/test support and stops for Overseer if runtime schema is needed.
- No Discovery ref mutation.
- No Evidence/EVEidence writes.
- No raw killmail payload mutation.
- No queue dispatch.
- No Watch execution behavior changes.
- No broad persisted Hydration backlog or queue.
- No renderer UI work.
- No UI wording finalization.
- Do not treat missing labels as report failure.
- Do not treat provider-needed labels as Evidence/EVEidence work.
- Do not replace numeric IDs as facts.
- Do not hydrate every ID by default.
- Do not use live ESI or SDE download for this proof.
- Do not treat `eligible` or `would_allow` as authorization.

## Stop Conditions

Stop and return to Overseer/Human if:

- the proof needs live/provider/API calls
- the proof needs runtime command blocking or active enforcement
- the proof needs real operator storage/config writes
- the proof needs schema migration for runtime behavior
- the proof needs to mutate raw killmail Evidence/EVEidence
- the proof needs to create or mutate Discovery refs
- the proof needs broad Hydration queue/backlog persistence
- renderer-origin input would choose arbitrary DB paths, IDs, or labels
- label writes would overwrite numeric IDs as factual basis
- local SDE lookup gaps get treated as provider Evidence work
- view/local-record Hydration gets starved behind broad Watch/background backlog in the model

## Required Verification

Run:

```powershell
node --check <new-or-changed-js-files>
npm.cmd run verify:hydration
npm.cmd run verify:metadata-status
npm.cmd run verify:metadata-lookup
npm.cmd run verify:actor-metadata
npm.cmd run verify:corporation-metadata
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:external-io-state
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If a new verifier is added, include it in `package.json` and run it directly.

## Evidence Expected

Dev handoff should show:

- command/helper added, if any
- fixture write target and trust context
- sample before/after rows or readback showing label/readability metadata only
- proof that numeric IDs remain facts
- proof that raw killmail Evidence/EVEidence is not mutated
- proof that no Discovery refs, queues, Watch rows, or provider logs are mutated
- proof that renderer input cannot forge authority
- warning-only protected-term output

## Non-Goals

- real provider-backed Hydration
- runtime enforcement
- full Hydration queue implementation
- UI work
- schema-backed clock implementation
- storage migration
- pruning/deletion
