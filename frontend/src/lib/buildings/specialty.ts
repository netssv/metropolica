import type { DrawArgs, Tier, BuildingSpecialty } from './types.ts';
import { PROCEDURAL_DETAIL_ZOOM } from './constants.ts';
import { specialtySilhouette, footprint } from './helpers.ts';
import { drawHospitalBuilding } from './hospitalRenderUtils.ts';
import { drawBankBuilding } from './bankRenderUtils.ts';

export function specialtyBuilding(args: DrawArgs, tier: Tier, kind: BuildingSpecialty) {
  const { ctx, zoom } = args;
  if (kind === 'hospital') {
    if (zoom < PROCEDURAL_DETAIL_ZOOM) {
      return specialtySilhouette(args, tier, 'hospital');
    }
    return drawHospitalBuilding(args, tier);
  }

  if (kind === 'bank') {
    if (zoom < PROCEDURAL_DETAIL_ZOOM) {
      return specialtySilhouette(args, tier, 'bank');
    }
    return drawBankBuilding(args, tier);
  }

  if (zoom < PROCEDURAL_DETAIL_ZOOM) {
    return specialtySilhouette(
      args,
      tier,
      kind === 'mall-government' ? kind : 'hospital'
    );
  }

  const waterfront =
    kind === 'fish-market' ||
    kind === 'pier' ||
    kind === 'customs' ||
    kind === 'water-treatment';

  const base = waterfront ? '#3e8292' : '#55a9bd';
  const accent = kind === 'water-treatment' ? '#8bd8e8' : '#f0c85a';

  const { cx, base: ground, hw, hh } = footprint(args, base, accent);
  const height = (tier === 0 ? 0 : tier === 1 ? 15 : 30) * zoom;

  if (!height) {
    ctx.fillStyle = accent;
    if (kind === 'mall-government') {
      ctx.fillRect(cx - 7 * zoom, ground - hh - 5 * zoom, 14 * zoom, 3 * zoom);
      ctx.fillRect(cx - 4 * zoom, ground - hh - 8 * zoom, 3 * zoom, 6 * zoom);
      ctx.fillRect(cx + 1 * zoom, ground - hh - 8 * zoom, 3 * zoom, 6 * zoom);
    } else {
      ctx.fillStyle = accent;
      ctx.fillRect(cx - 7 * zoom, ground - hh - 5 * zoom, 14 * zoom, 3 * zoom);
      ctx.fillRect(cx - 2 * zoom, ground - hh - 10 * zoom, 4 * zoom, 8 * zoom);
      if (kind === 'water-treatment') {
        ctx.strokeStyle = '#d7f7ff';
        ctx.strokeRect(cx - 8 * zoom, ground - hh - 13 * zoom, 16 * zoom, 8 * zoom);
      }
      if (kind === 'pier') {
        ctx.strokeStyle = '#d7b46a';
        ctx.beginPath();
        ctx.moveTo(cx, ground - hh - 8 * zoom);
        ctx.lineTo(cx, ground + 3 * zoom);
        ctx.stroke();
      }
    }
    return;
  }

  ctx.fillStyle = base;
  ctx.fillRect(cx - hw * 0.72, ground - hh - height, hw * 1.44, height);
  ctx.fillStyle = accent;
  ctx.fillRect(cx - hw * 0.72, ground - hh - height, hw * 1.44, 4 * zoom);
  ctx.fillStyle = '#183b57';
  ctx.fillRect(cx - 2 * zoom, ground - hh - height * 0.65, 4 * zoom, height * 0.3);
  ctx.fillRect(cx - hw * 0.25, ground - hh - height * 0.5, hw * 0.5, 4 * zoom);
}
