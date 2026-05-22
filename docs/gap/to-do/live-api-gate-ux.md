# TODO: Live API Gate UX

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

