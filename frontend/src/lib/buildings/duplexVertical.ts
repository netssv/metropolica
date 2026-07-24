/**
 * Vertical Duplex Renderer — 2 tiles up-to-down (col, row) + (col, row+1).
 * Features 100% opaque solid volume wall geometry, aligned entrance facade, and varied palettes.
 */
import type { DrawArgs } from './types.ts';
import { PROCEDURAL_DETAIL_ZOOM } from './constants.ts';
import { ISO_TILE_W, ISO_TILE_H } from '../isoMath.ts';
import {
  getDuplexPalette,
  drawFacadeDoor,
  drawFacadeWindow,
  drawFacadeCanopy,
  drawFacadeSteps,
} from './duplexRenderUtils.ts';
import { drawDuplexRoof } from './duplexRoofUtils.ts';
import { duplexVertTune } from './duplexVertTuneState.ts';

export function drawVerticalDuplex(args: DrawArgs) {
  const { ctx, px, py, zoom, night = false, project, tileCol, tileRow, seed } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return;

  const seedVal = seed ?? ((tileCol ?? 0) * 73 + (tileRow ?? 0) * 37);
  const palette = getDuplexPalette(seedVal);

  const TW = ISO_TILE_W * zoom;
  const TH = ISO_TILE_H * zoom;

  const pA = project && tileCol != null && tileRow != null
    ? project(tileCol, tileRow)
    : { x: px, y: py };

  const cameraRot = ((Math.round(args.rotation ?? 0) % 4) + 4) % 4;
  // Dynamic neighbor offset depending on camera view orientation
  const neighborCol = tileCol != null ? tileCol + (cameraRot === 1 ? 1 : cameraRot === 3 ? -1 : 0) : 0;
  const neighborRow = tileRow != null ? tileRow + (cameraRot === 0 ? 1 : cameraRot === 2 ? -1 : 0) : 0;

  const pB = project && tileCol != null && tileRow != null
    ? project(neighborCol, neighborRow)
    : { x: px - TW / 2, y: py + TH / 2 };

  const tune   = duplexVertTune.getParams();
  const height = tune.height * zoom;
  const peak   = tune.peak   * zoom;
  const baseH  = tune.baseH  * zoom;

  // 2-tile vertical pair footprint
  const swX0 = pB.x;            const swY0 = pB.y + TH / 2;  // West corner of Tile B
  const x0   = pB.x + TW / 2;   const y0   = pB.y + TH;      // South corner of Tile B
  const x1   = pA.x + TW;       const y1   = pA.y + TH / 2;  // East corner of Tile A
  const swX1 = x0;             const swY1 = y0;
  const depthX = TW / 2;       const depthY = TH / 2;

  const fX0 = x0;  const fY0 = y0 - baseH;
  const fX1 = x1;  const fY1 = y1 - baseH;
  const swFY0 = swY0 - baseH;
  const swFY1 = swY1 - baseH;

  // 1. Solid Foundation Base Quad
  ctx.fillStyle = palette.baseDark;
  ctx.beginPath();
  ctx.moveTo(swX0, swFY0 + baseH);
  ctx.lineTo(swX1, swFY1 + baseH);
  ctx.lineTo(fX1, fY1 + baseH);
  ctx.lineTo(fX1 - depthX, fY1 - depthY + baseH);
  ctx.lineTo(swX0, swFY0 + baseH);
  ctx.closePath();
  ctx.fill();

  // 2. Rear Wall (NW face)
  const backX0 = swX0;
  const backY0 = swFY0;
  const backX1 = fX1 - depthX;
  const backY1 = fY1 - depthY;
  ctx.fillStyle = palette.wallShade;
  ctx.beginPath();
  ctx.moveTo(backX0, backY0);
  ctx.lineTo(backX1, backY1);
  ctx.lineTo(backX1, backY1 - height);
  ctx.lineTo(backX0, backY0 - height);
  ctx.closePath();
  ctx.fill();

  // 3. Lit Side Wall (SW face)
  ctx.fillStyle = palette.wallLight;
  ctx.beginPath();
  ctx.moveTo(swX0, swFY0);
  ctx.lineTo(swX1, swFY1);
  ctx.lineTo(swX1, swFY1 - height);
  ctx.lineTo(swX0, swFY0 - height);
  ctx.closePath();
  ctx.fill();

  // Lit wall windows
  const swWinH = 5 * zoom;
  const swWinY = height * 0.62;
  drawFacadeWindow(ctx, swX0, swFY0, swX1, swFY1, 0.20, 0.20, swWinY, swWinH, zoom, night);
  drawFacadeWindow(ctx, swX0, swFY0, swX1, swFY1, 0.60, 0.20, swWinY, swWinH, zoom, night);

  // 4. Shaded Right Side Wall (NE face) - Solid 100% opaque wall fill up to roof ridge
  const P3_X = fX0 + (fX1 - fX0) * 0.75;
  const P3_Y = fY0 - height + (fY1 - fY0) * 0.75 - peak;
  const B3_X = P3_X - depthX;
  const B3_Y = P3_Y - depthY;

  const neX0 = fX1;           const neY0 = fY1;
  const neX1 = fX1 - depthX;  const neY1 = fY1 - depthY;

  ctx.fillStyle = palette.wallShade;
  ctx.beginPath();
  ctx.moveTo(neX0, neY0);
  ctx.lineTo(neX1, neY1);
  ctx.lineTo(neX1, neY1 - height);
  ctx.lineTo(B3_X, B3_Y);
  ctx.lineTo(P3_X, P3_Y);
  ctx.lineTo(neX0, neY0 - height);
  ctx.closePath();
  ctx.fill();

  // 5. Main Front Facade Wall (SE face)
  ctx.fillStyle = palette.wallShade;
  ctx.beginPath();
  ctx.moveTo(fX0, fY0);
  ctx.lineTo(fX1, fY1);
  ctx.lineTo(fX1, fY1 - height);
  ctx.lineTo(fX0, fY0 - height);
  ctx.closePath();
  ctx.fill();

  // 6. Dual-Gable Roof & 3D Chimney
  drawDuplexRoof(
    ctx,
    fX0, fY0 - height,
    fX1, fY1 - height,
    depthX, depthY,
    peak, zoom,
    tune.chimneyPosT,
    tune.chimneyDepth,
    tune.chimneyH,
    palette
  );

  // 7. Entrances: Dedicated Steps, Canopy & Door for Unit 1 & Unit 2
  const canopyY    = height * 0.48;
  const stepDepthX = TW * 0.022;
  const stepDepthY = TH * 0.022;
  const canopyW    = TW * 0.032;
  const canopyH    = TH * 0.032;
  const doorH      = 7.5 * zoom;

  // Unit 1 Entrance (Left Unit)
  drawFacadeSteps(ctx,  fX0, fY0, fX1, fY1, 0.20, 0.38, stepDepthX, stepDepthY, zoom);
  drawFacadeCanopy(ctx, fX0, fY0, fX1, fY1, 0.19, 0.39, canopyY, canopyW, canopyH, zoom);
  drawFacadeDoor(ctx,   fX0, fY0, fX1, fY1, 0.24, 0.10, doorH, zoom);

  // Unit 2 Entrance (Right Unit)
  drawFacadeSteps(ctx,  fX0, fY0, fX1, fY1, 0.62, 0.80, stepDepthX, stepDepthY, zoom);
  drawFacadeCanopy(ctx, fX0, fY0, fX1, fY1, 0.61, 0.81, canopyY, canopyW, canopyH, zoom);
  drawFacadeDoor(ctx,   fX0, fY0, fX1, fY1, 0.66, 0.10, doorH, zoom);

  // 8. Upper windows on main facade (2 per unit)
  const seWinY = height * 0.62;
  const seWinH = 5.2 * zoom;
  drawFacadeWindow(ctx, fX0, fY0, fX1, fY1, 0.08, 0.13, seWinY, seWinH, zoom, night);
  drawFacadeWindow(ctx, fX0, fY0, fX1, fY1, 0.27, 0.13, seWinY, seWinH, zoom, night);
  drawFacadeWindow(ctx, fX0, fY0, fX1, fY1, 0.60, 0.13, seWinY, seWinH, zoom, night);
  drawFacadeWindow(ctx, fX0, fY0, fX1, fY1, 0.79, 0.13, seWinY, seWinH, zoom, night);
}
