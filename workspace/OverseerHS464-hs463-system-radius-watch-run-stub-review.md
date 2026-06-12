# OverseerHS464 - HS463 System/Radius Watch-Run Stub Review

Status: accepted  
Date: 2026-06-12  
Reviewed handoff: `workspace/DevHS463-system-radius-watch-run-stub-projection.md`

## Review Result

HS463 is accepted.

The new read-only command:

```txt
watch.system_radius_run_stub.preview
```

proves that system/radius Watch can express exactly one eligible due run as a bounded `watch_run_stub` from accepted stored `included_system_ids`.

## Accepted Result

The proof establishes:

- accepted stored `included_system_ids` are the execution authority
- center/radius remain provenance and explanation only after acceptance
- one eligible due system/radius Watch emits one deterministic fixture stub
- invalid stored scope emits no valid stub
- parseable IDs inside invalid scope remain diagnostic-only
- disarmed, inactive, not-due, backoff, and live-gate-waiting rows emit no valid stub
- the stub is candidate input for later bucket or Discovery pickup behavior
- the stub is not a bucket, not Discovery pickup, not Discovery refs, not Evidence/EVEidence, and not Observation
- the External I/O bucket/eligibility tension is reported but not resolved

## Boundary Check

Confirmed:

- no provider calls or live/API calls
- no durable bucket rows
- no product Watch run rows
- no `WatchSessionExecutor.tick(...)`
- no Watch dispatch
- no `TaskRunner`
- no old collector invocation
- no zKillboard or ESI calls
- no `discovered_killmail_refs` writes
- no Evidence/EVEidence writes
- no Hydration/metadata writes
- no API logs or warnings
- no Watch row/cadence mutation
- no Discovery outcome decision
- no receipt handling
- no dispatcher, queue, lease, retry, or External I/O policy
- no schema, runtime behavior, collector retirement, UI, storage enforcement, source-term, or protected-word change

## Verification

Overseer reran:

```txt
npm.cmd run verify:watch-system-radius-run-stub
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
```

All passed.

Note: `verify:service-registry` needed the longer timeout and completed in about 151 seconds.

## Stable Landing

This strengthens the Watch side of the accepted line:

```txt
Watch scheduled work bucket
-> Discovery repeatable handling/recovery
-> settled factual receipt
-> Watch bucket/cadence interpretation
```

More precisely:

```txt
accepted stored system/radius Watch
-> due posture
-> bounded Watch-run stub
-> future bucket or Discovery pickup
```

HS463 proves the stub only. It does not decide bucket durability, Discovery pickup, provider movement, or Watch cadence mutation.

## Next Decision Point

The next real design fork is:

```txt
Should Watch emit durable bucket work while External I/O is closed,
or only mark due work as eligible until the gate opens?
```

Recommended next options:

1. Advisory/source trace: decide durable bucket vs computed eligibility posture for Watch-run stubs.
2. Read-only proof: project how a valid Watch-run stub would appear as "eligible held" versus "bucket candidate" without writing either.
3. Pause and capture a compact Watch/Discovery boundary note before more movement.

