/**
 * Horizontal Duplex Renderer — 2 tiles left-to-right: (col, row) + (col+1, row).
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
import { duplexHorizTune } from './duplexHorizTuneState.ts';

export function drawHorizontalDuplex(args: DrawArgs) {
  const { ctx, px, py, zoom, night = false, project, tileCol, tileRow, seed } = args;

  if (zoom < PROCEDURAL_DETAIL_ZOOM) return;

  const seedVal = seed ?? ((tileCol ?? 0) * 73 + (tileRow ?? 0) * 37);
  const palette = getDuplexPalette(seedVal);

  const TW = ISO_TILE_W * zoom;
  const TH = ISO_TILE_H * zoom;

  const pA = project && tileCol != null && tileRow != null
    ? project(tileCol, tileRow)
    : { x: px, y: py };

  const tune  = duplexHorizTune.getParams();
  const rot   = Math.round(tune.rotation) % 4;

  const height = tune.height * zoom;
  const peak   = tune.peak   * zoom;
  const baseH  = tune.baseH  * zoom;
  const slope  = tune.rotAngle / 0.5;
  const offX   = tune.offsetX * zoom;
  const offY   = tune.offsetY * zoom;
  const fm     = tune.facadeMult;

  // Neighbor tile in row direction
  const pS = (rot === 1 || rot === 3) && project && tileCol != null && tileRow != null
    ? project(tileCol, tileRow + 1)
    : { x: pA.x - TW / 2, y: pA.y + TH / 2 };

  // Depth vectors by rotation
  const dxSigns = [ 1, -1, -1,  1];
  const dySigns = [ 1,  1, -1, -1];
  const depthX  = TW * tune.depthMultX * dxSigns[rot];
  const depthY  = TH * tune.depthMultY * dySigns[rot];

  // Front facade bounds by rotation
  let fX0 = 0, fY0 = 0, fX1 = 0, fY1 = 0;
  switch (rot) {
    case 1:
      fX0 = pS.x + TW / 2 + offX;  fY0 = pS.y + TH - baseH + offY;
      fX1 = pA.x + TW * fm - offX;  fY1 = pA.y + TH / 2 * slope - baseH - offY;
      break;
    case 2:
      fX0 = pA.x + TW * fm + offX;  fY0 = pA.y + 1.5 * fm * slope * TH - baseH + offY;
      fX1 = pA.x + offX;            fY1 = pA.y + TH / 2 - baseH + offY;
      break;
    case 3:
      fX0 = pA.x + TW * fm - offX;  fY0 = pA.y + TH / 2 * slope - baseH - offY;
      fX1 = pS.x + TW / 2 + offX;   fY1 = pS.y + TH - baseH + offY;
      break;
    default: // rot=0: canonical SW-facing
      fX0 = pA.x + offX;            fY0 = pA.y + TH / 2 - baseH + offY;
      fX1 = pA.x + TW * fm + offX;  fY1 = pA.y + 1.5 * fm * slope * TH - baseH + offY;
  }

  const bX0 = fX0 - depthX;  const bY0 = fY0 - depthY;
  const bX1 = fX1 - depthX;  const bY1 = fY1 - depthY;

  // 1. Solid Foundation Base Quad
  ctx.fillStyle = palette.baseDark;
  ctx.beginPath();
  ctx.moveTo(fX0, fY0 + baseH);
  ctx.lineTo(fX1, fY1 + baseH);
  ctx.lineTo(bX1, bY1 + baseH);
  ctx.lineTo(bX0, bY0 + baseH);
  ctx.closePath();
  ctx.fill();

  // 2. Rear Wall NE
  ctx.fillStyle = palette.wallShade;
  ctx.beginPath();
  ctx.moveTo(bX0, bY0);
  ctx.lineTo(bX1, bY1);
  ctx.lineTo(bX1, bY1 - height);
  ctx.lineTo(bX0, bY0 - height);
  ctx.closePath();
  ctx.fill();

  // 3. Lit Left Side Wall (NW face)
  ctx.fillStyle = palette.wallLight;
  ctx.beginPath();
  ctx.moveTo(bX0, bY0);
  ctx.lineTo(fX0, fY0);
  ctx.lineTo(fX0, fY0 - height);
  ctx.lineTo(bX0, bY0 - height);
  ctx.closePath();
  ctx.fill();

  // Left side wall windows
  const sideWinH = 5 * zoom * tune.winScale;
  const sideWinY = height * tune.sideWinYMult;
  const sideWinW = 0.28 * tune.winScale;
  drawFacadeWindow(ctx, bX0, bY0, fX0, fY0, 0.18, sideWinW, sideWinY, sideWinH, zoom, night);
  drawFacadeWindow(ctx, bX0, bY0, fX0, fY0, 0.60, sideWinW, sideWinY, sideWinH, zoom, night);

  // 4. Shaded Right Side Wall (SE face) - Solid 100% opaque wall fill up to roof ridge
  const P3_X = fX0 + (fX1 - fX0) * 0.75;
  const P3_Y = fY0 - height + (fY1 - fY0) * 0.75 - peak;
  const B3_X = P3_X - depthX;
  const B3_Y = P3_Y - depthY;

  ctx.fillStyle = palette.wallShade;
  ctx.beginPath();
  ctx.moveTo(fX1, fY1);
  ctx.lineTo(bX1, bY1);
  ctx.lineTo(bX1, bY1 - height);
  ctx.lineTo(B3_X, B3_Y);
  ctx.lineTo(P3_X, P3_Y);
  ctx.lineTo(fX1, fY1 - height);
  ctx.closePath();
  ctx.fill();

  // 5. Main Front Facade Wall (SW face)
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
    tune.chimneyPosT ?? 0.28,
    tune.chimneyDepth ?? 0.35,
    tune.chimneyH ?? 10,
    palette
  );

  // 7. Entrances: Dedicated Steps, Canopy & Door for Unit 1 & Unit 2
  const canopyY    = height * tune.canopyYMult;
  const stepDepthX = TW * 0.022;
  const stepDepthY = TH * 0.022;
  const canopyW    = TW * 0.032;
  const canopyH    = TH * 0.032;
  const doorH      = 7.5 * zoom * tune.doorScale;
  const doorW      = 0.10 * tune.doorScale;

  // Unit 1 Entrance (Left Unit)
  drawFacadeSteps(ctx,  fX0, fY0, fX1, fY1, 0.20, 0.38, stepDepthX, stepDepthY, zoom);
  drawFacadeCanopy(ctx, fX0, fY0, fX1, fY1, 0.19, 0.39, canopyY, canopyW, canopyH, zoom);
  drawFacadeDoor(ctx,   fX0, fY0, fX1, fY1, 0.24, doorW, doorH, zoom);

  // Unit 2 Entrance (Right Unit)
  drawFacadeSteps(ctx,  fX0, fY0, fX1, fY1, 0.62, 0.80, stepDepthX, stepDepthY, zoom);
  drawFacadeCanopy(ctx, fX0, fY0, fX1, fY1, 0.61, 0.81, canopyY, canopyW, canopyH, zoom);
  drawFacadeDoor(ctx,   fX0, fY0, fX1, fY1, 0.66, doorW, doorH, zoom);

  // 8. Upper windows on main facade (2 per unit)
  const seWinY = height * tune.winYMult;
  const seWinH = 5.2 * zoom * tune.winScale;
  const seWinW = 0.13 * tune.winScale;
  drawFacadeWindow(ctx, fX0, fY0, fX1, fY1, 0.08, seWinW, seWinY, seWinH, zoom, night);
  drawFacadeWindow(ctx, fX0, fY0, fX1, fY1, 0.27, seWinW, seWinY, seWinH, zoom, night);
  drawFacadeWindow(ctx, fX0, fY0, fX1, fY1, 0.60, seWinW, seWinY, seWinH, zoom, night);
  drawFacadeWindow(ctx, fX0, fY0, fX1, fY1, 0.79, seWinW, seWinY, seWinH, zoom, night);
}
