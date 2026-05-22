# Contract: Scope Definition Controls

Status: Active
Date: 2026-05-22

## Purpose

Scope definition controls describe how a user tells Atlas what to inspect or collect.

They are presentation inputs that become planner/worker inputs. They are not evidence.

## Boundary

Owned by:

- manual discovery commands
- actor watch setup
- system/radius watch setup
- report commands
- future UI forms that trigger those actions

## Scope Types

### Manual Actor Discovery

Purpose:

```txt
show possible killmail refs for an actor before spending ESI expansion calls
```

Required user inputs:

- actor type: character, corporation, or alliance
- actor name or ID
- lookback window
- max refs

Optional user inputs:

- evidence expansion later via queue scope or selected killmail IDs
- max expansions for explicit manual expansion

Default intent:

- discovery only
- zero ESI expansion
- queue refs as `manual_actor`

### Manual System Discovery

Purpose:

```txt
show possible killmail refs for one system before spending ESI expansion calls
```

Required user inputs:

- system name or ID
- lookback window
- max refs per system

Default intent:

- radius is 0
- discovery only
- zero ESI expansion
- queue refs as `manual_system`

### Manual Radius Discovery

Purpose:

```txt
show possible killmail refs around a center system before spending ESI expansion calls
```

Required user inputs:

- center system name or ID
- radius jumps
- lookback window
- max systems
- max refs per system

Default intent:

- discovery only
- zero ESI expansion
- queue refs as `manual_radius`

### Actor Watch

Purpose:

```txt
routine collection for a selected actor
```

Required user inputs:

- actor type: character, corporation, or alliance
- actor name or ID
- lookback window
- max refs
- max expansions

Default intent:

- discover through zKill
- skip cached killmails
- expand selected uncached refs through ESI under global cap
- drain pending queue refs before repeated discovery

### System / Radius Watch

Purpose:

```txt
routine collection for a center system and jump radius
```

Required user inputs:

- center system name or ID
- radius jumps
- lookback window
- max systems
- max refs per system
- max expansions

Default intent:

- resolve systems locally through SDE
- plan radius with BFS
- discover through zKill per scoped system
- skip cached killmails
- expand selected uncached refs through ESI under global cap
- drain pending queue refs before repeated discovery

### Reports

Purpose:

```txt
observe stored evidence matching a scope and time window
```

Required user inputs:

- report type
- actor/system/radius/corporation scope
- evidence window

Default intent:

- read stored evidence only
- do not call zKill
- do not call ESI unless the user explicitly invokes hydration

## User-Facing Control Defaults

Recommended initial UI defaults:

| Control | Manual Actor | Actor Watch | Manual System | System/Radius Watch |
| --- | --- | --- | --- | --- |
| Lookback | 7 days | 30 days | 24 hours | 24 hours |
| Radius | n/a | n/a | 0 jumps | 0 or 1 jump |
| Max refs | 20 | 20 | 20 | per-system 10 |
| Max systems | n/a | n/a | 1 | 10 |
| Max expansions | 0 | 2 | 0 | 2 |

These are user-facing defaults. Existing lower-level planner defaults may be broader for direct script usage and should be overridden by UI/live runners.

## Invariants

- Manual discovery must never expand by default.
- Watches may expand automatically, but only under explicit caps.
- Expansion caps are global per run, not per system, unless a future contract changes this.
- Actor name resolution must be typed.
- System name resolution must use local SDE first.
- Lookback windows must be visible in reports and diagnostics.
- Ref caps and expansion caps must be visible before live collection.

## Must Not Do

- Do not silently choose between actor/system categories for a name.
- Do not hide caps from the user.
- Do not treat a lookback window as complete evidence coverage when expansion is partial.
- Do not run live collection from an implicit UI refresh.

## Verification

- `verify:planner`
- `verify:queue-preflight`
- `verify:manual-discovery`
- `verify:actor-resolution`
- `verify:actor-watch`
- `verify:collector`

