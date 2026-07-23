import type { DrawArgs, Tier, HousingProfile } from './types.ts';
import { PROCEDURAL_DETAIL_ZOOM, palettes, roofs } from './constants.ts';
import { buildingVariant, footprint, silhouette, lot, drawAnimatedWindow } from './helpers.ts';
import { drawDuplex } from './duplex.ts';
import { drawApartmentBuilding } from './apartment.ts';

export function house(args: DrawArgs, tier: Tier, housing?: HousingProfile) {
  const { ctx, zoom, seed = 0, houseRole = 'single' } = args;

  // Handle multi-tile house cluster roles
  if (houseRole === 'duplex-h-a' || houseRole === 'duplex-v-a') {
    return drawDuplex(args, houseRole === 'duplex-h-a' ? 'horizontal' : 'vertical');
  }
  if (houseRole === 'bldg-tl') {
    return drawApartmentBuilding(args);
  }
  if (
    houseRole === 'duplex-h-b' ||
    houseRole === 'duplex-v-b' ||
    houseRole === 'bldg-tr' ||
    houseRole === 'bldg-bl' ||
    houseRole === 'bldg-br'
  ) {
    // Partner tile in cluster, anchor tile handles visual drawing
    return;
  }

  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette(args, 'r', tier);
  if (tier === 0) return lot(args, palettes.residential[0]);

  const v = buildingVariant(seed);
  const roof = roofs[v];
  const { cx, base, hw, hh } = footprint(args, palettes.residential[tier], roof);

  const apartment = (housing?.householdSize ?? 0) >= 3;
  const duplex = !apartment && (housing?.householdSize ?? 0) >= 2;
  const height = (tier === 1 ? 12 : apartment ? 34 : duplex ? 25 : 18) * zoom;

  ctx.fillStyle = tier === 1 ? '#5d9866' : '#7fbd72';
  ctx.fillRect(cx - hw * 0.6, base - hh - height, hw * 1.2, height);

  const wx = cx - hw * (0.45 - v * 0.08);
  for (let y = base - hh - height + 5 * zoom; y < base - hh - 2 * zoom; y += 8 * zoom) {
    drawAnimatedWindow(args, wx, y, 3, 3, seed);
  }

  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(cx - hw * 0.75, base - hh - height);
  ctx.lineTo(cx, base - hh - height - 7 * zoom);
  ctx.lineTo(cx + hw * 0.75, base - hh - height);
  ctx.closePath();
  ctx.fill();

  if (duplex || apartment) {
    ctx.fillStyle = '#d7e3c0';
    for (let floor = 1; floor < (apartment ? 4 : 3); floor++) {
      ctx.fillRect(cx - hw * 0.48, base - hh - height + floor * 8 * zoom, hw * 0.96, 2 * zoom);
    }
  }

  if (v !== 1) {
    ctx.fillStyle = '#5a3f2d';
    ctx.fillRect(cx + (v === 0 ? -hw * 0.45 : hw * 0.25), base - hh - height - 4 * zoom, 3 * zoom, 6 * zoom);
  }

  if (args.night) {
    const chimneyX = cx + hw * 0.28;
    const chimneyY = base - hh - height - 3 * zoom;
    ctx.fillStyle = '#5a3f2d';
    ctx.fillRect(chimneyX, chimneyY, 3 * zoom, 5 * zoom);

    ctx.fillStyle = 'rgba(220, 228, 220, 0.32)';
    const smokePhase = (args.time ?? 0) / 700 + seed;
    for (let puff = 0; puff < 3; puff++) {
      const drift = Math.sin(smokePhase + puff) * 2 * zoom;
      ctx.beginPath();
      ctx.arc(
        chimneyX + 1.5 * zoom + drift,
        chimneyY - (puff + 1) * 4 * zoom,
        (2 + puff * 0.7) * zoom,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}
