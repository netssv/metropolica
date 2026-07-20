export function nearRoad(col, row, radius) {
  for (let dc = -radius; dc <= radius; dc++) {
    for (let dr = -radius; dr <= radius; dr++) {
      const t = tileMap[row+dr]?.[col+dc];
      if (t && (t.type === T.ROAD || t.type === T.BRIDGE)) return true;
    }
  }
  return false;
}

// Deterministic seeded rand (0..1)
export function seededRand(seed) {
  let x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}
export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }


// ── Camera ──

const cam = { x: 0, y: 0, zoom: 1.0, minZoom: 0.2, maxZoom: 4.0 };


// ── Pedestrians ──

export let pedestrians = [];
const DIRS4 = [[0,-1],[1,0],[0,1],[-1,0]]; // N E S W

// ── Pedestrians ──

  if (cam.zoom >= 0.35) {
    const pedR = Math.max(1.5, 2.5 / cam.zoom);
    gameCtx.save();
    pedestrians.forEach(p => {
      if (p.x < startC || p.x > endC+1 || p.y < startR || p.y > endR+1) return;
      const px = p.x * ts + ts*0.5;
      const py = p.y * ts + ts*0.5;
      // shadow
      gameCtx.fillStyle = 'rgba(0,0,0,0.3)';
      gameCtx.beginPath(); gameCtx.ellipse(px, py+pedR, pedR*0.9, pedR*0.35, 0, 0, Math.PI*2); gameCtx.fill();
      // body
      gameCtx.fillStyle = p.color;
      gameCtx.beginPath(); gameCtx.arc(px, py, pedR, 0, Math.PI*2); gameCtx.fill();
      // head (only when big enough)
      if (cam.zoom >= 1.0) {
        gameCtx.fillStyle = '#f4c49a';
        gameCtx.beginPath(); gameCtx.arc(px, py - pedR*1.2, pedR*0.6, 0, Math.PI*2); gameCtx.fill();
      }
    });
    gameCtx.restore();
  }

  
// ── TILE RENDERING ──


// Returns true if the tile at (c,r) is a road or bridge
export function isRoad(c, r) {
  const tt = tileMap[r]?.[c]?.type;
  return tt === T.ROAD || tt === T.BRIDGE;
}

export function drawTile(ctx, tile, wx, wy, ts, t, col, row) {
  switch (tile.type) {

    case T.GRASS:
      ctx.fillStyle = '#2d6a2d';
      ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = '#255225';
      ctx.fillRect(wx + ts*0.15, wy + ts*0.2, ts*0.12, ts*0.1);
      ctx.fillRect(wx + ts*0.6,  wy + ts*0.55, ts*0.1,  ts*0.1);
      break;

    case T.WATER: {
      const w = 0.5 + 0.5 * Math.sin(t * 1.8 + wx * 0.04 + wy * 0.03);
      ctx.fillStyle = `hsl(210,70%,${22 + w*5}%)`;
      ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(wx + ts*0.05, wy + ts*(0.3 + 0.1*Math.sin(t*2+wx*0.05)), ts*0.7, ts*0.07);
      break;
    }

    case T.ROAD: {
      // Sample neighbors to determine road orientation
      const rN = isRoad(col, row-1), rS = isRoad(col, row+1);
      const rW = isRoad(col-1, row), rE = isRoad(col+1, row);
      const horiz = rW || rE;
      const vert  = rN || rS;

      ctx.fillStyle = '#3a3a48';
      ctx.fillRect(wx, wy, ts, ts);

      // Sidewalk borders — suppressed on connected sides so roads join cleanly
      ctx.fillStyle = '#56566a';
      if (!rN) ctx.fillRect(wx, wy,        ts, 2);
      if (!rS) ctx.fillRect(wx, wy+ts-2,   ts, 2);
      if (!rW) ctx.fillRect(wx, wy,        2,  ts);
      if (!rE) ctx.fillRect(wx+ts-2, wy,   2,  ts);

      ctx.fillStyle = '#f1c232';
      const dw = ts*0.08, dh = ts*0.1, gap = ts*0.35;

      if (horiz && vert) {
        // Intersection — cross hash
        ctx.fillRect(wx + ts*0.05,  wy + ts*0.46, ts*0.35, dw);
        ctx.fillRect(wx + ts*0.60,  wy + ts*0.46, ts*0.35, dw);
        ctx.fillRect(wx + ts*0.46,  wy + ts*0.05, dw, ts*0.35);
        ctx.fillRect(wx + ts*0.46,  wy + ts*0.60, dw, ts*0.35);
      } else if (horiz) {
        // Horizontal road — dashes along the horizontal centre line
        ctx.fillRect(wx + ts*0.05,  wy + ts*0.46, ts*0.28, dw);
        ctx.fillRect(wx + ts*0.40,  wy + ts*0.46, ts*0.20, dw);
        ctx.fillRect(wx + ts*0.67,  wy + ts*0.46, ts*0.28, dw);
      } else {
        // Vertical road (default) — dashes along the vertical centre line
        ctx.fillRect(wx + ts*0.46, wy + ts*0.05,  dw, ts*0.28);
        ctx.fillRect(wx + ts*0.46, wy + ts*0.40,  dw, ts*0.20);
        ctx.fillRect(wx + ts*0.46, wy + ts*0.67,  dw, ts*0.28);
      }
      break;
    }

    case T.BRIDGE: {
      // Orient bridge based on road neighbors (road goes E-W → horizontal bridge)
      const bridgeH = isRoad(col-1, row) || isRoad(col+1, row);
      ctx.fillStyle = '#1e4d8c';
      ctx.fillRect(wx, wy, ts, ts);
      if (bridgeH) {
        // Horizontal bridge — deck runs left to right
        ctx.fillStyle = '#5a4a38';
        ctx.fillRect(wx + ts*0.0,  wy + ts*0.2, ts, ts*0.6);
        ctx.fillStyle = '#6b5740';
        ctx.fillRect(wx + ts*0.0,  wy + ts*0.28, ts, ts*0.44);
        ctx.fillStyle = '#888';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(wx + ts*(0.14 + i*0.22), wy + ts*0.22, ts*0.05, ts*0.1);
          ctx.fillRect(wx + ts*(0.14 + i*0.22), wy + ts*0.68, ts*0.05, ts*0.1);
        }
      } else {
        // Vertical bridge — deck runs top to bottom
        ctx.fillStyle = '#5a4a38';
        ctx.fillRect(wx + ts*0.2, wy + ts*0.0, ts*0.6, ts);
        ctx.fillStyle = '#6b5740';
        ctx.fillRect(wx + ts*0.28, wy + ts*0.0, ts*0.44, ts);
        ctx.fillStyle = '#888';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(wx + ts*0.22, wy + ts*(0.14 + i*0.22), ts*0.1, ts*0.05);
          ctx.fillRect(wx + ts*0.68, wy + ts*(0.14 + i*0.22), ts*0.1, ts*0.05);
        }
      }
      break;
    }

    case T.TREE:
      ctx.fillStyle = '#1a4d1a';
      ctx.fillRect(wx, wy, ts, ts);
      // trunk
      ctx.fillStyle = '#5c3a1e';
      ctx.fillRect(wx + ts*0.42, wy + ts*0.58, ts*0.16, ts*0.38);
      // canopy layers
      ctx.fillStyle = '#0d3a0d';
      ctx.beginPath(); ctx.arc(wx+ts/2, wy+ts*0.42, ts*0.38, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#145214';
      ctx.beginPath(); ctx.arc(wx+ts*0.38, wy+ts*0.32, ts*0.22, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(wx+ts*0.62, wy+ts*0.35, ts*0.18, 0, Math.PI*2); ctx.fill();
      break;

    case T.PARK:
      ctx.fillStyle = '#1e7a3e';
      ctx.fillRect(wx, wy, ts, ts);
      // path
      ctx.fillStyle = '#c9a96a';
      ctx.fillRect(wx + ts*0.42, wy, ts*0.16, ts);
      ctx.fillRect(wx, wy + ts*0.42, ts, ts*0.16);
      // trees
      ctx.fillStyle = '#0a4a0a';
      ctx.beginPath(); ctx.arc(wx+ts*0.22, wy+ts*0.22, ts*0.14, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(wx+ts*0.78, wy+ts*0.78, ts*0.14, 0, Math.PI*2); ctx.fill();
      // bench
      ctx.fillStyle = '#8b6914';
      ctx.fillRect(wx + ts*0.6, wy + ts*0.25, ts*0.25, ts*0.07);
      break;

    case T.SAND:
      ctx.fillStyle = '#c4a86a';
      ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = '#d4b87a';
      ctx.fillRect(wx+ts*0.1, wy+ts*0.2, ts*0.15, ts*0.1);
      ctx.fillRect(wx+ts*0.55, wy+ts*0.6, ts*0.12, ts*0.08);
      break;

    case T.ZONE_R:
      ctx.fillStyle = '#2d6a2d';
      ctx.fillRect(wx, wy, ts, ts);
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wx+1.5, wy+1.5, ts-3, ts-3);
      if (ts >= 16) {
        ctx.fillStyle = '#86efac';
        ctx.font = `bold ${Math.max(8, ts*0.38)}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('R', wx+ts/2, wy+ts/2);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
      break;

    case T.ZONE_C:
      ctx.fillStyle = '#1a3a6a';
      ctx.fillRect(wx, wy, ts, ts);
      ctx.strokeStyle = '#2aab8c';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wx+1.5, wy+1.5, ts-3, ts-3);
      if (ts >= 16) {
        ctx.fillStyle = '#2aab8c';
        ctx.font = `bold ${Math.max(8, ts*0.38)}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('C', wx+ts/2, wy+ts/2);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
      break;

    case T.ZONE_I:
      ctx.fillStyle = '#5a3a0a';
      ctx.fillRect(wx, wy, ts, ts);
      ctx.strokeStyle = '#fcd34d';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wx+1.5, wy+1.5, ts-3, ts-3);
      if (ts >= 16) {
        ctx.fillStyle = '#fcd34d';
        ctx.font = `bold ${Math.max(8, ts*0.38)}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('I', wx+ts/2, wy+ts/2);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
      break;

    case T.BLDG_R: {
      const lv = tile.level || 1;
      const bh = clamp(ts*(0.28 + lv*0.14), ts*0.28, ts*0.9);
      // base ground
      ctx.fillStyle = '#2d6a2d';
      ctx.fillRect(wx, wy, ts, ts);
      // building body
      ctx.fillStyle = `hsl(${25+lv*5},55%,${32+lv*3}%)`;
      ctx.fillRect(wx+ts*0.1, wy+ts-bh, ts*0.8, bh);
      // roof
      ctx.fillStyle = `hsl(${25+lv*5},40%,${25+lv*2}%)`;
      ctx.fillRect(wx+ts*0.1, wy+ts-bh, ts*0.8, ts*0.08);
      // windows
      if (ts >= 14) {
        ctx.fillStyle = '#ffd580cc';
        const cols = 2, wrows = Math.min(lv+1, 4);
        const ww = ts*0.16, wh = ts*0.12;
        for (let wr = 0; wr < wrows; wr++)
          for (let wc = 0; wc < cols; wc++) {
            const ex = wx + ts*(0.18 + wc*0.42);
            const ey = wy + ts - bh + ts*0.12 + wr*(bh-ts*0.12)/(wrows+0.5);
            ctx.fillRect(ex, ey, ww, wh);
          }
      }
      break;
    }

    case T.BLDG_C: {
      const lv = tile.level || 1;
      const bh = clamp(ts*(0.35 + lv*0.13), ts*0.35, ts*0.96);
      ctx.fillStyle = '#1a3a6a';
      ctx.fillRect(wx, wy, ts, ts);
      // building (glass)
      ctx.fillStyle = `hsl(215,60%,${18+lv*3}%)`;
      ctx.fillRect(wx+ts*0.08, wy+ts-bh, ts*0.84, bh);
      // glass sheen
      ctx.fillStyle = 'rgba(147,197,253,0.25)';
      ctx.fillRect(wx+ts*0.1, wy+ts-bh+2, ts*0.28, bh-2);
      // horizontal floor lines
      if (ts >= 14) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        const floorH = bh/(lv*2+1);
        for (let f = 0; f < lv*2; f++)
          ctx.fillRect(wx+ts*0.1, wy+ts-bh+2+f*floorH, ts*0.8, 1);
      }
      // antenna
      ctx.fillStyle = '#aaa';
      ctx.fillRect(wx+ts*0.47, wy+ts-bh-ts*0.12, ts*0.06, ts*0.12);
      break;
    }

    case T.BLDG_I: {
      const lv = tile.level || 1;
      ctx.fillStyle = '#1a1a22';
      ctx.fillRect(wx, wy, ts, ts);
      // factory body
      ctx.fillStyle = '#2a2a38';
      ctx.fillRect(wx+ts*0.04, wy+ts*0.35, ts*0.92, ts*0.6);
      // chimneys
      const chPos = [0.15, 0.45, 0.72];
      chPos.slice(0, lv).forEach(cx => {
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(wx+ts*cx, wy+ts*0.1, ts*0.12, ts*0.28);
        // smoke puffs (animated)
        if (Math.sin(t*3 + cx*10) > 0) {
          ctx.fillStyle = 'rgba(180,180,180,0.25)';
          ctx.beginPath();
          ctx.arc(wx+ts*(cx+0.06), wy+ts*0.08, ts*0.09, 0, Math.PI*2);
          ctx.fill();
          ctx.arc(wx+ts*(cx+0.09), wy+ts*0.02, ts*0.07, 0, Math.PI*2);
          ctx.fill();
        }
      });
      // warning stripes
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(wx+ts*0.04, wy+ts*0.35, ts*0.92, ts*0.05);
      break;
    }

    case T.POWER:
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(wx, wy, ts, ts);
      // pole
      ctx.fillStyle = '#888';
      ctx.fillRect(wx+ts*0.46, wy, ts*0.08, ts);
      // crossbars
      ctx.fillRect(wx+ts*0.2, wy+ts*0.2, ts*0.6, ts*0.06);
      ctx.fillRect(wx+ts*0.28, wy+ts*0.5, ts*0.44, ts*0.06);
      // insulators
      ctx.fillStyle = '#ffd700';
      [[0.2,0.2],[0.8,0.2],[0.28,0.5],[0.72,0.5]].forEach(([cx,cy]) => {
        ctx.beginPath(); ctx.arc(wx+ts*cx, wy+ts*cy, ts*0.05, 0, Math.PI*2); ctx.fill();
      });
      break;

    default:
      ctx.fillStyle = '#222';
      ctx.fillRect(wx, wy, ts, ts);
  }
}
