# Discovery Lead / Search And Queue Review

Status: Advisory discovery input, not project authority
Surface: Discovery lead/search and Queue Review / possible leads
Source owner: AURA-Atlas
User task: Review zKill possible leads, decide what may deserve ESI expansion, and understand what remains unconfirmed.
Source data / command: `discovered_killmail_refs`, `manual.discovery`, queue reports, expansion-selection contract, provenance/readiness reports.
What is visible now: Discovery refs can include status, priority, source scope, last seen time, failure/retry context, and optional zKill preview metadata.
What the user needs to understand: Discovery refs are possible leads and provenance, not local Evidence/EVEidence; zKill preview can help triage but cannot become Observation fact by itself.
First-read candidates: Possible leads; queued refs; selected for enrichment; waiting on local pending refs; failed/retryable provider context; no Evidence yet.
Detail/diagnostic candidates: `killmail_id`, hash presence, source Watch/search scope, preview metadata, status, priority, failure count, last error, fetch run provenance, selected/not selected state.
Terms to preserve: Discovery, possible leads, Discovery refs, Queue Review, `discovered_killmail_refs`, `manual.discovery`.
Terms to avoid or qualify: evidence, confirmed, observation, report truth, complete coverage, current activity proof.
Boundary that must not blur: zKill Discovery creates possible leads; only ESI expansion written locally creates Evidence/EVEidence.
Risks / false implications: Preview victim/system/time fields can look authoritative; queue counts can be mistaken for evidence counts; retry waits can be mistaken for failed killmails.
Possible request_display candidate: yes
No Dev authorization: This note does not authorize queue mutation, stale/expired policy, ESI expansion behavior, provider calls, or new sequencer machinery.

