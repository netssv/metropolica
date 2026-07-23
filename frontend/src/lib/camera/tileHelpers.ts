import { T } from '../constants';
import { clamp } from './utils.ts';

declare let tileMap: any[][];

export function isRoad(c: number, r: number): boolean {
  const tt = tileMap[r]?.[c]?.type;
  return tt === T.ROAD || tt === T.BRIDGE;
}

export function drawRoadTile(
  ctx: CanvasRenderingContext2D,
  wx: number,
  wy: number,
  ts: number,
  col: number,
  row: number
) {
  const rN = isRoad(col, row - 1);
  const rS = isRoad(col, row + 1);
  const rW = isRoad(col - 1, row);
  const rE = isRoad(col + 1, row);
  const horiz = rW || rE;
  const vert = rN || rS;

  ctx.fillStyle = '#3a3a48';
  ctx.fillRect(wx, wy, ts, ts);

  ctx.fillStyle = '#56566a';
  if (!rN) ctx.fillRect(wx, wy, ts, 2);
  if (!rS) ctx.fillRect(wx, wy + ts - 2, ts, 2);
  if (!rW) ctx.fillRect(wx, wy, 2, ts);
  if (!rE) ctx.fillRect(wx + ts - 2, wy, 2, ts);

  ctx.fillStyle = '#f1c232';
  const dw = ts * 0.08;

  if (horiz && vert) {
    ctx.fillRect(wx + ts * 0.05, wy + ts * 0.46, ts * 0.35, dw);
    ctx.fillRect(wx + ts * 0.6, wy + ts * 0.46, ts * 0.35, dw);
    ctx.fillRect(wx + ts * 0.46, wy + ts * 0.05, dw, ts * 0.35);
    ctx.fillRect(wx + ts * 0.46, wy + ts * 0.6, dw, ts * 0.35);
  } else if (horiz) {
    ctx.fillRect(wx + ts * 0.05, wy + ts * 0.46, ts * 0.28, dw);
    ctx.fillRect(wx + ts * 0.4, wy + ts * 0.46, ts * 0.2, dw);
    ctx.fillRect(wx + ts * 0.67, wy + ts * 0.46, ts * 0.28, dw);
  } else {
    ctx.fillRect(wx + ts * 0.46, wy + ts * 0.05, dw, ts * 0.28);
    ctx.fillRect(wx + ts * 0.46, wy + ts * 0.4, dw, ts * 0.2);
    ctx.fillRect(wx + ts * 0.46, wy + ts * 0.67, dw, ts * 0.28);
  }
}

export function drawBridgeTile(
  ctx: CanvasRenderingContext2D,
  wx: number,
  wy: number,
  ts: number,
  col: number,
  row: number
) {
  const bridgeH = isRoad(col - 1, row) || isRoad(col + 1, row);
  ctx.fillStyle = '#1e4d8c';
  ctx.fillRect(wx, wy, ts, ts);
  if (bridgeH) {
    ctx.fillStyle = '#5a4a38';
    ctx.fillRect(wx + ts * 0.0, wy + ts * 0.2, ts, ts * 0.6);
    ctx.fillStyle = '#6b5740';
    ctx.fillRect(wx + ts * 0.0, wy + ts * 0.28, ts, ts * 0.44);
    ctx.fillStyle = '#888';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(wx + ts * (0.14 + i * 0.22), wy + ts * 0.22, ts * 0.05, ts * 0.1);
      ctx.fillRect(wx + ts * (0.14 + i * 0.22), wy + ts * 0.68, ts * 0.05, ts * 0.1);
    }
  } else {
    ctx.fillStyle = '#5a4a38';
    ctx.fillRect(wx + ts * 0.2, wy + ts * 0.0, ts * 0.6, ts);
    ctx.fillStyle = '#6b5740';
    ctx.fillRect(wx + ts * 0.28, wy + ts * 0.0, ts * 0.44, ts);
    ctx.fillStyle = '#888';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(wx + ts * 0.22, wy + ts * (0.14 + i * 0.22), ts * 0.1, ts * 0.05);
      ctx.fillRect(wx + ts * 0.68, wy + ts * (0.14 + i * 0.22), ts * 0.1, ts * 0.05);
    }
  }
}

export function drawBuildingTile(
  ctx: CanvasRenderingContext2D,
  tile: any,
  wx: number,
  wy: number,
  ts: number,
  t: number,
  type: string
) {
  const lv = tile.level || 1;
  if (type === T.BLDG_R) {
    const bh = clamp(ts * (0.28 + lv * 0.14), ts * 0.28, ts * 0.9);
    ctx.fillStyle = '#2d6a2d';
    ctx.fillRect(wx, wy, ts, ts);
    ctx.fillStyle = `hsl(${25 + lv * 5},55%,${32 + lv * 3}%)`;
    ctx.fillRect(wx + ts * 0.1, wy + ts - bh, ts * 0.8, bh);
    ctx.fillStyle = `hsl(${25 + lv * 5},40%,${25 + lv * 2}%)`;
    ctx.fillRect(wx + ts * 0.1, wy + ts - bh, ts * 0.8, ts * 0.08);
    if (ts >= 14) {
      ctx.fillStyle = '#ffd580cc';
      const cols = 2;
      const wrows = Math.min(lv + 1, 4);
      const ww = ts * 0.16;
      const wh = ts * 0.12;
      for (let wr = 0; wr < wrows; wr++) {
        for (let wc = 0; wc < cols; wc++) {
          const ex = wx + ts * (0.18 + wc * 0.42);
          const ey =
            wy + ts - bh + ts * 0.12 + (wr * (bh - ts * 0.12)) / (wrows + 0.5);
          ctx.fillRect(ex, ey, ww, wh);
        }
      }
    }
  } else if (type === T.BLDG_C) {
    const bh = clamp(ts * (0.35 + lv * 0.13), ts * 0.35, ts * 0.96);
    ctx.fillStyle = '#1a3a6a';
    ctx.fillRect(wx, wy, ts, ts);
    ctx.fillStyle = `hsl(215,60%,${18 + lv * 3}%)`;
    ctx.fillRect(wx + ts * 0.08, wy + ts - bh, ts * 0.84, bh);
    ctx.fillStyle = 'rgba(147,197,253,0.25)';
    ctx.fillRect(wx + ts * 0.1, wy + ts - bh + 2, ts * 0.28, bh - 2);
    if (ts >= 14) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      const floorH = bh / (lv * 2 + 1);
      for (let f = 0; f < lv * 2; f++) {
        ctx.fillRect(wx + ts * 0.1, wy + ts - bh + 2 + f * floorH, ts * 0.8, 1);
      }
    }
    ctx.fillStyle = '#aaa';
    ctx.fillRect(wx + ts * 0.47, wy + ts - bh - ts * 0.12, ts * 0.06, ts * 0.12);
  } else if (type === T.BLDG_I) {
    ctx.fillStyle = '#1a1a22';
    ctx.fillRect(wx, wy, ts, ts);
    ctx.fillStyle = '#2a2a38';
    ctx.fillRect(wx + ts * 0.04, wy + ts * 0.35, ts * 0.92, ts * 0.6);
    const chPos = [0.15, 0.45, 0.72];
    chPos.slice(0, lv).forEach((cx) => {
      ctx.fillStyle = '#3a3a4a';
      ctx.fillRect(wx + ts * cx, wy + ts * 0.1, ts * 0.12, ts * 0.28);
      if (Math.sin(t * 3 + cx * 10) > 0) {
        ctx.fillStyle = 'rgba(180,180,180,0.25)';
        ctx.beginPath();
        ctx.arc(wx + ts * (cx + 0.06), wy + ts * 0.08, ts * 0.09, 0, Math.PI * 2);
        ctx.fill();
        ctx.arc(wx + ts * (cx + 0.09), wy + ts * 0.02, ts * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(wx + ts * 0.04, wy + ts * 0.35, ts * 0.92, ts * 0.05);
  }
}
