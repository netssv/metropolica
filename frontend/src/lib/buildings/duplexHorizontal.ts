/**
 * Horizontal Duplex Renderer — 2 tiles left-to-right: (col, row) + (col+1, row).
 * Features 100% opaque solid volume wall geometry, aligned entrance facade, and varied palettes.
 */
import type { DrawArgs } from './types.ts';
import { PROCEDURAL_DETAIL_ZOOM } from './constants.ts';
import { getDuplexPalette } from './duplexRenderUtils.ts';
import { drawDuplexRoof } from './duplexRoofUtils.ts';
import { duplexHorizTune } from './duplexHorizTuneState.ts';
import { computeDuplexHorizGeometry } from './duplexHorizGeometry.ts';
import {
  drawDuplexFoundation,
  drawDuplexRearWall,
  drawDuplexSideWalls,
  drawDuplexFrontWall,
  drawDuplexEntrancesAndWindows,
} from './duplexHorizWalls.ts';

export function drawHorizontalDuplex(args: DrawArgs) {
  const { ctx, zoom, tileCol, tileRow, seed } = args;

  if (zoom < PROCEDURAL_DETAIL_ZOOM) return;

  const seedVal = seed ?? ((tileCol ?? 0) * 73 + (tileRow ?? 0) * 37);
  const palette = getDuplexPalette(seedVal);
  const tune = duplexHorizTune.getParams();

  const height = tune.height * zoom;
  const peak = tune.peak * zoom;
  const baseH = tune.baseH * zoom;

  const geo = computeDuplexHorizGeometry(args, tune);

  // 1. Solid Foundation Base Quad
  drawDuplexFoundation(ctx, geo, baseH, palette);

  // 2. Rear Wall
  drawDuplexRearWall(ctx, geo, height, palette);

  // 3 & 4. Left & Right Side Walls (+ gable caps & side windows)
  drawDuplexSideWalls(ctx, geo, height, peak, zoom, args.night ?? false, tune, palette);

  // 5. Main Front Facade Wall
  drawDuplexFrontWall(ctx, geo, height, palette);

  // 6. Dual-Gable Roof & 3D Chimney
  drawDuplexRoof(
    ctx,
    geo.fX0, geo.fY0 - height,
    geo.fX1, geo.fY1 - height,
    geo.depthX, geo.depthY,
    peak, zoom,
    tune.chimneyPosT ?? 0.28,
    tune.chimneyDepth ?? 0.35,
    tune.chimneyH ?? 10,
    palette
  );

  // 7. Entrances & Windows
  drawDuplexEntrancesAndWindows(ctx, args, geo, height, baseH, tune, palette);
}

