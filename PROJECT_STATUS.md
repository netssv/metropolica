# Metropolica — Project Status

## What is this project?

Metropolica is a browser-oriented urban management simulation inspired by SimCity. Its focus is public
resource management, city administration and contemporary metropolitan problems. The simulation is
headless-first and currently uses TypeScript with deterministic aggregate systems; rendering and UI are
scaffolded but intentionally out of scope so far.

The project models most residents as household cohorts. A small observational subset of individually
tracked citizens can be activated around important events, policies, organizations or inspections.

## Current sprint

## Authorized workstreams — commute delay Phase 1 + dedicated hospital/mall-government Phase 1

**Design decisions before implementation:**

- Workstream A defines an abnormally long active route as more than
  `max(12, 2.5 × Manhattan(homeTile, workTile))` route nodes. The result is deterministic and
  derived from the existing citizen transit trip; it is cosmetic/Inspector-only in Phase 1.
  It is exposed as `commuteDelayState` in the view/Inspector data rather than overwriting
  `currentProblem`, which already carries inspection, organization and crisis causes. It does not
  affect routine choice, opinion, approval, social-risk or crime.
- Workstream B uses an optional `TileState.specialty` subtype with values `hospital` and
  `mall-government`, while retaining `type: bldg-c`/`zone-c`. This preserves existing EconomyLoop,
  proximity and commercial zoning behavior and limits downstream changes to coverage, workplace
  classification and Canvas 2D rendering. Placement reuses `PLACE_ZONE`, the existing grass
  validation and the existing commercial-zone cost, with the specialty carried on the typed command.
- Hospital supply is sourced from dedicated hospital tiles only. Bomberos, ocio and telefonía remain
  on the documented shared-commercial fallback and are explicitly deferred to a future checkpoint.
  The renderer reuses the existing procedural tier system; no new tile category or external art
  pipeline is introduced.

**Phase 1 implementation status and verification:** Workstream A now derives `commuteDelayState`
(`inactive`, `normal`, or `delayed`) from the active route on the existing transit cadence. It is
shown in the citizen Inspector and is not read by opinion, approval, social-risk or crime code;
the focused tests cover the strict threshold, deterministic repeated reads, day changes and Level-3
driving/Level-2 non-driving behavior. Workstream B carries the two specialties through `PLACE_ZONE`,
map generation and `/api/tilemap`, keeps the underlying `bldg-c`/`zone-c` category, renders both with
Canvas 2D procedural tier sprites, routes hospital coverage only to hospital tiles, and lets hospital
and government occupations select the dedicated destinations. A manual Playwright run placed both
specialties successfully (HTTP 200) and the inspected Canvas 2D map showed their distinct dedicated
building treatment; the Inspector showed a Level-3 driving citizen with `Commute: Normal`. The run
did not encounter a delayed route, so delayed-state visual confirmation remains pending rather than
being marked as observed.

Phase 2 of Workstream A (commute delay affecting opinion/approval/social risk) remains a separate
authorization checkpoint. Bomberos, ocio and telefonía remain on the generic commercial fallback and
require a separate future checkpoint.

### Task — visual asset audit follow-up

- [x] Verify the Canvas 2D asset path: `isoRenderer.ts` uses the procedural residential, commercial
  and industrial tier renderers plus the existing Central/Parque drawings; hospital and
  mall-government use the new specialty procedural renderer. The current Playwright screenshot
  showed the active map and distinct specialty building treatment after both placements returned
  HTTP 200.
- [x] Verify repository assets: `frontend/public/sprites/tiles.png` and `water.png` exist in `HEAD`
  and are referenced by `isoRenderer.ts`, but are absent in the current dirty worktree; restore or
  intentionally replace them before relying on the sprite-sheet/water path in a clean checkout.
- [ ] Future visual check: inspect all three tiers for hospital and mall-government at normal and
  zoomed-out Canvas 2D scales, then record screenshots. This remains renderer verification only; no
  new tile/building categories are authorized.
- [ ] Keep the documented fallback gap visible: bomberos, ocio and telefonía still use the generic
  developed-commercial accent/coverage fallback and need separate authorization for dedicated art.

### Verification follow-up — root typecheck and commute-delay trigger

- Root cause fixed: the root `package.json` had no root `typescript` dependency or lockfile and its
  `typecheck` script incorrectly delegated to the frontend installation. Root `typescript` and
  `@types/node` are now declared in `devDependencies`, `package-lock.json` is present, and the
  commands are separated into `npm run typecheck` (root project) and `npm run typecheck:frontend`.
  `./node_modules/.bin/tsc --noEmit -p tsconfig.json` passes with zero diagnostics.
- The deterministic focused test crosses the existing threshold: home `(0,0)`, work `(4,0)` gives
  `max(12, 2.5 × 4) = 12`; route length `12` is `normal`, while route length `13` is `delayed`.
  Repeated reads remain `delayed`, and the regression assertion confirms approval `0.8` and crime
  risk `0.1` remain unchanged. This is the verified trigger evidence; the prior browser run only
  showed `Commute: Normal`, so no Inspector claim for a naturally delayed citizen is being made.

## Ambient vehicle removal and Canvas 2D asset check

Ambient traffic vehicles and their erratic movement have been removed from the active renderer:
`useMapRenderer.ts` no longer creates or advances the traffic runtime, while the citizen transit
renderer remains active. The compatibility traffic handles remain inert so existing interaction
code cannot create environmental vehicles. The Canvas 2D visual path still draws the existing
terrain sprite sheet/water fallback through `isoRenderer.ts`, procedural residential/commercial/
industrial tiers through `buildingSprites.ts`, and the existing Central/Parque silhouettes; no new
tile or building types were introduced. The prior traffic-light visual verification is superseded
for ambient vehicles: signal/spacing behavior is no longer part of the active map, and the
Playwright aid remains available only for future Canvas 2D/citizen rendering checks.

## Traffic/signal regression and asset audit — status

**Root cause:** the Sprint 21 traffic runtime was removed from the active refactor path. Commit
`d9708b8` still had `createTrafficSystem`, `drawSemaphores()` and the `traffic.updateAndDraw()`
call in `CanvasMap.tsx`; the current `useMapRenderer.ts` instead exposed a permanently empty traffic
wrapper and never advanced or drew traffic. The signal state helpers remained in `trafficSystem.ts`,
which made the regression look like a signal-state problem even though the render/update path had
been dropped.

**Fix:** restored the frontend-only runtime as `frontend/src/lib/trafficRuntime.ts` and connected it
from `useMapRenderer.ts`. It reuses `trafficSystem.ts`'s graph, route and directional signal helpers,
draws separate horizontal/vertical heads, preserves cars across road-graph rebuilds, and keeps all
vehicle kinds deterministic. Same-segment vehicles now enforce a minimum progress gap; red signals
hold a vehicle at `0.72` progress on the incoming tile segment, before the intersection boundary,
and release it only when the existing axis signal is green. No simulation state, command or economy
effect was added. Runtime and map-renderer files remain under 200 lines.

**Asset inventory:** procedural residential, commercial and industrial tier 0/1/2 renderers are
currently drawn by `isoRenderer.ts`; `drawPowerPlant()` and `drawPark()` are also wired and drawn in
their existing Central/Parque slots. The coded vehicle palette variants are private car, taxi, bus,
fire truck, police, ambulance and VIP; the restored runtime selects them deterministically across
the existing ambient pool. `frontend/public/sprites/tiles.png` and `water.png` are present in
`HEAD` and referenced by `isoRenderer.ts`, but are deleted in the current dirty worktree, so their
live availability is a repository-state gap rather than a new asset implementation. The documented
Phase 1 gap remains: hospitales, bomberos, ocio and telefonía use the shared developed-commercial
placeholder for coverage/accent supply; no new building or tile types were added.

**Verification:** Playwright is installed only in `frontend.devDependencies`; the manual,
throwaway `frontend/scripts/verify/traffic-visual-check.ts` is not wired into tests, CI or builds.
It selected Tiny, clicked “Empezar de cero”, waited for the active map and captured four frames in
`/tmp/metropolica-traffic-1.png` through `-4.png`. I inspected all four screenshots: the map was
active, separate horizontal/vertical signal heads were visible at the road intersections, their
lit red/green states changed between frames, traffic vehicles remained visibly separated on the
same approaches, and red-phase vehicles were stopped on the incoming road before the intersection
tile rather than inside it. No visual overlap or mid-intersection stop was observed in this pass.
Keep the Playwright aid for future visual checks; it remains manual and disposable rather than a
required project test.

## Stabilization and verification sprint — status

**1. TypeScript configuration:** complete. The root `tsconfig.json` now uses `ESNext` with
`Bundler` resolution and `allowImportingTsExtensions`, plus the local Node type root. The root
headless source check and the frontend Next.js check both pass with the local TypeScript binary in
one verification sequence; the former extension-resolution failure is resolved.

**2. Live browser/API verification:** partially complete with recorded limits. Outside the sandbox,
the backend and Next frontend responded successfully on ports 3000/3001. API resets returned the
five expected non-square dimensions: Tiny 24×18, Small 48×36, Big 96×72, Very big 128×96 and
Enormous 160×120. Save/load returned HTTP 200 for every size, and the Very big tilemap returned
12,288 tiles. Existing headless/transit tests cover non-square routing, road edits preserving trip
state and first-arrival consumption dispatch; however, direct visual confirmation of minimap
dragging, rendered traffic, business accents and the browser-visible first-arrival event was not
possible because this environment has no browser automation surface. The launcher itself cannot
bind ports inside the sandbox (`EPERM`); an external server was already occupying the ports during
the API checks.

**3. Citizen destination metadata:** complete and verified. `workplaceType`, stable `workTile`,
`commercialTile` and `refuelTile` are preserved through reassignment and simulation ticks, and the
Inspector/API exposes the metadata after activation. Focused tests cover occupation classification,
profile preservation, stable destination assignment and activation preserving an in-progress trip.

**4. Restart-and-inspect:** complete through a clean `/api/reset` followed by `/api/inspect` for
`centro-citizen-1`. The state response included the Nemotron-derived age, occupation, education,
skills, aspirations and traits; activation then returned `workplaceType: comercio / mall`, home and
work tiles, and the derived routine.

**5. Final verification:** complete. All 12 test files pass, including the focused destination
metadata tests; `node test/headless-simulation.ts` completes successfully; root and frontend
TypeScript checks pass; and `git diff --check` reports no whitespace errors. The root config includes
the modern frontend sources while excluding the intentionally legacy vanilla compatibility modules
already excluded by the frontend config. A short refactor pass kept the destination logic in its
existing classification/destination modules and exposed only a small transit progress diagnostic
needed by the activation-preservation test.

**Next scope checkpoint proposal — no implementation authorized:** prioritize (c), deepening citizen
agency through the existing commute-delay backlog. It is the smallest causal extension and can remain
citizen-subset-only, but it requires a precise threshold, affected personal field and explicit
decision about whether the result is Inspector-only or feeds approval/social risk. Option (a), Phase
2b service coverage affecting crime/social risk, would connect an already validated aggregate signal
to Sprint 3 and improve emergency-service pressure modeling, but it carries the greatest risk of
feedback loops and balance regressions. Option (b), Phase C treasury-funded infrastructure/employment
feedback, would make the new treasury expenses strategically consequential and deepen the economic
loop, but it risks negative-treasury spirals and requires a clear recourse/floor design first.

## Scope authorization — service coverage affects approval (Phase 2a) and social-risk (Phase 2b, future)

Authorized by Rodrigo and formalized before implementation, in phases:

**Phase 2a — authorized:** low service coverage reduces district approval through the existing
opinion/approval aggregation system (Sprint 5). Service weights are based on social criticality:

- **Critical tier:** agua, electricidad, seguridad, hospitales, bomberos. Coverage shortages have
  a strong, meaningful approval impact because these are survival and safety services.
- **Convenience tier:** internet, telefonía, residuos, ocio, gasolina, supermercado. Shortages
  nudge approval down mildly and must not dominate the result.

The effect must be deterministic, reuse the existing approval/opinion pathway, and remain
one-directional: coverage affects approval; approval must not reduce coverage or create a runaway
feedback loop.

**Phase 2b — not yet authorized:** low coverage of seguridad, hospitales, or bomberos may later
increase the existing social-risk/crime fields (Sprint 3), but only after a separate authorization
checkpoint and Phase 2a validation in play. Convenience-tier services never affect crime.

Constraints for both phases: no new randomness; reuse existing opinion/social-risk modules and
fields; district-aggregate effect only; no citizen-level state changes; keep affected files at or
under approximately 200 lines.

**Phase 2a status:** implemented in `src/simulation/opinion/index.ts`. The weekly opinion tick now
derives a fresh tier-weighted coverage penalty using a 0.8 threshold and 0.30 maximum penalty,
applies it after existing opinion channels, and removes only the prior coverage penalty before the
next calculation so unchanged coverage remains stable. Phase 2b remains deferred: service coverage
does not affect crime risk or social-risk fields.

## Scope authorization — Phase B: treasury expenses + commercial/industrial revenue integration

Authorized by Rodrigo and formalized before implementation:

The existing weekly `EconomyLoop`/treasury tick may be extended with two integrated effects:

1. **Revenue integration:** `district.economy.commercialRevenue` and
   `district.economy.industrialRevenue`, produced by Phase A citizen consumption, feed into
   `taxesCollected` alongside existing income-tax revenue. Shopping and refueling must therefore
   increase treasury through the existing weekly economy path, not only affect wages or district
   bookkeeping.
2. **Recurring expenses:** weekly treasury outflows may be added for:
   - Infrastructure maintenance proportional to placed infrastructure already represented by
     existing tile/district state: calles, parques and centrales eléctricas.
   - Public-service salaries proportional to offered coverage for agua, electricidad, seguridad,
     hospitales and bomberos. Higher coverage costs more to maintain.

The cadence must match `taxesCollected`, producing one coherent weekly balance:

`weekly treasury change = taxes + commercial/industrial revenue - maintenance - service salaries`

Constraints: deterministic; no new randomness or simulation entities; reuse existing tile, coverage
and economy fields; affected files at or under approximately 200 lines. The implementation must
also prevent an unrecoverable negative-treasury spiral through a floor or another clear signal;
the exact recourse mechanism remains a required proposal decision before implementation.

## Scope authorization update — driving citizen count increased

Authorized by Rodrigo; supersedes the original 8-citizen cap. The concurrent driving/active
Level-3 pool may increase to a benchmarked value in the 30–50 range, selected from measured
CPU, memory and frame-time cost. It remains a bounded deterministic pool, not one citizen per
resident/cohort and not full-population simulation. Existing routine and simulation-causality
constraints remain unchanged.

**Driving pool scale phase:** deterministic startup promotion now activates 30 Level-2 citizens.
Selection remains global and ordered; if fewer than 30 candidates exist, all available candidates
are promoted without inventing citizens or requiring equal district quotas.

**Citizen module boundary:** routine/activity, classification, spatial destination, frontend
transit and destination presentation now have dedicated module entry points under
`src/simulation/citizens/` and `frontend/src/lib/citizens/`. Compatibility exports preserve the
existing behavior while consumers migrate to the separated boundaries.

**Single-node arrival fix:** citizen transit now retains a route that resolves to one road node,
marks it as arrived, and renders the citizen at the actual home/work destination tile instead of
dropping the trip. Coverage includes the home-return case.

**Daily state-request stall fix:** citizen routines are cached by citizen signature and simulated
day in `citizenViewState()`. Repeated `/api/state` and `/api/inspect` reads reuse the same routine;
the cache refreshes only when a day or routine-affecting citizen field changes.

**Home activity arrival fix:** unresolved routes now retain an arrival trip and snap the citizen to
the intended home/work tile, with a development warning identifying the citizen and target. Transit
also synchronizes the latest `/api/state` day/hour before movement evaluation, closing the stale
activity window between polling and the render loop.

**Current activity display:** `frontend/src/lib/citizens/activity.ts` is the shared source of truth
for routine category, icon, color and label. The map marker shows a small activity badge and the
Inspector summary shows the same activity prominently; both update from the current routine block
without adding simulation state.

**Smooth HUD clock and control feedback:** the displayed clock now interpolates locally between
backend snapshots using the selected simulation speed, while server state remains authoritative.
Day-jump and speed buttons show a pending active state, disable during the request, and refresh the
HUD after completion.

**Routine cache performance fix:** derived citizen routines are cached by citizen ID, simulated day
and routine-affecting signature. Repeated `/api/state` and `/api/inspect` reads reuse the cached
result; day changes or activation-signature changes recompute it. `+7d`/`+30d` remain synchronous.
Full state serialization remains a known future optimization if profiling shows residual stalls.

## Scope authorization — proximity-based zoning economics

Authorized by Rodrigo before implementation:

- Player-placed Residential, Commercial, and Industrial zones gain deterministic economic effects from tile proximity.
- Residential tiles near commercial/mall tiles receive a positive income/value modifier.
- Residential tiles near industrial tiles receive a negative income/value modifier, representing lower-income housing patterns.
- The effect must apply through `district.economy.averageIncome` or an equivalent per-tile/per-cohort value, reusing existing EconomyLoop and zoning fields rather than creating a parallel economic system.
- Proximity is computed deterministically from the existing tile map and existing zone types; no new randomness is authorized.

This authorization does not cover new tile/building types, new UI, or new citizen-level behavior beyond the already authorized driving, shopping, refueling, and meeting work.

Implementation must proceed in small, independently testable phases with explicit before/after verification of `district.economy.averageIncome`, following the caution used for the CanvasMap refactor and citizen-movement work.

## Scope authorization — informal income floor for high-unemployment cohorts

Authorized by Rodrigo before implementation:

- If formal disposable income (`grossIncome - taxPaid - monthlyCost`) is negative, replace it with a minimum
  informal/subsistence income floor representing activity outside the formal employment model.
- Positive disposable income is unchanged; this applies only to the negative-result case.
- Scope is limited to households/economy. Migration between districts or out of the city, and links between
unemployment/income and crime or social-risk fields, remain unauthorized and separate.

## Backlog — commute-delay citizen state (not yet scoped)

Idea from Rodrigo; not authorized for implementation. Citizens whose home/work or other routine
commute takes abnormally long may eventually receive a personal-state decrease. The affected stat,
whether the effect is cosmetic/Inspector-only or connects to opinion, approval or social risk, and
the definition of “abnormally long” remain undecided. Requires a formal scope-authorization pass
after the current transit and arrival bugs are stable.

**Informal income floor phase:** implemented. `simulateHouseholdTick()` uses 25% of monthly household
costs only when formal disposable income is negative; district aggregation no longer serves as the
economic clamp and retains only a documented non-finite-value guard. Periferia and extreme-unemployment
tests confirm a positive subsistence value while healthy cohorts remain unchanged.

**Proximity economics phase:** the deterministic residential proximity modifier is implemented
through ZoningLoop cache invalidation and EconomyLoop aggregation. Commercial adjacency provides
a distance-decayed bonus and industrial adjacency a corresponding penalty; placement/demolition
recomputes only the affected district cache. The scan is placement-time work, not per-frame work,
but the current nearest-tile implementation is O(residential tiles × candidate tiles) for the
affected district, acceptable for commands but worth profiling on Very big/Enormous maps.

**Proximity income floor fix:** negative Periferia income was traced to the underlying household
disposable-income calculation falling below zero, not to compounded proximity modifiers. The
EconomyLoop still recomputes from fresh weekly outputs and applies the cached modifier once; a
minimum average income of 1 now prevents invalid negative district values. Repeated 30-day-style
aggregation tests confirm the floor is stable. A large treasury increase observed during +30d
was not causally connected to proximity averageIncome; it remains flagged as a separate economy/
tax-loop investigation.

**Zone placement validation:** residential, commercial, and industrial zones now require an
existing grass tile. The authoritative zoning command rejects attempts to overwrite buildings
or place zones on water, sand, roads, parks, trees, or infrastructure without charging the
treasury; coverage includes blocked-building and invalid-terrain cases.

**Phase 1 — Ambient traffic replacement:** anonymous traffic spawning and vehicle identity have
been removed from the frontend. `trafficSystem.ts` now exposes only road graph, routing, and
signal services for citizen transit. Citizen driving promotion is intentionally deferred to
Phase 2, so the map temporarily renders no traffic vehicles.

**Phase 2 — Citizen driving migration:** the former eight ambient slots now promote eight
deterministically selected pool citizens to Level 3 at startup. Citizen transit owns their
movement and rendering; Inspector activation is idempotent for driving citizens and does not
create duplicate records or trips. The project typecheck command now invokes the installed
frontend TypeScript binary directly, avoiding the broken npx wrapper.

**Phase 2 movement/classification fix:** citizenTransit was already called every animation frame;
the apparent freeze came from routine rendering pinning citizens to home/work outside transfer
blocks. It now uses the existing route progress for active citizens every frame. Workplace
classification now distinguishes industry, commerce/mall, government, and health/hospital from
the occupation field, with existing commercial/industrial tiles retained as spatial fallbacks.

**Stable activity destinations:** citizen transit now resolves one home/work target per routine
activity block and simulated day, rebuilds the BFS route only when that activity changes, and
stops at the target instead of reversing indefinitely.

**Distributed citizen destinations:** home and workplace tiles now use a deterministic citizen-id
hash across all matching district tiles. This prevents avoidable same-tile assignment without
adding occupancy/capacity state; a single available tile may still be shared.

**Citizen arrival presentation:** BFS routes still remain road-only, but arrived citizens now render
at their actual home/work tile center with a small deterministic per-citizen offset instead of
stopping at the nearest shared road node.

**Inspector summary/detail view:** the citizen Inspector opens in a compact summary showing identity,
district, occupation, current routine activity and destination. `Ver más` reveals the existing full
profile and routine details; the toggle is local to the selected Inspector instance.

**Sprint 21 follow-up — Directional intersection signals**

Traffic intersections now use coordinated axis-specific signals. Horizontal traffic receives
green/yellow phases while vertical traffic is red, then the phases swap. Vehicles consult the
signal for their actual movement axis before entering an intersection, and the renderer displays
separate, spatially separated heads for the horizontal and vertical directions. Traffic and
citizen movement continue updating in the background when their low-zoom visuals are hidden.

Traffic vehicles now use compact pixel-art variants for private cars, taxis, buses, fire trucks,
police cars, ambulances and VIP vehicles. Variants are assigned deterministically to the existing
ambient traffic pool and share the same road routes, signal rules and background-update behavior.
Selecting an ambient vehicle now shows its variant, route endpoints and current road position,
and the camera follows that vehicle while it moves.

**Sprint 21 — City-size selection and dimension-aware map rendering**

Completed:

- New-city menu now offers five map sizes: Tiny, Small, Big, Very big and Enormous.
- Map dimensions are generated from the selected city size and returned through game state;
  the frontend no longer assumes a fixed `MAP_COLS × MAP_ROWS` grid.
- Isometric camera centering, depth sorting, hover bounds, click hit-testing, minimap scaling
  and minimap dragging all consume the live map dimensions.
- Traffic graph construction and routing use the active map dimensions, including non-square maps.
- Random city creation uses `crypto.getRandomValues()` with a timestamp fallback instead of the
  low-range `Math.random()` seed path.
- The Metropolica brand in the HUD opens the main menu, and the size selector is styled for the
  dark Spanish UI.
- Server reset/state handling now preserves the selected city dimensions so save/load and map
  rendering remain aligned.

Verification: frontend TypeScript compilation passes with `npx tsc --noEmit -p frontend/tsconfig.json`;
the procedural-building follow-up also passes `git diff --check`. Full browser verification should
cover each city size, save/load, minimap navigation and traffic on a freshly started local server.

**Sprint 20 — Procedural pixel buildings with simulation-driven growth tiers**

Building tiles now use code-drawn pixel art in `frontend/src/lib/buildingSprites.ts` rather than
static `isometric-city` building sprites. Residential buildings use house roofs, commercial
buildings use storefront blocks, and industrial buildings use factory blocks and smokestacks.
Each zone has three visual tiers: undeveloped lot, small building, and developed building.
Central power plants now use a blocky substation/power-line silhouette, and Parque tiles use
procedural grass, paths, and trees. Both remain static infrastructure visuals because the current
game state has no separate power-output or park-development tier.
The first-pass tier formula uses district population, average income, and approval; it is applied
in the frontend from existing `/api/state` data and does not mutate simulation state. Terrain and
decorative assets remain credited to `isometric-city` as before.

Follow-up fix: procedural building, power-plant and park renderers now paint the full terrain
diamond before their footprint. No opaque black base or building shadow is drawn; all nine
zone/tier combinations plus Central and Parque therefore remain seated on terrain instead of
revealing the canvas background.

**Sprint 19 — Detailed sprites, render optimization, and traffic/inspection fixes**

Sprint 19 restores the detailed `isometric-city` building art as the default renderer and
keeps performance work in the renderer rather than reducing visual fidelity.

Completed:

- Detailed residential, commercial, industrial and park sprites are decoded once, chroma-keyed
  once, and copied into cached per-sprite canvases before rendering.
- Isometric tiles are culled against the canvas viewport with a margin; the renderer reports
  `[render-benchmark]` samples containing FPS, average frame time, visible tile count, total tile
  count and zoom for before/after verification in the browser console.
- A low-zoom fallback remains only below `0.4`; normal zoom levels use detailed sprites.
- Inspection activation now returns the affected citizen in the `/api/inspect` response and logs
  the resulting level/cause on the backend, making the Activar/Desactivar chain observable.
- Traffic vehicles stop before intersection nodes while the shared signal is red.
- The former red chroma-key fringe pass was removed; it could erase or tint legitimate sprite
  pixels and was the source of the reported red shadow artifact.

Verification note: the frontend compiled successfully during `next build`, but the build worker
exited before completing its final TypeScript phase in this constrained environment. A targeted
TypeScript scan reported no errors in `isoRenderer.ts`, `CanvasMap.tsx`, `trafficSystem.ts`, or
`Dashboard.tsx`. Live API verification was blocked because the sandbox disallows binding port 3000;
the browser console and backend log evidence are available when running `./start.sh` locally.

Road polish remains unchanged because no specific road defect was provided; it needs Rodri's
concrete visual feedback before further changes.

**Sprint 18 follow-up — Citizen data, purposeful destinations, and UI inspection**

The active work is now focused on making the small individually tracked citizen subset
understandable and traceable in the map UI. Restart the backend after simulation-model changes so
citizens are rebuilt from the current Nemotron-derived sample pool.

## Current implementation snapshot

Completed:

- `scripts/start.sh` starts backend and frontend together, writes service logs, and maintains
  `STARTUP_BACKLOG.md` for startup failures.
- The isometric renderer uses procedural pixel-art buildings for residential, commercial and
  industrial zones, with three growth tiers driven by district population, average income and
  approval. Central power plants and Parque tiles also use procedural silhouettes and decoration.
- Building renderers paint the complete terrain diamond before the footprint, eliminating the
  solid black square/base artifact across all nine zone-tier combinations, Central and Parque.
- The remaining isometric sprite-sheet path removes red/pink chroma-key bleed, anchors sprites to
  tile bottoms, and renders roads with distinct asphalt plus adjacency-aware markings.
- The map generator, frontend canvas, minimap and traffic system share the live city dimensions
  selected from the main menu rather than relying on fixed constants.
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
npm run typecheck:frontend
```

## Current scope boundaries

## Scope authorization — full consumption/business economic loop

Authorized by Rodrigo before implementation, with phased verification:

- Citizen shopping/refuel activities may become economically causal: disposable income funds deterministic consumption,
  the amount credits the destination district's existing commercial or industrial economy aggregate, and that revenue
  may feed the existing `taxesCollected` path into treasury.
- “Businesses” remain existing commercial/industrial zone tiles and district economy fields; no new simulation entities,
  tile types, citizen-level persistent state or randomness are authorized.
- Phase A: deduct a small deterministic shopping/refuel amount from cohort disposable income and credit the destination
  district aggregate. Phase B: include that aggregate in `taxesCollected` and verify treasury growth. Phase C is a
  separate future checkpoint for treasury-funded infrastructure/investment feedback into existing employment/capacity.
- Implementation must reuse routine/, `destinations.ts`, `classification.ts`, EconomyLoop, ZoningLoop and the existing
  proximity/informal-income mechanisms, with each phase independently tested before the next.

## Scope authorization — service coverage with citizen impact

Authorized by Rodrigo before implementation, with a checkpoint between phases:

- Phase 1 may extend the existing `UtilityState`/district-panel coverage pattern beyond Agua, Electricidad,
  Residuos, Seguridad and Internet to services such as gasolina, supermercado, hospitales, bomberos, ocio and
  telefonía, plus other reasonable service categories.
- Phase 1 is display/coverage-only: reuse the existing district services structures, calculations and coverage bars;
  it adds no citizen-level or district-level consequences.
- Phase 2 is not authorized by this entry. Connecting low coverage to approval, social risk/crime or opinion requires
  a separate scope checkpoint after Phase 1 is validated in play.
- No new tile/building types or randomness are authorized; existing gas-station/supermarket visual accents remain
  the available spatial presentation.

**Phase A status:** implemented. `CITIZEN_CONSUMPTION` is validated server-side with a transient
cohort/day/activity cap; shopping and refueling deduct bounded disposable income and credit the
district commercial/industrial revenue aggregates without changing taxes or treasury. Citizen transit
dispatches the command only on the first arrival transition, and developed building tiles receive
deterministic supermarket/fuel accents. Backend/frontend typecheck and 8/8 tests pass. Live browser
verification of arrival dispatch and the visual accents remains required.

**Service coverage Phase 1 status:** implemented. The six new services use the existing
`UtilityState` capacity/demand/coverage calculation and the existing district-panel bars. Gasolina and
supermercado use deterministic developed-building accent supply; hospitales, bomberos, ocio and telefonía
use a documented shared-placeholder fallback from the same developed commercial-building pool. The same
commercial building may therefore contribute to all four fallback coverages simultaneously until dedicated
building types exist. No citizen, approval, opinion, crime, economy or treasury effects were added.

**Procedural residential minimum:** newly generated maps now run a deterministic post-classification pass
that guarantees up to 12 road-adjacent `bldg-r` tiles per district, preserving the existing seeded zone
distribution otherwise. Small maps use every eligible plot and emit a development warning when 12 cannot
be reached; grass fallback remains for old saves and other edge cases. Same-seed, multi-seed, dominance and
small-map degradation tests pass.

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
