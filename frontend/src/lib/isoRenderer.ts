import { ISO_TILE_W, ISO_TILE_H, gridToIso } from './isoMath';
import { T } from './constants';
import {
  drawBuilding,
  drawPark,
  drawPowerPlant,
  PROCEDURAL_DETAIL_ZOOM,
  type HousingProfile
} from './buildingSprites';

import { TileMap, Projection, IsoTileData } from './isoRenderer/types.ts';
import { TERRAIN_COLOR, SPRITE_POS } from './isoRenderer/constants.ts';
import {
  drawDiamond,
  drawTerrainDetails,
  buildingStreetInset,
  drawCrisisTint
} from './isoRenderer/helpers.ts';
import { drawRoad } from './isoRenderer/road.ts';
import { drawTrafficSignalHeads } from './isoRenderer/signals.ts';
import { ensureSpritesLoaded, drawCachedSprite } from './isoRenderer/legacySprites.ts';
import { drawPixelBuilding, drawBusinessAccent } from './isoRenderer/buildings.ts';

export { ensureSpritesLoaded, drawTrafficSignalHeads };

/** Draw one tile (terrain + optional sprite). `inCrisis` adds a red overlay. */
export function drawIsoTile(
  ctx: CanvasRenderingContext2D,
  tile: IsoTileData,
  col: number,
  row: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
  map?: TileMap,
  project: Projection = (c, r) => {
    const p = gridToIso(c, r);
    return { x: p.x * zoom + offsetX, y: p.y * zoom + offsetY };
  },
  time = 0,
  night = false
) {
  const { x: px, y: py } = project(col, row);

  if (tile.type === T.WATER) {
    drawDiamond(ctx, px, py, zoom, '#1a5f8a');
    if (zoom >= PROCEDURAL_DETAIL_ZOOM) {
      const phase = time / 900 + (col * 0.7 + row * 0.35);
      ctx.strokeStyle = 'rgba(116, 210, 222, .55)';
      ctx.lineWidth = Math.max(1, zoom);
      for (let wave = 0; wave < 3; wave++) {
        const offset = Math.sin(phase + wave * 2.1) * 3 * zoom;
        const y = py + (0.28 + wave * 0.2) * ISO_TILE_H * zoom + offset;
        ctx.beginPath();
        ctx.moveTo(px + (5 + wave * 3) * zoom, y);
        ctx.quadraticCurveTo(
          px + ISO_TILE_W * zoom * 0.42,
          y - 2 * zoom,
          px + ISO_TILE_W * zoom * (0.72 + wave * 0.04),
          y + 1 * zoom
        );
        ctx.stroke();
      }
    }
    return;
  }

  // This sheet has no standalone road sprite. Keep streets procedural so
  // their asphalt texture remains distinct from grass and decoration.
  if (tile.type === T.ROAD || tile.type === T.BRIDGE) {
    drawRoad(ctx, px, py, zoom, tile.type === T.BRIDGE, col, row, map, project);
    if (tile.inCrisis) drawCrisisTint(ctx, px, py, zoom);
    return;
  }

  const terrainColor = TERRAIN_COLOR[tile.type];
  if (terrainColor) {
    drawDiamond(ctx, px, py, zoom, terrainColor);
    drawTerrainDetails(ctx, px, py, zoom, tile.type, col * 31 + row * 17, project, col, row);
    if (tile.inCrisis) drawCrisisTint(ctx, px, py, zoom);
    return;
  }

  const seed = col * 31 + row * 17;
  if (
    tile.type === T.BLDG_R ||
    tile.type === T.BLDG_C ||
    tile.type === T.BLDG_I ||
    tile.type === T.ZONE_R ||
    tile.type === T.ZONE_C ||
    tile.type === T.ZONE_I
  ) {
    const visualNight =
      tile.isNight ??
      (night ||
        (typeof document !== 'undefined' &&
          document.body.dataset.metropolicaNight === 'true'));
    const inset = buildingStreetInset(map, col, row, zoom, project);
    const buildingPx = px + inset.x;
    const buildingPy = py + inset.y;
    drawBuilding(
      tile.type,
      tile.growthTier ?? 0,
      { ctx, px: buildingPx, py: buildingPy, zoom, seed, night: visualNight, time, houseRole: tile.houseRole, tileCol: col, tileRow: row, project },
      tile.specialty,
      tile.housing
    );
    drawBusinessAccent(
      ctx,
      tile.type,
      col,
      row,
      buildingPx,
      buildingPy,
      zoom,
      tile.businessAccentTiles
    );
    if (tile.inCrisis) drawCrisisTint(ctx, px, py, zoom);
    return;
  }

  if (tile.type === T.POWER) {
    drawPowerPlant({ ctx, px, py, zoom, seed });
    if (tile.inCrisis) drawCrisisTint(ctx, px, py, zoom);
    return;
  }
  if (tile.type === T.PARK) {
    const parkSize = tile.parkSize ?? 1;
    drawPark({ ctx, px, py, zoom, seed, parkSize, project, tileCol: col, tileRow: row });
    if (tile.inCrisis) drawCrisisTint(ctx, px, py, zoom);
    return;
  }

  const spriteVariants = SPRITE_POS[tile.type];
  if (spriteVariants) {
    const variant = (col * 31 + row * 17) % spriteVariants.length;
    const drawn = zoom >= 0.4 && drawCachedSprite(ctx, px, py, zoom, tile.type, variant);
    if (!drawn) drawPixelBuilding(ctx, px, py, zoom, tile.type, variant, 1);
  } else {
    // Fallback solid diamond while sprites load
    const zoneColors: Record<string, string> = {
      [T.ZONE_R]: '#5cbb7a',
      [T.ZONE_C]: '#2aab8c',
      [T.ZONE_I]: '#d4822a',
      [T.BLDG_R]: '#4aaa68',
      [T.BLDG_C]: '#209a7a',
      [T.BLDG_I]: '#c07118',
      [T.PARK]: '#226633',
      [T.POWER]: '#d4aa30'
    };
    drawDiamond(ctx, px, py, zoom, zoneColors[tile.type] ?? '#555');
  }

  if (tile.inCrisis) drawCrisisTint(ctx, px, py, zoom);
}

/** Draw hover diamond outline. */
export function drawIsoHover(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
  color: string,
  project: Projection = (c, r) => {
    const p = gridToIso(c, r);
    return { x: p.x * zoom + offsetX, y: p.y * zoom + offsetY };
  }
) {
  const { x: px, y: py } = project(col, row);
  const hw = (ISO_TILE_W / 2) * zoom;
  const hh = (ISO_TILE_H / 2) * zoom;
  ctx.fillStyle = color + '55';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px + hw, py);
  ctx.lineTo(px + hw * 2, py + hh);
  ctx.lineTo(px + hw, py + hh * 2);
  ctx.lineTo(px, py + hh);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
