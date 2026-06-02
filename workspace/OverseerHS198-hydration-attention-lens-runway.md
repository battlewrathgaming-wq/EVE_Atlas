# Overseer HS198 - Hydration Attention Lens Runway

Status: active Dev runway
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS198-hydration-attention-lens.md`

## Purpose

Add a read-only Hydration attention-lens proof so Atlas can show which local IDs deserve readability attention for a selected operator context before any provider call, persisted queue, Hydration write, schema change, or UI work.

Accepted product insight:

Hydration is not only a completeness mechanism. It is applied attention over local facts. Selectively hydrated labels can become landmarks inside a field of unresolved IDs, while unresolved IDs preserve the shape of the unknown.

This packet should make that principle inspectable in local data terms.

## Read First

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/features/data-layer-boundaries.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `workspace/OverseerHS177-hs176-hydration-candidate-preview-review.md`
- `src/main/services/hydrationCandidatePreviewService.js`
- `src/main/services/hydrationBacklogPreviewService.js`
- `src/main/services/hydrationExecutionPolicyPreviewService.js`
- `src/main/services/serviceRegistry.js`
- existing Hydration candidate verifier and registry/authority verifiers

## Task

Add or refine a read-only preview surface for Hydration attention selection.

Preferred command:

```txt
metadata.hydration_attention_lens.preview
```

Acceptable alternative:

Extend `metadata.hydration_candidates.preview` with a clearly separated `attention_lens` section, if that better matches the current service shape.

The proof should answer:

- what operator context is being treated as the current lens
- which candidate IDs become readable landmarks
- which candidates remain unresolved/deferred background
- which candidates are provider-needed versus already locally known
- which local SDE gaps are local lookup gaps rather than ESI Hydration work
- why Watch/background candidates do not starve view/local-record candidates
- how the preview avoids claiming complete readability coverage

## Required Behavior

The readout should include:

- lens input summary, such as target/report scope or explicit IDs
- selected candidate count
- deferred/background candidate count
- provider-needed selected count
- known-local selected count
- local-SDE-gap selected count
- representative selected candidates with stable IDs and basis
- representative deferred candidates with reason
- basis/source anchors for selected candidates
- an explicit statement that IDs remain facts and labels are readability
- an explicit statement that unhydrated IDs are not failure and not missing Evidence/EVEidence
- an explicit statement that the lens is not a persisted queue and not authorization to call providers

Keep the proof local and deterministic. It may reuse existing fixture/test databases and existing Hydration candidate derivation.

## Boundaries And Non-Goals

- Do not create a persisted Hydration queue.
- Do not call ESI, zKill, SDE download, or any provider.
- Do not write Hydration labels.
- Do not write `metadata_runs`.
- Do not write `entities`.
- Do not patch `activity_events`.
- Do not create Evidence/EVEidence.
- Do not mutate Discovery refs.
- Do not mutate Watch state.
- Do not mutate Assessment Memory or Marked state.
- Do not change schema.
- Do not create support artifacts, snapshots, trace packs, logs, files, exports, packages, or directories.
- Do not activate runtime enforcement.
- Do not add command blocking.
- Do not change renderer UI.
- Do not implement pruning, deletion, label removal, or de-emphasis behavior.
- Do not treat selected Hydration attention as product truth, tactical meaning, Assessment Memory, or Dev authorization for provider movement.

## Stop Conditions

Stop and return to Overseer if:

- proving attention selection requires provider calls
- proving attention selection requires persisted queue/state
- proving attention selection requires schema changes
- the implementation starts treating missing labels as Evidence gaps
- the implementation blurs Hydration with ESI Evidence Expansion
- the implementation turns Watch/background readability into a higher priority than view/local-record readability without explicit Human/Overseer decision
- implementation requires UI work, runtime enforcement, command blocking, destructive/private/live action, or real operator data inspection

## Verification Expectations

Run syntax checks on every changed JavaScript file.

Expected focused verification:

```powershell
npm.cmd run verify:hydration-candidate-preview
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:hydration
npm.cmd run verify:metadata-status
npm.cmd run verify:metadata-lookup
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If a new verifier is added, include it in `package.json` and run it.

## Expected Handoff

Create:

```txt
workspace/DevHS198-hydration-attention-lens.md
```

Include:

- files changed
- command or preview surface used
- sample output summary
- how selected/deferred candidates are represented
- how provider-needed/local-known/local-SDE-gap candidates are distinguished
- warning count from protected-term check
- verification commands and results
- confirmation that no provider calls, Hydration writes, persisted queue, schema changes, support artifacts, runtime enforcement, command blocking, UI work, Evidence/EVEidence, Discovery, Watch, Assessment Memory, Marked, pruning, or deletion behavior was added
