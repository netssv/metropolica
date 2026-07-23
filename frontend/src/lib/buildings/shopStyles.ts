import type { DrawArgs, Tier } from './types.ts';
import { footprint } from './helpers.ts';

export function drawCraftShop(args: DrawArgs, tier: Tier) {
  const { ctx, zoom } = args;
  const { cx, base, hw, hh } = footprint(args, '#f6ede2', '#e5d7c3');
  const height = (tier === 1 ? 16 : 26) * zoom;

  // Left Facade (Light cream)
  ctx.fillStyle = '#f6ede2';
  ctx.beginPath();
  ctx.moveTo(cx - hw * 0.8, base - hh);
  ctx.lineTo(cx, base);
  ctx.lineTo(cx, base - height);
  ctx.lineTo(cx - hw * 0.8, base - hh - height);
  ctx.closePath();
  ctx.fill();

  // Right Facade (Shaded beige)
  ctx.fillStyle = '#e2d3c1';
  ctx.beginPath();
  ctx.moveTo(cx, base);
  ctx.lineTo(cx + hw * 0.8, base - hh);
  ctx.lineTo(cx + hw * 0.8, base - hh - height);
  ctx.lineTo(cx, base - height);
  ctx.closePath();
  ctx.fill();

  // Pitched Wooden Roof (slanted roof like in reference)
  ctx.fillStyle = '#c8955a';
  ctx.beginPath();
  ctx.moveTo(cx - hw * 0.85, base - hh - height - 4 * zoom);
  ctx.lineTo(cx, base - height + 4 * zoom);
  ctx.lineTo(cx + hw * 0.85, base - hh - height + 8 * zoom);
  ctx.lineTo(cx, base - hh * 2 - height - 4 * zoom);
  ctx.closePath();
  ctx.fill();

  // Front Sign "CRAFT"
  const signY = base - hh - height + 2 * zoom;
  ctx.fillStyle = '#fff8ef';
  ctx.strokeStyle = '#5c3d22';
  ctx.lineWidth = Math.max(1, zoom);
  ctx.fillRect(cx - hw * 0.5, signY, hw * 0.9, 5 * zoom);
  ctx.strokeRect(cx - hw * 0.5, signY, hw * 0.9, 5 * zoom);
  if (zoom >= 0.6) {
    ctx.fillStyle = '#5c3d22';
    ctx.font = `bold ${Math.max(6, Math.floor(4 * zoom))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('CRAFT', cx - hw * 0.05, signY + 4 * zoom);
  }

  // Red Door & Teal Windows
  ctx.fillStyle = '#ba3c34';
  ctx.fillRect(cx - hw * 0.2, base - 7 * zoom, 4 * zoom, 6 * zoom);
  ctx.fillStyle = '#388e8e';
  ctx.fillRect(cx - hw * 0.6, base - hh, 4 * zoom, 4 * zoom);
  ctx.fillRect(cx + hw * 0.2, base - hh + 1 * zoom, 4 * zoom, 4 * zoom);

  // Craft Props: Yarn spool & Scissors
  if (zoom >= 0.7) {
    ctx.fillStyle = '#8a5a9c'; // Yarn spool
    ctx.beginPath();
    ctx.arc(cx - hw * 0.7, base - 2 * zoom, 2 * zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#708090'; // Scissors
    ctx.beginPath();
    ctx.moveTo(cx - hw * 0.4, base);
    ctx.lineTo(cx - hw * 0.3, base + 2 * zoom);
    ctx.stroke();
  }
}

export function drawGardenShop(args: DrawArgs, tier: Tier) {
  const { ctx, zoom } = args;
  const { cx, base, hw, hh } = footprint(args, '#2b7a70', '#84d8ce');
  const height = (tier === 1 ? 18 : 28) * zoom;

  // Glass Facades (Translucent Teal)
  ctx.fillStyle = '#64c4b8';
  ctx.beginPath();
  ctx.moveTo(cx - hw * 0.8, base - hh);
  ctx.lineTo(cx, base);
  ctx.lineTo(cx, base - height);
  ctx.lineTo(cx - hw * 0.8, base - hh - height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#4aa398';
  ctx.beginPath();
  ctx.moveTo(cx, base);
  ctx.lineTo(cx + hw * 0.8, base - hh);
  ctx.lineTo(cx + hw * 0.8, base - hh - height);
  ctx.lineTo(cx, base - height);
  ctx.closePath();
  ctx.fill();

  // Glass Pitched Greenhouse Roof
  ctx.fillStyle = '#84d8ce';
  ctx.beginPath();
  ctx.moveTo(cx, base - hh * 2 - height - 6 * zoom);
  ctx.lineTo(cx + hw * 0.85, base - hh - height);
  ctx.lineTo(cx, base - height);
  ctx.lineTo(cx - hw * 0.85, base - hh - height);
  ctx.closePath();
  ctx.fill();

  // Metal Frame Grid Lines
  ctx.strokeStyle = '#2b7a70';
  ctx.lineWidth = Math.max(1, zoom * 0.8);
  ctx.stroke();

  // Front Sign "GARDEN"
  const signY = base - hh - height + 3 * zoom;
  ctx.fillStyle = '#ded3b8';
  ctx.fillRect(cx - hw * 0.5, signY, hw * 1.0, 5 * zoom);
  if (zoom >= 0.6) {
    ctx.fillStyle = '#2b4e47';
    ctx.font = `bold ${Math.max(6, Math.floor(4 * zoom))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('GARDEN', cx, signY + 4 * zoom);
  }

  // Red Door
  ctx.fillStyle = '#ba3c34';
  ctx.fillRect(cx - 2 * zoom, base - 7 * zoom, 4 * zoom, 6 * zoom);

  // Potted Plants Decorative Props
  if (zoom >= 0.6) {
    [-hw * 0.5, hw * 0.3].forEach((ox) => {
      ctx.fillStyle = '#cc6e42'; // Pot
      ctx.fillRect(cx + ox, base - 2 * zoom, 3 * zoom, 2 * zoom);
      ctx.fillStyle = '#3d8c52'; // Foliage
      ctx.beginPath();
      ctx.arc(cx + ox + 1.5 * zoom, base - 3.5 * zoom, 2.5 * zoom, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

export function drawHardwareShop(args: DrawArgs, tier: Tier) {
  const { ctx, zoom } = args;
  const { cx, base, hw, hh } = footprint(args, '#f4e4cf', '#d6bf9f');
  const height = (tier === 1 ? 16 : 26) * zoom;

  // Facades (Warm Beige)
  ctx.fillStyle = '#f4e4cf';
  ctx.beginPath();
  ctx.moveTo(cx - hw * 0.8, base - hh);
  ctx.lineTo(cx, base);
  ctx.lineTo(cx, base - height);
  ctx.lineTo(cx - hw * 0.8, base - hh - height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#d6bf9f';
  ctx.beginPath();
  ctx.moveTo(cx, base);
  ctx.lineTo(cx + hw * 0.8, base - hh);
  ctx.lineTo(cx + hw * 0.8, base - hh - height);
  ctx.lineTo(cx, base - height);
  ctx.closePath();
  ctx.fill();

  // Flat Roof with Brown Parapet Edge
  ctx.fillStyle = '#e5d5c0';
  ctx.beginPath();
  ctx.moveTo(cx, base - hh * 2 - height);
  ctx.lineTo(cx + hw * 0.8, base - hh - height);
  ctx.lineTo(cx, base - height);
  ctx.lineTo(cx - hw * 0.8, base - hh - height);
  ctx.closePath();
  ctx.fill();

  // Roof Parapet Border
  ctx.strokeStyle = '#6b4226';
  ctx.lineWidth = Math.max(1.5, zoom * 1.2);
  ctx.stroke();

  // AC Unit on Roof
  ctx.fillStyle = '#9eb3b3';
  ctx.fillRect(cx - 2 * zoom, base - hh * 1.5 - height, 5 * zoom, 3 * zoom);

  // Signboard "HARDWARE"
  const signY = base - hh - height - 3 * zoom;
  ctx.fillStyle = '#f9ebd9';
  ctx.strokeStyle = '#6b4226';
  ctx.fillRect(cx - hw * 0.6, signY, hw * 1.2, 6 * zoom);
  ctx.strokeRect(cx - hw * 0.6, signY, hw * 1.2, 6 * zoom);
  if (zoom >= 0.6) {
    ctx.fillStyle = '#472b17';
    ctx.font = `bold ${Math.max(6, Math.floor(3.5 * zoom))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('HARDWARE', cx, signY + 4.5 * zoom);
  }

  // Storefront & Hammer / Wrench Icon
  ctx.fillStyle = '#5c3426'; // Door
  ctx.fillRect(cx + hw * 0.1, base - 7 * zoom, 4 * zoom, 6 * zoom);
  ctx.fillStyle = '#3b948a'; // Display window
  ctx.fillRect(cx - hw * 0.6, base - hh - 2 * zoom, 8 * zoom, 5 * zoom);
  if (zoom >= 0.7) {
    ctx.strokeStyle = '#b54e38'; // Hammer icon line
    ctx.lineWidth = Math.max(1, zoom);
    ctx.beginPath();
    ctx.moveTo(cx - hw * 0.4, base - hh - 1 * zoom);
    ctx.lineTo(cx - hw * 0.2, base - hh + 2 * zoom);
    ctx.stroke();
  }
}
