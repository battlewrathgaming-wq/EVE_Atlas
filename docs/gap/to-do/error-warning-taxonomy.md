# TODO: Error And Warning Taxonomy

## Actionables

- Define severity levels.
- Standardize warning/error codes.
- Map backend warnings to UI presentation.
- Distinguish evidence warnings, API warnings, metadata warnings, and user-action blockers.
- Ensure warnings remain visible in reports and task history.

## Task Requirements

Current warnings include examples such as:

- cap skipped
- missing attacker character ID
- API failure
- checksum mismatch
- unresolved metadata
- live API disabled
- SDE missing

Suggested severity levels:

- info
- warning
- degraded
- error
- blocked

## Guardrails

- Missing optional character IDs should not look like fatal errors.
- Evidence integrity warnings should be prominent.
- Rate limits should be visible but not panic-inducing.
- Warnings must not be silently swallowed by the UI.

## Completion Signal

Warnings and errors have stable codes/severity and can be rendered consistently across reports, tasks, and readiness views.

