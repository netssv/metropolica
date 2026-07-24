/**
 * Foundation, Wall, and Facade Feature Renderers for Horizontal Duplex.
 */

import type { DUPLEX_PALETTE } from './duplexPalette.ts';
import type { DuplexHorizTuneParams } from './duplexHorizTuneState.ts';
import type { DuplexHorizGeometry } from './duplexHorizGeometry.ts';
import { drawFacadeWindow } from './duplexRenderUtils.ts';

type DuplexPaletteType = typeof DUPLEX_PALETTE;


export function drawDuplexFoundation(
  ctx: CanvasRenderingContext2D,
  geo: DuplexHorizGeometry,
  baseH: number,
  palette: DuplexPaletteType
) {
  ctx.fillStyle = palette.baseDark;
  ctx.beginPath();
  ctx.moveTo(geo.fX0, geo.fY0 + baseH);
  ctx.lineTo(geo.fX1, geo.fY1 + baseH);
  ctx.lineTo(geo.bX1, geo.bY1 + baseH);
  ctx.lineTo(geo.bX0, geo.bY0 + baseH);
  ctx.closePath();
  ctx.fill();
}

export function drawDuplexRearWall(
  ctx: CanvasRenderingContext2D,
  geo: DuplexHorizGeometry,
  height: number,
  palette: DuplexPaletteType
) {
  ctx.fillStyle = palette.wallShade;
  ctx.beginPath();
  ctx.moveTo(geo.bX0, geo.bY0);
  ctx.lineTo(geo.bX1, geo.bY1);
  ctx.lineTo(geo.bX1, geo.bY1 - height);
  ctx.lineTo(geo.bX0, geo.bY0 - height);
  ctx.closePath();
  ctx.fill();
}

export function drawDuplexSideWalls(
  ctx: CanvasRenderingContext2D,
  geo: DuplexHorizGeometry,
  height: number,
  peak: number,
  zoom: number,
  night: boolean,
  tune: DuplexHorizTuneParams,
  palette: DuplexPaletteType
) {
  // Left Side Wall (NW face)
  ctx.fillStyle = palette.wallLight;
  ctx.beginPath();
  ctx.moveTo(geo.bX0, geo.bY0);
  ctx.lineTo(geo.fX0, geo.fY0);
  ctx.lineTo(geo.fX0, geo.fY0 - height);
  ctx.lineTo(geo.bX0, geo.bY0 - height);
  ctx.closePath();
  ctx.fill();

  // Triangular gable peak cap on left side wall
  ctx.beginPath();
  ctx.moveTo(geo.fX0, geo.fY0 - height);
  ctx.lineTo(geo.bX0, geo.bY0 - height);
  ctx.lineTo(geo.fX0 - geo.depthX * 0.5, geo.fY0 - height - peak);
  ctx.closePath();
  ctx.fill();

  if (geo.rot === 0) {
    const sideWinH = 5 * zoom * tune.winScale;
    const sideWinY = height * tune.sideWinYMult;
    const sideWinW = 0.28 * tune.winScale;
    drawFacadeWindow(ctx, geo.bX0, geo.bY0, geo.fX0, geo.fY0, 0.25, sideWinW, sideWinY, sideWinH, zoom, night);
    drawFacadeWindow(ctx, geo.bX0, geo.bY0, geo.fX0, geo.fY0, 0.65, sideWinW, sideWinY, sideWinH, zoom, night);
  }

  // Right Side Wall (SE face)
  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.wallShade;
  ctx.beginPath();
  ctx.moveTo(geo.fX1, geo.fY1);
  ctx.lineTo(geo.bX1, geo.bY1);
  ctx.lineTo(geo.bX1, geo.bY1 - height);
  ctx.lineTo(geo.fX1, geo.fY1 - height);
  ctx.closePath();
  ctx.fill();

  // Triangular gable peak cap on right side wall
  ctx.beginPath();
  ctx.moveTo(geo.fX1, geo.fY1 - height);
  ctx.lineTo(geo.bX1, geo.bY1 - height);
  ctx.lineTo(geo.fX1 - geo.depthX * 0.5, geo.fY1 - height - peak);
  ctx.closePath();
  ctx.fill();

  if (geo.rot === 1) {
    const sideWinH = 5 * zoom * tune.winScale;
    const sideWinY = height * tune.sideWinYMult;
    const sideWinW = 0.28 * tune.winScale;
    drawFacadeWindow(ctx, geo.fX1, geo.fY1, geo.bX1, geo.bY1, 0.22, sideWinW, sideWinY, sideWinH, zoom, night);
    drawFacadeWindow(ctx, geo.fX1, geo.fY1, geo.bX1, geo.bY1, 0.64, sideWinW, sideWinY, sideWinH, zoom, night);
  }
}

export function drawDuplexFrontWall(
  ctx: CanvasRenderingContext2D,
  geo: DuplexHorizGeometry,
  height: number,
  palette: DuplexPaletteType
) {
  ctx.fillStyle = geo.isRearView ? palette.wallBack : palette.wallShade;
  ctx.beginPath();
  ctx.moveTo(geo.fX0, geo.fY0);
  ctx.lineTo(geo.fX1, geo.fY1);
  ctx.lineTo(geo.fX1, geo.fY1 - height);
  ctx.lineTo(geo.fX0, geo.fY0 - height);
  ctx.closePath();
  ctx.fill();
}

export { drawDuplexEntrancesAndWindows } from './duplexHorizEntranceUtils.ts';


