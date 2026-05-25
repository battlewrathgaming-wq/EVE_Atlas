# Overseer HS81 - Watch Recovery Systems Design Request

Date: 2026-05-26
Role: Atlas Overseer
Status: advisory request ready
Milestone: Atlas Storage And Runtime Hardening

## Purpose

Bundle the next systems-design advisory around Watch restart recovery and resumable sequencer intent.

This is not a Dev runway and does not authorize implementation. The goal is to test whether Atlas should focus next on recovery/resumable Watch intent instead of durable per-request counting.

## Source Discussion Captured

Human / Overseer alignment:

- HS79 implemented first-pass Live provider gate and Watch / Sequencer diagnostics.
- The first instinct was durable request-control state across restart.
- Human challenged that durable request-counting may be data hungry.
- Preferred direction to test: Watch sources should know their scope and work down from durable Watch intent/progress.
- The next question is architectural: what minimal checkpoint state lets Atlas recover safely after restart without creating a giant provider-attempt ledger?

## Product Heading

Current milestone remains:

```txt
Atlas Storage And Runtime Hardening
```

Candidate next heading for design review:

```txt
Watch Restart Recovery And Resumable Sequencer Intent
```

## Evidence Baseline

Current accepted baseline:

- Live search = immediate, narrow provider-style lookup.
- Watch / Sequencer = patient, scoped acquisition over time.
- Discovery Queue = returned zKill refs.
- Evidence = ESI-expanded killmails.
- Hydration = local readability/metadata repair, separate from request-control sequencing.
- `discovered_killmail_refs` is not the sequencer.
- Waiting is not failure.

Recent implementation baseline to verify, not assume:

- Live radius is rejected.
- Per-fingerprint cooldown/lockout exists service-memory-only.
- Watch schedule can show planned packet diagnostics.
- Retryable provider capacity leaves refs pending and does not write Evidence.
- No broad provider work queue exists.

Primary project evidence to inspect:

- `workspace/current.md`
- `workspace/OverseerHS80-hs79-live-gate-review.md`
- `workspace/DevHS79-live-gate-sequencer-diagnostic.md`
- `workspace/OverseerHS79-live-gate-mechanic-acceptance.md`
- `workspace/OverseerHS78-request-control-sequencer-advisory-review.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- relevant schema/service/watch/queue files

## Advisory Prompt

```text
Role:
Atlas Systems Designer / Architecture Reviewer

Project:
AURA Atlas

Purpose:
Provide practical design input for Watch restart recovery and resumable sequencer intent. Do not implement code.

Context:
Atlas has accepted this product split:
- Live search = immediate, narrow provider-style lookup.
- Watch / Sequencer = patient, scoped acquisition over time.
- Discovery Queue = returned zKill refs.
- Evidence = ESI-expanded killmails.
- Hydration = local readability/metadata repair, separate from request-control sequencing.

Recent implementation baseline to verify, not assume:
- Live radius is rejected.
- Per-fingerprint cooldown/lockout exists service-memory-only.
- Watch schedule can show planned packet diagnostics.
- Retryable provider capacity leaves refs pending and does not write Evidence.
- No broad provider work queue exists.

Design question:
Should the next architecture step focus on durable request-control counting, or on restart recovery / resumable Watch intent?

Preferred direction to challenge:
Avoid high-volume durable request-attempt logs. Instead, make Watch configuration plus minimal Watch progress/checkpoint state the durable basis for recovery. The Watch source should know or reconstruct its target, scope, cadence, lookback, radius, caps, last checked, next eligible time, and remaining/planned work.

Questions to answer:
1. What durable state is necessary for Atlas to recover Watch work safely after restart?
2. What transient state can be safely forgotten?
3. How should Atlas avoid duplicate work after restart?
4. How should Atlas avoid API hammering after restart?
5. What should count as "recovered enough" for alpha?
6. Should Live cooldown/lockout remain mostly volatile for now?
7. What minimal durable footprint, if any, is needed for provider waits or active cooldowns?
8. How should Watch work be broken down: by Watch, target, system, radius step, lookback window, provider, or packet?
9. How should partial completion be represented without turning Discovery refs into sequencer state?
10. What existing schema/code already supports this, and what gaps remain?
11. What should be rejected or deferred?

Constraints:
- Do not propose a broad provider work queue unless clearly necessary.
- Do not make discovered_killmail_refs the sequencer.
- Do not blur Discovery refs with Evidence.
- Do not treat waiting as failure.
- Do not make local hydration part of request-control sequencing.
- Do not design UI except for minimal operator readout needs.
- Prefer practical, low-data solutions.
- Be willing to reject the preferred direction if a better practical model exists.
- Ground recommendations in current Atlas docs/schema/code.

Expected output:
1. Executive recommendation.
2. Recommended next architecture direction.
3. Minimal durable state needed.
4. State that should remain volatile.
5. Recovery model after restart.
6. Duplicate-work prevention model.
7. API hammering prevention model.
8. Partial-completion model.
9. Risks and tradeoffs.
10. Smallest next Dev packet recommendation.
11. Acceptance criteria for that packet.
12. Verification commands / evidence expected.
13. Human or Overseer decisions needed.
```

## Acceptance Use

When the advisory returns, Overseer should decide:

- whether to accept recovery/resumable intent as the next packet heading
- whether durable request-control counting should remain deferred
- whether any schema/service changes are justified
- what the smallest Dev runway should be

Do not pass the advisory directly to Dev until Overseer has accepted the recommendation into `workspace/current.md`.
