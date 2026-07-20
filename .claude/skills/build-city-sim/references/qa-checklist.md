# QA checklist

Use this checklist before reporting completion.

## Repository health

- Dependencies install using the repository's documented package manager.
- Formatting and linting pass, or existing unrelated failures are clearly reported.
- Type checking passes.
- Unit and integration tests pass.
- Production build passes.
- No secrets, local absolute paths, or generated junk were committed.

## New-city flow

- New game reaches a playable map.
- Camera pan and zoom work.
- Toolbar clearly shows the active tool.
- Canceling a tool works.
- Placement preview aligns with the final placement.
- Invalid placement is visibly invalid and explains why.
- Costs are charged exactly once.
- Bulldozing affects map and budget correctly.

## Simulation

- Pause truly stops simulation changes.
- Each speed setting changes simulation rate predictably.
- Road connectivity updates after placement and demolition.
- Zones develop only when conditions are satisfied.
- Population and job totals match developed capacity and occupancy.
- Income and expenses are applied at documented intervals.
- Utility shortage affects development or happiness as designed.
- Demand remains within bounds.
- No NaN, Infinity, negative population, or impossible capacity appears.
- Fixed seed plus fixed commands produces stable results.

## UI and feedback

- Cash, balance, population, jobs, demand, and happiness update.
- Alerts provide actionable information.
- Overlays can be enabled and disabled.
- Tooltips do not cover critical controls.
- UI remains usable at common desktop widths.
- Keyboard shortcuts do not trigger while typing in inputs.
- Important state is not conveyed only by color.

## Persistence

- Saving succeeds.
- Loading restores roads, zones, buildings, economy, time, and settings.
- A save/load round trip preserves equivalent simulation state.
- Corrupt or incompatible saves fail safely.
- Starting a new city does not leak state from the previous city.

## Performance

- No obvious frame-rate collapse during normal MVP play.
- Simulation does not run once per rendered object.
- Decorative agents are capped or pooled.
- Large selections and bulldozing do not freeze the UI.
- Performance metrics or profiling were used before major optimizations.

## Manual playtest

Play at least one short session:

1. Build a road.
2. Create all three zone types.
3. Supply utilities.
4. Run time until development occurs.
5. Confirm population, jobs, demand, and budget change.
6. Trigger and fix one problem such as missing power or congestion.
7. Save.
8. Reload.
9. Continue playing.

Record what was actually tested and any limitation observed.
