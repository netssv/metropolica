import { ISO_TILE_H, ISO_TILE_W } from '../isoMath.ts';
import { DrawArgs, Tier } from './types.ts';

const silhouetteCache = new Map<string, Path2D>();

export function buildingVariant(seed = 0, count = 3): number {
  return ((seed >>> 0) % count);
}

export function footprint({ ctx, px, py, zoom }: DrawArgs, color: string, roof = color) {
  const cx = px + ISO_TILE_W * zoom / 2;
  const base = py + ISO_TILE_H * zoom;
  const hw = ISO_TILE_W * zoom * 0.3;
  const hh = ISO_TILE_H * zoom * 0.3;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(px + ISO_TILE_W * zoom / 2, py);
  ctx.lineTo(px + ISO_TILE_W * zoom, py + ISO_TILE_H * zoom / 2);
  ctx.lineTo(px + ISO_TILE_W * zoom / 2, base);
  ctx.lineTo(px, py + ISO_TILE_H * zoom / 2);
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
