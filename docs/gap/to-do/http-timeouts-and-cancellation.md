# Gap To-Do: HTTP Timeouts And Cancellation

Status: Open
Priority: P2

## Actionables

- Add per-request timeout support to the shared HTTP client.
- Thread cancellation/abort signals from task runner into live zKill/ESI actions.
- Record timeout and cancellation warnings in a taxonomy-compatible shape.
- Ensure failed or cancelled requests do not abort entire scoped runs unless the action truly cannot continue.

## Task Requirements

The shared HTTP client retries some status codes, but live fetches currently have no explicit timeout or cancellation path.

The app should support:

- request timeout
- task cancellation
- graceful partial task status
- clear timeout diagnostics
- preservation of already-written evidence when later refs fail

## Guardrails

- Cancellation must not leave a fetch run looking like a clean success.
- ESI expansion failures should remain per-ref warnings when possible.
- Timeouts should be visible in run diagnostics and task history.
- Do not retry forever.

## Completion Signal

A fake or controlled HTTP test proves a hung/slow request times out, records a warning/error, and lets the task finish as failed/partial/cancelled according to the task contract.

## Related Files

- `src/main/api/httpClient.js`
- `src/main/services/taskRunner.js`
- `src/main/workers/killmailIngestionWorker.js`
- `docs/gap/complete/error-warning-taxonomy.md`
- `docs/gap/complete/task-runner-and-progress.md`
