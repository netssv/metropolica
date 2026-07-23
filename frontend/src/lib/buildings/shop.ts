import type { DrawArgs, Tier } from './types.ts';
import { PROCEDURAL_DETAIL_ZOOM, palettes, awnings } from './constants.ts';
import { buildingVariant, footprint, silhouette, lot, drawAnimatedWindow, drawRooftopDetails } from './helpers.ts';

/** Commercial types to give diverse architectural visuals */
const SHOP_TYPES = [
  { name: 'Bodega', signBg: '#e53e3e', signText: 'BODEGA', wall: '#f7fafc', roof: '#cbd5e0', awning: '#e53e3e' },
  { name: 'Tienda de ropa', signBg: '#d69e2e', signText: 'ROPA', wall: '#fff5f5', roof: '#feb2b2', awning: '#f6ad55' },
  { name: 'Ferretería', signBg: '#3182ce', signText: 'FERRE', wall: '#edf2f7', roof: '#a0aec0', awning: '#3182ce' },
  { name: 'Centro comercial', signBg: '#805ad5', signText: 'CENTRO', wall: '#faf5ff', roof: '#e9d8fd', awning: '#9f7aea' },
] as const;

export function shop(args: DrawArgs, tier: Tier) {
  const { ctx, zoom, seed = 0, night = false } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette(args, 'c', tier);
  if (tier === 0) return lot(args, palettes.commercial[0]);

  const v = buildingVariant(seed, 4);
  const shopData = SHOP_TYPES[v % SHOP_TYPES.length];
  const { cx, base, hw, hh } = footprint(args, palettes.commercial[tier], shopData.roof);
  const height = (tier === 1 ? 16 : 32) * zoom;

  // 1. Building Body Facade
  ctx.fillStyle = shopData.wall;
  ctx.fillRect(cx - hw * 0.78, base - hh - height, hw * 1.56, height);

  // 2. Front Awning / Storefront Roof
  ctx.fillStyle = shopData.awning;
  ctx.fillRect(cx - hw * 0.8, base - hh - 8 * zoom, hw * 1.6, 4 * zoom);

  // 3. Display Windows & Storefront Entrance
  const winColor = night ? '#ffe9a3' : '#a0aec0';
  ctx.fillStyle = winColor;
  // Glass storefront lower windows
  ctx.fillRect(cx - hw * 0.65, base - hh - 4 * zoom, hw * 1.3, 4 * zoom);

  // Upper floor windows if tier === 2
  if (tier === 2) {
    for (let wy = base - hh - height + 6 * zoom; wy < base - hh - 12 * zoom; wy += 8 * zoom) {
      for (let wx = cx - hw * 0.6; wx < cx + hw * 0.5; wx += 7 * zoom) {
        drawAnimatedWindow(args, wx, wy, 4, 4, seed + Math.round(wx));
      }
    }
  }

  if (tier === 2) drawRooftopDetails(args, cx, base - hh - height + 6 * zoom, hw * 0.7, seed);

  // 4. Commercial Storefront Signboard (Banner with Shop Identity)
  const signY = base - hh - height - 4 * zoom;
  ctx.fillStyle = shopData.signBg;
  ctx.fillRect(cx - hw * 0.7, signY, hw * 1.4, 5 * zoom);

  // Sign text details when zoom is close enough
  if (zoom >= 0.8) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(7, Math.floor(4 * zoom))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(shopData.signText, cx, signY + 3.8 * zoom);
  }

  // Roof accents (Air Conditioning / Antenna)
  if (v % 2 === 0) {
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(cx - 3 * zoom, base - hh - height - 8 * zoom, 6 * zoom, 4 * zoom);
  }
}
