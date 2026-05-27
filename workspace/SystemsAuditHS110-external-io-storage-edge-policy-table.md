# Systems Audit HS110: External I/O / Storage Edge Policy Table

Date: 2026-05-27
Role: Atlas Systems Auditor
Status: Advisory artifact only; no implementation opened

Purpose: capture edge-case policy expectations for external I/O, storage authority, provider waits, restart recovery, deletion/pruning interactions, local lookup gaps, and clock/gate disagreement.

## Policy Table

| Situation | Current expected behavior | Desired policy | Risk | Needs Dev packet? |
| --- | --- | --- | --- | --- |
| `external_io` toggled off during active provider work | `external_io` is not implemented. Today, live work is controlled by `AURA_ATLAS_LIVE_API`, `live.gate`, task state, and Watch arming. Active detached work may not have a global hold signal. | New provider calls stop releasing immediately. In-flight work should finish safely or be cooperatively cancelled only if that is explicitly designed. Due work reads as `held_by_external_io`, not failed. Re-enable must not catch-up flood. | Hidden provider continuation after operator thinks I/O is off; or abrupt cancellation causing partial state ambiguity. | Yes. Needs explicit readout/enforcement semantics. |
| Storage becomes unavailable during acquisition/hydration | Storage preflight can report posture, but storage lockout/enforcement is not implemented. Active writes depend on normal DB/file behavior. | Storage safety should hard-lock acquisition/write behavior, preserve existing records, and require setup/re-establish. Provider-backed work should not continue if results cannot be safely persisted. | Provider calls spent with failed writes; partial success hidden in logs; surprise fallback DB/location. | Yes. Storage authority enforcement packet. |
| Provider returns partial failure / retry-after | Existing code treats provider deferral/waits as non-evidence and recoverable in several paths; `live.gate` has service-memory cooldown/lockout. Some retry/capacity state is not durable broad-sequencer policy. | Retry-after becomes provider/cadence wait, not failure. No partial Evidence/EVEidence writes. Work remains recoverable/reviewable under the relevant Acquisition or Hydration lane. | Retryable waits marked failed; duplicate retries; partial evidence claims; lost recovery posture after restart. | Partly. Existing pieces help, but durable lane readout/recovery needs a bounded packet. |
| App restarts with held work, pending refs, or missed slots | `Watch_offline` derives restart/recovery readout from local rows: pending refs, provider deferral, missed slots, orphaned runs, arm-required state. No external_io-held state exists. | Restart should show held/pending/missed as recoverable readout, not failure. Watch remains disarmed by default. Held work re-enters normal gates only when armed/allowed. | Operator sees stale or alarming state; missed slots become catch-up flood; external_io holds are invisible. | Yes for `held_by_external_io` readout. Existing `Watch_offline` covers adjacent states. |
| User deletes records while related hydration/recovery is pending | Deletion execution is not open; retention/deletion preflight is read-only. Pruning/deletion relationship warnings are future work. | Destructive actions should preview pending hydration/recovery/Assessment/Discovery relationships. Deletion of active records remains absolute, with snapshots disclosed separately. Pending hydration for deleted records should be cancelled/invalidated, not resurrect records. | Hydration recreates readability around deleted records; dangling pending work; misleading Assessment or Observation references. | Yes. Future deletion/pruning relationship packet before execution. |
| Local lookup missing labels during an Observation/report | Reports can degrade to IDs/cached labels. Hydration is explicit provider-gated readability repair, not Evidence creation. Typed actor resolution gap remains known. | Observation/report should remain local-first and honest: IDs are facts, labels are metadata. Offer degraded display or explicit `Refresh labels` under external/provider/storage gates. | Silent provider call replacing local lookup; labels mistaken for Evidence; incomplete labels make report look broken. | Partly. Degraded display exists in spirit; typed actor/live-gate and hydration policy need bounded hardening. |
| Clock says due, but multiple gates disagree | Current Watch schedule can say due/eligible; executor may still block on session not armed, active task, live API disabled, or `live.gate`. Storage and `external_io` are not implemented as dispatch gates. | Due means "consider work," not "run now." Readout should show gate stack: due, armed/disarmed, external_io, live.gate/cadence, storage safety, confirmation, active task. Highest-priority block should be clear. | Operator confusion; due interpreted as authorized; wrong gate gets blamed; hidden block causes repeated attempts. | Yes. Smallest packet: read-only gate-stack/readout proof before enforcement. |

## Source Context

- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `workspace/SystemsAuditHS109-external-io-policy-fit.md`
- `workspace/critical/critical-terms.md`
- `workspace/current.md`
- `workspace/SystemsAuditHS107-zkill-esi-trust-boundary.md`

## Boundary Confirmation

This artifact is advisory only. It does not implement `external_io`, storage enforcement, deletion/pruning execution, provider retry policy, gate-stack readout, schema changes, or runtime behavior.

No code, schema, provider behavior, storage behavior, Watch behavior, Evidence/EVEidence behavior, hydration behavior, or Assessment behavior was changed.
