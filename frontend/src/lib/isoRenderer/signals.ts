import { ISO_TILE_W, ISO_TILE_H } from '../isoMath';
import { signalVisualState } from '../trafficSystem';
import { TileMap } from './types.ts';
import { isRoadAt } from './helpers.ts';

export function drawTrafficSignalHeads(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  zoom: number,
  map: TileMap | undefined,
  col: number,
  row: number,
  time: number,
  project?: (col: number, row: number) => { x: number; y: number }
) {
  if (zoom < 0.6 || !isRoadAt(map, col, row)) return;
  const arms = [
    { col: col, row: row - 1, axis: 'vertical' as const, offset: { x: 16 * zoom, y: -10 * zoom } },
    { col: col + 1, row: row, axis: 'horizontal' as const, offset: { x: 16 * zoom, y: 10 * zoom } },
    { col: col, row: row + 1, axis: 'vertical' as const, offset: { x: -16 * zoom, y: 10 * zoom } },
    { col: col - 1, row: row, axis: 'horizontal' as const, offset: { x: -16 * zoom, y: -10 * zoom } }
  ].filter((arm) => isRoadAt(map, arm.col, arm.row));

  if (arms.length < 3) return;
  const cx = px + (ISO_TILE_W * zoom) / 2;
  const cy = py + (ISO_TILE_H * zoom) / 2;

  for (const arm of arms) {
    const visual = signalVisualState(arm.axis, time);
    const neighbor = project?.(arm.col, arm.row);
    const self = project?.(col, row);
    const dx = neighbor && self ? neighbor.x - self.x : arm.offset.x;
    const dy = neighbor && self ? neighbor.y - self.y : arm.offset.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const sx = cx + (dx / length) * 16 * zoom;
    const sy = cy + (dy / length) * 16 * zoom;

    ctx.strokeStyle = '#20252a';
    ctx.lineWidth = Math.max(1, zoom * 1.2);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy - 8 * zoom);
    ctx.stroke();

    ctx.fillStyle = '#161b20';
    ctx.fillRect(sx - 3 * zoom, sy - 14 * zoom, 6 * zoom, 7 * zoom);

    ctx.fillStyle = visual.color;
    ctx.beginPath();
    ctx.arc(sx, sy - 10.5 * zoom, 2 * zoom, 0, Math.PI * 2);
    ctx.fill();
  }
}
