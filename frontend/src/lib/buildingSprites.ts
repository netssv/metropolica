import { ISO_TILE_H, ISO_TILE_W } from './isoMath.ts';

type DrawArgs = { ctx: CanvasRenderingContext2D; px: number; py: number; zoom: number; seed?: number; night?: boolean; time?: number };
export type HousingProfile = { income: number; householdSize: number };
type Tier = 0 | 1 | 2;
export const PROCEDURAL_DETAIL_ZOOM = 1;
const silhouetteCache = new Map<string, Path2D>();

const palettes = {
  residential: ['#467b59', '#65a86c', '#8dcf82'],
  commercial: ['#285b78', '#327fa1', '#55b9cf'],
  industrial: ['#565b60', '#777d80', '#a0a3a0'],
} as const;
const roofs = ['#b65d4c', '#8a5a3c', '#c9a05a'] as const;
const awnings = ['#e5f6ed', '#f0c85a', '#d98b6c'] as const;
const canopies = ['#72b85f', '#5fa86e', '#9bd477'] as const;
const factoryTint = ['#777d80', '#6a7074', '#8a8680'] as const;

/** Deterministic style index from tile seed. */
export function buildingVariant(seed = 0, count = 3): number {
  return ((seed >>> 0) % count);
}

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

function specialtySilhouette({ ctx, px, py, zoom }: DrawArgs, tier: Tier, kind: 'hospital' | 'mall-government') {
  const w = ISO_TILE_W * zoom, h = ISO_TILE_H * zoom, cx = px + w / 2, base = py + h;
  const baseColor = kind === 'hospital' ? '#789b95' : '#3c8193';
  const accent = kind === 'hospital' ? '#d9364b' : '#f0c85a';
  const height = tier === 0 ? 0 : (tier === 1 ? 7 : 12) * zoom;
  ctx.fillStyle = baseColor;
  ctx.beginPath(); ctx.moveTo(cx, py); ctx.lineTo(px + w, py + h / 2); ctx.lineTo(cx, base); ctx.lineTo(px, py + h / 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.moveTo(cx, base - h * .55 - height); ctx.lineTo(cx + w * .18, base - h * .35 - height); ctx.lineTo(cx, base - h * .2 - height); ctx.lineTo(cx - w * .18, base - h * .35 - height); ctx.closePath(); ctx.fill();
  if (kind === 'hospital') {
    ctx.fillRect(cx - Math.max(1, 1.5 * zoom), base - h * .42 - height, Math.max(2, 3 * zoom), Math.max(2, 6 * zoom));
    ctx.fillRect(cx - Math.max(2, 3 * zoom), base - h * .33 - height, Math.max(4, 6 * zoom), Math.max(2, 2 * zoom));
  } else {
    ctx.fillRect(cx - Math.max(3, 4 * zoom), base - h * .38 - height, Math.max(6, 8 * zoom), Math.max(2, 2 * zoom));
  }
}

function lot({ ctx, px, py, zoom }: DrawArgs, color: string) {
  const { cx, base, hw, hh } = footprint({ ctx, px, py, zoom }, '#263e35', color);
  ctx.fillStyle = color; ctx.fillRect(cx - 2 * zoom, base - hh, 4 * zoom, 2 * zoom);
}

function house(args: DrawArgs, tier: Tier, housing?: HousingProfile) {
  const { ctx, zoom, seed = 0 } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette(args, 'r', tier);
  if (tier === 0) return lot(args, palettes.residential[0]);
  const v = buildingVariant(seed);
  const roof = roofs[v];
  const { cx, base, hw, hh } = footprint(args, palettes.residential[tier], roof);
  const apartment = (housing?.householdSize ?? 0) >= 4 || (housing?.income ?? 0) >= 2500;
  const duplex = !apartment && ((housing?.householdSize ?? 0) >= 3 || (housing?.income ?? 0) >= 1500);
  const height = (tier === 1 ? 12 : apartment ? 34 : duplex ? 25 : 18) * zoom;
  ctx.fillStyle = tier === 1 ? '#5d9866' : '#7fbd72';
  ctx.fillRect(cx - hw * .6, base - hh - height, hw * 1.2, height);
  ctx.fillStyle = args.night ? '#ffe9a3' : '#d7e3c0';
  const wx = cx - hw * (.45 - v * .08);
  for (let y = base - hh - height + 5 * zoom; y < base - hh - 2 * zoom; y += 8 * zoom) ctx.fillRect(wx, y, 3 * zoom, 3 * zoom);
  ctx.fillStyle = roof;
  ctx.beginPath(); ctx.moveTo(cx - hw * .75, base - hh - height); ctx.lineTo(cx, base - hh - height - 7 * zoom); ctx.lineTo(cx + hw * .75, base - hh - height); ctx.closePath(); ctx.fill();
  if (duplex || apartment) {
    ctx.fillStyle = '#d7e3c0';
    for (let floor = 1; floor < (apartment ? 4 : 3); floor++) ctx.fillRect(cx - hw * .48, base - hh - height + floor * 8 * zoom, hw * .96, 2 * zoom);
  }
  if (v !== 1) {
    ctx.fillStyle = '#5a3f2d';
    ctx.fillRect(cx + (v === 0 ? -hw * .45 : hw * .25), base - hh - height - 4 * zoom, 3 * zoom, 6 * zoom);
  }
  if (args.night) {
    const chimneyX = cx + hw * .28, chimneyY = base - hh - height - 3 * zoom;
    ctx.fillStyle = '#5a3f2d'; ctx.fillRect(chimneyX, chimneyY, 3 * zoom, 5 * zoom);
    ctx.fillStyle = 'rgba(220, 228, 220, .32)';
    const smokePhase = (args.time ?? 0) / 700 + seed;
    for (let puff = 0; puff < 3; puff++) {
      const drift = Math.sin(smokePhase + puff) * 2 * zoom;
      ctx.beginPath(); ctx.arc(chimneyX + 1.5 * zoom + drift, chimneyY - (puff + 1) * 4 * zoom, (2 + puff * .7) * zoom, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function shop(args: DrawArgs, tier: Tier) {
  const { ctx, zoom, seed = 0 } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette(args, 'c', tier);
  if (tier === 0) return lot(args, palettes.commercial[0]);
  const v = buildingVariant(seed);
  const { cx, base, hw, hh } = footprint(args, palettes.commercial[tier], '#8bd0df');
  const height = (tier === 1 ? 13 : 29) * zoom;
  ctx.fillStyle = tier === 1 ? '#327fa1' : '#55b9cf'; ctx.fillRect(cx - hw * .72, base - hh - height, hw * 1.44, height);
  ctx.fillStyle = awnings[v]; ctx.fillRect(cx - hw * .72, base - hh - height, hw * 1.44, 4 * zoom);
  ctx.fillStyle = '#163b57';
  for (let x = cx - hw * .5; x < cx + hw * .5; x += 9 * zoom) ctx.fillRect(x, base - hh - height + 8 * zoom, 4 * zoom, Math.max(3, height - 12 * zoom));
  if (tier === 2 && v === 2) {
    ctx.fillStyle = '#c9d6e0';
    ctx.fillRect(cx - 1 * zoom, base - hh - height - 8 * zoom, 2 * zoom, 8 * zoom);
    ctx.fillRect(cx - 3 * zoom, base - hh - height - 9 * zoom, 6 * zoom, 2 * zoom);
  }
}

function factory(args: DrawArgs, tier: Tier) {
  const { ctx, zoom, seed = 0 } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette(args, 'i', tier);
  if (tier === 0) return lot(args, palettes.industrial[0]);
  const v = buildingVariant(seed);
  const { cx, base, hw, hh } = footprint(args, palettes.industrial[tier], '#b5b0a0');
  const height = (tier === 1 ? 10 : 21) * zoom;
  ctx.fillStyle = tier === 1 ? factoryTint[v] : '#a0a3a0'; ctx.fillRect(cx - hw * .8, base - hh - height, hw * 1.6, height);
  ctx.fillStyle = '#3e4548';
  if (v !== 1) ctx.fillRect(cx + hw * .25, base - hh - height - 12 * zoom, 6 * zoom, 12 * zoom);
  if (v !== 0) ctx.fillRect(cx - hw * .55, base - hh - height - (v === 2 ? 10 : 12) * zoom, 5 * zoom, v === 2 ? 10 * zoom : 12 * zoom);
  ctx.fillStyle = '#c6c9b7';
  for (let x = cx - hw * .6; x < cx + hw * .35; x += 10 * zoom) ctx.fillRect(x, base - hh - height + 5 * zoom, 5 * zoom, 4 * zoom);
}

type BuildingSpecialty = 'hospital' | 'mall-government' | 'fish-market' | 'pier' | 'customs' | 'water-treatment';
function specialtyBuilding(args: DrawArgs, tier: Tier, kind: BuildingSpecialty) {
  const { ctx, zoom } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return specialtySilhouette(args, tier, kind === 'hospital' || kind === 'mall-government' ? kind : 'hospital');
  const waterfront = kind === 'fish-market' || kind === 'pier' || kind === 'customs' || kind === 'water-treatment';
  const base = kind === 'hospital' ? '#d8e6e1' : waterfront ? '#3e8292' : '#55a9bd';
  const accent = kind === 'hospital' ? '#d9364b' : kind === 'water-treatment' ? '#8bd8e8' : kind === 'fish-market' ? '#f0c85a' : '#f0c85a';
  const { cx, base: ground, hw, hh } = footprint(args, base, accent);
  const height = (tier === 0 ? 0 : tier === 1 ? 15 : 30) * zoom;
  if (!height) {
    ctx.fillStyle = accent;
    if (kind === 'hospital') {
      ctx.fillRect(cx - 2 * zoom, ground - hh - 7 * zoom, 4 * zoom, 12 * zoom);
      ctx.fillRect(cx - 6 * zoom, ground - hh - 3 * zoom, 12 * zoom, 4 * zoom);
    } else if (kind === 'mall-government') {
      ctx.fillRect(cx - 7 * zoom, ground - hh - 5 * zoom, 14 * zoom, 3 * zoom);
      ctx.fillRect(cx - 4 * zoom, ground - hh - 8 * zoom, 3 * zoom, 6 * zoom);
      ctx.fillRect(cx + 1 * zoom, ground - hh - 8 * zoom, 3 * zoom, 6 * zoom);
    } else {
      ctx.fillStyle = accent;
      ctx.fillRect(cx - 7 * zoom, ground - hh - 5 * zoom, 14 * zoom, 3 * zoom);
      ctx.fillRect(cx - 2 * zoom, ground - hh - 10 * zoom, 4 * zoom, 8 * zoom);
      if (kind === 'water-treatment') { ctx.strokeStyle = '#d7f7ff'; ctx.strokeRect(cx - 8 * zoom, ground - hh - 13 * zoom, 16 * zoom, 8 * zoom); }
      if (kind === 'pier') { ctx.strokeStyle = '#d7b46a'; ctx.beginPath(); ctx.moveTo(cx, ground - hh - 8 * zoom); ctx.lineTo(cx, ground + 3 * zoom); ctx.stroke(); }
    }
    return;
  }
  ctx.fillStyle = base; ctx.fillRect(cx - hw * .72, ground - hh - height, hw * 1.44, height);
  ctx.fillStyle = accent; ctx.fillRect(cx - hw * .72, ground - hh - height, hw * 1.44, 4 * zoom);
  ctx.fillStyle = kind === 'hospital' ? '#f7f3e8' : '#183b57';
  ctx.fillRect(cx - 2 * zoom, ground - hh - height * .65, 4 * zoom, height * .3);
  ctx.fillRect(cx - hw * .25, ground - hh - height * .5, hw * .5, 4 * zoom);
}

export function drawPowerPlant(args: DrawArgs) {
  const { ctx, zoom } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette(args, 'i', 2);
  const { cx, base, hw, hh } = footprint(args, '#59656a', '#c2a84d');
  const height = 18 * zoom;
  ctx.fillStyle = '#747d7d'; ctx.fillRect(cx - hw * .7, base - hh - height, hw * 1.4, height);
  ctx.fillStyle = '#39454a'; ctx.fillRect(cx - hw * .4, base - hh - height - 10 * zoom, 5 * zoom, 10 * zoom);
  ctx.fillRect(cx + hw * .15, base - hh - height - 15 * zoom, 5 * zoom, 15 * zoom);
  ctx.strokeStyle = '#e0c35b'; ctx.lineWidth = Math.max(1, zoom);
  ctx.beginPath(); ctx.moveTo(cx - hw * .85, base - hh - height - 4 * zoom); ctx.lineTo(cx + hw * .85, base - hh - height - 4 * zoom); ctx.stroke();
  ctx.fillStyle = '#f1d76a'; ctx.fillRect(cx - 2 * zoom, base - hh - height + 5 * zoom, 4 * zoom, 4 * zoom);
}

export function drawPark(args: DrawArgs) {
  const { ctx, zoom, seed = 0 } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette(args, 'r', 0);
  const v = buildingVariant(seed);
  const { cx, base, hw, hh } = footprint(args, '#39754c', '#4c9a5d');
  ctx.strokeStyle = '#d5b86b'; ctx.lineWidth = Math.max(1.5, 2 * zoom);
  ctx.beginPath(); ctx.moveTo(cx - hw * .7, base - hh * .9); ctx.lineTo(cx + hw * .65, base - hh * .2); ctx.stroke();
  const offsets = v === 0 ? [-.52, .38] : v === 1 ? [-.35, .5] : [-.6, .2, .45];
  for (const offset of offsets) {
    const tx = cx + hw * offset, ty = base - hh * (offset < 0 ? .9 : 1.15);
    ctx.fillStyle = '#5a3f2d'; ctx.fillRect(tx - 1.5 * zoom, ty, 3 * zoom, 8 * zoom);
    ctx.fillStyle = canopies[v]; ctx.fillRect(tx - 6 * zoom, ty - 7 * zoom, 12 * zoom, 8 * zoom);
    ctx.fillStyle = '#9bd477'; ctx.fillRect(tx - 3 * zoom, ty - 11 * zoom, 6 * zoom, 5 * zoom);
  }
}

export function drawBuilding(type: string, tier: Tier, args: DrawArgs, specialty?: BuildingSpecialty, housing?: HousingProfile) {
  if (specialty) return specialtyBuilding(args, tier, specialty);
  if (type === 'bldg-r' || type === 'zone-r') return house(args, tier, housing);
  if (type === 'bldg-c' || type === 'zone-c') return shop(args, tier);
  if (type === 'bldg-i' || type === 'zone-i') return factory(args, tier);
}
