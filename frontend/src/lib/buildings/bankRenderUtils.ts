import type { DrawArgs, Tier } from './types.ts';
import { footprint } from './helpers.ts';
import { genericTune } from './genericTuneState.ts';

function drawPolygon(ctx: CanvasRenderingContext2D, color: string, points: [number, number][]) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

export function drawBankBuilding(args: DrawArgs, tier: Tier) {
  const { ctx, zoom, night = false } = args;
  const { cx, base: ground } = footprint(args, '#e2e8f0', '#cbd5e1');

  const tune = genericTune.getParams('bank');
  const hw = 28 * zoom * (tune.scaleX ?? 1.0);
  const hh = 14 * zoom * (tune.scaleY ?? 1.0);
  const baseY = ground - 1 * zoom;
  const bH = (tune.baseH ?? 3.5) * zoom;
  const bHW = hw * 1.05, bHH = hh * 1.05;

  // 1. Light Concrete Plaza Base Slab
  drawPolygon(ctx, night ? '#334155' : '#cbd5e1', [[cx - bHW, baseY - bHH], [cx, baseY], [cx, baseY + bH], [cx - bHW, baseY - bHH + bH]]);
  drawPolygon(ctx, night ? '#475569' : '#e2e8f0', [[cx, baseY], [cx + bHW, baseY - bHH], [cx + bHW, baseY - bHH + bH], [cx, baseY + bH]]);
  drawPolygon(ctx, night ? '#1e293b' : '#ffffff', [[cx, baseY - bHH * 2], [cx + bHW, baseY - bHH], [cx, baseY], [cx - bHW, baseY - bHH]]);

  // 2. Main Building Body - White Architecture
  const bodyH = (tune.height ?? (tier === 0 ? 24 : tier === 1 ? 32 : 40)) * zoom;
  const beamH = (tune.peak ?? 8.5) * zoom;
  const bodyHW = hw * 0.88, bodyHH = hh * 0.88;
  const wallBaseY = baseY - bHH * 0.12;

  // SW Wall (Facade face behind columns - Off-white with cyan glass recessed wall)
  drawPolygon(ctx, night ? '#1e293b' : '#e5e7eb', [[cx - bodyHW, wallBaseY - bodyHH], [cx, wallBaseY], [cx, wallBaseY - bodyH], [cx - bodyHW, wallBaseY - bodyHH - bodyH]]);
  drawPolygon(ctx, night ? '#0f172a' : '#e0f2fe', [
    [cx - bodyHW * 0.94, wallBaseY - bodyHH * 0.94],
    [cx - bodyHW * 0.06, wallBaseY - bodyHH * 0.06],
    [cx - bodyHW * 0.06, wallBaseY - bodyHH * 0.06 - bodyH * 0.82],
    [cx - bodyHW * 0.94, wallBaseY - bodyHH * 0.94 - bodyH * 0.82]
  ]);

  // SE Wall (Lit Side Wall - Pure Bright White Concrete)
  drawPolygon(ctx, night ? '#334155' : '#ffffff', [[cx, wallBaseY], [cx + bodyHW, wallBaseY - bodyHH], [cx + bodyHW, wallBaseY - bodyHH - bodyH], [cx, wallBaseY - bodyH]]);

  // SE Wall Windows
  for (let i = 0; i < 4; i++) {
    const t1 = (i + 0.2) / 4, t2 = (i + 0.8) / 4;
    const w1x = cx + bodyHW * t1, w1y = wallBaseY - bodyHH * t1;
    const w2x = cx + bodyHW * t2, w2y = wallBaseY - bodyHH * t2;
    drawPolygon(ctx, night ? '#fbbf24' : '#38bdf8', [[w1x, w1y - bodyH * 0.3], [w2x, w2y - bodyH * 0.3], [w2x, w2y - bodyH * 0.72], [w1x, w1y - bodyH * 0.72]]);
  }

  // 3. Classical White Pillars on SW Facade
  const numCols = 5;
  const colW = 3.2 * zoom;
  for (let i = 0; i < numCols; i++) {
    const t = (i + 0.5) / numCols;
    const colX = cx - bodyHW * (1 - t);
    const colY = wallBaseY - bodyHH * (1 - t);
    ctx.fillStyle = night ? '#94a3b8' : '#d1d5db';
    ctx.fillRect(colX - colW / 2, colY - bodyH * 0.85, colW * 0.5, bodyH * 0.85);
    ctx.fillStyle = night ? '#ffffff' : '#ffffff';
    ctx.fillRect(colX, colY - bodyH * 0.85, colW * 0.5, bodyH * 0.85);
  }

  // Glass Sliding Door at SW Entrance (Center)
  const d1x = cx - bodyHW * 0.58, d1y = wallBaseY - bodyHH * 0.58;
  const d2x = cx - bodyHW * 0.42, d2y = wallBaseY - bodyHH * 0.42;
  drawPolygon(ctx, night ? '#fef08a' : '#7dd3fc', [[d1x, d1y], [d2x, d2y], [d2x, d2y - bodyH * 0.38], [d1x, d1y - bodyH * 0.38]]);

  // 4. Architrave / Facade Header Beam with Isometric "BANK" Sign
  const roofBaseY = wallBaseY - bodyH * 0.85;

  // SW Facade Beam (Off-white / Light Grey)
  drawPolygon(ctx, night ? '#334155' : '#f3f4f6', [[cx - bodyHW * 1.04, roofBaseY - bodyHH * 1.04], [cx, roofBaseY], [cx, roofBaseY - beamH], [cx - bodyHW * 1.04, roofBaseY - bodyHH * 1.04 - beamH]]);

  // SE Side Beam (Pure White)
  drawPolygon(ctx, night ? '#475569' : '#ffffff', [[cx, roofBaseY], [cx + bodyHW * 1.04, roofBaseY - bodyHH * 1.04], [cx + bodyHW * 1.04, roofBaseY - bodyHH * 1.04 - beamH], [cx, roofBaseY - beamH]]);

  // Isometric Text Transformation for "BANK" on SW Facade Beam
  const signCenterX = cx - bodyHW * 0.52;
  const signCenterY = roofBaseY - bodyHH * 0.52 - beamH * 0.5;

  ctx.save();
  ctx.translate(signCenterX, signCenterY);
  // Isometric shear transform matrix matching SW wall slope (dy/dx = 0.5)
  ctx.transform(1, 0.5, 0, 0.85, 0, 0);
  ctx.fillStyle = '#000000'; // Crisp pure black letters as requested
  ctx.font = `900 ${Math.round(7.5 * zoom)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BANK', 0, 0);
  ctx.restore();

  // 5. Roof with Parapet Border
  const rBaseY = roofBaseY - beamH, rHW = bodyHW * 1.04, rHH = bodyHH * 1.04;
  drawPolygon(ctx, night ? '#0f172a' : '#cbd5e1', [[cx, rBaseY - rHH * 2], [cx + rHW, rBaseY - rHH], [cx, rBaseY], [cx - rHW, rBaseY - rHH]]);
  drawPolygon(ctx, night ? '#1e293b' : '#94a3b8', [[cx, rBaseY - rHH * 1.8], [cx + rHW * 0.86, rBaseY - rHH], [cx, rBaseY - rHH * 0.2], [cx - rHW * 0.86, rBaseY - rHH]]);

  // 6. Roof Flag Pole & Waving Flag
  const poleX = cx, poleBaseY = rBaseY - rHH, poleH = 18 * zoom;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = Math.max(1, 1.5 * zoom);
  ctx.beginPath();
  ctx.moveTo(poleX, poleBaseY);
  ctx.lineTo(poleX, poleBaseY - poleH);
  ctx.stroke();

  const flagW = 13 * zoom, flagH = 8.5 * zoom, flagY = poleBaseY - poleH;
  drawPolygon(ctx, '#0284c7', [[poleX, flagY], [poleX - flagW, flagY + 1.5 * zoom], [poleX - flagW, flagY + flagH + 1.5 * zoom], [poleX, flagY + flagH]]);

  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.round(6 * zoom)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', poleX - flagW * 0.5, flagY + flagH * 0.55);

  // 7. Green Bushes at Plaza Corners
  ctx.fillStyle = '#16a34a';
  for (const b of [
    { x: cx - bHW * 0.85, y: baseY - bHH * 0.15 + bH },
    { x: cx - bHW * 0.2, y: baseY + bH * 1.2 },
    { x: cx + bHW * 0.75, y: baseY - bHH * 0.5 + bH },
  ]) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3.5 * zoom, 0, Math.PI * 2);
    ctx.fill();
  }
}
