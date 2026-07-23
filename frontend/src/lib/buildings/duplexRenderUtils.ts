/**
 * Duplex Visual Render Utilities - Level 2 Sage Green Duplex
 * Implements isometric SE/SW wall projections, canopy overhang, concrete steps, and cream-framed windows.
 */
import { drawDuplexRoof } from './duplexRoofUtils.ts';
import { DUPLEX_PALETTE } from './duplexPalette.ts';
export { DUPLEX_PALETTE };

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
  const gx1 = x0 + (x1 - x0) * t;
  const gy1 = y0 + (y1 - y0) * t - yLevel;
  const gx2 = x0 + (x1 - x0) * (t + wT);
  const gy2 = y0 + (y1 - y0) * (t + wT) - yLevel;
  const fMargin = 1.2 * zoom;

  ctx.fillStyle = DUPLEX_PALETTE.trimLight;
  ctx.beginPath();
  ctx.moveTo(gx1 - fMargin, gy1 + fMargin * 0.5);
  ctx.lineTo(gx2 + fMargin, gy2 - fMargin * 0.5);
  ctx.lineTo(gx2 + fMargin, gy2 - fMargin * 0.5 - wH - fMargin * 2);
  ctx.lineTo(gx1 - fMargin, gy1 + fMargin * 0.5 - wH - fMargin * 2);
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
  const p1: [number, number] = [x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1 - yLevel];
  const p2: [number, number] = [x0 + (x1 - x0) * t2, y0 + (y1 - y0) * t2 - yLevel];
  const o1: [number, number] = [p1[0] - depthX, p1[1] + depthY];
  const o2: [number, number] = [p2[0] - depthX, p2[1] + depthY];

  ctx.fillStyle = DUPLEX_PALETTE.canopyDark;
  ctx.beginPath();
  ctx.moveTo(p1[0], p1[1]);
  ctx.lineTo(p2[0], p2[1]);
  ctx.lineTo(o2[0], o2[1]);
  ctx.lineTo(o1[0], o1[1]);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = DUPLEX_PALETTE.trimLight;
  const trimH = 1.8 * zoom;
  ctx.beginPath();
  ctx.moveTo(o1[0], o1[1]);
  ctx.lineTo(o2[0], o2[1]);
  ctx.lineTo(o2[0], o2[1] + trimH);
  ctx.lineTo(o1[0], o1[1] + trimH);
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
  const stepCount = 4;
  const stepH = 1.2 * zoom;

  for (let i = 0; i < stepCount; i++) {
    const offX = i * stepDepthX;
    const offY = i * stepDepthY;
    const s1: [number, number] = [x0 + (x1 - x0) * t1 - offX, y0 + (y1 - y0) * t1 + offY];
    const s2: [number, number] = [x0 + (x1 - x0) * t2 - offX, y0 + (y1 - y0) * t2 + offY];
    const e1: [number, number] = [s1[0] - stepDepthX, s1[1] + stepDepthY];
    const e2: [number, number] = [s2[0] - stepDepthX, s2[1] + stepDepthY];

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

/** Draw single-tile level 2 house matching reference image proportions */
export function drawSingleTileDuplex(
  ctx: CanvasRenderingContext2D,
  cx: number, base: number, hw: number, hh: number,
  zoom: number, night: boolean
) {
  const height  = 22 * zoom;
  const peak    = 8  * zoom;
  const baseH   = 1.5 * zoom;

  // ── SE edge: bottom-center → right-center
  const seX0 = cx;        const seY0 = base - baseH;
  const seX1 = cx + hw;   const seY1 = base - hh - baseH;

  // ── SW edge: left-center → bottom-center
  const swX0 = cx - hw;   const swY0 = base - hh - baseH;
  const swX1 = cx;        const swY1 = base - baseH;

  // ── Stone base diamond
  ctx.fillStyle = DUPLEX_PALETTE.baseDark;
  ctx.beginPath();
  ctx.moveTo(cx - hw, base - hh);
  ctx.lineTo(cx,      base);
  ctx.lineTo(cx + hw, base - hh);
  ctx.lineTo(cx,      base - hh * 2);
  ctx.closePath();
  ctx.fill();

  // ── SW Lit wall
  ctx.fillStyle = DUPLEX_PALETTE.wallLight;
  ctx.beginPath();
  ctx.moveTo(swX0, swY0);
  ctx.lineTo(swX1, swY1);
  ctx.lineTo(swX1, swY1 - height);
  ctx.lineTo(swX0, swY0 - height);
  ctx.closePath();
  ctx.fill();

  // ── SE Shaded wall
  ctx.fillStyle = DUPLEX_PALETTE.wallShade;
  ctx.beginPath();
  ctx.moveTo(seX0, seY0);
  ctx.lineTo(seX1, seY1);
  ctx.lineTo(seX1, seY1 - height);
  ctx.lineTo(seX0, seY0 - height);
  ctx.closePath();
  ctx.fill();

  // ── Roof: depthX = hw, depthY = hh → back ridge aligns with tile top vertex ✓
  drawDuplexRoof(ctx, seX0, seY0 - height, seX1, seY1 - height, hw, hh, peak, zoom);

  // ── Entrance on SE facade
  const stepDX = hw * 0.035;  const stepDY = hh * 0.035;
  drawFacadeSteps(ctx,  seX0, seY0, seX1, seY1, 0.25, 0.75, stepDX, stepDY, zoom);
  drawFacadeCanopy(ctx, seX0, seY0, seX1, seY1, 0.22, 0.78, height * 0.34, hw * 0.07, hh * 0.07, zoom);
  drawFacadeDoor(ctx,   seX0, seY0, seX1, seY1, 0.32, 0.12, 6.5 * zoom, zoom);
  drawFacadeDoor(ctx,   seX0, seY0, seX1, seY1, 0.56, 0.12, 6.5 * zoom, zoom);

  // ── Upper windows on SE facade
  const winH = 4.5 * zoom;
  const winY = height * 0.58;
  drawFacadeWindow(ctx, seX0, seY0, seX1, seY1, 0.07, 0.22, winY, winH, zoom, night);
  drawFacadeWindow(ctx, seX0, seY0, seX1, seY1, 0.39, 0.22, winY, winH, zoom, night);
  drawFacadeWindow(ctx, seX0, seY0, seX1, seY1, 0.71, 0.22, winY, winH, zoom, night);

  // ── Window on SW wall
  drawFacadeWindow(ctx, swX0, swY0, swX1, swY1, 0.35, 0.30, height * 0.56, 4 * zoom, zoom, night);
}
