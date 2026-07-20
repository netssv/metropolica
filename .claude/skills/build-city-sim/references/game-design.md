# City-builder design reference

## Product goal

Build an original city-management game where the player lays out a city, responds to demand, keeps services connected, and maintains a sustainable budget. Favor understandable systems and meaningful tradeoffs over maximum realism.

## MVP acceptance criteria

A release is a playable MVP when all items below work together:

1. A generated or predefined tile map opens reliably.
2. Player can pan, zoom, select a tool, preview placement, place, and bulldoze.
3. Roads create a network used by zones and buildings.
4. Residential, commercial, and industrial zones have distinct behavior.
5. Zoned land can develop when road access, demand, and required utilities are present.
6. Construction changes cash and recurring systems change the budget over time.
7. Population and jobs respond to developed buildings.
8. Happiness and demand respond to at least budget, employment, services, and congestion.
9. Player can pause and change simulation speed.
10. Save/load restores a functioning city.
11. UI exposes enough information to understand why growth succeeds or fails.
12. Production build succeeds and core simulation tests pass.

## Suggested first map

- Size: 64 × 64 tiles
- Terrain: mostly buildable land with water or hills as obstacles
- Starting cash: enough for a small road loop, initial zones, and utilities
- Tile scale: renderer-specific
- Simulation speeds: paused, 1×, 2×, 4×

These are defaults, not fixed requirements.

## Core data concepts

### Tile

A tile may contain:

- terrain type
- elevation or terrain cost
- road or infrastructure
- zone
- building footprint reference
- pollution/noise/land-value samples
- utility coverage flags

Avoid encoding every system directly into a single untyped object.

### Zone

Recommended types:

- residential
- commercial
- industrial

Optional later types:

- office
- mixed use
- agricultural
- high density variants

Zone placement marks development intent; it should not instantly create the final building.

### Building

A building definition should contain:

- stable type ID
- footprint
- zone compatibility
- level or density
- residents or jobs
- utility consumption
- tax contribution
- construction/growth constraints
- visual key

### Demand

Use a bounded range such as `-100..100`.

Example drivers:

- Residential: available jobs, housing occupancy, taxes, happiness
- Commercial: population, purchasing power, commercial occupancy
- Industrial: workforce, freight access, industrial occupancy

Smooth demand over time to prevent abrupt oscillation.

### Happiness

Use weighted components rather than one unexplained number:

- employment
- taxes
- utility reliability
- traffic
- pollution
- services
- housing availability

Expose component details in UI or tooltips.

## Economy

Minimum ledger:

- cash
- tax income
- construction spending
- infrastructure upkeep
- service expenses
- net periodic balance

Apply income and recurring expenses on a readable interval, such as each in-game month, rather than every render frame.

Prevent accidental soft locks:

- Warn before severe debt.
- Allow bulldozing or tax adjustments while in debt.
- Consider limited emergency credit or reduced-cost recovery actions.

## Roads and traffic

For MVP, traffic can be aggregate:

1. Treat connected road tiles as a graph.
2. Assign trips between population and job/service destinations.
3. Approximate flow over selected shortest paths or zones.
4. Accumulate congestion by road segment capacity.
5. Feed congestion into happiness, land value, and travel efficiency.
6. Render a heatmap.

Do not begin with thousands of fully simulated citizens and vehicles.

## Utilities

Recommended first utilities:

- electricity
- water

Model each as:

- production capacity
- consumption
- network or radius-based coverage
- shortage state
- operating cost

Coverage must have a visible overlay and a clear explanation when a building cannot develop.

## Progression ideas after MVP

- Fire, police, health, education
- Land value and building levels
- Public transport
- Pollution and noise
- Policies and ordinances
- Loans and bonds
- Weather and disasters
- Scenarios and objectives
- Region or neighboring-city trade
- Modding/data-driven buildings
- Accessibility and localization

Add these only after the core loop is stable.
