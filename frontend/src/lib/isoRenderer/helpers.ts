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

export function drawTerrainDetails(ctx: CanvasRenderingContext2D, px: number, py: number, zoom: number, type: string, seed: number, project?: (c:number,r:number)=>{x:number;y:number}, col?: number, row?: number) {
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return;
  const hw = (ISO_TILE_W * zoom) / 2;
  const hh = (ISO_TILE_H * zoom) / 2;
  const cx = px + hw;
  const cy = py + hh;
  // Keep procedural marks aligned with the rotated tile frame. The projected
  // column vector gives the camera's screen-space quarter-turn without
  // touching canonical map coordinates.
  let angle = 0;
  if (project && col != null && row != null) {
    const p = project(col, row), q = project(col + 1, row);
    angle = Math.atan2(q.y - p.y, q.x - p.x) - Math.atan2(ISO_TILE_H, ISO_TILE_W);
  }
  const local = (x:number, y:number) => ({ x: cx + x * Math.cos(angle) - y * Math.sin(angle), y: cy + x * Math.sin(angle) + y * Math.cos(angle) });
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
      const p = local(((7 + ((seed + i * 11) % 17)) - 16) * zoom, ((7 + ((seed + i * 7) % 10)) - 8) * zoom);
      ctx.fillRect(p.x, p.y, 2 * zoom, 2 * zoom);
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

export function isBridgeAt(map: TileMap | undefined, col: number, row: number): boolean {
  return map?.[row]?.[col]?.type === T.BRIDGE;
}

export function isPlainRoadAt(map: TileMap | undefined, col: number, row: number): boolean {
  return map?.[row]?.[col]?.type === T.ROAD;
}

export function buildingStreetInset(map: TileMap | undefined, col: number, row: number, zoom: number, project?: (c:number,r:number)=>{x:number;y:number}) {
  return { x: 0, y: 0 };
}

export function drawCrisisTint(_ctx: CanvasRenderingContext2D, _px: number, _py: number, _zoom: number) {
  // Reddish shadow overlay removed per user request
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
