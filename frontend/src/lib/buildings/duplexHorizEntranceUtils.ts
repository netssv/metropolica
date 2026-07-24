/**
 * Entrance and window feature renderers for Horizontal Duplex facade.
 */

import type { DrawArgs } from './types.ts';
import type { DUPLEX_PALETTE } from './duplexPalette.ts';
import type { DuplexHorizTuneParams } from './duplexHorizTuneState.ts';
import type { DuplexHorizGeometry } from './duplexHorizGeometry.ts';
import { ISO_TILE_W, ISO_TILE_H } from '../isoMath.ts';
import {
  drawFacadeDoor,
  drawFacadeWindow,
  drawFacadeCanopy,
  drawFacadeSteps,
} from './duplexRenderUtils.ts';

type DuplexPaletteType = typeof DUPLEX_PALETTE;

export function drawDuplexEntrancesAndWindows(
  ctx: CanvasRenderingContext2D,
  args: DrawArgs,
  geo: DuplexHorizGeometry,
  height: number,
  baseH: number,
  tune: DuplexHorizTuneParams,
  palette: DuplexPaletteType
) {
  const { zoom, night = false } = args;
  const TW = ISO_TILE_W * zoom;
  const TH = ISO_TILE_H * zoom;

  const canopyY    = height * tune.canopyYMult;
  const stepDepthX = TW * 0.022;
  const stepDepthY = TH * 0.022;
  const canopyW    = TW * 0.032;
  const canopyH    = TH * 0.032;
  const doorH      = 7.5 * zoom * tune.doorScale;
  const doorW      = 0.10 * tune.doorScale;

  if (geo.showEntranceFacade) {
    // Unit 1 Entrance (Left Unit)
    drawFacadeSteps(ctx,  geo.fX0, geo.fY0, geo.fX1, geo.fY1, 0.20, 0.38, stepDepthX, stepDepthY, zoom);
    drawFacadeCanopy(ctx, geo.fX0, geo.fY0, geo.fX1, geo.fY1, 0.19, 0.39, canopyY, canopyW, canopyH, zoom);
    drawFacadeDoor(ctx,   geo.fX0, geo.fY0, geo.fX1, geo.fY1, 0.24, doorW, doorH, zoom);

    // Unit 2 Entrance (Right Unit)
    drawFacadeSteps(ctx,  geo.fX0, geo.fY0, geo.fX1, geo.fY1, 0.62, 0.80, stepDepthX, stepDepthY, zoom);
    drawFacadeCanopy(ctx, geo.fX0, geo.fY0, geo.fX1, geo.fY1, 0.61, 0.81, canopyY, canopyW, canopyH, zoom);
    drawFacadeDoor(ctx,   geo.fX0, geo.fY0, geo.fX1, geo.fY1, 0.66, doorW, doorH, zoom);

    // Upper windows on entrance elevation
    const seWinY = height * tune.winYMult;
    const seWinH = 5.2 * zoom * tune.winScale;
    const seWinW = 0.13 * tune.winScale;
    drawFacadeWindow(ctx, geo.fX0, geo.fY0, geo.fX1, geo.fY1, 0.08, seWinW, seWinY, seWinH, zoom, night);
    drawFacadeWindow(ctx, geo.fX0, geo.fY0, geo.fX1, geo.fY1, 0.27, seWinW, seWinY, seWinH, zoom, night);
    drawFacadeWindow(ctx, geo.fX0, geo.fY0, geo.fX1, geo.fY1, 0.60, seWinW, seWinY, seWinH, zoom, night);
    drawFacadeWindow(ctx, geo.fX0, geo.fY0, geo.fX1, geo.fY1, 0.79, seWinW, seWinY, seWinH, zoom, night);
  } else if (geo.isRearView) {
    // Rear elevation: upper row windows
    const rearWinY = height * tune.rearWinYMult;
    const rearWinH = 5.1 * zoom * tune.winScale;
    const rearWinW = 0.14 * tune.winScale;
    drawFacadeWindow(ctx, geo.fX0, geo.fY0, geo.fX1, geo.fY1, 0.13, rearWinW, rearWinY, rearWinH, zoom, night);
    drawFacadeWindow(ctx, geo.fX0, geo.fY0, geo.fX1, geo.fY1, 0.33, rearWinW, rearWinY, rearWinH, zoom, night);
    drawFacadeWindow(ctx, geo.fX0, geo.fY0, geo.fX1, geo.fY1, 0.62, rearWinW, rearWinY, rearWinH, zoom, night);
    drawFacadeWindow(ctx, geo.fX0, geo.fY0, geo.fX1, geo.fY1, 0.82, rearWinW, rearWinY, rearWinH, zoom, night);

    // Ground-floor rear windows
    const lowerWinY = height * tune.rearLowerWinYMult;
    const lowerWinH = 4.6 * zoom * tune.winScale;
    drawFacadeWindow(ctx, geo.fX0, geo.fY0, geo.fX1, geo.fY1, 0.23, rearWinW, lowerWinY, lowerWinH, zoom, night);
    drawFacadeWindow(ctx, geo.fX0, geo.fY0, geo.fX1, geo.fY1, 0.70, rearWinW, lowerWinY, lowerWinH, zoom, night);

    const midX = (geo.fX0 + geo.fX1) / 2;
    const midY = (geo.fY0 + geo.fY1) / 2;
    ctx.strokeStyle = palette.wallBack;
    ctx.lineWidth = Math.max(1, zoom);
    ctx.beginPath();
    ctx.moveTo(midX, midY - baseH);
    ctx.lineTo(midX, midY - height + baseH);
    ctx.stroke();
  }
}
