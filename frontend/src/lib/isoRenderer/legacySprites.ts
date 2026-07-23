import { ISO_TILE_W, ISO_TILE_H } from '../isoMath';
import { SPRITE_COLS, SPRITE_ROWS, SPRITE_POS } from './constants.ts';

let spriteSheet: HTMLCanvasElement | null = null;
const spriteCache = new Map<string, HTMLCanvasElement>();

export function ensureSpritesLoaded() {
  // Kept as a no-op compatibility hook for the map renderer.
}

export function drawCachedSprite(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  zoom: number,
  type: string,
  variant: number
) {
  if (!spriteSheet) return false;
  const position = SPRITE_POS[type]?.[variant];
  if (!position) return false;
  const cacheKey = `${type}:${variant}`;
  let sprite = spriteCache.get(cacheKey);
  const sw = spriteSheet.width / SPRITE_COLS;
  const sh = spriteSheet.height / SPRITE_ROWS;
  if (!sprite) {
    sprite = document.createElement('canvas');
    sprite.width = Math.ceil(sw);
    sprite.height = Math.ceil(sh);
    const spriteCtx = sprite.getContext('2d');
    if (!spriteCtx) return false;
    spriteCtx.drawImage(
      spriteSheet,
      position.sc * sw,
      position.sr * sh,
      sw,
      sh,
      0,
      0,
      sw,
      sh
    );
    spriteCache.set(cacheKey, sprite);
  }
  const drawW = ISO_TILE_W * zoom * 1.4;
  const drawH = ISO_TILE_H * zoom * 3.2;
  const tileBottomX = px + (ISO_TILE_W / 2) * zoom;
  const tileBottomY = py + ISO_TILE_H * zoom;
  ctx.drawImage(sprite, tileBottomX - drawW / 2, tileBottomY - drawH, drawW, drawH);
  return true;
}
