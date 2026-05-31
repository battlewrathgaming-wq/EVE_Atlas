# External I/O / Provider Gate

Status: Advisory discovery input, not project authority
Surface: External I/O / Provider Gate
Source owner: AURA-Atlas
User task: Understand whether Atlas may contact external providers and why provider-backed work is allowed, waiting, or held.
Source data / command: `support.gate_stack_readout`, future `external_io` policy direction, `live.gate`, Watch arming, cadence simulation proof.
What is visible now: Gate-stack readout can show future `external_io` as policy-only/not implemented, provider-backed posture, `live.gate`, Watch arming, storage safety, duplicate/active task state, and confirmation requirement.
What the user needs to understand: External I/O is provider contact authority; turning it off should hold provider-backed work as `held_by_external_io` while local readout remains useful.
First-read candidates: External provider contact on/off; local-only available; provider work held; waiting is normal; no catch-up release.
Detail/diagnostic candidates: Provider-backed action, relevant gate, cadence state, `Retry-After`, storage lock, confirmation needed, Watch armed/disarmed, `held_by_external_io` reason.
Terms to preserve: `external_io`, `held_by_external_io`, `live.gate`, `watch.executor.arm`, External API, provider-backed.
Terms to avoid or qualify: offline as broken, cancelled, failed, catch-up, global disconnect, surveillance, background live coverage.
Boundary that must not blur: `external_io` is not Watch arming, not `live.gate`, not storage safety, and not implemented enforcement yet.
Risks / false implications: A display could imply the policy is already enforced; release could imply immediate catch-up flooding; provider waits could look like errors.
Possible request_display candidate: yes
No Dev authorization: This note does not authorize `external_io` implementation, persisted settings, provider dispatch changes, cadence enforcement, or catch-up/release behavior.

