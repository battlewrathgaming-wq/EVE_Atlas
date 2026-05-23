# Operator Investigation Desk

Date: 2026-05-23
Status: Active planning

## Human Intent

AURA Atlas should feel like an operator-facing investigation desk, not a database console or backend service shell.

The first question should be:

```txt
Who is that? What are they connected to? What happened? Is this worth remembering?
```

Stored data should support target development after operator interest exists. The product should lead with investigation flow, evidence boundaries, and operator attention rather than backend service inventory.

## Accepted Direction

Use this user-facing state model:

```txt
Marked = operator interest / tag / record attention.
Watch = active routine check behavior.
Watch implies Marked.
Marked does not imply Watch.
```

Blocked/unblocked are user-facing watch status labels. They describe whether an active routine check can run now; they are not evidence conclusions.

## Product Path

The major operator path is:

```txt
Discovery -> Evidence -> Observation -> Assessment
```

The product as a whole supports intelligence work, but Atlas should continue using the lowest precise layer that fits:

- Discovery: a lead or first sighting, not proof
- Evidence: authoritative expanded ESI killmail data
- Observation: rendered patterns from stored evidence
- Assessment: deliberate operator memory or judgment

Do not introduce `Intelligence` as a stored work-product label until Human accepts the term.

## First Runnable Slice

Build the first useful Investigation Desk screen without replacing the proven service shell underneath.

The first slice should:

- open to an investigation-oriented view instead of Readiness
- provide one primary lead input for actor or system/radius investigation
- show global live/API state without requiring live APIs
- surface Marked/Watch distinction in user-facing copy
- route to existing safe offline/demo fixture paths where possible
- present discovery as possible leads, not evidence
- present ESI expansion as explicit evidence creation
- move raw IDs, backend payloads, task internals, and queue/service details into secondary detail areas
- preserve access to existing readiness, task, queue/watch, actions, and reports surfaces

## First Slice Non-Goals

Do not build in the first slice:

- passive collection
- automatic enrichment or expansion
- automatic assessment or intelligence creation
- evidence deletion/pruning
- broad dashboard analytics
- AI commentary
- map rendering
- full region support
- final Record drawer semantics
- final Intelligence/Finding naming

## Label Decisions For First Slice

Accepted:

- Use Mark/Marked for operator attention.
- Use Watch/Watched only for active routine checking.
- Use blocked/unblocked as user-facing watch run-state labels.

Provisional for first slice:

- Use `Enrich selected` as the main operator-facing action label only when paired with explicit detail that it performs ESI expansion and creates stored killmail evidence.
- Continue using Assessment / Assessment Memory for deliberate saved operator memory.
- Avoid `Record`, `Intelligence`, and `Finding` as durable product terms until Human accepts them.
- Keep region entry deferred behind current system/radius machinery.
- Use chronological battle timeline first; fight clustering can come later.
- Keep relationship view and system/radius footprint as adjacent story surfaces, not one merged model, until evidence wording is proven.
- Optimize first workflow for local-alpha onboarding clarity over expert speed.

## Acceptance Checks

The first Dev slice should be accepted only if:

- the app opens to an investigation-oriented first screen
- passive startup does not call live APIs or mutate evidence
- Marking, if present, does not start collection, discovery, enrichment, hydration, or evidence mutation
- Watch language appears only for active routine check configuration/status
- Discovery results are visibly possible leads / not evidence
- Enrich/ESI expansion preflight states expected provider, calls, writes, scope, caps, and evidence effect
- metadata hydration remains readability-only and is not called evidence enrichment
- story/report surfaces derive from stored evidence and avoid proof language
- assessment save remains deliberate and requires reviewed context
- raw IDs, normalized JSON, queue internals, and task/service detail are available without dominating the primary path
- `npm.cmd run verify:all` passes
- Electron smoke is updated if the startup screen or primary renderer flow changes

## Human Decisions Still Open

These should return to Human before broad UI build-out:

- Should the persistent container be called `Record`?
- Should final reviewed output be called Intelligence, Finding, Assessment, or Assessment Memory?
- Should pasted zKill links / killmail IDs be accepted in the first UX pass?
- Should region become first-class soon, or remain deferred behind system/radius?
- Should battle timelines stay chronological or group into fight clusters?
- Should relationship and footprint views become one combined view or remain adjacent?
- When should the workflow pivot from local-alpha onboarding clarity to expert speed?

## Relationship To Operator UI Workflow Polish

`docs/roadmap/operator-ui-workflow-polish.md` remains historical/planned context for polishing existing surfaces.

This roadmap supersedes it as the active milestone meaning for the next product direction.
