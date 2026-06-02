# Overseer HS218 - Hydration Attention Runtime Posture Runway

Status: active Dev runway
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS218-hydration-attention-runtime-posture.md`

## Purpose

Make Atlas' Hydration attention behavior inspectable at the runtime/readout boundary before any provider-backed Hydration execution exists.

Accepted product insight:

Raw IDs are truthful local facts. Readable labels are applied attention over those facts. Atlas should be able to show, for a selected local context, which IDs can stay raw, which are already locally readable, which need future provider-backed Hydration, which are local SDE lookup gaps, and which should remain deferred.

This packet should make that posture explicit without creating a Hydration queue or spending provider calls.

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
- `workspace/OverseerHS198-hydration-attention-lens-runway.md`
- `workspace/OverseerHS199-hs198-hydration-attention-lens-review.md`
- `src/main/services/hydrationAttentionLensService.js`
- `src/main/services/hydrationCandidatePreviewService.js`
- `src/main/services/hydrationExecutionPolicyPreviewService.js`
- `src/main/services/hydrationBacklogPreviewService.js`
- `src/main/services/serviceRegistry.js`
- existing Hydration verifiers and service registry/authority verifiers

## Task

Add or refine a read-only preview that turns existing Hydration candidate and attention-lens data into runtime-facing posture.

Preferred command:

```txt
metadata.hydration_attention_runtime.preview
```

Acceptable alternative:

Extend `metadata.hydration_attention_lens.preview` with a clearly separated `runtime_posture` section if that is cleaner and avoids duplicate command shape.

The proof should answer:

- which visible/local IDs should remain raw for now
- which IDs already have known local labels
- which IDs are provider-needed labels for future Hydration
- which gaps are local SDE/type/geography lookup gaps, not provider-backed Hydration
- which candidates are deferred because they are Watch/background or corpus-hygiene work
- whether the current posture is view/local-record attention, target/report-scoped attention, explicit-ID attention, Watch/background, or corpus hygiene
- whether External I/O off would hold provider-needed labels without making them failure
- whether storage/setup posture would block future Hydration writes without blocking local readout
- why no provider call is authorized by selection, eligibility, or local readability need

## Required Behavior

The readout should include:

- input/lens summary
- runtime posture summary with counts for raw, known local, provider-needed, local SDE gap, and deferred
- representative items for each posture group where fixture data supports them
- stable basis for each representative item, including source anchors when available
- reason codes for the posture decision
- boundary statements that IDs remain facts and labels are readability
- boundary statements that provider-needed labels are not Evidence/EVEidence work
- boundary statements that unhydrated IDs are not report failure
- boundary statements that selected attention is not provider authorization
- explicit disclosure where a desired lane is not computable from current local rows rather than guessing

Keep the proof local, deterministic, and small. Reuse the existing Hydration candidate/attention previews where possible.

## Boundaries And Non-Goals

- Do not create a persisted Hydration queue.
- Do not create Hydration backlog state beyond existing read-only previews.
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
- Do not implement pruning, deletion, label removal, label hiding, or attention de-emphasis behavior.
- Do not treat selected Hydration attention as product truth, tactical meaning, Assessment Memory, or Dev authorization for provider movement.

## Stop Conditions

Stop and return to Overseer if:

- the proof requires provider calls
- the proof requires persisted queue/state
- the proof requires schema changes
- the implementation starts treating missing labels as Evidence gaps
- the implementation blurs Hydration with ESI Evidence Expansion
- the implementation blurs local SDE lookup gaps with provider-backed Hydration
- the implementation turns Watch/background readability into a higher priority than view/local-record readability without explicit Human/Overseer decision
- implementation requires UI work, runtime enforcement, command blocking, destructive/private/live action, or real operator data inspection

## Verification Expectations

Run syntax checks on every changed JavaScript file.

Expected focused verification:

```powershell
npm.cmd run verify:hydration-attention-lens
npm.cmd run verify:hydration-candidate-preview
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:hydration
npm.cmd run verify:metadata-status
npm.cmd run verify:metadata-lookup
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If a new verifier is added, include it in `package.json` and run it.

## Expected Handoff

Create:

```txt
workspace/DevHS218-hydration-attention-runtime-posture.md
```

Include:

- files changed
- command or preview surface used
- sample output summary
- posture groups and representative items
- how raw IDs, known-local labels, provider-needed labels, local SDE gaps, and deferred candidates are distinguished
- any lane or source basis that cannot currently be computed
- warning count from protected-term check
- verification commands and results
- confirmation that no provider calls, Hydration writes, persisted queue, schema changes, support artifacts, runtime enforcement, command blocking, UI work, Evidence/EVEidence, Discovery, Watch, Assessment Memory, Marked, pruning, or deletion behavior was added
