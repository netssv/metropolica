import type { DrawArgs, Tier, HousingProfile } from './types.ts';
import { PROCEDURAL_DETAIL_ZOOM, palettes, roofs } from './constants.ts';
import { buildingVariant, footprint, silhouette, lot } from './helpers.ts';
import { drawDuplex } from './duplex.ts';
import { drawSingleTileDuplex } from './duplexRenderUtils.ts';
import { ISO_TILE_W, ISO_TILE_H } from '../isoMath.ts';
import { drawApartmentBuilding } from './apartment.ts';
import {
  drawWhiteBox,
  drawHipRoof,
  drawChimney,
  drawWindow,
  drawDoor,
} from './houseRenderUtils.ts';

export function house(args: DrawArgs, tier: Tier, housing?: HousingProfile) {
  const { ctx, zoom, seed = 0, houseRole = 'single' } = args;

  // Multi-tile cluster roles — DO NOT TOUCH
  if (houseRole === 'duplex-h-a' || houseRole === 'duplex-v-a') {
    return drawDuplex(args, houseRole === 'duplex-h-a' ? 'horizontal' : 'vertical');
  }
  if (houseRole === 'bldg-tl') return drawApartmentBuilding(args);
  if (
    houseRole === 'duplex-h-b' || houseRole === 'duplex-v-b' ||
    houseRole === 'bldg-tr'    || houseRole === 'bldg-bl'    || houseRole === 'bldg-br'
  ) return;

  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette(args, 'r', tier);
  if (tier === 0) return lot(args, palettes.residential[0]);

  const v = buildingVariant(seed);
  const roofHex = tier === 1 ? '#b83232' : roofs[v];

  // footprint draws the base lot diamond and returns cx, base, hw, hh
  const { cx, base, hw, hh } = footprint(args, palettes.residential[tier], roofHex);

  const apartment = (housing?.householdSize ?? 0) >= 3;
  const duplex    = !apartment && (housing?.householdSize ?? 0) >= 2;
  const night  = args.night ?? false;
  const time   = args.time  ?? 0;

  // Level 2 / Duplex rendering path: pass full tile half-dimensions, not footprint sub-dimensions
  if (tier === 2 || duplex) {
    return drawSingleTileDuplex(ctx, cx, base, ISO_TILE_W * zoom / 2, ISO_TILE_H * zoom / 2, zoom, night);
  }

  const height = (tier === 1 ? 16 : apartment ? 30 : 18) * zoom;
  const peak   = 9 * zoom;
  const eave   = 1.5 * zoom;

  // 1. White isometric walls (matching shop facade bounds)
  drawWhiteBox(ctx, cx, base, hw * 0.75, hh, height);

  // 2. Hip roof with eave overhang
  drawHipRoof(ctx, cx, base, hw * 0.75, hh, height, peak, roofHex, eave);

  // 3. Chimney (skipped for duplex-variant 1)
  if (v !== 1 || tier > 1) {
    drawChimney(ctx, cx, base, hw * 0.75, hh, height, peak, zoom, night, time, seed);
  }

  // 4. Window on SW (lit) face
  drawWindow(ctx, cx, base, hw * 0.75, hh, height, zoom, night, time, seed);

  // 5. Door on SE (shaded/front) face
  drawDoor(ctx, cx, base, hw * 0.75, hh, height, zoom);
}

