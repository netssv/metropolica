import { T } from '../constants';

export const SPRITE_COLS = 5;
export const SPRITE_ROWS = 6;

export const TERRAIN_COLOR: Record<string, string> = {
  [T.GRASS]: '#2d6a4f',
  [T.ROAD]: '#b8b4a8',
  [T.SAND]: '#d4c8a0',
  [T.BRIDGE]: '#888',
  [T.TREE]: '#1e5631',
};

export const SPRITE_POS: Record<string, Array<{ sc: number; sr: number }>> = {
  // Empty zones (T.ZONE_*) are NOT mapped here so they render as colored diamond terrain.
};
