/**
 * Detailed 4-tile (2x2) Apartment Building Renderer.
 * Draws a detailed multi-story residential building occupying a 2x2 grid block.
 * Called only on the anchor tile (bldg-tl); the other 3 partner tiles remain silent.
 */
import type { DrawArgs } from './types.ts';
import { PROCEDURAL_DETAIL_ZOOM } from './constants.ts';
import { ISO_TILE_W, ISO_TILE_H } from '../isoMath.ts';
import { drawAnimatedWindow, drawRooftopDetails } from './helpers.ts';

import { genericTune } from './genericTuneState.ts';

export function drawApartmentBuilding(args: DrawArgs) {
  const { ctx, px, py, zoom, project, tileCol, tileRow } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return;

  const tune = genericTune.getParams('apartment');
  const TW = ISO_TILE_W * zoom * (tune.scaleX ?? 1.0);
  const TH = ISO_TILE_H * zoom * (tune.scaleY ?? 1.0);

  // Derive the four corners from the active camera projection. The previous
  // fixed offsets only describe the north-east view, causing a 2×2 tower to
  // drift over unrelated lots after a camera rotation.
  const at = (col: number, row: number) => project?.(col, row) ?? { x: px + (col - (tileCol ?? col)) * TW / 2 - (row - (tileRow ?? row)) * TW / 2, y: py + (col - (tileCol ?? col)) * TH / 2 + (row - (tileRow ?? row)) * TH / 2 };
  const col = tileCol ?? 0;
  const row = tileRow ?? 0;
  const top = at(col, row);
  const right = at(col + 1, row);
  const bottom = at(col + 1, row + 1);
  const left = at(col, row + 1);
  const topX = top.x + TW / 2;
  const topY = top.y;
  const rightX = right.x + TW;
  const rightY = right.y + TH / 2;
  const botX = bottom.x + TW / 2;
  const botY = bottom.y + TH;
  const leftX = left.x;
  const leftY = left.y + TH / 2;

  // 1. Draw 2x2 Ground Lot / Plaza base
  ctx.fillStyle = '#437050';
  ctx.beginPath();
  ctx.moveTo(topX, topY);
  ctx.lineTo(rightX, rightY);
  ctx.lineTo(botX, botY);
  ctx.lineTo(leftX, leftY);
  ctx.closePath();
  ctx.fill();

  // Draw subtle inner sidewalk / plaza border
  ctx.fillStyle = '#9cb8a3';
  ctx.beginPath();
  ctx.moveTo(topX, topY + 4 * zoom);
  ctx.lineTo(rightX - 8 * zoom, rightY);
  ctx.lineTo(botX, botY - 4 * zoom);
  ctx.lineTo(leftX + 8 * zoom, leftY);
  ctx.closePath();
  ctx.fill();

  // Building geometry metrics
  const bldgHeight = (tune.height ?? 54) * zoom;
  const wallLeftColor = '#4a7556';
  const wallRightColor = '#3c6347';
  const roofColor = '#2b4733';

  // 2. Main tower facade
  // Front-left face (from Left to Bot)
  const bHeight = 44 * zoom;
  const insetLeftX = leftX + 12 * zoom;
  const insetLeftY = leftY;
  const insetBotX = botX;
  const insetBotY = botY - 6 * zoom;
  const insetRightX = rightX - 12 * zoom;
  const insetRightY = rightY;
  const insetTopX = topX;
  const insetTopY = topY + 6 * zoom;

  // Left Wall
  ctx.fillStyle = wallLeftColor;
  ctx.beginPath();
  ctx.moveTo(insetLeftX, insetLeftY);
  ctx.lineTo(insetBotX, insetBotY);
  ctx.lineTo(insetBotX, insetBotY - bldgHeight);
  ctx.lineTo(insetLeftX, insetLeftY - bldgHeight);
  ctx.closePath();
  ctx.fill();

  // Right Wall
  ctx.fillStyle = wallRightColor;
  ctx.beginPath();
  ctx.moveTo(insetBotX, insetBotY);
  ctx.lineTo(insetRightX, insetRightY);
  ctx.lineTo(insetRightX, insetRightY - bldgHeight);
  ctx.lineTo(insetBotX, insetBotY - bldgHeight);
  ctx.closePath();
  ctx.fill();

  // Roof Surface
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(insetTopX, insetTopY - bldgHeight);
  ctx.lineTo(insetRightX, insetRightY - bldgHeight);
  ctx.lineTo(insetBotX, insetBotY - bldgHeight);
  ctx.lineTo(insetLeftX, insetLeftY - bldgHeight);
  ctx.closePath();
  ctx.fill();

  // 3. Grid Windows across floors
  const floors = 4;
  for (let f = 0; f < floors; f++) {
    const floorY = insetBotY - (8 + f * 9) * zoom;
    // Left facade windows
    for (let w = 0; w < 3; w++) {
      const wx = insetLeftX + (insetBotX - insetLeftX) * (0.2 + w * 0.26);
      const wy = insetLeftY + (insetBotY - insetLeftY) * (0.2 + w * 0.26) - (8 + f * 9) * zoom;
      drawAnimatedWindow(args, wx, wy, 4, 5, (args.seed ?? 0) + f * 7 + w);
    }
    
    // Right facade windows
    for (let w = 0; w < 3; w++) {
      const wx = insetBotX + (insetRightX - insetBotX) * (0.2 + w * 0.26);
      const wy = insetBotY + (insetRightY - insetBotY) * (0.2 + w * 0.26) - (8 + f * 9) * zoom;
      drawAnimatedWindow(args, wx, wy, 4, 5, (args.seed ?? 0) + f * 11 + w + 20);
    }
  }

  // 4. Rooftop Details (Water Tank / Elevator Shaft)
  ctx.fillStyle = '#68786d';
  const tankX = insetTopX;
  const tankY = insetTopY - bldgHeight - 6 * zoom;
  ctx.fillRect(tankX - 4 * zoom, tankY - 6 * zoom, 8 * zoom, 8 * zoom);
  // Anchor the rooftop equipment on the visible centre of the roof plane.
  drawRooftopDetails(args, tankX, insetTopY - bldgHeight + 18 * zoom, TW * 0.28 / zoom, args.seed ?? 0);
}
