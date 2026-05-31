# Surface Consolidation Note

Status: Advisory discovery input, not project authority

## Purpose

This note records Human follow-up on which discovery-map items should behave as actual Atlas surfaces versus widgets, embedded workflows, automatic resolver behavior, or diagnostic/state language.

This is not a final UI specification, Dev runway, Lab acceptance, or source-term rename.

## Likely Actual Surfaces / Operator Places

1. Storage widget with setup pop-out
   - Covers Storage Setup / Gate.
   - Also likely owns deletion preflight, support artifacts, snapshots, trace packs, and storage-budget posture.

2. External I/O widget
   - Covers provider contact authority.
   - Drives `held_by_external_io` as a state.

3. R-Scanner central display and setup/manage pane
   - Covers powered-down / `Watch_offline` presentation.
   - Also absorbs R-Scanner/Watch-driven Discovery leads and Queue Review.

4. Live Search surface
   - Drives immediate Discovery leads.
   - Must still preserve the rule that Discovery leads are possible leads, not Evidence/EVEidence.

5. Observation pane
   - Holds Observation / relationship pivot.
   - Includes Evidence/EVEidence tier stack.
   - Includes Assessment Memory as a drawer for entry/review anchored on the entity of interest.
   - May include pruning as review of known fields before pruning a sample.

## Not Primary Surfaces By Default

- Hydration / Refresh labels
  - Mostly an auto resolver: ID to human-readable term through local lookup/hydration first, then ESI when gated.
  - May need visible blocked/held/degraded status, but not a full primary pane by default.

- Evidence/EVEidence stack
  - Lives inside the Observation pane as a tier/basis stack.

- Assessment Memory
  - Lives inside Observation as a drawer anchored on the entity of interest.

- Discovery leads / Queue Review
  - Lives inside Live Search output and R-Scanner/manage flows.

- Pruning
  - Likely lives inside Observation as sample review and decision support.

- Deletion preflight
  - Likely lives inside the Storage widget/pop-out.

- Support artifacts / snapshots / trace packs
  - Likely live inside the Storage widget/pop-out.

## State / Diagnostic Language

- `Watch_offline`
  - State/source readout behind the R-Scanner powered-down/offline presentation.
  - It should not be treated as a user-facing primary surface name unless later accepted.

- `held_by_external_io`
  - State driven from the External I/O widget.
  - It should read as held/waiting, not failure or cancellation.

- `scope_status`
  - Unclear placement.
  - Likely diagnostic language until a clearer operator-facing form is accepted.

## Boundary Notes

- This consolidation reduces the initial ten advisory notes to roughly five primary operator places.
- The older individual files remain useful as boundary notes, but they should not be read as a one-file-equals-one-surface model.
- No Dev authorization is created here.

