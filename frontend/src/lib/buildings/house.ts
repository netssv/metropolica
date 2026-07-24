import type { DrawArgs, Tier, HousingProfile } from './types.ts';
import { PROCEDURAL_DETAIL_ZOOM, palettes, roofs } from './constants.ts';
import { buildingVariant, footprint, silhouette, lot } from './helpers.ts';
import { drawHorizontalDuplex } from './duplexHorizontal.ts';
import { drawVerticalDuplex } from './duplexVertical.ts';
import { drawSingleTileDuplex } from './duplexSingleTile.ts';

import { drawApartmentBuilding } from './apartment.ts';
import { genericTune } from './genericTuneState.ts';
import {
  getHousePalette,
  drawWhiteBox,
  drawHipRoof,
  drawChimney,
  drawOrientedHouse,
} from './houseRenderUtils.ts';
import { getBuildingFacing } from './streetOrientation.ts';

export function house(args: DrawArgs, tier: Tier, housing?: HousingProfile) {
  const { ctx, zoom, seed = 0, houseRole = 'single', map, tileCol, tileRow } = args;

  // Multi-tile cluster roles — DO NOT TOUCH
  if (houseRole === 'duplex-h-a') return drawHorizontalDuplex(args);
  if (houseRole === 'duplex-v-a') return drawVerticalDuplex(args);
  if (houseRole === 'bldg-tl') return drawApartmentBuilding(args);
  if (
    houseRole === 'duplex-h-b' || houseRole === 'duplex-v-b' ||
    houseRole === 'bldg-tr'    || houseRole === 'bldg-bl'    || houseRole === 'bldg-br'
  ) return;

  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette(args, 'r', tier);

  // Derive active rendering tier: constructed buildings always draw structure (tier 1 min)
  const activeTier = (tier === 0 && args.houseRole !== undefined) ? 1 : Math.max(1, tier);
  if (tier === 0 && !args.houseRole && (housing?.householdSize ?? 0) === 0) {
    // Empty zoned lot before construction
    return lot(args, palettes.residential[0]);
  }

  const v = buildingVariant(seed);
  const housePal = getHousePalette(seed);
  const roofHex = activeTier === 1 ? housePal.roof : roofs[v];

  // footprint draws the base lot diamond and returns cx, base, hw, hh
  const { cx, base, hw, hh } = footprint(args, palettes.residential[activeTier], roofHex);

  const apartment = (housing?.householdSize ?? 0) >= 3;
  const duplex    = !apartment && (housing?.householdSize ?? 0) >= 2;
  const night  = args.night ?? false;
  const time   = args.time  ?? 0;

  // Level 2 / Duplex rendering path: full DrawArgs forwarded for rotation support
  if (tier === 2 || duplex) {
    return drawSingleTileDuplex(args);
  }

  const tune = genericTune.getParams('house');
  const hwScaled = hw * 0.75 * (tune.scaleX ?? 1.0);
  const hhScaled = hh * (tune.scaleY ?? 1.0);
  const height = (tune.height ?? 20) * zoom;
  const peak   = (tune.peak ?? 18) * zoom;
  const eave   = 1.5 * zoom;

  const rotation = args.rotation ?? 0;
  // Intelligent rule: detect adjacent street direction ('south', 'west', 'east', 'north')
  const facing = (tileCol != null && tileRow != null) ? getBuildingFacing(map, tileCol, tileRow) : 'south';

  // Render monolithic house combo volume (walls, roof, door, window, chimney)
  drawOrientedHouse(
    ctx, cx, base, hwScaled, hhScaled, height, peak,
    housePal.wallLight, housePal.wallShade, roofHex, eave,
    zoom, night, time, seed, rotation, facing
  );
}
