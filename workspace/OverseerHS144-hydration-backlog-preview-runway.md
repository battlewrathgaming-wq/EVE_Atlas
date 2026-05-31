# OverseerHS144 - Hydration Backlog Preview Runway

Status: active Dev runway
Date: 2026-05-31
Role: Overseer

## Source Of Intent

- Human direction: better understanding our data.
- `docs/contracts/metadata-hydration-contract.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `workspace/SystemsAuditHS101-local-lookup-vs-esi-enrichment.md`
- accepted HS142 External I/O held-state proof

## Decision

Open a bounded Dev packet for a read-only Hydration backlog preview.

The packet should help Atlas understand missing readability metadata from local records without creating a queue, calling providers, writing hydration output, or changing schema.

## Scope

Dev should add a read-only service/readout and verifier that previews hydration need from existing local tables.

The preview should focus on known local facts and missing labels:

- `activity_events` character/corporation/alliance IDs with missing labels
- `entities` known/unknown labels and `last_enriched_at`
- local SDE/type metadata gaps where relevant
- recent `metadata_runs` as context, not authority
- Watch-originated/local-report/view-originated grouping where computable

## Required Behavior

- Report missing label candidates without calling ESI.
- Distinguish locally known labels from provider-needed labels.
- Distinguish Evidence/EVEidence facts from readability metadata.
- Distinguish Hydration from Evidence creation and Discovery.
- Classify candidate lanes at least as:
  - view/local-record hydration
  - Watch/background hydration
  - target/Marked or report-scoped hydration if computable
  - corpus hygiene / low-priority backlog
- Include counts and representative IDs, capped for preview safety.
- Show basis/freshness where possible:
  - missing label
  - stale or never enriched
  - known locally
  - local SDE gap
  - recent metadata run context
- Keep External I/O posture visible: provider-backed hydration would be held when External I/O is off.
- Keep waiting/backlog normal, not failure.
- Keep the proof read-only.

## Non-Goals

- No hydration writes.
- No ESI calls.
- No zKill calls.
- No SDE download/import.
- No provider/API calls.
- No runtime enforcement.
- No queue/sequencer implementation.
- No persisted backlog table.
- No schema changes.
- No Evidence/EVEidence writes.
- No Discovery ref mutation.
- No renderer/UI work.
- No pruning/deletion execution.

## Expected Handoff

```text
workspace/DevHS144-hydration-backlog-preview.md
```

The handoff must include:

- files changed
- readout command added/refined
- sample preview output
- lane/grouping behavior
- how missing/known/stale labels are represented
- confirmation that Evidence/Discovery/Hydration boundaries remain intact
- verification commands and results
- confirmation that no provider calls or hydration writes occurred

## Required Verification

Run focused checks relevant to changed files:

```powershell
npm.cmd run verify:hydration
npm.cmd run verify:metadata-status
npm.cmd run verify:metadata-lookup
npm.cmd run verify:actor-metadata
npm.cmd run verify:corporation-metadata
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Run `node --check` on any new or changed JavaScript files.

## Stop Conditions

Stop and return to Overseer/Human if:

- preview requires ESI/provider calls
- preview requires writing entities, metadata runs, activity event labels, or hydration output
- preview requires schema changes or persisted backlog state
- preview blurs Hydration with Evidence/EVEidence creation
- preview treats Discovery refs as Evidence
- preview turns missing labels into report failure
- preview requires UI wording or renderer design
- preview requires pruning/deletion behavior
