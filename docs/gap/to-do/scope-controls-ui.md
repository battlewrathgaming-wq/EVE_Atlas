# Gap To-Do: Scope Controls UI

Status: Open
Priority: P1

## Actionables

- Build UI controls from `scope.defaults`.
- Validate scope input through `scope.validate` before running reports, discovery, or watch actions.
- Support actor, system, radius, manual discovery, manual expansion, and report scope inputs where needed.
- Show lookback windows, caps, radius, max systems, max refs, and max expansions before live actions.

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

## Related Documents

- `docs/contracts/scope-definition-contract.md`
- `docs/gap/complete/scope-controls-contract.md`
- `docs/features/ui-trigger-and-scope-map.md`
