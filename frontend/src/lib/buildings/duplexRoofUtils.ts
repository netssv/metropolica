/**
 * Duplex Roof Utilities - Dual-Gable Pitched Roof & Central Chimney.
 * Supports arbitrary front facade span (1-tile or 2-tile).
 */
import { DUPLEX_PALETTE } from './duplexPalette.ts';

export function drawDuplexRoof(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, x1: number, y1: number,
  depthX: number, depthY: number,
  peak: number, zoom: number
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

  // 1. Front Gable Wall Triangles (Sage green wall color)
  ctx.fillStyle = DUPLEX_PALETTE.wallShade;
  // Left Gable Triangle
  ctx.beginPath();
  ctx.moveTo(P0[0], P0[1]);
  ctx.lineTo(P1[0], P1[1]);
  ctx.lineTo(P2[0], P2[1]);
  ctx.closePath();
  ctx.fill();

  // Right Gable Triangle
  ctx.beginPath();
  ctx.moveTo(P2[0], P2[1]);
  ctx.lineTo(P3[0], P3[1]);
  ctx.lineTo(P4[0], P4[1]);
  ctx.closePath();
  ctx.fill();

  // Gable Wall Trim
  ctx.strokeStyle = DUPLEX_PALETTE.trimLight;
  ctx.lineWidth = Math.max(1, 1.2 * zoom);
  ctx.beginPath();
  ctx.moveTo(P0[0], P0[1]);
  ctx.lineTo(P1[0], P1[1]);
  ctx.lineTo(P2[0], P2[1]);
  ctx.lineTo(P3[0], P3[1]);
  ctx.lineTo(P4[0], P4[1]);
  ctx.stroke();

  // 2. Dark Grey Roof Pitches (sloping backward)
  // Left Gable - Left Slope
  ctx.fillStyle = DUPLEX_PALETTE.roofLight;
  ctx.beginPath();
  ctx.moveTo(P0[0] - 1.5 * zoom, P0[1]);
  ctx.lineTo(P1[0], P1[1]);
  ctx.lineTo(B1[0], B1[1]);
  ctx.lineTo(B0[0] - 1.5 * zoom, B0[1]);
  ctx.closePath();
  ctx.fill();

  // Left Gable - Right Slope (into valley)
  ctx.fillStyle = DUPLEX_PALETTE.roofShade;
  ctx.beginPath();
  ctx.moveTo(P1[0], P1[1]);
  ctx.lineTo(P2[0], P2[1]);
  ctx.lineTo(B2[0], B2[1]);
  ctx.lineTo(B1[0], B1[1]);
  ctx.closePath();
  ctx.fill();

  // Right Gable - Left Slope (out of valley)
  ctx.fillStyle = DUPLEX_PALETTE.roofLight;
  ctx.beginPath();
  ctx.moveTo(P2[0], P2[1]);
  ctx.lineTo(P3[0], P3[1]);
  ctx.lineTo(B3[0], B3[1]);
  ctx.lineTo(B2[0], B2[1]);
  ctx.closePath();
  ctx.fill();

  // Right Gable - Right Slope
  ctx.fillStyle = DUPLEX_PALETTE.roofShade;
  ctx.beginPath();
  ctx.moveTo(P3[0], P3[1]);
  ctx.lineTo(P4[0] + 1.5 * zoom, P4[1]);
  ctx.lineTo(B4[0] + 1.5 * zoom, B4[1]);
  ctx.lineTo(B3[0], B3[1]);
  ctx.closePath();
  ctx.fill();

  // 3. Central Chimney in Roof Valley
  const chimX = P2[0] + 2 * zoom;
  const chimY = P2[1] - 4 * zoom;
  const chimW = 5 * zoom;
  const chimH = 9 * zoom;
  ctx.fillStyle = DUPLEX_PALETTE.chimney;
  ctx.fillRect(chimX - chimW * 0.5, chimY - chimH, chimW, chimH);
  ctx.fillStyle = DUPLEX_PALETTE.trimLight;
  ctx.fillRect(chimX - chimW * 0.6, chimY - chimH - zoom, chimW * 1.2, zoom * 1.4);
}
