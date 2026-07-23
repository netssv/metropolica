import { ISO_TILE_W, ISO_TILE_H } from '../isoMath';
import { T } from '../constants';
import { hasBusinessAccent } from '../businessAccents';

export function drawPixelBuilding(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  zoom: number,
  type: string,
  variant: number,
  density: number
) {
  const hw = ISO_TILE_W * zoom * 0.32;
  const hh = ISO_TILE_H * zoom * 0.32;
  const cx = px + ISO_TILE_W * zoom * 0.5;
  const baseY = py + ISO_TILE_H * zoom;
  const heightClass = density >= 6 ? 4 : density >= 3 ? 3 : density >= 1 ? 2 : 1;
  const height =
    ((type === T.BLDG_I ? 15 : type === T.BLDG_C ? 20 : 16) * zoom * heightClass) / 2 +
    (variant % 3) * 2 * zoom;

  const color = type === T.BLDG_I ? '#b86b2d' : type === T.BLDG_C ? '#278f84' : '#4fa96a';
  const top = { x: cx, y: baseY - hh * 2 };
  const right = { x: cx + hw, y: baseY - hh };
  const left = { x: cx - hw, y: baseY - hh };
  const lift = height;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(left.x, left.y);
  ctx.lineTo(left.x, left.y - lift);
  ctx.lineTo(top.x, top.y - lift);
  ctx.lineTo(top.x, top.y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#276b68';
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(top.x, top.y - lift);
  ctx.lineTo(right.x, right.y - lift);
  ctx.lineTo(right.x, right.y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#d6a84f';
  ctx.beginPath();
  ctx.moveTo(cx, top.y - lift - hh);
  ctx.lineTo(right.x, right.y - lift);
  ctx.lineTo(cx, baseY - lift);
  ctx.lineTo(left.x, left.y - lift);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#b9e1df';
  const windowSize = Math.max(1.5, 3 * zoom);
  if (zoom >= 0.6) {
    for (let y = left.y - lift + 7 * zoom; y < left.y - 3 * zoom; y += 8 * zoom) {
      ctx.fillRect(left.x + 5 * zoom, y, windowSize, windowSize);
    }
    for (let y = top.y - lift + 7 * zoom; y < top.y - 3 * zoom; y += 8 * zoom) {
      ctx.fillRect(top.x + 4 * zoom, y, windowSize, windowSize);
    }
  }
}

export function drawBusinessAccent(
  ctx: CanvasRenderingContext2D,
  type: string,
  col: number,
  row: number,
  px: number,
  py: number,
  zoom: number,
  accentTiles: any[] = []
) {
  if (type !== T.BLDG_C && type !== T.BLDG_I) return;
  if (!hasBusinessAccent(type, col, row, accentTiles)) return;
  const ax = px + ISO_TILE_W * zoom * 0.68;
  const ay = py + 4 * zoom;

  if (type === T.BLDG_I) {
    ctx.fillStyle = '#ef6c3b';
    ctx.fillRect(ax, ay, 5 * zoom, 8 * zoom);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(ax + 1.5 * zoom, ay - 3 * zoom, 2 * zoom, 3 * zoom);
  } else {
    ctx.fillStyle = '#f5d547';
    ctx.fillRect(ax - 2 * zoom, ay, 9 * zoom, 5 * zoom);
    ctx.fillStyle = '#c9a020';
    ctx.fillRect(ax - 2 * zoom, ay, 9 * zoom, 2 * zoom);
  }
}
