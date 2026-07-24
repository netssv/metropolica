import type { DrawArgs, Tier, HousingProfile } from './types.ts';
import { PROCEDURAL_DETAIL_ZOOM, palettes, roofs } from './constants.ts';
import { buildingVariant, footprint, silhouette, lot } from './helpers.ts';
import { drawHorizontalDuplex } from './duplexHorizontal.ts';
import { drawVerticalDuplex } from './duplexVertical.ts';
import { drawSingleTileDuplex } from './duplexSingleTile.ts';
import { ISO_TILE_W, ISO_TILE_H } from '../isoMath.ts';
import { drawApartmentBuilding } from './apartment.ts';
import { genericTune } from './genericTuneState.ts';
import {
  getHousePalette,
  drawWhiteBox,
  drawHipRoof,
  drawChimney,
  drawWindow,
  drawDoor,
} from './houseRenderUtils.ts';

export function house(args: DrawArgs, tier: Tier, housing?: HousingProfile) {
  const { ctx, zoom, seed = 0, houseRole = 'single' } = args;

  // Multi-tile cluster roles — DO NOT TOUCH
  if (houseRole === 'duplex-h-a') return drawHorizontalDuplex(args);
  if (houseRole === 'duplex-v-a') return drawVerticalDuplex(args);
  if (houseRole === 'bldg-tl') return drawApartmentBuilding(args);
  if (
    houseRole === 'duplex-h-b' || houseRole === 'duplex-v-b' ||
    houseRole === 'bldg-tr'    || houseRole === 'bldg-bl'    || houseRole === 'bldg-br'
  ) return;

  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette(args, 'r', tier);
  if (tier === 0) return lot(args, palettes.residential[0]);

  const v = buildingVariant(seed);
  const housePal = getHousePalette(seed);
  const roofHex = tier === 1 ? housePal.roof : roofs[v];

  // footprint draws the base lot diamond and returns cx, base, hw, hh
  const { cx, base, hw, hh } = footprint(args, palettes.residential[tier], roofHex);

  const apartment = (housing?.householdSize ?? 0) >= 3;
  const duplex    = !apartment && (housing?.householdSize ?? 0) >= 2;
  const night  = args.night ?? false;
  const time   = args.time  ?? 0;

  // Level 2 / Duplex rendering path: pass full tile half-dimensions, not footprint sub-dimensions
  if (tier === 2 || duplex) {
    return drawSingleTileDuplex(ctx, cx, base, ISO_TILE_W * zoom / 2, ISO_TILE_H * zoom / 2, zoom, night, seed);
  }

  const tune = genericTune.getParams('house');
  const hwScaled = hw * 0.75 * (tune.scaleX ?? 1.0);
  const hhScaled = hh * (tune.scaleY ?? 1.0);
  const height = (tune.height ?? 20) * zoom;
  const peak   = (tune.peak ?? 18) * zoom;
  const eave   = 1.5 * zoom;

  // 1. Isometric walls (matching shop facade bounds & varied palettes)
  drawWhiteBox(ctx, cx, base, hwScaled, hhScaled, height, housePal.wallLight, housePal.wallShade);

  // 2. Hip roof with eave overhang
  drawHipRoof(ctx, cx, base, hwScaled, hhScaled, height, peak, roofHex, eave);

  // 3. Chimney (skipped for duplex-variant 1)
  if (v !== 1 || tier > 1) {
    drawChimney(ctx, cx, base, hwScaled, hhScaled, height, peak, zoom, night, time, seed);
  }

  // 4. Window on SW (lit) face
  drawWindow(ctx, cx, base, hwScaled, hhScaled, height, zoom, night, time, seed);

  // 5. Door on SE (shaded/front) face
  drawDoor(ctx, cx, base, hwScaled, hhScaled, height, zoom);
}
