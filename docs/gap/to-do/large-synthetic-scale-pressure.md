# Large Synthetic Scale Pressure

## Mission

Create larger local synthetic corpora to find performance, memory, and report/query-plan issues before real use produces them.

This should guide whether process isolation, indexes, pagination, or report chunking becomes necessary.

## Task Requirements

- Add configurable synthetic corpus generation:
  - 1,000 killmails
  - 10,000 activity events
  - 1,000 queued refs
  - many actor/system watches
  - unresolved and partially hydrated labels
  - warnings and failed refs
- Measure:
  - actor report time
  - corporation report time
  - radius report time
  - queue report time
  - corpus health time
  - metadata status time
  - renderer load time if included
- Record thresholds and actual timings in output JSON.
- Confirm query plans use intended indexes for common report scopes.
- Keep generated DBs under `.tmp`.

## Suggested Verification

Extend `verify:local-scale-smoke` or add:

```txt
npm.cmd run verify:large-scale-smoke
```

## Acceptance Criteria

- Performance thresholds are explicit.
- Any threshold failure creates clear next-step guidance.
- Process isolation remains evidence-driven, not speculative.
- Reports remain scoped and do not load broad corpora unnecessarily.

