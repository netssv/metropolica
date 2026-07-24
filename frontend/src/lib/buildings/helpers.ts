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

/**
 * Draws the base lot diamond for a single tile and returns key metrics.
 *
 * All 4 diamond vertices are derived from a SINGLE project(col, row) call:
 *   vTop    = (p.x + TW/2,  p.y)
 *   vRight  = (p.x + TW,    p.y + TH/2)
 *   vBottom = (p.x + TW/2,  p.y + TH)
 *   vLeft   = (p.x,         p.y + TH/2)
 *
 * These offsets are identical at every camera rotation because project()
 * already applies the gridToView remapping — the bounding box is always
 * TW × TH with the diamond centered inside.
 */
export function footprint(args: DrawArgs, color: string, _roof = color) {
  const { ctx, px, py, zoom, project, tileCol, tileRow } = args;
  const TW = ISO_TILE_W * zoom;
  const TH = ISO_TILE_H * zoom;

  // Single project() call — all 4 vertices are fixed offsets from this box.
  const p = (project && tileCol != null && tileRow != null)
    ? project(tileCol, tileRow)
    : { x: px, y: py };

  const vTop    = { x: p.x + TW / 2, y: p.y          };
  const vRight  = { x: p.x + TW,     y: p.y + TH / 2 };
  const vBottom = { x: p.x + TW / 2, y: p.y + TH      };
  const vLeft   = { x: p.x,          y: p.y + TH / 2  };

  // cx / base — used by all single-tile building renderers
  const cx   = p.x + TW / 2;
  const base = p.y + TH;

  // hw / hh — interior footprint sub-extents (≈30 % of tile)
  const hw = TW * 0.3;
  const hh = TH * 0.3;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(vTop.x,    vTop.y);
  ctx.lineTo(vRight.x,  vRight.y);
  ctx.lineTo(vBottom.x, vBottom.y);
  ctx.lineTo(vLeft.x,   vLeft.y);
  ctx.closePath();
  ctx.fill();

  return { cx, base, hw, hh, vTop, vRight, vBottom, vLeft };
}

export function lot({ ctx, px, py, zoom }: DrawArgs, color: string) {
  const { cx, base, hh } = footprint({ ctx, px, py, zoom }, '#263e35', color);
  ctx.fillStyle = color;
  ctx.fillRect(cx - 2 * zoom, base - hh, 4 * zoom, 2 * zoom);
}

export { silhouette, specialtySilhouette } from './buildingSilhouettes.ts';
