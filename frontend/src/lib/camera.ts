import { nearRoad, seededRand, clamp } from './camera/utils.ts';
import { pedestrians, DIRS4, drawPedestrians } from './camera/pedestrians.ts';
import { drawTile, isRoad } from './camera/tiles.ts';

export {
  nearRoad,
  seededRand,
  clamp,
  pedestrians,
  DIRS4,
  drawPedestrians,
  drawTile,
  isRoad
};

export const cam = { x: 0, y: 0, zoom: 1.0, minZoom: 0.2, maxZoom: 4.0 };
