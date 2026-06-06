# OverseerHS348 - HS347 Discovery Pickup Packet Proof Review

Status: accepted
Date: 2026-06-06
Role: Overseer
Milestone: Atlas Storage And Runtime Hardening

## Reviewed

```txt
workspace/OverseerHS347-discovery-pickup-packet-proof-runway.md
workspace/DevHS347-discovery-pickup-packet-proof.md
src/main/services/watchDiscoveryPickupPacketProofService.js
scripts/verify-watch-discovery-pickup-packets.js
```

## Result

Accepted.

HS347 proves the intended Watch-to-Discovery boundary:

```txt
due Watch -> Discovery pickup packets
```

It preserves the accepted model:

- Watch is a scheduler and scope-authority source.
- Discovery is the acquisition utility.
- A due Watch emits Discovery pickup intent; it does not acquire candidates itself.
- System/radius Watch uses stored accepted `included_system_ids` as execution authority.
- Center/radius remain provenance/explanation only after acceptance.

## Accepted Implementation

- Added read-only renderer-eligible command `watch.discovery_pickup_packet_proof.preview`.
- Added `buildWatchDiscoveryPickupPacketProof(...)`.
- Added `npm.cmd run verify:watch-discovery-pickup-packets`.
- The proof composes `watch.executor_tick_dry_run.preview` and does not call `WatchSessionExecutor.tick(...)`, dispatch runners, collectors, providers, TaskRunner methods, or persistence writers.
- Valid actor Watch emits exactly one Discovery pickup packet.
- Valid system/radius Watch emits exactly one Discovery pickup packet per stored accepted system ID.
- Invalid stored system/radius scope emits zero pickup packets and reports `watch_scope_authority_invalid`.
- Disarmed, active-task, live-disabled, no-due, inactive, not-due, and backoff states emit zero pickup packets.

## Verification Re-Run

Overseer re-ran:

```txt
npm.cmd run verify:watch-discovery-pickup-packets
npm.cmd run verify:command-authority
npm.cmd run verify:service-registry
npm.cmd run verify:passive-side-effects
git diff --check
```

Results:

- All npm verifier commands passed.
- `git diff --check` passed; only CRLF normalization warnings were emitted.

## Boundary Confirmation

No Watch execution, Watch dispatch runner invocation, collector call, zKillboard call, ESI call, provider/live/API call, `discovered_killmail_refs` write, Evidence/EVEidence write, Hydration/metadata write, API log/warning write, real/operator Watch mutation, real runtime packet persistence, real/product task creation, broad provider queue, schema change, renderer UI work, runtime enforcement, command blocking, support artifact creation, durable Watch result identity, relationship tag, protected-word JSON update, or fourth-lane behavior was opened.

## Notes

This is still a proof/readout surface. It does not yet route real runtime Watch execution through Discovery pickup packets.

That is correct for HS347. The runtime collector split and provider movement should remain parked until the next seam is deliberately selected.

## Resting Next Options

1. Add a no-provider Discovery pickup consumer fixture that consumes these pickup packets and returns pre-persistence candidate refs.
2. Shape Manual/User-driven Discovery pickup packet posture so non-repeatable operator intent can feed the same Discovery utility.
3. Inspect or prove how the current direct collector path should be retired, bypassed, or adapted once pickup packets are accepted.
4. Rest Watch-side pre-provider architecture and discuss Discovery output / Evidence Expansion boundary.
