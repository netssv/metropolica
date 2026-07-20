// ── Map constants ──

const MAP_COLS   = 96;
const MAP_ROWS   = 72;
const TILE_SIZE  = 24;        // world units per tile
const MAP_W      = MAP_COLS * TILE_SIZE;
const MAP_H      = MAP_ROWS  * TILE_SIZE;

// Tile type strings
const T = {
  GRASS:  'grass',
  WATER:  'water',
  ROAD:   'road',
  BRIDGE: 'bridge',
  TREE:   'tree',
  PARK:   'park',
  SAND:   'sand',
  ZONE_R: 'zone-r',
  ZONE_C: 'zone-c',
  ZONE_I: 'zone-i',
  BLDG_R: 'bldg-r',
  BLDG_C: 'bldg-c',
  BLDG_I: 'bldg-i',
  POWER:  'power',
};

const TOOL_COSTS = {
  'zone-r': 100, 'zone-c': 150, 'zone-i': 200,
  road: 50, park: 75, power: 500, demolish: 25,
};

// ── Global state ──

let simState    = {};
let citizensMap = {};
let currentFilter = 'all';
let currentSelectedCitizenId = null;
let activeDashTab  = 'districts';
let dashboardOpen  = false;
let currentTool    = 'cursor';
let localTreasury  = 50000;


// ── Tile map ──

// tileMap[row][col] = { type, owner, level, age }
let tileMap = [];

// ── MAP GENERATION ──


function ownerForCol(c) {
  if (c < Math.floor(MAP_COLS * 0.35)) return 'periferia';
  if (c < Math.floor(MAP_COLS * 0.65)) return 'centro';
  return 'zona_industrial';
}

function isRoadOrBridge(t) {
  return t && (t.type === T.ROAD || t.type === T.BRIDGE);
}

function initTileMap() {
  // 1. Fill with grass
  tileMap = Array.from({ length: MAP_ROWS }, (_, r) =>
    Array.from({ length: MAP_COLS }, (_, c) => ({
      type: T.GRASS, owner: ownerForCol(c), level: 0, age: 0,
    }))
  );

  // 2. Meandering rivers (two streams that merge)
  let r1 = Math.floor(MAP_COLS * 0.40);
  let r2 = Math.floor(MAP_COLS * 0.42);
  for (let row = 0; row < MAP_ROWS; row++) {
    r1 += Math.round(Math.sin(row * 0.3) * 0.7 + (seededRand(row*7+1) - 0.5) * 0.6);
    r1 = clamp(r1, Math.floor(MAP_COLS*0.36), Math.floor(MAP_COLS*0.44));
    r2 = r1 + 2;
    for (let w = r1; w <= r2 + 1; w++) {
      if (w >= 0 && w < MAP_COLS) tileMap[row][w].type = T.WATER;
    }
    // sand banks
    if (r1 - 1 >= 0 && tileMap[row][r1-1].type === T.GRASS && seededRand(row*11) > 0.4)
      tileMap[row][r1-1].type = T.SAND;
    if (r2 + 2 < MAP_COLS && tileMap[row][r2+2].type === T.GRASS && seededRand(row*13) > 0.4)
      tileMap[row][r2+2].type = T.SAND;
  }

  // 3. Road grid
  const hRoads = []; const vRoads = [];
  for (let r = 6; r < MAP_ROWS; r += 9)  { hRoads.push(r); }
  for (let c = 7; c < MAP_COLS; c += 11) { vRoads.push(c); }

  hRoads.forEach(row => {
    for (let c = 0; c < MAP_COLS; c++) {
      const t = tileMap[row][c];
      t.type = (t.type === T.WATER) ? T.BRIDGE : T.ROAD;
    }
  });
  vRoads.forEach(col => {
    for (let r = 0; r < MAP_ROWS; r++) {
      const t = tileMap[r][col];
      if (t.type !== T.ROAD) t.type = (t.type === T.WATER) ? T.BRIDGE : T.ROAD;
    }
  });

  // 4. Forest clusters (left area — Periferia)
  for (let i = 0; i < 80; i++) {
    const cc = Math.floor(seededRand(i*17+1) * Math.floor(MAP_COLS * 0.32));
    const rr = Math.floor(seededRand(i*17+2) * MAP_ROWS);
    if (tileMap[rr]?.[cc]?.type === T.GRASS) {
      tileMap[rr][cc].type = T.TREE;
      [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,-1]].forEach(([dc,dr]) => {
        const nc=cc+dc, nr=rr+dr;
        if (nr>=0 && nr<MAP_ROWS && nc>=0 && nc<MAP_COLS && tileMap[nr][nc].type===T.GRASS && seededRand(i*17+dc*3+dr*7) > 0.45)
          tileMap[nr][nc].type = T.TREE;
      });
    }
  }

  // 5. Zones around roads
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const t = tileMap[row][col];
      if (t.type !== T.GRASS) continue;
      if (!nearRoad(col, row, 2)) continue;
      const s = seededRand(col*1009 + row*503);
      const owner = t.owner;
      if (s < 0.40) {
        if (owner === 'periferia') t.type = T.ZONE_R;
        else if (owner === 'centro') t.type = s < 0.20 ? T.ZONE_R : T.ZONE_C;
        else t.type = s < 0.15 ? T.ZONE_R : T.ZONE_I;
      }
    }
  }

  // 6. Evolve zones → buildings (initial state — city already exists)
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const t = tileMap[row][col];
      const s = seededRand(col*997 + row*499 + 7);
      if (t.type === T.ZONE_R && s > 0.35) {
        t.type = T.BLDG_R; t.level = 1 + Math.floor(seededRand(col+row*2)*3);
      } else if (t.type === T.ZONE_C && s > 0.25) {
        t.type = T.BLDG_C; t.level = 1 + Math.floor(seededRand(col*2+row)*4);
      } else if (t.type === T.ZONE_I && s > 0.45) {
        t.type = T.BLDG_I; t.level = 1 + Math.floor(seededRand(col+row*3)*2);
      }
    }
  }

  // 7. Power lines
  const pwCol = Math.floor(MAP_COLS * 0.66);
  for (let row = 0; row < MAP_ROWS; row++) {
    if (tileMap[row][pwCol]?.type === T.GRASS) tileMap[row][pwCol].type = T.POWER;
  }
}

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


function drawTile(ctx, tile, wx, wy, ts, t) {
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

    case T.ROAD:
      ctx.fillStyle = '#3a3a48';
      ctx.fillRect(wx, wy, ts, ts);
      // sidewalk strips
      ctx.fillStyle = '#4a4a5a';
      ctx.fillRect(wx, wy, ts, 2);
      ctx.fillRect(wx, wy+ts-2, ts, 2);
      // lane dashes
      ctx.fillStyle = '#f1c232';
      const dh = ts*0.1, gap = ts*0.35;
      ctx.fillRect(wx + ts*0.46, wy + ts*0.05, ts*0.08, dh);
      ctx.fillRect(wx + ts*0.46, wy + ts*0.05 + gap, ts*0.08, dh);
      ctx.fillRect(wx + ts*0.46, wy + ts*0.05 + gap*2, ts*0.08, dh);
      break;

    case T.BRIDGE:
      ctx.fillStyle = '#1e4d8c';
      ctx.fillRect(wx, wy, ts, ts);
      ctx.fillStyle = '#5a4a38';
      ctx.fillRect(wx + ts*0.05, wy + ts*0.2, ts*0.9, ts*0.6);
      ctx.fillStyle = '#6b5740';
      ctx.fillRect(wx + ts*0.12, wy + ts*0.28, ts*0.76, ts*0.44);
      // railing dots
      ctx.fillStyle = '#888';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(wx + ts*(0.14 + i*0.22), wy + ts*0.22, ts*0.05, ts*0.1);
        ctx.fillRect(wx + ts*(0.14 + i*0.22), wy + ts*0.68, ts*0.05, ts*0.1);
      }
      break;

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
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wx+1.5, wy+1.5, ts-3, ts-3);
      if (ts >= 16) {
        ctx.fillStyle = '#93c5fd';
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

// ── RENDER LOOP ──


function renderFrame(timestamp) {
  const dt = Math.min((timestamp - lastFrameTs) / 1000, 0.12);
  lastFrameTs = timestamp;
  gameTime += dt;

  updatePedestrians(dt);

  const cw = gameCanvas.width;
  const ch = gameCanvas.height;
  const ts = TILE_SIZE;

  // Clear
  gameCtx.setTransform(1, 0, 0, 1, 0, 0);
  gameCtx.fillStyle = '#070d18';
  gameCtx.fillRect(0, 0, cw, ch);

  // Apply camera transform (world-space drawing)
  gameCtx.setTransform(cam.zoom, 0, 0, cam.zoom, -cam.x * cam.zoom, -cam.y * cam.zoom);

  // Visible tile range (with 1-tile padding)
  const visW  = cw  / cam.zoom;
  const visH  = ch  / cam.zoom;
  const startC = Math.max(0, Math.floor(cam.x / ts) - 1);
  const endC   = Math.min(MAP_COLS - 1, Math.ceil((cam.x + visW) / ts) + 1);
  const startR = Math.max(0, Math.floor(cam.y / ts) - 1);
  const endR   = Math.min(MAP_ROWS - 1, Math.ceil((cam.y + visH) / ts) + 1);
// ── Draw tiles ──

  for (let r = startR; r <= endR; r++) {
    for (let c = startC; c <= endC; c++) {
      const tile = tileMap[r]?.[c];
      if (tile) drawTile(gameCtx, tile, c * ts, r * ts, ts, gameTime);
    }
  }

  // ── Grid lines (only when zoomed in) ──

  if (cam.zoom >= 0.55) {
    gameCtx.strokeStyle = 'rgba(255,255,255,0.04)';
    gameCtx.lineWidth   = 0.5;
    for (let c = startC; c <= endC + 1; c++) {
      gameCtx.beginPath();
      gameCtx.moveTo(c*ts, startR*ts);
      gameCtx.lineTo(c*ts, (endR+1)*ts);
      gameCtx.stroke();
    }
    for (let r = startR; r <= endR + 1; r++) {
      gameCtx.beginPath();
      gameCtx.moveTo(startC*ts, r*ts);
      gameCtx.lineTo((endC+1)*ts, r*ts);
      gameCtx.stroke();
    }
  }

  // ── District boundary lines & labels ──

  drawDistrictOverlay(gameCtx, ts, startR, endR);

  // ── Tool hover highlight ──

  if (hoveredTile && currentTool !== 'cursor') {
    const { col, row } = hoveredTile;
    gameCtx.fillStyle   = 'rgba(255,255,255,0.12)';
    gameCtx.fillRect(col*ts, row*ts, ts, ts);
    gameCtx.strokeStyle = toolColor();
    gameCtx.lineWidth   = 2;
    gameCtx.strokeRect(col*ts + 1, row*ts + 1, ts - 2, ts - 2);
  }

  // ── At-risk district pulse ──

  (simState.districts ?? []).forEach(d => {
    if (!d.social?.atRisk) return;
    const zone = DISTRICT_ZONES.find(z => z.id === d.id);
    if (!zone) return;
    const alpha = 0.06 + 0.04 * Math.sin(gameTime * 3);
    gameCtx.fillStyle = `rgba(239,68,68,${alpha})`;
    gameCtx.fillRect(zone.startCol*ts, 0, (zone.endCol-zone.startCol+1)*ts, MAP_H);
    // crisis banner
    const bx = (zone.startCol + (zone.endCol-zone.startCol)/2) * ts;
    const by = ts * 1.5;
    gameCtx.fillStyle = 'rgba(239,68,68,0.9)';
    gameCtx.fillRect(bx - 52, by - 12, 104, 18);
    gameCtx.fillStyle = '#fff';
    gameCtx.font = 'bold 9px system-ui';
    gameCtx.textAlign = 'center'; gameCtx.textBaseline = 'middle';
    gameCtx.fillText('⚠ CRISIS LOCAL', bx, by - 3);
    gameCtx.textAlign = 'left'; gameCtx.textBaseline = 'alphabetic';
  });

  requestAnimationFrame(renderFrame);
}

  
// ── INPUT HANDLERS ──


function initInputHandlers() {
  const cv = gameCanvas;

  cv.addEventListener('mousedown', e => {
    if (e.button === 0 || e.button === 1 || e.button === 2) {
      isDragging   = true;
      dragMoved    = false;
      dragStart    = { x: e.clientX, y: e.clientY };
      dragCamStart = { x: cam.x, y: cam.y };
      cv.style.cursor = 'grabbing';
    }
  });

  cv.addEventListener('mousemove', e => {
    if (isDragging) {
      const dx = (e.clientX - dragStart.x) / cam.zoom;
      const dy = (e.clientY - dragStart.y) / cam.zoom;
      if (Math.abs(e.clientX - dragStart.x) + Math.abs(e.clientY - dragStart.y) > 3) dragMoved = true;
      cam.x = dragCamStart.x - dx;
      cam.y = dragCamStart.y - dy;
      clampCam();
    }
    const w = screenToWorld(e.clientX, e.clientY);
    const t = worldToTile(w.x, w.y);
    hoveredTile = (t.col >= 0 && t.col < MAP_COLS && t.row >= 0 && t.row < MAP_ROWS) ? t : null;
  });

  cv.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    cv.style.cursor = toolCursor();

    if (!dragMoved) {
      // It was a click, not a pan
      const w = screenToWorld(e.clientX, e.clientY);
      const t = worldToTile(w.x, w.y);
      if (t.col >= 0 && t.col < MAP_COLS && t.row >= 0 && t.row < MAP_ROWS) {
        if (currentTool === 'cursor') {
          inspectTile(t.col, t.row);
        } else {
          placeTile(t.col, t.row);
        }
      }
    }
  });

  cv.addEventListener('mouseleave', () => {
    isDragging  = false;
    hoveredTile = null;
    cv.style.cursor = toolCursor();
  });

  cv.addEventListener('wheel', e => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 0.89);
  }, { passive: false });

  cv.addEventListener('contextmenu', e => e.preventDefault());

  // Keyboard shortcuts
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    switch (e.key) {
      case '1': selectTool('cursor');   break;
      case '2': selectTool('zone-r');   break;
      case '3': selectTool('zone-c');   break;
      case '4': selectTool('zone-i');   break;
      case '5': selectTool('road');     break;
      case '6': selectTool('park');     break;
      case '7': selectTool('power');    break;
      case 'x': case 'X': selectTool('demolish'); break;
      case 'Escape': selectTool('cursor'); closeInspector(); break;
      case '+': case '=': zoomIn();  break;
      case '-': case '_': zoomOut(); break;
      case ' ': e.preventDefault(); toggleDashboard(); break;
    }
  });

  // Touch support (pan + pinch-zoom)
  let lastTouchDist = 0;
  cv.addEventListener('touchstart', e => {
    e.preventDefault();
    if (e.touches.length === 1) {
      isDragging   = true;
      dragMoved    = false;
      dragStart    = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      dragCamStart = { x: cam.x, y: cam.y };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.sqrt(dx*dx + dy*dy);
    }
  }, { passive: false });

  cv.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      const dx = (e.touches[0].clientX - dragStart.x) / cam.zoom;
      const dy = (e.touches[0].clientY - dragStart.y) / cam.zoom;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true;
      cam.x = dragCamStart.x - dx;
      cam.y = dragCamStart.y - dy;
      clampCam();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      if (lastTouchDist > 0) zoomAt(mx, my, dist / lastTouchDist);
      lastTouchDist = dist;
    }
  }, { passive: false });

  cv.addEventListener('touchend', e => {
    isDragging = false;
  }, { passive: false });
}

function toolCursor() {
  if (currentTool === 'cursor')  return 'grab';
  if (currentTool === 'demolish') return 'crosshair';
  return 'cell';
}

// ── TOOL SYSTEM ──


function selectTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`[data-tool="${tool}"]`);
  if (btn) btn.classList.add('active');
  gameCanvas.style.cursor = toolCursor();
}

function placeTile(col, row) {
  const cost = TOOL_COSTS[currentTool] ?? 0;
  if (localTreasury < cost) {
    showToast('⚠️ Fondos insuficientes', 'warning');
    return;
  }
  const tile = tileMap[row][col];
  const prev = tile.type;

  switch (currentTool) {
    case 'zone-r':  tile.type = T.ZONE_R; tile.level = 0; break;
    case 'zone-c':  tile.type = T.ZONE_C; tile.level = 0; break;
    case 'zone-i':  tile.type = T.ZONE_I; tile.level = 0; break;
    case 'road':    tile.type = (tile.type === T.WATER) ? T.BRIDGE : T.ROAD; break;
    case 'park':    tile.type = T.PARK;  break;
    case 'power':   tile.type = T.POWER; break;
    case 'demolish':tile.type = T.GRASS; tile.level = 0; break;
    default: return;
  }

  if (tile.type !== prev) {
    localTreasury -= cost;
    updateTreasuryDisplay();
    showToast(`✓ ${currentTool.replace('-',' ')} — $${cost}`, 'success');

    // Zone growth schedule
    if (currentTool.startsWith('zone')) {
      const gc = col, gr = row;
      setTimeout(() => growZone(gc, gr), 4000 + Math.random() * 6000);
    }
    // Respawn pedestrians if road changed
    if (currentTool === 'road' || currentTool === 'demolish') {
      clearTimeout(pedRespawnTimer);
      pedRespawnTimer = setTimeout(spawnPedestrians, 500);
    }
  }
}

let pedRespawnTimer = null;

function growZone(col, row) {
  const tile = tileMap[row]?.[col];
  if (!tile) return;
  if (tile.type === T.ZONE_R) { tile.type = T.BLDG_R; tile.level = 1; }
  else if (tile.type === T.ZONE_C) { tile.type = T.BLDG_C; tile.level = 1; }
  else if (tile.type === T.ZONE_I) { tile.type = T.BLDG_I; tile.level = 1; }
  else return;

  // Level up over time
  if (tile.level < 4) {
    setTimeout(() => {
      if (tileMap[row]?.[col] === tile && tile.level < 4) tile.level++;
    }, 6000 + Math.random() * 8000);
  }
}


// ── TILE INSPECTOR ──


const TILE_NAMES = {
  [T.GRASS]:'Pasto',[T.WATER]:'Agua',[T.ROAD]:'Calle',[T.BRIDGE]:'Puente',
  [T.TREE]:'Árbol',[T.PARK]:'Parque',[T.SAND]:'Arena',
  [T.ZONE_R]:'Zona Residencial',[T.ZONE_C]:'Zona Comercial',[T.ZONE_I]:'Zona Industrial',
  [T.BLDG_R]:'Edificio Residencial',[T.BLDG_C]:'Edificio Comercial',
  [T.BLDG_I]:'Instalación Industrial',[T.POWER]:'Central Eléctrica',
};

function inspectTile(col, row) {
  const tile = tileMap[row][col];
  const insp = document.getElementById('hud-tile-inspector');
  document.getElementById('inspector-title').textContent = TILE_NAMES[tile.type] || tile.type;

  const d = (simState.districts ?? []).find(d => d.id === tile.owner);
  document.getElementById('inspector-body').innerHTML = `
    <div class="inspector-row"><span>Posición</span><span>${col}, ${row}</span></div>
    <div class="inspector-row"><span>Tipo</span><span>${tile.type}</span></div>
    <div class="inspector-row"><span>Distrito</span><span>${(tile.owner || '—').replace(/_/g,' ')}</span></div>
    ${tile.level > 0 ? `<div class="inspector-row"><span>Nivel</span><span>${tile.level}</span></div>` : ''}
    ${d ? `
      <hr class="inspector-divider">
      <div class="inspector-row"><span>Población</span><span>${d.population.toLocaleString()}</span></div>
      <div class="inspector-row"><span>Aprobación</span><span>${Math.round(d.approval*100)}%</span></div>
      <div class="inspector-row"><span>Crimen</span><span>${Math.round(d.social.crimeRisk*100)}%</span></div>
    ` : ''}
  `;
  document.getElementById('inspector-actions').innerHTML = `
    <button class="insp-action-btn" onclick="selectTool('road');closeInspector()">+ Calle</button>
    <button class="insp-action-btn" onclick="selectTool('park');closeInspector()">+ Parque</button>
    <button class="insp-action-btn insp-danger" onclick="placeTile(${col},${row});closeInspector()">Demoler</button>
  `;
  insp.hidden = false;
}

function closeInspector() {
  const el = document.getElementById('hud-tile-inspector');
  if (el) el.hidden = true;
}

// ── DASHBOARD PANEL ──


function toggleDashboard() {
  dashboardOpen = !dashboardOpen;
  const el = document.getElementById('hud-bottom');
  const ar = document.getElementById('toggle-arrow');
  el.classList.toggle('collapsed', !dashboardOpen);
  if (ar) ar.textContent = dashboardOpen ? '▼' : '▲';
}

function switchDashTab(tab) {
  activeDashTab = tab;
  document.querySelectorAll('.dash-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.dash-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`dtab-content-${tab}`)?.classList.add('active');
  document.getElementById(`dtab-${tab}`)?.classList.add('active');
}

function setFilterTab(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`filter-${f}`)?.classList.add('active');
  renderCitizensList();
}

// ── HUD UPDATE ──


function updateTreasuryDisplay() {
  const el = document.getElementById('city-treasury');
  if (el) el.textContent = `$${localTreasury.toLocaleString()}`;
}

function updateHUD() {
  const el = id => document.getElementById(id);

  el('current-day').textContent = simState.day ?? 0;
  el('city-approval').textContent = `${((simState.approval ?? 0)*100).toFixed(1)}%`;
  el('active-citizens-count').textContent =
    `${simState.activeCitizens ?? 0} / ${simState.totalCitizens ?? 0}`;
  updateTreasuryDisplay();

  const st = simState.result?.status ?? 'running';
  const sb = el('game-status');
  sb.className = 'status-badge ' + st;
  sb.textContent = st === 'won' ? 'Victoria' : st === 'lost' ? 'Derrota' : 'Activa';

  // Sliders
  const tax   = simState.taxRate   ?? 0.15;
  const audit = simState.auditLevel ?? 0.10;
  el('tax-slider').value   = tax;
  el('audit-slider').value = audit;
  el('tax-slider-val').textContent   = `${Math.round(tax*100)}%`;
  el('audit-slider-val').textContent = `${Math.round(audit*100)}%`;

  // Quick stats in toggle button
  const dists = (simState.districts ?? []).length;
  const cits  = simState.totalCitizens ?? 0;
  const orgs  = (simState.organizations ?? []).length;
  const corr  = ((simState.corruptionRisk ?? 0)*100).toFixed(0);
  el('qs-districts').textContent = `${dists} distritos`;
  el('qs-citizens').textContent  = `${cits} ciudadanos`;
  el('qs-orgs').textContent      = `${orgs} orgs`;
  el('qs-corruption').textContent = `Corr: ${corr}%`;

  renderDistricts();
  renderOrganizations();
  renderCorruption();
  renderFootprintLog();
  renderOpinionBreakdown();
  renderTreasuryDetail();
  renderCitizensList();

  if (currentSelectedCitizenId) updateModalData(currentSelectedCitizenId);
}

// ── DISTRICT CARDS ──


function renderDistricts() {
  const grid = document.getElementById('districts-grid');
  grid.innerHTML = '';
  (simState.districts ?? []).forEach(d => {
    const card = document.createElement('div');
    card.className = `district-card ${d.id} ${d.social.atRisk ? 'at-risk' : ''}`;
    const orgs = (simState.organizations ?? []).filter(o => o.territory.includes(d.id));
    const orgPills = orgs.map(o =>
      `<div class="org-pill">⚠️ ${orgLabel(o.type)} (Inf. ${(o.influence*100).toFixed(0)}%)</div>`
    ).join('');
    card.innerHTML = `
      <div class="district-name">${d.id.replace(/_/g,' ')}
        <span class="district-badge ${d.social.atRisk ? 'at-risk-label' : 'safe-label'}">${d.social.atRisk ? 'En Crisis' : 'Estable'}</span>
      </div>
      ${bar('Agua', d.services.water.coverage, 'water')}
      ${bar('Luz',  d.services.electricity.coverage, 'electricity')}
      ${bar('Edu.', d.services.education?.coverage ?? 0, 'education')}
      ${bar('Salud',d.services.healthcare?.coverage ?? 0, 'healthcare')}
      ${bar('Aprobación', d.approval, 'approval')}
      <div class="district-meta">
        <span class="district-pop">👥 ${d.population.toLocaleString()}</span>
        ${orgPills}
      </div>
    `;
    grid.appendChild(card);
  });
}

function bar(label, value, cls) {
  return `
    <div class="progress-bar-group">
      <div class="progress-labels"><span>${label}</span><span>${Math.round(value*100)}%</span></div>
      <div class="progress-container"><div class="progress-value ${cls}" style="width:${value*100}%"></div></div>
    </div>
  `;
}

// ── ORGANIZATIONS ──


function orgLabel(type) {
  return type==='gang'?'Pandilla':type==='cartel'?'Cartel':'Red Contratistas';
}
function orgIcon(type) {
  return type==='gang'?'🔴':type==='cartel'?'💀':'🤝';
}

function renderOrganizations() {
  const orgs = simState.organizations ?? [];
  const cnt  = document.getElementById('orgs-count');
  if (cnt) cnt.textContent = `${orgs.length} activa${orgs.length !== 1 ? 's' : ''}`;
  const container = document.getElementById('orgs-list');
  if (!container) return;
  if (orgs.length === 0) { container.innerHTML = '<div class="empty-state">Sin organizaciones activas.</div>'; return; }
  container.innerHTML = '';
  orgs.forEach(org => {
    const inCrisis = (simState.districts ?? []).some(d => org.territory.includes(d.id) && d.social.atRisk);
    const card = document.createElement('div');
    card.className = `org-card ${inCrisis ? 'crisis' : ''}`;
    card.innerHTML = `
      <div class="org-icon">${orgIcon(org.type)}</div>
      <div class="org-info">
        <div class="org-name">${orgLabel(org.type)}</div>
        <span class="org-type-badge">${org.type.replace(/_/g,' ')}</span>
        <div class="org-territory">📍 ${org.territory.join(', ').replace(/_/g,' ')}</div>
      </div>
      <div class="org-metrics">
        ${inCrisis ? '<span class="org-crisis-tag">EN CRISIS</span>' : ''}
        <div class="org-metric-row"><span class="org-metric-label">Ingresos</span><span class="org-metric-val" style="color:#f87171">$${Math.round(org.income).toLocaleString()}</span></div>
        <div class="org-metric-row"><span class="org-metric-label">Influencia</span><span class="org-metric-val" style="color:#fb923c">${(org.influence*100).toFixed(1)}%</span></div>
        <div class="org-metric-row"><span class="org-metric-label">Reclutamiento</span><span class="org-metric-val">${(org.recruitment*100).toFixed(1)}%</span></div>
        <div class="org-metric-row"><span class="org-metric-label">Violencia</span><span class="org-metric-val">${(org.violence*100).toFixed(0)}%</span></div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ── CORRUPTION ──


function renderCorruption() {
  const risk = simState.corruptionRisk ?? 0;
  const pct  = (risk * 100).toFixed(1);
  const vEl  = document.getElementById('corruption-val');
  const bEl  = document.getElementById('corruption-bar');
  if (vEl) vEl.textContent = `${pct}%`;
  if (bEl) bEl.style.width = `${Math.min(100, risk*100)}%`;
}

// ── FOOTPRINT LOG ──


const EMOTION_ICON = { anger:'😡', fear:'😨', relief:'😮‍💨', indifference:'😐' };
function severityClass(v) { return v>=0.6?'high':v>=0.3?'medium':'low'; }

function renderFootprintLog() {
  const log = simState.footprintLog ?? [];
  const cnt = document.getElementById('footprint-count');
  if (cnt) cnt.textContent = `${log.length} evento${log.length!==1?'s':''}`;
  const container = document.getElementById('footprint-log');
  if (!container) return;
  if (log.length === 0) { container.innerHTML = '<div class="empty-state">Ningún evento registrado.</div>'; return; }
  container.innerHTML = '';
  log.forEach(fp => {
    const item = document.createElement('div');
    item.className = 'footprint-item';
    item.innerHTML = `
      <div class="fp-emotion">${EMOTION_ICON[fp.emotion] ?? '📌'}</div>
      <div class="fp-body">
        <div class="fp-topic">${fp.topic.replace(/_/g,' ')}</div>
        <div class="fp-district">📍 ${fp.affectedDistrict.replace(/_/g,' ')}</div>
        <div class="fp-culprit">Culpable: ${fp.perceivedCulprit}</div>
      </div>
      <div class="fp-severity ${severityClass(fp.severity)}">Sev. ${(fp.severity*100).toFixed(0)}%</div>
    `;
    container.appendChild(item);
  });
}

// ── OPINION BREAKDOWN ──


function fmtDelta(v) { const p = (v*100).toFixed(2); return v>=0?`+${p}%`:`${p}%`; }

function renderOpinionBreakdown() {
  const history = simState.opinionBreakdown ?? [];
  const container = document.getElementById('opinion-breakdown');
  const tickLabel = document.getElementById('opinion-tick-label');
  if (!container) return;
  if (history.length === 0) {
    container.innerHTML = '<div class="empty-state">Sin datos de opinión todavía.</div>';
    if (tickLabel) tickLabel.textContent = '—';
    return;
  }
  const latest = history[0];
  if (tickLabel) tickLabel.textContent = `Día ${latest.day}`;
  const maxAbs = Math.max(
    Math.abs(latest.socialMedia), Math.abs(latest.newspapers),
    Math.abs(latest.wordOfMouth), Math.abs(latest.pressConference), 0.01
  );
  const channels = [
    { key: 'socialMedia',     label: 'Redes Soc.', cls: 'social' },
    { key: 'newspapers',      label: 'Prensa',     cls: 'news' },
    { key: 'wordOfMouth',     label: 'Boca a Boca',cls: 'wom' },
    { key: 'pressConference', label: 'Conf. Prensa',cls:'press' },
  ];
  container.innerHTML = '';
  const block = document.createElement('div');
  block.className = 'opinion-tick';
  block.innerHTML = `<div class="opinion-tick-header"><span>Último tick — Día ${latest.day}</span></div>`;
  const barsDiv = document.createElement('div');
  barsDiv.className = 'ch-bar-group';
  channels.forEach(ch => {
    const val = latest[ch.key] ?? 0;
    const w   = Math.min(100, (Math.abs(val)/maxAbs)*100);
    barsDiv.innerHTML += `
      <div class="ch-bar-row">
        <span class="ch-label">${ch.label}</span>
        <div class="ch-bar-bg"><div class="ch-bar-fill ${val<0?'negative':ch.cls}" style="width:${w}%"></div></div>
        <span class="ch-val ${val>=0?'pos':'neg'}">${fmtDelta(val)}</span>
      </div>`;
  });
  block.appendChild(barsDiv);
  const tot = latest.total ?? 0;
  const tDiv = document.createElement('div');
  tDiv.className = 'opinion-total-row';
  tDiv.innerHTML = `<span>Total Δ aprobación</span><span class="${tot>=0?'ch-val pos':'ch-val neg'}">${fmtDelta(tot)}</span>`;
  block.appendChild(tDiv);
  container.appendChild(block);
  history.slice(1, 5).forEach(tick => {
    const row = document.createElement('div');
    row.className = 'opinion-tick';
    const t = tick.total ?? 0;
    row.innerHTML = `<div class="opinion-tick-header"><span>Día ${tick.day}</span><span class="${t>=0?'ch-val pos':'ch-val neg'}">${fmtDelta(t)}</span></div>`;
    container.appendChild(row);
  });
}

// ── TREASURY DETAIL ──


function renderTreasuryDetail() {
  const treasury = simState.treasury ?? 0;
  const weekly   = simState.weeklyIncome ?? 0;
  const balEl    = document.getElementById('treasury-balance');
  const wiMain   = document.getElementById('weekly-income-main');
  const wiHdr    = document.getElementById('weekly-income-header');
  if (balEl)  balEl.textContent  = `$${Math.round(treasury).toLocaleString()}`;
  if (wiMain) { wiMain.textContent = `+$${Math.round(weekly).toLocaleString()}`; wiMain.style.color = weekly>=0?'var(--green)':'var(--red)'; }
  if (wiHdr)  wiHdr.textContent   = `+$${Math.round(weekly).toLocaleString()} / sem.`;
}

// ── CITIZENS LIST ──


function renderCitizensList() {
  const container = document.getElementById('citizens-list');
  if (!container) return;
  container.innerHTML = '';
  let total = 0;
  Object.entries(citizensMap).forEach(([districtId, list]) => {
    list.forEach(c => {
      total++;
      if (currentFilter === 'level3' && c.level !== 3) return;
      if (currentFilter === 'level2' && c.level !== 2) return;
      const card = document.createElement('div');
      card.className = `citizen-item-card ${c.level===3?'level-3':''}`;
      card.onclick = e => { if (!e.target.closest('.inspect-btn')) openCitizenModal(c.id); };
      card.innerHTML = `
        <div class="citizen-item-info">
          <span class="cit-name">${c.id} (${c.age} años)</span>
          <span class="cit-sub">${c.occupation} • ${districtId.replace(/_/g,' ')}</span>
          ${c.level===3?`<span class="cit-status">${c.activeCause??'activo'}</span>`:''}
          ${c.currentProblem?`<span class="cit-problem">${c.currentProblem}</span>`:''}
        </div>
        <div><button class="inspect-btn" data-id="${c.id}" title="Inspeccionar">🔍</button></div>
      `;
      container.appendChild(card);
    });
  });
  const fa = document.getElementById('filter-all');
  if (fa) fa.textContent = `Todos (${total})`;
  container.querySelectorAll('.inspect-btn').forEach(btn => {
    btn.onclick = e => { e.stopPropagation(); toggleInspect(btn.dataset.id); };
  });
}

// ── CITIZEN MODAL ──


function openCitizenModal(citizenId) {
  currentSelectedCitizenId = citizenId;
  updateModalData(citizenId);
  document.getElementById('profile-modal').classList.add('active');
}
function closeModal() {
  currentSelectedCitizenId = null;
  document.getElementById('profile-modal').classList.remove('active');
}
function findCitizen(id) {
  for (const list of Object.values(citizensMap)) {
    const c = list.find(c => c.id === id);
    if (c) return c;
  }
  return null;
}

function updateModalData(citizenId) {
  const c = findCitizen(citizenId);
  if (!c) return;
  const id = el => document.getElementById(el);
  id('m-citizen-id').textContent          = c.id;
  id('m-occupation-header').textContent   = c.occupation ?? '—';
  id('m-age').textContent                 = c.age;
  id('m-occupation').textContent          = c.occupation ?? '—';
  id('m-education').textContent           = c.education ?? '—';
  id('m-region').textContent              = c.id.split('-')[0].toUpperCase();
  id('m-simulation-level').textContent    = c.level===3?'Nivel 3 (Activo)':'Nivel 2 (Observacional)';
  id('m-simulation-level').style.color    = c.level===3?'var(--blue)':'var(--text-muted)';
  id('m-activation-cause').textContent    = c.activeCause?c.activeCause.toUpperCase():'Ninguna';
  id('m-current-problem').textContent     = c.currentProblem??'Estable en su rutina';
  id('m-current-problem').style.color     = c.currentProblem?'var(--yellow)':'var(--green)';

  const triggerRow = id('m-trigger-row');
  const triggerDet = id('m-trigger-detail');
  if (c.level===3 && c.activeCause) {
    triggerRow.style.display = '';
    if (c.activeCause==='organization') {
      const org = (simState.organizations??[]).find(o=>o.territory.some(t=>c.id.startsWith(t)));
      triggerDet.textContent = org?`${orgLabel(org.type)} en ${org.territory.join(', ')}`:'Org. activa en distrito';
    } else if (c.activeCause==='footprint') {
      const fp = (simState.footprintLog??[])[0];
      triggerDet.textContent = fp?`Evento: ${fp.topic.replace(/_/g,' ')} (${fp.affectedDistrict.replace(/_/g,' ')})`:'Footprint activo';
    } else { triggerDet.textContent = c.activeCause; }
  } else { triggerRow.style.display = 'none'; }

  renderBars('modal-skills-grid',      c.skills??[],      'skill',  ['Técnica','Cognitiva','Social','Resolución']);
  renderBars('modal-aspiration-grid',  c.aspirations??[], 'aspire', ['Económica','Profesional','Comunidad','Movilidad']);
  renderBars('modal-traits-grid',      c.traits??[],      'trait',  ['Riesgo','Sociabilidad','Precio','Confianza','Recreación']);

  id('inspect-action-btn').textContent = c.level===3?'🔴 Detener Inspección':'🔍 Activar Inspección';
}

function renderBars(containerId, array, type, labels) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = '';
  array.forEach((val, idx) => {
    const pct = Math.round(val*100);
    const div = document.createElement('div');
    div.className = 'radar-stat-bar';
    div.innerHTML = `
      <div class="radar-label"><span>${labels[idx]??idx}</span><span>${pct}%</span></div>
      <div class="radar-bar-container"><div class="radar-bar-fill ${type}" style="width:${pct}%"></div></div>
    `;
    grid.appendChild(div);
  });
}

// ── PRESS MODAL ──


function openPressModal()  { document.getElementById('press-modal').classList.add('active'); }
function closePressModal() { document.getElementById('press-modal').classList.remove('active'); }

// ── TOAST ──


function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('visible'));
  setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 2200);
}


// ── API ──


async function fetchState() {
  try {
    const res = await fetch('/api/state');
    const prev = simState.treasury;
    simState = await res.json();
    if (prev === undefined) {
      localTreasury = simState.treasury ?? localTreasury;
    } else if (simState.treasury !== undefined && simState.treasury !== prev) {
      localTreasury += (simState.treasury - prev);
    }
  } catch(e) { console.warn('fetchState:', e); }
}

async function fetchCitizens() {
  try {
    const res  = await fetch('/api/citizens');
    const data = await res.json();
    citizensMap = {};
    data.forEach(c => {
      if (!citizensMap[c.districtId]) citizensMap[c.districtId] = [];
      citizensMap[c.districtId].push(c);
    });
  } catch(e) { console.warn('fetchCitizens:', e); }
}

async function refreshAll() {
  await Promise.all([fetchState(), fetchCitizens()]);
}

async function toggleInspect(citizenId) {
  await fetch('/api/inspect', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ citizenId }),
  });
  await refreshAll();
  updateHUD();
}

async function postCommand(cmd) {
  await fetch('/api/command', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(cmd),
  });
  await refreshAll();
  updateHUD();
}

async function advanceSim(days) {
  showToast(`⏭ Avanzando ${days} día${days>1?'s':''}...`, 'info');
  await fetch('/api/advance', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ days }),
  });
  await refreshAll();
  updateHUD();
}


// ── Game loop ──

let gameCanvas, gameCtx;
let gameTime    = 0;
let lastFrameTs = 0;

// Drag state
let isDragging  = false;
let dragStart   = { x: 0, y: 0 };
let dragCamStart= { x: 0, y: 0 };
let dragMoved   = false;

let hoveredTile = null;

// ── INIT ──


function id(sel) { return document.getElementById(sel); }

function bindEvents() {
  // Advance buttons
  id('btn-adv1').onclick  = () => advanceSim(1);
  id('btn-adv7').onclick  = () => advanceSim(7);
  id('btn-adv30').onclick = () => advanceSim(30);
  id('btn-reset').onclick = () => {
    if (confirm('¿Reiniciar simulación?'))
      fetch('/api/reset', { method:'POST' }).then(refreshAll).then(updateHUD);
  };

  // Sliders
  id('tax-slider').oninput = e => {
    id('tax-slider-val').textContent = `${Math.round(e.target.value*100)}%`;
    postCommand({ type:'CHANGE_TAX_RATE', value: parseFloat(e.target.value) });
  };
  id('audit-slider').oninput = e => {
    id('audit-slider-val').textContent = `${Math.round(e.target.value*100)}%`;
    postCommand({ type:'SET_AUDIT_LEVEL', value: parseFloat(e.target.value) });
  };

  // Invest / press
  id('btn-invest-water').onclick  = () =>
    postCommand({ type:'INVEST_UTILITY', district: id('invest-district').value, utility:'water', amount:300000 });
  id('btn-invest-social').onclick = () =>
    postCommand({ type:'INVEST_SOCIAL_PROGRAM', district: id('invest-district').value, amount:100000 });
  id('btn-press').onclick = () => {
    postCommand({ type:'HOLD_PRESS_CONFERENCE', topic: id('press-topic').value, message: id('press-message').value });
    closePressModal();
    showToast('📢 Conferencia publicada', 'success');
  };

  // Citizen modal
  id('btn-close-modal').onclick    = closeModal;
  id('inspect-action-btn').onclick = () => toggleInspect(currentSelectedCitizenId);

  // Tool buttons
  document.querySelectorAll('.tool-btn[data-tool]').forEach(btn =>
    btn.addEventListener('click', () => selectTool(btn.dataset.tool))
  );
}

async function init() {
  gameCanvas = document.getElementById('city-canvas');
  gameCtx    = gameCanvas.getContext('2d');

  // Load components first
  const dashRes = await fetch('components/dashboard.html');
  document.getElementById('dashboard-container').innerHTML = await dashRes.text();
  const toolRes = await fetch('components/toolbar.html');
  document.getElementById('toolbar-container').innerHTML = await toolRes.text();

  // Resize canvas to window
  function resize() {
    gameCanvas.width  = window.innerWidth;
    gameCanvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Build the world
  initTileMap();

  // Center camera on Centro (middle of map)
  const centroX = MAP_COLS * 0.5 * TILE_SIZE;
  const centroY = MAP_ROWS * 0.5 * TILE_SIZE;
  cam.x = centroX - window.innerWidth  / 2 / cam.zoom;
  cam.y = centroY - window.innerHeight / 2 / cam.zoom;
  clampCam();

  // Wire events
  bindEvents();
  initInputHandlers();

  // Load game data
  await refreshAll();
  updateHUD();

  // Spawn pedestrians
  spawnPedestrians();

  // Start game loop
  lastFrameTs = performance.now();
  requestAnimationFrame(renderFrame);

  // Poll API every 8s
  setInterval(async () => {
    await refreshAll();
    updateHUD();
  }, 8000);

  // Slow zone growth ticker
  setInterval(evolveCityNaturally, 15000);

  showToast('🏙️ Metropolica iniciada — ¡Construye tu ciudad!', 'success');
}

// Naturally grow zones into buildings over time
function evolveCityNaturally() {
  let count = 0;
  for (let r = 0; r < MAP_ROWS && count < 8; r++) {
    for (let c = 0; c < MAP_COLS && count < 8; c++) {
      const t = tileMap[r][c];
      if (t.type === T.ZONE_R && Math.random() > 0.7) { t.type = T.BLDG_R; t.level = 1; count++; }
      else if (t.type === T.ZONE_C && Math.random() > 0.65) { t.type = T.BLDG_C; t.level = 1; count++; }
      else if (t.type === T.ZONE_I && Math.random() > 0.75) { t.type = T.BLDG_I; t.level = 1; count++; }
      else if ((t.type === T.BLDG_R || t.type === T.BLDG_C || t.type === T.BLDG_I) && t.level < 4 && Math.random() > 0.85) {
        t.level++; count++;
      }
    }
  }
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// ═══════════════════════════════════════════════════════════════════
//  METROPOLICA — Full-Screen City Builder Game Engine
// ═══════════════════════════════════════════════════════════════════

// ── CAMERA ──


function screenToWorld(sx, sy) {
  return { x: sx / cam.zoom + cam.x, y: sy / cam.zoom + cam.y };
}
function worldToTile(wx, wy) {
  return { col: Math.floor(wx / TILE_SIZE), row: Math.floor(wy / TILE_SIZE) };
}
function clampCam() {
  const sw = gameCanvas.width  / cam.zoom;
  const sh = gameCanvas.height / cam.zoom;
  cam.x = clamp(cam.x, 0, Math.max(0, MAP_W - sw));
  cam.y = clamp(cam.y, 0, Math.max(0, MAP_H - sh));
}

function zoomAt(sx, sy, factor) {
  const wb = screenToWorld(sx, sy);
  cam.zoom = clamp(cam.zoom * factor, cam.minZoom, cam.maxZoom);
  const wa = screenToWorld(sx, sy);
  cam.x += wb.x - wa.x;
  cam.y += wb.y - wa.y;
  clampCam();
  document.getElementById('zoom-label').textContent = `${Math.round(cam.zoom * 100)}%`;
}
function zoomIn()  { zoomAt(window.innerWidth/2, window.innerHeight/2, 1.2); }
function zoomOut() { zoomAt(window.innerWidth/2, window.innerHeight/2, 0.83); }

// ── PEDESTRIANS ──


function pedColor(owner) {
  if (owner === 'centro')          return '#a5f3fc';
  if (owner === 'zona_industrial') return '#fbbf24';
  return '#86efac'; // periferia
}

function spawnPedestrians() {
  pedestrians = [];
  const roads = [];
  for (let r = 0; r < MAP_ROWS; r++)
    for (let c = 0; c < MAP_COLS; c++) {
      const t = tileMap[r]?.[c];
      if (t && (t.type === T.ROAD || t.type === T.BRIDGE)) roads.push([c, r]);
    }
  if (roads.length === 0) return;

  const count = Math.min(300, Math.floor(roads.length * 0.35));
  for (let i = 0; i < count; i++) {
    const [tc, tr] = roads[Math.floor(Math.random() * roads.length)];
    pedestrians.push({
      x: tc + 0.3 + Math.random() * 0.4,
      y: tr + 0.3 + Math.random() * 0.4,
      dir: Math.floor(Math.random() * 4),
      speed: 0.5 + Math.random() * 0.9,
      stepTimer: Math.random() * 0.6,
      stepDuration: 0.3 + Math.random() * 0.8,
      color: pedColor(ownerForCol(tc)),
    });
  }
}

function updatePedestrians(dt) {
  pedestrians.forEach(p => {
    p.stepTimer += dt;
    if (p.stepTimer >= p.stepDuration) {
      p.stepTimer = 0;
      p.stepDuration = 0.25 + Math.random() * 0.7;

      const col = Math.round(p.x - 0.5);
      const row = Math.round(p.y - 0.5);

      const valid = [];
      DIRS4.forEach(([dx, dy], d) => {
        const nc = col+dx, nr = row+dy;
        if (nc >= 0 && nc < MAP_COLS && nr >= 0 && nr < MAP_ROWS) {
          const tt = tileMap[nr]?.[nc]?.type;
          if (tt === T.ROAD || tt === T.BRIDGE || tt === T.PARK) valid.push(d);
        }
      });

      if (valid.length > 0) {
        const stay = valid.includes(p.dir) && Math.random() > 0.38;
        if (!stay) p.dir = valid[Math.floor(Math.random() * valid.length)];
      } else {
        p.dir = (p.dir + 2) % 4;
      }
    }

    const [dx, dy] = DIRS4[p.dir];
    p.x = clamp(p.x + dx * p.speed * dt, 0, MAP_COLS - 1);
    p.y = clamp(p.y + dy * p.speed * dt, 0, MAP_ROWS - 1);
  });
}


function drawDistrictOverlay(ctx, ts, startR, endR) {
  const boundaries = [
    Math.floor(MAP_COLS * 0.35),
    Math.floor(MAP_COLS * 0.65),
  ];

  // Boundary lines
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([5, 5]);
  boundaries.forEach(bc => {
    ctx.beginPath();
    ctx.moveTo(bc * ts, 0);
    ctx.lineTo(bc * ts, MAP_H);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Zone labels (only once per zone, at top)
  DISTRICT_ZONES.forEach(z => {
    const zw  = (z.endCol - z.startCol + 1) * ts;
    const cx  = (z.startCol + (z.endCol - z.startCol + 1) / 2) * ts;
    const cy  = startR * ts + ts * 0.5;
    const txt = z.label;
    ctx.font  = `bold ${Math.max(9, Math.round(ts * 0.44))}px system-ui`;
    const tw  = ctx.measureText(txt).width + 18;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(cx - tw/2, cy - 12, tw, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, cx, cy - 2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  });
}

const DISTRICT_ZONES = [
  { id: 'periferia',       startCol: 0,                        endCol: Math.floor(MAP_COLS*0.35)-1, label: 'Periferia' },
  { id: 'centro',          startCol: Math.floor(MAP_COLS*0.35),endCol: Math.floor(MAP_COLS*0.65)-1, label: 'Centro' },
  { id: 'zona_industrial', startCol: Math.floor(MAP_COLS*0.65),endCol: MAP_COLS - 1,                label: 'Zona Industrial' },
];

function toolColor() {
  const MAP = {
    'zone-r': '#86efac', 'zone-c': '#93c5fd', 'zone-i': '#fcd34d',
    road: '#d1d5db', park: '#4ade80', power: '#ffd700', demolish: '#f87171',
  };
  return MAP[currentTool] || '#fff';
}


