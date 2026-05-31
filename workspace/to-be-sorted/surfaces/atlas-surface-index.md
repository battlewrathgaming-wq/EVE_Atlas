# Atlas Surface Index

Status: Advisory discovery input, not project authority

## Purpose

This index identifies highest-value Atlas surfaces for future UIUX, Lab, and display-request work. It describes what the operator needs to understand at each surface without designing final UI, authorizing Dev work, or accepting Lab recommendations.

## Human Surface Consolidation

Human follow-up clarified that the initial discovery notes should not all be treated as standalone surfaces. The likely product shape is fewer operator places, with several former entries acting as widgets, embedded panes, automatic resolvers, or state language.

See `surface-consolidation-note.md`.

## Primary Surfaces / Places

| Surface | File | Primary operator question | request_display candidate |
| --- | --- | --- | --- |
| Storage widget and setup pop-out | `storage-setup-gate.md` | Can Atlas safely use this storage location, budget, snapshots, trace packs, and deletion preflight? | yes |
| External I/O widget | `external-io-provider-gate.md` | Is Atlas allowed to contact external providers right now? | yes |
| R-Scanner central display and setup/manage pane | `r-scanner-powered-down.md` | Do I need to do anything before patient discovery can move? | yes |
| Live Search surface | `discovery-leads-queue-review.md` | What immediate search produced possible leads, and what is still not Evidence? | parked |
| Observation pane | `observation-relationship-pivot.md` | What story can Atlas assemble from connected local records, Evidence, and Assessment? | yes |

## Embedded Areas / State Language

| Item | Placement | Surface status |
| --- | --- | --- |
| Discovery leads / Queue Review | R-Scanner/manage pane and Live Search output | Embedded area, not standalone primary surface |
| Hydration / Refresh labels | Mostly automatic resolver using local lookup, then ESI when gated | Resolver behavior/state, not primary surface |
| Evidence/EVEidence stack | Observation pane tier stack | Embedded tier, not standalone primary surface |
| Assessment Memory | Observation pane tier stack, with pop-up drawer for entry/review anchored on entity of interest | Embedded drawer |
| Pruning | Likely Observation pane, reviewing known fields before pruning a sample | Embedded workflow |
| Deletion preflight | Storage widget/pop-out | Embedded workflow |
| Support artifacts / snapshots / trace packs | Storage widget/pop-out | Embedded support detail |
| `Watch_offline` | R-Scanner powered-down/offline state | State/source readout behind R-Scanner |
| `held_by_external_io` | External I/O widget-driven state | State, not surface |
| `scope_status` | Still unresolved | Diagnostic language needing further review |

## Highest-Value Future Display Request Candidates

1. Storage Setup / Gate
   - Strongest near-term operator trust surface as widget plus pop-out.
   - Must make explicit storage, missing storage, fallback acknowledgement, disk budget, support artifacts, and deletion preflight understandable.

2. External I/O / Provider Gate
   - Needed as a compact widget before provider-backed clocks become explainable.
   - Must separate provider contact authority from Watch arming, live gate, storage safety, and cadence.

3. R-Scanner powered-down / Watch_offline recovery
   - Central display and setup/manage pane.
   - Should absorb Watch/R-Scanner-driven Discovery leads and answer "Do I need to do anything?" without implying live surveillance while disarmed/offline.

4. Observation pane
   - Holds Observation / relationship pivot / Evidence tier / Assessment Memory tier.
   - Needs strong source-basis presentation so story does not become proof beyond stored Evidence/EVEidence.

5. Live Search
   - Drives immediate Discovery leads alongside R-Scanner/Watch.
   - Must keep possible leads separate from Evidence/EVEidence.

6. Hydration status, if surfaced
   - Not a primary surface by default.
   - Should mostly behave as an auto resolver: ID to human term through local hydration first, then ESI when gated.

## Surfaces Needing Human Discussion

- Storage setup wording: how direct should Atlas be when blocking real/alpha collection until storage is explicit?
- External I/O label: whether the durable user-facing phrase remains `External API`, becomes `external_io`-derived language, or is Lab-translated later.
- Observation naming: how to present "story" without implying hidden inference, proof, or assessment.
- Hydration language: whether "Refresh labels" remains visible, or whether most label repair stays automatic except when blocked/held.
- Assessment Memory visibility: how prominent saved judgment should be when its citations are stale, deleted, or outside the current local record.
- Pruning posture: whether pruning belongs inside the Observation pane as sample review, while deletion preflight belongs in the storage widget.
- `scope_status`: whether it remains diagnostic detail only or needs a clearer operator-facing placement.

## Boundary Risks Discovered

- zKill preview can look like Evidence if placed too close to Observation output.
- Missing labels can look like missing facts unless raw IDs and label freshness are visible at the right depth.
- Event-time corporation/alliance context can be mistaken for current membership.
- `Watch_offline` and R-Scanner can imply background scanning if powered-down/disarmed state is not explicit.
- `held_by_external_io` can be mistaken for failure, cancellation, or release permission.
- Storage budget can be mistaken for provider/API request budget.
- Assessment Memory can be overread as proof or automatic intelligence.
- Support snapshots can be mistaken for active Evidence retention or deletion footprint.

## Items Parked

- Final UI specification.
- Dev runway or implementation task list.
- Lab display-request submission.
- Renaming Atlas source terms.
- Adoption of Lab presentation language.
- Storage enforcement design.
- External I/O implementation.
- Hydration backlog persistence.
- Relationship graph workspace design.
- Pruning or deletion execution.
- Snapshot/support-artifact cleanup workflows.
- Final count and naming of primary panes/widgets.

## No Dev Authorization

No Dev authorization is created by this index or by any surface file in this folder.
