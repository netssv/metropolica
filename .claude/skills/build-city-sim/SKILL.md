---
name: build-city-sim
description: Build, debug, test, or extend an original city-building simulation game. Use for requests involving a SimCity-like or city-builder game, including maps, roads, zoning, buildings, utilities, population, jobs, traffic, economy, demand, happiness, disasters, saving, balancing, UI, performance, or playtesting. Do not use for unrelated game genres or to reproduce proprietary SimCity assets, names, maps, source code, audiovisual content, or exact protected presentation.
---

# Build City Sim

Create an original, playable city-building simulation. Treat “like SimCity” as a genre reference, not a request to clone proprietary content.

## Read first

Read these references as needed:

- `references/game-design.md` for scope, mechanics, and acceptance criteria.
- `references/architecture.md` for code structure and simulation patterns.
- `references/qa-checklist.md` before declaring work complete.
- `assets/game-brief-template.md` when requirements are vague or a reusable project brief is useful.

## Operating rules

1. Inspect the repository before changing files.
2. Preserve the existing stack, conventions, scripts, and architecture when they are viable.
3. For Metropolica specifically, preserve the existing split:
   - `src/core/`: headless deterministic primitives and typed commands.
   - `src/simulation/`: map, districts, economy, utilities, population, and scenarios.
   - `src/rendering/` and `src/ui/`: shared rendering and UI placeholders.
   - `frontend/`: Next.js + React client, Canvas 2D isometric renderer, and ambient visual systems.
   Never move frontend code into `src/`, or import frontend/rendering/UI code into `core/` or `simulation/`.
4. For new projects outside Metropolica, TypeScript/Vite/Phaser/Vitest are acceptable defaults. Do not replace a working framework merely to match a default stack.
5. Keep simulation logic independent from rendering and UI.
6. Use deterministic simulation ticks and a seeded random generator where randomness affects gameplay.
7. Store gameplay values in configuration objects rather than scattering magic numbers.
8. Prefer aggregate city simulation over one fully simulated agent per citizen. Render representative vehicles or pedestrians separately.
9. Keep every development phase runnable and playable.
10. Test actual interactions, not only compilation.
11. Use original names, artwork, UI, sounds, maps, and balancing. Never copy proprietary game assets or branding.
12. Treat `isometric-city` as a credited MIT reference for rendering patterns/assets only; implement behavior against Metropolica types and state.

## Workflow

### 1. Audit and define the slice

Inspect:

- `package.json` and lockfiles
- source layout
- existing game loop
- rendering framework
- tests
- save format
- current errors and TODOs

Write a short implementation plan in the task response or project notes. Identify the smallest playable vertical slice.

When requirements are broad, use this default MVP:

- Tile map with pan and zoom
- Road placement and bulldozing
- Residential, commercial, and industrial zoning
- Building growth based on demand and access
- Cash, construction costs, taxes, and recurring expenses
- Population, jobs, happiness, and city demand
- Electricity and water coverage
- Pause and simulation speed controls
- Save and load
- At least one diagnostic overlay
- Responsive HUD and clear tool feedback

### 2. Establish architecture

Separate these layers:

- **Domain model:** tiles, zones, buildings, networks, city statistics, budget
- **Simulation systems:** zoning, growth, economy, utilities, population, traffic, happiness
- **Commands:** place road, zone area, bulldoze, set tax, change speed
- **Renderer:** terrain, buildings, overlays, effects
- **UI:** toolbar, panels, charts, alerts, tooltips
- **Persistence:** schema version, serialization, migration, validation

Do not let UI components directly mutate deep simulation state. Route user actions through commands.

Frontend-only ambient visuals, such as traffic, may keep transient entity state in
`frontend/src/` and read the live tile map through a ref. They must not become
simulation state, affect economy/population, or be reachable through typed commands.

### 3. Build in playable increments

Implement in this order unless the repository already has later systems:

1. Grid, terrain, camera, selection, and coordinates
2. Build tools with previews, costs, validation, and undo-friendly commands
3. Roads and connectivity
4. Zoning and building growth
5. Budget, taxes, upkeep, and time controls
6. Population, jobs, demand, and happiness
7. Utilities and coverage overlays
8. Traffic approximation and congestion visualization
9. Save/load and schema versioning
10. Polish, accessibility, performance, and balancing

After each increment:

- Run formatting, type checking, tests, and production build.
- Start the game and exercise the new feature.
- Fix regressions before adding more scope.
- Update documentation or project guidance when assumptions change.

For Metropolica, use the repository's available tools rather than assuming npm is usable:

```bash
node --test test/**/*.test.ts
node test/headless-simulation.ts
cd frontend
./node_modules/.bin/tsc --noEmit --target ES2020 --module ESNext \
  --moduleResolution Bundler --lib DOM,ES2020 --jsx react-jsx --skipLibCheck <changed-files>
./node_modules/.bin/next build
```

`/home/netss/.local/bin/npm` may shadow system npm and reference a missing
`/app/bin/host-spawn`; diagnose that wrapper before reporting npm-based verification.
The full frontend TypeScript check includes legacy files under `frontend/src/lib/`
that may fail independently of a changed feature. Report those failures separately
and still run a targeted check for modified files.

### 4. Simulation standards

Use a fixed simulation tick independent from render FPS.

Prefer staged updates:

1. Apply queued player commands.
2. Recompute dirty networks or coverage.
3. Update demand and growth.
4. Update population and employment.
5. Update utilities and traffic.
6. Apply income and expenses.
7. Recalculate happiness and city statistics.
8. Emit events consumed by UI and rendering.

Avoid recomputing the whole map every frame. Use dirty regions, cached connectivity, chunking, or lower-frequency systems.

Document each important formula with:

- Inputs
- Output range
- Update frequency
- Player-facing effect

Keep balancing constants centralized.

### 5. UX standards

Always provide:

- Visible active tool
- Valid and invalid placement preview
- Cost before placement
- Clear reason when placement fails
- Undo or safe cancellation where practical
- Pause and speed controls
- Current cash, income, population, jobs, and happiness
- Alerts that lead the player toward corrective action
- Keyboard and pointer controls that do not conflict
- A help panel or concise onboarding

Do not leave dead buttons, fake charts, or controls without effects.

### 6. Save standards

Save data, not renderer objects.

Include:

- `schemaVersion`
- map seed and dimensions
- simulation time and speed
- tile and building data
- economy and city statistics
- settings needed to reproduce the state

Validate loaded data and reject or migrate incompatible saves without crashing. Add a round-trip test: state → save → load → equivalent state.

### 7. Testing standards

Prioritize unit tests for pure simulation functions and integration tests for commands.

At minimum test:

- Coordinate conversion and bounds
- Placement validation
- Construction cost and refunds
- Road/network connectivity
- Demand and growth thresholds
- Budget calculations
- Utility coverage
- Save/load round trip
- Determinism for a fixed seed and command sequence

When browser automation is available, test the main player flow:

1. Start a new city.
2. Place roads.
3. Zone land.
4. Connect utilities.
5. Run simulation.
6. Observe growth and budget change.
7. Save, reload, and verify continuity.

### 8. Completion report

When finishing, report:

- What is playable now
- Main files changed
- Commands run and their results
- Known limitations
- Best next feature

Do not claim testing that was not performed.
