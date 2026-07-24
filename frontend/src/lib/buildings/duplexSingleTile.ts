/**
 * Single-tile Level 2 Duplex house renderer.
 *
 * Accepts full DrawArgs so it can use project() to compute face positions
 * at all 4 camera rotations. The building occupies a stable 2×1 world
 * footprint; rotation changes the camera projection, not which adjacent
 * map tile is used as the second half of the house.
 */
import type { DrawArgs } from './types.ts';
import { getDuplexPalette, type DuplexPalette } from './duplexPalette.ts';
import {
  drawFacadeDoor,
  drawFacadeWindow,
  drawFacadeCanopy,
  drawFacadeSteps,
} from './duplexRenderUtils.ts';
import { drawDuplexRoof } from './duplexRoofUtils.ts';
import { ISO_TILE_W, ISO_TILE_H } from '../isoMath.ts';
import { PROCEDURAL_DETAIL_ZOOM } from './constants.ts';
import { genericTune } from './genericTuneState.ts';

/**
 * Compute the 4 diamond vertices of a tile from its projected bounding-box
 * top-left. These offsets are constant for any camera rotation because
 * project() already applies the gridToView remapping.
 */
function tileVerts(p: { x: number; y: number }, TW: number, TH: number) {
  return {
    top:    { x: p.x + TW / 2, y: p.y          },
    right:  { x: p.x + TW,     y: p.y + TH / 2 },
    bottom: { x: p.x + TW / 2, y: p.y + TH      },
    left:   { x: p.x,          y: p.y + TH / 2  },
  };
}

export function drawSingleTileDuplex(args: DrawArgs) {
  const { ctx, px, py, zoom, night = false, seed = 0, project, tileCol, tileRow } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return;

  const palette = getDuplexPalette(seed ?? 0);
  const TW   = ISO_TILE_W * zoom;
  const TH   = ISO_TILE_H * zoom;

  // A single-tile duplex is selected as a residential house in DevMode, so
  // use that building's live parameters rather than a second hard-coded set.
  const tune = genericTune.getParams('house');
  const height = tune.height * zoom;
  const peak   = tune.peak * zoom;
  const baseH  = tune.baseH * zoom;

  // -- Resolve tile-pair using project() so the facade follows rotation ----
  const proj = (dc: number, dr: number) =>
    project && tileCol != null && tileRow != null
      ? project(tileCol + dc, tileRow + dr)
      : { x: px + dc * TW / 2 - dr * TW / 2, y: py + dc * TH / 2 + dr * TH / 2 };

  const pA = proj(0, 0);

  // Keep the second half on the same world tile. project() remaps this
  // fixed pair for every camera quarter-turn.
  const pB = proj(1, 0);

  const vA = tileVerts(pA, TW, TH);
  const vB = tileVerts(pB, TW, TH);

  // Front facade (SE face): vA_bottom → vB_right
  const fX0 = vA.bottom.x;  const fY0 = vA.bottom.y - baseH;
  const fX1 = vB.right.x;   const fY1 = vB.right.y  - baseH;

  // SW lit side wall: vA_left → vA_bottom
  const swX0 = vA.left.x;   const swY0 = vA.left.y   - baseH;
  const swX1 = vA.bottom.x; const swY1 = vA.bottom.y  - baseH;

  // Depth vector (from A-bottom toward A-top) for roof and foundation
  const depthX = vA.top.x - vA.bottom.x;
  const depthY = vA.top.y - vA.bottom.y;

  // 1. Foundation diamond — 6-vertex outline of the 2-tile footprint
  ctx.fillStyle = palette.baseDark;
  ctx.beginPath();
  ctx.moveTo(vA.left.x,   vA.left.y);
  ctx.lineTo(vA.bottom.x, vA.bottom.y);
  ctx.lineTo(vB.bottom.x, vB.bottom.y);
  ctx.lineTo(vB.right.x,  vB.right.y);
  ctx.lineTo(vB.top.x,    vB.top.y);
  ctx.lineTo(vA.top.x,    vA.top.y);
  ctx.closePath();
  ctx.fill();

  // 2. SW Lit Side Wall
  ctx.fillStyle = palette.wallLight;
  ctx.beginPath();
  ctx.moveTo(swX0, swY0);
  ctx.lineTo(swX1, swY1);
  ctx.lineTo(swX1, swY1 - height);
  ctx.lineTo(swX0, swY0 - height);
  ctx.closePath();
  ctx.fill();

  // Visible left gable end cap
  ctx.fillStyle = palette.wallLight;
  ctx.beginPath();
  ctx.moveTo(swX0,        swY0 - height);
  ctx.lineTo(swX1,        swY1 - height);
  ctx.lineTo(swX1 + depthX * 0.5, swY1 - height - peak);
  ctx.closePath();
  ctx.fill();

  // SW side wall windows
  drawFacadeWindow(ctx, swX0, swY0, swX1, swY1, 0.20, 0.30, height * 0.58, 4.5 * zoom, zoom, night);
  drawFacadeWindow(ctx, swX0, swY0, swX1, swY1, 0.58, 0.30, height * 0.58, 4.5 * zoom, zoom, night);

  // 3. SE Right End Wall (NE corner capper)
  const endX0 = fX1;              const endY0 = fY1;
  const endX1 = fX1 + depthX;    const endY1 = fY1 + depthY;
  ctx.fillStyle = palette.wallBack;
  ctx.beginPath();
  ctx.moveTo(endX0, endY0);
  ctx.lineTo(endX1, endY1);
  ctx.lineTo(endX1, endY1 - height);
  ctx.lineTo(endX0, endY0 - height);
  ctx.closePath();
  ctx.fill();

  // 4. SE Front Wall (shaded facade, spans 2 tiles)
  ctx.fillStyle = palette.wallShade;
  ctx.beginPath();
  ctx.moveTo(fX0, fY0);
  ctx.lineTo(fX1, fY1);
  ctx.lineTo(fX1, fY1 - height);
  ctx.lineTo(fX0, fY0 - height);
  ctx.closePath();
  ctx.fill();

  // 5. Dual-Gable Roof
  drawDuplexRoof(
    ctx,
    fX0, fY0 - height,
    fX1, fY1 - height,
    depthX, depthY,
    peak, zoom,
    0.28, 0.35, 10,
    palette
  );

  // 6. Entrances — Unit 1 & Unit 2
  const stepDX = Math.abs(depthX) * 0.022;
  const stepDY = Math.abs(depthY) * 0.022;
  const canopyW = Math.abs(depthX) * 0.032;
  const canopyH = Math.abs(depthY) * 0.032;
  const canopyY = height * 0.48;
  const doorH   = 7.2 * zoom;

  drawFacadeSteps(ctx,  fX0, fY0, fX1, fY1, 0.20, 0.38, stepDX, stepDY, zoom);
  drawFacadeCanopy(ctx, fX0, fY0, fX1, fY1, 0.19, 0.39, canopyY, canopyW, canopyH, zoom);
  drawFacadeDoor(ctx,   fX0, fY0, fX1, fY1, 0.24, 0.10, doorH, zoom);

  drawFacadeSteps(ctx,  fX0, fY0, fX1, fY1, 0.62, 0.80, stepDX, stepDY, zoom);
  drawFacadeCanopy(ctx, fX0, fY0, fX1, fY1, 0.61, 0.81, canopyY, canopyW, canopyH, zoom);
  drawFacadeDoor(ctx,   fX0, fY0, fX1, fY1, 0.66, 0.10, doorH, zoom);

  // 7. Front facade windows (4: 2 per unit)
  const winH = 5 * zoom;
  const winY = height * 0.60;
  drawFacadeWindow(ctx, fX0, fY0, fX1, fY1, 0.08, 0.13, winY, winH, zoom, night);
  drawFacadeWindow(ctx, fX0, fY0, fX1, fY1, 0.27, 0.13, winY, winH, zoom, night);
  drawFacadeWindow(ctx, fX0, fY0, fX1, fY1, 0.60, 0.13, winY, winH, zoom, night);
  drawFacadeWindow(ctx, fX0, fY0, fX1, fY1, 0.79, 0.13, winY, winH, zoom, night);
}
