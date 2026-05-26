# R-Scanner And Sequencer Presentation

Date: 2026-05-27
Status: Product direction and prototype summary

## Purpose

Define the accepted presentation intent for R-Scanner and Sequencer states without turning that presentation into Atlas source or bridge authority.

This document is not a backend contract, renderer specification, or implementation packet.

## Source Boundary

- Atlas source/internal term remains Watch.
- Atlas bridge/readout model remains `Watch_offline`.
- R-Scanner is presentation language.
- R-scan is short interaction/presentation language.
- R-Scanner/R-scan must not rename backend, service, IPC, payload, schema, scheduler, or source meanings.

## Operator Question

R-Scanner should primarily answer:

```txt
Do I need to do anything?
```

If no action is needed:

- show calm progress
- show light state text
- avoid diagnostic overload
- allow the system to work in the background

If operator action is needed:

- surface a light inbox/row item
- use the shape `[Situation] [brief insight] [needed action]`
- provide diagnostic detail at point of need

## Patient Discovery Direction

R-Scanner / Sequencer is not intended as instant search presentation.

It is a patient discovery and enrichment engine that can build data sets over time. Large jobs may take minutes if Atlas is honest about scheduling, provider waiting, enrichment progress, completed work, and operator-needed action.

## Accepted State Language

Discussion-only presentation mapping accepted as direction:

- Disarmed: ready to work, but needs preflight such as External API/network gate or storage path.
- Waiting: ready to scan or safely holding.
- Pending input/activity: activity detected.
- Missed Watch slot: recovery pending or recovery complete, with a diagnostic row if needed.
- Orphan review: diagnostic inbox/row catchment, not first-screen panic.
- Queued: scheduled.
- Provider wait: ESI callback pending.
- Paused: R-scan on hold, with reason if known.
- Caught up/resumed: affirmative state showing nothing is needed from the operator.

## HS93 Prototype Status

HS93 added a lightweight renderer-only R-Scanner prototype to the existing Queue / Watch view.

Accepted qualities:

- consumes `watch.offline_readout`
- uses static powered-down scanner face
- does not imply active scanning, background surveillance, live coverage, provider calls, Evidence/EVEidence writes, Discovery mutation, hydration, or Watch execution
- maps disarmed/offline, pending Discovery refs, provider wait, missed-slot recovery, orphan review, and radius scope limits into operator-facing labels
- remains replaceable for the later facelift

## Spatial Guidance Workflow

Atlas may use the emerging Human/agent two-way spatial guidance workflow to communicate UI relationships, layout roles, and surface grouping to Lab/UIUX.

That workflow is presentation guidance only. It does not change Atlas source meanings, bridge meanings, service contracts, payloads, persistence, or final adoption authority.

## Non-Goals

- No final facelift is accepted here.
- No animation requirement is accepted here.
- No provider behavior changes are accepted here.
- No Watch/Discovery/Evidence/EVEidence/Hydration boundary changes are accepted here.
- No Lab presentation term becomes Atlas source authority from this document.
