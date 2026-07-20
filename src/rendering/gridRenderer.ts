/**
 * gridRenderer.ts — Public entry point for the Sprint 9 static district grid.
 *
 * Wires together gridLayout (math) and gridPainter (canvas) and exposes a
 * single `renderDistrictGrid()` function suitable for direct use from
 * the browser dashboard (index.js).
 *
 * Architecture rule #1: does NOT import from simulation/ or core/.
 * Read-only: receives state snapshots, never mutates them.
 */

export { computeGridLayout } from "./gridLayout.ts";
export type { GridLayout, GridCell } from "./gridLayout.ts";
export { paintGrid } from "./gridPainter.ts";
export type { DistrictSnapshot } from "./gridPainter.ts";

import { computeGridLayout } from "./gridLayout.ts";
import { paintGrid }         from "./gridPainter.ts";
import type { DistrictSnapshot } from "./gridPainter.ts";

/**
 * Render district snapshots onto an HTML canvas element.
 *
 * This is the convenience façade used by the web dashboard.
 * Same district state in → same pixel output out (deterministic).
 *
 * @param canvas    - Target HTMLCanvasElement (already in the DOM).
 * @param districts - District snapshots from /api/state.
 */
export function renderDistrictGrid(
  canvas: HTMLCanvasElement,
  districts: DistrictSnapshot[]
): void {
  if (districts.length === 0) return;

  const layout = computeGridLayout(32, 24, 16);

  // Resize canvas to match layout exactly (avoids stretching)
  if (canvas.width !== layout.canvasWidth || canvas.height !== layout.canvasHeight) {
    canvas.width  = layout.canvasWidth;
    canvas.height = layout.canvasHeight;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  paintGrid(ctx, layout, districts);
}
