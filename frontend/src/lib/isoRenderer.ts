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
import { T } from './constants';

const SPRITE_COLS = 5;
const SPRITE_ROWS = 6;
let spriteSheet: HTMLCanvasElement | null = null;
let waterImg: HTMLImageElement | null = null;

function loadImg(src: string, onLoad?: (img: HTMLImageElement) => void): HTMLImageElement {
  const img = new Image();
  if (onLoad) img.onload = () => onLoad(img);
  img.src = src;
  return img;
}

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
  // Remove anti-aliased pink/red fringe immediately beside the keyed
  // background. Because this is restricted to keyed neighbors, red details
  // inside the sprite remain untouched.
  for (let pass = 0; pass < 2; pass++) for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pixel = y * width + x;
      const i = pixel * 4;
      if (data[i + 3] === 0 || data[i] < 150 || data[i] <= data[i + 1] * 1.8 || data[i] <= data[i + 2] * 1.8) continue;
      if (data[(pixel - 1) * 4 + 3] === 0 || data[(pixel + 1) * 4 + 3] === 0 ||
          data[(pixel - width) * 4 + 3] === 0 || data[(pixel + width) * 4 + 3] === 0) {
        data[i + 3] = 0;
      }
    }
  }
  keyCtx.putImageData(pixels, 0, 0);
  spriteSheet = canvas;
}

export function ensureSpritesLoaded() {
  if (!spriteSheet) loadImg('/sprites/tiles.png', keySpriteSheet);
  if (!waterImg)   waterImg   = loadImg('/sprites/water.png');
}

/** Sprite positions in the sheet (col, row) — 0-indexed */
const SPRITE_POS: Record<string, Array<{ sc: number; sr: number }>> = {
  // Empty zones (T.ZONE_*) are NOT mapped here so they render as colored diamond terrain.
  [T.BLDG_R]: [{ sc: 1, sr: 3 }, { sc: 2, sr: 3 }, { sc: 3, sr: 3 }],
  [T.BLDG_C]: [{ sc: 4, sr: 3 }, { sc: 0, sr: 4 }],
  [T.BLDG_I]: [{ sc: 1, sr: 4 }, { sc: 2, sr: 4 }, { sc: 3, sr: 4 }, { sc: 4, sr: 4 }],
  [T.PARK]:   [{ sc: 0, sr: 1 }, { sc: 1, sr: 1 }],
  [T.POWER]:  [{ sc: 2, sr: 2 }],
};

/** Solid diamond colours for terrain tiles that have no sprite */
const TERRAIN_COLOR: Record<string, string> = {
  [T.GRASS]:  '#2d6a4f',
  [T.ROAD]:   '#b8b4a8',
  [T.SAND]:   '#d4c8a0',
  [T.BRIDGE]: '#888',
  [T.TREE]:   '#1e5631',
};

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

/** Draw one tile (terrain + optional sprite). `inCrisis` adds a red overlay. */
export function drawIsoTile(
  ctx: CanvasRenderingContext2D,
  tile: { type: string; inCrisis?: boolean },
  col: number,
  row: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
  map?: TileMap,
) {
  const { x, y } = gridToIso(col, row);
  const px = x * zoom + offsetX;
  const py = y * zoom + offsetY;

  if (tile.type === T.WATER) {
    if (waterImg?.complete) {
      const tw = ISO_TILE_W * zoom;
      const th = ISO_TILE_H * zoom;
      ctx.drawImage(waterImg, px, py, tw, th);
    } else {
      drawDiamond(ctx, px, py, zoom, '#1a5f8a');
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

  const spriteVariants = SPRITE_POS[tile.type];
  if (spriteVariants && spriteSheet && spriteSheet.width > 0) {
    const sprPos = spriteVariants[(col * 31 + row * 17) % spriteVariants.length];
    const sw = spriteSheet.width / SPRITE_COLS;
    const sh = spriteSheet.height / SPRITE_ROWS;
    const drawW = ISO_TILE_W * zoom * 1.4;
    const drawH = ISO_TILE_H * zoom * 3.2;
    // Sprite-sheet cells include generous transparent/red padding. Anchor the
    // rendered cell's bottom-center at the tile's bottom vertex, rather than
    // using a fixed top-left offset from the previous asset set.
    const tileBottomX = px + (ISO_TILE_W / 2) * zoom;
    const tileBottomY = py + ISO_TILE_H * zoom;
    ctx.drawImage(
      spriteSheet,
      sprPos.sc * sw, sprPos.sr * sh, sw, sh,
      tileBottomX - drawW / 2, tileBottomY - drawH, drawW, drawH,
    );
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
) {
  const { x, y } = gridToIso(col, row);
  const px = x * zoom + offsetX;
  const py = y * zoom + offsetY;
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
