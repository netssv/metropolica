import { ISO_TILE_W, ISO_TILE_H } from '../isoMath';
import { T } from '../constants';
import { PROCEDURAL_DETAIL_ZOOM } from '../buildingSprites';
import { TileMap } from './types.ts';

export function drawDiamond(ctx: CanvasRenderingContext2D, px: number, py: number, zoom: number, color: string) {
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

export function drawTerrainDetails(ctx: CanvasRenderingContext2D, px: number, py: number, zoom: number, type: string, seed: number) {
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return;
  const hw = (ISO_TILE_W * zoom) / 2;
  const hh = (ISO_TILE_H * zoom) / 2;
  const cx = px + hw;
  const cy = py + hh;
  const variant = Math.abs(seed) % 3;

  if (type === T.TREE) {
    ctx.fillStyle = '#5a3f2d';
    ctx.fillRect(cx - 2 * zoom, cy - 2 * zoom, 4 * zoom, 13 * zoom);
    ctx.fillStyle = ['#276d42', '#347f4b', '#1e5631'][variant];
    ctx.beginPath();
    ctx.arc(cx, cy - 9 * zoom, 9 * zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#58a85e';
    ctx.beginPath();
    ctx.arc(cx - 5 * zoom, cy - 12 * zoom, 5 * zoom, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === T.GRASS) {
    ctx.fillStyle = '#8bcf75';
    for (let i = 0; i < 3; i++) {
      const x = px + (7 + ((seed + i * 11) % 17)) * zoom;
      const y = py + (7 + ((seed + i * 7) % 10)) * zoom;
      ctx.fillRect(x, y, 2 * zoom, 2 * zoom);
    }
  } else if (type === T.SAND) {
    ctx.fillStyle = '#b9a56f';
    ctx.fillRect(cx - 9 * zoom, cy + 2 * zoom, 3 * zoom, 1.5 * zoom);
    ctx.fillRect(cx + 4 * zoom, cy - 6 * zoom, 2 * zoom, 1.5 * zoom);
  }
}

export function isRoadAt(map: TileMap | undefined, col: number, row: number): boolean {
  const type = map?.[row]?.[col]?.type;
  return type === T.ROAD || type === T.BRIDGE;
}

export function isPlainRoadAt(map: TileMap | undefined, col: number, row: number): boolean {
  return map?.[row]?.[col]?.type === T.ROAD;
}

export function buildingStreetInset(map: TileMap | undefined, col: number, row: number, zoom: number) {
  const neighbors = [
    [col, row - 1, 32, 16],
    [col + 1, row, -32, 16],
    [col, row + 1, -32, -16],
    [col - 1, row, 32, -16]
  ].filter(([nc, nr]) => isRoadAt(map, nc, nr));

  if (!neighbors.length) return { x: 0, y: 0 };
  const direction = neighbors.reduce(
    (sum, [, , x, y]) => ({ x: sum.x - Number(x), y: sum.y - Number(y) }),
    { x: 0, y: 0 }
  );
  const length = Math.max(1, Math.hypot(direction.x, direction.y));
  const inset = Math.min(7, 5.5 * zoom);
  return { x: (direction.x / length) * inset, y: (direction.y / length) * inset };
}

export function drawCrisisTint(ctx: CanvasRenderingContext2D, px: number, py: number, zoom: number) {
  drawDiamond(ctx, px, py, zoom, 'rgba(220,30,30,0.35)');
}

/** BFS flood-fill: count all connected PARK tiles in the cluster at (col,row). */
export function parkClusterSize(map: TileMap | undefined, col: number, row: number): number {
  if (!map) return 1;
  const visited = new Set<string>();
  const queue: [number, number][] = [[col, row]];
  while (queue.length) {
    const [c, r] = queue.shift()!;
    const key = `${c}:${r}`;
    if (visited.has(key)) continue;
    visited.add(key);
    for (const [dc, dr] of [[-1,0],[1,0],[0,-1],[0,1]] as const) {
      const nc = c + dc, nr = r + dr;
      if (!visited.has(`${nc}:${nr}`) && map[nr]?.[nc]?.type === T.PARK) {
        queue.push([nc, nr]);
      }
    }
  }
  return visited.size;
}
