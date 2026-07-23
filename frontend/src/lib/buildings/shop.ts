import type { DrawArgs, Tier } from './types.ts';
import { PROCEDURAL_DETAIL_ZOOM, palettes } from './constants.ts';
import { buildingVariant, silhouette, lot } from './helpers.ts';
import { drawCraftShop, drawGardenShop, drawHardwareShop } from './shopStylesA.ts';
import { drawAutoPartsShop, drawBikeShop, drawMobileShop } from './shopStylesB.ts';

const STORE_RENDERERS = [
  drawCraftShop,
  drawGardenShop,
  drawHardwareShop,
  drawAutoPartsShop,
  drawBikeShop,
  drawMobileShop,
] as const;

export function shop(args: DrawArgs, tier: Tier) {
  const { zoom, seed = 0 } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette(args, 'c', tier);
  if (tier === 0) return lot(args, palettes.commercial[0]);

  const v = buildingVariant(seed, STORE_RENDERERS.length);
  const renderStore = STORE_RENDERERS[v % STORE_RENDERERS.length];
  renderStore(args, tier);
}
