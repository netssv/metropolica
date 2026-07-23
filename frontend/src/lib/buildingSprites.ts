import { DrawArgs, Tier, HousingProfile, BuildingSpecialty } from './buildings/types.ts';
import { PROCEDURAL_DETAIL_ZOOM } from './buildings/constants.ts';
import { footprint, silhouette, buildingVariant } from './buildings/helpers.ts';
import { house } from './buildings/house.ts';
import { shop } from './buildings/shop.ts';
import { factory } from './buildings/factory.ts';
import { specialtyBuilding } from './buildings/specialty.ts';
import { drawPark } from './buildings/park.ts';

export { PROCEDURAL_DETAIL_ZOOM, buildingVariant };
export type { HousingProfile, BuildingSpecialty };

export function drawPowerPlant(args: DrawArgs) {
  const { ctx, zoom } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette(args, 'i', 2);
  const { cx, base, hw, hh } = footprint(args, '#59656a', '#c2a84d');
  const height = 18 * zoom;
  ctx.fillStyle = '#747d7d';
  ctx.fillRect(cx - hw * 0.7, base - hh - height, hw * 1.4, height);
  ctx.fillStyle = '#39454a';
  ctx.fillRect(cx - hw * 0.4, base - hh - height - 10 * zoom, 5 * zoom, 10 * zoom);
  ctx.fillRect(cx + hw * 0.15, base - hh - height - 15 * zoom, 5 * zoom, 15 * zoom);
  ctx.strokeStyle = '#e0c35b';
  ctx.lineWidth = Math.max(1, zoom);
  ctx.beginPath();
  ctx.moveTo(cx - hw * 0.85, base - hh - height - 4 * zoom);
  ctx.lineTo(cx + hw * 0.85, base - hh - height - 4 * zoom);
  ctx.stroke();
  ctx.fillStyle = '#f1d76a';
  ctx.fillRect(cx - 2 * zoom, base - hh - height + 5 * zoom, 4 * zoom, 4 * zoom);
}

export { drawPark };

export function drawBuilding(
  type: string,
  tier: Tier,
  args: DrawArgs,
  specialty?: BuildingSpecialty,
  housing?: HousingProfile
) {
  if (specialty) return specialtyBuilding(args, tier, specialty);
  if (type === 'bldg-r' || type === 'zone-r') return house(args, tier, housing);
  if (type === 'bldg-c' || type === 'zone-c') return shop(args, tier);
  if (type === 'bldg-i' || type === 'zone-i') return factory(args, tier);
}
