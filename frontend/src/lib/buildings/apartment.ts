/**
 * Detailed 4-tile (2x2) Apartment Building Renderer.
 * Draws a detailed multi-story residential building occupying a 2x2 grid block.
 * Called only on the anchor tile (bldg-tl); the other 3 partner tiles remain silent.
 */
import { DrawArgs } from './types.ts';
import { PROCEDURAL_DETAIL_ZOOM } from './constants.ts';
import { ISO_TILE_W, ISO_TILE_H } from '../isoMath.ts';

export function drawApartmentBuilding(args: DrawArgs) {
  const { ctx, px, py, zoom, night = false } = args;
  if (zoom < PROCEDURAL_DETAIL_ZOOM) return;

  const TW = ISO_TILE_W * zoom;
  const TH = ISO_TILE_H * zoom;

  // The 2x2 isometric footprint bounds:
  // Top corner: px + TW/2, py
  // Right corner: px + TW * 1.5, py + TH
  // Bottom corner: px + TW/2, py + TH * 2
  // Left corner: px - TW/2, py + TH
  const topX = px + TW / 2;
  const topY = py;
  const rightX = px + TW * 1.5;
  const rightY = py + TH;
  const botX = px + TW / 2;
  const botY = py + TH * 2;
  const leftX = px - TW / 2;
  const leftY = py + TH;

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
  const bldgHeight = 54 * zoom;
  const wallLeftColor = '#4a7556';
  const wallRightColor = '#3c6347';
  const winColor = night ? '#ffe9a3' : '#e2f0d9';
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
    ctx.fillStyle = winColor;
    
    // Left facade windows
    for (let w = 0; w < 3; w++) {
      const wx = insetLeftX + (insetBotX - insetLeftX) * (0.2 + w * 0.26);
      const wy = insetLeftY + (insetBotY - insetLeftY) * (0.2 + w * 0.26) - (8 + f * 9) * zoom;
      ctx.fillRect(wx, wy, 4 * zoom, 5 * zoom);
    }
    
    // Right facade windows
    for (let w = 0; w < 3; w++) {
      const wx = insetBotX + (insetRightX - insetBotX) * (0.2 + w * 0.26);
      const wy = insetBotY + (insetRightY - insetBotY) * (0.2 + w * 0.26) - (8 + f * 9) * zoom;
      ctx.fillRect(wx, wy, 4 * zoom, 5 * zoom);
    }
  }

  // 4. Rooftop Details (Water Tank / Elevator Shaft)
  ctx.fillStyle = '#68786d';
  const tankX = insetTopX;
  const tankY = insetTopY - bldgHeight - 6 * zoom;
  ctx.fillRect(tankX - 4 * zoom, tankY - 6 * zoom, 8 * zoom, 8 * zoom);
}
