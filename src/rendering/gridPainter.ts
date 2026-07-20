/**
 * gridPainter.ts — Canvas 2D painter for the unified 32x24 tile grid map.
 *
 * Translates the aggregate simulation state (districts) into a complete
 * 2D top-down SimCity/Micropolis-style tile map.
 *
 * Architecture rule #1: must not import from simulation/ or core/.
 * Pure rendering; same inputs → same visual output.
 */

import type { GridLayout } from "./gridLayout.ts";
import {
  DistrictSnapshot,
  TILE_GRASS, TILE_WATER, TILE_ROAD, TILE_BRIDGE,
  TILE_RESIDENTIAL, TILE_COMMERCIAL, TILE_INDUSTRIAL,
  TILE_POLICE, TILE_FIRE, TILE_FOREST, TILE_POWER_LINE,
  drawTile
} from "./gridPrimitives.ts";

export type { DistrictSnapshot } from "./gridPrimitives.ts";

// ── Deterministic procedural map generation ─────────────────────────────────

/** Get the district ID that owns a specific coordinate on the 32x24 grid. */
export function getOwnerDistrict(col: number): string {
  if (col < 11) return "periferia";
  if (col < 21) return "centro";
  return "zona_industrial";
}

/**
 * Determine the tile type for a coordinate, based on the current district snapshots.
 */
export function getTileType(
  col: number,
  row: number,
  districts: DistrictSnapshot[]
): number {
  // 1. The River (flows from top-center to bottom-center-right)
  const riverCol = 14 + Math.floor(row / 4) + (row % 2);
  const isWater = (col === riverCol || col === riverCol - 1);

  // 2. Main horizontal highway (row 11)
  const isHighway = (row === 11);

  // 3. District-specific local road layouts
  let isLocalRoad = false;
  if (getOwnerDistrict(col) === "periferia") {
    isLocalRoad = (col === 4 || row === 5 || row === 17);
  } else if (getOwnerDistrict(col) === "centro") {
    isLocalRoad = (col === 17 || row === 4 || row === 18);
  } else {
    isLocalRoad = (col === 26 || row === 6 || row === 16);
  }

  // Combine roads and bridges
  if (isHighway || isLocalRoad) {
    return isWater ? TILE_BRIDGE : TILE_ROAD;
  }
  if (isWater) {
    return TILE_WATER;
  }

  // 4. Determine building/zone placements.
  // We use a deterministic formula based on (col, row) to map out zoning.
  const seed = (col * 37 + row * 13) % 100;
  const owner = getOwnerDistrict(col);
  const snapshot = districts.find(d => d.id === owner);

  // Active density scales with district population
  const population = snapshot?.population ?? 800;
  const densityThreshold = population > 1000 ? 55 : population > 750 ? 45 : 35;

  if (seed < densityThreshold) {
    if (owner === "periferia") {
      // Periferia: Mostly Residential & Forests
      if (seed < 8) return TILE_FOREST;
      if (seed < 12) return TILE_POWER_LINE;
      return TILE_RESIDENTIAL;
    } else if (owner === "centro") {
      // Centro: Dense Commercial, Residential, Police, Fire
      if (col === 15 && row === 8) return TILE_POLICE;
      if (col === 19 && row === 14) return TILE_FIRE;
      if (seed < 15) return TILE_RESIDENTIAL;
      return TILE_COMMERCIAL;
    } else {
      // Zona Industrial: Power lines & Factories
      if (seed < 15) return TILE_POWER_LINE;
      return TILE_INDUSTRIAL;
    }
  }

  // Default terrain
  return (seed % 9 === 0) ? TILE_FOREST : TILE_GRASS;
}

// ── Main Paint loop ──────────────────────────────────────────────────────────

export function paintGrid(
  ctx: CanvasRenderingContext2D,
  layout: GridLayout,
  districts: DistrictSnapshot[]
): void {
  const { cols, rows, cellSize } = layout;

  // Draw base tiles
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const type = getTileType(c, r, districts);
      drawTile(ctx, type, c * cellSize, r * cellSize, cellSize);
    }
  }

  // Overlay district boundaries or "En Crisis" indicators
  districts.forEach(d => {
    if (d.social.atRisk) {
      // Highlight the district columns in red outline
      const startCol = d.id === "periferia" ? 0 : d.id === "centro" ? 11 : 21;
      const endCol = d.id === "periferia" ? 10 : d.id === "centro" ? 20 : 31;
      const x = startCol * cellSize;
      const y = 0;
      const w = (endCol - startCol + 1) * cellSize;
      const h = rows * cellSize;

      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]); // Pulsing/dashed border
      ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
      ctx.setLineDash([]);

      // Draw small crisis tag overlay at the top of the district region
      ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
      ctx.fillRect(x + 10, y + 10, 68, 16);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 8px system-ui, sans-serif";
      ctx.fillText("CRISIS LOCAL", x + 14, y + 21);
    }
  });
}
