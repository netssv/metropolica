import { T } from '../constants';
import { drawRoadTile, drawBridgeTile, drawBuildingTile } from './tileHelpers.ts';

export function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: any,
  wx: number,
  wy: number,
  ts: number,
  t: number,
  col: number,
  row: number
) {
  switch (tile.type) {
    case T.GRASS:
      ctx.fillStyle = '#2d6a2d';
      ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = '#255225';
      ctx.fillRect(wx + ts * 0.15, wy + ts * 0.2, ts * 0.12, ts * 0.1);
      ctx.fillRect(wx + ts * 0.6, wy + ts * 0.55, ts * 0.1, ts * 0.1);
      break;

    case T.WATER: {
      const w = 0.5 + 0.5 * Math.sin(t * 1.8 + wx * 0.04 + wy * 0.03);
      ctx.fillStyle = `hsl(210,70%,${22 + w * 5}%)`;
      ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(
        wx + ts * 0.05,
        wy + ts * (0.3 + 0.1 * Math.sin(t * 2 + wx * 0.05)),
        ts * 0.7,
        ts * 0.07
      );
      break;
    }

    case T.ROAD:
      drawRoadTile(ctx, wx, wy, ts, col, row);
      break;

    case T.BRIDGE:
      drawBridgeTile(ctx, wx, wy, ts, col, row);
      break;

    case T.TREE:
      ctx.fillStyle = '#1a4d1a';
      ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = '#5c3a1e';
      ctx.fillRect(wx + ts * 0.42, wy + ts * 0.58, ts * 0.16, ts * 0.38);
      ctx.fillStyle = '#0d3a0d';
      ctx.beginPath();
      ctx.arc(wx + ts / 2, wy + ts * 0.42, ts * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#145214';
      ctx.beginPath();
      ctx.arc(wx + ts * 0.38, wy + ts * 0.32, ts * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wx + ts * 0.62, wy + ts * 0.35, ts * 0.18, 0, Math.PI * 2);
      ctx.fill();
      break;

    case T.PARK:
      ctx.fillStyle = '#1e7a3e';
      ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = '#c9a96a';
      ctx.fillRect(wx + ts * 0.42, wy, ts * 0.16, ts);
      ctx.fillRect(wx, wy + ts * 0.42, ts, ts * 0.16);
      ctx.fillStyle = '#0a4a0a';
      ctx.beginPath();
      ctx.arc(wx + ts * 0.22, wy + ts * 0.22, ts * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wx + ts * 0.78, wy + ts * 0.78, ts * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8b6914';
      ctx.fillRect(wx + ts * 0.6, wy + ts * 0.25, ts * 0.25, ts * 0.07);
      break;

    case T.SAND:
      ctx.fillStyle = '#c4a86a';
      ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = '#d4b87a';
      ctx.fillRect(wx + ts * 0.1, wy + ts * 0.2, ts * 0.15, ts * 0.1);
      ctx.fillRect(wx + ts * 0.55, wy + ts * 0.6, ts * 0.12, ts * 0.08);
      break;

    case T.ZONE_R:
      ctx.fillStyle = '#2d6a2d';
      ctx.fillRect(wx, wy, ts, ts);
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wx + 1.5, wy + 1.5, ts - 3, ts - 3);
      if (ts >= 16) {
        ctx.fillStyle = '#86efac';
        ctx.font = `bold ${Math.max(8, ts * 0.38)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('R', wx + ts / 2, wy + ts / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
      break;

    case T.ZONE_C:
      ctx.fillStyle = '#1a3a6a';
      ctx.fillRect(wx, wy, ts, ts);
      ctx.strokeStyle = '#2aab8c';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wx + 1.5, wy + 1.5, ts - 3, ts - 3);
      if (ts >= 16) {
        ctx.fillStyle = '#2aab8c';
        ctx.font = `bold ${Math.max(8, ts * 0.38)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('C', wx + ts / 2, wy + ts / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
      break;

    case T.ZONE_I:
      ctx.fillStyle = '#5a3a0a';
      ctx.fillRect(wx, wy, ts, ts);
      ctx.strokeStyle = '#fcd34d';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wx + 1.5, wy + 1.5, ts - 3, ts - 3);
      if (ts >= 16) {
        ctx.fillStyle = '#fcd34d';
        ctx.font = `bold ${Math.max(8, ts * 0.38)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('I', wx + ts / 2, wy + ts / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
      break;

    case T.BLDG_R:
    case T.BLDG_C:
    case T.BLDG_I:
      drawBuildingTile(ctx, tile, wx, wy, ts, t, tile.type);
      break;

    case T.POWER:
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = '#888';
      ctx.fillRect(wx + ts * 0.46, wy, ts * 0.08, ts);
      ctx.fillRect(wx + ts * 0.2, wy + ts * 0.2, ts * 0.6, ts * 0.06);
      ctx.fillRect(wx + ts * 0.28, wy + ts * 0.5, ts * 0.44, ts * 0.06);
      ctx.fillStyle = '#ffd700';
      [
        [0.2, 0.2],
        [0.8, 0.2],
        [0.28, 0.5],
        [0.72, 0.5]
      ].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(wx + ts * cx, wy + ts * cy, ts * 0.05, 0, Math.PI * 2);
        ctx.fill();
      });
      break;

    default:
      ctx.fillStyle = '#222';
      ctx.fillRect(wx, wy, ts, ts);
  }
}
