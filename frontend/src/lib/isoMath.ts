/**
 * Isometric coordinate math — adapted from isometric-city (MIT License)
 * https://github.com/amilich/isometric-city (src/components/game/utils.ts)
 *
 * Isometric tile geometry:
 *   TILE_W  = pixel width of one diamond tile
 *   TILE_H  = TILE_W * 0.5  (standard 2:1 isometric ratio)
 *
 * Grid → Screen:
 *   screenX = (col - row) * (TILE_W / 2) + offsetX
 *   screenY = (col + row) * (TILE_H / 2) + offsetY
 *
 * Screen → Grid (inverse):
 *   col = ((sx / (TILE_W/2)) + (sy / (TILE_H/2))) / 2
 *   row = ((sy / (TILE_H/2)) - (sx / (TILE_W/2))) / 2
 */

export const ISO_TILE_W = 64;   // base pixel width of one tile diamond
export const ISO_TILE_H = 32;   // = TILE_W * 0.5

/** Grid (col, row) → canvas pixel position (top-left of bounding box).
 *  Apply zoom then add camera offset outside this function. */
export function gridToIso(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row) * (ISO_TILE_W / 2),
    y: (col + row) * (ISO_TILE_H / 2),
  };
}

/** Canvas pixel (sx, sy) after subtracting camera offset → nearest grid (col, row). */
export function isoToGrid(sx: number, sy: number): { col: number; row: number } {
  const adjX = sx - ISO_TILE_W / 2;
  const adjY = sy - ISO_TILE_H / 2;
  const col = (adjX / (ISO_TILE_W / 2) + adjY / (ISO_TILE_H / 2)) / 2;
  const row = (adjY / (ISO_TILE_H / 2) - adjX / (ISO_TILE_W / 2)) / 2;
  return { col: Math.round(col), row: Math.round(row) };
}
