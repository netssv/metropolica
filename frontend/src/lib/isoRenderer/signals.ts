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
  
  // Check neighbors to ensure this tile is an intersection
  const neighbors = [
    { col: col, row: row - 1, axis: 'vertical' as const },
    { col: col + 1, row: row, axis: 'horizontal' as const },
    { col: col, row: row + 1, axis: 'vertical' as const },
    { col: col - 1, row: row, axis: 'horizontal' as const }
  ].filter((arm) => isRoadAt(map, arm.col, arm.row));

  if (neighbors.length < 3) return;

  // Render 4 signals per 4-way / 3-way intersection on the corner sidewalks
  const pCenter = project ? project(col, row) : { x: px, y: py };
  const hw = (ISO_TILE_W * zoom) / 2;
  const hh = (ISO_TILE_H * zoom) / 2;
  const cx = pCenter.x + hw;
  const cy = pCenter.y + hh;

  const sigV = signalVisualState('vertical', time);
  const sigH = signalVisualState('horizontal', time);

  // 4 traffic lights located on all 4 corner sidewalks surrounding the intersection:
  // North (Top): Vertical axis | East (Right): Horizontal axis
  // South (Bottom): Vertical axis | West (Left): Horizontal axis
  const signals = [
    { x: cx, y: cy - hh * 0.72, state: sigV.state },
    { x: cx + hw * 0.72, y: cy, state: sigH.state },
    { x: cx, y: cy + hh * 0.72, state: sigV.state },
    { x: cx - hw * 0.72, y: cy, state: sigH.state },
  ];

  for (const s of signals) {
    const postH = 15 * zoom;
    const boxW = 5.5 * zoom;
    const boxH = 13.5 * zoom;
    const boxTop = s.y - postH - boxH / 2;

    // Post
    ctx.strokeStyle = '#1a1f26';
    ctx.lineWidth = Math.max(1.5, zoom * 1.8);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x, s.y - postH);
    ctx.stroke();

    // Signal housing box
    ctx.fillStyle = '#111518';
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(s.x - boxW / 2, boxTop, boxW, boxH, 2 * zoom);
    } else {
      ctx.rect(s.x - boxW / 2, boxTop, boxW, boxH);
    }
    ctx.fill();
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = Math.max(0.8, zoom * 0.9);
    ctx.stroke();

    // 3 Lenses: Red (top), Yellow (middle), Green (bottom)
    const lensR = 1.6 * zoom;
    const rY = boxTop + 3 * zoom;
    const yY = boxTop + 6.75 * zoom;
    const gY = boxTop + 10.5 * zoom;

    const isRed = s.state === 'red';
    const isYellow = s.state === 'yellow';
    const isGreen = s.state === 'green';

    // Red lens
    ctx.fillStyle = isRed ? '#f04d55' : '#3a1518';
    ctx.beginPath();
    ctx.arc(s.x, rY, lensR, 0, Math.PI * 2);
    ctx.fill();
    if (isRed) {
      ctx.fillStyle = 'rgba(240, 77, 85, 0.4)';
      ctx.beginPath();
      ctx.arc(s.x, rY, lensR * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Yellow lens
    ctx.fillStyle = isYellow ? '#ffd447' : '#3a3212';
    ctx.beginPath();
    ctx.arc(s.x, yY, lensR, 0, Math.PI * 2);
    ctx.fill();
    if (isYellow) {
      ctx.fillStyle = 'rgba(255, 212, 71, 0.4)';
      ctx.beginPath();
      ctx.arc(s.x, yY, lensR * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Green lens
    ctx.fillStyle = isGreen ? '#38d26f' : '#10351d';
    ctx.beginPath();
    ctx.arc(s.x, gY, lensR, 0, Math.PI * 2);
    ctx.fill();
    if (isGreen) {
      ctx.fillStyle = 'rgba(56, 210, 111, 0.4)';
      ctx.beginPath();
      ctx.arc(s.x, gY, lensR * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
