# OverseerHS43: Human UI Review And Face Direction

Date: 2026-05-24
Role: Overseer
Source: Human review after HS41 local UI run

## Human Review Summary

Direction accepted. The HS41 renderer pass is a clear improvement: responsive, visually stronger, and moving toward Atlas as a discovery/investigation console.

The app is not live/HTTPS. Do not treat this review as authorization to add live/HTTPS behavior.

## Accepted Feedback

- Keep moving toward a sci-fi, space, research, write-up identity for Atlas.
- Human will provide more detailed face/presentation advice after specialist training work matures.
- The next pass should refine UI placement and journey shape.
- The front page should have a prominent search bar for finding a person/entity/lead.
- Current Discovery and Watch affordances are duplicated between top-bar mode buttons and left navigation.
- External API state should be a single top-bar pill/widget area, not duplicated.
- The right External API context pane has severe text wrapping and should not dominate the main journey.
- Left pane is promising but should become a contextual/support structure rather than duplicate the top mode switch.
- Discovery actions should be the primary center action area.
- If Discovery succeeds with ESI/zKill response, Observations should slide in as the next visible surface.
- Assessment should behave like a drawer/slide-up after observations or after internal stored context is found/hydrated.
- Queue Review and Enrich are inherent process stages, not primary navigation.
- Readiness/settings/API context belong behind settings/widgets, not as the dominant first workflow.

## Pipeline Reporting Requirement

When Dev or Overseer has broad scoping questions, report them in a two-column HTML form/table shape so the Human can submit ticket-style responses.

Required shape:

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

Do not block ordinary small implementation questions on this format. Use it for broad direction, scope, or product-shaping questions.

## Deferred

- Final Atlas visual identity doctrine.
- Labs final presentation wiring.
- Live/HTTPS enablement.
- zKill paste/link backend parsing.
- True relevance scoring.
