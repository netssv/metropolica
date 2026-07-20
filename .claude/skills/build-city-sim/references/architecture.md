# Architecture reference

## Guiding principle

The simulation must be executable without the renderer. This enables deterministic tests, save/load validation, balancing tools, and future renderer changes.

## Suggested browser-project layout

```text
src/
  app/
    bootstrap.ts
    gameController.ts
  sim/
    model/
      cityState.ts
      tile.ts
      building.ts
      config.ts
    commands/
      buildRoad.ts
      zoneArea.ts
      bulldoze.ts
    systems/
      connectivity.ts
      growth.ts
      economy.ts
      population.ts
      utilities.ts
      traffic.ts
      happiness.ts
    events/
      cityEvents.ts
    persistence/
      saveSchema.ts
      serialize.ts
      migrate.ts
    simulation.ts
  render/
    scenes/
    layers/
    sprites/
    camera/
  ui/
    hud/
    tools/
    panels/
    overlays/
  tests/
```

Adapt names to the existing repository rather than forcing this exact layout.

## State and commands

Use serializable domain state.

```ts
type CityCommand =
  | { type: "place-road"; x: number; y: number }
  | { type: "zone"; zone: ZoneType; cells: Cell[] }
  | { type: "bulldoze"; cells: Cell[] }
  | { type: "set-tax"; zone: ZoneType; rate: number }
  | { type: "set-speed"; speed: 0 | 1 | 2 | 4 };
```

Command handling should:

1. Validate.
2. Calculate cost.
3. Apply one atomic state change.
4. Mark affected systems dirty.
5. Emit a domain event.
6. Return a structured result for UI feedback.

```ts
type CommandResult =
  | { ok: true; events: CityEvent[] }
  | { ok: false; reason: string; code: string };
```

## Simulation loop

Use accumulator-based fixed steps:

```ts
accumulator += elapsedMs * speed;

while (accumulator >= SIM_STEP_MS) {
  simulation.step();
  accumulator -= SIM_STEP_MS;
}

renderer.draw(simulation.state);
```

Cap catch-up work after long inactive periods to avoid freezing.

## Update frequencies

Not every system needs the same frequency.

Example:

- Commands: every fixed tick
- Connectivity: when network changes
- Utility coverage: when sources/networks/consumers change
- Building growth: every few simulation ticks
- Traffic assignment: lower frequency or incrementally
- Economy: monthly
- Happiness: weekly or monthly
- UI charts: sampled

## Dirty-state strategy

Track dirty causes:

- changed tiles
- changed road components
- changed utility sources
- changed zones
- changed building occupancy
- changed policy or tax settings

Recompute only affected areas when possible. Begin with correct full recomputation if the map is small, then optimize using profiling data.

## Determinism

For a fixed initial seed and command list, simulation output should match.

Rules:

- Do not call `Math.random()` inside simulation systems.
- Inject a seeded RNG.
- Do not depend on object iteration order for gameplay decisions.
- Resolve ties with stable coordinates or IDs.
- Keep render-only randomness outside simulation state.

## Persistence

Use a plain serializable save envelope:

```ts
interface SaveGame {
  schemaVersion: number;
  createdAt: string;
  gameVersion: string;
  state: SerializableCityState;
}
```

Do not serialize:

- Phaser scenes
- DOM nodes
- textures
- functions
- cyclic object graphs
- transient UI state unless intentionally required

## Performance budgets

Choose explicit targets appropriate to device and map size.

Suggested starting targets:

- Smooth rendering on a typical laptop
- Fixed simulation step within a small fraction of frame time
- No full-map allocation every frame
- Save/load without blocking for a noticeable period on MVP maps
- Bounded number of decorative agents

Measure before optimizing. Add simple development metrics for FPS, simulation step time, entity counts, and dirty-region size.

## Common failure modes

- Mixing tile coordinates and screen coordinates
- Mutating simulation state from UI callbacks
- Tying simulation speed to FPS
- Running pathfinding for every visible vehicle
- Recalculating all networks every frame
- Saving framework objects
- Adding many systems before one complete playable loop
- Hiding failed placement without a reason
- Using placeholder buttons that never become functional
