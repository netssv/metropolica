import type { DrawArgs, Tier } from './types.ts';
import { footprint } from './helpers.ts';
import { drawIsoQuadSW, drawIsoQuadSE, drawIsoTextSW } from './shopIsoUtils.ts';

export function drawCraftShop(args: DrawArgs, tier: Tier) {
  const { ctx, zoom, rotation = 0 } = args;
  const { cx, base, hw: rawHw, hh: rawHh } = footprint(args, '#f6ede2', '#e5d7c3');
  const hw = rawHw * 0.85;
  const hh = rawHh * 0.85;
  const height = (tier === 1 ? 20 : 30) * zoom;
  const rot = ((Math.round(rotation) % 4) + 4) % 4;

  // SW Facade (Lit Cream)
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0, 0, 1, 1, '#f6ede2');
  // SE Facade (Shaded Beige)
  drawIsoQuadSE(ctx, cx, base, hw, hh, height, 0, 0, 1, 1, '#e2d3c1');

  // Pitched Wooden Roof
  const roofTopY = base - height - hh * 2 - 5 * zoom;
  ctx.fillStyle = '#c8955a';
  ctx.beginPath();
  ctx.moveTo(cx - hw - 2 * zoom, base - hh - height);
  ctx.lineTo(cx, base - height + 3 * zoom);
  ctx.lineTo(cx + hw + 2 * zoom, base - hh - height);
  ctx.lineTo(cx, roofTopY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#a8753f';
  ctx.beginPath();
  ctx.moveTo(cx, base - height + 3 * zoom);
  ctx.lineTo(cx + hw + 2 * zoom, base - hh - height);
  ctx.lineTo(cx, roofTopY);
  ctx.closePath();
  ctx.fill();

  // Front Facade (Signboard, Door, Windows) is on West/South face
  // Visible at rot 0 (SW screen) and rot 3 (SE screen)
  if (rot === 0 || rot === 3) {
    const drawFace = rot === 3 ? drawIsoQuadSE : drawIsoQuadSW;
    drawFace(ctx, cx, base, hw, hh, height, 0.05, 0.65, 0.95, 0.92, '#fff8ef', '#5c3d22', Math.max(1.2, zoom));
    if (zoom >= 0.35) {
      const baseSz = Math.max(4.5, Math.floor(4.0 * zoom));
      if (rot === 3) {
        drawIsoQuadSE(ctx, cx, base, hw, hh, height, 0.05, 0.65, 0.95, 0.92, '#fff8ef', '#5c3d22', Math.max(1.2, zoom));
      } else {
        drawIsoTextSW(ctx, cx, base, hw, hh, height, 0.05, 0.65, 0.95, 0.92, 'ARTESANÍA', '#5c3d22', baseSz);
      }
    }

    drawFace(ctx, cx, base, hw, hh, height, 0.58, 0.04, 0.86, 0.48, '#ba3c34');
    drawFace(ctx, cx, base, hw, hh, height, 0.12, 0.18, 0.44, 0.54, '#388e8e', '#1d5757', Math.max(1, zoom * 0.8));

    if (zoom >= 0.5 && rot === 0) {
      const propPoint = { x: cx - hw * 0.7, y: base - hh * 0.7 };
      ctx.fillStyle = '#8a5a9c';
      ctx.beginPath();
      ctx.arc(propPoint.x, propPoint.y - 2 * zoom, 2.5 * zoom, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawGardenShop(args: DrawArgs, tier: Tier) {
  const { ctx, zoom, rotation = 0 } = args;
  const { cx, base, hw: rawHw, hh: rawHh } = footprint(args, '#2b7a70', '#84d8ce');
  const hw = rawHw * 0.85;
  const hh = rawHh * 0.85;
  const height = (tier === 1 ? 20 : 30) * zoom;
  const rot = ((Math.round(rotation) % 4) + 4) % 4;

  // Glass Facades
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0, 0, 1, 1, '#64c4b8');
  drawIsoQuadSE(ctx, cx, base, hw, hh, height, 0, 0, 1, 1, '#4aa398');

  // Metal Grid Lines
  ctx.strokeStyle = '#2b7a70';
  ctx.lineWidth = Math.max(1, zoom * 0.9);
  for (let u = 0.33; u < 1; u += 0.33) {
    drawIsoQuadSW(ctx, cx, base, hw, hh, height, u, 0, u, 1, 'transparent', '#2b7a70', Math.max(1, zoom * 0.9));
    drawIsoQuadSE(ctx, cx, base, hw, hh, height, u, 0, u, 1, 'transparent', '#2b7a70', Math.max(1, zoom * 0.9));
  }

  // Glass Pitched Greenhouse Roof
  const roofApexY = base - hh * 2 - height - 6 * zoom;
  ctx.fillStyle = '#84d8ce';
  ctx.beginPath();
  ctx.moveTo(cx, roofApexY);
  ctx.lineTo(cx + hw + 2 * zoom, base - hh - height);
  ctx.lineTo(cx, base - height);
  ctx.lineTo(cx - hw - 2 * zoom, base - hh - height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Store Front Features (Signboard "VIVERO", Entrance Door, Potted Plants)
  // Visible at rot 0 (SW screen) and rot 3 (SE screen). Hidden at rot 1 & 2 when viewed from back.
  if (rot === 0 || rot === 3) {
    const drawFace = rot === 3 ? drawIsoQuadSE : drawIsoQuadSW;
    drawFace(ctx, cx, base, hw, hh, height, 0.05, 0.65, 0.95, 0.92, '#ded3b8', '#2b4e47', Math.max(1.2, zoom));
    if (zoom >= 0.35 && rot === 0) {
      const baseSz = Math.max(5.0, Math.floor(4.2 * zoom));
      drawIsoTextSW(ctx, cx, base, hw, hh, height, 0.05, 0.65, 0.95, 0.92, 'VIVERO', '#2b4e47', baseSz);
    }

    drawFace(ctx, cx, base, hw, hh, height, 0.4, 0.02, 0.65, 0.45, '#ba3c34');

    if (zoom >= 0.5 && rot === 0) {
      [{ u: 0.15 }, { u: 0.82 }].forEach(({ u }) => {
        const p = { x: cx - hw * (1 - u), y: base - hh * (1 - u) };
        ctx.fillStyle = '#cc6e42';
        ctx.fillRect(p.x - 2 * zoom, p.y - 2.5 * zoom, 4 * zoom, 2.5 * zoom);
        ctx.fillStyle = '#3d8c52';
        ctx.beginPath();
        ctx.arc(p.x, p.y - 4 * zoom, 3 * zoom, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }
}

export function drawHardwareShop(args: DrawArgs, tier: Tier) {
  const { ctx, zoom, rotation = 0 } = args;
  const { cx, base, hw: rawHw, hh: rawHh } = footprint(args, '#f4e4cf', '#d6bf9f');
  const hw = rawHw * 0.85;
  const hh = rawHh * 0.85;
  const height = (tier === 1 ? 20 : 30) * zoom;
  const rot = ((Math.round(rotation) % 4) + 4) % 4;

  // Facades (Warm Beige)
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0, 0, 1, 1, '#f4e4cf');
  drawIsoQuadSE(ctx, cx, base, hw, hh, height, 0, 0, 1, 1, '#d6bf9f');

  // Parapet Top Trim
  drawIsoQuadSW(ctx, cx, base, hw, hh, height, 0, 0.94, 1, 1.0, '#6b4226');
  drawIsoQuadSE(ctx, cx, base, hw, hh, height, 0, 0.94, 1, 1.0, '#4e2f1b');

  // Flat Roof Surface
  ctx.fillStyle = '#e5d5c0';
  ctx.beginPath();
  ctx.moveTo(cx, base - hh * 2 - height);
  ctx.lineTo(cx + hw, base - hh - height);
  ctx.lineTo(cx, base - height);
  ctx.lineTo(cx - hw, base - hh - height);
  ctx.closePath();
  ctx.fill();

  // AC Unit
  const acY = base - hh * 1.4 - height;
  ctx.fillStyle = '#9eb3b3';
  ctx.fillRect(cx - 3.5 * zoom, acY, 6.5 * zoom, 3.5 * zoom);

  // Store Front Features (Signboard "FERRETERÍA", Display Window, Store Door)
  if (rot === 0 || rot === 3) {
    const drawFace = rot === 3 ? drawIsoQuadSE : drawIsoQuadSW;
    drawFace(ctx, cx, base, hw, hh, height, 0.02, 0.62, 0.98, 0.92, '#f9ebd9', '#6b4226', Math.max(1.2, zoom));
    if (zoom >= 0.35 && rot === 0) {
      const baseSz = Math.max(4.2, Math.floor(3.8 * zoom));
      drawIsoTextSW(ctx, cx, base, hw, hh, height, 0.02, 0.62, 0.98, 0.92, 'FERRETERÍA', '#472b17', baseSz);
    }

    drawFace(ctx, cx, base, hw, hh, height, 0.08, 0.1, 0.52, 0.52, '#3b948a', '#276b63', Math.max(1, zoom * 0.8));
    drawFace(ctx, cx, base, hw, hh, height, 0.62, 0.04, 0.88, 0.48, '#5c3426');
  }
}
