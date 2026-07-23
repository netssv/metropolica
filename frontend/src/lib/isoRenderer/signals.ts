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

  // Render 2 signals per 4-way / 3-way intersection on the corner sidewalks
  const pCenter = project ? project(col, row) : { x: px, y: py };
  const hw = (ISO_TILE_W * zoom) / 2;
  const hh = (ISO_TILE_H * zoom) / 2;
  const cx = pCenter.x + hw;
  const cy = pCenter.y + hh;

  // Signal 1: North Corner Sidewalk
  const sig1 = signalVisualState('vertical', time);
  const s1x = cx;
  const s1y = cy - hh * 0.7;

  // Signal 2: East Corner Sidewalk
  const sig2 = signalVisualState('horizontal', time);
  const s2x = cx + hw * 0.7;
  const s2y = cy;

  const signals = [
    { x: s1x, y: s1y, color: sig1.color },
    { x: s2x, y: s2y, color: sig2.color }
  ];

  for (const s of signals) {
    // Post
    ctx.strokeStyle = '#20252a';
    ctx.lineWidth = Math.max(1.2, zoom * 1.5);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x, s.y - 12 * zoom);
    ctx.stroke();

    // Signal housing box
    ctx.fillStyle = '#161b20';
    ctx.fillRect(s.x - 3 * zoom, s.y - 20 * zoom, 6 * zoom, 9 * zoom);

    // Light bulb
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y - 15.5 * zoom, 2.3 * zoom, 0, Math.PI * 2);
    ctx.fill();
  }
}
