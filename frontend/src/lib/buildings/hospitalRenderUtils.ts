import type { DrawArgs, Tier } from './types.ts';
import { footprint } from './helpers.ts';
import { genericTune } from './genericTuneState.ts';

export function drawHospitalBuilding(args: DrawArgs, tier: Tier) {
  const { ctx, zoom, night = false } = args;
  const { cx, base: ground } = footprint(args, '#263e35', '#263e35');

  const tune = genericTune.getParams('hospital');
  const hw = 19 * zoom * (tune.scaleX ?? 1.0);
  const hh = 9.5 * zoom * (tune.scaleY ?? 1.0);
  const baseY = ground - 4 * zoom;

  // 1. Dark Foundation Base Slab
  const bH = (tune.baseH ?? 3.5) * zoom;
  const bHW = hw * 1.08;
  const bHH = hh * 1.08;

  // Base SW Face
  ctx.fillStyle = '#141619';
  ctx.beginPath();
  ctx.moveTo(cx - bHW, baseY - bHH);
  ctx.lineTo(cx, baseY);
  ctx.lineTo(cx, baseY + bH);
  ctx.lineTo(cx - bHW, baseY - bHH + bH);
  ctx.closePath();
  ctx.fill();

  // Base SE Face
  ctx.fillStyle = '#1e2024';
  ctx.beginPath();
  ctx.moveTo(cx, baseY);
  ctx.lineTo(cx + bHW, baseY - bHH);
  ctx.lineTo(cx + bHW, baseY - bHH + bH);
  ctx.lineTo(cx, baseY + bH);
  ctx.closePath();
  ctx.fill();

  // Base Top Face
  ctx.fillStyle = '#282b30';
  ctx.beginPath();
  ctx.moveTo(cx, baseY - bHH * 2);
  ctx.lineTo(cx + bHW, baseY - bHH);
  ctx.lineTo(cx, baseY);
  ctx.lineTo(cx - bHW, baseY - bHH);
  ctx.closePath();
  ctx.fill();

  // 2. Main Building Body
  const bodyBaseY = baseY;
  const bodyH = (tune.height ?? (tier === 0 ? 20 : tier === 1 ? 28 : 36)) * zoom;

  // SW (Left) Wall - Shaded White
  ctx.fillStyle = night ? '#2a323d' : '#e4e8ec';
  ctx.beginPath();
  ctx.moveTo(cx - hw, bodyBaseY - hh);
  ctx.lineTo(cx, bodyBaseY);
  ctx.lineTo(cx, bodyBaseY - bodyH);
  ctx.lineTo(cx - hw, bodyBaseY - hh - bodyH);
  ctx.closePath();
  ctx.fill();

  // SE (Right) Wall - Pure White
  ctx.fillStyle = night ? '#353f4d' : '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx, bodyBaseY);
  ctx.lineTo(cx + hw, bodyBaseY - hh);
  ctx.lineTo(cx + hw, bodyBaseY - hh - bodyH);
  ctx.lineTo(cx, bodyBaseY - bodyH);
  ctx.closePath();
  ctx.fill();

  // 3. Thick Roof Slab
  const rH = 4 * zoom;
  const rHW = hw * 1.05;
  const rHH = hh * 1.05;
  const roofBaseY = bodyBaseY - bodyH;

  // Roof SW Edge
  ctx.fillStyle = '#141619';
  ctx.beginPath();
  ctx.moveTo(cx - rHW, roofBaseY - rHH);
  ctx.lineTo(cx, roofBaseY);
  ctx.lineTo(cx, roofBaseY - rH);
  ctx.lineTo(cx - rHW, roofBaseY - rHH - rH);
  ctx.closePath();
  ctx.fill();

  // Roof SE Edge
  ctx.fillStyle = '#1e2024';
  ctx.beginPath();
  ctx.moveTo(cx, roofBaseY);
  ctx.lineTo(cx + rHW, roofBaseY - rHH);
  ctx.lineTo(cx + rHW, roofBaseY - rHH - rH);
  ctx.lineTo(cx, roofBaseY - rH);
  ctx.closePath();
  ctx.fill();

  // Roof Top Surface
  ctx.fillStyle = '#282b30';
  ctx.beginPath();
  ctx.moveTo(cx, roofBaseY - rHH * 2 - rH);
  ctx.lineTo(cx + rHW, roofBaseY - rHH - rH);
  ctx.lineTo(cx, roofBaseY - rH);
  ctx.lineTo(cx - rHW, roofBaseY - rHH - rH);
  ctx.closePath();
  ctx.fill();

  // Helipad on Roof (Tier >= 1)
  if (tier >= 1) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, 1.2 * zoom);
    ctx.beginPath();
    ctx.ellipse(cx, roofBaseY - rHH - rH, rHW * 0.45, rHH * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(7 * zoom)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', cx, roofBaseY - rHH - rH);
  }

  // 4. Blue Arch Entrance on SW Wall
  const doorW = hw * 0.42;
  const doorH = bodyH * 0.42;
  const doorCenterX = cx - hw * 0.48;
  const doorCenterY = bodyBaseY - hh * 0.48;

  // Blue Frame Outer
  ctx.fillStyle = '#1e88e5';
  ctx.beginPath();
  ctx.moveTo(doorCenterX - doorW * 0.5, doorCenterY - doorW * 0.25);
  ctx.lineTo(doorCenterX + doorW * 0.5, doorCenterY + doorW * 0.25);
  ctx.lineTo(doorCenterX + doorW * 0.5, doorCenterY + doorW * 0.25 - doorH);
  ctx.lineTo(doorCenterX - doorW * 0.5, doorCenterY - doorW * 0.25 - doorH);
  ctx.closePath();
  ctx.fill();

  // Inner Opening (Glass / Entrance)
  const inW = doorW * 0.65;
  const inH = doorH * 0.75;
  ctx.fillStyle = night ? '#ffea9f' : '#111e2e';
  ctx.beginPath();
  ctx.moveTo(doorCenterX - inW * 0.5, doorCenterY - inW * 0.25);
  ctx.lineTo(doorCenterX + inW * 0.5, doorCenterY + inW * 0.25);
  ctx.lineTo(doorCenterX + inW * 0.5, doorCenterY + inW * 0.25 - inH);
  ctx.lineTo(doorCenterX - inW * 0.5, doorCenterY - inW * 0.25 - inH);
  ctx.closePath();
  ctx.fill();

  // 5. Red Badge with Medical Cross on SW Wall
  const badgeCenterX = cx - hw * 0.48;
  const badgeCenterY = bodyBaseY - hh * 0.48 - bodyH * 0.68;
  const badgeW = 7 * zoom;
  const badgeH = 7 * zoom;

  // Red Badge Body
  ctx.fillStyle = '#e53935';
  ctx.beginPath();
  ctx.moveTo(badgeCenterX - badgeW, badgeCenterY - badgeH * 0.5);
  ctx.lineTo(badgeCenterX + badgeW, badgeCenterY + badgeH * 0.5);
  ctx.lineTo(badgeCenterX + badgeW, badgeCenterY + badgeH * 0.5 - badgeH * 1.8);
  ctx.lineTo(badgeCenterX - badgeW, badgeCenterY - badgeH * 0.5 - badgeH * 1.8);
  ctx.closePath();
  ctx.fill();

  // White Medical Cross inside Red Badge
  const crossY = badgeCenterY - badgeH * 0.9;
  ctx.fillStyle = '#ffffff';

  // Vertical bar
  const cVW = 2.2 * zoom;
  const cVH = 6.5 * zoom;
  ctx.fillRect(badgeCenterX - cVW * 0.5, crossY - cVH * 0.5, cVW, cVH);

  // Horizontal bar
  const cHW = 6.5 * zoom;
  const cHH = 2.2 * zoom;
  ctx.fillRect(badgeCenterX - cHW * 0.5, crossY - cHH * 0.5, cHW, cHH);

  // 6. Blue Side Sign / Window Panel on SE Wall
  const sidePanelCenterX = cx + hw * 0.52;
  const sidePanelCenterY = bodyBaseY - hh * 0.52 - bodyH * 0.52;
  const sideW = hw * 0.38;
  const sideH = bodyH * 0.28;

  ctx.fillStyle = '#1e88e5';
  ctx.beginPath();
  ctx.moveTo(sidePanelCenterX - sideW * 0.5, sidePanelCenterY + sideW * 0.25);
  ctx.lineTo(sidePanelCenterX + sideW * 0.5, sidePanelCenterY - sideW * 0.25);
  ctx.lineTo(sidePanelCenterX + sideW * 0.5, sidePanelCenterY - sideW * 0.25 - sideH);
  ctx.lineTo(sidePanelCenterX - sideW * 0.5, sidePanelCenterY + sideW * 0.25 - sideH);
  ctx.closePath();
  ctx.fill();

  // Inner Light Blue Glass / Reflection on Side Panel
  ctx.fillStyle = night ? '#ffecb3' : '#90caf9';
  const innerSideW = sideW * 0.75;
  const innerSideH = sideH * 0.6;
  ctx.beginPath();
  ctx.moveTo(sidePanelCenterX - innerSideW * 0.5, sidePanelCenterY + innerSideW * 0.25 - sideH * 0.2);
  ctx.lineTo(sidePanelCenterX + innerSideW * 0.5, sidePanelCenterY - innerSideW * 0.25 - sideH * 0.2);
  ctx.lineTo(sidePanelCenterX + innerSideW * 0.5, sidePanelCenterY - innerSideW * 0.25 - sideH * 0.2 - innerSideH);
  ctx.lineTo(sidePanelCenterX - innerSideW * 0.5, sidePanelCenterY + innerSideW * 0.25 - sideH * 0.2 - innerSideH);
  ctx.closePath();
  ctx.fill();
}
