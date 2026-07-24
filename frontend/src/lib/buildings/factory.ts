import type { DrawArgs, Tier } from './types.ts';
import { PROCEDURAL_DETAIL_ZOOM, palettes, factoryTint } from './constants.ts';
import { buildingVariant, footprint, silhouette, lot, drawAnimatedWindow } from './helpers.ts';
import { genericTune } from './genericTuneState.ts';

export function factory(args: DrawArgs, tier: Tier) {
  const { ctx, zoom, seed = 0 } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return silhouette(args, 'i', tier);
  if (tier === 0) return lot(args, palettes.industrial[0]);

  const v = buildingVariant(seed);
  const tune = genericTune.getParams('factory');
  const { cx, base, hw, hh } = footprint(args, palettes.industrial[tier], '#b5b0a0');
  
  const hwScaled = hw * (tune.scaleX ?? 1.0);
  const height = (tune.height ?? (tier === 1 ? 10 : 21)) * zoom;
  const chimneyH = (tune.peak ?? 12) * zoom;

  // Use contrasting colors so factories don't blend into the industrial ground zone color
  ctx.fillStyle = tune.accentColor || (tier === 1 ? factoryTint[v] : '#475569');
  ctx.fillRect(cx - hwScaled * 0.8, base - hh - height, hwScaled * 1.6, height);

  ctx.fillStyle = '#3e4548';
  if (v !== 1 && chimneyH > 0) {
    ctx.fillRect(cx + hwScaled * 0.25, base - hh - height - chimneyH, 6 * zoom, chimneyH);
  }
  if (v !== 0 && chimneyH > 0) {
    ctx.fillRect(
      cx - hwScaled * 0.55,
      base - hh - height - (v === 2 ? chimneyH * 0.8 : chimneyH),
      5 * zoom,
      v === 2 ? chimneyH * 0.8 : chimneyH
    );
  }

  for (let x = cx - hwScaled * 0.6; x < cx + hwScaled * 0.35; x += 10 * zoom) {
    drawAnimatedWindow(args, x, base - hh - height + 5 * zoom, 5, 4, seed + Math.round(x));
  }
}
