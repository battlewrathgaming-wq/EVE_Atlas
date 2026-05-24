# Local Alpha Known Limits And Feedback

Date: 2026-05-22

## Purpose

Set expectations for local alpha use and keep feedback reproducible.

Atlas is ready for careful local trial, not broad public use.

## Known Limits

Atlas does not currently provide:

- passive broad ingestion
- automatic queue expansion
- evidence pruning
- accepted `Record`, `Intelligence`, or `Finding` product terminology
- pasted zKill links or killmail IDs as lead input
- first-class region investigation
- relationship graph or footprint story views
- fight-cluster timeline grouping
- public packaging or installer flow
- map rendering
- route planning UI
- AI commentary
- hosted/SaaS sync
- production retention/deletion workflow

Live APIs are explicitly gated and should be used only with narrow targets, explicit windows, and conservative caps.

Live success smoke remains a disciplined operator choice, not a default alpha requirement. Offline fixture/demo operation should be the first path.

## Accepted Rough Edges

During alpha, expect:

- local-only SQLite runtime DB
- local SDE topology and inventory required for good system/type labels
- operator-selected scopes
- partial evidence samples when expansion caps are used
- metadata labels may be incomplete until hydrated or imported
- UI is a working shell, not final product design
- support/debug trace packs are JSON artifacts, not polished reports
- assessment memory is useful but deliberately simple
- radius reports are observation/context surfaces; actor report context is the supported assessment-memory save path
- Marked means operator attention and does not start collection; Watch means active routine checking
- live smoke scripts write review artifacts under `.tmp`

## Layer Boundaries

Keep feedback tied to the correct layer:

- Evidence: expanded ESI killmails and normalized activity events
- Observation: reports over stored evidence
- Assessment: deliberate operator memory
- Support: readiness, corpus health, snapshots, trace packs, smoke artifacts
- Queue: possible evidence awaiting explicit ESI expansion

Do not report a queue preview as if it were an observation failure. It has not become evidence yet.

## Feedback Template

```text
Date/time:
Commit hash:
Atlas DB path:
Live APIs enabled: yes/no

Question being asked:

Scope used:
- actor/system/radius:
- lookback:
- caps:

Steps taken:
1.
2.
3.

Expected outcome:

Actual outcome:

Layer affected:
- evidence / observation / assessment / support / queue / UI wording

Counts observed:
- zKill calls:
- ESI calls:
- refs discovered:
- queued refs:
- killmails:
- activity events:
- assessment artifacts:

Artifacts:
- snapshot path:
- debug trace pack path:
- smoke artifact path:
- run ID/task ID:

Notes:
```

## What Good Feedback Looks Like

Good:

- "Actor report shows partial sample wording, but I expected the cited killmail IDs to be easier to find. DB path and trace pack attached."
- "Manual discovery queued one ref and made zero ESI calls as expected. The UI wording around preview fields was confusing."
- "The demo DB showed no radius observations until I loaded the correct fixture actor. I may have expected demo guidance in the app."

Less useful:

- "The app did not find anything."
- "Make the map better."
- "It should know who is hostile."
- "Add relationship graph/fight clustering/region support" without tying it to a failed current alpha step.

## Alpha Review Questions

After each trial, answer:

- Was the evidence/observation/assessment separation clear?
- Did any UI action feel like it might call live APIs unexpectedly?
- Did any report overstate certainty or completeness?
- Were IDs and labels shown where needed?
- Was it clear how to snapshot or produce a trace pack?
- Did the runbook match the actual app behavior?
