# ADR-0005: Watch_offline Readout Aggregation

Status: Accepted
Date: 2026-05-25

## Context

The Watch recovery / offline readout audit found that Atlas can already describe the post-restart Watch state without live/API calls or collection:

- configured Watch exists
- session is unarmed after restart
- no collection is active
- local context remains available
- operator can arm when ready

The remaining risk is presentation ambiguity. Renderer/UI work needs enough state to show this honestly without inferring too much from raw scheduler, executor, queue, task, and evidence services.

## Decision

Use `Watch_offline` as the specific working name for the post-restart/offline Watch readout area until a better Atlas-owned name is accepted.

Avoid `Watcher` as a class or user-facing state unless the Human explicitly approves it later as presentation-only language.

Treat `Radar` as a parked future UI/display metaphor only. It may later be evaluated by UIUX/Lab for presentation, but it is not an Atlas backend, bridge, service, payload, or state-model term.

Keep Watch recovery/readout aggregation out of the renderer where practical. Prefer a read-only Atlas service/model that composes existing Watch, queue, Evidence, and runtime gate state into derived fields for presentation.

The renderer may present and arrange the resulting model, but it should not become the authority for Watch state meaning, due/blocked interpretation, Evidence/Discovery separation, External API gate meaning, or collection activity.

## Consequences

This leaves presentation headroom for future renderer, React, UIUX, or Lab work without making the interface responsible for backend semantics.

Future `Watch_offline` work can add derived read-only fields such as:

- `time_eligible`
- `eligible_if_armed`
- `next_eligible_at`
- `collection_active`
- `state_layer` or `state_basis`
- Watch-scoped local queue/evidence counts

These fields must not start collection, call live APIs, persist `sessionArmed`, or rename existing bridge/IPC/service/payload contracts unless separately authorized.

## Alternatives Considered

- Compose all state in the renderer: parked because it gives UI too much authority over Atlas state meaning and can blur due, blocked, running, Evidence, Discovery, and External API meanings.
- Treat Watch recovery as a UX-only problem: rejected because the display needs backend-owned derived truth before presentation refinement.
- Rename the area to `Watcher`: rejected for now because it risks creating a new class/state term around Watch behavior.
- Promote `Radar` into Atlas internals now: rejected because it is a future presentation metaphor, not current project-to-bridge doctrine.

## Related Documents

- `workspace/OverseerHS54-watch-recovery-offline-readout-scope.md`
- `workspace/OverseerHS55-watch-recovery-offline-readout-audit.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `workspace/critical/critical-terms.md`
