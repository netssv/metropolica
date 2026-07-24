/**
 * Duplex Visual Render Utilities - Level 2 Sage Green Duplex
 * Implements isometric SE/SW wall projections, canopy overhang, concrete steps, and cream-framed windows.
 */

import { DUPLEX_PALETTE, getDuplexPalette } from './duplexPalette.ts';
export { DUPLEX_PALETTE, getDuplexPalette };

/** Render isometric door on facade vector (P_start -> P_end) */
export function drawFacadeDoor(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, x1: number, y1: number,
  t: number, dT: number, dHeight: number, zoom: number
) {
  const gx1 = x0 + (x1 - x0) * t;
  const gy1 = y0 + (y1 - y0) * t;
  const gx2 = x0 + (x1 - x0) * (t + dT);
  const gy2 = y0 + (y1 - y0) * (t + dT);

  ctx.fillStyle = DUPLEX_PALETTE.doorColor;
  ctx.beginPath();
  ctx.moveTo(gx1, gy1);
  ctx.lineTo(gx2, gy2);
  ctx.lineTo(gx2, gy2 - dHeight);
  ctx.lineTo(gx1, gy1 - dHeight);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = DUPLEX_PALETTE.trimShade;
  ctx.lineWidth = Math.max(0.8, 1 * zoom);
  ctx.stroke();

  const kx = gx1 + (gx2 - gx1) * 0.8;
  const ky = gy1 + (gy2 - gy1) * 0.8 - dHeight * 0.5;
  ctx.fillStyle = '#b89443';
  ctx.beginPath();
  ctx.arc(kx, ky, Math.max(1, 1.2 * zoom), 0, Math.PI * 2);
  ctx.fill();
}

/** Render isometric framed 2-pane window on facade vector */
export function drawFacadeWindow(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, x1: number, y1: number,
  t: number, wT: number, yLevel: number, wH: number,
  zoom: number, night: boolean
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const ux = len > 0 ? dx / len : 0;
  const uy = len > 0 ? dy / len : 0;

  const gx1 = x0 + dx * t;
  const gy1 = y0 + dy * t - yLevel;
  const gx2 = x0 + dx * (t + wT);
  const gy2 = y0 + dy * (t + wT) - yLevel;

  const fMargin = 1.2 * zoom;
  const fx1 = gx1 - ux * fMargin;
  const fy1 = gy1 - uy * fMargin + fMargin * 0.5;
  const fx2 = gx2 + ux * fMargin;
  const fy2 = gy2 + uy * fMargin + fMargin * 0.5;

  ctx.fillStyle = DUPLEX_PALETTE.trimLight;
  ctx.beginPath();
  ctx.moveTo(fx1, fy1);
  ctx.lineTo(fx2, fy2);
  ctx.lineTo(fx2, fy2 - wH - fMargin * 1.5);
  ctx.lineTo(fx1, fy1 - wH - fMargin * 1.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = night ? '#ffe38b' : '#87b4be';
  ctx.beginPath();
  ctx.moveTo(gx1, gy1);
  ctx.lineTo(gx2, gy2);
  ctx.lineTo(gx2, gy2 - wH);
  ctx.lineTo(gx1, gy1 - wH);
  ctx.closePath();
  ctx.fill();

  const mx = (gx1 + gx2) / 2;
  const my = (gy1 + gy2) / 2;
  ctx.strokeStyle = DUPLEX_PALETTE.trimShade;
  ctx.lineWidth = Math.max(0.6, 0.8 * zoom);
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(mx, my - wH);
  ctx.stroke();
}

/** Render front entrance canopy attached to facade vector */
export function drawFacadeCanopy(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, x1: number, y1: number,
  t1: number, t2: number, yLevel: number,
  depthX: number, depthY: number, zoom: number
) {
  const dy = y1 - y0;
  // Automatic outward normal direction based on facade vector:
  // dy < 0 (SE facade going up-right) -> +abs(depthX) (down-right overhang)
  // dy > 0 (SW facade going down-right) -> -abs(depthX) (down-left overhang)
  const outX = dy < 0 ? Math.abs(depthX) : -Math.abs(depthX);
  const outY = Math.abs(depthY);

  const p1: [number, number] = [x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1 - yLevel];
  const p2: [number, number] = [x0 + (x1 - x0) * t2, y0 + (y1 - y0) * t2 - yLevel];
  const o1: [number, number] = [p1[0] + outX, p1[1] + outY];
  const o2: [number, number] = [p2[0] + outX, p2[1] + outY];

  // Dark canopy roof slab
  ctx.fillStyle = DUPLEX_PALETTE.canopyDark;
  ctx.beginPath();
  ctx.moveTo(p1[0], p1[1]);
  ctx.lineTo(p2[0], p2[1]);
  ctx.lineTo(o2[0], o2[1]);
  ctx.lineTo(o1[0], o1[1]);
  ctx.closePath();
  ctx.fill();

  // White front trim fascia
  ctx.fillStyle = DUPLEX_PALETTE.trimLight;
  const trimH = 1.8 * zoom;
  ctx.beginPath();
  ctx.moveTo(o1[0], o1[1]);
  ctx.lineTo(o2[0], o2[1]);
  ctx.lineTo(o2[0], o2[1] + trimH);
  ctx.lineTo(o1[0], o1[1] + trimH);
  ctx.closePath();
  ctx.fill();

  // Side trim brackets connecting to wall
  ctx.fillStyle = DUPLEX_PALETTE.trimShade;
  ctx.beginPath();
  ctx.moveTo(p1[0], p1[1]);
  ctx.lineTo(o1[0], o1[1]);
  ctx.lineTo(o1[0], o1[1] + trimH);
  ctx.lineTo(p1[0], p1[1] + trimH);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(p2[0], p2[1]);
  ctx.lineTo(o2[0], o2[1]);
  ctx.lineTo(o2[0], o2[1] + trimH);
  ctx.lineTo(p2[0], p2[1] + trimH);
  ctx.closePath();
  ctx.fill();
}

/** Render concrete front steps leading to front entrance */
export function drawFacadeSteps(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, x1: number, y1: number,
  t1: number, t2: number,
  stepDepthX: number, stepDepthY: number, zoom: number
) {
  const dy = y1 - y0;
  const outX = dy < 0 ? Math.abs(stepDepthX) : -Math.abs(stepDepthX);
  const outY = Math.abs(stepDepthY);

  const stepCount = 4;
  const stepH = 1.2 * zoom;

  for (let i = 0; i < stepCount; i++) {
    const offX = i * outX;
    const offY = i * outY;
    const s1: [number, number] = [x0 + (x1 - x0) * t1 + offX, y0 + (y1 - y0) * t1 + offY];
    const s2: [number, number] = [x0 + (x1 - x0) * t2 + offX, y0 + (y1 - y0) * t2 + offY];
    const e1: [number, number] = [s1[0] + outX, s1[1] + outY];
    const e2: [number, number] = [s2[0] + outX, s2[1] + outY];

    ctx.fillStyle = DUPLEX_PALETTE.stepsLight;
    ctx.beginPath();
    ctx.moveTo(s1[0], s1[1]);
    ctx.lineTo(s2[0], s2[1]);
    ctx.lineTo(e2[0], e2[1]);
    ctx.lineTo(e1[0], e1[1]);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = DUPLEX_PALETTE.stepsShade;
    ctx.beginPath();
    ctx.moveTo(e1[0], e1[1]);
    ctx.lineTo(e2[0], e2[1]);
    ctx.lineTo(e2[0], e2[1] + stepH);
    ctx.lineTo(e1[0], e1[1] + stepH);
    ctx.closePath();
    ctx.fill();
  }
}
