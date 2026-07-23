/**
 * Duplex renderer – draws a wide two-unit townhouse spanning 2 adjacent tiles.
 * Matches the Level 2 Sage Green reference art with dual gables, canopy, and concrete steps.
 */
import type { DrawArgs } from './types.ts';
import { PROCEDURAL_DETAIL_ZOOM } from './constants.ts';
import { ISO_TILE_W, ISO_TILE_H } from '../isoMath.ts';
import {
  DUPLEX_PALETTE,
  drawFacadeDoor,
  drawFacadeWindow,
  drawFacadeCanopy,
  drawFacadeSteps,
} from './duplexRenderUtils.ts';
import { drawDuplexRoof } from './duplexRoofUtils.ts';

export function drawDuplex(args: DrawArgs, direction: 'horizontal' | 'vertical' = 'horizontal') {
  const { ctx, px, py, zoom, night = false, project, tileCol, tileRow } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return;

  const TW = ISO_TILE_W * zoom;
  const TH = ISO_TILE_H * zoom;

  // Tile A (anchor) & Tile B (partner) projected origins
  const pA = project && tileCol != null && tileRow != null
    ? project(tileCol, tileRow)
    : { x: px, y: py };

  const pB = project && tileCol != null && tileRow != null
    ? project(tileCol + (direction === 'horizontal' ? 1 : 0), tileRow + (direction === 'vertical' ? 1 : 0))
    : { x: px + (direction === 'horizontal' ? TW / 2 : -TW / 2), y: py + TH / 2 };

  // Coordinates of 2-tile front facade ground line (SE edge)
  const x0 = pA.x + TW / 2;
  const y0 = pA.y + TH;
  const x1 = pB.x + TW;
  const y1 = pB.y + TH / 2;

  // SW Side Wall ground line (lit face)
  const swX0 = pA.x;
  const swY0 = pA.y + TH / 2;

  const height = 26 * zoom;
  const peak   = 10 * zoom;
  const baseH  = 2  * zoom;
  // depthX/depthY = TW/2, TH/2 so the building back-edge aligns with
  // the top vertices of tile A and tile B — exact 2-tile footprint.
  const depthX = TW / 2;
  const depthY = TH / 2;

  const fY0 = y0 - baseH;
  const fY1 = y1 - baseH;
  const swY0B = swY0 - baseH;

  // 1. Dark Stone Foundation Base across both tiles
  ctx.fillStyle = DUPLEX_PALETTE.baseDark;
  ctx.beginPath();
  ctx.moveTo(swX0, swY0);
  ctx.lineTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1 - depthX, y1 - depthY);
  ctx.lineTo(swX0 + depthX, swY0 - depthY);
  ctx.closePath();
  ctx.fill();

  // 2. Sage Green SW Lit Wall
  ctx.fillStyle = DUPLEX_PALETTE.wallLight;
  ctx.beginPath();
  ctx.moveTo(swX0, swY0B);
  ctx.lineTo(x0, fY0);
  ctx.lineTo(x0, fY0 - height);
  ctx.lineTo(swX0, swY0B - height);
  ctx.closePath();
  ctx.fill();

  // SW Side Wall Windows — use the correct SW wall vector: swY0B → fY0
  const swWinH = 5 * zoom;
  const swWinY = height * 0.62;
  drawFacadeWindow(ctx, swX0, swY0B, x0, fY0, 0.20, 0.20, swWinY, swWinH, zoom, night);
  drawFacadeWindow(ctx, swX0, swY0B, x0, fY0, 0.60, 0.20, swWinY, swWinH, zoom, night);

  // 3. Sage Green SE Front Facade Wall (Shaded Face across 2 tiles)
  ctx.fillStyle = DUPLEX_PALETTE.wallShade;
  ctx.beginPath();
  ctx.moveTo(x0, fY0);
  ctx.lineTo(x1, fY1);
  ctx.lineTo(x1, fY1 - height);
  ctx.lineTo(x0, fY0 - height);
  ctx.closePath();
  ctx.fill();

  // 4. Dual Gable Roof across both tiles
  drawDuplexRoof(
    ctx,
    x0, fY0 - height,
    x1, fY1 - height,
    depthX, depthY,
    peak, zoom
  );

  // 5. Single centered entrance: Steps, Canopy & Twin Doors on SE Facade
  const canopyY    = height * 0.38;
  const stepDepthX = TW * 0.03;
  const stepDepthY = TH * 0.03;

  drawFacadeSteps(ctx,  x0, fY0, x1, fY1, 0.32, 0.68, stepDepthX, stepDepthY, zoom);
  drawFacadeCanopy(ctx, x0, fY0, x1, fY1, 0.30, 0.70, canopyY, TW * 0.08, TH * 0.08, zoom);
  drawFacadeDoor(ctx,   x0, fY0, x1, fY1, 0.37, 0.09, 8 * zoom, zoom);
  drawFacadeDoor(ctx,   x0, fY0, x1, fY1, 0.54, 0.09, 8 * zoom, zoom);

  // 6. Upper Floor Framed Windows across 2-Tile SE Facade
  const seWinY = height * 0.64;
  const seWinH = 6 * zoom;
  drawFacadeWindow(ctx, x0, fY0, x1, fY1, 0.06, 0.11, seWinY, seWinH, zoom, night);
  drawFacadeWindow(ctx, x0, fY0, x1, fY1, 0.20, 0.11, seWinY, seWinH, zoom, night);
  drawFacadeWindow(ctx, x0, fY0, x1, fY1, 0.45, 0.11, seWinY, seWinH, zoom, night);
  drawFacadeWindow(ctx, x0, fY0, x1, fY1, 0.59, 0.11, seWinY, seWinH, zoom, night);
  drawFacadeWindow(ctx, x0, fY0, x1, fY1, 0.74, 0.11, seWinY, seWinH, zoom, night);
  drawFacadeWindow(ctx, x0, fY0, x1, fY1, 0.87, 0.11, seWinY, seWinH, zoom, night);
}
