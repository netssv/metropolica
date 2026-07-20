function nearRoad(col, row, radius) {
  for (let dc = -radius; dc <= radius; dc++) {
    for (let dr = -radius; dr <= radius; dr++) {
      const t = tileMap[row+dr]?.[col+dc];
      if (t && (t.type === T.ROAD || t.type === T.BRIDGE)) return true;
    }
  }
  return false;
}

// Deterministic seeded rand (0..1)
function seededRand(seed) {
  let x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }


// ── Camera ──

const cam = { x: 0, y: 0, zoom: 1.0, minZoom: 0.2, maxZoom: 4.0 };


// ── Pedestrians ──

let pedestrians = [];
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
function isRoad(c, r) {
  const tt = tileMap[r]?.[c]?.type;
  return tt === T.ROAD || tt === T.BRIDGE;
}

function drawTile(ctx, tile, wx, wy, ts, t, col, row) {
  switch (tile.type) {
    case T.GRASS: drawGrass(ctx, wx, wy, ts); break;
    case T.WATER: drawWater(ctx, wx, wy, ts, t); break;
    case T.ROAD: drawRoad(ctx, wx, wy, ts, col, row); break;
    case T.BRIDGE: drawBridge(ctx, wx, wy, ts, col, row); break;
    case T.TREE: drawTree(ctx, wx, wy, ts); break;
    case T.PARK: drawPark(ctx, wx, wy, ts); break;
    case T.SAND: drawSand(ctx, wx, wy, ts); break;
    case T.ZONE_R:
    case T.ZONE_C:
    case T.ZONE_I: drawZoneEmpty(ctx, tile.type, wx, wy, ts); break;
    case T.BLDG_R: drawBuildingR(ctx, tile.level || 1, wx, wy, ts); break;
    case T.BLDG_C: drawBuildingC(ctx, tile.level || 1, wx, wy, ts); break;
    case T.BLDG_I: drawBuildingI(ctx, tile.level || 1, wx, wy, ts, t); break;
    case T.POWER: drawPower(ctx, wx, wy, ts); break;
    default:
      ctx.fillStyle = '#222';
      ctx.fillRect(wx, wy, ts, ts);
  }
}
