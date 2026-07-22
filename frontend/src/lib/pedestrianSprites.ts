import { ISO_TILE_H, ISO_TILE_W } from './isoMath.ts';

type MapTile = { type?: string } | null;

function hash(col: number, row: number) { return Math.abs((col * 73856093) ^ (row * 19349663)); }

/** Decorative pedestrians: visual only, never added to the simulation roster. */
export function drawDecorativePedestrians(ctx: CanvasRenderingContext2D, map: MapTile[][], project: (col: number, row: number) => { x: number; y: number }, zoom: number, time: number) {
  if (zoom < 2) return;
  for (let row = 0; row < map.length; row++) for (let col = 0; col < (map[row]?.length ?? 0); col++) {
    if (map[row]?.[col]?.type !== 'road' && map[row]?.[col]?.type !== 'bridge') continue;
    const seed = hash(col, row);
    if (seed % 3 !== 0) continue;
    const point = project(col, row);
    const horizontal = Boolean(map[row]?.[col - 1]?.type === 'road' || map[row]?.[col + 1]?.type === 'road');
    const phase = time / 2200 + seed * .013;
    const travel = Math.sin(phase) * ISO_TILE_W * zoom * .12;
    const buildingNearby = [[col - 1, row], [col + 1, row], [col, row - 1], [col, row + 1]]
      .some(([nc, nr]) => { const type = map[nr]?.[nc]?.type; return Boolean(type?.startsWith('bldg-') || type?.startsWith('zone-')); });
    const actionPhase = (time / 5200 + seed * .007) % 1;
    const entering = buildingNearby && actionPhase < .22;
    const leaving = buildingNearby && actionPhase > .78;
    const doorwayMotion = entering ? (actionPhase / .22) : leaving ? ((1 - actionPhase) / .22) : 0;
    const side = horizontal ? -4 * zoom : 4 * zoom;
    const x = point.x + ISO_TILE_W * zoom * .5 + (horizontal ? 0 : travel) + (horizontal ? doorwayMotion * side : 0);
    const y = point.y + ISO_TILE_H * zoom * .5 + (horizontal ? travel * .45 : 0) + 3 * zoom + (!horizontal ? doorwayMotion * side : 0);
    ctx.save(); ctx.translate(x + side, y);
    const walkPhase = phase * Math.PI * 2;
    const bob = Math.abs(Math.sin(walkPhase)) * 1.2 * zoom;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 5 * zoom, 3 * zoom, 1.2 * zoom, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = seed % 2 ? '#f0a35b' : '#72b7d8'; ctx.lineWidth = Math.max(1, zoom);
    const step = Math.sin(walkPhase) * 2.4 * zoom;
    ctx.beginPath(); ctx.moveTo(0, 1 * zoom - bob); ctx.lineTo(-2 * zoom + step, 7 * zoom); ctx.moveTo(0, 1 * zoom - bob); ctx.lineTo(2 * zoom - step, 7 * zoom); ctx.stroke();
    ctx.fillStyle = seed % 2 ? '#d95f76' : '#4f8cbd'; ctx.fillRect(-2 * zoom, -4 * zoom - bob, 4 * zoom, 6 * zoom);
    ctx.fillStyle = '#e0a477'; ctx.beginPath(); ctx.arc(0, -6 * zoom - bob, 2 * zoom, 0, Math.PI * 2); ctx.fill();
    if (entering || leaving) {
      ctx.fillStyle = '#f6d365'; ctx.fillRect(-1.5 * zoom, -2 * zoom - bob, 3 * zoom, 1.5 * zoom);
    }
    ctx.restore();
  }
}
