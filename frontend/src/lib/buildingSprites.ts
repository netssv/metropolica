import { ISO_TILE_H, ISO_TILE_W } from './isoMath';

type DrawArgs = { ctx: CanvasRenderingContext2D; px: number; py: number; zoom: number };
type Tier = 0 | 1 | 2;
export const PROCEDURAL_DETAIL_ZOOM = 1;
const silhouetteCache = new Map<string, Path2D>();

const palettes = {
  residential: ['#467b59', '#65a86c', '#8dcf82'],
  commercial: ['#285b78', '#327fa1', '#55b9cf'],
  industrial: ['#565b60', '#777d80', '#a0a3a0'],
} as const;

function footprint({ ctx, px, py, zoom }: DrawArgs, color: string, roof = color) {
  const cx = px + ISO_TILE_W * zoom / 2, base = py + ISO_TILE_H * zoom;
  const hw = ISO_TILE_W * zoom * .3, hh = ISO_TILE_H * zoom * .3;
  // Paint the complete terrain tile first. Buildings must never expose the
  // canvas clear colour around their small isometric footprint. This is the
  // ground, not a building shadow, so it is fully opaque and terrain-coloured.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(px + ISO_TILE_W * zoom / 2, py);
  ctx.lineTo(px + ISO_TILE_W * zoom, py + ISO_TILE_H * zoom / 2);
  ctx.lineTo(px + ISO_TILE_W * zoom / 2, base);
  ctx.lineTo(px, py + ISO_TILE_H * zoom / 2);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(cx, base - hh * 2); ctx.lineTo(cx + hw, base - hh); ctx.lineTo(cx, base); ctx.lineTo(cx - hw, base - hh); ctx.closePath(); ctx.fill();
  ctx.fillStyle = roof;
  ctx.beginPath(); ctx.moveTo(cx, base - hh * 2); ctx.lineTo(cx + hw, base - hh); ctx.lineTo(cx, base - hh * 1.65); ctx.lineTo(cx - hw, base - hh); ctx.closePath(); ctx.fill();
  return { cx, base, hw, hh };
}

function silhouette({ ctx, px, py, zoom }: DrawArgs, type: 'r' | 'c' | 'i', tier: Tier) {
  const colors = { r: ['#467b59', '#5d9866', '#7fbd72'], c: ['#285b78', '#327fa1', '#55b9cf'], i: ['#565b60', '#777d80', '#a0a3a0'] }[type];
  const key = `${type}:${tier}:${Math.round(zoom * 20) / 20}:${px}:${py}`;
  let path = silhouetteCache.get(key);
  if (!path) {
    const w = ISO_TILE_W * zoom, h = ISO_TILE_H * zoom, cx = w / 2, base = h, hw = w * .3, hh = h * .3;
    const height = tier === 0 ? 0 : (type === 'c' ? 17 : type === 'i' ? 14 : 15) * zoom * (tier === 2 ? 1.7 : 1);
    path = new Path2D();
    path.moveTo(px + cx, py); path.lineTo(px + w, py + h / 2); path.lineTo(px + cx, py + base); path.lineTo(px, py + h / 2); path.closePath();
    path.moveTo(px + cx - hw, py + base - hh); path.lineTo(px + cx, py + base - hh * 2 - height); path.lineTo(px + cx + hw, py + base - hh); path.lineTo(px + cx, py + base); path.closePath();
    silhouetteCache.set(key, path);
  }
  ctx.fillStyle = colors[tier]; ctx.fill(path);
  if (tier > 0) { ctx.strokeStyle = colors[tier]; ctx.lineWidth = Math.max(1, zoom); ctx.stroke(path); }
}

function lot({ ctx, px, py, zoom }: DrawArgs, color: string) {
  const { cx, base, hw, hh } = footprint({ ctx, px, py, zoom }, '#263e35', color);
  ctx.fillStyle = color; ctx.fillRect(cx - 2 * zoom, base - hh, 4 * zoom, 2 * zoom);
}

function house({ ctx, px, py, zoom }: DrawArgs, tier: Tier) {
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette({ ctx, px, py, zoom }, 'r', tier);
  if (tier === 0) return lot({ ctx, px, py, zoom }, palettes.residential[0]);
  const { cx, base, hw, hh } = footprint({ ctx, px, py, zoom }, palettes.residential[tier], '#b65d4c');
  const height = (tier === 1 ? 12 : 25) * zoom;
  ctx.fillStyle = tier === 1 ? '#5d9866' : '#7fbd72';
  ctx.fillRect(cx - hw * .6, base - hh - height, hw * 1.2, height);
  ctx.fillStyle = '#d7e3c0';
  for (let y = base - hh - height + 5 * zoom; y < base - hh - 2 * zoom; y += 8 * zoom) ctx.fillRect(cx - hw * .4, y, 3 * zoom, 3 * zoom);
  ctx.fillStyle = '#b65d4c';
  ctx.beginPath(); ctx.moveTo(cx - hw * .75, base - hh - height); ctx.lineTo(cx, base - hh - height - 7 * zoom); ctx.lineTo(cx + hw * .75, base - hh - height); ctx.closePath(); ctx.fill();
}

function shop({ ctx, px, py, zoom }: DrawArgs, tier: Tier) {
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette({ ctx, px, py, zoom }, 'c', tier);
  if (tier === 0) return lot({ ctx, px, py, zoom }, palettes.commercial[0]);
  const { cx, base, hw, hh } = footprint({ ctx, px, py, zoom }, palettes.commercial[tier], '#8bd0df');
  const height = (tier === 1 ? 13 : 29) * zoom;
  ctx.fillStyle = tier === 1 ? '#327fa1' : '#55b9cf'; ctx.fillRect(cx - hw * .72, base - hh - height, hw * 1.44, height);
  ctx.fillStyle = '#e5f6ed'; ctx.fillRect(cx - hw * .72, base - hh - height, hw * 1.44, 4 * zoom);
  ctx.fillStyle = '#163b57';
  for (let x = cx - hw * .5; x < cx + hw * .5; x += 9 * zoom) ctx.fillRect(x, base - hh - height + 8 * zoom, 4 * zoom, Math.max(3, height - 12 * zoom));
}

function factory({ ctx, px, py, zoom }: DrawArgs, tier: Tier) {
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette({ ctx, px, py, zoom }, 'i', tier);
  if (tier === 0) return lot({ ctx, px, py, zoom }, palettes.industrial[0]);
  const { cx, base, hw, hh } = footprint({ ctx, px, py, zoom }, palettes.industrial[tier], '#b5b0a0');
  const height = (tier === 1 ? 10 : 21) * zoom;
  ctx.fillStyle = tier === 1 ? '#777d80' : '#a0a3a0'; ctx.fillRect(cx - hw * .8, base - hh - height, hw * 1.6, height);
  ctx.fillStyle = '#3e4548'; ctx.fillRect(cx + hw * .25, base - hh - height - 12 * zoom, 6 * zoom, 12 * zoom);
  ctx.fillStyle = '#c6c9b7';
  for (let x = cx - hw * .6; x < cx + hw * .35; x += 10 * zoom) ctx.fillRect(x, base - hh - height + 5 * zoom, 5 * zoom, 4 * zoom);
}

const residentialTier0 = (args: DrawArgs) => house(args, 0);
const residentialTier1 = (args: DrawArgs) => house(args, 1);
const residentialTier2 = (args: DrawArgs) => house(args, 2);
const commercialTier0 = (args: DrawArgs) => shop(args, 0);
const commercialTier1 = (args: DrawArgs) => shop(args, 1);
const commercialTier2 = (args: DrawArgs) => shop(args, 2);
const industrialTier0 = (args: DrawArgs) => factory(args, 0);
const industrialTier1 = (args: DrawArgs) => factory(args, 1);
const industrialTier2 = (args: DrawArgs) => factory(args, 2);

export function drawPowerPlant({ ctx, px, py, zoom }: DrawArgs) {
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette({ ctx, px, py, zoom }, 'i', 2);
  const { cx, base, hw, hh } = footprint({ ctx, px, py, zoom }, '#59656a', '#c2a84d');
  const height = 18 * zoom;
  ctx.fillStyle = '#747d7d'; ctx.fillRect(cx - hw * .7, base - hh - height, hw * 1.4, height);
  ctx.fillStyle = '#39454a'; ctx.fillRect(cx - hw * .4, base - hh - height - 10 * zoom, 5 * zoom, 10 * zoom);
  ctx.fillRect(cx + hw * .15, base - hh - height - 15 * zoom, 5 * zoom, 15 * zoom);
  ctx.strokeStyle = '#e0c35b'; ctx.lineWidth = Math.max(1, zoom);
  ctx.beginPath(); ctx.moveTo(cx - hw * .85, base - hh - height - 4 * zoom); ctx.lineTo(cx + hw * .85, base - hh - height - 4 * zoom); ctx.stroke();
  ctx.fillStyle = '#f1d76a'; ctx.fillRect(cx - 2 * zoom, base - hh - height + 5 * zoom, 4 * zoom, 4 * zoom);
}

export function drawPark({ ctx, px, py, zoom }: DrawArgs) {
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette({ ctx, px, py, zoom }, 'r', 0);
  const { cx, base, hw, hh } = footprint({ ctx, px, py, zoom }, '#39754c', '#4c9a5d');
  ctx.strokeStyle = '#d5b86b'; ctx.lineWidth = Math.max(1.5, 2 * zoom);
  ctx.beginPath(); ctx.moveTo(cx - hw * .7, base - hh * .9); ctx.lineTo(cx + hw * .65, base - hh * .2); ctx.stroke();
  for (const offset of [-.52, .38]) {
    const tx = cx + hw * offset, ty = base - hh * (offset < 0 ? .9 : 1.15);
    ctx.fillStyle = '#5a3f2d'; ctx.fillRect(tx - 1.5 * zoom, ty, 3 * zoom, 8 * zoom);
    ctx.fillStyle = '#72b85f'; ctx.fillRect(tx - 6 * zoom, ty - 7 * zoom, 12 * zoom, 8 * zoom);
    ctx.fillStyle = '#9bd477'; ctx.fillRect(tx - 3 * zoom, ty - 11 * zoom, 6 * zoom, 5 * zoom);
  }
}

export function drawBuilding(type: string, tier: Tier, args: DrawArgs) {
  if (type === 'bldg-r' || type === 'zone-r') return [residentialTier0, residentialTier1, residentialTier2][tier](args);
  if (type === 'bldg-c' || type === 'zone-c') return [commercialTier0, commercialTier1, commercialTier2][tier](args);
  if (type === 'bldg-i' || type === 'zone-i') return [industrialTier0, industrialTier1, industrialTier2][tier](args);
}
