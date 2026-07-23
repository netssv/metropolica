/**
 * Duplex renderer – draws a wide two-unit townhouse spanning 2 adjacent tiles.
 * Called only on the anchor tile (duplex-a); the partner tile is silent.
 *
 * In isometric space a horizontal duplex (same row, col and col+1) looks like
 * two diamonds side-by-side, so we use the anchor px/py as origin and offset
 * the second unit by one tile width.
 */
import { DrawArgs } from './types.ts';
import { PROCEDURAL_DETAIL_ZOOM, palettes, roofs } from './constants.ts';
import { ISO_TILE_W, ISO_TILE_H } from '../isoMath.ts';

const WALL_A  = '#6ea87a';   // left unit wall
const WALL_B  = '#5d9866';   // right unit wall
const ROOF_A  = '#b65d4c';
const ROOF_B  = '#8a5a3c';
const WIN     = '#ffe9a3';   // lit window
const WIN_DAY = '#d7e3c0';   // day window

export function drawDuplex(args: DrawArgs) {
  const { ctx, px, py, zoom, seed = 0, night = false } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return;

  const TW = ISO_TILE_W * zoom;   // full tile bounding width
  const TH = ISO_TILE_H * zoom;   // full tile bounding height
  const height = 22 * zoom;

  // ── unit A (left/anchor tile) ─────────────────────────────────────────────
  const cxA = px + TW / 2;
  const baseA = py + TH;
  const hwA = TW * 0.3;
  const hhA = TH * 0.3;

  // Ground diamond A
  ctx.fillStyle = palettes.residential[1];
  ctx.beginPath();
  ctx.moveTo(cxA, py);
  ctx.lineTo(px + TW, py + TH / 2);
  ctx.lineTo(cxA, baseA);
  ctx.lineTo(px, py + TH / 2);
  ctx.closePath();
  ctx.fill();

  // Wall A
  ctx.fillStyle = WALL_A;
  ctx.fillRect(cxA - hwA * 0.9, baseA - hhA - height, hwA * 1.8, height);

  // Windows A
  const winColor = night ? WIN : WIN_DAY;
  ctx.fillStyle = winColor;
  for (let wy = baseA - hhA - height + 4 * zoom; wy < baseA - hhA - 4 * zoom; wy += 8 * zoom) {
    ctx.fillRect(cxA - hwA * 0.55, wy, 3 * zoom, 3 * zoom);
    ctx.fillRect(cxA + hwA * 0.15, wy, 3 * zoom, 3 * zoom);
  }

  // Shared party-wall divider line
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = Math.max(1, zoom * 0.8);
  ctx.beginPath();
  ctx.moveTo(cxA + hwA * 0.92, baseA - hhA - height);
  ctx.lineTo(cxA + hwA * 0.92, baseA - hhA);
  ctx.stroke();

  // Roof A
  ctx.fillStyle = ROOF_A;
  ctx.beginPath();
  ctx.moveTo(cxA - hwA, baseA - hhA - height);
  ctx.lineTo(cxA, baseA - hhA - height - 8 * zoom);
  ctx.lineTo(cxA + hwA, baseA - hhA - height);
  ctx.closePath();
  ctx.fill();

  // ── unit B (right tile, offset by one tile to the right in iso) ──────────
  // In iso the next col tile starts at px + TW/2 (screen x shift for col+1)
  const pxB = px + TW / 2;
  const pyB = py + TH / 2;           // col+1, same row → shifted right+down
  const cxB = pxB + TW / 2;
  const baseB = pyB + TH;
  const hwB = TW * 0.3;
  const hhB = TH * 0.3;

  // Ground diamond B
  ctx.fillStyle = palettes.residential[2];
  ctx.beginPath();
  ctx.moveTo(cxB, pyB);
  ctx.lineTo(pxB + TW, pyB + TH / 2);
  ctx.lineTo(cxB, baseB);
  ctx.lineTo(pxB, pyB + TH / 2);
  ctx.closePath();
  ctx.fill();

  // Wall B
  ctx.fillStyle = WALL_B;
  ctx.fillRect(cxB - hwB * 0.9, baseB - hhB - height, hwB * 1.8, height);

  // Windows B
  ctx.fillStyle = winColor;
  for (let wy = baseB - hhB - height + 4 * zoom; wy < baseB - hhB - 4 * zoom; wy += 8 * zoom) {
    ctx.fillRect(cxB - hwB * 0.55, wy, 3 * zoom, 3 * zoom);
    ctx.fillRect(cxB + hwB * 0.15, wy, 3 * zoom, 3 * zoom);
  }

  // Roof B
  ctx.fillStyle = ROOF_B;
  ctx.beginPath();
  ctx.moveTo(cxB - hwB, baseB - hhB - height);
  ctx.lineTo(cxB, baseB - hhB - height - 8 * zoom);
  ctx.lineTo(cxB + hwB, baseB - hhB - height);
  ctx.closePath();
  ctx.fill();
}
