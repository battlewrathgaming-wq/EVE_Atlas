# Complete: Error And Warning Taxonomy

Status: Complete For IPC Shell Preparation

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

## Current Implementation

- Shared taxonomy module defines severity levels and categories.
- Shared message shape includes severity, code, message, category, source, and actionable.
- Readiness warnings/blockers use taxonomy messages.
- Live API gate blockers/warnings use taxonomy messages.
- Task runner warnings/errors use taxonomy messages.
- Verified by `verify:message-taxonomy`, `verify:app-readiness`, `verify:live-api-gate`, and `verify:task-runner`.

## Remaining Follow-On Work

- Legacy ingestion/data-quality warning rows still retain their existing database warning types.
- Future UI should map taxonomy severity/category to consistent presentation.
- Future worker refactors can progressively emit taxonomy codes for more warning paths.
