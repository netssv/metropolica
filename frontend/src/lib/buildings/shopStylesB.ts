import type { DrawArgs, Tier } from './types.ts';
import { footprint } from './helpers.ts';
import { drawIsoQuadSW, drawIsoQuadSE, drawIsoTextSW } from './shopIsoUtils.ts';

export function drawAutoPartsShop(args: DrawArgs, tier: Tier) {
  const { ctx, zoom } = args;
  const { cx, base, hw: rawHw, hh: rawHh } = footprint(args, '#dcf2ee', '#b5d8d2');
  const hw = rawHw * 0.85;
  const hh = rawHh * 0.85;
  const height = (tier === 1 ? 20 : 30) * zoom;

  // Facades (Cyan Light & Shaded)
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0, 0, 1, 1, '#dcf2ee');
  drawIsoQuadSE(ctx, cx, base, hw, hh, height, 0, 0, 1, 1, '#b5d8d2');

  // Dark Navy Blue Base & Roof Trim
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0, 0, 1, 0.1, '#2f5070');
  drawIsoQuadSE(ctx, cx, base, hw, hh, height, 0, 0, 1, 0.1, '#1f3850');
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0, 0.94, 1, 1.0, '#2f5070');
  drawIsoQuadSE(ctx, cx, base, hw, hh, height, 0, 0.94, 1, 1.0, '#1f3850');

  // Flat Roof Surface
  ctx.fillStyle = '#e3e8ea';
  ctx.beginPath();
  ctx.moveTo(cx, base - hh * 2 - height);
  ctx.lineTo(cx + hw, base - hh - height);
  ctx.lineTo(cx, base - height);
  ctx.lineTo(cx - hw, base - hh - height);
  ctx.closePath();
  ctx.fill();

  // Bounded Isometric Blue Signboard "REPUESTOS"
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0.02, 0.62, 0.98, 0.92, '#2a4d70', '#1c3650', Math.max(1.2, zoom));
  if (zoom >= 0.35) {
    const baseSz = Math.max(4.5, Math.floor(4.0 * zoom));
    drawIsoTextSW(ctx, cx, base, hw, hh, height, 0.02, 0.62, 0.98, 0.92, 'REPUESTOS', '#ffffff', baseSz);
  }

  // Windows & Doors
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0.08, 0.14, 0.52, 0.54, '#3b948a', '#226058', Math.max(1, zoom * 0.8));
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0.62, 0.1, 0.88, 0.5, '#5c3426');

  // Tires Prop near entrance
  if (zoom >= 0.5) {
    const p = { x: cx - hw * 0.85, y: base - hh * 0.85 };
    ctx.fillStyle = '#2d3136';
    ctx.fillRect(p.x, p.y - 4.5 * zoom, 3.5 * zoom, 2 * zoom);
    ctx.fillRect(p.x, p.y - 2 * zoom, 3.5 * zoom, 2 * zoom);
  }
}

export function drawBikeShop(args: DrawArgs, tier: Tier) {
  const { ctx, zoom } = args;
  const { cx, base, hw: rawHw, hh: rawHh } = footprint(args, '#fbf1df', '#e8d4b8');
  const hw = rawHw * 0.85;
  const hh = rawHh * 0.85;
  const height = (tier === 1 ? 20 : 30) * zoom;

  // Facades (Warm Cream Light & Shaded)
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0, 0, 1, 1, '#fbf1df');
  drawIsoQuadSE(ctx, cx, base, hw, hh, height, 0, 0, 1, 1, '#e8d4b8');

  // Dark Plum Gable Roof
  const roofPeakY = base - hh * 2 - height - 5 * zoom;
  ctx.fillStyle = '#7a3545';
  ctx.beginPath();
  ctx.moveTo(cx - hw - 2.5 * zoom, base - hh - height);
  ctx.lineTo(cx, base - height + 3.5 * zoom);
  ctx.lineTo(cx + hw + 2.5 * zoom, base - hh - height);
  ctx.lineTo(cx, roofPeakY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#5c2330';
  ctx.beginPath();
  ctx.moveTo(cx, base - height + 3.5 * zoom);
  ctx.lineTo(cx + hw + 2.5 * zoom, base - hh - height);
  ctx.lineTo(cx, roofPeakY);
  ctx.closePath();
  ctx.fill();

  // Bounded Isometric Signboard "Bicicletas"
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0.05, 0.65, 0.95, 0.92, '#e8cfab', '#5c2d36', Math.max(1.2, zoom));
  if (zoom >= 0.35) {
    const baseSz = Math.max(4.8, Math.floor(4.2 * zoom));
    drawIsoTextSW(ctx, cx, base, hw, hh, height, 0.05, 0.65, 0.95, 0.92, 'BICICLETAS', '#5c2d36', baseSz);
  }

  // Windows & Doors
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0.38, 0.04, 0.62, 0.46, '#5c3229');
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0.08, 0.15, 0.3, 0.5, '#3b948a', '#226058', Math.max(1, zoom * 0.8));
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0.7, 0.15, 0.92, 0.5, '#3b948a', '#226058', Math.max(1, zoom * 0.8));
}

export function drawMobileShop(args: DrawArgs, tier: Tier) {
  const { ctx, zoom } = args;
  const { cx, base, hw: rawHw, hh: rawHh } = footprint(args, '#f5e6d0', '#d9c2a3');
  const hw = rawHw * 0.85;
  const hh = rawHh * 0.85;
  const height = (tier === 1 ? 20 : 30) * zoom;

  // Facades (Cream Beige)
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0, 0, 1, 1, '#f5e6d0');
  drawIsoQuadSE(ctx, cx, base, hw, hh, height, 0, 0, 1, 1, '#d9c2a3');

  // Dark Maroon Corner Pillars & Top Trim
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0, 0, 0.08, 1, '#42242b');
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0.92, 0, 1.0, 1, '#42242b');
  drawIsoQuadSE(ctx, cx, base, hw, hh, height, 0.92, 0, 1.0, 1, '#2f181d');
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0, 0.94, 1, 1.0, '#42242b');
  drawIsoQuadSE(ctx, cx, base, hw, hh, height, 0, 0.94, 1, 1.0, '#2f181d');

  // Flat Roof Surface
  ctx.fillStyle = '#e8dac6';
  ctx.beginPath();
  ctx.moveTo(cx, base - hh * 2 - height);
  ctx.lineTo(cx + hw, base - hh - height);
  ctx.lineTo(cx, base - height);
  ctx.lineTo(cx - hw, base - hh - height);
  ctx.closePath();
  ctx.fill();

  // Bounded Isometric Signboard "CELULARES"
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0.08, 0.65, 0.92, 0.92, '#edd8be', '#42242b', Math.max(1.2, zoom));
  if (zoom >= 0.35) {
    const baseSz = Math.max(4.5, Math.floor(4.0 * zoom));
    drawIsoTextSW(ctx, cx, base, hw, hh, height, 0.08, 0.65, 0.92, 0.92, 'CELULARES', '#42242b', baseSz);
  }

  // Display Window with Smartphone Graphic
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0.16, 0.12, 0.84, 0.58, '#3ab0b0', '#227070', Math.max(1, zoom));
  if (zoom >= 0.55) {
    drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0.36, 0.18, 0.64, 0.52, '#ffffff', '#333333', Math.max(1, zoom * 0.7));
  }
}
