# UIUXHS84 - Watch Recovery Readout Interpretation

Date: 2026-05-26
Role: UIUX / Product Interpretation specialist
Status: advisory complete
Milestone: Atlas Storage And Runtime Hardening

## Intent Read

This is an Atlas-facing presentation advisory, not a Lab product default and not a source-term rename.

Clean boundary:

- Atlas source/internal term: Watch
- Atlas bridge/readout state may remain: `Watch_offline`
- Presentation candidate: R-Scanner
- Short interaction candidate: R-scan
- Preserved source terms underneath: Watch, Discovery, Evidence/EVEidence, hydration

The surface should communicate that the scanner is powered down, safe, and waiting for deliberate user intent. It must not imply background surveillance or active checking.

## Naming Layer

| Name | Fit | Risk |
| --- | --- | --- |
| R-Scanner | Strongest general user-facing name. Feels like a console/tool, not a backend routine. | Needs one-time meaning setup so it is not confused with EVE D-scan. |
| R-scan | Good short action/verb label: "Run R-scan", "R-scan ready". | Too terse as the main surface name. |
| Scanner | Simple and generic. | Too broad; loses the recovery/readout identity. |
| Recon Scanner | Strong mood and purpose. | Leans toward doctrine/flavor; could overstate active recon/surveillance. |

Recommendation: use R-Scanner for the surface and R-scan for the action/short form.

Avoid exposing Watch as primary UI copy if the scanner metaphor is accepted, but preserve Watch in detail, diagnostic, and source-owned rows where needed.

## Presentation Methods

### 1. Powered-Down Central Console

Preferred.

A central radar/scanner face sits dimmed, static, and unarmed. The main state reads as calm: Offline, Disarmed, or Waiting. A compact rail shows availability, pending refs, provider state, and review marker.

Best for restart recovery, deliberate activation, and avoiding "live scan running" vibes.

### 2. Status Envelope With Scanner Face

Fallback.

A smaller scanner face sits inside a status panel/envelope. The state band does most of the work; the scanner graphic supports mood but does not dominate.

Best for conservative implementation, less visual risk, and narrow behavior.

### 3. Recovery Checklist Rail

Park for now.

A rail/list shows recovery steps: local refs, provider deferred, ready, review needed. Useful but too process-heavy as the main metaphor. It risks making waiting look like a failure queue.

## State Ladder

| State | Treatment |
| --- | --- |
| offline / disarmed | Dim scanner face, no sweep, no pulse. Clear "Disarmed" or "Offline" label. Calm neutral tone. |
| waiting | Soft standby state. Static ring, low contrast rail. Do not show spinner unless work is actually happening. |
| pending local refs | Small pending chip/rail item. Local refs are being prepared or checked, not a scan result. |
| ready to scan | Scanner face brightens slightly. Action affordance can become primary. Still no active sweep until triggered. |
| missed slot recoverable | Muted warning edge, not an error state. Copy should imply recoverable next step. |
| provider deferred | Availability reason treatment. This is not failure; provider/source timing is deferred. |
| review needed | Muted attention marker plus detail path. Do not imply Evidence has been created. |

## At A Glance

Visible immediately:

- R-Scanner
- current state
- whether it is armed/disarmed
- whether R-scan is available
- last read / freshness
- pending local refs count or marker
- muted warning/review-needed marker
- detail affordance

Tucked into detail/diagnostics:

- Watch source/internal term
- Discovery/Evidence boundary note
- hydration status
- provider deferred reason
- malformed/missing radius scope explanation
- raw refs/IDs
- scheduler/service details

## Central Console Rules

The powered-down radar face should look like an inactive instrument, not a broken panel:

- no animated sweep while offline/disarmed
- no red error field for normal offline state
- no "live" language unless active scan is actually running
- subdued rings/grid lines
- clear state chip
- compact status rail/envelope around it
- warning/gap edge only for recoverable or review-needed states

## Avoidance Checks

The design should pass these plain-language checks:

- Does offline look intentionally disarmed, not broken?
- Does waiting look safe, not failed?
- Does the scanner avoid implying live surveillance?
- Are Discovery refs visually distinct from Evidence/EVEidence?
- Is hydration shown as preparation/support, not Evidence/EVEidence creation?
- Is missing/malformed radius scope shown as approximate or unavailable, not exact?

## Product Note

For a gaming product, light diegetic wordplay is acceptable when it is source-consistent and does not blur meaning.

R-Scanner can stand as the presentation surface. R-scan can stand as the action/short form. The UI does not need a heavy disclaimer. First-use or detail copy can quietly establish the meaning, for example:

```txt
R-Scanner is your recovery scanner for stored refs and review readiness.
```

Avoid saying "not D-scan" in ordinary UI unless users are genuinely confused; otherwise the comparison becomes louder than the product.

EVEidence is acceptable as a product/presentation term if it stays source-owned and consistent. It signals the EVE context while sidestepping the overloaded generic Evidence term.

## Recommendation

Use Method 1: Powered-Down Central Console.

Name it R-Scanner in the presentation layer. Use R-scan only for action/short form. Keep Watch, Discovery, Evidence/EVEidence, and hydration source-owned underneath in detail/diagnostic rows.

Park:

- full-screen redesign
- animated radar behavior
- route/map expansion
- backend/source renaming

## Smallest Future Implementation Packet

If Overseer opens Dev work later, keep it bounded to a renderer presentation slice:

- consume existing `Watch_offline` readout only
- no backend, bridge, IPC, schema, service, or payload changes
- no live/API calls
- no animated sweep while disarmed/offline
- map `next_safe_action` to presentation labels and status chips
- expose diagnostic detail behind an affordance

Do not open that packet until Overseer accepts this interpretation into `workspace/current.md`.
