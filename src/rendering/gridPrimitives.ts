/**
 * gridPrimitives.ts — Low-level Canvas 2D drawing helpers and colour palette.
 *
 * Modified for Sprint 9 Micropolis-style tile grid map.
 * Contains tile definitions, color constants, and tile-drawing primitives.
 * Architecture rule #1: no imports from simulation/ or core/.
 */

export interface DistrictSnapshot {
  id: string;
  population: number;
  approval: number;
  social: {
    atRisk: boolean;
    crimeRisk: number;
    trust: number;
    unrest: number;
  };
  services: {
    water:       { coverage: number };
    electricity: { coverage: number };
  };
}

// ── Tile Types ──────────────────────────────────────────────────────────────

export const TILE_GRASS       = 0;
export const TILE_WATER       = 1;
export const TILE_ROAD        = 2;
export const TILE_BRIDGE      = 3;
export const TILE_RESIDENTIAL = 4;
export const TILE_COMMERCIAL  = 5;
export const TILE_INDUSTRIAL  = 6;
export const TILE_POLICE      = 7;
export const TILE_FIRE        = 8;
export const TILE_FOREST      = 9;
export const TILE_POWER_LINE  = 10;

// ── Colors ──────────────────────────────────────────────────────────────────

export const COLOR_GRASS       = "#22c55e";
export const COLOR_GRASS_DARK  = "#15803d";
export const COLOR_WATER       = "#3b82f6";
export const COLOR_ROAD        = "#334155";
export const COLOR_ROAD_LINE   = "#64748b";
export const COLOR_RESIDENTIAL = "#10b981";
export const COLOR_COMMERCIAL  = "#2563eb";
export const COLOR_INDUSTRIAL  = "#d97706";
export const COLOR_POLICE      = "#1d4ed8";
export const COLOR_FIRE        = "#dc2626";
export const COLOR_FOREST      = "#166534";
export const COLOR_WIRE        = "#94a3b8";

// ── Canvas tile painters ─────────────────────────────────────────────────────

export function drawTile(
  ctx: CanvasRenderingContext2D,
  type: number,
  x: number,
  y: number,
  size: number
): void {
  switch (type) {
    case TILE_GRASS:
      ctx.fillStyle = COLOR_GRASS;
      ctx.fillRect(x, y, size, size);
      // Speckles
      ctx.fillStyle = COLOR_GRASS_DARK;
      ctx.fillRect(x + 3, y + 4, 1, 1);
      ctx.fillRect(x + 10, y + 9, 1, 1);
      ctx.fillRect(x + 12, y + 3, 1, 1);
      break;

    case TILE_WATER:
      ctx.fillStyle = COLOR_WATER;
      ctx.fillRect(x, y, size, size);
      // Waves
      ctx.fillStyle = "#60a5fa";
      ctx.fillRect(x + 2, y + 4, 4, 1);
      ctx.fillRect(x + 9, y + 10, 4, 1);
      break;

    case TILE_ROAD:
      ctx.fillStyle = COLOR_ROAD;
      ctx.fillRect(x, y, size, size);
      // Dashed lane marker
      ctx.fillStyle = COLOR_ROAD_LINE;
      ctx.fillRect(x + 7, y + 2, 2, 3);
      ctx.fillRect(x + 7, y + 10, 2, 3);
      break;

    case TILE_BRIDGE:
      ctx.fillStyle = COLOR_WATER;
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = "#475569";
      ctx.fillRect(x + 2, y + 4, size - 4, size - 8);
      ctx.fillStyle = COLOR_ROAD;
      ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
      break;

    case TILE_RESIDENTIAL:
      ctx.fillStyle = COLOR_RESIDENTIAL;
      ctx.fillRect(x, y, size, size);
      // Draw R letter
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.fillText("R", x + 4, y + 12);
      break;

    case TILE_COMMERCIAL:
      ctx.fillStyle = COLOR_COMMERCIAL;
      ctx.fillRect(x, y, size, size);
      // Draw C letter
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.fillText("C", x + 4, y + 12);
      break;

    case TILE_INDUSTRIAL:
      ctx.fillStyle = COLOR_INDUSTRIAL;
      ctx.fillRect(x, y, size, size);
      // Draw I letter
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.fillText("I", x + 5, y + 12);
      break;

    case TILE_POLICE:
      ctx.fillStyle = COLOR_POLICE;
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 7px monospace";
      ctx.fillText("PD", x + 3, y + 11);
      break;

    case TILE_FIRE:
      ctx.fillStyle = COLOR_FIRE;
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 7px monospace";
      ctx.fillText("FD", x + 3, y + 11);
      break;

    case TILE_FOREST:
      ctx.fillStyle = COLOR_GRASS;
      ctx.fillRect(x, y, size, size);
      // Draw tree shapes
      ctx.fillStyle = COLOR_FOREST;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 2);
      ctx.lineTo(x + 3, y + 10);
      ctx.lineTo(x + 13, y + 10);
      ctx.fill();
      ctx.fillRect(x + 7, y + 10, 2, 4);
      break;

    case TILE_POWER_LINE:
      ctx.fillStyle = COLOR_GRASS;
      ctx.fillRect(x, y, size, size);
      // Wire cross poles
      ctx.strokeStyle = COLOR_WIRE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 8, y);
      ctx.lineTo(x + 8, y + size);
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x + size, y + 8);
      ctx.stroke();
      break;
  }
}
