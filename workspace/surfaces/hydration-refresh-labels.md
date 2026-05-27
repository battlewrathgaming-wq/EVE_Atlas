# Hydration / Refresh Labels

Status: Advisory discovery input, not project authority
Surface: Hydration / Refresh labels
Source owner: AURA-Atlas
User task: Understand missing or stale readable labels and choose whether to repair readability when gates allow.
Source data / command: Metadata hydration reports, `metadata.hydration`, `metadata_runs`, `entities`, `type_metadata`, report raw IDs, DataHS116 advisory model.
What is visible now: Current data can derive missing-label and stale-label candidates from local rows, but no persistent Hydration backlog is accepted.
What the user needs to understand: Hydration repairs labels and metadata for known local IDs; it does not create Evidence/EVEidence, and raw IDs remain the factual basis.
First-read candidates: Refresh labels; missing labels; stale labels; locally patchable; provider required; held by External I/O; capped for safety.
Detail/diagnostic candidates: Candidate count, sample IDs, lane, source tables, raw IDs, label source, last refreshed time, local patch availability, provider-required count, gate state, cap/chunk estimate.
Terms to preserve: Hydration, Refresh labels, `metadata.hydration`, Hydration Recovery Clock, view/local-record hydration, Watch hydration.
Terms to avoid or qualify: enrich evidence, create evidence, fix facts, verify identity, complete corpus, global all labels.
Boundary that must not blur: Hydration is readability repair over known local IDs, not Evidence creation and not local fact creation.
Risks / false implications: Names can masquerade as facts; stale can sound wrong; provider-backed label repair can look like ordinary local lookup; backlog pressure can drift into pruning authority.
Possible request_display candidate: yes
No Dev authorization: This note does not authorize a Hydration backlog table, provider-backed hydration execution, stale-label policy, schema changes, or label mutation behavior.

