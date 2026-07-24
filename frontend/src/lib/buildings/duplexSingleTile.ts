/**
 * Single-tile Level 2 Duplex house renderer.
 *
 * Renders a 2-tile-wide HORIZONTAL building even though it is drawn from
 * a single anchor tile call. The front (SE) facade runs horizontally across
 * the full 2-tile span; the SW side wall occupies the left face of the
 * anchor tile. This matches a (col,row) + (col+1,row) visual footprint.
 */
import { getDuplexPalette, type DuplexPalette } from './duplexPalette.ts';
import {
  drawFacadeDoor,
  drawFacadeWindow,
  drawFacadeCanopy,
  drawFacadeSteps,
} from './duplexRenderUtils.ts';

/**
 * Dual-gable roof spanning the full 2-tile horizontal facade.
 * x0,y0 → x1,y1 is horizontal (y0 === y1); depth goes NW (-hw,-hh).
 */
function drawHorizRoof(
  ctx: CanvasRenderingContext2D,
  x0: number, y: number, x1: number,
  hw: number, hh: number, peak: number, zoom: number,
  palette: DuplexPalette
) {
  const span = x1 - x0;

  const P0: [number, number] = [x0,                y];
  const P1: [number, number] = [x0 + span * 0.25,  y - peak];
  const P2: [number, number] = [x0 + span * 0.50,  y - peak * 0.08];
  const P3: [number, number] = [x0 + span * 0.75,  y - peak];
  const P4: [number, number] = [x1,                y];

  const B0: [number, number] = [P0[0] - hw, P0[1] - hh];
  const B1: [number, number] = [P1[0] - hw, P1[1] - hh];
  const B2: [number, number] = [P2[0] - hw, P2[1] - hh];
  const B3: [number, number] = [P3[0] - hw, P3[1] - hh];
  const B4: [number, number] = [P4[0] - hw, P4[1] - hh];

  // Front gable wall triangles
  ctx.fillStyle = palette.wallShade;
  ctx.beginPath();
  ctx.moveTo(P0[0], P0[1]); ctx.lineTo(P1[0], P1[1]); ctx.lineTo(P2[0], P2[1]);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(P2[0], P2[1]); ctx.lineTo(P3[0], P3[1]); ctx.lineTo(P4[0], P4[1]);
  ctx.closePath(); ctx.fill();

  // Roof slopes
  ctx.fillStyle = palette.roofLight;
  ctx.beginPath();
  ctx.moveTo(P0[0] - zoom, P0[1]); ctx.lineTo(P1[0], P1[1]);
  ctx.lineTo(B1[0], B1[1]); ctx.lineTo(B0[0] - zoom, B0[1]);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = palette.roofShade;
  ctx.beginPath();
  ctx.moveTo(P1[0], P1[1]); ctx.lineTo(P2[0], P2[1]);
  ctx.lineTo(B2[0], B2[1]); ctx.lineTo(B1[0], B1[1]);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = palette.roofLight;
  ctx.beginPath();
  ctx.moveTo(P2[0], P2[1]); ctx.lineTo(P3[0], P3[1]);
  ctx.lineTo(B3[0], B3[1]); ctx.lineTo(B2[0], B2[1]);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = palette.roofShade;
  ctx.beginPath();
  ctx.moveTo(P3[0], P3[1]); ctx.lineTo(P4[0] + zoom, P4[1]);
  ctx.lineTo(B4[0] + zoom, B4[1]); ctx.lineTo(B3[0], B3[1]);
  ctx.closePath(); ctx.fill();

  // Fascia trim on top of fills
  ctx.strokeStyle = palette.trimLight;
  ctx.lineWidth = Math.max(1.2, 1.5 * zoom);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(P0[0], P0[1]); ctx.lineTo(P1[0], P1[1]);
  ctx.lineTo(P2[0], P2[1]); ctx.lineTo(P3[0], P3[1]);
  ctx.lineTo(P4[0], P4[1]);
  ctx.stroke();

  // Chimney at valley
  const chimX = P2[0] + 2 * zoom;
  const chimY = P2[1] - 4 * zoom;
  const chimW = 5 * zoom;
  const chimH = 9 * zoom;
  ctx.fillStyle = palette.chimney;
  ctx.fillRect(chimX - chimW * 0.5, chimY - chimH, chimW, chimH);
  ctx.fillStyle = palette.trimLight;
  ctx.fillRect(chimX - chimW * 0.6, chimY - chimH - zoom, chimW * 1.2, zoom * 1.4);
}

export function drawSingleTileDuplex(
  ctx: CanvasRenderingContext2D,
  cx: number, base: number, hw: number, hh: number,
  zoom: number, night: boolean, seed = 0
) {
  const palette = getDuplexPalette(seed);
  const height = 22 * zoom;
  const peak   = 9  * zoom;
  const baseH  = 1.5 * zoom;

  // 2-tile horizontal geometry:
  const fX0 = cx;           const fY  = base - baseH;      // left end of facade
  const fX1 = cx + 2 * hw;                                  // right end of facade

  // SW side wall: west(A) → south(A)
  const swX0 = cx - hw;    const swY0 = base - hh - baseH;
  const swX1 = cx;         const swY1 = base - baseH;

  // 2-tile foundation (6-vertex diamond)
  ctx.fillStyle = palette.baseDark;
  ctx.beginPath();
  ctx.moveTo(cx - hw,      base - hh);          // west A
  ctx.lineTo(cx,           base);                // south A
  ctx.lineTo(cx + hw,      base + hh);           // south B
  ctx.lineTo(cx + 2 * hw,  base);                // east B
  ctx.lineTo(cx + hw,      base - hh);           // north B / east A
  ctx.lineTo(cx,           base - 2 * hh);       // north A
  ctx.closePath();
  ctx.fill();

  // SW lit side wall
  ctx.fillStyle = palette.wallLight;
  ctx.beginPath();
  ctx.moveTo(swX0, swY0); ctx.lineTo(swX1, swY1);
  ctx.lineTo(swX1, swY1 - height); ctx.lineTo(swX0, swY0 - height);
  ctx.closePath(); ctx.fill();

  // Close the visible left gable.
  ctx.fillStyle = palette.wallLight;
  ctx.beginPath();
  ctx.moveTo(swX0, swY0 - height);
  ctx.lineTo(swX1, swY1 - height);
  ctx.lineTo(swX1 + hw * 0.5, swY1 - height - peak);
  ctx.closePath();
  ctx.fill();

  // SE right side wall.
  const seX0 = fX1;           const seY0 = fY;
  const seX1 = fX1 - hw;      const seY1 = fY - hh;
  ctx.fillStyle = palette.wallBack;
  ctx.beginPath();
  ctx.moveTo(seX0, seY0);
  ctx.lineTo(seX1, seY1);
  ctx.lineTo(seX1, seY1 - height);
  ctx.lineTo(seX0, seY0 - height);
  ctx.closePath();
  ctx.fill();

  // SE horizontal front wall
  ctx.fillStyle = palette.wallShade;
  ctx.beginPath();
  ctx.moveTo(fX0, fY);
  ctx.lineTo(fX1, fY);
  ctx.lineTo(fX1, fY - height);
  ctx.lineTo(fX0, fY - height);
  ctx.closePath();
  ctx.fill();

  // Dual-gable roof
  drawHorizRoof(ctx, fX0, fY - height, fX1, hw, hh, peak, zoom, palette);

  // Entrances for Unit 1 & Unit 2
  const stepDX = hw * 0.04;  const stepDY = hh * 0.04;
  const canopyY = height * 0.48;
  const doorH = 7.2 * zoom;

  drawFacadeSteps(ctx,  fX0, fY, fX1, fY, 0.20, 0.38, stepDX, stepDY, zoom);
  drawFacadeCanopy(ctx, fX0, fY, fX1, fY, 0.19, 0.39, canopyY, hw * 0.07, hh * 0.07, zoom);
  drawFacadeDoor(ctx,   fX0, fY, fX1, fY, 0.24, 0.10, doorH, zoom);

  drawFacadeSteps(ctx,  fX0, fY, fX1, fY, 0.62, 0.80, stepDX, stepDY, zoom);
  drawFacadeCanopy(ctx, fX0, fY, fX1, fY, 0.61, 0.81, canopyY, hw * 0.07, hh * 0.07, zoom);
  drawFacadeDoor(ctx,   fX0, fY, fX1, fY, 0.66, 0.10, doorH, zoom);

  // Front facade windows (4: 2 per unit)
  const winH = 5 * zoom;
  const winY = height * 0.60;
  drawFacadeWindow(ctx, fX0, fY, fX1, fY, 0.08, 0.13, winY, winH, zoom, night);
  drawFacadeWindow(ctx, fX0, fY, fX1, fY, 0.27, 0.13, winY, winH, zoom, night);
  drawFacadeWindow(ctx, fX0, fY, fX1, fY, 0.60, 0.13, winY, winH, zoom, night);
  drawFacadeWindow(ctx, fX0, fY, fX1, fY, 0.79, 0.13, winY, winH, zoom, night);

  // SW side wall windows
  drawFacadeWindow(ctx, swX0, swY0, swX1, swY1, 0.20, 0.30, height * 0.58, 4.5 * zoom, zoom, night);
  drawFacadeWindow(ctx, swX0, swY0, swX1, swY1, 0.58, 0.30, height * 0.58, 4.5 * zoom, zoom, night);
}
