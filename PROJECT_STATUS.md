# Metropolica — Project Status

## What is this project?

Metropolica is a browser-oriented urban management simulation inspired by SimCity. Its focus is public
resource management, city administration and contemporary metropolitan problems. The simulation is
headless-first and currently uses TypeScript with deterministic aggregate systems; rendering and UI are
scaffolded but intentionally out of scope so far.

The project models most residents as household cohorts. A small observational subset of individually
tracked citizens can be activated around important events, policies, organizations or inspections.

## Current sprint

**Sprint 18 follow-up — Citizen data, purposeful destinations, and UI inspection**

The active work is now focused on making the small individually tracked citizen subset
understandable and traceable in the map UI. Restart the backend after simulation-model changes so
citizens are rebuilt from the current Nemotron-derived sample pool.

## Current implementation snapshot

Completed:

- `scripts/start.sh` starts backend and frontend together, writes service logs, and maintains
  `STARTUP_BACKLOG.md` for startup failures.
- The isometric renderer uses the current sprite sheet, removes red/pink chroma-key bleed, anchors
  sprites to tile bottoms, and renders roads with distinct asphalt plus adjacency-aware markings.
- Ambient traffic (`frontend/src/lib/trafficSystem.ts`) uses a shared road graph and preserves car
  progress when roads are edited. Buildings do not rebuild traffic.
- Active Level-3 citizens have backend-owned home/work tiles and commute markers in
  `frontend/src/lib/citizenTransit.ts`. Citizen activity is preserved when another citizen is
  activated or when buildings/roads are edited; only a new simulated day changes commute direction.
- Citizen clicking uses the Inspector tool and shows identity, district, Nemotron profile fields,
  activation cause/problem, home/work, shift, and workplace classification.
- The top HUD metrics are shortcuts: population opens active/inactive citizens, approval opens
  opinion, and time/treasury open the city panel. Clicking the same shortcut again closes it.
- Minimap is visible by default on the right, draggable, clickable for camera movement, and hideable.
- Simulation clock displays `HH:MM`, with speed controls `1×`, `2×`, `4×`, and `8×`.

Recent citizen-data fix:

- `content/citizens/sample_pool.json` already contains education, household type, municipality,
  region, language and rich interests from the Nemotron preparation pipeline.
- `src/simulation/citizens/index.ts` now copies those fields into each citizen, adds `districtId`,
  and classifies work destinations from occupation/interests (government, commerce/mall, farm, or
  industry). Existing map types are used as temporary spatial fallbacks because dedicated
  government/mall/farm building types do not yet exist.
- The inspector formats numeric vectors to two decimals. If an old running backend still shows `—`
  for these profile fields, stop it and restart with `./start.sh`.

Verification baseline:

- `node --test test/**/*.test.ts`: 3/3 passing.
- Modified frontend files have no targeted TypeScript errors. The repository still has a known
  unrelated TypeScript configuration error for backend `.ts` import extensions when invoking the
  frontend compiler across the whole project.

Next recommended steps:

1. Restart and inspect `centro-citizen-1` to confirm the full Nemotron profile appears through
   `/api/state`, not only in the frontend.
2. Add explicit destination metadata (`workplaceType` and a stable destination tile) to the citizen
   inspector/minimap and verify occupation-to-destination mappings with tests.
3. Introduce dedicated government, mall and farm tile/building types only when authorized; keep
   the current zone fallback until renderer assets and simulation zoning rules exist.
4. Add focused tests for profile field preservation, destination classification, and activation
   not resetting existing citizen-trip progress.
5. Run a real browser verification: activate two citizens, confirm both markers move, add a building,
   add a road, and confirm neither marker nor ambient traffic restarts.

## Sprint 18 — Purposeful citizen movement

## Sprint 18 — Purposeful citizen movement

Implemented the first home-to-work commute layer for the existing active Level-3 citizen subset:
- Added backend `homeTile` and `workTile` assignments to individually active citizens, selected from their district's residential and commercial/industrial tiles.
- Exposed citizen commute assignments through `/api/state` alongside the existing citizen state.
- Exported the shared road graph and BFS route finder from `frontend/src/lib/trafficSystem.ts`.
- Added `citizenTransit.ts`, which routes active citizens over the shared road network and reverses commute direction on each simulation day.
- Citizen markers are visually distinct from traffic cars and emit periodic real-coordinate transit snapshots for verification.
- Cohorts and inactive Level-2 citizens remain aggregate/unmoved.

Known simplification: occupations map to industrial work for production/manufacturing roles and commercial work otherwise; school, hospital and other trip purposes are not modeled.

Completed in this sprint:
- **Coordinate math** (`frontend/src/lib/isoMath.ts`): Implemented `gridToIso` and `isoToGrid` transforms adapted from `isometric-city`'s `gridToScreen`/`screenToGrid` (MIT). Standard 2:1 isometric ratio — tile diamond 64 × 32 px.
- **Isometric renderer** (`frontend/src/lib/isoRenderer.ts`): Sprite-based tile drawing using the `sprites_red_water_new.png` sprite sheet (copied from `isometric-city/public/assets/`, MIT). Implements diamond fills for terrain (grass, road, sand, tree, bridge), animated-water fallback via `water.png`, building/zone sprites from the 5×6 sprite sheet, and a red tint overlay for districts in crisis.
- **Depth-sorting** (painter's algorithm in `CanvasMap.tsx`): Tiles are rendered back-to-front ordered by `col + row` sum, ensuring foreground tiles correctly overlap background tiles in isometric perspective.
- **`CanvasMap.tsx`** fully rewritten (~150 lines): Camera pan/zoom preserved, mouse click now uses `isoToGrid()` for accurate screen→grid hit-testing, hover highlight draws an isometric diamond outline.
- **Assets copied**: `frontend/public/sprites/tiles.png` (8.3 MB) and `frontend/public/sprites/water.png` (0.9 MB), both served correctly by Next.js static.
- **`THIRD_PARTY_LICENSES.md`** updated to explicitly list the sprite files sourced from `isometric-city` and the adapted coordinate math.
- All 5 backend tests pass — no simulation logic was touched.

**Sprint 15 — Full Spanish localization (UI text)**

Completed in this sprint:
- Audited all React components under `frontend/src/` for English strings.
- Created `frontend/src/lib/labels.ts` — lightweight centralized translation map with a `t(key)` function.
- `Dashboard.tsx` updated: service labels (`water→Agua`, `electricity→Electricidad`, `waste→Residuos`, `safety→Seguridad`), organization types (`UNION→Sindicato`, `BUSINESS→Negocios`, `CRIMINAL→Criminal`, etc.), and district IDs (`centro→Centro`, `periferia→Periferia`, `zona_industrial→Zona Industrial`) all pass through `t()`.
- All other components (`HUD`, `Sidebar`, `MainMenu`) confirmed fully Spanish.
- 5/5 backend tests still pass.

**Sprint 14 — Migrate frontend to Next.js/React (foundation for future IsoCity-derived systems)**

Completed in this sprint:
- Migrated the vanilla JS frontend to a Next.js (App Router) + React + TypeScript stack (`frontend/`).
- **`next.config.ts`**: Configured API rewrites to proxy `/api/:path*` to the existing Node backend (`scripts/serve.ts` running on port 3000), keeping simulation logic cleanly separated from UI.
- Ported rendering and UI logic into React components within `frontend/src/components/`:
  - `GameProvider`: Centralizes game state (treasury, tools, UI modal open/close) and fetches from the backend.
  - `CanvasMap`: Holds the 2D rendering loop (using `requestAnimationFrame`) and camera pan/zoom mechanics, keeping the `isometric-city` MIT-licensed pattern.
  - `HUD`, `Sidebar`, and `MainMenu`: Refactored from `chunk_*.js` into stateless or lightweight React components.
- Added `THIRD_PARTY_LICENSES.md` crediting the `isometric-city` project (MIT) for the architectural approach.
- Updated `package.json` with a new `dev` command that runs both the Node backend and Next.js frontend concurrently.
- All 5 headless backend tests passed. State correctly persists across page reloads via the backend `/api/save` endpoints from Sprint 13.


**Sprint 13 — Main menu (new city / continue / load / save)**

Completed in this sprint:
- **`scripts/serve.ts`**: Introduced a single-slot in-memory save system. Added `/api/save`, `/api/load`, and `/api/save/exists` endpoints. Refactored `/api/reset` to optionally take a specific random seed for map generation.
- **`src/simulation/scenario/index.ts`**: Introduced `serialize()` and `deserialize()` to save/restore the dynamic simulation state (city, cohorts, citizens, clock day, opinion footprint log) seamlessly.
- **`src/simulation/scenario/map.ts`**: Updated `generateInitialMap` to accept a random seed.
- **`js/chunk_10.js`** (new, 69 lines): Built a main menu overlay UI that injects over the canvas upon load. Hooks to the new server endpoints. Checks `/api/save/exists` on load to grey out "Cargar partida" if no backend save exists. "Continuar" closes the overlay.
- **`components/main_menu.html`**: A clean, modular, semi-transparent overlay UI following the design aesthetics of Metropolica.
- No local storage was used; the Node server remains the single source of truth for the active run and the saved snapshot.

**Sprint 12 — Backend as single source of truth for map layout (remove localStorage)**

Completed in this sprint:

- **`src/simulation/models.ts`**: Introduced `TileState` type and extended the `District` interface to hold an array of `tiles`. This aligns with the rule of keeping data structures nested within existing simulation boundaries.
- **`src/simulation/scenario/map.ts`**: Ported the entire procedural map generation logic (`initTileMap`) from the frontend into a standalone server-side function, which is now invoked in `ScenarioRunner`.
- **`src/core/commands/index.ts`**: Updated `PlaceZoneCommand` and `DemolishTileCommand` to include `col` and `row` coordinates so the server knows exactly where edits occur.
- **`src/simulation/districts/zoning.ts`**: Modified `ZoningLoop` to explicitly search and mutate the `tiles` array on the targeted district, ensuring real-time mapping consistency.
- **`js/`**: Removed all `localStorage` logic that cached the layout (specifically stripping `saveMap()`). 
- **`js/chunk_7.js`** (`fetchState`): Now extracts the current tile map directly from the backend API payloads (via `simState.districts.tiles`) and dynamically patches the frontend `tileMap`.
- Refactored `initTileMap` entirely out of `chunk_1.js` since generation is purely server-side now. Re-wired the Reset button to call `/api/reset` exclusively.
- All 5 tests passed; reloading the page pulls authoritative map state strictly from `/api/state`.

*(Note: The `localStorage` caching introduced in a previous unplanned step has been formally reverted, consolidating truth back to the headless simulation server).*

  | Zone type | Simulation field nudged | Rationale |
  |-----------|------------------------|-----------|
  | `zone-r`  | `district.population += 8` | Housing capacity proxy; same field EconomyLoop reads |
  | `zone-c`  | `district.economy.employment += 0.005` (max 0.98) | Commercial activity creates jobs; same field crime formula reads |
  | `zone-i`  | `district.economy.averageIncome += 50` | Industrial wage lift; same field household tick reads |
  | `park`    | `district.social.trust += 0.01` (max 1.0) | Green space / social cohesion proxy |
  | `power`   | `district.services.electricity.capacity += 500` | Reuses UtilityState.capacity that UtilitiesLoop already manages |
  | `road`    | no direct simulation field | Infrastructure; impact tracked only on tile map |
  | `demolish`| `district.population -= 4` (min 0) | Partial reversal of zone-r proxy |

- **`src/simulation/scenario/index.ts`**: `ZoningLoop` instantiated alongside the other system loops; wired to the shared `CommandDispatcher`.
- **`js/chunk_4.js`** (`placeTile`): Now `async`; dispatches `PLACE_ZONE` or `DEMOLISH_TILE` via the existing `postCommand()` API layer. Optimistic UI check uses `simState.treasury` (real snapshot) instead of a local copy. `localTreasury` removed from this path entirely.
- **`js/chunk_4.js`** (`updateTreasuryDisplay`): Reads `simState.treasury` — no local variable.
- **`js/chunk_1.js`**: `localTreasury` global variable removed. Comment documents the design intent.
- **`js/chunk_7.js`** (`fetchState`): Removed the `localTreasury` sync logic; `simState` is the single source of truth for all HUD values.
- **`js/chunk_2.js`** (`drawTile`): Fixed road visual orientation. Added `isRoad` neighbor sampling (col, row) so road dashes map horizontally, vertically, or as cross intersections dynamically. Bridges follow E-W water orientation.
- **`js/chunk_7.js`** and **`js/chunk_4.js`**: Implemented map persistence (`saveMap()`) in browser cache (`localStorage`). Map autosaves when placing tiles or natural growth, and loads automatically on refresh. The "Restart" button correctly clears the cache.
- All 5 existing tests pass (`node --test test/**/*.test.ts`). Smoke test confirmed treasury deduction and population nudge via dispatched commands.

Architecture boundary respected: `src/simulation/districts/zoning.ts` imports only from `core/` and `simulation/`; no imports from `rendering/`, `ui/`, or `js/`.

## Sprint history

- **Sprint 0:** repository scaffold, deterministic clock, command dispatcher, basic City/District types.
- **Sprint 1:** household cohorts, economy aggregation, taxation and treasury loop.
- **Sprint 1.5:** treasury/tax audit and weekly-income diagnostics.
- **Sprint 2:** water/electricity capacity, coverage, investment and decay.
- **Sprint 3:** crime risk, corruption risk and policy levers.
- **Sprint 4:** gangs, contractor networks, organization lifecycle and economic suppression.
- **Sprint 5:** public opinion through social media, newspapers, word of mouth and press conferences.
- **Sprint 6:** authored `Ciudad dividida` scenario, scenario runner and console harness.
- **Sprint 6.5:** opinion balance audit, recovery footprints, channel tuning and a winning replay.
- **Sprint 7A & 7B:** Nemotron integration, citizen routines, cohort feedback loops, and web dashboard.
- **Sprint 8:** Dashboard state exposure — organizations panel, corruption dial, footprint log, opinion channel breakdown, citizen trigger detail, treasury weekly income.
- **Sprint 9:** First rendering slice — static pixel-art district grid via Canvas 2D (`src/rendering/`), pure layout math with unit tests, canvas mount in web dashboard.
- **Sprint 10:** Transitioned to full-screen interactive game map, procedural tile generation, interactive build tools, animated pedestrians, HUD transition, and extreme modularization of frontend codebase.
- **Sprint 11:** Wired frontend build tools to real simulation — new `PLACE_ZONE`/`DEMOLISH_TILE` commands, server-side treasury validation, `ZoningLoop` applying zone effects to simulation fields, `localTreasury` removed in favour of `simState.treasury`.

## Repository structure

```text
index.html       Web UI entry point.
scripts/         
  serve.ts       Native HTTP simulation API and static assets web server.
css/             Modularized CSS styles (base, components, hud, modals).
js/              Modularized frontend engine (map, camera, entities, render, input, ui, api, main).
components/      HTML partials for the UI (toolbar, dashboard).
src/
  core/
    clock/       Deterministic daily/weekly/monthly simulation clock.
    commands/    Typed player-command dispatcher; state changes cross this boundary.
    random/      Seeded deterministic randomness.
  simulation/
    models.ts    City, district, utility, social and organization state types.
    households/  Aggregate household cohorts and pure needs/stress calculations.
    economy/     District aggregation, household/economy loop and treasury updates.
    utilities/   Generic water/electricity capacity, demand, coverage and decay.
    social-risk/ Crime and corruption formulas plus social policy commands.
    organizations/ Gangs and contractor networks with shared lifecycle logic.
    opinion/     Event footprints, channel transforms and approval aggregation.
    citizens/    Small Level-2/Level-3 citizen subset and activity scoring.
    scenario/    Generic scenario initialization and win/loss evaluation.
  content/
    scenarios/   Declarative scenario definitions, including Ciudad Dividida.
    citizens/    Static offline citizen sample pool and attribution notes.
    policies/    Declarative policy-content placeholder.
    events/      Declarative event-content placeholder.
    occupations/ Declarative occupation-content placeholder.
  rendering/     Backend Canvas 2D static district grids.
  ui/            UI placeholder panels, maps, reports and notifications.
test/
  clock.test.ts         Deterministic clock tests.
  citizens.test.ts      Citizens integration, activation lifecycle, and CPU performance tests.
  headless-simulation.ts Cross-system diagnostic simulation.
  play-scenario.ts      Console-playable Ciudad Dividida harness.
content/
  citizens/sample_pool.json  Checked-in citizen flavor profiles.
```

## Sprint 17 — Basic vehicle traffic

- Added frontend-only ambient traffic in `frontend/src/lib/trafficSystem.ts`.
- Maintains a fixed pool of eight generic cars, interpolates them between adjacent `road`/`bridge` tiles, turns at intersections, and respawns at another road node when a path ends.
- `CanvasMap.tsx` updates and draws traffic in its existing animation loop; the road graph is rebuilt from the live `tileMapRef`, so roads added through the build tool are picked up after the next tile refresh.
- No pedestrians, traffic lights, vehicle classes, commands, economy effects, or core/simulation imports were added.

## Important architecture rules

1. `core/` and `simulation/` must remain headless. They must never import from `rendering/` or `ui/`.
2. Cohorts are the authoritative population model. Individual citizens are a small Level-2/Level-3 subset,
   never a full-population simulation.
3. Content belongs in declarative files under `content/`; system logic should interpret generic data.
4. The clock is deterministic and multi-scale. Systems subscribe to daily, weekly or monthly ticks;
   do not create parallel timers.
5. Player actions enter through typed commands. UI or harness code must dispatch commands rather than
   mutate simulation state directly.
6. Events and footprints need traceable causes. Avoid unexplained randomness.
7. Nemotron data is synthetic and may contain stereotypes or unverified associations. It may provide
   profile variety and flavor only. It must never derive crime propensity, corruption propensity or
   political leaning from demographic or textual attributes.
8. Shared formulas are reused rather than copied between cohorts, households and citizens.
9. Keep files around 200 lines or fewer. Split by responsibility when a file grows beyond that signal.
10. After functionality works, perform a short refactor pass before moving on.

## Useful commands

The repository uses Node's TypeScript execution directly; the local npm wrapper may not be available in
every environment.

```bash
node --test test/**/*.test.ts
node test/headless-simulation.ts
node test/play-scenario.ts
node scripts/prepare-citizens.ts <local-huggingface-export.json>
```

Equivalent package scripts are available where npm is configured:

```bash
npm test
npm run simulate
npm run play
npm run typecheck
```

## Current scope boundaries

Do not add full-population agents, Nemotron runtime calls, social graphs, generative narrative, new scenarios, elections, pollution or new causal power for citizens unless a future sprint explicitly authorizes it.

Likely next decisions are: connecting the frontend building mechanics directly to the backend simulation (converting map edits into simulation state modifiers), or deepening citizen agency.
The cohort-first simulation model and ethical dataset boundary remain hard constraints.

## Agent checklist

Before changing code:

1. Read `.claude/skills/metropolica-design/SKILL.md` completely.
2. Read this file and identify the current sprint and scope boundary.
3. Search for existing formulas and interfaces before adding parallel logic.
4. Check imports to preserve simulation/rendering/UI separation.
5. Keep new files small and run the headless tests after the change.
