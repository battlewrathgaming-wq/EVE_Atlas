# AURA Atlas Current Work

Status: Active - Dev runway
Last updated: 2026-05-24

## Active Milestone

Milestone: Intel Console Face And Layout Refinement

Source of intent:

- Human HS41 UI review captured in `workspace/OverseerHS43-human-ui-review-face-direction.md`.
- UI/UX priority advisory in `workspace/UIUXHS43-intel-console-face-layout-advisory.md`.
- HS41 acceptance in `workspace/OverseerHS42-renderer-intel-console-review.md`.
- `workspace/DevHS41-renderer-intel-console-progressive-disclosure.md`
- Human Intel Console decisions recorded in `workspace/OverseerHS38-intel-console-human-decisions.md`.
- Presentation authority note in `workspace/OverseerHS38A-presentation-authority-note.md`.
- `workspace/UIUXHS36-operator-intel-console-presentation-spec.md`
- `docs/audits/audit-2026-05-24-local-alpha-human-ui-trial.md`
- `docs/features/presentation-layer-information-index.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Current focus: refine the HS41 renderer into a clearer Atlas face and layout: prominent search-first Discovery, no duplicate Discovery/Watch controls, compact External API state, and progressive Observation/Assessment surfaces.

## Executor

Current executor: Dev.

Expected DevHS filename:

```txt
DevHS43-intel-console-face-layout-refinement.md
```

## Purpose

Make the first Atlas screen feel more like a discovery, research, and story console while preserving the backend/bridge authority already hardened.

This is a renderer presentation/layout packet only. It is not final Labs presentation doctrine.

## Accepted Human Review Notes

- HS41 direction is good and responsive.
- Atlas is not live/HTTPS; do not add live/HTTPS behavior.
- UI placement needs refinement.
- The front page should have a prominent search bar for finding a person/entity/lead.
- Discovery and Watch are currently duplicated between top mode switch and left nav.
- External API appears duplicated and the context pane wraps badly.
- Left pane is useful but should support the journey rather than repeat top modes.
- Discovery actions should be the center action area.
- If Discovery succeeds with ESI/zKill response, Observations should slide in as the next visible surface.
- Assessment should behave like a drawer/slide-up after observations or after internal stored context is found/hydrated.
- Queue Review and Enrich are inherent staged processes, not primary navigation.
- Readiness/settings/API details belong behind settings/widgets rather than dominating the workflow.
- Future face direction should lean sci-fi, space, research, and write-up, with more Human detail expected later.

Accepted UI/UX advisory emphasis:

- Keep HS43 focused; do not add more goals.
- First viewport should answer: "Who or where are we investigating?"
- Discovery success from zKill alone should reveal possible leads / Queue Review, not Observation.
- Observation is evidence/report-backed.
- Assessment is deliberate memory and should only become ready when stored context or actor report eligibility supports it.
- Fix hierarchy before decorative polish.
- Dev should include screenshot-based handoff notes if practical: first viewport, after lead entry, after stored context, and Watch mode.

## Ordered Dev Runway

1. Read the source-of-intent files above, especially `workspace/OverseerHS43-human-ui-review-face-direction.md`, and inspect current renderer layout before editing.
2. Remove top/left duplication:
   - keep `Discovery` and `Watch` as the primary top-bar mode controls
   - make the left pane contextual/supporting rather than a second copy of the same mode switch
   - keep access to Observation/Assessment, Discovery Actions, Scope Detail, Task History, and Settings/Diagnostics without making them compete with primary modes
3. Add a prominent search-first Discovery entry:
   - front screen should lead with a large operator search/input bar
   - support current lead concepts: Pilot, System, Corp, Alliance
   - preserve existing resolver/service paths
   - do not add zKill paste/link parsing unless it can be represented as deferred/unsupported without backend changes
4. Compact provider state:
   - show one clear `External API` pill/widget area in the top bar
   - remove or demote duplicate External API state
   - fix the right-side External API context wrapping/overflow
   - move detailed provider/readiness copy behind Settings/Diagnostics or a compact detail surface
5. Reframe the Discovery journey:
   - center Discovery actions as the main action area
   - keep Queue Review -> Enrich as staged process steps, not navigation destinations
   - if existing renderer state has discovered/queued/enriched/stored context, progressively reveal the next relevant area instead of showing all technical surfaces at once
6. Add or improve progressive Observation/Assessment surfaces:
   - Observation should slide in or become visibly available after successful discovery/stored context/report data exists
   - Assessment should be a drawer/slide-up style surface after Observations or internal stored context is available
   - preserve the evidence/observation/assessment boundary and do not infer unsupported meaning
7. Apply face/layout polish:
   - keep sci-fi teal/green/shadow-glass direction
   - improve spacing, text wrapping, responsive behavior, and visual hierarchy where touched
   - avoid decorative overbuild; prioritize research-console clarity
8. Update static/smoke checks only for changed renderer expectations.
9. Update Evidence / Dev Handoff below and create the expected DevHS file.

## Guardrails

- Renderer presentation/layout only.
- Do not change backend provider behavior, service contracts, database schema, IPC command names, migrations, persistence semantics, live behavior, evidence semantics, assessment semantics, watch semantics, or retention semantics.
- Do not add live/HTTPS behavior.
- Do not weaken HS39 command authority.
- Do not make Readiness, Scopes, Queue internals, task history, or provider diagnostics the primary operator journey.
- Do not introduce `Radar`, `Record`, `Intelligence`, or `Finding` as active product terms.
- Do not treat the protected-term sniff output as authority or a rename mandate.
- Do not import Lab presentation authority into Atlas internals.
- Do not fake relevance, evidence, observations, assessment, live state, or successful discovery.
- Preserve Marked vs Watch asymmetry and Discovery -> Evidence -> Observation -> Assessment boundaries.

## Stop Conditions

Return to Overseer/Human before continuing if:

- a requested layout requires backend/service/parser behavior
- zKill paste/link support cannot be represented honestly without new backend behavior
- live/HTTPS/provider enablement seems required
- Observation/Assessment progressive reveal would require new evidence/assessment semantics
- External API presentation cannot stay honest about current gates/refusals
- responsive layout cannot avoid severe text overlap/wrapping in the available renderer structure

## Required Verification

Run:

```powershell
npm.cmd run verify:renderer-shell
npm.cmd run verify:command-authority
npm.cmd run smoke:electron
npm.cmd run verify:protected-terms -- --max-warnings 20
git status --short --branch
```

If Dev changes broad evidence/report/live-gate copy or touches shared service-facing assumptions, also run:

```powershell
npm.cmd run verify:all
```

Do not run live smoke unless explicitly authorized by the Human.

## Broad Scoping Questions Format

If Dev has broad scoping/product questions, include them in the DevHS using this two-column HTML form/table shape:

```html
<form>
  <table>
    <tr>
      <th>Question</th>
      <th>Human answer / ticket note</th>
    </tr>
    <tr>
      <td>Question text</td>
      <td></td>
    </tr>
  </table>
</form>
```

Use this for broad direction only; do not block small implementation choices that are already answered by this packet.

## Evidence

Dev updates this before handoff:

```txt
Files changed:
Layout/presentation changes:
Search-first Discovery behavior:
Duplicate controls removed/demoted:
External API placement/wrapping changes:
Observation/Assessment progressive behavior:
Safety boundaries preserved:
Deferred/unsupported items:
Verification run:
```

## Dev Handoff

Dev creates:

```txt
workspace/DevHS43-intel-console-face-layout-refinement.md
```

Handoff must include:

- completed layout/face changes
- how the search-first Discovery entry works
- how Discovery/Watch duplication was resolved
- how External API state is represented and where detailed API context moved
- how Observation and Assessment surfaces progressively appear
- confirmation that backend/bridge/live/evidence/watch/assessment semantics were not changed
- verification results
- any broad scoping questions in the required two-column HTML form/table shape
