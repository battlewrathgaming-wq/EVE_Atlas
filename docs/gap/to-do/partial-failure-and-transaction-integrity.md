# Partial Failure And Transaction Integrity

## Mission

Prove that Atlas fails safely when collection, expansion, hydration, import, or persistence is interrupted.

Successful behavior means evidence remains valid, locks release, queue state is reviewable, and the operator can retry without hidden corruption.

## Task Requirements

- Simulate failures inside each critical stage:
  - zKill discovery after some refs are returned
  - ESI expansion after one successful killmail and one failed ref
  - killmail persistence after raw evidence insert but before activity events
  - activity event persistence after partial normalized output
  - metadata hydration after partial name resolution
  - SDE lookup build after topology import but before inventory import
- Verify transactions either fully commit the intended unit or leave explicit reviewable partial state.
- Verify retry behavior:
  - cached killmails are skipped
  - pending refs remain pending
  - failed refs remain explainable
  - duplicate activity events are not created
- Verify `fetch_runs`, warnings, and audit rows reflect the failure clearly.

## Suggested Verification

Add a script such as:

```txt
npm.cmd run verify:partial-failures
```

Use injected fake clients/repositories where possible rather than live APIs.

## Acceptance Criteria

- Simulated failures do not mutate existing raw evidence.
- Failed tasks release locks.
- Reruns are idempotent or explicitly report why they cannot continue.
- Corpus health surfaces the resulting warning/failure state.

