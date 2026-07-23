import { ISO_TILE_H, ISO_TILE_W } from '../isoMath.ts';
import type { DrawArgs, Tier } from './types.ts';

const silhouetteCache = new Map<string, Path2D>();

export function buildingVariant(seed = 0, count = 3): number {
  return ((seed >>> 0) % count);
}

/** Small animated details shared by the procedural building renderers. */
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
    ? flicker ? '#fff0a8' : '#d8b968'
    : flicker ? '#f4f7d8' : '#d7e3c0';
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
  // roofY is a point on the visible roof plane, not its far apex. Keeping the
  // supports below this line makes the equipment read as attached to the roof.
  const railY = roofY - 5 * zoom;
  const left = cx - width * zoom;
  const right = cx + width * zoom;
  ctx.save();
  ctx.strokeStyle = industrial ? '#6f7776' : '#9aa99a';
  ctx.lineWidth = Math.max(1, zoom * 0.7);
  ctx.beginPath();
  ctx.moveTo(left, railY); ctx.lineTo(right, railY);
  ctx.moveTo(left, railY - 4 * zoom); ctx.lineTo(right, railY - 4 * zoom);
  for (let x = left; x <= right; x += Math.max(4, 7 * zoom)) {
    ctx.moveTo(x, railY); ctx.lineTo(x, railY - 5 * zoom);
  }
  ctx.stroke();

  const antennaX = cx + (seed % 2 ? width * 0.45 : -width * 0.45) * zoom;
  const antennaTop = railY - (16 + (seed % 3) * 3) * zoom;
  ctx.strokeStyle = '#3d5147';
  ctx.lineWidth = Math.max(1, zoom);
  ctx.beginPath();
  ctx.moveTo(antennaX, railY); ctx.lineTo(antennaX, antennaTop);
  ctx.moveTo(antennaX - 3 * zoom, antennaTop + 4 * zoom); ctx.lineTo(antennaX + 3 * zoom, antennaTop + 4 * zoom);
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
  ctx.moveTo(boardX + boardW * 0.22, boardY + boardH); ctx.lineTo(boardX + boardW * 0.22, roofY + 3 * zoom);
  ctx.moveTo(boardX + boardW * 0.78, boardY + boardH); ctx.lineTo(boardX + boardW * 0.78, roofY + 3 * zoom);
  ctx.stroke();
  ctx.restore();
}

export function footprint(args: DrawArgs, color: string, roof = color) {
  const { ctx, px, py, zoom, project, tileCol, tileRow } = args;
  // A projected tile is not necessarily aligned with the canonical ISO axes
  // after a quarter-turn. Derive its center and extents from neighbouring
  // projected grid points so every facade remains anchored to its real lot.
  let cx = px + ISO_TILE_W * zoom / 2;
  let base = py + ISO_TILE_H * zoom;
  let tileW = ISO_TILE_W * zoom;
  let tileH = ISO_TILE_H * zoom;
  if (project && tileCol != null && tileRow != null) {
    const p = project(tileCol, tileRow);
    const e = project(tileCol + 1, tileRow);
    const s = project(tileCol, tileRow + 1);
    const c = { x: p.x + (e.x - p.x + s.x - p.x) / 2, y: p.y + (e.y - p.y + s.y - p.y) / 2 };
    cx = c.x;
    base = c.y + Math.abs((e.y - p.y) + (s.y - p.y)) / 2;
    tileW = Math.abs(e.x - p.x) + Math.abs(s.x - p.x);
    tileH = Math.abs(e.y - p.y) + Math.abs(s.y - p.y);
  }
  const hw = tileW * 0.3;
  const hh = tileH * 0.3;

  ctx.fillStyle = color;
  ctx.beginPath();
  if (project && tileCol != null && tileRow != null) {
    const p = project(tileCol, tileRow), e = project(tileCol + 1, tileRow), s = project(tileCol, tileRow + 1);
    const se = project(tileCol + 1, tileRow + 1);
    ctx.moveTo(p.x, p.y); ctx.lineTo(e.x, e.y); ctx.lineTo(se.x, se.y); ctx.lineTo(s.x, s.y);
  } else {
    ctx.moveTo(px + ISO_TILE_W * zoom / 2, py);
    ctx.lineTo(px + ISO_TILE_W * zoom, py + ISO_TILE_H * zoom / 2);
    ctx.lineTo(px + ISO_TILE_W * zoom / 2, base);
    ctx.lineTo(px, py + ISO_TILE_H * zoom / 2);
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, base - hh * 2);
  ctx.lineTo(cx + hw, base - hh);
  ctx.lineTo(cx, base);
  ctx.lineTo(cx - hw, base - hh);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(cx, base - hh * 2);
  ctx.lineTo(cx + hw, base - hh);
  ctx.lineTo(cx, base - hh * 1.65);
  ctx.lineTo(cx - hw, base - hh);
  ctx.closePath();
  ctx.fill();

  return { cx, base, hw, hh };
}

export function silhouette({ ctx, px, py, zoom }: DrawArgs, type: 'r' | 'c' | 'i', tier: Tier) {
  const colors = {
    r: ['#467b59', '#5d9866', '#7fbd72'],
    c: ['#285b78', '#327fa1', '#55b9cf'],
    i: ['#565b60', '#777d80', '#a0a3a0']
  }[type];
  const key = `${type}:${tier}:${Math.round(zoom * 20) / 20}:${px}:${py}`;
  let path = silhouetteCache.get(key);
  if (!path) {
    const w = ISO_TILE_W * zoom;
    const h = ISO_TILE_H * zoom;
    const cx = w / 2;
    const base = h;
    const hw = w * 0.3;
    const hh = h * 0.3;
    const height = tier === 0 ? 0 : (type === 'c' ? 17 : type === 'i' ? 14 : 15) * zoom * (tier === 2 ? 1.7 : 1);
    path = new Path2D();
    path.moveTo(px + cx, py);
    path.lineTo(px + w, py + h / 2);
    path.lineTo(px + cx, py + base);
    path.lineTo(px, py + h / 2);
    path.closePath();
    path.moveTo(px + cx - hw, py + base - hh);
    path.lineTo(px + cx, py + base - hh * 2 - height);
    path.lineTo(px + cx + hw, py + base - hh);
    path.lineTo(px + cx, py + base);
    path.closePath();
    silhouetteCache.set(key, path);
  }
  ctx.fillStyle = colors[tier];
  ctx.fill(path);
  if (tier > 0) {
    ctx.strokeStyle = colors[tier];
    ctx.lineWidth = Math.max(1, zoom);
    ctx.stroke(path);
  }
}

export function specialtySilhouette({ ctx, px, py, zoom }: DrawArgs, tier: Tier, kind: 'hospital' | 'mall-government') {
  const w = ISO_TILE_W * zoom;
  const h = ISO_TILE_H * zoom;
  const cx = px + w / 2;
  const base = py + h;
  const baseColor = kind === 'hospital' ? '#789b95' : '#3c8193';
  const accent = kind === 'hospital' ? '#d9364b' : '#f0c85a';
  const height = tier === 0 ? 0 : (tier === 1 ? 7 : 12) * zoom;

  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.moveTo(cx, py);
  ctx.lineTo(px + w, py + h / 2);
  ctx.lineTo(cx, base);
  ctx.lineTo(px, py + h / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(cx, base - h * 0.55 - height);
  ctx.lineTo(cx + w * 0.18, base - h * 0.35 - height);
  ctx.lineTo(cx, base - h * 0.2 - height);
  ctx.lineTo(cx - w * 0.18, base - h * 0.35 - height);
  ctx.closePath();
  ctx.fill();

  if (kind === 'hospital') {
    ctx.fillRect(cx - Math.max(1, 1.5 * zoom), base - h * 0.42 - height, Math.max(2, 3 * zoom), Math.max(2, 6 * zoom));
    ctx.fillRect(cx - Math.max(2, 3 * zoom), base - h * 0.33 - height, Math.max(4, 6 * zoom), Math.max(2, 2 * zoom));
  } else {
    ctx.fillRect(cx - Math.max(3, 4 * zoom), base - h * 0.38 - height, Math.max(6, 8 * zoom), Math.max(2, 2 * zoom));
  }
}

export function lot({ ctx, px, py, zoom }: DrawArgs, color: string) {
  const { cx, base, hw, hh } = footprint({ ctx, px, py, zoom }, '#263e35', color);
  ctx.fillStyle = color;
  ctx.fillRect(cx - 2 * zoom, base - hh, 4 * zoom, 2 * zoom);
}
