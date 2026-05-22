# Complete: Live API Gate UX

Status: Complete For IPC Shell Preparation

## Actionables

- Define how the UI represents live API enabled/disabled state.
- Require explicit user action before zKill/ESI live calls.
- Show estimated API calls before high-impact actions when practical.
- Block live actions when required settings are missing.
- Surface rate-limit/backoff/degraded states.
- Ensure CLI live gates and UI live gates follow the same doctrine.

## Task Requirements

The CLI currently uses explicit live gates such as `AURA_ATLAS_LIVE_API=1`.

The UI needs a product equivalent:

- network/live API enabled
- live API disabled
- action requires live API
- action is local-only
- action is blocked

## Guardrails

- No surprise live calls from passive page loads.
- Reports should not call live APIs unless explicitly requested for hydration or refresh.
- Discovery and expansion actions should show caps and scope before running.

## Completion Signal

The UI can clearly distinguish local reads from live zKill/ESI actions, and live actions are explicit, scoped, and gated.

## Current Implementation

- `live.gate` service command reports live API gate state for all known actions or one scoped action.
- Local-only actions are allowed without live API enablement.
- Live-required actions are blocked unless `AURA_ATLAS_LIVE_API=1`.
- Gate responses include estimated zKill/ESI calls where practical.
- Gate responses include UI-oriented display hints for confirmation and scope/cap display.
- Verified by `verify:live-api-gate` and `verify:service-registry`.

## Remaining Follow-On Work

- Renderer controls still need to display and enforce the gate state.
- Actual live collectors continue to enforce their own live gate checks.
- Rate-limit/backoff state should be added as live API diagnostics mature.
