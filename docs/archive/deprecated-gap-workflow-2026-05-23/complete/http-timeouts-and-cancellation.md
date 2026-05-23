# Complete: HTTP Timeouts And Cancellation

Status: Complete For IPC Shell Preparation
Priority: P2

## Actionables

- Add per-request timeout support to the shared HTTP client.
- Thread cancellation/abort signals from task runner into live zKill/ESI actions.
- Record timeout and cancellation warnings in a taxonomy-compatible shape.
- Ensure failed or cancelled requests do not abort entire scoped runs unless the action truly cannot continue.

## Task Requirements

The shared HTTP client retries selected status codes and now has explicit timeout and cancellation paths.

The app supports:

- request timeout
- task cancellation
- graceful cancelled task status
- clear timeout diagnostics
- preservation of already-written evidence when later refs fail

## Current Implementation

- `HttpClient` supports `timeoutMs`, `signal`, injected `fetchImpl`, and bounded `maxAttempts`.
- Request timeout produces `HTTP_TIMEOUT`.
- Abort/cancellation produces `HTTP_CANCELLED`.
- API request logs record timeout/cancellation messages.
- `TaskRunner` creates an abort signal for running tasks.
- `task.cancel` requests cancellation for a running task.
- Service task handlers pass the task abort signal into backend services.
- Live workers and metadata hydration pass task signals into `HttpClient`.
- Killmail expansion treats cancellation as a task-level abort instead of a normal per-ref failed expansion.

## Guardrails

- Cancellation does not leave a fetch run looking like a clean success.
- ESI expansion failures remain per-ref warnings when possible.
- Cancellation is not treated as an ordinary failed expansion.
- Timeouts are visible in API request logs.
- The HTTP client does not retry forever.

## Verification

- `verify:http-timeouts`
- `verify:task-runner`
- `verify:service-registry`
- `verify:message-taxonomy`

## Completion Signal

A controlled HTTP test proves a hung request times out, records a warning/error, and a running task can be cancelled into a cancelled task state.

## Related Files

- `src/main/api/httpClient.js`
- `src/main/services/taskRunner.js`
- `src/main/services/serviceRegistry.js`
- `src/main/workers/killmailIngestionWorker.js`
- `docs/gap/complete/error-warning-taxonomy.md`
- `docs/gap/complete/task-runner-and-progress.md`
