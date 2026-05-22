# Gap To-Do: Scope Controls UI

Status: Complete
Priority: P1

## Completed

- Built UI controls from `scope.defaults`.
- Validates scope input through `scope.validate`.
- Supports actor, system, radius, manual discovery, manual expansion, actor watch, and system/radius watch scope inputs.
- Shows lookback windows, caps, radius, max systems, max refs, and max expansions before future live actions.

## Task Requirements

Scope controls are slicers and action inputs. They must map predictably to backend scope contracts.

Initial controls should cover:

- actor type and actor ID/name
- center system ID/name where supported by backend flow
- radius jumps
- evidence window/lookback
- max refs
- max systems
- max expansions
- manual expansion selected IDs or queue scope

## Guardrails

- UI controls must not silently change analytical meaning.
- Collection provenance should not become evidence scope.
- Manual discovery should default to zero ESI expansion.
- Live collection controls must expose caps before execution.
- Backend validation remains authoritative.

## Completion Signal

The renderer can build a valid backend scope payload, show validation errors, and pass normalized scope into report/discovery/watch service commands without duplicating validation logic.

## Verification

- `verify:renderer-shell`
- `verify:scope-controls`
- `verify:all`

## Related Documents

- `docs/contracts/scope-definition-contract.md`
- `docs/gap/complete/scope-controls-contract.md`
- `docs/features/ui-trigger-and-scope-map.md`
