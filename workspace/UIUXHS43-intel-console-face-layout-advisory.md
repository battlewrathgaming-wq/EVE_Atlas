# UIUXHS43: Intel Console Face And Layout Advisory

Date: 2026-05-24
Role: UI/UX Specialist
Status: Advisory - for Human and Overseer use

## Request Received

The Human asked for UI/UX input to help Overseer with the current HS43 Dev work:

```txt
Current Dev HS43: finish the immediate layout/search/External API/Observation/Assessment refinement.
Overseer Atlas could do with your help.
Review current.
Do not rush the response. Take time to research and consider.
```

This advisory reviews the current HS43 packet and renderer state. It does not implement code, change `workspace/current.md`, broaden product scope, or issue Dev instructions directly.

## Review Take

The current HS43 sequence is right: finish the immediate renderer face/layout refinement before opening broader UX, Labs presentation, or product-direction work.

HS43 should remain focused on making HS41 feel like the intended object:

```txt
enter a lead
-> begin Discovery
-> review possible leads
-> enrich explicitly
-> reveal Observation from grounded evidence/report context
-> open Assessment Memory only when eligible
```

This is a presentation refinement over existing Atlas services, not a new backend capability packet.

## Key Findings

1. HS43 is correctly scoped, but needs strict priority inside the packet.

The active runway already names the right targets: search-first Discovery, no duplicated Discovery/Watch controls, compact External API, and progressive Observation/Assessment. Do not add more goals.

2. There is a coordination mismatch to clean up.

`workspace/overview.md` still identifies the active milestone/sequence as HS41-era Renderer Intel Console Progressive Disclosure, while `workspace/current.md` has advanced to HS43 Intel Console Face And Layout Refinement. This is not a Dev blocker, but Overseer should update it so future agents do not drift.

3. The duplication problem is real in current renderer structure.

The left nav still contains `Discovery Console` and `Watch Console`, while the top mode switch also contains `Discovery` and `Watch`. HS43 should resolve this before further polish.

4. External API is duplicated in perceptual weight.

External API appears as a top pill, as service-state text, and as a right-side context panel. The top pill should remain the primary state. Detailed provider/readiness context should move behind Settings/Diagnostics or a compact detail affordance.

5. The search area is still a form, not yet the face.

The current lead entry works functionally, but it still reads like setup. HS43 should make the lead/search bar visually dominant, with Pilot/System/Corp/Alliance controls as supporting intent selectors.

## Recommended HS43 Order

1. Fix the face first.

Make the first viewport answer:

```txt
Who or where are we investigating?
```

Use a large lead/search bar, centered in Discovery, with `Discover Possible Leads` as the main action area. Keep Check Lead, Stored Context, Queue Review, and Observation as secondary stage actions.

2. Remove Discovery/Watch duplication.

Keep top-bar `Discovery` and `Watch` as the primary modes.

Convert the left pane into contextual/support structure rather than a duplicate mode switch. It can hold current lead state, stored context, observation/assessment availability, task/settings routes, or compact support links.

3. Collapse External API into one top-bar widget.

Keep one `External API` pill/widget. Move detailed zKill/ESI/readiness text behind a detail popover, drawer, or Settings/Diagnostics. Provider truth should stay visible, but not dominate the journey.

4. Make Queue Review / Enrich visibly staged, not navigational.

`Queue Review -> Enrich` is acceptable as staged process copy, but it should feel like the next tray/panel inside Discovery rather than a separate app section.

5. Make Observation and Assessment progressive.

Observation should appear after stored evidence/report context or enrichment success, not merely after zKill Discovery.

Assessment should slide up or draw out only when actor evidence context or existing internal memory supports it.

Radius context should remain context-only unless a later packet changes that.

6. Polish only after hierarchy is fixed.

Keep the sci-fi teal/green/shadow-glass direction, but spend the polish budget on hierarchy, spacing, wrapping, responsive behavior, and research-console clarity. Avoid decorative expansion until the workflow is cleaner.

## Boundary Note

Discovery success from zKill alone should reveal possible leads / Queue Review, not Observation.

Observation is evidence/report-backed. Assessment is deliberate memory and should not appear as ready unless stored context or actor report eligibility exists.

This keeps the interface exciting without breaking Atlas doctrine.

## Overseer Notes

- Do not broaden HS43 into zKill paste/link parsing.
- Do not solve final Labs presentation doctrine here.
- Do not rename Atlas terms broadly.
- Do update smoke/static checks for whichever labels become the new visible truth.
- Consider asking Dev to include screenshot-based handoff notes: first viewport, after lead entry, after stored context, and Watch mode.

## Broad Questions

Use this only for broad Human direction, not small implementation choices already answered by HS43.

```html
<form>
  <table>
    <tr>
      <th>Question</th>
      <th>Human answer / ticket note</th>
    </tr>
    <tr>
      <td>Should the left pane become mostly contextual status/actions rather than navigation?</td>
      <td></td>
    </tr>
    <tr>
      <td>Should Assessment be a bottom slide-up drawer specifically, or is a right-side drawer acceptable?</td>
      <td></td>
    </tr>
    <tr>
      <td>Should Top 5 relevant records remain as accepted wording for now, despite relevance ranking not being implemented?</td>
      <td></td>
    </tr>
  </table>
</form>
```

## Files Reviewed

- `AGENTS.md`
- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/current.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `F:\Projects\Docs\Aura-Project-Orchestration\terminology\TerminologyAuthorityRuleset-2026-05-24.md`
- `F:\Projects\Docs\Aura-Project-Orchestration\profiles\AURA-Atlas\ui-ux-specialist.md`
- `workspace/OverseerHS43-human-ui-review-face-direction.md`
- `workspace/OverseerHS42-renderer-intel-console-review.md`
- `workspace/DevHS41-renderer-intel-console-progressive-disclosure.md`
- `workspace/OverseerHS38-intel-console-human-decisions.md`
- `workspace/OverseerHS38A-presentation-authority-note.md`
- `workspace/UIUXHS36-operator-intel-console-presentation-spec.md`
- `docs/features/presentation-layer-information-index.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `src/renderer/index.html`
- `src/renderer/styles.css`
- `src/renderer/app.js`
- `src/renderer/investigation.js`
- `src/main/main.js`
- `scripts/verify-renderer-shell.js`

## Verification

No code verification was required for this advisory-only UI/UX review.

Status check run:

```powershell
git status --short --branch
```

Observed before writing this artifact:

```txt
## main...origin/main
```
