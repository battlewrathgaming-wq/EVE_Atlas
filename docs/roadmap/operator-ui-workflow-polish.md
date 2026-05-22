# Operator UI Workflow Polish

Date: 2026-05-22

## Purpose

Move from a proven backend/service shell into a more usable operator workstation without weakening Atlas evidence boundaries.

This is not a dashboard expansion milestone. It is a workflow polish milestone: make existing safe actions easier to review, trigger, and understand through the Electron shell.

## Starting Point

Atlas now has:

- service-boundary renderer shell
- controlled manual discovery and expansion
- actor and radius report presentation
- watch authoring and session-armed execution
- assessment artifact creation/review
- corpus health and runtime snapshot surfaces
- operator workflow scenario smoke
- bounded operator debug trace pack

The next work should improve how an operator moves through those existing capabilities.

## Candidate Outcomes

This milestone should leave Atlas with:

- renderer-visible operator debug trace pack generation
- clearer assessment creation/review affordances from report context
- documented live target discipline for future positive-ref scoped discovery-only smokes
- cleaner UI wording for support/debug artifacts versus evidence/observation/assessment
- no passive live collection
- no automatic evidence expansion from queue previews
- no evidence pruning

## Non-Goals

Do not build:

- broad dashboard analytics
- map rendering
- AI commentary
- automatic background collection on app open
- evidence deletion or pruning
- passive positive-ref live testing without an explicit target/window

## Suggested Order

1. Renderer trace pack action.
2. Assessment artifact ergonomics pass.
3. Live target discipline checklist.
4. Positive-ref scoped discovery-only smoke when a suitable target/window is known.

## Doctrine

The UI remains a presentation and control layer over stored evidence and explicit backend services.

Trace packs are support artifacts.
Assessments are deliberate memory.
Queue refs are possible evidence.
Observation reports are scoped presentations of expanded ESI killmail evidence.
