/**
 * Duplex Roof Utilities - Dual-Gable Pitched Roof & Central Chimney.
 * Supports arbitrary front facade span (1-tile or 2-tile).
 */
import { DUPLEX_PALETTE, type DuplexPalette } from './duplexPalette.ts';

export function drawDuplexRoof(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, x1: number, y1: number,
  depthX: number, depthY: number,
  peak: number, zoom: number,
  chimneyPosT: number = 0.28,
  chimneyDepthRatio: number = 0.35,
  chimneyHParam: number = 10,
  palette: DuplexPalette = DUPLEX_PALETTE
) {
  // Key points along front wall top edge (t = 0..1)
  const P0: [number, number] = [x0, y0];
  const P1: [number, number] = [x0 + (x1 - x0) * 0.25, y0 + (y1 - y0) * 0.25 - peak];
  const P2: [number, number] = [x0 + (x1 - x0) * 0.50, y0 + (y1 - y0) * 0.50 - peak * 0.1];
  const P3: [number, number] = [x0 + (x1 - x0) * 0.75, y0 + (y1 - y0) * 0.75 - peak];
  const P4: [number, number] = [x1, y1];

  // Back ridge points (offset along SW depth vector)
  const B0: [number, number] = [P0[0] - depthX, P0[1] - depthY];
  const B1: [number, number] = [P1[0] - depthX, P1[1] - depthY];
  const B2: [number, number] = [P2[0] - depthX, P2[1] - depthY];
  const B3: [number, number] = [P3[0] - depthX, P3[1] - depthY];
  const B4: [number, number] = [P4[0] - depthX, P4[1] - depthY];

  // 1. Solid Gable Wall Fills (Front & Back) - Seals wall top to roofline with zero gap
  ctx.fillStyle = palette.wallShade;

  // Front Gable Wall Facade Fill (P0 -> P1 -> P2 -> P3 -> P4 -> close along line P4..P0)
  ctx.beginPath();
  ctx.moveTo(P0[0], P0[1]);
  ctx.lineTo(P1[0], P1[1]);
  ctx.lineTo(P2[0], P2[1]);
  ctx.lineTo(P3[0], P3[1]);
  ctx.lineTo(P4[0], P4[1]);
  ctx.closePath();
  ctx.fill();

  // Rear Gable Wall Facade Fill
  ctx.beginPath();
  ctx.moveTo(B0[0], B0[1]);
  ctx.lineTo(B1[0], B1[1]);
  ctx.lineTo(B2[0], B2[1]);
  ctx.lineTo(B3[0], B3[1]);
  ctx.lineTo(B4[0], B4[1]);
  ctx.closePath();
  ctx.fill();

  // 2. Dark Grey Roof Pitches (sloping backward)
  // Left Gable - Left Slope
  ctx.fillStyle = palette.roofLight;
  ctx.beginPath();
  ctx.moveTo(P0[0] - 1.5 * zoom, P0[1]);
  ctx.lineTo(P1[0], P1[1]);
  ctx.lineTo(B1[0], B1[1]);
  ctx.lineTo(B0[0] - 1.5 * zoom, B0[1]);
  ctx.closePath();
  ctx.fill();

  // Left Gable - Right Slope (into valley)
  ctx.fillStyle = palette.roofShade;
  ctx.beginPath();
  ctx.moveTo(P1[0], P1[1]);
  ctx.lineTo(P2[0], P2[1]);
  ctx.lineTo(B2[0], B2[1]);
  ctx.lineTo(B1[0], B1[1]);
  ctx.closePath();
  ctx.fill();

  // Right Gable - Left Slope (out of valley)
  ctx.fillStyle = palette.roofLight;
  ctx.beginPath();
  ctx.moveTo(P2[0], P2[1]);
  ctx.lineTo(P3[0], P3[1]);
  ctx.lineTo(B3[0], B3[1]);
  ctx.lineTo(B2[0], B2[1]);
  ctx.closePath();
  ctx.fill();

  // Right Gable - Right Slope
  ctx.fillStyle = palette.roofShade;
  ctx.beginPath();
  ctx.moveTo(P3[0], P3[1]);
  ctx.lineTo(P4[0] + 1.5 * zoom, P4[1]);
  ctx.lineTo(B4[0] + 1.5 * zoom, B4[1]);
  ctx.lineTo(B3[0], B3[1]);
  ctx.closePath();
  ctx.fill();

  // 3. Crisp Front Gable Eave Trim Boards (Fascia)
  ctx.strokeStyle = palette.trimLight;
  ctx.lineWidth = Math.max(1.2, 1.5 * zoom);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(P0[0], P0[1]);
  ctx.lineTo(P1[0], P1[1]);
  ctx.lineTo(P2[0], P2[1]);
  ctx.lineTo(P3[0], P3[1]);
  ctx.lineTo(P4[0], P4[1]);
  ctx.stroke();

  // 4. 3D Isometric Chimney positioned set back along roof plane
  const t = Math.max(0.05, Math.min(0.95, chimneyPosT));
  const dRatio = Math.max(0.05, Math.min(0.9, chimneyDepthRatio));

  let roofOffset = 0;
  if (t <= 0.25) {
    roofOffset = (t / 0.25) * peak;
  } else if (t <= 0.50) {
    roofOffset = peak - ((t - 0.25) / 0.25) * (peak * 0.9);
  } else if (t <= 0.75) {
    roofOffset = peak * 0.1 + ((t - 0.50) / 0.25) * (peak * 0.9);
  } else {
    roofOffset = peak - ((t - 0.75) / 0.25) * peak;
  }

  const pFrontX = x0 + (x1 - x0) * t;
  const pFrontY = y0 + (y1 - y0) * t - roofOffset;

  const cx = pFrontX - depthX * dRatio;
  const cy = pFrontY - depthY * dRatio;

  const cw = 3.8 * zoom;
  const cd = 2.8 * zoom;
  const ch = chimneyHParam * zoom;

  // Left face (SW lit)
  ctx.fillStyle = palette.chimney;
  ctx.beginPath();
  ctx.moveTo(cx - cw, cy);
  ctx.lineTo(cx, cy + cd * 0.5);
  ctx.lineTo(cx, cy + cd * 0.5 - ch);
  ctx.lineTo(cx - cw, cy - ch);
  ctx.closePath();
  ctx.fill();

  // Right face (SE shade)
  ctx.fillStyle = '#4a4c4f';
  ctx.beginPath();
  ctx.moveTo(cx, cy + cd * 0.5);
  ctx.lineTo(cx + cw, cy);
  ctx.lineTo(cx + cw, cy - ch);
  ctx.lineTo(cx, cy + cd * 0.5 - ch);
  ctx.closePath();
  ctx.fill();

  // Top cap rim (Light trim overhang)
  const rm = 1.0 * zoom;
  const capY = cy - ch;
  ctx.fillStyle = palette.trimLight;
  ctx.beginPath();
  ctx.moveTo(cx - cw - rm, capY);
  ctx.lineTo(cx, capY + cd * 0.5 + rm * 0.5);
  ctx.lineTo(cx + cw + rm, capY);
  ctx.lineTo(cx, capY - cd * 0.5 - rm * 0.5);
  ctx.closePath();
  ctx.fill();
}
