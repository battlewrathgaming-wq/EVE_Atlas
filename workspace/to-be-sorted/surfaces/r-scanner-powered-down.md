# R-Scanner Powered-Down / Watch_offline Recovery

Status: Advisory discovery input, not project authority
Surface: R-Scanner powered-down state and `Watch_offline` recovery state
Source owner: AURA-Atlas
User task: See whether patient discovery is safely disarmed, waiting, recoverable, or needs a light operator action.
Source data / command: `watch.offline_readout`, `Watch_offline`, R-Scanner presentation direction, HS93 prototype material.
What is visible now: Renderer prototype consumes `watch.offline_readout` and maps disarmed/offline, pending Discovery refs, provider wait, missed-slot recovery, orphan review, and radius scope limits into replaceable labels.
What the user needs to understand: The system may be ready but intentionally disarmed; waiting is not failure; local pending refs may be safer to handle before fresh Discovery; some states need review rather than panic.
First-read candidates: No action needed; arm required; waiting safely; pending leads to review; missed slot recoverable; orphan needs review; scope limited.
Detail/diagnostic candidates: `session_armed`, `collection_active`, configured watches, eligible if armed, pending refs count, provider deferral, `missed_slot`, `orphaned_run`, `scope_status`, `next_safe_action`.
Terms to preserve: Watch, `Watch_offline`, `next_safe_action`, `provider_deferral`, `missed_slot`, `orphaned_run`, `scope_status`, `eligible_if_armed`.
Terms to avoid or qualify: scanning now, live coverage, background surveillance, broken, failed, exact radius coverage when scope is missing or malformed.
Boundary that must not blur: R-Scanner/R-scan are presentation candidates only; Watch and `Watch_offline` remain Atlas source/bridge terms underneath.
Risks / false implications: Powered-down visuals could look broken; calm progress could imply hidden provider work; missed-slot recovery could imply exact packet replay.
Possible request_display candidate: yes
No Dev authorization: This note does not authorize renderer redesign, backend changes, payload changes, Watch behavior changes, provider calls, or terminology renames.

