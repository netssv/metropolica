import { ISO_TILE_H, ISO_TILE_W } from '../isoMath.ts';
import type { DrawArgs } from './types.ts';

export function buildingVariant(seed = 0, count = 3): number {
  return (seed >>> 0) % count;
}

/** Small animated details shared by procedural building renderers. */
export function drawAnimatedWindow(
  { ctx, zoom, night = false, time = 0 }: DrawArgs,
  x: number,
  y: number,
  width: number,
  height: number,
  seed = 0
) {
  const flicker = Math.sin(time / 900 + seed * 1.73) > 0.72;
  ctx.fillStyle = night
    ? flicker
      ? '#fff0a8'
      : '#d8b968'
    : flicker
    ? '#f4f7d8'
    : '#d7e3c0';
  ctx.fillRect(x, y, width * zoom, height * zoom);
}

export function drawRooftopDetails(
  { ctx, zoom }: DrawArgs,
  cx: number,
  roofY: number,
  width: number,
  seed = 0,
  industrial = false
) {
  const railY = roofY - 5 * zoom;
  const left = cx - width * zoom;
  const right = cx + width * zoom;
  ctx.save();
  ctx.strokeStyle = industrial ? '#6f7776' : '#9aa99a';
  ctx.lineWidth = Math.max(1, zoom * 0.7);
  ctx.beginPath();
  ctx.moveTo(left, railY);
  ctx.lineTo(right, railY);
  ctx.moveTo(left, railY - 4 * zoom);
  ctx.lineTo(right, railY - 4 * zoom);
  for (let x = left; x <= right; x += Math.max(4, 7 * zoom)) {
    ctx.moveTo(x, railY);
    ctx.lineTo(x, railY - 5 * zoom);
  }
  ctx.stroke();

  const antennaX = cx + (seed % 2 ? width * 0.45 : -width * 0.45) * zoom;
  const antennaTop = railY - (16 + (seed % 3) * 3) * zoom;
  ctx.strokeStyle = '#3d5147';
  ctx.lineWidth = Math.max(1, zoom);
  ctx.beginPath();
  ctx.moveTo(antennaX, railY);
  ctx.lineTo(antennaX, antennaTop);
  ctx.moveTo(antennaX - 3 * zoom, antennaTop + 4 * zoom);
  ctx.lineTo(antennaX + 3 * zoom, antennaTop + 4 * zoom);
  ctx.stroke();

  const boardW = width * 1.55 * zoom;
  const boardH = 10 * zoom;
  const boardX = cx - boardW / 2;
  const boardY = railY - 16 * zoom;
  ctx.fillStyle = industrial ? '#d6a23d' : '#4f82c7';
  ctx.fillRect(boardX, boardY, boardW, boardH);
  ctx.strokeStyle = '#e8f0d4';
  ctx.lineWidth = Math.max(1, zoom * 0.8);
  ctx.strokeRect(boardX, boardY, boardW, boardH);
  ctx.fillStyle = '#f8f2cf';
  ctx.fillRect(boardX + 3 * zoom, boardY + 3 * zoom, boardW - 6 * zoom, Math.max(1.5, zoom * 1.5));
  ctx.strokeStyle = '#3d5147';
  ctx.beginPath();
  ctx.moveTo(boardX + boardW * 0.22, boardY + boardH);
  ctx.lineTo(boardX + boardW * 0.22, roofY + 3 * zoom);
  ctx.moveTo(boardX + boardW * 0.78, boardY + boardH);
  ctx.lineTo(boardX + boardW * 0.78, roofY + 3 * zoom);
  ctx.stroke();
  ctx.restore();
}

export function footprint(args: DrawArgs, color: string, roof = color) {
  const { ctx, px, py, zoom, project, tileCol, tileRow } = args;

  let cx = px + (ISO_TILE_W * zoom) / 2;
  let base = py + ISO_TILE_H * zoom;

  if (project && tileCol != null && tileRow != null) {
    const p = project(tileCol, tileRow);
    cx = p.x + (ISO_TILE_W * zoom) / 2;
    base = p.y + ISO_TILE_H * zoom;
  }

  const hw = ISO_TILE_W * zoom * 0.3;
  const hh = ISO_TILE_H * zoom * 0.3;

  ctx.fillStyle = color;
  ctx.beginPath();
  if (project && tileCol != null && tileRow != null) {
    const p = project(tileCol, tileRow);
    ctx.moveTo(p.x + (ISO_TILE_W * zoom) / 2, p.y);
    ctx.lineTo(p.x + ISO_TILE_W * zoom, p.y + (ISO_TILE_H * zoom) / 2);
    ctx.lineTo(p.x + (ISO_TILE_W * zoom) / 2, p.y + ISO_TILE_H * zoom);
    ctx.lineTo(p.x, p.y + (ISO_TILE_H * zoom) / 2);
  } else {
    ctx.moveTo(px + (ISO_TILE_W * zoom) / 2, py);
    ctx.lineTo(px + ISO_TILE_W * zoom, py + (ISO_TILE_H * zoom) / 2);
    ctx.lineTo(px + (ISO_TILE_W * zoom) / 2, base);
    ctx.lineTo(px, py + (ISO_TILE_H * zoom) / 2);
  }
  ctx.closePath();
  ctx.fill();

  return { cx, base, hw, hh };
}

export function lot({ ctx, px, py, zoom }: DrawArgs, color: string) {
  const { cx, base, hh } = footprint({ ctx, px, py, zoom }, '#263e35', color);
  ctx.fillStyle = color;
  ctx.fillRect(cx - 2 * zoom, base - hh, 4 * zoom, 2 * zoom);
}

export { silhouette, specialtySilhouette } from './buildingSilhouettes.ts';
