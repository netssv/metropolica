import { drawIsoTile, drawTrafficSignalHeads } from '../../lib/isoRenderer';
import { ISO_TILE_H, ISO_TILE_W } from '../../lib/isoMath';
import { T } from '../../lib/constants';

export function isTileInViewport(
  projected: { x: number; y: number },
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  margin: number
): boolean {
  return !(
    projected.x > canvasWidth + margin ||
    projected.x + ISO_TILE_W * zoom < -margin ||
    projected.y > canvasHeight + margin ||
    projected.y + ISO_TILE_H * zoom * 3.5 < -margin
  );
}

export function drawBaseTerrainAndRoads(
  ctx: CanvasRenderingContext2D,
  drawOrder: any[],
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  margin: number,
  map: any[][],
  project: any,
  time: number,
  ox: number,
  oy: number,
  rotation: number
) {
  for (const { tile, col, row, projected } of drawOrder) {
    if (!tile || !isTileInViewport(projected, canvasWidth, canvasHeight, zoom, margin)) continue;

    if (
      tile.type === T.BLDG_R ||
      tile.type === T.BLDG_C ||
      tile.type === T.BLDG_I ||
      tile.type === T.ZONE_R ||
      tile.type === T.ZONE_C ||
      tile.type === T.ZONE_I ||
      tile.type === T.POWER ||
      tile.type === T.PARK
    ) {
      drawIsoTile(ctx, { type: T.GRASS }, col, row, ox, oy, zoom, map, project, time);
      continue;
    }
    drawIsoTile(ctx, tile, col, row, ox, oy, zoom, map, project, time, false, rotation);
  }
}

export function repaintBridges(
  ctx: CanvasRenderingContext2D,
  drawOrder: any[],
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  margin: number,
  map: any[][],
  project: any,
  time: number,
  ox: number,
  oy: number
) {
  for (const { tile, col, row, projected } of drawOrder) {
    if (!tile || tile.type !== T.BRIDGE || !isTileInViewport(projected, canvasWidth, canvasHeight, zoom, margin)) continue;
    drawIsoTile(ctx, tile, col, row, ox, oy, zoom, map, project, time);
  }
}

export function drawTrafficSignals(
  ctx: CanvasRenderingContext2D,
  drawOrder: any[],
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  margin: number,
  map: any[][],
  project: any,
  time: number
) {
  for (const { tile, col, row, projected } of drawOrder) {
    if (!tile || !isTileInViewport(projected, canvasWidth, canvasHeight, zoom, margin)) continue;
    drawTrafficSignalHeads(ctx, projected.x, projected.y, zoom, map, col, row, time, project);
  }
}
