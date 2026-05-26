# AURA Atlas Current Work

Status: Active specialist advisory runway opened
Last updated: 2026-05-26

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS84 opens a UIUX / product interpretation pass for the accepted `Watch_offline` recovery readout. The goal is to translate the read-only recovery diagnostic into operator-facing status meaning before any renderer implementation or further backend machinery.

Source of intent:

- Human storage/runtime hardening direction accepted on 2026-05-25.
- Human accepted the post-HS82 next step: inspect how the `Watch_offline` recovery state should read to an operator before adding more machinery.
- `workspace/OverseerHS84-watch-recovery-readout-interpretation-runway.md`
- `workspace/OverseerHS83-hs82-watch-recovery-review.md`
- `workspace/DevHS82-watch-recovery-diagnostic-readout.md`
- `workspace/OverseerHS82-hs81-systems-advisory-review.md`
- `workspace/SystemsDesignerHS81-watch-recovery-resumable-intent-advisory.md`
- `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
- `docs/current-state/current-evidence-pipeline.md`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/services/serviceRegistry.js`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Accepted baseline:

- `Watch_offline` is a read-only support/readout model.
- `Watch_offline.watches[]` includes `recovery` and `next_safe_action`.
- Watch config is durable intent.
- Fetch/API logs are recent execution evidence.
- Discovery refs are returned zKill work awaiting ESI/cache handling.
- Evidence is completed ESI-expanded truth.
- Watch recovery readout is derived operator state.
- Timer firing means a Watch should be considered, not that provider work must start now.
- Waiting is not failure.
- Watch restart remains disarmed by default.
- Live cooldown/lockout may remain volatile for alpha.

## Executor

Current executor: UIUX / Product Interpretation specialist

Expected handoff filename:

```txt
workspace/UIUXHS84-watch-recovery-readout-interpretation.md
```

## Ordered Runway

1. Read the source of intent, critical terms, HS82/HS83 records, ADR-0005, current-state evidence pipeline, and `src/main/watchlist/watchOfflineReadout.js`.
2. Inspect the `Watch_offline` model shape and the implemented `next_safe_action` values:
   - `arm_required`
   - `wait`
   - `drain_pending_refs`
   - `ready_for_discovery`
   - `review_orphan`
   - `recover_missed_slot_when_capacity_allows`
   - `complete_enough_alpha`
3. Define a small operator-facing interpretation map:
   - primary status label
   - plain-language meaning
   - urgency/severity
   - recommended operator action
   - what detail should be hidden or placed in support/diagnostic view
4. Define how to communicate these cases:
   - pending local Discovery refs
   - due but disarmed Watch
   - not due / waiting
   - provider-capacity deferred
   - orphaned old running fetch run
   - missed timer slot recoverable
   - valid radius scope
   - missing radius scope
   - malformed radius scope
5. Identify terms to avoid or qualify so UI does not blur Watch, Discovery, Evidence, hydration, sequencer, Marked, provenance, or storage meaning.
6. Recommend the smallest future implementation packet, if any, but do not write a Dev runway.
7. Create the expected UIUXHS84 handoff artifact.

## Guardrails And Non-Goals

- Do not implement code.
- Do not edit renderer/frontend files.
- Do not change backend, bridge, IPC, payloads, persistence, schemas, commands, services, or tests.
- Do not create a Dev runway.
- Do not request live/API calls.
- Do not redesign the whole Watch UI.
- Do not import Lab presentation authority into Atlas source meaning.
- Do not rename Atlas source terms or bridge fields.
- Do not treat `Watch_offline` as a new collection mechanism.
- Do not treat waiting as failure.
- Do not blur Discovery refs with Evidence.
- Do not make hydration part of Watch recovery.

## Stop Conditions

Stop and return to Overseer/Human if:

- interpretation requires new product doctrine
- interpretation needs new user-facing terms not already accepted
- display recommendations would require backend/schema/bridge changes
- Watch and Discovery/Evidence boundaries become unclear
- UX scope expands into full redesign
- live/private/destructive actions are needed

## Required Verification

Because this is advisory only, no code verification is required unless files outside the expected artifact are changed.

If only the expected markdown artifact is created, run:

```powershell
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

## Evidence

HS84 runway opened by Overseer.

Opening evidence:

- Git was clean and synced with `origin/main`.
- HS83 accepted DevHS82.
- `Watch_offline` recovery diagnostics are implemented and verified.
- No code, schema, bridge, renderer, test, live/API, or persistence work was opened.
- HS84 is advisory and intended to shape operator interpretation before implementation.
- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 3 files.
- Warning count: 121.
- Warning classes: cross-project-borrowing 27, lab-quarantine-borrowing 73, atlas-candidate 21.
- `git diff --check` passed.

## Specialist Handoff

UIUX / Product Interpretation specialist should create:

```txt
workspace/UIUXHS84-watch-recovery-readout-interpretation.md
```
