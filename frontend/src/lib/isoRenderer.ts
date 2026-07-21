/**
 * Isometric tile renderer — uses sprite sheet from isometric-city (MIT License)
 * https://github.com/amilich/isometric-city (public/assets/sprites_red_water_new.png)
 *
 * Sprite layout: 5 columns × 6 rows
 * Row 0: residential, commercial, industrial, fire_station, hospital
 * Row 1: park, park_large, tennis, police_station, school
 * Row 2: university, water_tower, power_plant, stadium, space_program
 * Row 3: factory_large, house_small, house_medium, mansion, apartment_low
 * Row 4: apartment_high, road, (empty...)
 */

import { ISO_TILE_W, ISO_TILE_H, gridToIso } from './isoMath';
import type { Projection } from './projection';
import { T } from './constants';
import { hasBusinessAccent } from './businessAccents';
import { drawBuilding, drawPark, drawPowerPlant, PROCEDURAL_DETAIL_ZOOM } from './buildingSprites';

const SPRITE_COLS = 5;
const SPRITE_ROWS = 6;
// Buildings and water are drawn procedurally as small pixel-art shapes. This
// avoids decoding and sampling the former multi-megabyte sprite sheets on
// every map frame.
let spriteSheet: HTMLCanvasElement | null = null;
let spriteImage: HTMLImageElement | null = null;
const spriteCache = new Map<string, HTMLCanvasElement>();

/**
 * The isometric-city sheet is an opaque PNG whose background is textured
 * chroma red, rather than actual PNG transparency. Remove only the red
 * regions connected to the image edge. This preserves enclosed red artwork
 * such as brick walls, roofs, vehicles, and signs.
 */
function keySpriteSheet(img: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const keyCtx = canvas.getContext('2d', { willReadFrequently: true });
  if (!keyCtx) return;

  keyCtx.drawImage(img, 0, 0);
  const pixels = keyCtx.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;
  const width = canvas.width;
  const height = canvas.height;
  const visited = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let head = 0;
  let tail = 0;

  // The background ranges from roughly #f00000 to #ff2020. Keep this
  // deliberately narrow in hue/saturation and, crucially, flood only from
  // the outer edge so red pixels inside a sprite are never keyed out.
  const isChromaRed = (pixel: number) => {
    const i = pixel * 4;
    // The replacement sheet has a soft red background, not one exact RGB
    // value. A narrow exact-red test leaves small red/white wedges behind
    // around many sprites, which look like debug markers in the map.
    return data[i] > 120 && data[i + 1] < 105 && data[i + 2] < 105 &&
      data[i] > data[i + 1] * 1.6 && data[i] > data[i + 2] * 1.6;
  };
  const enqueue = (pixel: number) => {
    if (!visited[pixel] && isChromaRed(pixel)) {
      visited[pixel] = 1;
      queue[tail++] = pixel;
    }
  };
  for (let x = 0; x < width; x++) { enqueue(x); enqueue((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y++) { enqueue(y * width); enqueue(y * width + width - 1); }
  while (head < tail) {
    const pixel = queue[head++];
    const x = pixel % width;
    const y = (pixel - x) / width;
    if (x > 0) enqueue(pixel - 1);
    if (x + 1 < width) enqueue(pixel + 1);
    if (y > 0) enqueue(pixel - width);
    if (y + 1 < height) enqueue(pixel + width);
    data[pixel * 4 + 3] = 0;
  }
  keyCtx.putImageData(pixels, 0, 0);
  spriteSheet = canvas;
  spriteCache.clear();
}

function loadImg(src: string, onLoad: (img: HTMLImageElement) => void) {
  const img = new Image();
  img.onload = () => onLoad(img);
  img.src = src;
}

export function ensureSpritesLoaded() {
  if (!spriteImage) loadImg('/sprites/tiles.png', img => { spriteImage = img; keySpriteSheet(img); });
}

/** Sprite positions in the sheet (col, row) — 0-indexed */
const SPRITE_POS: Record<string, Array<{ sc: number; sr: number }>> = {
  // Empty zones (T.ZONE_*) are NOT mapped here so they render as colored diamond terrain.
};

/** Solid diamond colours for terrain tiles that have no sprite */
const TERRAIN_COLOR: Record<string, string> = {
  [T.GRASS]:  '#2d6a4f',
  [T.ROAD]:   '#b8b4a8',
  [T.SAND]:   '#d4c8a0',
  [T.BRIDGE]: '#888',
  [T.TREE]:   '#1e5631',
};

function drawCachedSprite(ctx: CanvasRenderingContext2D, px: number, py: number, zoom: number, type: string, variant: number) {
  if (!spriteSheet) return false;
  const position = SPRITE_POS[type]?.[variant];
  if (!position) return false;
  const cacheKey = `${type}:${variant}`;
  let sprite = spriteCache.get(cacheKey);
  const sw = spriteSheet.width / SPRITE_COLS;
  const sh = spriteSheet.height / SPRITE_ROWS;
  if (!sprite) {
    sprite = document.createElement('canvas'); sprite.width = Math.ceil(sw); sprite.height = Math.ceil(sh);
    const spriteCtx = sprite.getContext('2d');
    if (!spriteCtx) return false;
    spriteCtx.drawImage(spriteSheet, position.sc * sw, position.sr * sh, sw, sh, 0, 0, sw, sh);
    spriteCache.set(cacheKey, sprite);
  }
  const drawW = ISO_TILE_W * zoom * 1.4;
  const drawH = ISO_TILE_H * zoom * 3.2;
  const tileBottomX = px + (ISO_TILE_W / 2) * zoom;
  const tileBottomY = py + ISO_TILE_H * zoom;
  ctx.drawImage(sprite, tileBottomX - drawW / 2, tileBottomY - drawH, drawW, drawH);
  return true;
}

function drawPixelBuilding(ctx: CanvasRenderingContext2D, px: number, py: number, zoom: number, type: string, variant: number, density: number) {
  const hw = ISO_TILE_W * zoom * 0.32;
  const hh = ISO_TILE_H * zoom * 0.32;
  const cx = px + ISO_TILE_W * zoom * 0.5;
  const baseY = py + ISO_TILE_H * zoom;
  const heightClass = density >= 6 ? 4 : density >= 3 ? 3 : density >= 1 ? 2 : 1;
  const height = (type === T.BLDG_I ? 15 : type === T.BLDG_C ? 20 : 16) * zoom * heightClass / 2 + (variant % 3) * 2 * zoom;
  const color = type === T.BLDG_I ? '#b86b2d' : type === T.BLDG_C ? '#278f84' : '#4fa96a';
  const top = { x: cx, y: baseY - hh * 2 };
  const right = { x: cx + hw, y: baseY - hh };
  const bottom = { x: cx, y: baseY };
  const left = { x: cx - hw, y: baseY - hh };
  const lift = height;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(left.x, left.y); ctx.lineTo(left.x, left.y - lift); ctx.lineTo(top.x, top.y - lift); ctx.lineTo(top.x, top.y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#276b68';
  ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(top.x, top.y - lift); ctx.lineTo(right.x, right.y - lift); ctx.lineTo(right.x, right.y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d6a84f';
  ctx.beginPath();
  ctx.moveTo(cx, top.y - lift - hh);
  ctx.lineTo(right.x, right.y - lift);
  ctx.lineTo(cx, baseY - lift);
  ctx.lineTo(left.x, left.y - lift);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b9e1df';
  const windowSize = Math.max(1.5, 3 * zoom);
  if (zoom >= 0.6) {
    for (let y = left.y - lift + 7 * zoom; y < left.y - 3 * zoom; y += 8 * zoom) ctx.fillRect(left.x + 5 * zoom, y, windowSize, windowSize);
    for (let y = top.y - lift + 7 * zoom; y < top.y - 3 * zoom; y += 8 * zoom) ctx.fillRect(top.x + 4 * zoom, y, windowSize, windowSize);
  }
}

/** Draw an isometric diamond for terrain tiles. */
function drawDiamond(ctx: CanvasRenderingContext2D, px: number, py: number, zoom: number, color: string) {
  const hw = (ISO_TILE_W / 2) * zoom;
  const hh = (ISO_TILE_H / 2) * zoom;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(px + hw, py);
  ctx.lineTo(px + hw * 2, py + hh);
  ctx.lineTo(px + hw, py + hh * 2);
  ctx.lineTo(px, py + hh);
  ctx.closePath();
  ctx.fill();
}

type TileMap = Array<Array<{ type?: string } | undefined>>;

/** Reprojects the already-rendered isometric frame; this is the same map, not a second tile map. */
function isRoadAt(map: TileMap | undefined, col: number, row: number): boolean {
  const type = map?.[row]?.[col]?.type;
  return type === T.ROAD || type === T.BRIDGE;
}

function roadConnections(map: TileMap | undefined, col: number, row: number) {
  return {
    north: isRoadAt(map, col, row - 1),
    east: isRoadAt(map, col + 1, row),
    south: isRoadAt(map, col, row + 1),
    west: isRoadAt(map, col - 1, row),
  };
}

/** Draw a clearly identifiable asphalt street, joining adjacent road tiles. */
function drawRoad(ctx: CanvasRenderingContext2D, px: number, py: number, zoom: number, bridge = false, col = 0, row = 0, map?: TileMap) {
  const hw = (ISO_TILE_W / 2) * zoom;
  const hh = (ISO_TILE_H / 2) * zoom;
  const connections = roadConnections(map, col, row);
  const horizontal = connections.east || connections.west;
  ctx.fillStyle = bridge ? '#75624d' : '#30363b';
  ctx.beginPath();
  ctx.moveTo(px + hw, py); ctx.lineTo(px + hw * 2, py + hh);
  ctx.lineTo(px + hw, py + hh * 2); ctx.lineTo(px, py + hh);
  ctx.closePath(); ctx.fill();
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return;
  ctx.strokeStyle = bridge ? '#d5b06b' : '#737b82';
  ctx.lineWidth = Math.max(1, zoom * 1.5);
  // Use the same adjacency model as the asphalt orientation. Each arm is
  // dashed from the tile centre to its connected neighbor, so turns, T-junctions
  // and four-way junctions cannot retain a misleading straight marking.
  const center = { x: px + hw, y: py + hh };
  const arms = [
    [connections.north, { x: px + hw * 1.5, y: py + hh * 0.5 }],
    [connections.east,  { x: px + hw * 1.5, y: py + hh * 1.5 }],
    [connections.south, { x: px + hw * 0.5, y: py + hh * 1.5 }],
    [connections.west,  { x: px + hw * 0.5, y: py + hh * 0.5 }],
  ] as const;
  ctx.setLineDash(bridge ? [] : [Math.max(2, zoom * 3), Math.max(2, zoom * 2)]);
  for (const [connected, end] of arms) {
    if (!connected) continue;
    ctx.beginPath(); ctx.moveTo(center.x, center.y); ctx.lineTo(end.x, end.y); ctx.stroke();
  }
  ctx.setLineDash([]);
}

/** Draw a crisis/risk tint on a tile. */
function drawCrisisTint(ctx: CanvasRenderingContext2D, px: number, py: number, zoom: number) {
  const hw = (ISO_TILE_W / 2) * zoom;
  const hh = (ISO_TILE_H / 2) * zoom;
  ctx.fillStyle = 'rgba(220,30,30,0.35)';
  ctx.beginPath();
  ctx.moveTo(px + hw, py);
  ctx.lineTo(px + hw * 2, py + hh);
  ctx.lineTo(px + hw, py + hh * 2);
  ctx.lineTo(px, py + hh);
  ctx.closePath();
  ctx.fill();
}

function drawBusinessAccent(ctx: CanvasRenderingContext2D, type: string, col: number, row: number, px: number, py: number, zoom: number, accentTiles: any[] = []) {
  if (type !== T.BLDG_C && type !== T.BLDG_I) return;
  if (!hasBusinessAccent(type, col, row, accentTiles)) return;
  const ax = px + ISO_TILE_W * zoom * .68, ay = py + 4 * zoom;
  if (type === T.BLDG_I) {
    ctx.fillStyle = '#ef6c3b'; ctx.fillRect(ax, ay, 5 * zoom, 8 * zoom);
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(ax + 1.5 * zoom, ay - 3 * zoom, 2 * zoom, 3 * zoom);
  } else {
    ctx.fillStyle = '#f5d547'; ctx.fillRect(ax - 2 * zoom, ay, 9 * zoom, 5 * zoom);
    ctx.fillStyle = '#c9a020'; ctx.fillRect(ax - 2 * zoom, ay, 9 * zoom, 2 * zoom);
  }
}

/** Draw one tile (terrain + optional sprite). `inCrisis` adds a red overlay. */
export function drawIsoTile(
  ctx: CanvasRenderingContext2D,
  tile: { type: string; specialty?: 'hospital' | 'mall-government'; inCrisis?: boolean; growthTier?: 0 | 1 | 2; businessAccentTiles?: any[] },
  col: number,
  row: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
  map?: TileMap,
  project: Projection = (c, r) => { const p = gridToIso(c, r); return { x: p.x * zoom + offsetX, y: p.y * zoom + offsetY }; },
) {
  const { x: px, y: py } = project(col, row);

  if (tile.type === T.WATER) {
    drawDiamond(ctx, px, py, zoom, '#1a5f8a');
    if (zoom >= PROCEDURAL_DETAIL_ZOOM) {
      ctx.strokeStyle = 'rgba(116, 210, 222, .55)'; ctx.lineWidth = Math.max(1, zoom);
      ctx.beginPath(); ctx.moveTo(px + 8 * zoom, py + ISO_TILE_H * zoom * .5); ctx.lineTo(px + ISO_TILE_W * zoom * .5, py + 4 * zoom); ctx.stroke();
    }
    return;
  }

  // This sheet has no standalone road sprite. Keep streets procedural so
  // their asphalt texture remains distinct from grass and decoration.
  if (tile.type === T.ROAD || tile.type === T.BRIDGE) {
    drawRoad(ctx, px, py, zoom, tile.type === T.BRIDGE, col, row, map);
    if (tile.inCrisis) drawCrisisTint(ctx, px, py, zoom);
    return;
  }

  const terrainColor = TERRAIN_COLOR[tile.type];
  if (terrainColor) {
    drawDiamond(ctx, px, py, zoom, terrainColor);
    if (tile.inCrisis) drawCrisisTint(ctx, px, py, zoom);
    return;
  }

  const seed = col * 31 + row * 17;
  if (tile.type === T.BLDG_R || tile.type === T.BLDG_C || tile.type === T.BLDG_I ||
      tile.type === T.ZONE_R || tile.type === T.ZONE_C || tile.type === T.ZONE_I) {
    drawBuilding(tile.type, tile.growthTier ?? 0, { ctx, px, py, zoom, seed }, tile.specialty);
    drawBusinessAccent(ctx, tile.type, col, row, px, py, zoom, tile.businessAccentTiles);
    if (tile.inCrisis) drawCrisisTint(ctx, px, py, zoom);
    return;
  }

  if (tile.type === T.POWER) {
    drawPowerPlant({ ctx, px, py, zoom, seed });
    if (tile.inCrisis) drawCrisisTint(ctx, px, py, zoom);
    return;
  }
  if (tile.type === T.PARK) {
    drawPark({ ctx, px, py, zoom, seed });
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
      [T.ZONE_R]: '#5cbb7a', [T.ZONE_C]: '#2aab8c', [T.ZONE_I]: '#d4822a',
      [T.BLDG_R]: '#4aaa68', [T.BLDG_C]: '#209a7a', [T.BLDG_I]: '#c07118',
      [T.PARK]: '#226633', [T.POWER]: '#d4aa30',
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
  project: Projection = (c, r) => { const p = gridToIso(c, r); return { x: p.x * zoom + offsetX, y: p.y * zoom + offsetY }; },
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
