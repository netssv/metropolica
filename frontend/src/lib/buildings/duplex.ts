/**
 * Duplex renderer – draws a wide two-unit townhouse spanning 2 adjacent tiles.
 * All face positions are derived from project() on the actual tile corners so
 * the building correctly rotates with the camera at all 4 rotation angles.
 */
import type { DrawArgs } from './types.ts';
import { PROCEDURAL_DETAIL_ZOOM } from './constants.ts';
import { ISO_TILE_W, ISO_TILE_H } from '../isoMath.ts';
import {
  DUPLEX_PALETTE,
  drawFacadeDoor,
  drawFacadeWindow,
  drawFacadeCanopy,
  drawFacadeSteps,
} from './duplexRenderUtils.ts';
import { drawDuplexRoof } from './duplexRoofUtils.ts';

export function drawDuplex(args: DrawArgs, direction: 'horizontal' | 'vertical' = 'horizontal') {
  const { ctx, px, py, zoom, night = false, project, tileCol, tileRow } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return;

  const TW = ISO_TILE_W * zoom;
  const TH = ISO_TILE_H * zoom;

  const dc = direction === 'horizontal' ? 1 : 0;
  const dr = direction === 'vertical'   ? 1 : 0;

  // Helper: project a corner or fall back to px/py-based estimate
  const proj = (c: number, r: number) =>
    project && tileCol != null && tileRow != null
      ? project(tileCol + c, tileRow + r)
      : { x: px + c * TW / 2 - r * TW / 2, y: py + c * TH / 2 + r * TH / 2 };

  // The 6 tile-box origins needed to describe the 2-tile footprint
  const pA   = proj(0,      0);       // tile A top-left bounding box
  const pAE  = proj(1,      0);       // tile A col+1
  const pAS  = proj(0,      1);       // tile A row+1
  const pB   = proj(dc,     dr);      // tile B top-left
  const pBE  = proj(dc + 1, dr);      // tile B col+1
  const pBS  = proj(dc,     dr + 1);  // tile B row+1

  // Convert bounding-box origins to actual diamond vertices
  const vA_top    = { x: pA.x  + TW / 2, y: pA.y            };
  const vA_right  = { x: pAE.x + TW,     y: pAE.y + TH / 2  };
  const vA_bottom = { x: pA.x  + TW / 2, y: pA.y  + TH      };
  const vA_left   = { x: pAS.x,          y: pAS.y + TH / 2   };

  const vB_right  = { x: pBE.x + TW,     y: pBE.y + TH / 2  };
  const vB_bottom = { x: pB.x  + TW / 2, y: pB.y  + TH      };

  // Front facade (SE face visible to the viewer): A-bottom → B-right
  const x0 = vA_bottom.x;  const y0 = vA_bottom.y;
  const x1 = vB_right.x;   const y1 = vB_right.y;

  // SW side wall ground: A-left → A-bottom
  const swX0 = vA_left.x;  const swY0 = vA_left.y;

  // Roof depth vector = direction from A-bottom toward A-top (into the tile)
  const depthX = vA_top.x - vA_bottom.x;
  const depthY = vA_top.y - vA_bottom.y;  // negative (goes upward on screen)

  const height = 26 * zoom;
  const peak   = 10 * zoom;
  const baseH  =  2 * zoom;

  const fY0   = y0   - baseH;
  const fY1   = y1   - baseH;
  const swY0B = swY0 - baseH;

  // 1. Stone Foundation Base (full 2-tile diamond outline + 1 tile deep)
  ctx.fillStyle = DUPLEX_PALETTE.baseDark;
  ctx.beginPath();
  ctx.moveTo(swX0,          swY0);
  ctx.lineTo(x0,            y0);
  ctx.lineTo(x1,            y1);
  ctx.lineTo(x1  + depthX,  y1  + depthY);
  ctx.lineTo(swX0 + depthX, swY0 + depthY);
  ctx.closePath();
  ctx.fill();

  // 2. SW Lit Side Wall
  ctx.fillStyle = DUPLEX_PALETTE.wallLight;
  ctx.beginPath();
  ctx.moveTo(swX0, swY0B);
  ctx.lineTo(x0,   fY0);
  ctx.lineTo(x0,   fY0   - height);
  ctx.lineTo(swX0, swY0B - height);
  ctx.closePath();
  ctx.fill();

  // SW wall windows (projected on the SW wall vector)
  const swWinH = 5 * zoom;
  const swWinY = height * 0.62;
  drawFacadeWindow(ctx, swX0, swY0B, x0, fY0, 0.20, 0.20, swWinY, swWinH, zoom, night);
  drawFacadeWindow(ctx, swX0, swY0B, x0, fY0, 0.60, 0.20, swWinY, swWinH, zoom, night);

  // 3. SE Shaded Front Facade (spans 2 tiles)
  ctx.fillStyle = DUPLEX_PALETTE.wallShade;
  ctx.beginPath();
  ctx.moveTo(x0, fY0);
  ctx.lineTo(x1, fY1);
  ctx.lineTo(x1, fY1 - height);
  ctx.lineTo(x0, fY0 - height);
  ctx.closePath();
  ctx.fill();

  // 4. Dual Gable Roof — depth goes in the depthX / -depthY direction
  drawDuplexRoof(
    ctx,
    x0, fY0 - height,
    x1, fY1 - height,
    -depthX, -depthY,   // roof depth vector (toward back of building)
    peak, zoom
  );

  // 5. Centered Entrance: Steps, Canopy & Twin Doors
  const canopyDepthX = Math.abs(depthX) * 0.16;
  const canopyDepthY = Math.abs(depthY) * 0.16;
  const stepDX       = Math.abs(depthX) * 0.06;
  const stepDY       = Math.abs(depthY) * 0.06;

  drawFacadeSteps(ctx,  x0, fY0, x1, fY1, 0.32, 0.68, stepDX, stepDY, zoom);
  drawFacadeCanopy(ctx, x0, fY0, x1, fY1, 0.30, 0.70, height * 0.38, canopyDepthX, canopyDepthY, zoom);
  drawFacadeDoor(ctx,   x0, fY0, x1, fY1, 0.37, 0.09, 8 * zoom, zoom);
  drawFacadeDoor(ctx,   x0, fY0, x1, fY1, 0.54, 0.09, 8 * zoom, zoom);

  // 6. Upper Floor Windows (6 across SE facade)
  const seWinY = height * 0.64;
  const seWinH = 6 * zoom;
  drawFacadeWindow(ctx, x0, fY0, x1, fY1, 0.06, 0.11, seWinY, seWinH, zoom, night);
  drawFacadeWindow(ctx, x0, fY0, x1, fY1, 0.20, 0.11, seWinY, seWinH, zoom, night);
  drawFacadeWindow(ctx, x0, fY0, x1, fY1, 0.45, 0.11, seWinY, seWinH, zoom, night);
  drawFacadeWindow(ctx, x0, fY0, x1, fY1, 0.59, 0.11, seWinY, seWinH, zoom, night);
  drawFacadeWindow(ctx, x0, fY0, x1, fY1, 0.74, 0.11, seWinY, seWinH, zoom, night);
  drawFacadeWindow(ctx, x0, fY0, x1, fY1, 0.87, 0.11, seWinY, seWinH, zoom, night);
}
